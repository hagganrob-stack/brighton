import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Accessibility, ArrowRight, Beef, Beer, Brain, Dog, MapPin, Music, Star, Trees, Trophy, Utensils } from 'lucide-react';
import { type Pub, type FeatureKey, FEATURE_LABELS, areaName, addressLines, yesFeatures, formatDistance } from '@/lib/data';
import { breadcrumbSchema, type Crumb } from '@/lib/schema';
import heroesJson from '@/data/heroes.json';

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
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-x-1.5">
            {crumbs.map((c, i) => (
              <li key={c.path} className="flex items-center gap-x-1.5">
                {i > 0 && <span aria-hidden="true" className="text-line">/</span>}
                {i === crumbs.length - 1 ? (
                  <span aria-current="page" className="font-medium text-navy">
                    {c.name}
                  </span>
                ) : (
                  <Link href={c.path} className="hover:text-blue">
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

// ---- Icons ---------------------------------------------------------------------------------
export const FEATURE_ICON: Record<FeatureKey, LucideIcon> = {
  beerGarden: Trees,
  dogFriendly: Dog,
  liveMusic: Music,
  pubQuiz: Brain,
  sundayRoast: Beef,
  food: Utensils,
  liveSport: Trophy,
  realAle: Beer,
  stepFree: Accessibility,
};

export function FeatureChip({ k }: { k: FeatureKey }) {
  const Icon = FEATURE_ICON[k];
  return (
    <li className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-ink ring-1 ring-line">
      <Icon aria-hidden="true" className="h-3.5 w-3.5 text-blue" strokeWidth={2.25} />
      {FEATURE_LABELS[k]}
    </li>
  );
}

// ---- Headings ----------------------------------------------------------------------------
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue">{children}</p>;
}

export function SectionHeading({ id, eyebrow, children, action }: { id: string; eyebrow?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 id={id} className="text-2xl font-bold sm:text-3xl">
          {children}
        </h2>
      </div>
      {action}
    </div>
  );
}

// ---- Cards ---------------------------------------------------------------------------------
export function Rating({ pub, size = 'sm' }: { pub: Pub; size?: 'sm' | 'md' }) {
  if (pub.rating == null) return null;
  return (
    <p className={`flex shrink-0 items-center gap-1 font-semibold text-navy ${size === 'md' ? 'text-base' : 'text-sm'}`} title={`${pub.reviewCount} Google reviews`}>
      <Star aria-hidden="true" className={`${size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} fill-star text-star`} />
      <span className="sr-only">Google rating </span>
      {pub.rating.toFixed(1)}
    </p>
  );
}

export function PubCard({ pub, distanceM, rank, headingLevel = 3 }: { pub: Pub; distanceM?: number; rank?: number; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as 'h2' | 'h3';
  const feats = yesFeatures(pub).filter((k) => k !== 'food' || !yesFeatures(pub).includes('sundayRoast'));
  const { street } = addressLines(pub);
  return (
    <article className="group relative flex h-full flex-col card card-hover rounded-2xl p-5">
      <div className="flex items-start gap-3">
        {rank != null && (
          <span className="font-display text-sm font-bold tabular-nums text-muted">
            <span className="sr-only">Rank </span>
            {String(rank).padStart(2, '0')}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <H className="text-lg font-bold leading-snug">
            <Link href={`/pubs/${pub.slug}`} prefetch={false} className="after:absolute after:inset-0 group-hover:text-blue focus-visible:outline-none">
              {pub.name}
            </Link>
          </H>
          <p className="mt-1 flex items-start gap-1 text-sm text-muted">
            <MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {street} · {areaName(pub.area)}
              {distanceM != null && <> · {formatDistance(distanceM)}</>}
            </span>
          </p>
        </div>
        <Rating pub={pub} />
      </div>
      {feats.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Confirmed facilities">
          {feats.slice(0, 4).map((k) => (
            <FeatureChip key={k} k={k} />
          ))}
          {feats.length > 4 && <li className="self-center text-xs text-muted">+{feats.length - 4} more</li>}
        </ul>
      )}
    </article>
  );
}

export function PubGrid({ pubs, ranked, headingLevel }: { pubs: Pub[]; ranked?: boolean; headingLevel?: 2 | 3 }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {pubs.map((p, i) => (
        <li key={p.slug}>
          <PubCard pub={p} rank={ranked ? i + 1 : undefined} headingLevel={headingLevel} />
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
            className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-navy transition hover:border-blue hover:text-blue"
          >
            {l.text}
            {l.count != null && <span className="text-xs text-muted">{l.count}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ---- Maps ----------------------------------------------------------------------------------
function MapFrame({ src, title }: { src: string; title: string }) {
  return (
    <figure>
      <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-canvas sm:aspect-[16/9]">
        <iframe src={src} title={title} loading="lazy" className="h-full w-full" referrerPolicy="no-referrer" />
      </div>
      <figcaption className="mt-2 text-xs text-muted">
        Map ©{' '}
        <a className="underline" href="https://www.openstreetmap.org/copyright">
          OpenStreetMap
        </a>{' '}
        contributors
      </figcaption>
    </figure>
  );
}

export function OsmMap({ lat, lng, title, zoomDelta = 0.004 }: { lat: number; lng: number; title: string; zoomDelta?: number }) {
  const bbox = [lng - zoomDelta * 1.6, lat - zoomDelta, lng + zoomDelta * 1.6, lat + zoomDelta].map((n) => n.toFixed(5)).join(',');
  return <MapFrame title={title} src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(5)},${lng.toFixed(5)}`} />;
}

export function AreaMap({ points, title }: { points: { lat: number; lng: number }[]; title: string }) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const pad = 0.003;
  const bbox = [Math.min(...lngs) - pad, Math.min(...lats) - pad, Math.max(...lngs) + pad, Math.max(...lats) + pad].map((n) => n.toFixed(5)).join(',');
  return <MapFrame title={title} src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`} />;
}

// ---- Page headers --------------------------------------------------------------------------
export type Stat = { value: string | number; label: string };

/** Inline figures with hairline dividers. */
export function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <dl className="mt-8 grid grid-cols-3 gap-4 sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-4">
      {stats.map((s, i) => (
        <div key={s.label} className={`flex flex-col-reverse ${i > 0 ? 'border-l border-line pl-4 sm:pl-8' : ''}`}>
          <dt className="mt-1 text-sm text-muted">{s.label}</dt>
          <dd className="font-display text-2xl font-bold leading-none text-navy sm:text-3xl">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function HeaderText({ kicker, title, children, stats, actions }: { kicker?: string; title: string; children?: React.ReactNode; stats?: Stat[]; actions?: React.ReactNode }) {
  return (
    <div className="max-w-2xl">
      {kicker && <Eyebrow>{kicker}</Eyebrow>}
      <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-[3.5rem]">{title}</h1>
      {children && <div className="mt-5 space-y-2 text-lg text-muted [&_a]:font-medium [&_a]:text-blue [&_a:hover]:underline">{children}</div>}
      {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
      {stats && <StatRow stats={stats} />}
    </div>
  );
}

/** Plain page header on white, with optional artwork (e.g. a CityMap) on the right. */
export function PageHeader({
  title,
  intro,
  kicker,
  stats,
  art,
}: {
  title: string;
  intro?: React.ReactNode;
  kicker?: string;
  /** Kept for API compatibility; plain headers no longer show a decorative icon. */
  icon?: LucideIcon;
  stats?: Stat[];
  art?: React.ReactNode;
}) {
  return (
    <header className={`mb-14 ${art ? 'grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]' : ''}`}>
      <HeaderText kicker={kicker} title={title} stats={stats}>
        {intro}
      </HeaderText>
      {art && <div className="panel-grad rounded-3xl border border-line p-4 sm:p-6">{art}</div>}
    </header>
  );
}

// Photo header: text on white beside the photo in its natural colours (no overlays or tints).
// Images and crops are configured in data/heroes.json and built by scripts/hero-images.py (AVIF + WebP).
type HeroImage = { alt: string; credit: { text: string; url: string } | null };
const HEROES = heroesJson as unknown as Record<string, HeroImage>;
export const hasHero = (name: string) => !name.startsWith('_') && name in HEROES;

export function HeroPhoto({ image, className = '', priority = true }: { image: string; className?: string; priority?: boolean }) {
  const img = HEROES[image];
  // The 'tall' (3:4) crop is used at every size: the photo column is portrait-ish on desktop and full-width on phones.
  return (
    <figure className={className}>
      <picture>
        <source type="image/avif" srcSet={`/hero/${image}-tall-600.avif 600w, /hero/${image}-tall-900.avif 900w`} sizes="(min-width: 1024px) 480px, 100vw" />
        <img
          src={`/hero/${image}-tall-600.webp`}
          srcSet={`/hero/${image}-tall-600.webp 600w, /hero/${image}-tall-900.webp 900w`}
          sizes="(min-width: 1024px) 480px, 100vw"
          width={600}
          height={800}
          alt={img.alt}
          fetchPriority={priority ? 'high' : 'auto'}
          loading={priority ? 'eager' : 'lazy'}
          className="aspect-[4/3] w-full rounded-3xl object-cover lg:aspect-[4/5]"
        />
      </picture>
      {img.credit && (
        <figcaption className="mt-2 text-right text-xs text-muted">
          <a href={img.credit.url} rel="noopener" className="hover:text-blue hover:underline">
            {img.credit.text}
          </a>
        </figcaption>
      )}
    </figure>
  );
}

export function Hero({
  image,
  kicker,
  title,
  children,
  actions,
  stats,
}: {
  image: string;
  kicker: string;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  stats?: Stat[];
  /** Kept for API compatibility. */
  atTop?: boolean;
}) {
  return (
    <header className="mb-16 grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
      <HeaderText kicker={kicker} title={title} stats={stats} actions={actions}>
        {children}
      </HeaderText>
      <HeroPhoto image={image} />
    </header>
  );
}

// ---- Buttons --------------------------------------------------------------------------------
export function ButtonLink({ href, children, variant = 'primary' }: { href: string; children: React.ReactNode; variant?: 'primary' | 'ghost' }) {
  return variant === 'primary' ? (
    <Link href={href} className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-3 font-semibold text-white transition hover:bg-blue-deep">
      {children}
      <ArrowRight aria-hidden="true" className="h-4 w-4" />
    </Link>
  ) : (
    <Link href={href} className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 font-semibold text-navy transition hover:border-navy">
      {children}
    </Link>
  );
}
