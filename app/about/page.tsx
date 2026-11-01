import Link from 'next/link';
import { pubs, areas, monthYear, lastChecked, FEATURE_LABELS, FEATURE_ORDER } from '@/lib/data';
import { meta, SITE_NAME } from '@/lib/seo';
import { Breadcrumbs, PageHeader } from '@/components/ui';

export const metadata = meta(
  '/about',
  'About This Guide: How We Check Brighton & Hove Pubs',
  `How the ${SITE_NAME} is put together: where the data comes from, how facilities are confirmed and how pubs are ranked.`,
);

export default function About() {
  const websites = pubs.filter((p) => /own website/.test(p.featuresSource)).length;
  return (
    <>
      <Breadcrumbs crumbs={[{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }]} />
      <PageHeader title="About this guide" intro={<p>An independent, non-commercial guide to {pubs.length} pubs and bars in Brighton & Hove. No pub has paid to be included, and there are no ads or affiliate links.</p>} />
      <div className="prose-pub max-w-2xl space-y-8 text-[1.05rem]">
        <section aria-labelledby="sources">
          <h2 id="sources" className="mb-2 font-serif text-2xl font-bold text-green">Where the information comes from</h2>
          <p>
            Names, addresses, phone numbers, opening hours and ratings come from each venue&apos;s public Google Maps listing. We searched{' '}
            {areas.length} areas: {areas.map((a) => a.name).join(', ')}. Each pub is assigned to the area it&apos;s closest to.
          </p>
          <p>
            Facilities come only from the pub&apos;s own website. We checked {websites} websites. A facility is marked &ldquo;yes&rdquo; or
            &ldquo;no&rdquo; only when the site clearly says so; otherwise it shows as &ldquo;not stated&rdquo;. Each confirmed facility links
            to the page it came from.
          </p>
          <p>We track: {FEATURE_ORDER.map((k) => FEATURE_LABELS[k].toLowerCase()).join(', ')}.</p>
        </section>
        <section aria-labelledby="descriptions">
          <h2 id="descriptions" className="mb-2 font-serif text-2xl font-bold text-green">How descriptions are written</h2>
          <p>
            Each pub description is built only from the facts above: location, rating, opening hours, confirmed facilities and the nearest
            pubs in the guide. We don&apos;t copy text from pub websites or reviews, and we don&apos;t add details we haven&apos;t checked.
          </p>
        </section>
        <section aria-labelledby="ranking">
          <h2 id="ranking" className="mb-2 font-serif text-2xl font-bold text-green">How pubs are ranked</h2>
          <p>
            Lists are ordered by Google rating, weighted by number of reviews. That stops a 5.0 from a handful of reviews outranking a 4.6
            from hundreds. Area and feature combination pages only exist where at least three pubs qualify.
          </p>
        </section>
        <section aria-labelledby="freshness">
          <h2 id="freshness" className="mb-2 font-serif text-2xl font-bold text-green">Keeping it up to date</h2>
          <p>
            Details were last checked in {monthYear(lastChecked)}, and each pub page shows when its own details were checked. Pubs change
            their hours and events often, so please check with the pub before you travel.
          </p>
          <p>
            Maps are from <a href="https://www.openstreetmap.org/copyright" className="underline">OpenStreetMap</a>. This site uses no
            photos from Google. <Link href="/" className="underline">Back to the guide</Link>.
          </p>
        </section>
      </div>
    </>
  );
}
