// Build-time data access. Only imported from server components, so pubs.json never ships to the browser.
import pubsJson from '@/data/pubs.json';
import areasJson from '@/data/areas.json';
import overridesJson from '@/data/overrides.json';

export type FeatureValue = 'yes' | 'no' | 'unknown';
export type FeatureKey =
  | 'beerGarden'
  | 'dogFriendly'
  | 'liveMusic'
  | 'pubQuiz'
  | 'sundayRoast'
  | 'food'
  | 'liveSport'
  | 'realAle'
  | 'stepFree';

export interface Feature {
  value: FeatureValue;
  days?: string[];
  evidence: { url?: string; quote?: string; conflict?: boolean } | null;
}

export interface Pub {
  slug: string;
  placeId: string;
  name: string;
  googleType: string | null;
  area: string;
  address: string | null;
  street: string;
  postcode: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  openingHours: Record<string, string> | null;
  rating: number | null;
  reviewCount: number | null;
  googleMapsUrl: string;
  features: Record<FeatureKey, Feature>;
  featuresSource: string;
  detailsCheckedAt: string;
  nearby: { slug: string; distanceM: number }[];
  description: string;
  customTitle?: string;
  customDescription?: string;
}

export interface Area {
  slug: string;
  name: string;
  lat: number;
  lng: number;
}

export interface PageOverride {
  title?: string;
  description?: string;
}

export const pubs = (pubsJson as unknown as Pub[]).slice().sort((a, b) => a.name.localeCompare(b.name));
export const areas = (areasJson as Area[]).filter((a) => pubs.some((p) => p.area === a.slug));
const overrides = overridesJson as Record<string, PageOverride>;

export function override(path: string): PageOverride {
  return overrides[path] || {};
}

// Features that get their own /best/[feature] roundup page.
export const ROUNDUPS = [
  { slug: 'sunday-roasts', phrase: 'pubs serving Sunday roasts', heading: 'Best pubs for a Sunday roast', key: 'sundayRoast', label: 'Sunday roasts', short: 'Sunday roast', blurb: 'pubs whose own websites say they serve a Sunday roast' },
  { slug: 'pub-quizzes', phrase: 'pubs with a regular quiz', heading: 'Best pub quizzes', key: 'pubQuiz', label: 'Pub quizzes', short: 'Pub quiz', blurb: 'pubs whose own websites mention a regular quiz' },
  { slug: 'beer-gardens', phrase: 'pubs with beer gardens', heading: 'Best beer gardens', key: 'beerGarden', label: 'Beer gardens', short: 'Beer garden', blurb: 'pubs whose own websites mention a beer garden, courtyard or terrace' },
  { slug: 'dog-friendly', phrase: 'dog-friendly pubs', heading: 'Best dog-friendly pubs', key: 'dogFriendly', label: 'Dog-friendly pubs', short: 'Dog friendly', blurb: 'pubs whose own websites say dogs are welcome' },
  { slug: 'live-music', phrase: 'pubs with live music', heading: 'Best pubs for live music', key: 'liveMusic', label: 'Live music', short: 'Live music', blurb: 'pubs whose own websites advertise live music or open mic nights' },
  { slug: 'live-sport', phrase: 'pubs showing live sport', heading: 'Best pubs for live sport', key: 'liveSport', label: 'Live sport', short: 'Live sport', blurb: 'pubs whose own websites say they show live sport' },
] as const satisfies readonly { slug: string; phrase: string; heading: string; key: FeatureKey; label: string; short: string; blurb: string }[];
export type Roundup = (typeof ROUNDUPS)[number];

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  beerGarden: 'Beer garden',
  dogFriendly: 'Dog friendly',
  liveMusic: 'Live music',
  pubQuiz: 'Pub quiz',
  sundayRoast: 'Sunday roast',
  food: 'Food served',
  liveSport: 'Live sport',
  realAle: 'Real ale',
  stepFree: 'Step-free access',
};
export const FEATURE_ORDER = Object.keys(FEATURE_LABELS) as FeatureKey[];

export const MIN_COMBO = 3;

export function getPub(slug: string) {
  return pubs.find((p) => p.slug === slug);
}
export function getArea(slug: string) {
  return areas.find((a) => a.slug === slug);
}
export function getRoundup(slug: string) {
  return ROUNDUPS.find((r) => r.slug === slug);
}
export function areaName(slug: string) {
  return getArea(slug)?.name ?? slug;
}
export function pubsInArea(area: string) {
  return rank(pubs.filter((p) => p.area === area));
}
export function pubsWith(key: FeatureKey, area?: string) {
  return rank(pubs.filter((p) => p.features[key]?.value === 'yes' && (!area || p.area === area)));
}

// Area + feature combinations with enough pubs to deserve a page.
export function combos() {
  const out: { roundup: Roundup; area: Area; count: number }[] = [];
  for (const roundup of ROUNDUPS)
    for (const area of areas) {
      const count = pubsWith(roundup.key, area.slug).length;
      if (count >= MIN_COMBO) out.push({ roundup, area, count });
    }
  return out;
}
export function hasCombo(roundupSlug: string, areaSlug: string) {
  return combos().some((c) => c.roundup.slug === roundupSlug && c.area.slug === areaSlug);
}

// Weighted rating so a 5.0 from 6 reviews doesn't outrank a 4.6 from 900.
const PRIOR_REVIEWS = 50;
const meanRating = pubs.reduce((s, p) => s + (p.rating ?? 0), 0) / pubs.filter((p) => p.rating != null).length;
export function score(p: Pub) {
  if (p.rating == null) return 0;
  const v = p.reviewCount ?? 0;
  return (v / (v + PRIOR_REVIEWS)) * p.rating + (PRIOR_REVIEWS / (v + PRIOR_REVIEWS)) * meanRating;
}
export function rank(list: Pub[]) {
  return list.slice().sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name));
}

export function nearbyPubs(p: Pub, n = 5) {
  return p.nearby.slice(0, n).map((x) => ({ pub: getPub(x.slug)!, distanceM: x.distanceM })).filter((x) => x.pub);
}

export function yesFeatures(p: Pub): FeatureKey[] {
  return FEATURE_ORDER.filter((k) => p.features[k]?.value === 'yes');
}

// Street line is extracted by scripts/lib/address.mjs; town is inferred from the address and postcode.
export function addressLines(p: Pub) {
  const parts = (p.address || '').split(',').map((s) => s.trim()).filter(Boolean);
  const street = p.street || parts[0] || '';
  const town = /\bhove\b/i.test(parts.slice(1).join(' ')) && p.postcode?.startsWith('BN3') ? 'Hove' : 'Brighton';
  return { street, town, postcode: p.postcode || '' };
}

export function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

export function monthYear(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Europe/London' });
}

export const lastChecked = pubs.map((p) => p.detailsCheckedAt).sort().at(-1)!;
