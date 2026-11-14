import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { areas, getArea, pubsInArea, ROUNDUPS, pubsWith, MIN_COMBO, monthYear, lastChecked } from '@/lib/data';
import { meta, areaTitle, areaDescription } from '@/lib/seo';
import { itemListSchema } from '@/lib/schema';
import { AreaMap, Breadcrumbs, JsonLd, LinkPills, PageHeader, PubGrid, SectionHeading } from '@/components/ui';
import { CityMap } from '@/components/CityMap';

export const dynamicParams = false;
export function generateStaticParams() {
  return areas.map((a) => ({ area: a.slug }));
}

type Props = { params: Promise<{ area: string }> };

export async function generateMetadata({ params }: Props) {
  const a = getArea((await params).area);
  if (!a) return {};
  const list = pubsInArea(a.slug);
  return meta(`/areas/${a.slug}`, areaTitle(a, list.length), areaDescription(a, list.length, list));
}

export default async function AreaPage({ params }: Props) {
  const a = getArea((await params).area);
  if (!a) notFound();
  const list = pubsInArea(a.slug);
  const featureLinks = ROUNDUPS.map((r) => ({ r, n: pubsWith(r.key, a.slug).length }))
    .filter((x) => x.n >= MIN_COMBO)
    .map(({ r, n }) => ({ href: `/best/${r.slug}/${a.slug}`, text: `${r.label} in ${a.name}`, count: n }));
  const confirmed = list.filter((p) => Object.values(p.features).some((f) => f.value === 'yes')).length;
  const others = areas.filter((x) => x.slug !== a.slug);
  const path = `/areas/${a.slug}`;

  return (
    <>
      <JsonLd data={itemListSchema(`Pubs in ${a.name}`, path, list.map((p) => ({ name: p.name, path: `/pubs/${p.slug}` })))} />
      <Breadcrumbs crumbs={[{ name: 'Home', path: '/' }, { name: 'Areas', path: '/areas' }, { name: a.name, path }]} />
      <PageHeader
        kicker="Brighton & Hove"
        title={`Pubs in ${a.name}`}
        icon={MapPin}
        art={<CityMap id="area-map" eager highlightArea={a.slug} className="h-[115%] max-w-none shrink-0" />}
        stats={[
          { value: list.length, label: list.length === 1 ? 'pub' : 'pubs & bars' },
          { value: confirmed, label: 'with confirmed facilities' },
          { value: featureLinks.length, label: featureLinks.length === 1 ? 'feature guide' : 'feature guides' },
        ]}
        intro={
          <p>
            Every pub and bar in {a.name} in this guide, ranked by Google rating weighted by number of reviews. Details last checked{' '}
            {monthYear(lastChecked)}.
          </p>
        }
      />

      {featureLinks.length > 0 && (
        <section aria-labelledby="area-features" className="mb-12">
          <SectionHeading id="area-features" eyebrow="Feature guides">
            Popular in {a.name}
          </SectionHeading>
          <LinkPills label={`Feature guides for ${a.name}`} links={featureLinks} />
        </section>
      )}

      <section aria-labelledby="area-pubs" className="mb-14">
        <SectionHeading id="area-pubs" eyebrow="Ranked by Google rating">
          All {list.length} pubs in {a.name}
        </SectionHeading>
        <PubGrid pubs={list} ranked />
      </section>

      <section aria-labelledby="area-map" className="mb-14">
        <SectionHeading id="area-map" eyebrow="Find your way">
          Map of {a.name}
        </SectionHeading>
        <AreaMap points={list} title={`Map of ${a.name.startsWith('The ') ? a.name : `the ${a.name} area`}, Brighton & Hove`} />
      </section>

      <section aria-labelledby="other-areas">
        <SectionHeading id="other-areas" eyebrow="Keep exploring">
          Other areas
        </SectionHeading>
        <LinkPills label="Other areas" links={others.map((o) => ({ href: `/areas/${o.slug}`, text: o.name, count: pubsInArea(o.slug).length }))} />
      </section>
    </>
  );
}
