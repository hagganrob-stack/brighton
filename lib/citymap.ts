// Shared projection for the data-drawn city map (used by the static SVG route and the overlay component).
import { pubs, areas, pubsInArea, type Pub } from './data';

export const MAP_W = 1000;
const COS_LAT = Math.cos((50.83 * Math.PI) / 180);
// Nudge labels in the dense centre so they don't collide (map units).
const LABEL_OFFSET: Record<string, [number, number]> = { seafront: [-30, 62], 'the-lanes': [-48, 6], kemptown: [40, 4], 'north-laine': [0, -4] };

export type MapVariant = 'central' | 'full' | 'home';
export const MAP_VARIANTS: MapVariant[] = ['central', 'full', 'home'];

export function frame(full: boolean) {
  const list = full ? pubs : pubs.filter((p) => p.area !== 'rottingdean');
  const pad = 0.0035;
  const lats = list.map((p) => p.lat);
  const lngs = list.map((p) => p.lng);
  const b = { minLat: Math.min(...lats) - pad, maxLat: Math.max(...lats) + pad, minLng: Math.min(...lngs) - pad, maxLng: Math.max(...lngs) + pad };
  const H = Math.round((MAP_W * (b.maxLat - b.minLat)) / ((b.maxLng - b.minLng) * COS_LAT));
  return {
    list,
    H,
    x: (lng: number) => +(((lng - b.minLng) / (b.maxLng - b.minLng)) * MAP_W).toFixed(1),
    y: (lat: number) => +(((b.maxLat - lat) / (b.maxLat - b.minLat)) * H).toFixed(1),
  };
}

/** Full SVG document for /maps/<variant>.svg: every pub as a dot (plus halos and labels on 'home'). */
export function citySvg(variant: MapVariant) {
  const home = variant === 'home';
  const { list, H, x, y } = frame(variant === 'full');
  const font = "font-family='ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif' font-weight='700'";
  const parts: string[] = [];
  parts.push(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${MAP_W} ${H}' width='${MAP_W}' height='${H}'>`);
  parts.push(`<defs><radialGradient id='h'><stop offset='0' stop-color='#0057b8' stop-opacity='.10'/><stop offset='1' stop-color='#0057b8' stop-opacity='0'/></radialGradient></defs>`);
  for (const p of list) parts.push(`<circle cx='${x(p.lng)}' cy='${y(p.lat)}' r='${home ? 6 : 4.5}' fill='#0057b8' opacity='${home ? 0.6 : 0.28}'/>`);
  if (home) {
    for (const a of areas) {
      const ps = pubsInArea(a.slug).filter((p) => list.includes(p));
      if (!ps.length) continue;
      const cx = ps.reduce((s, p) => s + x(p.lng), 0) / ps.length + (LABEL_OFFSET[a.slug]?.[0] ?? 0);
      const cy = ps.reduce((s, p) => s + y(p.lat), 0) / ps.length - 16 + (LABEL_OFFSET[a.slug]?.[1] ?? 0);
      parts.push(`<text x='${cx.toFixed(1)}' y='${cy.toFixed(1)}' text-anchor='middle' fill='#0b1631' font-size='24' ${font} stroke='#f8fafc' stroke-width='7' stroke-linejoin='round' paint-order='stroke'>${a.name.replace(/&/g, '&amp;')}</text>`);
    }
  }
  if (variant !== 'full') parts.push(`<text x='${MAP_W - 12}' y='${H - 14}' text-anchor='end' fill='#64748b' font-size='22' ${font}>Rottingdean →</text>`);
  parts.push('</svg>');
  return parts.join('');
}

export function highlightSet(highlightPub?: Pub, highlightArea?: string) {
  return highlightPub ? [highlightPub] : highlightArea ? pubs.filter((p) => p.area === highlightArea) : [];
}
