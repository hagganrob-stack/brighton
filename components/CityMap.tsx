import type { Pub } from '@/lib/data';
import { frame, highlightSet, MAP_W } from '@/lib/citymap';

// A data-drawn map of every pub in the guide. The 185 dots are a static, cached SVG file (/maps/*.svg);
// only the highlighted pub or area is drawn inline on top, so pages stay light. Decorative (aria-hidden):
// the same information is available as text and links on every page that uses it.
export function CityMap({
  id,
  highlightPub,
  highlightArea,
  labels = false,
  eager = false,
  className = '',
}: {
  id: string;
  highlightPub?: Pub;
  highlightArea?: string;
  /** Use the labelled, glowing home-page variant. */
  labels?: boolean;
  /** Load immediately (use when the map is above the fold). */
  eager?: boolean;
  className?: string;
}) {
  const full = highlightPub?.area === 'rottingdean' || highlightArea === 'rottingdean';
  const { H, x, y } = frame(full);
  const lit = highlightSet(highlightPub, highlightArea);
  const src = labels ? '/maps/home.svg' : full ? '/maps/full.svg' : '/maps/central.svg';
  return (
    <div className={`relative ${className}`} style={{ aspectRatio: `${MAP_W} / ${H}` }} aria-hidden="true">
      <img src={src} alt="" width={MAP_W} height={H} loading={eager ? 'eager' : 'lazy'} decoding="async" className="absolute inset-0 h-full w-full" />
      {lit.length > 0 && (
        <svg viewBox={`0 0 ${MAP_W} ${H}`} className="absolute inset-0 h-full w-full" focusable="false">
          <defs>
            <radialGradient id={`${id}-glow`}>
              <stop offset="0%" stopColor="#0057b8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0057b8" stopOpacity="0" />
            </radialGradient>
          </defs>
          {lit.map((p) => (
            <g key={p.slug}>
              <circle cx={x(p.lng)} cy={y(p.lat)} r={highlightPub ? 46 : 34} fill={`url(#${id}-glow)`} />
              {highlightPub && <circle className="pulse-ring" cx={x(p.lng)} cy={y(p.lat)} r={14} fill="none" stroke="#0057b8" strokeWidth={3} />}
              <circle cx={x(p.lng)} cy={y(p.lat)} r={highlightPub ? 10 : 7} fill="#0057b8" stroke="#ffffff" strokeWidth={3} />
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
