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
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-x-1.5">
            {crumbs.map((c, i) => (
              <li key={c.path} className="flex items-center gap-x-1.5">
                {i > 0 && <span aria-hidden="true" className="text-navy/30">/</span>}
                {i === crumbs.length - 1 ? (
                  <span aria-current="page" className="font-medium text-navy">
                    {c.name}
                  </span>
                ) : (
                  <Link href={c.path} className="hover:text-blue hover:underline">
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
    <li className="inline-flex items-center gap-1 rounded-full bg-wash px-2.5 py-1 text-xs font-semibold text-blue">
      <Icon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.25} />
      {FEATURE_LABELS[k]}
    </li>
  );
}

// ---- Headings ----------------------------------------------------------------------------
export function SectionHeading({ id, eyebrow, children, action }: { id: string; eyebrow?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-sky-ink">{eyebrow}</p>}
        <h2 id={id} className="text-2xl font-extrabold text-navy sm:text-3xl">
          {children}
        </h2>
      </div>
      {action}
    </div>
  );
}

// ---- Cards ---------------------------------------------------------------------------------
export function PubCard({ pub, distanceM, rank, headingLevel = 3 }: { pub: Pub; distanceM?: number; rank?: number; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as 'h2' | 'h3';
  const feats = yesFeatures(pub).filter((k) => k !== 'food' || !yesFeatures(pub).includes('sundayRoast'));
  const { street } = addressLines(pub);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-paper p-5 shadow-card ring-1 ring-navy/5 transition duration-200 hover:-translate-y-1 hover:shadow-lift hover:ring-blue/30">
      <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
      <div className="flex items-start gap-3">
        {rank != null && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient font-display text-sm font-extrabold text-white shadow-sm">
            <span className="sr-only">Rank </span>
            {rank}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <H className="text-lg font-bold leading-snug text-navy">
            <Link href={`/pubs/${pub.slug}`} className="after:absolute after:inset-0 group-hover:text-blue focus-visible:outline-none">
              {pub.name}
            </Link>
          </H>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {street} · {areaName(pub.area)}
              {distanceM != null && <> · {formatDistance(distanceM)}</>}
            </span>
          </p>
        </div>
        {pub.rating != null && (
          <p className="flex shrink-0 items-center gap-1 rounded-full bg-navy px-2 py-1 text-xs font-bold text-white" title={`${pub.reviewCount} Google reviews`}>
            <Star aria-hidden="true" className="h-3 w-3 fill-[#FFD23F] text-[#FFD23F]" />
            <span className="sr-only">Google rating </span>
            {pub.rating.toFixed(1)}
          </p>
        )}
      </div>
      {feats.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Confirmed facilities">
          {feats.slice(0, 4).map((k) => (
            <FeatureChip key={k} k={k} />
          ))}
          {feats.length > 4 && <li className="self-center text-xs font-medium text-muted">+{feats.length - 4} more</li>}
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
            className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-sm font-semibold text-navy shadow-card ring-1 ring-navy/10 transition hover:-translate-y-0.5 hover:bg-blue hover:text-white hover:ring-blue"
          >
            {l.text}
            {l.count != null && <span className="rounded-full bg-wash px-2 py-0.5 text-xs font-bold text-blue">{l.count}</span>}
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
      <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-wash shadow-card ring-1 ring-navy/10 sm:aspect-[16/9]">
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

function StatChips({ stats }: { stats: Stat[] }) {
  return (
    <ul className="mt-6 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap" aria-label="At a glance">
      {stats.map((s) => (
        <li key={s.label} className="rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/25 backdrop-blur-sm sm:px-4">
          <span className="block font-display text-xl font-extrabold leading-none text-white sm:text-2xl">{s.value}</span>
          <span className="mt-1 block text-[11px] font-medium leading-tight text-white/90 sm:text-xs">{s.label}</span>
        </li>
      ))}
    </ul>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white ring-1 ring-white/30 backdrop-blur-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-sky" aria-hidden="true" />
      {children}
    </p>
  );
}

/** Gradient banner used on pages without a photo. */
export function PageHeader({ title, intro, kicker, icon: Icon, stats }: { title: string; intro?: React.ReactNode; kicker?: string; icon?: LucideIcon; stats?: Stat[] }) {
  return (
    <header className="relative -mx-4 mb-10 overflow-hidden bg-brand-gradient px-6 py-10 text-white sm:mx-0 sm:rounded-3xl sm:px-10 sm:py-12">
      <div className="stripes-faint pointer-events-none absolute inset-y-0 right-0 w-1/2 [mask-image:linear-gradient(to_left,black,transparent)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky/30 blur-3xl" aria-hidden="true" />
      {Icon && <Icon aria-hidden="true" className="pointer-events-none absolute -bottom-6 right-4 h-40 w-40 text-white/10 sm:right-10 sm:h-56 sm:w-56" strokeWidth={1.25} />}
      <div className="relative max-w-3xl">
        {kicker && <Kicker>{kicker}</Kicker>}
        <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl">{title}</h1>
        {intro && <div className="mt-4 space-y-2 text-base text-white/95 sm:text-lg [&_a]:font-semibold [&_a]:underline">{intro}</div>}
        {stats && <StatChips stats={stats} />}
      </div>
    </header>
  );
}

// Photo header: art-directed image (tall crop on phones, wide banner from 640px) under a navy-to-blue
// gradient so the overlaid text keeps its contrast. Images and crops are configured in data/heroes.json and
// built by scripts/hero-images.py as AVIF with a WebP fallback.
type HeroImage = { alt: string; credit: { text: string; url: string } | null };
const HEROES = heroesJson as unknown as Record<string, HeroImage>;
export const hasHero = (name: string) => !name.startsWith('_') && name in HEROES;

export function Hero({
  image,
  kicker,
  title,
  children,
  actions,
  stats,
  atTop = true,
}: {
  image: string;
  kicker: string;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  stats?: Stat[];
  /** True when the hero sits directly under the site header (bleeds into the page's top padding on phones). */
  atTop?: boolean;
}) {
  const img = HEROES[image];
  const set = (shape: 'wide' | 'tall', ext: string) =>
    shape === 'wide'
      ? `/hero/${image}-wide-1280.${ext} 1280w, /hero/${image}-wide-1920.${ext} 1920w`
      : `/hero/${image}-tall-600.${ext} 600w, /hero/${image}-tall-900.${ext} 900w`;
  const wideSizes = '(min-width: 1184px) 1152px, 100vw';
  return (
    <header className={`relative -mx-4 mb-12 overflow-hidden bg-navy sm:mx-0 sm:rounded-3xl sm:shadow-lift ${atTop ? '-mt-8 sm:mt-0' : ''}`}>
      <picture>
        <source media="(min-width: 640px)" type="image/avif" srcSet={set('wide', 'avif')} sizes={wideSizes} />
        <source media="(min-width: 640px)" type="image/webp" srcSet={set('wide', 'webp')} sizes={wideSizes} />
        <source type="image/avif" srcSet={set('tall', 'avif')} sizes="100vw" />
        <img
          src={`/hero/${image}-tall-600.webp`}
          srcSet={set('tall', 'webp')}
          sizes="100vw"
          width={600}
          height={800}
          alt={img.alt}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </picture>
      {/* Navy at the text edge fading through royal blue to clear, plus faint shirt stripes. */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 via-55% to-blue/10 sm:bg-gradient-to-r sm:from-navy/95 sm:via-blue/70 sm:via-50% sm:to-blue/0"
        aria-hidden="true"
      />
      <div className="stripes-faint pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_top,black_10%,transparent_70%)] sm:[mask-image:linear-gradient(to_right,black_5%,transparent_60%)]" aria-hidden="true" />
      <div className="relative flex min-h-[36rem] flex-col justify-end px-6 pb-10 pt-28 sm:min-h-[30rem] sm:max-w-2xl sm:justify-center sm:px-12 sm:py-16">
        <Kicker>{kicker}</Kicker>
        <h1 className="text-[2.6rem] font-extrabold leading-[1.02] text-white sm:text-6xl">{title}</h1>
        <div className="mt-4 max-w-xl space-y-2 text-base text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.45)] sm:text-lg [&_a]:font-semibold [&_a]:underline">{children}</div>
        {stats && <StatChips stats={stats} />}
        {actions && <div className="mt-7 flex flex-wrap gap-3">{actions}</div>}
      </div>
      {img.credit && (
        <p className="absolute bottom-2 right-2 rounded-full bg-navy/85 px-2.5 py-0.5 text-[11px] text-white">
          <a href={img.credit.url} rel="noopener" className="underline-offset-2 hover:underline">
            {img.credit.text}
          </a>
        </p>
      )}
    </header>
  );
}

// ---- Buttons --------------------------------------------------------------------------------
export function ButtonLink({ href, children, variant = 'primary' }: { href: string; children: React.ReactNode; variant?: 'primary' | 'ghost' }) {
  return variant === 'primary' ? (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-blue shadow-lg shadow-navy/20 transition hover:-translate-y-0.5 hover:bg-wash"
    >
      {children}
      <ArrowRight aria-hidden="true" className="h-4 w-4" />
    </Link>
  ) : (
    <Link href={href} className="inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold text-white ring-2 ring-white/70 transition hover:bg-white/10">
      {children}
    </Link>
  );
}
