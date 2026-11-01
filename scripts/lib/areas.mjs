// Areas we search and assign pubs to. Centroids are approximate and used for
// (a) biasing the Google Maps search and (b) assigning each pub to its nearest area.
import fs from 'node:fs';

// Shared with the site (lib/data.ts). Edit data/areas.json to add or move areas.
export const AREAS = JSON.parse(fs.readFileSync(new URL('../../data/areas.json', import.meta.url), 'utf8'));

// Seafront is a long strip, so a centroid is a poor fit: assign by street instead.
const SEAFRONT_STREETS =
  /\b(king'?s r(oa)?d arches|madeira dr(ive)?|grand junction r(oa)?d|palace pier|brighton pier|lower promenade|king'?s r(oa)?d)\b/i;

// Max distance (km) from the nearest centroid; anything further is out of scope.
const MAX_KM = 1.6;

export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function assignArea({ lat, lng, address }) {
  if (address && SEAFRONT_STREETS.test(address)) return 'seafront';
  let best = null;
  for (const a of AREAS) {
    if (a.slug === 'seafront') continue;
    const d = haversineKm({ lat, lng }, a);
    if (!best || d < best.d) best = { slug: a.slug, d };
  }
  return best && best.d <= MAX_KM ? best.slug : null;
}
