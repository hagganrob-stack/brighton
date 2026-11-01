import { type Pub, FEATURE_LABELS, FEATURE_ORDER, addressLines, areaName } from './data';
import { DAYS, DAY_SCHEMA, parseRanges } from './hours';
import { abs, SITE_NAME } from './seo';

export type Crumb = { name: string; path: string };

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
  };
}

export function itemListSchema(name: string, path: string, items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: abs(path),
    numberOfItems: items.length,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: abs(it.path) })),
  };
}

export function websiteSchema() {
  return { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: abs('/'), inLanguage: 'en-GB' };
}

function openingHoursSpecification(p: Pub) {
  if (!p.openingHours) return undefined;
  const specs: object[] = [];
  for (const d of DAYS) {
    const ranges = parseRanges(p.openingHours[d]);
    if (ranges == null) continue; // unparseable: omit rather than guess
    if (ranges.length === 0) specs.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: DAY_SCHEMA[d], opens: '00:00', closes: '00:00' });
    for (const r of ranges) specs.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: DAY_SCHEMA[d], opens: r.opens, closes: r.closes });
  }
  return specs.length ? specs : undefined;
}

// Note: no aggregateRating. The ratings are Google's, and review markup must describe
// reviews collected by this site, so we show them as text only.
export function pubSchema(p: Pub) {
  const { street, town, postcode } = addressLines(p);
  const amenities = FEATURE_ORDER.filter((k) => p.features[k]?.value !== 'unknown').map((k) => ({
    '@type': 'LocationFeatureSpecification',
    name: FEATURE_LABELS[k],
    value: p.features[k].value === 'yes',
  }));
  const path = `/pubs/${p.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BarOrPub',
    '@id': `${abs(path)}#pub`,
    name: p.name,
    url: abs(path),
    description: p.description.split('\n\n')[0],
    address: {
      '@type': 'PostalAddress',
      streetAddress: street,
      addressLocality: town,
      addressRegion: 'East Sussex',
      postalCode: postcode,
      addressCountry: 'GB',
    },
    geo: { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lng },
    containedInPlace: { '@type': 'Place', name: `${areaName(p.area)}, Brighton & Hove` },
    telephone: p.phone || undefined,
    sameAs: p.website ? [p.website.split('?')[0]] : undefined,
    hasMap: p.googleMapsUrl,
    openingHoursSpecification: openingHoursSpecification(p),
    servesCuisine: p.features.food?.value === 'yes' ? 'Pub food' : undefined,
    amenityFeature: amenities.length ? amenities : undefined,
  };
}
