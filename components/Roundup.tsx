import Link from 'next/link';
import { type Roundup, type Area, ROUNDUPS, areas, pubsWith, MIN_COMBO, monthYear, lastChecked, pubs } from '@/lib/data';
import { itemListSchema, type Crumb } from '@/lib/schema';
import { Breadcrumbs, JsonLd, LinkPills, PageHeader, PubGrid } from './ui';

// Shared layout for /best/[feature] and /best/[feature]/[area].
export function RoundupPage({ roundup, area }: { roundup: Roundup; area?: Area }) {
  const list = pubsWith(roundup.key, area?.slug);
  const where = area ? area.name : 'Brighton & Hove';
  const path = area ? `/best/${roundup.slug}/${area.slug}` : `/best/${roundup.slug}`;
  const title = `${roundup.heading} in ${where}`;
  const crumbs: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: roundup.label, path: `/best/${roundup.slug}` },
    ...(area ? [{ name: area.name, path }] : []),
  ];
  const areaLinks = areas
    .map((a) => ({ a, n: pubsWith(roundup.key, a.slug).length }))
    .filter((x) => x.n >= MIN_COMBO && x.a.slug !== area?.slug)
    .map(({ a, n }) => ({ href: `/best/${roundup.slug}/${a.slug}`, text: a.name, count: n }));
  const otherRoundups = ROUNDUPS.filter((r) => r.slug !== roundup.slug).map((r) => {
    const n = pubsWith(r.key, area?.slug).length;
    const href = area && n >= MIN_COMBO ? `/best/${r.slug}/${area.slug}` : `/best/${r.slug}`;
    return { href, text: area && n >= MIN_COMBO ? `${r.label} in ${area.name}` : r.label };
  });
  const quizDays = roundup.key === 'pubQuiz';

  return (
    <>
      <JsonLd data={itemListSchema(title, path, list.map((p) => ({ name: p.name, path: `/pubs/${p.slug}` })))} />
      <Breadcrumbs crumbs={crumbs} />
      <PageHeader
        kicker={area ? 'Brighton & Hove' : `${list.length} pubs`}
        title={title}
        intro={
          <>
            <p>
              {list.length} {roundup.blurb} in {where}, ranked by Google rating (weighted by number of reviews). We only include a pub when
              its own website says so, so there may be others we couldn&apos;t confirm. Checked {monthYear(lastChecked)}.
            </p>
            {area && (
              <p className="mt-2 text-base">
                See all <Link href={`/best/${roundup.slug}`} className="underline">{roundup.label.toLowerCase()} across Brighton & Hove</Link> or{' '}
                <Link href={`/areas/${area.slug}`} className="underline">every pub in {area.name}</Link>.
              </p>
            )}
          </>
        }
      />

      {quizDays && (
        <section aria-labelledby="quiz-days" className="mb-8 max-w-3xl">
          <h2 id="quiz-days" className="mb-3 font-serif text-xl font-bold text-night">Quiz nights by day</h2>
          <dl className="grid gap-x-6 gap-y-2 rounded-lg border border-brand/15 bg-paper p-4 text-sm sm:grid-cols-2">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => {
              const on = list.filter((p) => p.features.pubQuiz.days?.includes(d));
              if (!on.length) return null;
              return (
                <div key={d}>
                  <dt className="font-semibold">{d}</dt>
                  <dd>{on.map((p, i) => (<span key={p.slug}>{i > 0 && ', '}<Link href={`/pubs/${p.slug}`} className="text-brand-ink underline">{p.name}</Link></span>))}</dd>
                </div>
              );
            })}
          </dl>
          <p className="mt-2 text-xs text-ink/85">Only where the pub&apos;s website names the day. Others below don&apos;t say which night.</p>
        </section>
      )}

      <section aria-labelledby="ranked" className="mb-10">
        <h2 id="ranked" className="mb-4 font-serif text-2xl font-bold text-night">
          {area ? `${list.length} pubs in ${area.name}` : `All ${list.length} pubs, ranked`}
        </h2>
        <PubGrid pubs={list} ranked />
      </section>

      {areaLinks.length > 0 && (
        <section aria-labelledby="by-area" className="mb-8">
          <h2 id="by-area" className="mb-3 font-serif text-xl font-bold text-night">{roundup.label} by area</h2>
          <LinkPills label={`${roundup.label} by area`} links={areaLinks} />
        </section>
      )}

      <section aria-labelledby="more">
        <h2 id="more" className="mb-3 font-serif text-xl font-bold text-night">More guides</h2>
        <LinkPills label="Other feature guides" links={otherRoundups} />
        <p className="mt-4 text-sm text-ink/85">Out of {pubs.length} pubs in this guide.</p>
      </section>
    </>
  );
}
