import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { guideMenu, GUIDES } from '@/lib/guides';
import { lastChecked, pubs } from '@/lib/data';
import { meta } from '@/lib/seo';
import { itemListSchema } from '@/lib/schema';
import { webPageSchema } from '@/lib/author';
import { Breadcrumbs, JsonLd, PageHeader, SectionHeading } from '@/components/ui';

const PATH = '/guides';
const TITLE = 'Brighton Pub Guides';

export function generateMetadata() {
  return meta(
    PATH,
    'Brighton Pub Guides: Areas, Food, Quizzes & More',
    `Every Brighton Beer Guide in one place: ${GUIDES.length} guides to pubs in Brighton & Hove by area, food, drink and things to do, built from ${pubs.length} pubs.`,
  );
}

export default function GuidesPage() {
  const groups = guideMenu();
  const all = groups.flatMap((g) => g.items);
  return (
    <>
      <JsonLd
        data={[
          itemListSchema(TITLE, PATH, all.map((i) => ({ name: i.label, path: i.href }))),
          webPageSchema({ path: PATH, name: TITLE, dateModified: lastChecked, type: 'CollectionPage' }),
        ]}
      />
      <Breadcrumbs crumbs={[{ name: 'Home', path: '/' }, { name: 'Guides', path: PATH }]} />
      <PageHeader
        kicker={`${all.length} guides`}
        title={TITLE}
        intro={<p>Every guide on the site, grouped by where you are, what you want to eat or drink, and what you want to do. Each one lists only pubs whose details we could confirm.</p>}
      />
      {groups.map((g) => {
        const id = g.heading.toLowerCase().replace(/\W+/g, '-');
        return (
          <section key={g.heading} aria-labelledby={id} className="mb-14">
            <SectionHeading id={id} eyebrow={`${g.items.length} guides`}>
              {g.heading}
            </SectionHeading>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((i) => (
                <li key={i.href}>
                  <Link href={i.href} className="card card-hover flex h-full flex-col rounded-2xl p-5">
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-display text-lg font-bold leading-snug text-navy">{i.label}</span>
                      <ArrowRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-blue" />
                    </span>
                    <span className="mt-2 text-sm text-muted">{i.blurb}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
