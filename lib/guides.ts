// Keyword-targeted guide pages (Tier A of the keyword plan). Every sentence that states a fact about a pub is
// assembled from data/pubs.json: names, addresses, ratings, opening hours, distances and the facilities each
// pub's own website confirms. Nothing here is invented, and no review text is used.
import {
  pubs,
  areas,
  rank,
  score,
  areaName,
  pubsInArea,
  addressLines,
  yesFeatures,
  formatDistance,
  FEATURE_LABELS,
  streetName,
  type Pub,
  type FeatureKey,
  ROUNDUPS,
  ROUNDUP_GUIDE,
  pubsWith,
} from './data';
import { DAYS, parseRanges } from './hours';

export type Faq = { q: string; a: string };
export type Group = { id: string; heading: string; intro?: string; pubs: Pub[]; compact?: boolean };
export type Guide = {
  slug: string;
  keyword: string;
  secondary: string[];
  title: string;
  h1: string;
  description: string;
  kicker: string;
  image?: string;
  /** All pubs that qualify, best first. */
  list: Pub[];
  /** H2 sections; each pub gets an H3 entry (or a compact row when the group is compact). */
  groups: Group[];
  quickPicks: { pub: Pub; why: string }[];
  /** Extra, guide-specific line for a pub's entry (e.g. quiz night, distance from the station). */
  focus?: (p: Pub) => string | null;
  intro: string[];
  howWeChose: string;
  faqs: Faq[];
  related: string[];
  /** Optional safety note shown above the list (e.g. drink responsibly). */
  note?: string;
  /** Features not repeated in entries because the whole page is about them. */
  skip?: FeatureKey[];
};

// ---- Helpers -----------------------------------------------------------------------------------
const R = 6371000;
export function metres(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
const walkMins = (m: number) => Math.max(1, Math.round(m / 80));
const has = (p: Pub, k: FeatureKey) => p.features[k]?.value === 'yes';
const names = (list: Pub[], n = 3) => listJoin(list.slice(0, n).map((p) => p.name));
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
export function listJoin(items: string[], conj = 'and') {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${conj} ${items[items.length - 1]}`;
}
/** Doc formula for featured picks: rating x log(review count). */
const weight = (p: Pub) => (p.rating ?? 0) * Math.log((p.reviewCount ?? 0) + 1);

const NOUN: Record<FeatureKey, string> = {
  beerGarden: 'a beer garden or outdoor space',
  dogFriendly: 'dogs being welcome',
  liveMusic: 'live music',
  pubQuiz: 'a pub quiz',
  sundayRoast: 'Sunday roasts',
  food: 'food',
  liveSport: 'live sport',
  realAle: 'real ale',
  stepFree: 'step-free access',
  veganOptions: 'vegan options',
  craftBeer: 'craft beer',
  happyHour: 'a happy hour',
  brewery: 'beer brewed on site',
};

function typeOf(p: Pub) {
  const t = (p.googleType || 'pub').toLowerCase();
  return /pub|bar|tavern|inn/.test(t) ? t : 'pub';
}

/** Latest listed closing time across the week, e.g. { day: 'Saturday', label: '1 am' }. */
export function latestClose(p: Pub) {
  let best: { mins: number; day: string; label: string } | null = null;
  for (const d of DAYS) {
    const ranges = parseRanges(p.openingHours?.[d]);
    if (!ranges?.length) continue;
    for (const r of ranges) {
      const [h, m] = r.closes.split(':').map(Number);
      const [oh] = r.opens.split(':').map(Number);
      const mins = h * 60 + m + (h < oh || (h < 6 && oh >= 6) ? 1440 : 0);
      if (!best || mins > best.mins) best = { mins, day: d[0].toUpperCase() + d.slice(1), label: fmtTime(h, m) };
    }
  }
  return best;
}
/** Earliest weekday (Mon-Fri) opening time in minutes after midnight. */
export function earliestWeekdayOpen(p: Pub) {
  let best: number | null = null;
  for (const d of DAYS.slice(0, 5)) {
    const ranges = parseRanges(p.openingHours?.[d]);
    for (const r of ranges || []) {
      const [h, m] = r.opens.split(':').map(Number);
      const mins = h * 60 + m;
      if (best == null || mins < best) best = mins;
    }
  }
  return best;
}
function fmtTime(h: number, m: number) {
  const ap = h >= 12 && h < 24 ? 'pm' : 'am';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hh}:${String(m).padStart(2, '0')} ${ap}` : `${hh} ${ap}`;
}

/** 40-70 word entry built only from data. `skip` hides the guide's own feature from the "also" list. */
export function pubBlurb(p: Pub, guide: Pick<Guide, 'focus'> & { skip?: FeatureKey[] }) {
  const s: string[] = [];
  const t = typeOf(p);
  s.push(`${p.name} is ${/^[aeiou]/.test(t) ? 'an' : 'a'} ${t} on ${streetName(p)} in ${areaName(p.area)}.`);
  if (p.rating != null) s.push(`It holds a ${p.rating.toFixed(1)} rating from ${(p.reviewCount ?? 0).toLocaleString('en-GB')} Google reviews.`);
  const focus = guide.focus?.(p);
  if (focus) s.push(focus);
  const skip = new Set<FeatureKey>(guide.skip ?? []);
  const feats = yesFeatures(p).filter((k) => !skip.has(k) && !(k === 'food' && has(p, 'sundayRoast'))).slice(0, 4);
  if (feats.length) s.push(`Its own website also mentions ${listJoin(feats.map((k) => NOUN[k]))}.`);
  const late = latestClose(p);
  if (late) s.push(`The latest listed closing time is ${late.label} on ${late.day}s.`);
  return s.join(' ');
}

function areaGroups(list: Pub[], compact = false): Group[] {
  return areas
    .map((a) => ({ id: `area-${a.slug}`, heading: a.name, pubs: list.filter((p) => p.area === a.slug), compact }))
    .filter((g) => g.pubs.length)
    .sort((x, y) => y.pubs.length - x.pubs.length);
}

function picks(list: Pub[], why: (p: Pub) => string, n = 4) {
  return [...list].sort((a, b) => weight(b) - weight(a)).slice(0, n).map((pub) => ({ pub, why: why(pub) }));
}
const ratingWhy = (p: Pub) => `${p.rating?.toFixed(1)} from ${(p.reviewCount ?? 0).toLocaleString('en-GB')} Google reviews, in ${areaName(p.area)}`;

// ---- Fixed points ------------------------------------------------------------------------------
const STATION = { lat: 50.829, lng: -0.141 }; // Brighton railway station, Queens Road
const SEAFRONT_ROADS = /\b(king'?s r(oa)?d|madeira dr(ive)?|marine parade|grand junction r(oa)?d|kingsway|st catherines? ter(race)?|victoria ter(race)?|western esplanade)\b/i;
// Approximate promenade line (lng -> lat), used only to find pubs a short walk from the beach.
const COAST: [number, number][] = [
  [-0.215, 50.8265], [-0.19, 50.8255], [-0.17, 50.8247], [-0.16, 50.8234], [-0.15, 50.8215], [-0.14, 50.8196],
  [-0.13, 50.818], [-0.12, 50.8163], [-0.11, 50.8148], [-0.1, 50.8128], [-0.08, 50.8095],
];
function metresFromCoast(p: Pub) {
  for (let i = 0; i < COAST.length - 1; i++) {
    const [a, la] = COAST[i];
    const [b, lb] = COAST[i + 1];
    if (p.lng >= a && p.lng <= b) return (p.lat - (la + ((lb - la) * (p.lng - a)) / (b - a))) * 111195;
  }
  return Infinity;
}

// ---- Pub crawl routes ---------------------------------------------------------------------------
export type CrawlStop = { pub: Pub; legM: number };
function crawlFrom(start: Pub, pool: Pub[], stops = 6, maxLeg = 400): CrawlStop[] {
  const route: CrawlStop[] = [{ pub: start, legM: 0 }];
  const left = new Set(pool.filter((p) => p !== start));
  while (route.length < stops) {
    const here = route[route.length - 1].pub;
    let next: Pub | null = null;
    let d = Infinity;
    for (const p of left) {
      const m = metres(here, p);
      if (m <= maxLeg && m < d) (next = p), (d = m);
    }
    if (!next) break;
    route.push({ pub: next, legM: d });
    left.delete(next);
  }
  return route;
}
const goodPubs = (area: string[]) => pubs.filter((p) => area.includes(p.area) && (p.rating ?? 0) >= 4.3 && (p.reviewCount ?? 0) >= 100 && /pub|tavern|inn/i.test(p.googleType || ''));
export const CRAWLS = [
  { id: 'lanes', name: 'Lanes and seafront', areas: ['the-lanes', 'seafront'] },
  { id: 'north-laine', name: 'North Laine', areas: ['north-laine'] },
  { id: 'kemptown', name: 'Kemp Town', areas: ['kemptown'] },
].map((c) => {
  const pool = goodPubs(c.areas);
  const start = [...pool].sort((a, b) => weight(b) - weight(a))[0];
  const route = start ? crawlFrom(start, pool) : [];
  return { ...c, route, totalM: route.reduce((s, r) => s + r.legM, 0) };
});

// ---- Guide definitions ----------------------------------------------------------------------------
const T = pubs.length;
const featureGuide = (k: FeatureKey) => rank(pubs.filter((p) => has(p, k)));

function build(): Guide[] {
  const all = rank(pubs);
  const food = featureGuide('food');
  const music = featureGuide('liveMusic');
  const quiz = featureGuide('pubQuiz');
  const dogs = featureGuide('dogFriendly');
  const sport = featureGuide('liveSport');
  const roast = featureGuide('sundayRoast');
  const craft = featureGuide('craftBeer');
  const vegan = featureGuide('veganOptions');
  const happy = featureGuide('happyHour');
  const cocktail = rank(pubs.filter((p) => /cocktail/i.test([p.googleType, ...(p as { googleTypes?: string[] }).googleTypes ?? []].join(' '))));
  const onFront = rank(pubs.filter((p) => p.area === 'seafront' || SEAFRONT_ROADS.test(p.address || '')));
  const nearFront = rank(pubs.filter((p) => !onFront.includes(p) && metresFromCoast(p) <= 250));
  const station = pubs
    .map((p) => ({ p, m: metres(STATION, p) }))
    .filter((x) => x.m <= 600)
    .sort((a, b) => a.m - b.m);
  const stationM = new Map(station.map((x) => [x.p, x.m]));
  const kemp = pubsInArea('kemptown');
  const lanes = pubsInArea('the-lanes');
  const hove = rank(pubs.filter((p) => (p.postcode || '').startsWith('BN3')));
  const late = rank(pubs.filter((p) => (latestClose(p)?.mins ?? 0) > 1440));
  const lunch = food.filter((p) => (earliestWeekdayOpen(p) ?? 9999) <= 12 * 60);
  const quizDays = (p: Pub) => p.features.pubQuiz.days ?? [];
  const openMic = music.filter((p) => /open mic/i.test(p.features.liveMusic.evidence?.quote ?? ''));
  const mostArea = [...areas].sort((a, b) => pubsInArea(b.slug).length - pubsInArea(a.slug).length)[0];

  const guides: Guide[] = [
    // A01 ------------------------------------------------------------------------------------------
    {
      slug: 'pubs-in-brighton',
      keyword: 'pubs in brighton',
      secondary: ['brighton pub', 'pubs brighton', 'how many pubs in brighton'],
      title: 'Pubs in Brighton: The Complete Area-by-Area Guide',
      h1: 'Pubs in Brighton: The Complete Guide',
      description: `Pubs in Brighton & Hove, area by area: ${T} pubs and bars across ${areas.length} neighbourhoods, with hours, maps and facilities each pub confirms itself.`,
      kicker: `${T} pubs · ${areas.length} areas`,
      image: 'pubs',
      list: all,
      groups: [
        { id: 'top-rated', heading: 'Twelve of the highest-rated pubs in Brighton', pubs: [...all].sort((a, b) => weight(b) - weight(a)).slice(0, 12) },
        ...areaGroups(all, true).map((g) => ({ ...g, heading: `Pubs in ${g.heading}` })),
      ],
      quickPicks: picks(all, ratingWhy, 5),
      intro: [
        `This guide covers ${T} pubs in Brighton and Hove, from the backstreets of the Lanes and North Laine to Kemp Town, Hove and out to Rottingdean. Every Brighton pub here has its own page with opening hours, a map and the facilities its own website confirms, such as a beer garden, a quiz or a Sunday roast.`,
        `Start with the highest-rated pubs below, or jump to a neighbourhood. If you know what you're after, the themed guides at the bottom go straight to it.`,
      ],
      howWeChose: `Every pub and bar we found in each neighbourhood on Google Maps is listed, apart from places that are mainly restaurants, cafés or clubs. The twelve featured pubs score highest on Google rating weighted by the number of reviews, so a 4.9 from a handful of reviews doesn't outrank a 4.6 from hundreds.`,
      faqs: [
        {
          q: 'How many pubs are there in Brighton?',
          a: `This guide lists ${T} pubs and bars across Brighton and Hove, in ${areas.length} neighbourhoods. That count covers venues whose main business is drinking, so restaurants and nightclubs with a bar are left out. ${mostArea.name} has the most, with ${pubsInArea(mostArea.slug).length} in the guide.`,
        },
        {
          q: 'Which area of Brighton has the best pubs?',
          a: `${mostArea.name} has the most pubs in this guide (${pubsInArea(mostArea.slug).length}), and it is easy to walk between them. North Laine and Brunswick follow closely. If you want the highest-rated pubs regardless of area, ${names([...all].sort((a, b) => weight(b) - weight(a)))} score highest on rating and review count combined.`,
        },
        {
          q: 'Are there pubs on Brighton seafront?',
          a: `Yes. ${listJoin(onFront.map((p) => p.name))} have seafront addresses, on roads such as King's Road, Madeira Drive and Marine Parade. Many more are a street or two back from the beach. See the beach bars and seafront pubs guide for the full list with distances.`,
        },
      ],
      related: ['pubs-in-the-lanes-brighton', 'kemp-town-pubs', 'pubs-and-bars-in-hove', 'brighton-beach-bars', 'pubs-near-brighton-station', 'brighton-pubs-with-food', 'pubs-with-live-music-in-brighton', 'pub-quiz-brighton', 'dog-friendly-pubs-brighton', 'pubs-showing-football-brighton', 'sunday-roast-brighton', 'craft-beer-brighton'],
    },
    // A02 ------------------------------------------------------------------------------------------
    {
      slug: 'brighton-pubs-with-food',
      keyword: 'brighton pubs with food',
      secondary: ['pub food brighton', 'pub food in brighton', 'brighton pub food', 'food pubs brighton', 'best pubs in brighton for food'],
      title: 'Brighton Pubs With Food: Where to Eat in a Pub',
      h1: 'Brighton Pubs With Food: Where to Eat',
      description: `Brighton pubs with food: ${food.length} pubs whose own websites confirm they serve food, from pub lunches to Sunday roasts and vegan options. Ranked and mapped.`,
      kicker: `${food.length} pubs serving food`,
      image: 'sunday-roasts',
      list: food,
      groups: [
        { id: 'top', heading: 'The best pubs in Brighton for food', pubs: food.slice(0, 15) },
        { id: 'lunch', heading: 'Pub food in Brighton at lunchtime', intro: `These pubs serve food and are listed as open by noon on weekdays.`, pubs: lunch.filter((p) => !food.slice(0, 15).includes(p)), compact: true },
        { id: 'more', heading: 'More food pubs in Brighton', pubs: food.slice(15).filter((p) => !lunch.includes(p)), compact: true },
      ].filter((g) => g.pubs.length),
      quickPicks: picks(food, (p) => (has(p, 'sundayRoast') ? 'Food, including Sunday roasts' : has(p, 'veganOptions') ? 'Food, with vegan options' : 'Food confirmed on its website') + ` · ${p.rating?.toFixed(1)}★`),
      focus: (p) => (has(p, 'sundayRoast') ? 'Its website mentions Sunday roasts as well as everyday food.' : null),
      intro: [
        `These are the Brighton pubs with food, as confirmed by each pub's own website rather than by guesswork. ${food.length} of the ${T} pubs in this guide say they serve food, from bar snacks and burgers to full menus and Sunday roasts.`,
        `The list is ranked by Google rating weighted by review count. Menus and kitchen hours change often, so treat this as a shortlist and check the pub's site before you go.`,
      ],
      howWeChose: `A pub is included only when its own website states that it serves food. We did not use review text or menus from third-party sites. Pubs are ordered by Google rating weighted by the number of reviews.`,
      faqs: [
        {
          q: 'Where can I get a good pub lunch in Brighton?',
          a: `${plural(lunch.length, 'pub', 'pubs')} in this guide confirm they serve food and are listed as open by noon on weekdays, including ${names(lunch)}. Kitchen hours can differ from opening hours, so check the pub's own website or call before you go.`,
        },
        {
          q: 'Are there pubs in Brighton with vegetarian food?',
          a: `Yes. ${plural(vegan.length, 'pub says', 'pubs say')} on their own websites that they offer vegan or vegetarian options, including ${names(vegan)}. See the vegan and vegetarian pubs guide for the full list.`,
        },
        {
          q: 'Which Brighton pubs do a Sunday roast?',
          a: `${roast.length} pubs in this guide say on their websites that they serve a Sunday roast. The highest rated include ${names(roast)}. Roasts often sell out, so it's worth booking.`,
        },
      ],
      related: ['sunday-roast-brighton', 'vegan-pubs-brighton', 'pubs-in-brighton', 'dog-friendly-pubs-brighton', 'pubs-in-the-lanes-brighton'],
    },
    // A03 ------------------------------------------------------------------------------------------
    {
      slug: 'pubs-with-live-music-in-brighton',
      keyword: 'pubs with live music in brighton',
      secondary: ['live music pubs brighton', 'brighton live music pubs', 'brighton pubs with live music', 'pubs in brighton with live music', 'brighton pub live music', 'brighton bars with live music'],
      title: 'Pubs With Live Music in Brighton',
      h1: 'Pubs With Live Music in Brighton',
      description: `Pubs with live music in Brighton: ${music.length} pubs and bars whose own websites advertise live bands, gigs or open mic nights, ranked and mapped by area.`,
      kicker: `${music.length} live music pubs`,
      image: 'live-music',
      list: music,
      groups: [
        { id: 'top', heading: 'Live music pubs in Brighton', pubs: music.slice(0, 15) },
        { id: 'more', heading: 'More Brighton pubs with live music', pubs: music.slice(15), compact: true },
      ].filter((g) => g.pubs.length),
      quickPicks: picks(music, ratingWhy),
      intro: [
        `These are the pubs with live music in Brighton and Hove, taken from what each pub's own website says. ${music.length} pubs and bars mention live bands, gigs, open mic nights or acoustic sessions.`,
        `We don't list gig nights, because they change week to week. Each entry links to the pub's page, which links on to the pub's own listings.`,
      ],
      howWeChose: `A pub is included when its own website mentions live music, live bands, gigs or open mic nights. They are ordered by Google rating weighted by review count.`,
      skip: ['liveMusic'],
      faqs: [
        {
          q: 'Which Brighton pubs have live music tonight?',
          a: `Line-ups change daily, so this guide doesn't list nights. The ${music.length} pubs here all say they host live music. Pick one near you and check its own website or social pages for tonight's listings. ${names(music)} are among the highest rated.`,
        },
        ...(openMic.length
          ? [{ q: 'Where can I find open mic nights in Brighton?', a: `${listJoin(openMic.map((p) => p.name))} mention open mic nights on their own websites. Nights and sign-up rules change, so check with the pub before you take your guitar along.` }]
          : []),
      ],
      related: ['night-out-in-brighton', 'pubs-in-brighton', 'pub-quiz-brighton', 'pubs-in-the-lanes-brighton', 'pubs-showing-football-brighton'],
    },
    // A04 ------------------------------------------------------------------------------------------
    {
      slug: 'pub-quiz-brighton',
      keyword: 'pub quiz brighton',
      secondary: [],
      title: 'Pub Quiz in Brighton: Where to Play',
      h1: 'Pub Quiz in Brighton: Where to Play',
      description: `Pub quiz Brighton: ${quiz.length} pubs whose own websites mention a regular quiz, grouped by quiz night where the pub names the day. Ranked, mapped and checked.`,
      kicker: `${quiz.length} quiz pubs`,
      image: 'pub-quizzes',
      list: quiz,
      groups: [
        ...DAYS.map((d) => d[0].toUpperCase() + d.slice(1))
          .map((d) => ({ id: d.toLowerCase(), heading: `${d} pub quiz`, pubs: quiz.filter((p) => quizDays(p).includes(d)) }))
          .filter((g) => g.pubs.length),
        { id: 'other', heading: 'Quiz nights where the day isn\'t stated', intro: 'These pubs mention a quiz on their websites but not which night. Check with the pub.', pubs: quiz.filter((p) => !quizDays(p).length), compact: true },
      ].filter((g) => g.pubs.length),
      quickPicks: picks(quiz.filter((p) => quizDays(p).length), (p) => `Quiz on ${quizDays(p).join(', ')} · ${p.rating?.toFixed(1)}★`),
      focus: (p) => (quizDays(p).length ? `Its website mentions a quiz on ${listJoin(quizDays(p).map((d) => d + 's'), 'or')}.` : null),
      skip: ['pubQuiz'],
      intro: [
        `Looking for a pub quiz in Brighton? ${quiz.length} pubs in this guide mention a regular quiz on their own websites. Where the pub names the night, it's grouped by day so you can find one that fits your week.`,
        `Prizes, entry fees and team sizes aren't listed because they change. Check with the pub before you round up the team.`,
      ],
      howWeChose: `Pubs are included when their own website mentions a quiz. The day comes from the same website. If a pub doesn't say which night, it's listed separately rather than guessed.`,
      faqs: DAYS.slice(0, 4)
        .map((d) => d[0].toUpperCase() + d.slice(1))
        .map((d) => ({ d, list: quiz.filter((p) => quizDays(p).includes(d)) }))
        .filter((x) => x.list.length)
        .slice(0, 3)
        .map(({ d, list }) => ({
          q: `Which Brighton pubs run a quiz on ${d}?`,
          a: `${listJoin(list.map((p) => p.name))} ${list.length === 1 ? 'mentions' : 'mention'} a ${d} quiz on ${list.length === 1 ? 'its' : 'their'} own website${list.length === 1 ? '' : 's'}. Quiz nights can move or take breaks, so check with the pub before you go.`,
        })),
      related: ['pubs-in-brighton', 'pubs-with-live-music-in-brighton', 'night-out-in-brighton', 'brighton-pubs-with-food', 'kemp-town-pubs'],
    },
    // A07 ------------------------------------------------------------------------------------------
    {
      slug: 'brighton-beach-bars',
      keyword: 'brighton beach bars',
      secondary: ['bars on brighton beach', 'bars brighton beach', 'brighton bar on the beach', 'brighton beachfront bars', 'seafront bars brighton', 'brighton seafront bars', 'bars brighton seafront', 'pubs on brighton seafront'],
      title: 'Brighton Beach Bars and Seafront Pubs',
      h1: 'Beach Bars and Seafront Pubs in Brighton',
      description: `Brighton beach bars and seafront pubs in Brighton & Hove, East Sussex: ${onFront.length} on the seafront itself and ${nearFront.length} more a short walk back from the beach, mapped.`,
      kicker: 'Brighton & Hove seafront',
      image: 'seafront',
      list: [...onFront, ...nearFront],
      groups: [
        { id: 'on-the-seafront', heading: 'Bars on Brighton beach and the seafront', intro: 'These have addresses on the seafront itself: King\'s Road, Madeira Drive, Marine Parade or Hove\'s seafront terraces.', pubs: onFront },
        { id: 'near', heading: 'Pubs a short walk from the beach', intro: 'Within roughly 250 metres of the promenade, usually a street or two back.', pubs: nearFront, compact: true },
      ].filter((g) => g.pubs.length),
      quickPicks: picks(onFront, (p) => `${addressLines(p).street} · ${p.rating?.toFixed(1)}★`, Math.min(4, onFront.length)),
      intro: [
        `Brighton beach bars and seafront pubs in Brighton and Hove, East Sussex, on the south coast of England. ${plural(onFront.length, 'venue sits', 'venues sit')} on the seafront itself, and ${nearFront.length} more pubs are a short walk back from the beach.`,
        `The seafront group is based on each venue's address; the short-walk group uses map distance, so treat it as approximate.`,
      ],
      howWeChose: `"On the seafront" means the venue's address is on a seafront road (King's Road and its arches, Madeira Drive, Marine Parade, Kingsway or Hove's seafront terraces). "A short walk" means within about 250 metres of the promenade by map distance.`,
      faqs: [
        { q: 'Are there pubs on Brighton beach?', a: `Yes. ${listJoin(onFront.map((p) => `${p.name} (${addressLines(p).street})`))} have seafront addresses. Several more pubs are a street or two back from the beach, listed further down this page.` },
        ...(onFront.some((p) => has(p, 'dogFriendly')) || nearFront.some((p) => has(p, 'dogFriendly'))
          ? [{ q: 'Are dogs allowed at Brighton seafront bars?', a: `Some are. ${names([...onFront, ...nearFront].filter((p) => has(p, 'dogFriendly')), 4)} say on their websites that dogs are welcome. Policies can vary by area of the pub and time of day, so check before you go.` }]
          : []),
      ],
      related: ['pubs-in-brighton', 'pubs-in-the-lanes-brighton', 'kemp-town-pubs', 'pubs-and-bars-in-hove', 'night-out-in-brighton'],
    },
    // A08 ------------------------------------------------------------------------------------------
    {
      slug: 'best-cocktail-bars-in-brighton',
      keyword: 'best cocktail bars in brighton',
      secondary: [],
      title: 'Best Cocktail Bars in Brighton',
      h1: 'Best Cocktail Bars in Brighton',
      description: `The best cocktail bars in Brighton & Hove: ${cocktail.length} bars listed as cocktail bars, ranked by Google rating, with happy hours and beer noted where confirmed.`,
      kicker: `${cocktail.length} cocktail bars`,
      list: cocktail,
      groups: [
        { id: 'top', heading: 'Cocktail bars in Brighton, ranked', pubs: cocktail.slice(0, 10) },
        { id: 'more', heading: 'More cocktail bars', pubs: cocktail.slice(10), compact: true },
      ].filter((g) => g.pubs.length),
      quickPicks: picks(cocktail, ratingWhy),
      focus: (p) => (has(p, 'craftBeer') ? 'It also lists craft beer, if cocktails aren\'t your thing.' : null),
      intro: [
        `The best cocktail bars in Brighton and Hove, ranked by Google rating and review count. ${cocktail.length} venues in this guide are listed on Google as cocktail bars, mostly in and around the Lanes.`,
        `Where a bar's own website mentions craft beer or a happy hour, we say so. Prices and offers aren't listed because they change.`,
      ],
      howWeChose: `Bars are included when Google lists them as a cocktail bar. They are ranked by Google rating weighted by review count. Facilities come from each bar's own website.`,
      faqs: [
        ...(cocktail.some((p) => has(p, 'happyHour')) ? [{ q: 'Which Brighton cocktail bars have a happy hour?', a: `${listJoin(cocktail.filter((p) => has(p, 'happyHour')).map((p) => p.name))} mention a happy hour on their own websites. Times and deals change, so check the bar's site before you go.` }] : []),
        { q: 'Are there cocktail bars in the Lanes?', a: `Yes. ${plural(cocktail.filter((p) => p.area === 'the-lanes').length, 'cocktail bar', 'cocktail bars')} in this guide ${cocktail.filter((p) => p.area === 'the-lanes').length === 1 ? 'is' : 'are'} in the Lanes, including ${names(cocktail.filter((p) => p.area === 'the-lanes'))}.` },
      ],
      related: ['happy-hour-brighton', 'night-out-in-brighton', 'pubs-in-the-lanes-brighton', 'pubs-in-brighton', 'craft-beer-brighton'],
    },
    // A10 ------------------------------------------------------------------------------------------
    {
      slug: 'pubs-near-brighton-station',
      keyword: 'pubs near brighton station',
      secondary: ['pubs near brighton train station'],
      title: 'Pubs Near Brighton Station: Where to Drink',
      h1: 'Pubs Near Brighton Station',
      description: `Pubs near Brighton station: ${station.length} pubs within 600 metres of the train station, nearest first, with approximate walking times, hours and facilities.`,
      kicker: `${station.length} pubs within 600 m`,
      image: 'pubs',
      list: station.map((x) => x.p),
      groups: [
        { id: 'five', heading: 'Pubs within five minutes of Brighton station', pubs: station.filter((x) => x.m <= 400).map((x) => x.p) },
        { id: 'further', heading: 'A little further from the station', pubs: station.filter((x) => x.m > 400).map((x) => x.p), compact: true },
      ].filter((g) => g.pubs.length),
      quickPicks: station.slice(0, 4).map(({ p, m }) => ({ pub: p, why: `About ${formatDistance(m)}, roughly ${walkMins(m)} min walk` })),
      focus: (p) => (stationM.has(p) ? `It is about ${formatDistance(stationM.get(p)!)} from Brighton station, approximately ${walkMins(stationM.get(p)!)} minutes' walk.` : null),
      intro: [
        `Pubs near Brighton station, nearest first. ${station.length} pubs in this guide are within 600 metres of the station on Queens Road, and ${station.filter((x) => x.m <= 400).length} of them are within about five minutes' walk.`,
        `Distances are measured in a straight line from the station entrance, and walking times assume about 80 metres a minute, so treat them as approximate.`,
      ],
      howWeChose: `Every pub in the guide within 600 metres of Brighton station is listed, ordered by straight-line distance. Walking times are estimates from distance, not from a route planner.`,
      faqs: [
        { q: 'What is the closest pub to Brighton station?', a: `${station[0].p.name} is the closest pub in this guide, about ${formatDistance(station[0].m)} from the station, roughly ${walkMins(station[0].m)} minutes' walk. ${station[1].p.name} and ${station[2].p.name} are also within ${formatDistance(station[2].m)}.` },
      ],
      related: ['pubs-in-brighton', 'brighton-pub-crawl', 'pubs-in-the-lanes-brighton', 'brighton-pubs-with-food', 'craft-beer-brighton'],
    },
    // A11 ------------------------------------------------------------------------------------------
    {
      slug: 'kemp-town-pubs',
      keyword: 'kemp town pubs',
      secondary: ['pubs in kemptown brighton'],
      title: "Kemp Town Pubs: A Guide to Kemptown's Best",
      h1: 'Pubs in Kemp Town, Brighton',
      description: `Kemp Town pubs: all ${kemp.length} pubs and bars in Kemptown, Brighton, ranked by Google rating, with opening hours, maps and the facilities each pub confirms.`,
      kicker: `${kemp.length} pubs in Kemp Town`,
      list: kemp,
      groups: [{ id: 'kemptown', heading: 'Pubs in Kemptown, Brighton, ranked', pubs: kemp }],
      quickPicks: picks(kemp, ratingWhy),
      intro: [
        `Kemp Town pubs, ranked. Kemptown runs east from the Old Steine along St James's Street towards the Marina, and this guide lists ${kemp.length} pubs and bars there.`,
        `Each entry shows what the pub's own website confirms, from beer gardens to quizzes.`,
      ],
      howWeChose: `All pubs in the guide's Kemp Town area are listed, ranked by Google rating weighted by review count.`,
      faqs: [{ q: 'How many pubs are there in Kemp Town?', a: `This guide lists ${kemp.length} pubs and bars in Kemp Town, including ${names(kemp)}. ${plural(kemp.filter((p) => has(p, 'dogFriendly')).length, 'says', 'say')} dogs are welcome and ${kemp.filter((p) => has(p, 'pubQuiz')).length} mention a quiz.` }],
      related: ['pubs-in-brighton', 'brighton-pub-crawl', 'brighton-beach-bars', 'pubs-in-the-lanes-brighton', 'night-out-in-brighton'],
    },
    // A12 ------------------------------------------------------------------------------------------
    {
      slug: 'craft-beer-brighton',
      keyword: 'craft beer brighton',
      secondary: ['craft beer pub', 'craft beer pubs', 'craft beer bars', 'craft beer pubs in brighton', 'best craft beer pubs in brighton'],
      title: 'Craft Beer in Brighton: Best Pubs, Bars and Shops',
      h1: 'Craft Beer in Brighton',
      description: `Craft beer in Brighton: ${craft.length} pubs, bars and taprooms whose own websites mention craft beer, ranked by Google rating, with real ale noted where confirmed.`,
      kicker: `${craft.length} craft beer pubs`,
      image: 'pubs',
      list: craft,
      groups: [
        { id: 'top', heading: 'Craft beer pubs and bars in Brighton', pubs: craft.slice(0, 12) },
        { id: 'more', heading: 'More craft beer bars', pubs: craft.slice(12), compact: true },
      ].filter((g) => g.pubs.length),
      quickPicks: picks(craft, ratingWhy),
      skip: ['craftBeer'],
      focus: (p) => (has(p, 'brewery') ? 'It brews beer on site.' : has(p, 'realAle') ? 'Its website also mentions real ale.' : null),
      intro: [
        `Where to find craft beer in Brighton. ${craft.length} pubs, bars and taprooms in this guide mention craft beer on their own websites, from dedicated craft beer bars and bottle shops to traditional pubs with a few craft taps.`,
        `Tap lists change constantly, so we don't list beers. Follow the links to each pub's page and website.`,
      ],
      howWeChose: `A venue is included when its own website mentions craft beer, craft taps or a taproom. Ranking is by Google rating weighted by review count.`,
      faqs: [
        { q: 'Where can I find craft beer in Brighton?', a: `${craft.length} pubs and bars in this guide mention craft beer on their websites. The highest rated include ${names(craft)}. Many also serve cask ale, noted in each entry.` },
        ...(craft.some((p) => has(p, 'brewery') || /tap ?room/i.test(p.name + (p.features.craftBeer.evidence?.quote ?? '')))
          ? [{ q: 'Are there brewery taprooms in Brighton?', a: `Yes. ${listJoin(craft.filter((p) => has(p, 'brewery') || /tap ?room/i.test(p.name + (p.features.craftBeer.evidence?.quote ?? ''))).map((p) => p.name))} describe themselves as taprooms or brew on site, according to their websites.` }]
          : []),
      ],
      related: ['pubs-in-brighton', 'brighton-pub-crawl', 'pubs-near-brighton-station', 'pubs-and-bars-in-hove', 'best-cocktail-bars-in-brighton'],
    },
    // A14 ------------------------------------------------------------------------------------------
    {
      slug: 'pubs-in-the-lanes-brighton',
      keyword: 'pubs in the lanes brighton',
      secondary: ['pubs in brighton lanes', 'brighton lanes pubs'],
      title: 'Pubs in the Lanes, Brighton: Where to Drink',
      h1: 'Pubs in The Lanes, Brighton',
      description: `Pubs in the Lanes, Brighton: all ${lanes.length} pubs and bars in and around the Lanes, ranked by Google rating, with hours, maps and confirmed facilities.`,
      kicker: `${lanes.length} pubs in the Lanes`,
      list: lanes,
      groups: [
        { id: 'top', heading: 'Brighton Lanes pubs, ranked', pubs: lanes.slice(0, 12) },
        { id: 'more', heading: 'More pubs in the Lanes', pubs: lanes.slice(12), compact: true },
      ].filter((g) => g.pubs.length),
      quickPicks: picks(lanes, ratingWhy),
      intro: [
        `Pubs in the Lanes, Brighton's old town of narrow streets between North Street and the seafront. With ${lanes.length} pubs and bars, it is the busiest drinking area in this guide.`,
        `The top twelve get a full entry; the rest are listed below with links to their pages.`,
      ],
      howWeChose: `All pubs in the guide's Lanes area are listed, ranked by Google rating weighted by review count.`,
      faqs: [{ q: 'How many pubs are there in the Lanes?', a: `This guide lists ${lanes.length} pubs and bars in and around Brighton's Lanes, more than any other area. The highest rated include ${names(lanes)}.` }],
      related: ['pubs-in-brighton', 'brighton-pub-crawl', 'brighton-beach-bars', 'best-cocktail-bars-in-brighton', 'night-out-in-brighton'],
    },
    // A15 ------------------------------------------------------------------------------------------
    {
      slug: 'dog-friendly-pubs-brighton',
      keyword: 'dog friendly pubs brighton',
      secondary: ['dog friendly pub brighton'],
      title: 'Dog Friendly Pubs in Brighton',
      h1: 'Dog Friendly Pubs in Brighton',
      description: `Dog friendly pubs in Brighton & Hove: ${dogs.length} pubs whose own websites say dogs are welcome, each linked to its source. Ranked, mapped and grouped by area.`,
      kicker: `${dogs.length} dog-friendly pubs`,
      image: 'dog-friendly',
      list: dogs,
      groups: [
        { id: 'top', heading: 'Dog friendly pubs in Brighton, ranked', pubs: dogs.slice(0, 15) },
        { id: 'more', heading: 'More dog friendly pubs', pubs: dogs.slice(15), compact: true },
      ].filter((g) => g.pubs.length),
      quickPicks: picks(dogs, ratingWhy),
      skip: ['dogFriendly'],
      focus: (p) => (has(p, 'beerGarden') ? 'It also has a beer garden or outdoor space, according to its website.' : null),
      intro: [
        `Dog friendly pubs in Brighton and Hove, where the pub itself says dogs are welcome. ${dogs.length} pubs in this guide state it on their own websites, and each pub's page links to the page where it says so.`,
        `Some pubs limit dogs to the bar or garden, or to certain times. Check before you go.`,
      ],
      howWeChose: `A pub is included only when its own website says dogs are welcome. We don't rely on reviews or third-party lists for dog policies. Ranking is by Google rating weighted by review count.`,
      faqs: [
        { q: 'Which dog friendly pubs in Brighton have a beer garden?', a: `${listJoin(dogs.filter((p) => has(p, 'beerGarden')).slice(0, 6).map((p) => p.name))} say on their websites both that dogs are welcome and that they have a beer garden or outdoor space.` },
        { q: 'Can I take my dog into a pub in Brighton?', a: `Many Brighton pubs allow dogs, and ${dogs.length} in this guide say so on their own websites. Rules vary: some allow dogs only in the bar or garden, or not at mealtimes. Check with the pub before you go.` },
      ],
      related: ['pubs-in-brighton', 'brighton-beach-bars', 'sunday-roast-brighton', 'brighton-pubs-with-food', 'pubs-and-bars-in-hove'],
    },
    // A16 ------------------------------------------------------------------------------------------
    {
      slug: 'pubs-showing-football-brighton',
      keyword: 'pubs showing football brighton',
      secondary: ['sports pubs brighton', 'where to watch football in brighton'],
      title: 'Pubs Showing Football in Brighton',
      h1: 'Where to Watch Football in Brighton Pubs',
      description: `Pubs showing football in Brighton: ${sport.length} pubs whose own websites say they show live sport on TV, ranked and mapped, with food and beer gardens noted.`,
      kicker: `${sport.length} sports pubs`,
      image: 'live-sport',
      list: sport,
      groups: [{ id: 'top', heading: 'Sports pubs in Brighton, ranked', pubs: sport }],
      quickPicks: picks(sport, ratingWhy),
      skip: ['liveSport'],
      intro: [
        `Pubs showing football in Brighton and Hove. ${sport.length} pubs in this guide say on their own websites that they show live sport, from big-screen sports pubs to locals with a TV in the corner.`,
        `We don't list which channels or fixtures a pub shows, or matchday rules, because these change. Check with the pub before a big game.`,
      ],
      howWeChose: `A pub is included when its own website says it shows live sport. Ranking is by Google rating weighted by review count.`,
      faqs: [
        { q: 'Where can I watch football in Brighton?', a: `${sport.length} pubs in this guide say they show live sport, including ${names(sport)}. Big matches fill up quickly, so arrive early or book if the pub takes bookings.` },
        { q: 'Which Brighton sports pubs serve food?', a: `${listJoin(sport.filter((p) => has(p, 'food') || has(p, 'sundayRoast')).slice(0, 6).map((p) => p.name))} say on their websites that they show sport and serve food.` },
      ],
      related: ['pubs-in-brighton', 'night-out-in-brighton', 'pubs-near-brighton-station', 'pubs-with-live-music-in-brighton', 'brighton-pubs-with-food'],
    },
    // A17 ------------------------------------------------------------------------------------------
    {
      slug: 'sunday-roast-brighton',
      keyword: 'roasts brighton',
      secondary: ['carvery brighton', 'best carvery brighton', 'sunday roast brighton'],
      title: 'Sunday Roast in Brighton: Pubs and Carveries',
      h1: 'Sunday Roast in Brighton: Pubs and Carveries',
      description: `Roasts in Brighton: ${roast.length} pubs whose own websites say they serve a Sunday roast or carvery, ranked by Google rating, with vegan roasts and dogs noted.`,
      kicker: `${roast.length} roast pubs`,
      image: 'sunday-roasts',
      list: roast,
      groups: [
        { id: 'top', heading: 'Sunday roasts in Brighton, ranked', pubs: roast.slice(0, 12) },
        { id: 'more', heading: 'More pubs serving roasts', pubs: roast.slice(12), compact: true },
      ].filter((g) => g.pubs.length),
      quickPicks: picks(roast, (p) => (has(p, 'veganOptions') ? 'Roasts, with vegan options' : 'Sunday roasts') + ` · ${p.rating?.toFixed(1)}★`),
      skip: ['sundayRoast', 'food'],
      intro: [
        `Roasts in Brighton: the pubs whose own websites say they serve a Sunday roast or carvery. ${roast.length} pubs in this guide do, and the list is ranked by Google rating and review count.`,
        `Prices, meats and serving times aren't listed because they change week to week. Roasts often sell out, so book where you can.`,
      ],
      howWeChose: `A pub is included when its own website mentions Sunday roasts, roast dinners, Sunday lunch or a carvery. Ranking is by Google rating weighted by review count.`,
      faqs: [
        { q: 'Where can I get a vegan Sunday roast in Brighton?', a: `${listJoin(roast.filter((p) => has(p, 'veganOptions')).map((p) => p.name)) || 'Few pubs say so explicitly'}: these pubs mention both roasts and vegan options on their websites. Check the menu before you book.` },
        { q: 'Do I need to book a Sunday roast in Brighton?', a: `It's wise. Popular roast pubs such as ${names(roast)} often fill up on Sundays. Most take bookings through their websites or by phone.` },
      ],
      related: ['brighton-pubs-with-food', 'vegan-pubs-brighton', 'dog-friendly-pubs-brighton', 'pubs-in-brighton', 'pubs-and-bars-in-hove'],
    },
    // A18 ------------------------------------------------------------------------------------------
    {
      slug: 'brighton-pub-crawl',
      keyword: 'brighton pub crawl',
      secondary: [],
      title: 'Brighton Pub Crawl: A Route Through the Best Pubs',
      h1: 'Brighton Pub Crawl: A Walkable Route',
      description: `A free, self-guided Brighton pub crawl: ${CRAWLS.length} walkable routes through well-rated pubs, with distances between stops. Lanes, North Laine and Kemp Town.`,
      kicker: 'Self-guided routes',
      image: 'pub-quizzes',
      list: CRAWLS.flatMap((c) => c.route.map((r) => r.pub)),
      groups: CRAWLS.filter((c) => c.route.length >= 3).map((c) => ({
        id: `route-${c.id}`,
        heading: `Brighton pub crawl: ${c.name}`,
        intro: `${c.route.length} pubs, about ${formatDistance(c.totalM)} in total. Stops are in walking order.`,
        pubs: c.route.map((r) => r.pub),
      })),
      quickPicks: CRAWLS.filter((c) => c.route.length).map((c) => ({ pub: c.route[0].pub, why: `Start of the ${c.name} route (${c.route.length} pubs, ${formatDistance(c.totalM)})` })),
      focus: (p) => {
        for (const c of CRAWLS) {
          const i = c.route.findIndex((r) => r.pub === p);
          if (i > 0) return `Stop ${i + 1}: about ${formatDistance(c.route[i].legM)} from ${c.route[i - 1].pub.name}.`;
          if (i === 0) return `Stop 1 on this route.`;
        }
        return null;
      },
      note: 'Drink responsibly, drink water between stops and look after each other. Pubs can refuse service to anyone who has had too much.',
      intro: [
        `A free, self-guided Brighton pub crawl. Each route links well-rated pubs that are no more than 400 metres apart, so you spend your time in pubs rather than walking between them.`,
        `Routes are worked out from each pub's location and Google rating, not sold by a tour company, so you can start and stop where you like.`,
      ],
      howWeChose: `Each route starts at the highest-rated pub in its area (Google rating weighted by review count, 4.3 or higher with at least 100 reviews) and moves to the nearest qualifying pub within 400 metres, up to six stops. Distances are straight-line estimates.`,
      faqs: [
        { q: 'How long is a Brighton pub crawl?', a: `The routes here are ${listJoin(CRAWLS.filter((c) => c.route.length >= 3).map((c) => `${c.name} (${c.route.length} pubs, about ${formatDistance(c.totalM)})`))}. Allow about 45 minutes per pub, so a full route takes most of an afternoon or evening.` },
      ],
      related: ['pubs-in-the-lanes-brighton', 'kemp-town-pubs', 'night-out-in-brighton', 'pubs-in-brighton', 'craft-beer-brighton'],
    },
    // A21 ------------------------------------------------------------------------------------------
    {
      slug: 'happy-hour-brighton',
      keyword: 'happy hour brighton',
      secondary: [],
      title: 'Happy Hour in Brighton: Pubs and Bars With Deals',
      h1: 'Happy Hour in Brighton',
      description: `Happy hour in Brighton: ${happy.length} pubs and bars whose own websites advertise a happy hour, ranked by Google rating, each linked to the source. Deals change, so check.`,
      kicker: `${happy.length} happy hours`,
      list: happy,
      groups: [{ id: 'top', heading: 'Brighton pubs and bars with a happy hour', pubs: happy }],
      quickPicks: picks(happy, ratingWhy),
      skip: ['happyHour'],
      intro: [
        `Happy hour in Brighton: ${happy.length} pubs and bars in this guide advertise a happy hour on their own websites.`,
        `Times, prices and drinks included change often, so we don't list them. Each pub's page links to the page on its website that mentions the happy hour, so you can check the current deal.`,
      ],
      howWeChose: `A pub or bar is included when its own website mentions a happy hour. Ranking is by Google rating weighted by review count.`,
      faqs: [{ q: 'Which Brighton bars have a happy hour?', a: `${listJoin(happy.slice(0, 6).map((p) => p.name))} are among the ${happy.length} venues that advertise a happy hour on their websites. Deals change, so check the bar's site before you go.` }],
      related: ['best-cocktail-bars-in-brighton', 'night-out-in-brighton', 'pubs-in-the-lanes-brighton', 'pubs-in-brighton', 'brighton-pub-crawl'],
    },
    // A22 ------------------------------------------------------------------------------------------
    {
      slug: 'vegan-pubs-brighton',
      keyword: 'vegan pubs brighton',
      secondary: ['vegetarian pubs brighton', 'vegan pub food brighton'],
      title: 'Vegan and Vegetarian Pubs in Brighton',
      h1: 'Vegan and Vegetarian Pubs in Brighton',
      description: `Vegan pubs in Brighton: ${vegan.length} pubs whose own websites mention vegan or vegetarian options, from vegan roasts to burgers. Ranked, mapped and sourced.`,
      kicker: `${vegan.length} pubs with vegan options`,
      list: vegan,
      groups: [{ id: 'top', heading: 'Brighton pubs with vegan and vegetarian food', pubs: vegan }],
      quickPicks: picks(vegan, (p) => (has(p, 'sundayRoast') ? 'Vegan options and Sunday roasts' : 'Vegan options') + ` · ${p.rating?.toFixed(1)}★`),
      skip: ['veganOptions', 'food'],
      intro: [
        `Vegan pubs in Brighton: ${vegan.length} pubs in this guide say on their own websites that they offer vegan or vegetarian options.`,
        `Some have a separate vegan menu; others offer a vegan version of a few dishes. Each pub's page links to where it says so. Menus change, so check before you go.`,
      ],
      howWeChose: `A pub is included when its own website mentions vegan options, a vegan menu or vegetarian and vegan dishes. Ranking is by Google rating weighted by review count.`,
      faqs: [{ q: 'Are there vegan pubs in Brighton?', a: `${vegan.length} pubs in this guide offer vegan options according to their websites, including ${names(vegan)}. ${roast.filter((p) => has(p, 'veganOptions')).length ? `${names(roast.filter((p) => has(p, 'veganOptions')), 2)} also serve Sunday roasts.` : ''}` }],
      related: ['brighton-pubs-with-food', 'sunday-roast-brighton', 'pubs-in-brighton', 'dog-friendly-pubs-brighton', 'craft-beer-brighton'],
    },
    // A23 ------------------------------------------------------------------------------------------
    {
      slug: 'night-out-in-brighton',
      keyword: 'night out brighton',
      secondary: ['nights out in brighton', 'night out in brighton', 'brighton night out'],
      title: 'A Night Out in Brighton: Where to Start With a Pint',
      h1: 'A Night Out in Brighton',
      description: `Plan a night out in Brighton: well-rated pubs for early pints, pubs with food for dinner, and ${late.length} pubs and bars listed as open past midnight.`,
      kicker: 'Pubs, food and late bars',
      image: 'live-music',
      list: rank(pubs),
      groups: [
        { id: 'early', heading: 'Early pints', intro: 'Well-rated pubs in the Lanes and North Laine to start the night.', pubs: rank(pubs.filter((p) => ['the-lanes', 'north-laine'].includes(p.area) && /pub/i.test(p.googleType || ''))).slice(0, 6) },
        { id: 'dinner', heading: 'Dinner in a pub', intro: 'Pubs whose own websites confirm they serve food.', pubs: food.slice(0, 6) },
        { id: 'late', heading: 'Brighton night out: late bars', intro: 'Pubs and bars listed as open past midnight on at least one night.', pubs: late.slice(0, 10) },
      ],
      quickPicks: picks(late, (p) => `Open until ${latestClose(p)?.label} on ${latestClose(p)?.day}s`),
      intro: [
        `A night out in Brighton usually starts in a pub. This page picks well-rated pubs for early pints, pubs with food for dinner, and ${late.length} pubs and bars listed as open past midnight for later on.`,
        `Closing times come from each venue's Google listing and can change, especially on bank holidays.`,
      ],
      howWeChose: `Early pints: the highest-rated pubs in the Lanes and North Laine. Dinner: the highest-rated pubs whose websites confirm food. Late bars: venues whose listed closing time is after midnight on at least one night. All ranked by Google rating weighted by review count.`,
      faqs: [{ q: 'Which Brighton pubs are open late?', a: `${late.length} pubs and bars in this guide are listed as open past midnight on at least one night, including ${listJoin(late.slice(0, 4).map((p) => `${p.name} (${latestClose(p)?.label} on ${latestClose(p)?.day}s)`))}. Times can change, so check before you go.` }],
      related: ['brighton-pub-crawl', 'best-cocktail-bars-in-brighton', 'pubs-with-live-music-in-brighton', 'happy-hour-brighton', 'pubs-in-the-lanes-brighton'],
    },
    // A24 ------------------------------------------------------------------------------------------
    {
      slug: 'pubs-and-bars-in-hove',
      keyword: 'bars hove',
      secondary: ['pubs in hove', 'hove pubs'],
      title: 'Bars and Pubs in Hove: Where to Drink',
      h1: 'Bars and Pubs in Hove',
      description: `Bars in Hove: all ${hove.length} pubs and bars with a Hove (BN3) address, from Brunswick to Church Road, ranked by Google rating, with hours, maps and facilities.`,
      kicker: `${hove.length} pubs and bars in Hove`,
      image: 'areas',
      list: hove,
      groups: [
        { id: 'top', heading: 'The top bars in Hove', pubs: hove.slice(0, 12) },
        ...areaGroups(hove.slice(12), true).map((g) => ({ ...g, heading: `More pubs in ${g.heading}` })),
      ],
      quickPicks: picks(hove, ratingWhy),
      intro: [
        `Bars and pubs in Hove: ${hove.length} venues with a Hove (BN3) postcode, from the Brunswick streets near the Brighton border to Church Road and George Street.`,
        `The top twelve get a full entry; the rest are listed by neighbourhood with links to their pages.`,
      ],
      howWeChose: `Every pub and bar in the guide with a BN3 postcode is included, ranked by Google rating weighted by review count.`,
      faqs: [{ q: 'How many pubs are there in Hove?', a: `This guide lists ${hove.length} pubs and bars with a Hove (BN3) address, including ${names(hove)}. ${hove.filter((p) => has(p, 'dogFriendly')).length} say dogs are welcome and ${hove.filter((p) => has(p, 'sundayRoast')).length} serve Sunday roasts, according to their websites.` }],
      related: ['pubs-in-brighton', 'brighton-beach-bars', 'sunday-roast-brighton', 'dog-friendly-pubs-brighton', 'craft-beer-brighton'],
    },
  ];
  // Guides with fewer than 3 qualifying pubs aren't published (thin content).
  return guides.filter((g) => g.list.length >= 3);
}

export const GUIDES: Guide[] = build();
export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);
export const guidePath = (slug: string) => `/${slug}`;
export { score };

// ---- Menu grouping (nav dropdown and /guides index) ------------------------------------------
const MENU: { heading: string; items: string[] }[] = [
  { heading: 'Places', items: ['pubs-in-brighton', 'pubs-in-the-lanes-brighton', 'kemp-town-pubs', 'pubs-and-bars-in-hove', 'pubs-near-brighton-station', 'brighton-beach-bars'] },
  { heading: 'Food & drink', items: ['brighton-pubs-with-food', 'sunday-roast-brighton', 'craft-beer-brighton', 'best-cocktail-bars-in-brighton', 'vegan-pubs-brighton', 'happy-hour-brighton'] },
  { heading: 'Things to do', items: ['pubs-with-live-music-in-brighton', 'pub-quiz-brighton', 'pubs-showing-football-brighton', 'dog-friendly-pubs-brighton', 'brighton-pub-crawl', 'night-out-in-brighton'] },
];
export type MenuItem = { href: string; label: string; blurb: string; count: number };
/** Guides grouped for navigation. Remaining /best roundups (e.g. beer gardens) join "Things to do"; any ungrouped guide goes last. */
export function guideMenu() {
  const extra: MenuItem[] = ROUNDUPS.filter((r) => !ROUNDUP_GUIDE[r.slug]).map((r) => {
    const n = pubsWith(r.key).length;
    return { href: `/best/${r.slug}`, label: `${r.label} in Brighton`, blurb: `${n} ${r.blurb}, ranked by Google rating.`, count: n };
  });
  const used = new Set(MENU.flatMap((g) => g.items));
  const item = (g: Guide): MenuItem => ({ href: guidePath(g.slug), label: g.h1.replace(/:.*/, ''), blurb: g.description, count: g.list.length });
  const groups = MENU.map((m) => ({ heading: m.heading, items: m.items.map((s) => getGuide(s)).filter((g): g is Guide => !!g).map(item) }));
  groups[2].items.push(...extra);
  const rest = GUIDES.filter((g) => !used.has(g.slug)).map(item);
  if (rest.length) groups.push({ heading: 'More guides', items: rest });
  return groups.filter((g) => g.items.length);
}
