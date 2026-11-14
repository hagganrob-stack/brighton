import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { pubs, areas, ROUNDUPS, pubsInArea, pubsWith, rank, monthYear, lastChecked, areaName, addressLines, yesFeatures, type Roundup } from '@/lib/data';
import { meta, SITE_NAME } from '@/lib/seo';
import { websiteSchema } from '@/lib/schema';
import { Breadcrumbs, ButtonLink, Eyebrow, FEATURE_ICON, FeatureChip, HeroPhoto, JsonLd, PubCard, Rating, SectionHeading, StatRow, hasHero } from '@/components/ui';
import { CityMap } from '@/components/CityMap';
import { EditorCard } from '@/components/Byline';
import { entityGraph } from '@/lib/author';

export const metadata = meta(
  '/',
  `${SITE_NAME}: ${pubs.length} Pubs in Brighton & Hove`,
  `An independent guide to ${pubs.length} pubs and bars in Brighton & Hove across ${areas.length} areas. Sunday roasts, quizzes, beer gardens, dog-friendly pubs and more.`,
);

// ---- Hero ------------------------------------------------------------------------------------
function HomeHero() {
  const best = rank(pubs)[0];
  return (
    <header className="mb-24 grid items-center gap-12 pt-4 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
      <div>
        <Eyebrow>Independent pub guide · {monthYear(lastChecked)}</Eyebrow>
        <h1 className="text-5xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
          Pubs in <span className="text-blue">Brighton &amp; Hove</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted sm:text-xl">
          Every pub and bar worth knowing, by neighbourhood and by what you&apos;re after. Facilities only appear when the pub&apos;s own website
          says so.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/best/sunday-roasts">Find a Sunday roast</ButtonLink>
          <ButtonLink href="/areas" variant="ghost">
            Browse by area
          </ButtonLink>
        </div>
        <StatRow
          stats={[
            { value: pubs.length, label: 'pubs & bars' },
            { value: areas.length, label: 'neighbourhoods' },
            { value: ROUNDUPS.length, label: 'guides' },
          ]}
        />
      </div>
      <div className="relative">
        <HeroPhoto image="home" />
        {/* Floating card: the highest-rated pub in the guide. */}
        <Link
          href={`/pubs/${best.slug}`}
          prefetch={false}
          className="absolute -bottom-6 left-4 right-4 flex items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4 shadow-lift transition hover:border-slate-300 sm:left-6 sm:right-auto sm:min-w-72"
        >
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-blue">Highest rated</span>
            <span className="block font-display text-lg font-bold text-navy">{best.name}</span>
            <span className="text-sm text-muted">{areaName(best.area)}</span>
          </span>
          <Rating pub={best} size="md" />
        </Link>
      </div>
    </header>
  );
}

// ---- Bento ----------------------------------------------------------------------------------
const SPAN: Record<string, string> = {
  'sunday-roasts': 'col-span-2 row-span-2',
  'beer-gardens': 'col-span-1',
  'live-music': 'col-span-1',
  'pub-quizzes': 'col-span-1',
  'dog-friendly': 'col-span-1',
  'live-sport': 'col-span-2 lg:col-span-1',
};
const ORDER = ['sunday-roasts', 'beer-gardens', 'live-music', 'pub-quizzes', 'dog-friendly', 'live-sport'];

function BentoTile({ r }: { r: Roundup }) {
  const Icon = FEATURE_ICON[r.key];
  const count = pubsWith(r.key).length;
  const photo = hasHero(r.slug);
  return (
    <li className={SPAN[r.slug]}>
      <Link
        href={`/best/${r.slug}`}
        className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl p-6 transition duration-300 ${
          photo ? 'text-white' : 'card card-hover'
        }`}
      >
        {photo ? (
          <>
            <picture>
              {/* The big roast tile is landscape: use the wide crop there, the tall crop for the smaller tiles. */}
              <source
                type="image/avif"
                srcSet={r.slug === 'sunday-roasts' ? `/hero/${r.slug}-wide-1280.avif 1280w` : `/hero/${r.slug}-tall-600.avif 600w, /hero/${r.slug}-tall-900.avif 900w`}
                sizes="(min-width: 1024px) 740px, 100vw"
              />
              <img
                src={r.slug === 'sunday-roasts' ? `/hero/${r.slug}-wide-1280.webp` : `/hero/${r.slug}-tall-600.webp`}
                srcSet={r.slug === 'sunday-roasts' ? `/hero/${r.slug}-wide-1280.webp 1280w` : `/hero/${r.slug}-tall-600.webp 600w, /hero/${r.slug}-tall-900.webp 900w`}
                sizes="(min-width: 1024px) 740px, 100vw"
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
              />
            </picture>
            {/* Neutral scrim only behind the label. */}
            <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent" aria-hidden="true" />
            <span aria-hidden="true" />
          </>
        ) : (
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-soft text-blue">
            <Icon aria-hidden="true" className="h-5 w-5" />
          </span>
        )}
        <span className="relative">
          <h3 className={`font-bold leading-tight ${photo ? 'text-white' : ''} ${r.slug === 'sunday-roasts' ? 'text-3xl sm:text-4xl' : 'text-xl'}`}>{r.label}</h3>
          <span className={`mt-1 inline-flex items-center gap-1 text-sm font-medium ${photo ? 'text-white' : 'text-muted group-hover:text-blue'}`}>
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
    <section aria-labelledby="map-heading" className="mb-24 grid items-center gap-10 rounded-3xl border border-line panel-grad p-6 sm:p-10 lg:grid-cols-[1fr_1.3fr]">
      <div>
        <Eyebrow>The map</Eyebrow>
        <h2 id="map-heading" className="text-3xl font-bold leading-[1.05] sm:text-4xl">
          {pubs.length} pubs across {areas.length} neighbourhoods
        </h2>
        <p className="mt-4 max-w-md text-muted">Every dot is a pub in this guide, plotted where it stands. Pick a neighbourhood to see them all.</p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {areas.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/areas/${a.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm font-medium text-navy transition hover:border-blue hover:text-blue"
              >
                {a.name}
                <span className="text-xs text-muted">{pubsInArea(a.slug).length}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <CityMap id="home-map" labels className="w-full" />
    </section>
  );
}

// ---- Podium ----------------------------------------------------------------------------------
function Podium() {
  const ranked = rank(pubs);
  const top = ranked.slice(0, 3);
  const next = ranked.slice(3, 9);
  return (
    <section aria-labelledby="top-rated">
      <SectionHeading
        id="top-rated"
        eyebrow="Ranked by Google rating, weighted by reviews"
        action={
          <Link href="/pubs" className="inline-flex items-center gap-1 text-sm font-semibold text-blue hover:underline">
            See all {pubs.length} pubs <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        }
      >
        Highest-rated pubs
      </SectionHeading>
      <ol className="grid gap-4 lg:grid-cols-3">
        {top.map((p, i) => {
          const { street } = addressLines(p);
          const feats = yesFeatures(p).filter((k) => k !== 'food' || !yesFeatures(p).includes('sundayRoast')).slice(0, 3);
          return (
            <li key={p.slug}>
              <article className="group relative flex h-full flex-col card card-hover rounded-3xl p-7">
                <span className="font-display text-5xl font-bold leading-none text-slate-200" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="mt-6 text-2xl font-bold leading-tight">
                  <Link href={`/pubs/${p.slug}`} prefetch={false} className="after:absolute after:inset-0 group-hover:text-blue">
                    <span className="sr-only">Number {i + 1}: </span>
                    {p.name}
                  </Link>
                </h3>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                  <MapPin aria-hidden="true" className="h-4 w-4" /> {street} · {areaName(p.area)}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Rating pub={p} />
                  <span className="text-sm text-muted">{(p.reviewCount ?? 0).toLocaleString('en-GB')} reviews</span>
                </div>
                {feats.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Confirmed facilities">
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
      <JsonLd data={[websiteSchema(), entityGraph()]} />
      <Breadcrumbs crumbs={[{ name: 'Home', path: '/' }]} />
      <HomeHero />

      <section aria-labelledby="by-feature" className="mb-24">
        <SectionHeading id="by-feature" eyebrow="Best of Brighton & Hove">
          Find a pub for…
        </SectionHeading>
        <ul className="grid auto-rows-[12rem] grid-cols-2 gap-4 lg:auto-rows-[14rem] lg:grid-cols-3">
          {ORDER.map((slug) => (
            <BentoTile key={slug} r={ROUNDUPS.find((r) => r.slug === slug)!} />
          ))}
        </ul>
      </section>

      <MapSection />
      <Podium />
      <EditorCard />
    </>
  );
}
