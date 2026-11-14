import Link from 'next/link';
import { pubs, areaName } from '@/lib/data';
import { meta } from '@/lib/seo';
import { itemListSchema } from '@/lib/schema';
import { List } from 'lucide-react';
import { Breadcrumbs, JsonLd, PageHeader } from '@/components/ui';

export const metadata = meta(
  '/pubs',
  `All ${pubs.length} Pubs in Brighton & Hove, A–Z`,
  `Every pub and bar in our independent Brighton & Hove guide, listed A–Z with its neighbourhood. ${pubs.length} venues with hours, facilities and maps.`,
);

export default function AllPubs() {
  const byLetter = new Map<string, typeof pubs>();
  for (const p of pubs) {
    const l = p.name.replace(/^the\s+/i, '')[0].toUpperCase();
    const key = /[A-Z]/.test(l) ? l : '#';
    byLetter.set(key, [...(byLetter.get(key) || []), p]);
  }
  const letters = [...byLetter.keys()].sort();
  const sorted = letters.flatMap((l) => byLetter.get(l)!.sort((a, b) => a.name.replace(/^the\s+/i, '').localeCompare(b.name.replace(/^the\s+/i, ''))));
  return (
    <>
      <JsonLd data={itemListSchema('All pubs in Brighton & Hove', '/pubs', sorted.map((p) => ({ name: p.name, path: `/pubs/${p.slug}` })))} />
      <Breadcrumbs crumbs={[{ name: 'Home', path: '/' }, { name: 'All pubs', path: '/pubs' }]} />
      <PageHeader kicker="A–Z" title="All pubs in Brighton & Hove" icon={List} stats={[{ value: pubs.length, label: 'pubs & bars' }, { value: letters.length, label: 'letters' }]} intro={<p>{pubs.length} pubs and bars, listed A–Z (ignoring &ldquo;The&rdquo;).</p>} />
      <nav aria-label="Jump to letter" className="sticky top-[5.5rem] z-10 -mx-4 mb-8 flex flex-wrap gap-1 bg-white/95 px-4 py-2 sm:top-24 sm:mx-0 sm:rounded-2xl">
        {letters.map((l) => (
          <a key={l} href={`#letter-${l}`} className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-paper font-display font-bold text-navy transition hover:border-blue hover:text-blue">{l}</a>
        ))}
      </nav>
      <div className="columns-1 gap-8 sm:columns-2 lg:columns-3">
        {letters.map((l) => (
          <section key={l} id={`letter-${l}`} aria-labelledby={`h-${l}`} className="mb-6 break-inside-avoid scroll-mt-40 rounded-2xl bg-paper p-5 border border-line">
            <h2 id={`h-${l}`} className="mb-2 text-3xl font-bold text-blue">{l}</h2>
            <ul className="space-y-1">
              {byLetter.get(l)!.sort((a, b) => a.name.replace(/^the\s+/i, '').localeCompare(b.name.replace(/^the\s+/i, ''))).map((p) => (
                <li key={p.slug}>
                  <Link href={`/pubs/${p.slug}`} prefetch={false} className="font-semibold text-navy underline-offset-2 hover:text-blue hover:underline">{p.name}</Link>{' '}
                  <span className="text-sm text-muted">{areaName(p.area)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
