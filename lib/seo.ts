import type { Metadata } from 'next';
import {
  type Pub,
  type Area,
  type Roundup,
  areaName,
  yesFeatures,
  FEATURE_LABELS,
  override,
  addressLines,
  monthYear,
  lastChecked,
} from './data';

export const SITE_NAME = 'Brighton & Hove Pub Guide';
const BRAND_SUFFIX = ' | Brighton Pub Guide';
const TITLE_MAX = 60;

// Canonical origin: explicit env var, else Vercel's production domain, else localhost for dev.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')
).replace(/\/$/, '');

export const abs = (path: string) => `${SITE_URL}${path === '/' ? '' : path}` || SITE_URL;

function clamp(s: string, max: number) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:–-]\s*$/, '') + '…';
}

function lowerList(items: string[]) {
  const l = items.map((x, i) => (i === 0 ? x : x.toLowerCase().replace(/^sunday/, 'Sunday')));
  return l.length <= 1 ? l.join('') : `${l.slice(0, -1).join(', ')} & ${l.at(-1)}`;
}

export function meta(path: string, title: string, description: string, extra: Metadata = {}): Metadata {
  const o = override(path);
  const t = o.title || title;
  const d = clamp(o.description || description, 158);
  // Add the brand only when the whole title still fits in ~60 characters.
  const full = t.length + BRAND_SUFFIX.length <= TITLE_MAX ? t + BRAND_SUFFIX : t;
  return {
    title: { absolute: full },
    description: d,
    alternates: { canonical: path },
    openGraph: { title: t, description: d, url: path, siteName: SITE_NAME, locale: 'en_GB', type: 'website' },
    twitter: { card: 'summary', title: t, description: d },
    ...extra,
  };
}

// ---- Templates -------------------------------------------------------------------
export function pubTitle(p: Pub) {
  if (p.customTitle) return p.customTitle;
  const a = areaName(p.area);
  const options = [`${p.name}, ${a}: Hours, Food & Facilities`, `${p.name}, ${a}: Hours & Facilities`, `${p.name}, ${a}: Opening Hours`, `${p.name}, ${a}`, `${p.name}, Brighton`, p.name];
  return options.find((o) => o.length <= TITLE_MAX) ?? p.name;
}

export function pubDescription(p: Pub) {
  if (p.customDescription) return p.customDescription;
  const { street } = addressLines(p);
  const feats = yesFeatures(p).filter((k) => k !== 'food' || !yesFeatures(p).includes('sundayRoast')).slice(0, 3);
  const parts = [`${p.name}, ${street.replace(/^\d+[a-z]?(\s*[-–]\s*\d+[a-z]?)?\s+/i, '')}, ${areaName(p.area)}.`];
  if (p.rating != null) parts.push(`Rated ${p.rating.toFixed(1)} on Google (${(p.reviewCount ?? 0).toLocaleString('en-GB')} reviews).`);
  if (feats.length) parts.push(`${lowerList(feats.map((k) => FEATURE_LABELS[k]))}.`);
  for (const tail of ['Opening hours, map & nearby pubs.', 'Opening hours & map.', 'Hours & map.']) {
    const text = [...parts, tail].join(' ');
    if (text.length <= 158) return text;
  }
  return parts.join(' ');
}

export function areaTitle(a: Area, count: number) {
  return `Pubs in ${a.name}, ${a.slug === 'hove' || a.slug === 'brunswick' ? 'Hove' : 'Brighton'}: ${count} Pubs & Bars`;
}
// Fill a template with as many top pub names as fit in a meta description.
// Tries each template with 3, 2, then 1 names, so nothing is cut mid-sentence.
function withNames(builds: ((names: string) => string)[], top: Pub[], max = 158) {
  for (const build of builds)
    for (let n = Math.min(3, top.length); n >= 1; n--) {
      const names = top.slice(0, n).map((p) => p.name);
      const text = build(names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]);
      if (text.length <= max) return text;
    }
  return builds.at(-1)!(top[0]?.name ?? '');
}

export function areaDescription(a: Area, count: number, top: Pub[]) {
  return withNames(
    [
      (names) => `All ${count} pubs and bars in ${a.name}, Brighton & Hove, including ${names}. Hours, facilities and map, checked ${monthYear(lastChecked)}.`,
      (names) => `All ${count} pubs and bars in ${a.name}, Brighton & Hove, including ${names}. Hours, facilities and map.`,
    ],
    top,
  );
}

export function roundupTitle(r: Roundup, count: number, area?: Area) {
  return `${r.heading} in ${area ? area.name : 'Brighton & Hove'} (${count})`;
}
export function roundupDescription(r: Roundup, count: number, top: Pub[], area?: Area) {
  const where = area ? area.name : 'Brighton & Hove';
  return withNames(
    [
      (names) => `${count} ${r.phrase} in ${where}, confirmed on their own websites, including ${names}. Ranked by Google rating, checked ${monthYear(lastChecked)}.`,
      (names) => `${count} ${r.phrase} in ${where}, confirmed on their own websites, including ${names}. Ranked by Google rating.`,
      (names) => `${count} ${r.phrase} in ${where}, including ${names}. Ranked by Google rating.`,
    ],
    top,
  );
}
