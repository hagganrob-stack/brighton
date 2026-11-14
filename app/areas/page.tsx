import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { areas, pubsInArea, pubs } from '@/lib/data';
import { meta } from '@/lib/seo';
import { itemListSchema } from '@/lib/schema';
import { Breadcrumbs, Hero, JsonLd } from '@/components/ui';

export const metadata = meta(
  '/areas',
  'Brighton & Hove Pubs by Area',
  `Browse ${pubs.length} Brighton & Hove pubs by neighbourhood: ${areas.map((a) => a.name).slice(0, 6).join(', ')} and more.`,
);

export default function AreasIndex() {
  const list = areas.map((a) => ({ a, n: pubsInArea(a.slug) })).sort((x, y) => y.n.length - x.n.length);
  return (
    <>
      <JsonLd data={itemListSchema('Brighton & Hove pub areas', '/areas', list.map(({ a }) => ({ name: `Pubs in ${a.name}`, path: `/areas/${a.slug}` })))} />
      <Breadcrumbs crumbs={[{ name: 'Home', path: '/' }, { name: 'Areas', path: '/areas' }]} />
      <Hero
        image="areas"
        atTop={false}
        kicker="Brighton & Hove"
        title="Pubs by area"
        stats={[
          { value: areas.length, label: 'neighbourhoods' },
          { value: pubs.length, label: 'pubs & bars' },
        ]}
      >
        <p>From the Lanes to Rottingdean, pick a neighbourhood to see every pub in it, ranked.</p>
      </Hero>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map(({ a, n }) => (
          <li key={a.slug}>
            <Link
              href={`/areas/${a.slug}`}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-paper p-6 transition hover:border-slate-300 hover:shadow-lift"
            >
              <span className="flex items-start justify-between gap-3">
                <h2 className="text-2xl font-bold text-navy group-hover:text-blue">{a.name}</h2>
                <span className="rounded-full bg-blue-soft px-2.5 py-1 text-sm font-bold text-blue">{n.length}</span>
              </span>
              <span className="mt-3 text-sm text-muted">Including {n.slice(0, 3).map((p) => p.name).join(', ')}.</span>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue">
                See all {n.length} pubs <ArrowRight aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
