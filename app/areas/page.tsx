import Link from 'next/link';
import { areas, pubsInArea, pubs } from '@/lib/data';
import { meta } from '@/lib/seo';
import { itemListSchema } from '@/lib/schema';
import { Breadcrumbs, JsonLd, PageHeader } from '@/components/ui';

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
      <PageHeader title="Pubs by area" intro={<p>{areas.length} neighbourhoods across Brighton & Hove, with the number of pubs in each.</p>} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map(({ a, n }) => (
          <li key={a.slug} className="rounded-lg border border-green/15 bg-paper p-5">
            <h2 className="font-serif text-2xl font-bold text-green">
              <Link href={`/areas/${a.slug}`} className="hover:underline">{a.name}</Link>
            </h2>
            <p className="text-sm text-ink/70">{n.length} pubs</p>
            <p className="mt-2 text-sm">Including {n.slice(0, 3).map((p) => p.name).join(', ')}.</p>
          </li>
        ))}
      </ul>
    </>
  );
}
