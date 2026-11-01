#!/usr/bin/env node
// Phase 1a: collect pubs & bars from SerpApi's Google Maps engine, area by area.
// Usage: SERPAPI_KEY=... node scripts/collect.mjs [--refresh]
// Raw responses are cached in data/raw/ (git-ignored) so re-runs cost no searches.
import fs from 'node:fs/promises';
import path from 'node:path';
import { AREAS, assignArea } from './lib/areas.mjs';
import { slugify, extractPostcode, readJson, writeJson } from './lib/util.mjs';

const KEY = process.env.SERPAPI_KEY;
if (!KEY) {
  console.error('SERPAPI_KEY is not set.');
  process.exit(1);
}
const REFRESH = process.argv.includes('--refresh');
const RAW_DIR = 'data/raw';
const OUT = 'data/pubs.json';

// Queries per area: [query, pages]. 20 results per page.
const QUERIES = [
  ['pub', 2],
  ['bar', 1],
];

const ALLOWED_PRIMARY =
  /\b(pub|gastropub|bar|tavern|inn|brewpub|beer hall|beer garden|cocktail bar|wine bar|sports bar|irish pub|live music bar|lgbtq\+? bar|gay bar|cider bar|tap ?room|beer)\b/i;
const EXCLUDED_PRIMARY =
  /\b(restaurant|cafe|café|coffee|hotel|night ?club|club|juice|snack|sushi|salad|espresso|shop|store|off licen[cs]e|liquor|takeaway|bar & grill|grill|karaoke|bowling|casino|hostel|guest house|b&b|bed & breakfast|venue|theatre|cinema)\b/i;

function isPubOrBar(r) {
  const primary = r.type || '';
  if (!ALLOWED_PRIMARY.test(primary)) return false;
  if (EXCLUDED_PRIMARY.test(primary) && !/\b(pub|bar)$/i.test(primary)) return false;
  if (/permanently closed|temporarily closed/i.test(r.open_state || r.hours || '')) return false;
  // Names that say the venue is primarily a café/restaurant/grill rather than a pub or bar.
  if (/\b(caf[eé]|grill|restaurant|clubhouse|kitchen)\b/i.test(r.title) && !/\b(pub|inn|tavern|arms)\b/i.test(r.title)) return false;
  // Pub-company head offices registered at one of their pubs' addresses.
  if (/\b(pub company|pub co\.?|pubs? (ltd|limited|group)|taverns ltd|brewery ltd)\b/i.test(r.title)) return false;
  // Very few reviews usually means a stale, unverified or private listing.
  if (!r.reviews || r.reviews < 10) return false;
  return true;
}

async function search(area, q, start) {
  const file = path.join(RAW_DIR, `${area.slug}__${q}__${start}.json`);
  if (!REFRESH) {
    const cached = await readJson(file);
    if (cached) return cached;
  }
  const u = new URL('https://serpapi.com/search.json');
  const params = {
    engine: 'google_maps',
    type: 'search',
    q,
    ll: `@${area.lat},${area.lng},16z`,
    hl: 'en',
    gl: 'uk',
    start: String(start),
    api_key: KEY,
  };
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const res = await fetch(u);
  if (!res.ok) throw new Error(`SerpApi ${res.status} for ${area.slug}/${q}/${start}`);
  const data = await res.json();
  if (data.error && !/hasn't returned any results/i.test(data.error)) throw new Error(data.error);
  // Never persist the key: SerpApi echoes request params in search_parameters only (no key), but strip to be safe.
  delete data.search_metadata?.json_endpoint;
  await writeJson(file, data);
  console.log(`  fetched ${area.slug} "${q}" start=${start}: ${(data.local_results || []).length}`);
  return data;
}

function toPub(r) {
  const lat = r.gps_coordinates?.latitude;
  const lng = r.gps_coordinates?.longitude;
  return {
    placeId: r.place_id,
    name: r.title.trim(),
    googleType: r.type || null,
    googleTypes: r.types || [],
    address: r.address || null,
    postcode: extractPostcode(r.address),
    lat,
    lng,
    phone: r.phone || null,
    website: r.website || null,
    openingHours: r.operating_hours || null,
    rating: r.rating ?? null,
    reviewCount: r.reviews ?? null,
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.title)}&query_place_id=${r.place_id}`,
  };
}

async function main() {
  await fs.mkdir(RAW_DIR, { recursive: true });
  const byId = new Map();
  const rejected = new Map();

  for (const area of AREAS) {
    console.log(`Area: ${area.name}`);
    for (const [q, pages] of QUERIES) {
      for (let p = 0; p < pages; p++) {
        const data = await search(area, q, p * 20);
        const results = data.local_results || [];
        for (const r of results) {
          if (!r.place_id || byId.has(r.place_id)) continue;
          if (!isPubOrBar(r)) {
            rejected.set(r.place_id, `${r.title} [${r.type}, ${r.reviews ?? 0} reviews]`);
            continue;
          }
          const pub = toPub(r);
          if (!/^BN[123]\b/.test(pub.postcode || '')) {
            rejected.set(r.place_id, `${r.title} [postcode ${pub.postcode}]`);
            continue;
          }
          pub.area = assignArea(pub);
          if (!pub.area) {
            rejected.set(r.place_id, `${r.title} [outside areas]`);
            continue;
          }
          rejected.delete(r.place_id);
          byId.set(r.place_id, pub);
        }
        if (results.length < 20) break; // no more pages
      }
    }
  }

  // Preserve enrichment/description/custom fields from a previous run.
  const previous = new Map(((await readJson(OUT)) || []).map((p) => [p.placeId, p]));

  const used = new Set();
  const pubs = [...byId.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((pub) => {
      let slug = slugify(pub.name);
      if (used.has(slug)) slug = `${slug}-${pub.area}`;
      let n = 2;
      while (used.has(slug)) slug = `${slugify(pub.name)}-${n++}`;
      used.add(slug);
      const prev = previous.get(pub.placeId) || {};
      return { ...prev, slug: prev.slug || slug, ...pub, collectedAt: new Date().toISOString().slice(0, 10) };
    });

  await writeJson(OUT, pubs);
  await writeJson('data/rejected.json', [...rejected.values()].sort());
  console.log(`\nSaved ${pubs.length} pubs to ${OUT} (${rejected.size} rejected, see data/rejected.json)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
