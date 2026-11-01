import Link from 'next/link';
import { pubs, areaName } from '@/lib/data';
import { meta } from '@/lib/seo';
import { itemListSchema } from '@/lib/schema';
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
      <PageHeader title="All pubs in Brighton & Hove" intro={<p>{pubs.length} pubs and bars, listed A–Z (ignoring &ldquo;The&rdquo;).</p>} />
      <nav aria-label="Jump to letter" className="mb-6 flex flex-wrap gap-1">
        {letters.map((l) => (
          <a key={l} href={`#letter-${l}`} className="rounded border border-brand/30 px-2 py-0.5 font-serif font-bold text-brand-ink hover:bg-brand hover:text-light">{l}</a>
        ))}
      </nav>
      <div className="columns-1 gap-8 sm:columns-2 lg:columns-3">
        {letters.map((l) => (
          <section key={l} id={`letter-${l}`} aria-labelledby={`h-${l}`} className="mb-6 break-inside-avoid">
            <h2 id={`h-${l}`} className="mb-1 font-serif text-2xl font-black text-accent">{l}</h2>
            <ul className="space-y-1">
              {byLetter.get(l)!.sort((a, b) => a.name.replace(/^the\s+/i, '').localeCompare(b.name.replace(/^the\s+/i, ''))).map((p) => (
                <li key={p.slug}>
                  <Link href={`/pubs/${p.slug}`} className="font-semibold text-brand-ink underline-offset-2 hover:underline">{p.name}</Link>{' '}
                  <span className="text-sm text-ink/85">{areaName(p.area)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
