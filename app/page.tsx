import Link from 'next/link';
import { ArrowRight, MapPin, Star } from 'lucide-react';
import { pubs, areas, ROUNDUPS, pubsInArea, pubsWith, rank, monthYear, lastChecked, areaName, addressLines, yesFeatures, type Roundup } from '@/lib/data';
import { meta, SITE_NAME } from '@/lib/seo';
import { websiteSchema } from '@/lib/schema';
import { Breadcrumbs, ButtonLink, FEATURE_ICON, FeatureChip, JsonLd, PubCard, SectionHeading } from '@/components/ui';
import { CityMap } from '@/components/CityMap';

export const metadata = meta(
  '/',
  `${SITE_NAME}: ${pubs.length} Pubs in Brighton & Hove`,
  `An independent guide to ${pubs.length} pubs and bars in Brighton & Hove across ${areas.length} areas. Sunday roasts, quizzes, beer gardens, dog-friendly pubs and more.`,
);

// ---- Hero ------------------------------------------------------------------------------------
function HomeHero() {
  const wide = (ext: string) => `/hero/home-wide-1280.${ext} 1280w, /hero/home-wide-1920.${ext} 1920w`;
  const tall = (ext: string) => `/hero/home-tall-600.${ext} 600w, /hero/home-tall-900.${ext} 900w`;
  return (
    <header className="full-bleed relative -mt-8 overflow-hidden bg-navy text-white">
      {/* Blue duotone photo: greyscale image multiplied through the brand gradient. */}
      <picture>
        <source media="(min-width: 640px)" type="image/avif" srcSet={wide('avif')} sizes="100vw" />
        <source media="(min-width: 640px)" type="image/webp" srcSet={wide('webp')} sizes="100vw" />
        <source type="image/avif" srcSet={tall('avif')} sizes="100vw" />
        <img
          src="/hero/home-tall-600.webp"
          srcSet={tall('webp')}
          sizes="100vw"
          width={600}
          height={800}
          alt="Brighton Palace Pier and the pebble beach on a sunny day, with gulls overhead"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover grayscale contrast-125"
        />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-blue to-blue-bright mix-blend-multiply" aria-hidden="true" />
      <div className="absolute inset-0 bg-sky/10 mix-blend-screen" aria-hidden="true" />
      <div className="aurora pointer-events-none absolute -left-40 top-10 h-[34rem] w-[34rem] bg-[radial-gradient(closest-side,rgb(56_189_248/0.30),transparent)]" aria-hidden="true" />
      <div className="aurora-slow pointer-events-none absolute -bottom-40 right-0 h-[30rem] w-[40rem] bg-[radial-gradient(closest-side,rgb(18_112_214/0.40),transparent)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent sm:bg-gradient-to-r sm:from-navy/90 sm:via-navy/40 sm:to-transparent" aria-hidden="true" />
      <div className="stripes-faint pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_top,black,transparent_60%)]" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-[calc(100svh-12rem)] max-w-6xl flex-col justify-end px-4 pb-8 pt-28 sm:min-h-[42rem] sm:justify-center sm:pb-24">
        <p className="rise mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ring-1 ring-white/30 sm:text-xs">
          <span className="h-2 w-2 rounded-full bg-sky" aria-hidden="true" />
          Independent · checked {monthYear(lastChecked)}
        </p>
        <h1 className="rise-2 font-display text-[clamp(3.1rem,10vw,8rem)] font-extrabold leading-[1.05] tracking-[-0.04em]">
          Pubs in
          <span className="text-gradient-light block pb-2">Brighton &amp; Hove</span>
        </h1>
        <p className="rise-3 mt-6 max-w-xl text-lg text-white/90 sm:text-xl">
          {pubs.length} pubs and bars across {areas.length} neighbourhoods. Facilities only appear when the pub&apos;s own website says so.
        </p>
        <div className="rise-3 mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/best/sunday-roasts">Find a Sunday roast</ButtonLink>
          <ButtonLink href="/areas" variant="ghost">
            Browse by area
          </ButtonLink>
        </div>
      </div>

      {/* Glass stats bar */}
      <div className="relative mx-auto max-w-6xl px-4 pb-8 sm:-mt-16 sm:pb-12">
        <dl className="grid grid-cols-3 divide-x divide-white/15 overflow-hidden rounded-3xl bg-navy/40 ring-1 ring-white/20">
          {(
            [
              [pubs.length, 'pubs & bars'],
              [areas.length, 'neighbourhoods'],
              [ROUNDUPS.length, 'best-of guides'],
            ] as const
          ).map(([v, l]) => (
            <div key={l} className="flex flex-col-reverse px-4 py-4 sm:px-8 sm:py-6">
              <dt className="mt-1 text-xs text-white/90 sm:text-sm">{l}</dt>
              <dd className="font-display text-3xl font-extrabold leading-none sm:text-5xl">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}

// ---- Ticker (decorative) --------------------------------------------------------------------
function Ticker() {
  const names = rank(pubs)
    .slice(0, 36)
    .map((p) => p.name);
  const row = (
    <span className="flex shrink-0 items-center gap-6 pr-6">
      {names.map((n) => (
        <span key={n} className="flex items-center gap-6 whitespace-nowrap">
          {n}
          <Star className="h-4 w-4 fill-white/60 text-white/60" />
        </span>
      ))}
    </span>
  );
  return (
    <div className="full-bleed relative overflow-hidden border-y-4 border-white bg-blue py-4 font-display text-lg font-bold uppercase tracking-wide text-white sm:text-2xl" aria-hidden="true">
      <div className="marquee-track flex w-max">
        {row}
        {row}
      </div>
    </div>
  );
}

// ---- Bento ----------------------------------------------------------------------------------
type Skin = 'photo' | 'white' | 'gradient' | 'navy' | 'stripes' | 'outline';
const BENTO: Record<string, { span: string; skin: Skin }> = {
  'sunday-roasts': { span: 'col-span-2 row-span-2', skin: 'photo' },
  'pub-quizzes': { span: 'col-span-1 lg:col-span-2', skin: 'white' },
  'beer-gardens': { span: 'col-span-1', skin: 'gradient' },
  'dog-friendly': { span: 'col-span-1', skin: 'navy' },
  'live-music': { span: 'col-span-1 lg:col-span-2', skin: 'stripes' },
  'live-sport': { span: 'col-span-2', skin: 'outline' },
};
const SKIN: Record<Skin, string> = {
  photo: 'bg-navy text-white',
  white: 'bg-paper text-navy ring-1 ring-navy/10 shadow-card',
  gradient: 'bg-brand-gradient text-white shadow-card',
  navy: 'bg-navy text-white shadow-card',
  stripes: 'bg-blue text-white shadow-card',
  outline: 'bg-paper text-navy ring-2 ring-blue shadow-card',
};

function BentoTile({ r }: { r: Roundup }) {
  const Icon = FEATURE_ICON[r.key];
  const count = pubsWith(r.key).length;
  const { span, skin } = BENTO[r.slug];
  const dark = skin !== 'white' && skin !== 'outline';
  return (
    <li className={span}>
      <Link
        href={`/best/${r.slug}`}
        className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-7 ${SKIN[skin]}`}
      >
        {skin === 'photo' && (
          <>
            <picture>
              <source type="image/avif" srcSet="/hero/sunday-roasts-tall-600.avif 600w, /hero/sunday-roasts-wide-1280.avif 1280w" sizes="(min-width: 1024px) 560px, 100vw" />
              <img
                src="/hero/sunday-roasts-tall-600.webp"
                srcSet="/hero/sunday-roasts-tall-600.webp 600w, /hero/sunday-roasts-wide-1280.webp 1280w"
                sizes="(min-width: 1024px) 560px, 100vw"
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
            </picture>
            <span className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-navy/0" aria-hidden="true" />
          </>
        )}
        {skin === 'navy' && <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 bg-[radial-gradient(closest-side,rgb(56_189_248/0.30),transparent)]" aria-hidden="true" />}
        {skin === 'stripes' && <span className="stripes-faint pointer-events-none absolute inset-0" aria-hidden="true" />}
        {skin === 'outline' && <span className="stripes absolute inset-x-0 top-0 h-2" aria-hidden="true" />}

        <span className={`relative grid h-12 w-12 place-items-center rounded-2xl ${dark ? 'bg-white/15 ring-1 ring-white/25' : 'bg-wash text-blue'}`}>
          <Icon aria-hidden="true" className="h-6 w-6" />
        </span>
        {skin !== 'photo' && (
          <span
            className={`pointer-events-none absolute -bottom-3 right-3 font-display text-[6.5rem] font-extrabold leading-none sm:text-[9rem] ${dark ? 'text-white/10' : 'text-outline-blue'}`}
            aria-hidden="true"
          >
            {count}
          </span>
        )}
        <span className="relative">
          <h3 className={`font-display font-extrabold leading-tight ${skin === 'photo' ? 'text-3xl sm:text-5xl' : 'text-xl sm:text-2xl'}`}>{r.label}</h3>
          <span className={`mt-1 inline-flex items-center gap-1 text-sm font-semibold ${dark ? 'text-white' : 'text-blue'}`}>
            {count} pubs <ArrowRight aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
        </span>
      </Link>
    </li>
  );
}

// ---- Map section ------------------------------------------------------------------------------
function MapSection() {
  return (
    <section aria-labelledby="map-heading" className="full-bleed relative overflow-hidden bg-navy py-20 text-white sm:py-28">
      <div className="aurora pointer-events-none absolute -left-32 top-0 h-96 w-96 bg-[radial-gradient(closest-side,rgb(0_87_184/0.50),transparent)]" aria-hidden="true" />
      <div className="aurora-slow pointer-events-none absolute -right-20 bottom-0 h-[28rem] w-[28rem] bg-[radial-gradient(closest-side,rgb(56_189_248/0.20),transparent)]" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-[1fr_1.35fr]">
        <div className="reveal">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-sky">The map</p>
          <h2 id="map-heading" className="font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            {pubs.length} pubs.
            <span className="text-gradient-light block">{areas.length} neighbourhoods.</span>
          </h2>
          <p className="mt-5 max-w-md text-lg text-white/90">Every dot is a pub in this guide, plotted where it stands. Pick a neighbourhood to see them all.</p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {areas.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/areas/${a.slug}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold ring-1 ring-white/20 transition hover:bg-white hover:text-navy"
                >
                  {a.name}
                  <span className="rounded-full bg-white/15 px-1.5 text-xs">{pubsInArea(a.slug).length}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="reveal relative">
          <div className="absolute inset-6 rounded-[2.5rem] bg-[radial-gradient(closest-side,rgb(0_87_184/0.20),transparent)]" aria-hidden="true" />
          <CityMap id="home-map" labels className="w-full" />
        </div>
      </div>
    </section>
  );
}

// ---- Podium ----------------------------------------------------------------------------------
function Podium() {
  const ranked = rank(pubs);
  const top = ranked.slice(0, 3);
  const next = ranked.slice(3, 9);
  return (
    <section aria-labelledby="top-rated" className="reveal">
      <SectionHeading
        id="top-rated"
        eyebrow="Ranked by Google rating, weighted by reviews"
        action={
          <Link href="/pubs" className="inline-flex items-center gap-1 text-sm font-semibold text-blue hover:underline">
            See all {pubs.length} pubs A–Z <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        }
      >
        Highest-rated pubs
      </SectionHeading>
      <ol className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {top.map((p, i) => {
          const { street } = addressLines(p);
          const first = i === 0;
          const feats = yesFeatures(p).filter((k) => k !== 'food' || !yesFeatures(p).includes('sundayRoast')).slice(0, 3);
          return (
            <li key={p.slug}>
              <article
                className={`group relative flex h-full min-h-64 flex-col overflow-hidden rounded-3xl p-7 transition duration-300 hover:-translate-y-1 hover:shadow-lift ${
                  first ? 'bg-brand-gradient text-white shadow-lift' : 'bg-paper text-navy shadow-card ring-1 ring-navy/5'
                }`}
              >
                <span
                  className={`pointer-events-none absolute -right-2 -top-6 font-display text-[10rem] font-extrabold leading-none ${first ? 'text-white/15' : 'text-outline-blue'}`}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className={`relative mb-auto w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${first ? 'bg-white/15 ring-1 ring-white/30' : 'bg-wash text-blue'}`}>
                  No. {i + 1}
                </span>
                <h3 className="relative mt-10 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                  <Link href={`/pubs/${p.slug}`} prefetch={false} className="after:absolute after:inset-0">
                    {p.name}
                  </Link>
                </h3>
                <p className={`relative mt-2 flex items-center gap-1.5 text-sm ${first ? 'text-white/90' : 'text-muted'}`}>
                  <MapPin aria-hidden="true" className="h-4 w-4" /> {street} · {areaName(p.area)}
                </p>
                <p className="relative mt-4 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${first ? 'bg-white text-navy' : 'bg-navy text-white'}`}>
                    <Star aria-hidden="true" className="h-3.5 w-3.5 fill-[#FFD23F] text-[#FFD23F]" />
                    <span className="sr-only">Google rating </span>
                    {p.rating?.toFixed(1)}
                  </span>
                  <span className={`text-sm ${first ? 'text-white/90' : 'text-muted'}`}>{(p.reviewCount ?? 0).toLocaleString('en-GB')} reviews</span>
                </p>
                {feats.length > 0 && !first && (
                  <ul className="relative mt-4 flex flex-wrap gap-1.5" aria-label="Confirmed facilities">
                    {feats.map((k) => (
                      <FeatureChip key={k} k={k} />
                    ))}
                  </ul>
                )}
              </article>
            </li>
          );
        })}
      </ol>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {next.map((p, i) => (
          <li key={p.slug}>
            <PubCard pub={p} rank={i + 4} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <JsonLd data={websiteSchema()} />
      <Breadcrumbs crumbs={[{ name: 'Home', path: '/' }]} />
      <HomeHero />
      <Ticker />

      <section aria-labelledby="by-feature" className="reveal my-20">
        <SectionHeading id="by-feature" eyebrow="Best of Brighton & Hove">
          Find a pub for…
        </SectionHeading>
        <ul className="grid auto-rows-[11rem] grid-cols-2 gap-3 sm:gap-4 lg:auto-rows-[13rem] lg:grid-cols-4">
          {ROUNDUPS.map((r) => (
            <BentoTile key={r.slug} r={r} />
          ))}
        </ul>
      </section>

      <MapSection />

      <div className="mt-20">
        <Podium />
      </div>
    </>
  );
}
