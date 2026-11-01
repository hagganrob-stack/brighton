import { notFound } from 'next/navigation';
import { areas, getArea, pubsInArea, ROUNDUPS, pubsWith, MIN_COMBO, monthYear, lastChecked } from '@/lib/data';
import { meta, areaTitle, areaDescription } from '@/lib/seo';
import { itemListSchema } from '@/lib/schema';
import { AreaMap, Breadcrumbs, JsonLd, LinkPills, PageHeader, PubGrid } from '@/components/ui';

export const dynamicParams = false;
export function generateStaticParams() {
  return areas.map((a) => ({ area: a.slug }));
}

type Props = { params: Promise<{ area: string }> };

export async function generateMetadata({ params }: Props) {
  const a = getArea((await params).area);
  if (!a) return {};
  const list = pubsInArea(a.slug);
  return meta(`/areas/${a.slug}`, areaTitle(a, list.length), areaDescription(a, list.length, list));
}

export default async function AreaPage({ params }: Props) {
  const a = getArea((await params).area);
  if (!a) notFound();
  const list = pubsInArea(a.slug);
  const featureLinks = ROUNDUPS.map((r) => ({ r, n: pubsWith(r.key, a.slug).length }))
    .filter((x) => x.n >= MIN_COMBO)
    .map(({ r, n }) => ({ href: `/best/${r.slug}/${a.slug}`, text: `${r.label} in ${a.name}`, count: n }));
  const confirmed = list.filter((p) => Object.values(p.features).some((f) => f.value === 'yes')).length;
  const others = areas.filter((x) => x.slug !== a.slug);
  const path = `/areas/${a.slug}`;

  return (
    <>
      <JsonLd data={itemListSchema(`Pubs in ${a.name}`, path, list.map((p) => ({ name: p.name, path: `/pubs/${p.slug}` })))} />
      <Breadcrumbs crumbs={[{ name: 'Home', path: '/' }, { name: 'Areas', path: '/areas' }, { name: a.name, path }]} />
      <PageHeader
        kicker="Brighton & Hove"
        title={`Pubs in ${a.name}`}
        intro={
          <p>
            This guide lists {list.length} {list.length === 1 ? 'pub' : 'pubs and bars'} in {a.name}. {confirmed} of them have at least
            one facility confirmed on their own website. They&apos;re ranked by Google rating, weighted by number of reviews. Details last
            checked {monthYear(lastChecked)}.
          </p>
        }
      />

      {featureLinks.length > 0 && (
        <section aria-labelledby="area-features" className="mb-8">
          <h2 id="area-features" className="mb-3 font-serif text-xl font-bold text-night">Popular in {a.name}</h2>
          <LinkPills label={`Feature guides for ${a.name}`} links={featureLinks} />
        </section>
      )}

      <section aria-labelledby="area-pubs" className="mb-10">
        <h2 id="area-pubs" className="mb-4 font-serif text-2xl font-bold text-night">All {list.length} pubs in {a.name}</h2>
        <PubGrid pubs={list} ranked />
      </section>

      <section aria-labelledby="area-map" className="mb-10 max-w-3xl">
        <h2 id="area-map" className="mb-3 font-serif text-2xl font-bold text-night">Map of {a.name}</h2>
        <AreaMap points={list} title={`Map of ${a.name.startsWith("The ") ? a.name : `the ${a.name} area`}, Brighton & Hove`} />
      </section>

      <section aria-labelledby="other-areas">
        <h2 id="other-areas" className="mb-3 font-serif text-xl font-bold text-night">Other areas</h2>
        <LinkPills label="Other areas" links={others.map((o) => ({ href: `/areas/${o.slug}`, text: o.name }))} />
      </section>
    </>
  );
}
