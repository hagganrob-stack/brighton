import Link from 'next/link';
import { type Roundup, type Area, ROUNDUPS, areas, pubsWith, MIN_COMBO, monthYear, lastChecked, pubs } from '@/lib/data';
import { itemListSchema, type Crumb } from '@/lib/schema';
import { Breadcrumbs, FEATURE_ICON, Hero, hasHero, JsonLd, LinkPills, PageHeader, PubGrid, SectionHeading } from './ui';

const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
  const kicker = area ? `${roundup.label} · Brighton & Hove` : 'Best of Brighton & Hove';
  const stats = [
    { value: list.length, label: 'pubs confirmed' },
    { value: new Set(list.map((p) => p.area)).size, label: list.length && new Set(list.map((p) => p.area)).size === 1 ? 'area' : 'areas' },
  ];
  const intro = (
    <>
      <p>
        {roundup.blurb.charAt(0).toUpperCase() + roundup.blurb.slice(1)} in {where}, ranked by Google rating (weighted by number of
        reviews). We only include a pub when its own website says so, so there may be others we couldn&apos;t confirm. Checked{' '}
        {monthYear(lastChecked)}.
      </p>
      {area && (
        <p className="text-base">
          See all <Link href={`/best/${roundup.slug}`}>{roundup.label.toLowerCase()} across Brighton & Hove</Link> or{' '}
          <Link href={`/areas/${area.slug}`}>every pub in {area.name}</Link>.
        </p>
      )}
    </>
  );

  return (
    <>
      <JsonLd data={itemListSchema(title, path, list.map((p) => ({ name: p.name, path: `/pubs/${p.slug}` })))} />
      <Breadcrumbs crumbs={crumbs} />

      {/* Features with a photo in data/heroes.json get a photo header (shared by their area pages). */}
      {hasHero(roundup.slug) ? (
        <Hero image={roundup.slug} kicker={kicker} title={title} stats={stats} atTop={false}>
          {intro}
        </Hero>
      ) : (
        <PageHeader kicker={kicker} title={title} icon={FEATURE_ICON[roundup.key]} stats={stats} intro={intro} />
      )}

      {roundup.key === 'pubQuiz' && (
        <section aria-labelledby="quiz-days" className="mb-14">
          <SectionHeading id="quiz-days" eyebrow="Where the website names the night">
            Quiz nights by day
          </SectionHeading>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {WEEK.map((d) => {
              const on = list.filter((p) => p.features.pubQuiz.days?.includes(d));
              if (!on.length) return null;
              return (
                <div key={d} className="rounded-2xl bg-paper p-4 shadow-card ring-1 ring-navy/5">
                  <dt className="flex items-center justify-between font-display text-lg font-bold text-navy">
                    {d}
                    <span className="rounded-full bg-wash px-2 py-0.5 text-xs font-bold text-blue">{on.length}</span>
                  </dt>
                  <dd className="mt-2 space-y-1 text-sm">
                    {on.map((p) => (
                      <Link key={p.slug} href={`/pubs/${p.slug}`} className="block font-medium text-blue hover:underline">
                        {p.name}
                      </Link>
                    ))}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      )}

      <section aria-labelledby="ranked" className="mb-14">
        <SectionHeading id="ranked" eyebrow="Ranked by Google rating">
          {area ? `${list.length} pubs in ${area.name}` : `All ${list.length} pubs, ranked`}
        </SectionHeading>
        <PubGrid pubs={list} ranked />
      </section>

      {areaLinks.length > 0 && (
        <section aria-labelledby="by-area" className="mb-10">
          <SectionHeading id="by-area" eyebrow="Narrow it down">
            {roundup.label} by area
          </SectionHeading>
          <LinkPills label={`${roundup.label} by area`} links={areaLinks} />
        </section>
      )}

      <section aria-labelledby="more">
        <SectionHeading id="more" eyebrow={`Out of ${pubs.length} pubs in this guide`}>
          More guides
        </SectionHeading>
        <LinkPills label="Other feature guides" links={otherRoundups} />
      </section>
    </>
  );
}
