// Christmas hub and spokes (/christmas/...). Pubs qualify only on evidence:
//   - "manual": hand-checked in data/christmas.json (the only source for links, capacities and Christmas Day opening), or
//   - "website": the pub's own website mentions the service (data/christmas-web.json, from scripts/christmas-scan.mjs).
// No menus, prices, dates, deposits, capacities or opening times are stated unless they are in data/christmas.json.
import christmasJson from '@/data/christmas.json';
import webJson from '@/data/christmas-web.json';
import { pubs, areaName, rank, streetName, nearestStation, type Pub, type FeatureKey, formatDistance } from './data';
import { listJoin, metres } from './guides';

export type Manual = {
  christmas_lunch?: boolean;
  christmas_day_lunch?: boolean;
  christmas_day_open?: boolean;
  menu_url?: string;
  booking_url?: string;
  party_bookings?: boolean;
  party_capacity?: number;
  nye_event?: boolean;
  nye_url?: string;
  source_url?: string;
  verified_date?: string;
};
type Evidence = { url: string; quote: string };
type Web = { checked: string; festiveMenu?: Evidence; christmasDay?: Evidence; christmasParty?: Evidence; groupBookings?: Evidence; newYearsEve?: Evidence };
type Market = { name: string | null; source_url: string | null; lat: number | null; lng: number | null; dates: string | null; location: string | null; verified_date: string | null };

const raw = christmasJson as unknown as Record<string, unknown>;
const MANUAL = Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith('_') && k !== 'market')) as Record<string, Manual>;
export const MARKET = raw.market as Market;
const WEB = Object.fromEntries(Object.entries(webJson as Record<string, unknown>).filter(([k]) => !k.startsWith('_'))) as Record<string, Web>;

export type Purpose = 'lunch' | 'christmasDay' | 'party' | 'groups' | 'nye';
export type XPub = { pub: Pub; basis: 'manual' | 'website'; manual?: Manual; web?: Web; date: string };

// Manual flags win in both directions: true adds a pub, false removes it whatever the website says.
function qualifies(slug: string, purpose: Purpose): 'manual' | 'website' | null {
  const m = MANUAL[slug];
  const w = WEB[slug];
  const manualFlag = { lunch: m?.christmas_lunch, christmasDay: m?.christmas_day_lunch, party: m?.party_bookings, groups: m?.party_bookings, nye: m?.nye_event }[purpose];
  if (manualFlag === false) return null;
  if (manualFlag === true) return 'manual';
  const webFlag = {
    lunch: w?.festiveMenu || w?.christmasDay,
    christmasDay: w?.christmasDay,
    party: w?.christmasParty,
    groups: w?.groupBookings,
    nye: w?.newYearsEve,
  }[purpose];
  return webFlag ? 'website' : null;
}

function toX(p: Pub, basis: 'manual' | 'website'): XPub {
  const manual = MANUAL[p.slug];
  const web = WEB[p.slug];
  return { pub: p, basis, manual, web, date: basis === 'manual' ? manual!.verified_date || '' : web?.checked || '' };
}

export function qualifying(purpose: Purpose): XPub[] {
  return rank(pubs)
    .map((p) => ({ p, b: qualifies(p.slug, purpose) }))
    .filter((x): x is { p: Pub; b: 'manual' | 'website' } => !!x.b)
    .map(({ p, b }) => toX(p, b));
}

// ---- Wording ------------------------------------------------------------------------------------
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' });

function groupLabel(e?: Evidence) {
  const q = (e?.quote || '').toLowerCase();
  if (/function room/.test(q)) return 'a function room';
  if (/private (room|event)|event space/.test(q)) return 'private event space';
  if (/group booking/.test(q)) return 'group bookings';
  return 'private hire';
}

/** What the evidence says, most relevant to the page first. */
function mentions(x: XPub, purpose: Purpose): string[] {
  const out: string[] = [];
  if (x.basis === 'manual' && x.manual) {
    const m = x.manual;
    if (m.christmas_day_lunch) out.push('Christmas Day lunch');
    if (m.christmas_lunch && !m.christmas_day_lunch) out.push('a Christmas lunch');
    if (m.party_bookings) out.push(m.party_capacity ? `Christmas party bookings for up to ${m.party_capacity} people` : 'Christmas party bookings');
    if (m.nye_event) out.push("a New Year's Eve event");
  } else if (x.web) {
    const w = x.web;
    const lunch = [w.christmasDay ? 'Christmas Day dining' : null, w.festiveMenu ? 'festive menus' : null].filter(Boolean) as string[];
    const party = [w.christmasParty ? 'Christmas parties' : null, w.groupBookings ? groupLabel(w.groupBookings) : null].filter(Boolean) as string[];
    const nye = w.newYearsEve ? ["New Year's Eve"] : [];
    const order = purpose === 'party' || purpose === 'groups' ? [party, lunch, nye] : purpose === 'nye' ? [nye, lunch, party] : [lunch, party, nye];
    out.push(...order.flat());
  }
  return out;
}

const EXTRA: Record<Purpose | 'hub', FeatureKey[]> = {
  lunch: ['veganOptions', 'sundayRoast', 'dogFriendly', 'realAle'],
  christmasDay: ['veganOptions', 'dogFriendly'],
  party: ['liveMusic', 'craftBeer', 'pubQuiz', 'liveSport', 'beerGarden'],
  groups: ['liveMusic', 'food', 'realAle'],
  nye: ['liveMusic', 'craftBeer', 'happyHour'],
  hub: ['realAle', 'dogFriendly', 'food', 'liveMusic'],
};
const FEATURE_PHRASE: Partial<Record<FeatureKey, string>> = {
  veganOptions: 'vegan options',
  sundayRoast: 'a Sunday roast',
  dogFriendly: 'that dogs are welcome',
  realAle: 'real ale',
  liveMusic: 'live music',
  craftBeer: 'craft beer',
  pubQuiz: 'a regular quiz',
  liveSport: 'live sport',
  beerGarden: 'a beer garden',
  food: 'food',
  happyHour: 'a happy hour',
};

/** A data-only write-up of `min`–`max` words. */
export function blurb(x: XPub, purpose: Purpose | 'hub', min = 40, max = 70) {
  const p = x.pub;
  const s: string[] = [];
  const where = p.area === 'seafront' ? 'on the seafront' : /-road$/.test(p.area) ? `in the ${areaName(p.area)} area` : `in ${areaName(p.area)}`;
  s.push(
    // Some listings have only a number for the street (e.g. "2-3"): leave the street out rather than print it.
    `${p.name} is ${/[a-z]{3}/i.test(streetName(p)) ? `on ${streetName(p)} ` : ''}${where}` +
      (p.rating != null ? `, rated ${p.rating.toFixed(1)} from ${(p.reviewCount ?? 0).toLocaleString('en-GB')} Google reviews.` : '.'),
  );
  const m = mentions(x, purpose === 'hub' ? 'lunch' : purpose);
  if (m.length) s.push(x.basis === 'manual' ? `The pub confirmed ${listJoin(m)} with us.` : `Its own website mentions ${listJoin(m)}.`);
  const feats = EXTRA[purpose].filter((k) => p.features[k]?.value === 'yes').map((k) => FEATURE_PHRASE[k]!);
  if (feats.length) s.push(`It also confirms ${listJoin(feats.slice(0, 3))} year-round.`);
  const st = nearestStation(p);
  const stationLine = st.m <= 1500 ? `The nearest station is ${st.name}, about ${formatDistance(st.m)} away.` : '';
  const closing =
    purpose === 'nye'
      ? "Check the pub's website for this year's plans."
      : purpose === 'party' || purpose === 'groups'
        ? "Check the pub's website for this year's party options."
        : purpose === 'hub'
        ? ''
        : "Check the pub's website for this year's menu and booking details.";
  let text = [...s, closing].filter(Boolean).join(' ');
  if (words(text) < min && stationLine) text = [...s, stationLine, closing].filter(Boolean).join(' ');
  if (words(text) > max && s.length > 2) text = [s[0], s[1], closing].filter(Boolean).join(' ');
  return text;
}

export function basisLine(x: XPub) {
  if (x.basis === 'manual') return x.manual?.verified_date ? `Confirmed by the pub on ${longDate(x.manual.verified_date)}` : 'Confirmed by the pub';
  return x.date ? `Mentioned on the pub's website, checked ${longDate(x.date)}` : "Mentioned on the pub's website";
}

/** The best link for this page: menu/booking (manual only), NYE link (manual only), else the pub's own website. */
export function actionLink(x: XPub, purpose: Purpose | 'hub'): { href: string; label: string } | null {
  const m = x.manual;
  if (x.basis === 'manual' && m) {
    if (purpose === 'nye' && m.nye_url) return { href: m.nye_url, label: "New Year's Eve details" };
    if (m.menu_url || m.booking_url) return { href: (m.menu_url || m.booking_url)!, label: 'Menu and booking' };
  }
  return x.pub.website ? { href: x.pub.website, label: "Pub's website" } : null;
}

export function lastReviewed(list: XPub[]) {
  const manual = list.map((x) => (x.basis === 'manual' ? x.manual?.verified_date : null)).filter(Boolean) as string[];
  const dates = manual.length ? manual : (list.map((x) => x.date).filter(Boolean) as string[]);
  return dates.sort().at(-1) || new Date().toISOString().slice(0, 10);
}

// ---- Pages ---------------------------------------------------------------------------------------
export type Faq = { q: string; a: string };
export type Section =
  | { kind: 'pubs'; id: string; heading: string; intro?: string; pubs: XPub[]; purpose: Purpose | 'hub'; compact?: boolean; words?: [number, number] }
  | { kind: 'text'; id: string; heading: string; paragraphs: string[]; bullets?: string[] };
export type XPage = {
  slug: string;
  path: string;
  keyword: string;
  title: string;
  h1: string;
  description: string;
  kicker: string;
  image?: string;
  /** Short label for breadcrumbs and cards. */
  short: string;
  /** 20–30 word description for spoke cards. */
  card: string;
  intro: string[];
  quickPicks: { x: XPub; why: string }[];
  sections: Section[];
  /** All pubs listed on the page (for ItemList and "last reviewed"). */
  listed: XPub[];
  /** Below the threshold: show the "still checking" note. */
  thin: boolean;
  howWeChose: string;
  responsible: boolean;
  faqs: Faq[];
  links: { href: string; label: string }[];
};

export const HUB_PATH = '/christmas';
const YEAR = 2026; // the season the copy refers to; update with last_reviewed each autumn
const names = (list: XPub[], n = 4) => listJoin(list.slice(0, n).map((x) => x.pub.name));
const why = (x: XPub, lead: string) => `${lead}${x.pub.rating != null ? ` · ${x.pub.rating.toFixed(1)} from ${(x.pub.reviewCount ?? 0).toLocaleString('en-GB')} reviews` : ''}`;
const CHECK = 'Details change every year, so check with the pub before you book.';

function lunchPage(): XPage {
  const all = qualifying('lunch');
  const day = all.filter((x) => qualifies(x.pub.slug, 'christmasDay'));
  const december = all.filter((x) => !day.includes(x));
  const full = [...day, ...december].slice(0, 10);
  const decFull = december.filter((x) => full.includes(x));
  const decRest = december.filter((x) => !full.includes(x));
  const vegan = all.filter((x) => x.pub.features.veganOptions?.value === 'yes');
  return {
    slug: 'christmas-lunch-brighton',
    path: `${HUB_PATH}/christmas-lunch-brighton`,
    keyword: 'christmas lunch brighton',
    title: 'Christmas Lunch in Brighton: Pubs Serving a Festive Meal',
    h1: 'Christmas Lunch in Brighton: Pubs Serving a Festive Meal',
    description: `Christmas lunch in Brighton: ${all.length} pubs whose own websites mention festive menus or Christmas Day dining, with ratings, maps and links to each pub's website.`,
    kicker: `${all.length} pubs with festive menus`,
    image: 'christmas-lunch',
    short: 'Christmas lunch',
    card: `${all.length} Brighton and Hove pubs whose own websites mention festive menus, including ${day.length} that mention Christmas Day itself. Ratings, maps and links to book.`,
    intro: [
      `Looking for Christmas lunch in Brighton? These are the ${all.length} pubs in our guide whose own websites mention a festive menu or Christmas lunch this season, from the Lanes to Hove and Rottingdean.`,
      `Of these, ${day.length} mention Christmas Day dining specifically; the rest mention festive menus for December, which can be a Christmas dinner with friends or a work lunch. We don't list prices or dates, because they change every year and we haven't checked them. Each entry links to the pub's website, where you'll find this year's menu.`,
    ],
    quickPicks: [...day.slice(0, 2).map((x) => ({ x, why: why(x, 'Mentions Christmas Day') })), ...december.slice(0, 2).map((x) => ({ x, why: why(x, 'Festive menus') }))],
    sections: [
      ...(day.length
        ? [{ kind: 'pubs' as const, id: 'christmas-day', heading: 'Pubs mentioning Christmas Day lunch', intro: 'Their own websites mention eating on Christmas Day itself. Christmas Day tables usually go first, so check availability early.', pubs: day, purpose: 'christmasDay' as const }]
        : []),
      { kind: 'pubs', id: 'festive-menus', heading: 'Pubs with festive menus in December', intro: "Their websites mention a Christmas or festive menu, without saying it's served on Christmas Day.", pubs: decFull, purpose: 'lunch' },
      ...(decRest.length ? [{ kind: 'pubs' as const, id: 'more', heading: 'More pubs mentioning a Christmas menu', pubs: decRest, purpose: 'lunch' as const, compact: true }] : []),
      {
        kind: 'text',
        id: 'how-to-book',
        heading: 'How to book a Christmas lunch',
        paragraphs: ['A few things that hold for almost any pub at Christmas:'],
        bullets: [
          'Book early. December weekends and Christmas Day fill up first.',
          'Ask whether a deposit or pre-order is needed for your group, and when the final numbers are due.',
          'Check dietary options before you book: vegetarian, vegan, gluten-free and children’s menus vary from pub to pub.',
          'Confirm the times your table is held for, especially on Christmas Day.',
        ],
      },
    ],
    listed: all,
    thin: all.length < 6,
    howWeChose: `A pub is listed only if its own website mentions a Christmas or festive menu, or the pub has confirmed it with us. We checked pub websites on ${longDate(lastReviewed(all))}. Pubs are ordered by Google rating, weighted by the number of reviews.`,
    responsible: false,
    faqs: [
      {
        q: 'Do I need to book Christmas lunch in a Brighton pub?',
        a: `Almost always, yes. Most of the ${all.length} pubs listed here take bookings for festive menus, and Christmas Day tables tend to go first. Each pub sets its own deposit and pre-order rules, so check the pub's website or call before you plan around a date.`,
      },
      {
        q: 'Are there vegetarian Christmas lunches in Brighton pubs?',
        a: vegan.length
          ? `${names(vegan)} ${vegan.length === 1 ? 'mentions' : 'mention'} festive menus and also ${vegan.length === 1 ? 'confirms' : 'confirm'} vegan options on ${vegan.length === 1 ? 'its website' : 'their websites'} year-round. Ask whether that covers the Christmas menu, because festive menus are often shorter than the usual one.`
          : "We haven't confirmed vegetarian Christmas menus at any pub yet. Most festive menus include a vegetarian main, but check the pub's menu before you book.",
      },
      {
        q: 'Which Brighton pubs serve Christmas Day lunch?',
        a: day.length
          ? `${names(day, 5)} ${day.length === 1 ? 'mentions' : 'mention'} Christmas Day dining on ${day.length === 1 ? 'its' : 'their'} own website${day.length === 1 ? '' : 's'}. Tables, menus and times change every year, so check directly with the pub, and book early.`
          : "We haven't found a pub website that mentions Christmas Day lunch yet. Check back, or ask the pubs listed here directly.",
      },
      {
        q: 'How much is Christmas lunch in a Brighton pub?',
        a: "Prices vary a lot between pubs and change every year, so we don't list them. The pub's own Christmas menu, linked from each entry through its website, is the place to check. Ask about deposits and children's prices when you book.",
      },
    ],
    links: [
      { href: HUB_PATH, label: 'Christmas in Brighton' },
      { href: '/brighton-pubs-with-food', label: 'Brighton pubs with food' },
      { href: '/sunday-roast-brighton', label: 'Sunday roasts in Brighton' },
      { href: '/vegan-pubs-brighton', label: 'Vegan pubs in Brighton' },
    ],
  };
}

function partyPage(): XPage {
  const party = qualifying('party');
  const full = party.slice(0, 10);
  const rest = party.slice(10);
  const groups = qualifying('groups').filter((x) => !party.some((y) => y.pub.slug === x.pub.slug)).slice(0, 8);
  const rooms = [...party, ...groups].filter((x) => x.web?.groupBookings && /function room/i.test(x.web.groupBookings.quote));
  const music = party.filter((x) => x.pub.features.liveMusic?.value === 'yes');
  return {
    slug: 'christmas-party-brighton',
    path: `${HUB_PATH}/christmas-party-brighton`,
    keyword: 'christmas party brighton',
    title: 'Christmas Party in Brighton: Pubs for Group Bookings',
    h1: 'Christmas Party in Brighton: Pubs for Groups',
    description: `Christmas party in Brighton: a free, independent shortlist of ${party.length} pubs whose own websites mention Christmas parties, plus pubs with function rooms.`,
    kicker: `${party.length} pubs for Christmas parties`,
    image: 'christmas-party',
    short: 'Christmas parties',
    card: `A free, independent shortlist of ${party.length} pubs whose own websites mention Christmas parties, plus ${groups.length} more with function rooms or private hire.`,
    intro: [
      `Planning a Christmas party in Brighton? This is an independent shortlist, not a list of paid venues: ${party.length} pubs and bars whose own websites mention Christmas parties, and ${groups.length} more that offer private hire or a function room.`,
      'Work dos, friends’ nights out and family get-togethers all fit here. We don’t list prices, capacities or deposits unless a pub has confirmed them with us, so use the questions below when you get in touch.',
    ],
    quickPicks: full.slice(0, 4).map((x) => ({ x, why: why(x, x.web?.groupBookings ? `Christmas parties, ${groupLabel(x.web.groupBookings)}` : 'Christmas parties') })),
    sections: [
      {
        kind: 'text',
        id: 'what-to-ask',
        heading: 'What to ask a pub before booking a group',
        paragraphs: ['These are questions to ask, not facts about any pub listed here:'],
        bullets: [
          'Is there a deposit, and is it refundable if numbers drop?',
          'Is there a minimum spend for a reserved area or a private room?',
          'Do you need a pre-order, and by when?',
          'How many people can the space take, seated and standing?',
          'Is there a music curfew or a time the area must be cleared?',
          'Can you cater for dietary needs, and is there a set party menu?',
        ],
      },
      { kind: 'pubs', id: 'christmas-parties', heading: 'Pubs mentioning Christmas parties', intro: 'Their own websites mention Christmas parties. Ordered by Google rating.', pubs: full, purpose: 'party' },
      ...(rest.length ? [{ kind: 'pubs' as const, id: 'more-parties', heading: 'More pubs mentioning Christmas parties', pubs: rest, purpose: 'party' as const, compact: true }] : []),
      ...(groups.length
        ? [{ kind: 'pubs' as const, id: 'group-bookings', heading: 'Pubs with function rooms or private hire', intro: "Their websites mention a function room, private hire or group bookings, though not Christmas parties by name. Worth asking.", pubs: groups, purpose: 'groups' as const, compact: true }]
        : []),
    ],
    listed: [...party, ...groups],
    thin: party.length < 6,
    howWeChose: `A pub is listed only if its own website mentions Christmas parties, group bookings, private hire or a function room, or the pub has confirmed it with us. We checked pub websites on ${longDate(lastReviewed(party))}. Nobody paid to be included.`,
    responsible: true,
    faqs: [
      {
        q: 'How far ahead should I book a Christmas party in Brighton?',
        a: 'As early as you can. Friday and Saturday nights in December are the first to go, and many pubs open Christmas bookings in the autumn. If your date is fixed, contact two or three pubs from this list at once and compare what they offer.',
      },
      {
        q: 'Which Brighton pubs have function rooms?',
        a: rooms.length
          ? `${names(rooms, 5)} mention a function room on their own websites. Room sizes, hire fees and minimum spends aren't listed here, so ask the pub directly when you enquire about a date.`
          : "We haven't confirmed a function room at any pub yet. The pubs listed under private hire are the best place to start.",
      },
      {
        q: 'Can I have a work Christmas party in a pub in Brighton?',
        a: `Yes. ${party.length} pubs in this guide mention Christmas parties on their websites, and several mention private hire for work events. Ask about a set menu, a reserved area and how the bill can be split, since those vary from pub to pub.`,
      },
      {
        q: 'Are there pubs in Brighton with live music at Christmas?',
        a: music.length
          ? `${names(music)} ${music.length === 1 ? 'mentions' : 'mention'} Christmas parties and also ${music.length === 1 ? 'advertises' : 'advertise'} live music on ${music.length === 1 ? 'its' : 'their'} website${music.length === 1 ? '' : 's'}. Christmas line-ups change, so check what's on for your date before you book.`
          : "We don't track Christmas line-ups. Our live music guide lists pubs that advertise live music, so check their listings for December.",
      },
    ],
    links: [
      { href: HUB_PATH, label: 'Christmas in Brighton' },
      { href: '/pubs-with-live-music-in-brighton', label: 'Pubs with live music' },
      { href: '/brighton-pub-crawl', label: 'Brighton pub crawl' },
      { href: '/night-out-in-brighton', label: 'A night out in Brighton' },
      { href: '/pubs-in-the-lanes-brighton', label: 'Pubs in the Lanes' },
    ],
  };
}

function marketPage(): XPage {
  const hasSource = !!MARKET.source_url;
  const hasPoint = MARKET.lat != null && MARKET.lng != null;
  const near = hasPoint
    ? rank(pubs)
        .map((p) => ({ p, m: metres(p, { lat: MARKET.lat!, lng: MARKET.lng! }) }))
        .filter((x) => x.m <= 800)
        .sort((a, b) => a.m - b.m)
        .slice(0, 8)
        .map(({ p }) => toX(p, 'website'))
    : [];
  const name = hasSource && MARKET.name ? MARKET.name : 'the Brighton Christmas market';
  return {
    slug: 'brighton-christmas-market',
    path: `${HUB_PATH}/brighton-christmas-market`,
    keyword: 'brighton christmas market',
    title: 'Brighton Christmas Market: Where to Drink Nearby',
    h1: 'Brighton Christmas Market: Pubs and Bars Nearby',
    description:
      'Brighton Christmas market: where to find the official dates and location, plus the pubs and bars nearby for a warm drink. Independent and free.',
    kicker: 'Seasonal guide',
    short: 'Christmas market',
    card: 'Where to find the official dates and location for Brighton’s Christmas market, and the pubs nearby for a warm drink before or after.',
    intro: [
      hasSource
        ? `${name} is listed on its official page${MARKET.dates ? `: ${MARKET.dates}` : ''}${MARKET.location ? `, ${MARKET.location}` : ''}. Details can change, so check the official page before you go.`
        : "Brighton's Christmas market dates and location change from year to year, so we don't list them here. The official Visit Brighton website and Brighton & Hove City Council publish each year's details.",
      'This page is about the pubs: where to warm up with a drink near the market, ordered by distance once we have confirmed where the market is.',
    ],
    quickPicks: [],
    sections: [
      ...(near.length
        ? [{ kind: 'pubs' as const, id: 'near-market', heading: 'Pubs near the market', intro: 'Straight-line distance from the market, approx.', pubs: near, purpose: 'lunch' as const, compact: true }]
        : []),
      {
        kind: 'text',
        id: 'getting-there',
        heading: 'Getting there',
        paragraphs: [
          'Brighton station is in the city centre, and most of central Brighton is walkable from it. December weekends get busy, so allow extra time and check rail and bus updates before you travel.',
          'Our area guides cover the pubs in each part of the city: the Lanes, North Laine and Kemp Town are all close to the centre.',
        ],
      },
    ],
    listed: near,
    thin: !near.length,
    howWeChose: hasPoint
      ? `Pubs within 800 m of the market, nearest first. Distances are straight-line and approximate. Market details are from ${MARKET.source_url}.`
      : "We'll list pubs by distance once the market's location for this year is confirmed from the official source. Until then, use our area guides below.",
    responsible: false,
    faqs: [
      {
        q: 'When is the Brighton Christmas market?',
        a: hasSource && MARKET.dates
          ? `The official page lists ${MARKET.dates}. Dates and opening times can change, so check the official page before you go.`
          : "Dates change every year, so we don't list them here. Check the official Visit Brighton website or Brighton & Hove City Council for this year's dates, location and opening times before you plan a visit.",
      },
      {
        q: 'Where can I get a warm drink near the Christmas market?',
        a: near.length
          ? `The nearest pubs in our guide are ${names(near, 3)}. Each links to its own page with opening hours and a map. Hours over Christmas can differ, so check with the pub on the day.`
          : 'Central Brighton has dozens of pubs within a few minutes’ walk of the main shopping streets. Our guides to the Lanes, North Laine and Kemp Town list them with opening hours and maps.',
      },
      {
        q: 'Are there pubs near the Christmas market with outdoor seating?',
        a: near.some((x) => x.pub.features.beerGarden?.value === 'yes')
          ? `${names(near.filter((x) => x.pub.features.beerGarden?.value === 'yes'), 3)} mention a beer garden, terrace or courtyard on their websites. Heating and winter opening of outdoor areas vary, so ask the pub.`
          : 'We list beer gardens only where the pub’s own website mentions one. See our beer gardens guide, and ask the pub whether its outdoor area is open and heated in December.',
      },
    ],
    links: [
      { href: HUB_PATH, label: 'Christmas in Brighton' },
      { href: '/pubs-in-brighton', label: 'Pubs in Brighton' },
      { href: '/pubs-in-the-lanes-brighton', label: 'Pubs in the Lanes' },
      { href: '/areas/north-laine', label: 'Pubs in North Laine' },
      { href: '/kemp-town-pubs', label: 'Kemp Town pubs' },
      { href: '/best/beer-gardens', label: 'Beer gardens in Brighton' },
    ],
  };
}

function nyePage(): XPage {
  const nye = qualifying('nye');
  return {
    slug: 'new-years-eve-pubs-brighton',
    path: `${HUB_PATH}/new-years-eve-pubs-brighton`,
    keyword: 'new years eve pubs',
    title: "New Year's Eve Pubs in Brighton: Where to Drink",
    h1: "New Year's Eve Pubs in Brighton",
    description: `New Year's Eve pubs in Brighton & Hove: ${nye.length} pubs whose own websites mention New Year's Eve plans, with ratings, maps and links. Independent and free.`,
    kicker: `${nye.length} pubs with New Year's Eve plans`,
    image: 'new-years-eve',
    short: "New Year's Eve",
    card: `Pubs in Brighton and Hove whose own websites mention New Year's Eve plans, from menus to parties, with maps and links to check this year's details.`,
    intro: [
      `Looking for New Year's Eve pubs in Brighton? These are the pubs in our guide whose own websites mention New Year's Eve, whether that's a menu, a party or a night with the regulars.`,
      "We don't list ticket prices, entry fees or late opening, because they change every year and we haven't confirmed them. Each pub links to its website so you can check this year's plans.",
    ],
    quickPicks: [],
    sections: [{ kind: 'pubs', id: 'nye-pubs', heading: "Pubs mentioning New Year's Eve", intro: 'Ordered by Google rating.', pubs: nye, purpose: 'nye' }],
    listed: nye,
    thin: nye.length < 4,
    howWeChose: `A pub is listed only if its own website mentions New Year's Eve plans, or the pub has confirmed them with us. Offer small print that just excludes New Year's Eve doesn't count. We checked pub websites on ${longDate(lastReviewed(nye))}.`,
    responsible: true,
    faqs: [
      {
        q: "Which Brighton pubs are open on New Year's Eve?",
        a: nye.length
          ? `${names(nye, 5)} ${nye.length === 1 ? 'mentions' : 'mention'} New Year's Eve plans on ${nye.length === 1 ? 'its' : 'their'} own website${nye.length === 1 ? '' : 's'}. Most pubs open on New Year's Eve, but hours and entry rules vary, so check with the pub before you go.`
          : "Most pubs open on New Year's Eve, but we haven't confirmed plans at any pub yet. Check with the pub directly before you go.",
      },
      {
        q: "Do I need tickets for New Year's Eve in a Brighton pub?",
        a: "Some pubs sell tickets or take bookings for New Year's Eve and others are walk-in, and it changes from year to year. We don't list ticket details unless a pub has confirmed them, so check the pub's website or call ahead before the night.",
      },
      {
        q: 'Where can I watch the fireworks or the countdown in Brighton?',
        a: "We don't have confirmed details of public fireworks or countdown events, so we don't list them. Check Visit Brighton or Brighton & Hove City Council nearer the date. Our beach bars guide lists the pubs and bars on the seafront.",
      },
    ],
    links: [
      { href: HUB_PATH, label: 'Christmas in Brighton' },
      { href: '/night-out-in-brighton', label: 'A night out in Brighton' },
      { href: '/brighton-beach-bars', label: 'Beach bars in Brighton' },
      { href: '/brighton-pub-crawl', label: 'Brighton pub crawl' },
    ],
  };
}

export const SPOKES: XPage[] = [lunchPage(), partyPage(), marketPage(), nyePage()];
export const getSpoke = (slug: string) => SPOKES.find((s) => s.slug === slug);

// Hub: a short list of pubs that fit a Christmas visit (any Christmas evidence), at most two per area.
function hubPage(): XPage {
  const any = rank(pubs)
    .map((p) => ({ p, b: (['lunch', 'party', 'nye'] as Purpose[]).map((k) => qualifies(p.slug, k)).find(Boolean) }))
    .filter((x): x is { p: Pub; b: 'manual' | 'website' } => !!x.b)
    .map(({ p, b }) => toX(p, b));
  const perArea: Record<string, number> = {};
  const festive = any.filter((x) => (perArea[x.pub.area] = (perArea[x.pub.area] || 0) + 1) <= 2).slice(0, 8);
  const [lunch] = SPOKES;
  const day = qualifying('christmasDay');
  return {
    slug: '',
    path: HUB_PATH,
    keyword: 'brighton christmas',
    title: 'Christmas in Brighton: Pubs, Lunches and Parties',
    h1: 'Christmas in Brighton: Pubs, Lunches and Parties',
    description: `Brighton Christmas guide to pubs: ${lunch.listed.length} with festive menus, ${qualifying('party').length} for Christmas parties, New Year's Eve and the market, all checked against pub websites.`,
    kicker: `Christmas ${YEAR}`,
    image: 'christmas',
    short: 'Christmas',
    card: '',
    intro: [
      `A Brighton Christmas usually involves a pub at some point: a festive lunch, the work party, a drink after the shops, or seeing the new year in. This is our guide to Christmas pubs in Brighton and Hove for ${YEAR}.`,
      `Every pub here is listed because its own website mentions the service, or the pub confirmed it with us. We don't publish menus or prices we haven't checked, so each entry links to the pub's website for this year's details.`,
    ],
    quickPicks: [],
    sections: [{ kind: 'pubs', id: 'festive-drink', heading: 'Pubs that suit a festive drink', intro: 'Pubs whose own websites mention Christmas menus, parties or New Year’s Eve, ordered by Google rating, at most two from each area.', pubs: festive, purpose: 'hub', words: [30, 50] }],
    listed: festive,
    thin: festive.length < 6,
    howWeChose: `We only list a pub on our Christmas pages when its own website mentions Christmas menus, Christmas parties, group bookings or New Year's Eve, or when the pub has confirmed it with us. We checked pub websites on ${longDate(lastReviewed(any))}, and we'll update the pages as pubs confirm details.`,
    responsible: false,
    faqs: [
      {
        q: 'What is there to do in Brighton at Christmas?',
        a: `For pubs, there's plenty: ${lunch.listed.length} pubs in our guide mention festive menus and ${qualifying('party').length} mention Christmas parties. For markets, ice skating and events, check Visit Brighton for this year's listings, since dates and venues change every year.`,
      },
      {
        q: 'Are Brighton pubs open on Christmas Day?',
        a: day.length
          ? `Some are. ${names(day, 4)} mention Christmas Day dining on their own websites. Many other pubs open for shorter hours or close, and the hours on Google often don't cover Christmas Day, so check with the pub before you go.`
          : "Some are, but hours on Christmas Day are usually shorter and Google's listed hours often don't cover it. Check with the pub before you go.",
      },
      {
        q: 'Do Brighton pubs do Christmas lunch?',
        a: `Yes. ${lunch.listed.length} pubs in our guide mention festive menus on their own websites, and ${day.length} mention Christmas Day itself. Our Christmas lunch guide lists them all, with links to each pub's website for this year's menu and booking.`,
      },
      {
        q: 'Where can I find a cosy pub in Brighton in winter?',
        a: "We don't rate cosiness, because we only list what pubs confirm. Our guides to pubs in the Lanes and Kemp Town are a good start, since both areas have many small, traditional pubs close together. Each pub page lists its hours and facilities.",
      },
    ],
    links: [
      ...SPOKES.map((s) => ({ href: s.path, label: s.h1.replace(/:.*/, '') })),
      { href: '/pubs-in-brighton', label: 'Pubs in Brighton' },
      { href: '/pubs-in-the-lanes-brighton', label: 'Pubs in the Lanes' },
      { href: '/kemp-town-pubs', label: 'Kemp Town pubs' },
    ],
  };
}
export const HUB: XPage = hubPage();
export const CHRISTMAS_PAGES = [HUB, ...SPOKES];

// ---- Season ---------------------------------------------------------------------------------------
/** The homepage block shows in November and December. It is removed at midnight on 1 January (UK time = UTC in winter). */
export function christmasSeason(now = new Date()) {
  const m = now.getUTCMonth();
  const year = m === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
  return { inSeason: m === 10 || m === 11, endsAt: Date.UTC(year + 1, 0, 1) };
}

