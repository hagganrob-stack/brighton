import Link from 'next/link';
import { type Pub, type FeatureKey, FEATURE_LABELS, areaName, addressLines, yesFeatures, formatDistance } from '@/lib/data';
import { breadcrumbSchema, type Crumb } from '@/lib/schema';

export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with < escaped is safe to inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      {crumbs.length > 1 && (
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink/70">
          <ol className="flex flex-wrap items-center gap-x-1.5">
            {crumbs.map((c, i) => (
              <li key={c.path} className="flex items-center gap-x-1.5">
                {i > 0 && <span aria-hidden="true">›</span>}
                {i === crumbs.length - 1 ? (
                  <span aria-current="page" className="text-ink">
                    {c.name}
                  </span>
                ) : (
                  <Link href={c.path} className="underline decoration-accent/60 underline-offset-2 hover:text-brand">
                    {c.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
    </>
  );
}

const FEATURE_ICON: Record<FeatureKey, string> = {
  beerGarden: '❀',
  dogFriendly: '🐾',
  liveMusic: '♪',
  pubQuiz: '?',
  sundayRoast: '◆',
  food: '◆',
  liveSport: '⚽',
  realAle: '◉',
  stepFree: '♿',
};

export function FeatureChip({ k }: { k: FeatureKey }) {
  return (
    <li className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-light px-2 py-0.5 text-xs font-medium text-brand">
      <span aria-hidden="true">{FEATURE_ICON[k]}</span>
      {FEATURE_LABELS[k]}
    </li>
  );
}

export function PubCard({ pub, distanceM, rank, headingLevel = 3 }: { pub: Pub; distanceM?: number; rank?: number; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as 'h2' | 'h3';
  const feats = yesFeatures(pub).filter((k) => k !== 'food' || !yesFeatures(pub).includes('sundayRoast'));
  const { street } = addressLines(pub);
  return (
    <article className="group relative flex flex-col rounded-lg border border-brand/15 bg-paper p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-lg bg-brand" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3 pt-1">
        <H className="font-serif text-xl font-bold leading-tight text-brand">
          <Link href={`/pubs/${pub.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {rank != null && <span className="mr-1 text-accent">{rank}.</span>}
            {pub.name}
          </Link>
        </H>
        {pub.rating != null && (
          <p className="shrink-0 rounded bg-brand px-1.5 py-0.5 text-sm font-semibold text-light" title={`${pub.reviewCount} Google reviews`}>
            <span className="sr-only">Google rating </span>
            {pub.rating.toFixed(1)}
            <span aria-hidden="true">★</span>
          </p>
        )}
      </div>
      <p className="mt-1 text-sm text-ink/75">
        {street} · {areaName(pub.area)}
        {distanceM != null && <> · {formatDistance(distanceM)} away</>}
      </p>
      {feats.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Confirmed facilities">
          {feats.slice(0, 4).map((k) => (
            <FeatureChip key={k} k={k} />
          ))}
          {feats.length > 4 && <li className="text-xs text-ink/75 self-center">+{feats.length - 4} more</li>}
        </ul>
      )}
    </article>
  );
}

export function PubGrid({ pubs, ranked, headingLevel }: { pubs: Pub[]; ranked?: boolean; headingLevel?: 2 | 3 }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {pubs.map((p, i) => (
        <li key={p.slug} className="flex">
          <div className="w-full">
            <PubCard pub={p} rank={ranked ? i + 1 : undefined} headingLevel={headingLevel} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function LinkPills({ links, label }: { links: { href: string; text: string; count?: number }[]; label: string }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label={label}>
      {links.map((l) => (
        <li key={l.href}>
          <Link
            href={l.href}
            className="inline-block rounded-full border-2 border-brand px-3 py-1 text-sm font-semibold text-brand transition hover:bg-brand hover:text-light"
          >
            {l.text}
            {l.count != null && <span className="ml-1 font-normal">({l.count})</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function OsmMap({ lat, lng, title, zoomDelta = 0.004 }: { lat: number; lng: number; title: string; zoomDelta?: number }) {
  const bbox = [lng - zoomDelta * 1.6, lat - zoomDelta, lng + zoomDelta * 1.6, lat + zoomDelta].map((n) => n.toFixed(5)).join(',');
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(5)},${lng.toFixed(5)}`;
  return (
    <figure>
      <div className="aspect-[4/3] overflow-hidden rounded-lg border border-brand/20 bg-brand/5 sm:aspect-[16/9]">
        <iframe src={src} title={title} loading="lazy" className="h-full w-full" referrerPolicy="no-referrer" />
      </div>
      <figcaption className="mt-1 text-xs text-ink/75">
        Map ©{' '}
        <a className="underline" href="https://www.openstreetmap.org/copyright">
          OpenStreetMap
        </a>{' '}
        contributors
      </figcaption>
    </figure>
  );
}

export function PageHeader({ title, intro, kicker }: { title: string; intro?: React.ReactNode; kicker?: string }) {
  return (
    <header className="mb-8">
      {kicker && <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-accent">{kicker}</p>}
      <h1 className="font-serif text-4xl font-black leading-[1.05] text-night sm:text-5xl">{title}</h1>
      {intro && <div className="mt-4 max-w-3xl text-lg text-ink/85">{intro}</div>}
    </header>
  );
}

export function AreaMap({ points, title }: { points: { lat: number; lng: number }[]; title: string }) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const pad = 0.003;
  const bbox = [Math.min(...lngs) - pad, Math.min(...lats) - pad, Math.max(...lngs) + pad, Math.max(...lats) + pad].map((n) => n.toFixed(5)).join(',');
  return (
    <figure>
      <div className="aspect-[4/3] overflow-hidden rounded-lg border border-brand/20 bg-brand/5 sm:aspect-[16/9]">
        <iframe src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`} title={title} loading="lazy" className="h-full w-full" referrerPolicy="no-referrer" />
      </div>
      <figcaption className="mt-1 text-xs text-ink/75">
        Map ©{' '}
        <a className="underline" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors
      </figcaption>
    </figure>
  );
}
