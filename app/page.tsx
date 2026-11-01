import Link from 'next/link';
import { pubs, areas, ROUNDUPS, pubsInArea, pubsWith, rank, monthYear, lastChecked } from '@/lib/data';
import { meta, SITE_NAME } from '@/lib/seo';
import { websiteSchema } from '@/lib/schema';
import { Breadcrumbs, JsonLd, PubGrid, PageHeader } from '@/components/ui';

export const metadata = meta(
  '/',
  `${SITE_NAME}: ${pubs.length} Pubs by Area & Feature`,
  `An independent guide to ${pubs.length} pubs and bars in Brighton & Hove across ${areas.length} areas. Sunday roasts, quizzes, beer gardens, dog-friendly pubs and more.`,
);

export default function Home() {
  const top = rank(pubs).slice(0, 9);
  return (
    <>
      <JsonLd data={websiteSchema()} />
      <Breadcrumbs crumbs={[{ name: 'Home', path: '/' }]} />
      <PageHeader
        kicker="Independent & non-commercial"
        title="Pubs in Brighton & Hove"
        intro={
          <p>
            {pubs.length} pubs and bars across {areas.length} neighbourhoods, from the Lanes to Rottingdean. We only list a
            facility, such as a beer garden or a quiz night, when the pub&apos;s own website says so. Details last checked{' '}
            {monthYear(lastChecked)}.
          </p>
        }
      />

      <section aria-labelledby="by-feature" className="mb-12">
        <h2 id="by-feature" className="mb-4 font-serif text-2xl font-bold text-night">Find a pub for…</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ROUNDUPS.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/best/${r.slug}`}
                className="block h-full rounded-lg border-2 border-brand bg-brand p-4 text-light transition hover:bg-brand-dark"
              >
                <span className="block font-serif text-xl font-bold">{r.label}</span>
                <span className="text-sm text-light">{pubsWith(r.key).length} pubs</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="by-area" className="mb-12">
        <h2 id="by-area" className="mb-4 font-serif text-2xl font-bold text-night">Browse by area</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {areas.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/areas/${a.slug}`}
                className="block h-full rounded-lg border border-brand/20 bg-paper p-4 transition hover:border-accent hover:shadow-sm"
              >
                <span className="block font-serif text-lg font-bold text-brand-ink">{a.name}</span>
                <span className="text-sm text-ink/85">{pubsInArea(a.slug).length} pubs</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="top-rated">
        <h2 id="top-rated" className="mb-1 font-serif text-2xl font-bold text-night">Highest-rated pubs</h2>
        <p className="mb-4 text-sm text-ink/85">
          Ranked by Google rating, weighted by number of reviews. <Link href="/pubs" className="underline">See all {pubs.length} pubs A–Z</Link>.
        </p>
        <PubGrid pubs={top} />
      </section>
    </>
  );
}
