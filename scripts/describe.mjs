#!/usr/bin/env node
// Phase 1c: derive nearby pubs and write a 150–250 word description per pub.
// Descriptions are assembled ONLY from collected fields (Google Maps listing + website
// feature checks) and values computed from them (distances, hour groupings, rankings).
// No free text from websites, Google or reviews is reused.
import { AREAS, haversineKm } from './lib/areas.mjs';
import { readJson, writeJson } from './lib/util.mjs';
import { streetLine } from './lib/address.mjs';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const areaName = (slug) => AREAS.find((a) => a.slug === slug)?.name || slug;

// Deterministic per-pub choice so wording varies across pages but is stable between runs.
function picker(seed) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (options) => {
    h = Math.imul(h ^ (h >>> 13), 2246822507) >>> 0;
    return options[h % options.length];
  };
}

function listJoin(items, conj = 'and') {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${conj} ${items[items.length - 1]}`;
}

function street(pub) {
  // "74 St James's St" -> "St James's Street" (house number dropped, abbreviation expanded)
  const s = (pub.street || '').replace(/^\d+[a-z]?(\s*[-–]\s*\d+[a-z]?)?\s+/i, '').trim();
  if (!s || /^\d/.test(s)) return null;
  const ABBR = { St: 'Street', Rd: 'Road', Ave: 'Avenue', Pl: 'Place', Sq: 'Square', Terr: 'Terrace', Ter: 'Terrace', Ln: 'Lane', Dr: 'Drive', Gdns: 'Gardens', Pde: 'Parade', Cres: 'Crescent', Gr: 'Grove' };
  return s.replace(/\b([A-Z][a-z]{1,3})\.?$/, (m, w) => ABBR[w] || m);
}

function typePhrase(pub) {
  const t = (pub.googleType || 'Pub').toLowerCase();
  if (t === 'pub') return 'pub';
  if (t === 'bar') return 'bar';
  return t; // cocktail bar, gastropub, wine bar, gay bar
}

// ---- Opening hours ---------------------------------------------------------------
function normHours(s) {
  return (s || '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function closingMinutes(range) {
  // Returns minutes after midnight of the opening day; >1440 means after midnight.
  const r = normHours(range).toLowerCase();
  if (r.includes('24 hours')) return 1440;
  const m = r.match(/[–-]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  let h = +m[1] % 12;
  const min = +(m[2] || 0);
  const ap = m[3] || 'pm';
  if (ap === 'pm') h += 12;
  let total = h * 60 + min;
  if (ap === 'am' && total < 6 * 60) total += 1440; // e.g. 1 am = after midnight
  if (ap === 'am' && h === 0) total = 1440 + min; // 12 am
  return total;
}

function hoursSummary(pub, pick) {
  const oh = pub.openingHours;
  if (!oh) return null;
  const days = DAYS.map((d) => ({ d, h: normHours(oh[d]) || null }));
  const known = days.filter((x) => x.h);
  if (!known.length) return null;

  // Group consecutive days that share identical hours.
  const groups = [];
  for (const x of days) {
    const last = groups[groups.length - 1];
    if (last && last.h === x.h) last.days.push(x.d);
    else groups.push({ h: x.h, days: [x.d] });
  }
  const label = (g) =>
    g.days.length === 1 ? cap(g.days[0]) : `${cap(g.days[0])} ${g.days.length === 2 ? 'and' : 'to'} ${cap(g.days[g.days.length - 1])}`;
  const parts = groups.filter((g) => g.h).map((g) => (/closed/i.test(g.h) ? `closed on ${label(g)}` : `${label(g)} ${g.h}`));

  const closedDays = days.filter((x) => x.h && /closed/i.test(x.h)).map((x) => cap(x.d));
  const openDays = days.filter((x) => x.h && !/closed/i.test(x.h));
  const sentences = [];
  if (openDays.length === 7) sentences.push(pick(['It is listed as open seven days a week.', 'Its Google listing shows it open every day of the week.']));
  else if (closedDays.length) sentences.push(`Its Google listing shows it closed on ${listJoin(closedDays)}.`);

  sentences.push(`${pick(['Listed opening hours are', 'The listed hours are', 'Opening times on its listing are'])}: ${parts.join('; ')}.`);

  const latest = openDays
    .map((x) => ({ d: x.d, c: closingMinutes(x.h) }))
    .filter((x) => x.c != null)
    .sort((a, b) => b.c - a.c);
  if (latest.length && latest[0].c > 1440) {
    const lateDays = latest.filter((x) => x.c === latest[0].c).map((x) => cap(x.d) + 's');
    sentences.push(`The latest finish is on ${listJoin(lateDays)}, when it is listed as open past midnight.`);
  }
  sentences.push(pick(['Hours can change, so it is worth checking before you set off.', 'Opening times do change, so check with the pub before travelling.']));
  return sentences.join(' ');
}

// ---- Features ----------------------------------------------------------------------
const PHRASES = {
  beerGarden: { yes: 'has a beer garden or outdoor space', no: 'does not have a beer garden', ask: 'outdoor seating' },
  dogFriendly: { yes: 'welcomes dogs', no: 'does not allow dogs', ask: 'dogs' },
  liveMusic: { yes: 'hosts live music', no: 'does not host live music', ask: 'live music' },
  pubQuiz: { yes: 'runs a pub quiz', no: 'does not run a quiz', ask: 'a pub quiz' },
  sundayRoast: { yes: 'serves Sunday roasts', no: 'does not serve Sunday roasts', ask: 'Sunday roasts' },
  food: { yes: 'serves food', no: 'does not serve food', ask: 'food' },
  liveSport: { yes: 'shows live sport', no: 'does not show live sport', ask: 'live sport' },
  realAle: { yes: 'serves real ale', no: 'does not serve real ale', ask: 'real ale' },
  stepFree: { yes: 'has step-free access', no: 'does not have step-free access', ask: 'step-free access' },
};

function featureParagraph(pub, pick) {
  const f = pub.features || {};
  const yes = Object.keys(PHRASES).filter((k) => f[k]?.value === 'yes');
  const no = Object.keys(PHRASES).filter((k) => f[k]?.value === 'no');
  const unknown = Object.keys(PHRASES).filter((k) => !f[k] || f[k].value === 'unknown');
  // Sunday roasts imply food; avoid saying both.
  const yesPhr = yes.filter((k) => !(k === 'food' && yes.includes('sundayRoast'))).map((k) => PHRASES[k].yes);
  const out = [];
  const src = pub.featuresSource || '';

  if (yesPhr.length) {
    out.push(`${pick(['According to its own website,', 'Its own website says that', 'Going by its website,'])} ${pub.name} ${listJoin(yesPhr)}.`);
    if (yes.includes('pubQuiz')) {
      const days = f.pubQuiz.days || [];
      if (days.length) out.push(`The quiz is mentioned for ${listJoin(days.map((d) => d + 's'), 'or')}.`);
      else out.push('The website does not say which night the quiz is held.');
    }
  } else if (/own website/.test(src)) {
    out.push(`We checked ${pub.name}'s website, but it does not clearly confirm any of the facilities this guide tracks.`);
  } else if (/no website/.test(src)) {
    out.push(`${pub.name} does not list a website on Google Maps, so we have not been able to confirm its facilities.`);
  } else if (/social/.test(src)) {
    out.push(`${pub.name} links to a social media page rather than its own website, so its facilities have not been confirmed.`);
  } else {
    out.push(`We could not read ${pub.name}'s website, so its facilities have not been confirmed.`);
  }
  if (no.length) out.push(`The site also states that it ${listJoin(no.map((k) => PHRASES[k].no))}.`);
  if (unknown.length && unknown.length < 9 && yesPhr.length) {
    const asks = unknown.map((k) => PHRASES[k].ask);
    out.push(`It does not mention ${listJoin(asks, 'or')}, so ask the pub if any of those matter to you.`);
  }
  return out.join(' ');
}

// ---- Rating ------------------------------------------------------------------------
function ratingSentence(pub, stats, pick) {
  if (pub.rating == null) return null;
  const n = pub.reviewCount || 0;
  let s = `${pick(['On Google Maps it has', 'It holds', 'Google Maps shows'])} an average rating of ${pub.rating.toFixed(1)} from ${n.toLocaleString('en-GB')} review${n === 1 ? '' : 's'}`;
  const rank = stats.ratings.filter((r) => r > pub.rating).length;
  const pct = rank / stats.ratings.length;
  if (pct < 0.15) s += ', which puts it among the highest-rated venues in this guide';
  else if (pct > 0.85) s += ', which is towards the lower end of the venues in this guide';
  if (n >= stats.reviewP90) s += pick(['. That is one of the larger review counts of any pub here', '. Few places in this guide have more reviews']);
  return s + '.';
}

// ---- Main --------------------------------------------------------------------------
function describe(pub, all, stats) {
  const pick = picker(pub.slug);
  const area = areaName(pub.area);
  const st = street(pub);
  const type = typePhrase(pub);
  const article = /^[aeiou]/i.test(type) ? 'an' : 'a';
  const areaCount = all.filter((p) => p.area === pub.area).length;

  const intro = [];
  const where = st ? `on ${st} in ${area}` : `in ${area}`;
  intro.push(
    pick([
      `${pub.name} is ${article} ${type} ${where}${pub.area === 'hove' ? '' : ', Brighton & Hove'}${pub.postcode ? ` (${pub.postcode})` : ''}.`,
      `You will find ${pub.name}, ${article} ${type}, ${where}${pub.postcode ? `, postcode ${pub.postcode}` : ''}.`,
      `${pub.name} is listed on Google Maps as ${article} ${type} and sits ${where}${pub.postcode ? ` (${pub.postcode})` : ''}.`,
    ]),
  );
  intro.push(`It is one of ${areaCount} ${areaCount === 1 ? 'venue' : 'venues'} in ${area} included in this guide.`);
  const rating = ratingSentence(pub, stats, pick);
  if (rating) intro.push(rating);

  const hours = hoursSummary(pub, pick);
  const features = featureParagraph(pub, pick);

  const contact = [];
  if (pub.phone && pub.website && !/facebook|instagram/i.test(pub.website)) contact.push(`To book or ask a question, call ${pub.phone} or use the contact details on its website.`);
  else if (pub.phone) contact.push(`To book or ask a question, call ${pub.phone}.`);
  else if (pub.website) contact.push('There is no phone number on its listing, so its online pages are the best way to get in touch.');

  const near = (pub.nearby || []).slice(0, 3).map((n) => {
    const p = all.find((x) => x.slug === n.slug);
    return `${p.name} (about ${n.distanceM < 1000 ? `${Math.round(n.distanceM / 10) * 10} m` : `${(n.distanceM / 1000).toFixed(1)} km`})`;
  });
  if (near.length) contact.push(`${pick(['Other pubs nearby in this guide include', 'If you want to carry on, the closest pubs in this guide are', 'Nearby, you can also try'])} ${listJoin(near)}, measured in a straight line.`);

  let paras = [intro.join(' '), features, hours, contact.join(' ')].filter(Boolean);
  let text = paras.join('\n\n');
  const words = () => text.split(/\s+/).length;

  // Keep within 150–250 words using only factual material.
  if (words() > 250 && hours) {
    paras = paras.map((p) => (p === hours ? hours.replace(/ (Hours can change|Opening times do change)[^.]*\./, '') : p));
    text = paras.join('\n\n');
  }
  if (words() > 250) {
    paras = paras.map((p) => p.replace(/ It does not mention [^.]*\./, ''));
    text = paras.join('\n\n');
  }
  if (words() < 150) {
    const extra = [];
    const more = (pub.nearby || []).slice(3, 5).map((n) => all.find((x) => x.slug === n.slug).name);
    if (more.length) extra.push(`${listJoin(more)} ${more.length > 1 ? 'are' : 'is'} also within walking distance.`);
    extra.push(`You can see its exact location on the map on this page or open it in Google Maps for directions.`);
    if (pub.detailsCheckedAt) extra.push(`The details on this page were last checked in ${new Date(pub.detailsCheckedAt).toLocaleString('en-GB', { month: 'long', year: 'numeric' })}.`);
    paras[paras.length - 1] += ' ' + extra.join(' ');
    text = paras.join('\n\n');
  }
  return text;
}

async function main() {
  const pubs = await readJson('data/pubs.json');
  for (const p of pubs) p.street = streetLine(p.address, p.name);
  // Nearby: 5 closest other pubs within 2 km.
  for (const p of pubs) {
    p.nearby = pubs
      .filter((q) => q !== p)
      .map((q) => ({ slug: q.slug, distanceM: Math.round(haversineKm(p, q) * 1000) }))
      .filter((q) => q.distanceM <= 2000)
      .sort((a, b) => a.distanceM - b.distanceM)
      .slice(0, 5);
  }
  const ratings = pubs.map((p) => p.rating).filter((r) => r != null);
  const reviews = pubs.map((p) => p.reviewCount || 0).sort((a, b) => a - b);
  const stats = { ratings, reviewP90: reviews[Math.floor(reviews.length * 0.9)] };

  const counts = [];
  for (const p of pubs) {
    p.description = describe(p, pubs, stats);
    counts.push(p.description.split(/\s+/).length);
  }
  await writeJson('data/pubs.json', pubs);
  const out = counts.filter((n) => n < 150 || n > 250).length;
  console.log(`Descriptions: min ${Math.min(...counts)}, max ${Math.max(...counts)}, avg ${Math.round(counts.reduce((a, b) => a + b) / counts.length)} words; ${out} outside 150–250.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
