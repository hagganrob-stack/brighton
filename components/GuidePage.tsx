import Link from 'next/link';
import { ArrowRight, MapPin, TriangleAlert } from 'lucide-react';
import { areaName, addressLines, lastChecked, yesFeatures, type Pub } from '@/lib/data';
import { pubBlurb, getGuide, guidePath, type Guide } from '@/lib/guides';
import { itemListSchema } from '@/lib/schema';
import { webPageSchema } from '@/lib/author';
import { Breadcrumbs, Eyebrow, FeatureChip, Hero, hasHero, JsonLd, PageHeader, Rating, SectionHeading } from './ui';
import { Byline } from './Byline';

function faqSchema(guide: Guide) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

function Entry({ pub, guide }: { pub: Pub; guide: Guide }) {
  const feats = yesFeatures(pub).filter((k) => !(guide.skip ?? []).includes(k)).slice(0, 5);
  return (
    <article className="card rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-xl font-bold leading-snug">
          <Link href={`/pubs/${pub.slug}`} prefetch={false} className="hover:text-blue">
            {pub.name}
          </Link>
        </h3>
        <Rating pub={pub} />
      </div>
      <p className="mt-1 flex items-center gap-1 text-sm text-muted">
        <MapPin aria-hidden="true" className="h-3.5 w-3.5" /> {addressLines(pub).street} · {areaName(pub.area)}
      </p>
      <p className="mt-3 text-ink">{pubBlurb(pub, guide)}</p>
      {feats.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Confirmed facilities">
          {feats.map((k) => (
            <FeatureChip key={k} k={k} />
          ))}
        </ul>
      )}
      <Link href={`/pubs/${pub.slug}`} prefetch={false} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue hover:underline">
        Hours, map and details <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </article>
  );
}

function CompactRow({ pub, guide }: { pub: Pub; guide: Guide }) {
  const focus = guide.focus?.(pub);
  return (
    <li className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-0">
      <div className="min-w-0">
        <Link href={`/pubs/${pub.slug}`} prefetch={false} className="font-semibold text-navy hover:text-blue">
          {pub.name}
        </Link>
        <p className="text-sm text-muted">
          {addressLines(pub).street} · {areaName(pub.area)}
          {focus ? ` · ${focus}` : ''}
        </p>
      </div>
      <Rating pub={pub} />
    </li>
  );
}

export function GuidePage({ guide }: { guide: Guide }) {
  const path = guidePath(guide.slug);
  const related = [
    ...(guide.links ?? []),
    ...guide.related
      .map((s) => getGuide(s))
      .filter((g): g is Guide => !!g)
      .map((g) => ({ href: guidePath(g.slug), label: g.h1.replace(/:.*/, '') })),
  ];
  const header = (
    <>
      {guide.intro.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
  return (
    <>
      <JsonLd
        data={[
          itemListSchema(guide.h1, path, guide.list.map((p) => ({ name: p.name, path: `/pubs/${p.slug}` }))),
          webPageSchema({ path, name: guide.h1, dateModified: lastChecked, type: 'CollectionPage' }),
          ...(guide.faqs.length ? [faqSchema(guide)] : []),
        ]}
      />
      <Breadcrumbs crumbs={[{ name: 'Home', path: '/' }, { name: guide.h1.replace(/:.*/, ''), path }]} />
      {guide.image && hasHero(guide.image) ? (
        <Hero image={guide.image} kicker={guide.kicker} title={guide.h1} stats={[{ value: guide.list.length, label: 'pubs listed' }]}>
          {header}
        </Hero>
      ) : (
        <PageHeader kicker={guide.kicker} title={guide.h1} stats={[{ value: guide.list.length, label: 'pubs listed' }]} intro={header} />
      )}
      <Byline checked={lastChecked} />

      {guide.quickPicks.length > 0 && (
        <section aria-labelledby="quick-picks" className="mb-14">
          <SectionHeading id="quick-picks" eyebrow="If you only read one thing">
            Quick picks
          </SectionHeading>
          <ul className="grid gap-3 sm:grid-cols-2">
            {guide.quickPicks.map(({ pub, why }) => (
              <li key={pub.slug}>
                <Link href={`/pubs/${pub.slug}`} prefetch={false} className="card card-hover flex h-full items-center justify-between gap-3 rounded-2xl p-4">
                  <span>
                    <span className="block font-display text-lg font-bold text-navy">{pub.name}</span>
                    <span className="text-sm text-muted">{why}</span>
                  </span>
                  <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-blue" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {guide.note && (
        <p className="mb-10 flex items-start gap-3 rounded-2xl border border-line bg-canvas p-4 text-sm text-ink">
          <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-blue" />
          {guide.note}
        </p>
      )}

      {guide.groups.map((g) => (
        <section key={g.id} id={g.id} aria-labelledby={`h-${g.id}`} className="mb-14 scroll-mt-28">
          <SectionHeading id={`h-${g.id}`} eyebrow={`${g.pubs.length} ${g.pubs.length === 1 ? 'pub' : 'pubs'}`}>
            {g.heading}
          </SectionHeading>
          {g.intro && <p className="-mt-3 mb-5 max-w-3xl text-muted">{g.intro}</p>}
          {g.compact ? (
            <ul className="card rounded-2xl px-5">
              {g.pubs.map((p) => (
                <CompactRow key={p.slug} pub={p} guide={guide} />
              ))}
            </ul>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {g.pubs.map((p) => (
                <Entry key={p.slug} pub={p} guide={guide} />
              ))}
            </div>
          )}
        </section>
      ))}

      <section aria-labelledby="how-we-chose" className="mb-14 max-w-3xl">
        <SectionHeading id="how-we-chose" eyebrow="Method">
          How we chose
        </SectionHeading>
        <p className="text-lg text-ink">{guide.howWeChose}</p>
        <p className="mt-3 text-ink">
          Details can change, so check with the pub before you go. <Link href="/about#how-we-check" className="font-medium text-blue hover:underline">How we check pubs</Link>.
        </p>
      </section>

      {guide.faqs.length > 0 && (
        <section aria-labelledby="faq" className="mb-14 max-w-3xl">
          <SectionHeading id="faq" eyebrow="FAQ">
            Frequently asked questions
          </SectionHeading>
          <div className="space-y-3">
            {guide.faqs.map((f) => (
              <details key={f.q} className="card group rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden" open>
                <summary className="cursor-pointer list-none">
                  <h3 className="text-lg font-bold">{f.q}</h3>
                </summary>
                <p className="mt-2 text-ink">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related">
          <Eyebrow>Keep exploring</Eyebrow>
          <h2 id="related" className="mb-5 text-2xl font-bold">
            Related guides
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((g) => (
              <li key={g.href}>
                <Link href={g.href} className="card card-hover flex h-full items-center justify-between gap-3 rounded-2xl p-4">
                  <span className="font-semibold text-navy">{g.label}</span>
                  <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-blue" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
