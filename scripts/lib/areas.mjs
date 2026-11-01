// Areas we search and assign pubs to. Centroids are approximate and used for
// (a) biasing the Google Maps search and (b) assigning each pub to its nearest area.
export const AREAS = [
  { slug: 'kemptown', name: 'Kemptown', lat: 50.8195, lng: -0.127 },
  { slug: 'the-lanes', name: 'The Lanes', lat: 50.8222, lng: -0.1405 },
  { slug: 'north-laine', name: 'North Laine', lat: 50.8268, lng: -0.1385 },
  { slug: 'hanover', name: 'Hanover', lat: 50.8282, lng: -0.1265 },
  { slug: 'seven-dials', name: 'Seven Dials', lat: 50.8308, lng: -0.1478 },
  { slug: 'london-road', name: 'London Road', lat: 50.8345, lng: -0.1368 },
  { slug: 'preston-park', name: 'Preston Park', lat: 50.8435, lng: -0.1485 },
  { slug: 'fiveways', name: 'Fiveways', lat: 50.8458, lng: -0.1335 },
  { slug: 'lewes-road', name: 'Lewes Road', lat: 50.8385, lng: -0.1195 },
  { slug: 'brunswick', name: 'Brunswick', lat: 50.8248, lng: -0.1612 },
  { slug: 'hove', name: 'Hove', lat: 50.8298, lng: -0.1725 },
  { slug: 'seafront', name: 'Seafront', lat: 50.8197, lng: -0.1415 },
  { slug: 'rottingdean', name: 'Rottingdean', lat: 50.8085, lng: -0.0575 },
];

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
