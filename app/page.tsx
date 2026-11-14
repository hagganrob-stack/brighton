import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { pubs, areas, ROUNDUPS, pubsInArea, pubsWith, rank, monthYear, lastChecked } from '@/lib/data';
import { meta, SITE_NAME } from '@/lib/seo';
import { websiteSchema } from '@/lib/schema';
import { Breadcrumbs, ButtonLink, FEATURE_ICON, Hero, JsonLd, PubGrid, SectionHeading } from '@/components/ui';

export const metadata = meta(
  '/',
  `${SITE_NAME}: ${pubs.length} Pubs in Brighton & Hove`,
  `An independent guide to ${pubs.length} pubs and bars in Brighton & Hove across ${areas.length} areas. Sunday roasts, quizzes, beer gardens, dog-friendly pubs and more.`,
);

export default function Home() {
  const top = rank(pubs).slice(0, 9);
  return (
    <>
      <JsonLd data={websiteSchema()} />
      <Breadcrumbs crumbs={[{ name: 'Home', path: '/' }]} />
      <Hero
        image="seafront"
        kicker="Independent & non-commercial"
        title="Pubs in Brighton & Hove"
        stats={[
          { value: pubs.length, label: 'pubs & bars' },
          { value: areas.length, label: 'neighbourhoods' },
          { value: ROUNDUPS.length, label: 'best-of guides' },
        ]}
        actions={
          <>
            <ButtonLink href="/best/sunday-roasts">Find a Sunday roast</ButtonLink>
            <ButtonLink href="/areas" variant="ghost">
              Browse by area
            </ButtonLink>
          </>
        }
      >
        <p>
          From the Lanes to Rottingdean. We only list a facility, such as a beer garden or a quiz night, when the pub&apos;s own website
          says so. Checked {monthYear(lastChecked)}.
        </p>
      </Hero>

      <section aria-labelledby="by-feature" className="mb-16">
        <SectionHeading id="by-feature" eyebrow="Best of Brighton">
          Find a pub for…
        </SectionHeading>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {ROUNDUPS.map((r) => {
            const Icon = FEATURE_ICON[r.key];
            return (
              <li key={r.slug}>
                <Link
                  href={`/best/${r.slug}`}
                  className="group relative flex h-full min-h-36 flex-col justify-between overflow-hidden rounded-2xl bg-brand-gradient p-5 text-white shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lift sm:min-h-44 sm:p-6"
                >
                  <span className="stripes-faint pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                  <Icon aria-hidden="true" className="pointer-events-none absolute -bottom-4 -right-4 h-28 w-28 text-white/10 transition duration-300 group-hover:scale-110 group-hover:text-white/15" strokeWidth={1.25} />
                  <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="relative mt-6 block">
                    <span className="block font-display text-xl font-extrabold leading-tight sm:text-2xl">{r.label}</span>
                    <span className="mt-1 flex items-center gap-1 text-sm text-white/90">
                      {pubsWith(r.key).length} pubs
                      <ArrowRight aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="by-area" className="mb-16">
        <SectionHeading id="by-area" eyebrow={`${areas.length} neighbourhoods`}>
          Browse by area
        </SectionHeading>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {areas.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/areas/${a.slug}`}
                className="group flex h-full items-center justify-between gap-2 rounded-2xl bg-paper p-4 shadow-card ring-1 ring-navy/5 transition hover:-translate-y-0.5 hover:shadow-lift hover:ring-blue/30"
              >
                <span>
                  <span className="block font-display text-lg font-bold leading-tight text-navy group-hover:text-blue">{a.name}</span>
                  <span className="text-sm text-muted">{pubsInArea(a.slug).length} pubs</span>
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-wash text-blue transition group-hover:bg-blue group-hover:text-white">
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="top-rated">
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
        <PubGrid pubs={top} />
      </section>
    </>
  );
}
