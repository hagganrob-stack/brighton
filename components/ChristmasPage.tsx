import Link from 'next/link';
import { ArrowRight, CalendarCheck, ExternalLink, Info } from 'lucide-react';
import { areaName, addressLines } from '@/lib/data';
import { CHRISTMAS_PAGES, HUB, HUB_PATH, SPOKES, actionLink, basisLine, blurb, lastReviewed, longDate, type XPage, type XPub, type Section } from '@/lib/christmas';
import { itemListSchema } from '@/lib/schema';
import { webPageSchema } from '@/lib/author';
import { Breadcrumbs, Eyebrow, Hero, hasHero, JsonLd, PageHeader, PubCard, Rating, SectionHeading } from './ui';
import { Byline } from './Byline';

function faqSchema(page: XPage) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

function Entry({ x, section }: { x: XPub; section: Extract<Section, { kind: 'pubs' }> }) {
  const link = actionLink(x, section.purpose);
  const [min, max] = section.words ?? [40, 70];
  return (
    <PubCard pub={x.pub}>
      <p className="mt-4 text-ink">{blurb(x, section.purpose, min, max)}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-4 text-sm">
        <span className="flex items-center gap-1.5 text-muted">
          <CalendarCheck aria-hidden="true" className="h-4 w-4 shrink-0" />
          {basisLine(x)}
        </span>
        {link && (
          <a href={link.href} rel="noopener" className="relative z-10 inline-flex items-center gap-1 font-semibold text-blue hover:underline">
            {link.label}
            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="sr-only"> for {x.pub.name}</span>
          </a>
        )}
      </div>
    </PubCard>
  );
}

function CompactRow({ x }: { x: XPub }) {
  return (
    <li className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-0">
      <div className="min-w-0">
        <Link href={`/pubs/${x.pub.slug}`} prefetch={false} className="font-semibold text-navy hover:text-blue">
          {x.pub.name}
        </Link>
        <p className="text-sm text-muted">
          {addressLines(x.pub).street} · {areaName(x.pub.area)} · {basisLine(x)}
        </p>
      </div>
      <Rating pub={x.pub} />
    </li>
  );
}

export function SpokeCards({ exclude, headingLevel = 3 }: { exclude?: string; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as 'h2' | 'h3';
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {SPOKES.filter((s) => s.path !== exclude).map((s) => (
        <li key={s.path}>
          <Link href={s.path} className="card card-hover flex h-full flex-col rounded-2xl p-5">
            <span className="flex items-start justify-between gap-3">
              <H className="font-display text-lg font-bold leading-snug text-navy">{s.h1.replace(/:.*/, '')}</H>
              <ArrowRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-blue" />
            </span>
            <span className="mt-2 text-sm text-muted">{s.card}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ChristmasPage({ page }: { page: XPage }) {
  const isHub = page.path === HUB_PATH;
  const reviewed = lastReviewed(page.listed);
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Christmas', path: HUB_PATH }, ...(isHub ? [] : [{ name: page.short, path: page.path }])];
  const intro = (
    <>
      {page.intro.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
  const stats = page.listed.length ? [{ value: page.listed.length, label: 'pubs listed' }] : undefined;
  return (
    <>
      <JsonLd
        data={[
          ...(page.listed.length ? [itemListSchema(page.h1, page.path, page.listed.map((x) => ({ name: x.pub.name, path: `/pubs/${x.pub.slug}` })))] : []),
          webPageSchema({ path: page.path, name: page.h1, dateModified: reviewed, type: 'CollectionPage' }),
          faqSchema(page),
        ]}
      />
      <Breadcrumbs crumbs={crumbs} />
      {page.image && hasHero(page.image) ? (
        <Hero image={page.image} kicker={page.kicker} title={page.h1} stats={stats}>
          {intro}
        </Hero>
      ) : (
        <PageHeader kicker={page.kicker} title={page.h1} stats={stats} intro={intro} />
      )}
      <Byline checked={reviewed} label={`Last reviewed ${longDate(reviewed)}`} />

      {isHub && (
        <section aria-labelledby="christmas-guides" className="mb-14">
          <SectionHeading id="christmas-guides" eyebrow="Four guides">
            Christmas guides
          </SectionHeading>
          <SpokeCards />
        </section>
      )}

      {page.thin && (
        <p className="mb-10 flex items-start gap-3 rounded-2xl border border-line bg-canvas p-4 text-ink">
          <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-blue" />
          <span>
            <strong className="font-semibold">We are still checking pubs for this page.</strong> We only list pubs once their own website or the pub itself
            confirms the details, so this list will grow.
          </span>
        </p>
      )}

      {page.quickPicks.length > 0 && (
        <section aria-labelledby="quick-picks" className="mb-14">
          <SectionHeading id="quick-picks" eyebrow="Start here">
            Quick picks
          </SectionHeading>
          <ul className="grid gap-3 sm:grid-cols-2">
            {page.quickPicks.map(({ x, why }) => (
              <li key={x.pub.slug}>
                <Link href={`/pubs/${x.pub.slug}`} prefetch={false} className="card card-hover flex h-full items-center justify-between gap-3 rounded-2xl p-4">
                  <span>
                    <span className="block font-display text-lg font-bold text-navy">{x.pub.name}</span>
                    <span className="text-sm text-muted">
                      {areaName(x.pub.area)} · {why}
                    </span>
                  </span>
                  <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-blue" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {page.sections.map((s) => (
        <section key={s.id} id={s.id} aria-labelledby={`h-${s.id}`} className="mb-14 scroll-mt-28">
          <SectionHeading id={`h-${s.id}`} eyebrow={s.kind === 'pubs' ? `${s.pubs.length} ${s.pubs.length === 1 ? 'pub' : 'pubs'}` : undefined}>
            {s.heading}
          </SectionHeading>
          {s.kind === 'text' ? (
            <div className="max-w-3xl space-y-3 text-ink">
              {s.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {s.bullets && (
                <ul className="list-disc space-y-1.5 pl-5">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <>
              {s.intro && <p className="-mt-3 mb-5 max-w-3xl text-muted">{s.intro}</p>}
              {s.compact ? (
                <ul className="card rounded-2xl px-5">
                  {s.pubs.map((x) => (
                    <CompactRow key={x.pub.slug} x={x} />
                  ))}
                </ul>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {s.pubs.map((x) => (
                    <Entry key={x.pub.slug} x={x} section={s} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      ))}

      <section aria-labelledby="how-we-chose" className="mb-14 max-w-3xl">
        <SectionHeading id="how-we-chose" eyebrow="Method">
          How we choose
        </SectionHeading>
        <p className="text-lg text-ink">{page.howWeChose}</p>
        <p className="mt-3 font-semibold text-navy">Details change every year, so check with the pub before you book.</p>
        {page.responsible && <p className="mt-2 text-ink">However you celebrate, please drink responsibly and plan your way home.</p>}
        <p className="mt-2">
          <Link href="/about#how-we-check" className="font-medium text-blue hover:underline">
            How we check pubs
          </Link>
        </p>
      </section>

      <section aria-labelledby="faq" className="mb-14 max-w-3xl">
        <SectionHeading id="faq" eyebrow="FAQ">
          Frequently asked questions
        </SectionHeading>
        <div className="space-y-3">
          {page.faqs.map((f) => (
            <details key={f.q} className="card rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden" open>
              <summary className="cursor-pointer list-none">
                <h3 className="text-lg font-bold">{f.q}</h3>
              </summary>
              <p className="mt-2 text-ink">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="more-christmas" className="mb-14">
        <Eyebrow>Keep exploring</Eyebrow>
        <h2 id="more-christmas" className="mb-5 text-2xl font-bold">
          More Christmas guides
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...CHRISTMAS_PAGES.filter((p) => p.path !== page.path).map((p) => ({ href: p.path, label: p.h1.replace(/:.*/, '') })), ...page.links.filter((l) => !CHRISTMAS_PAGES.some((p) => p.path === l.href))].map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="card card-hover flex h-full items-center justify-between gap-3 rounded-2xl p-4">
                <span className="font-semibold text-navy">{l.label}</span>
                <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-blue" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export { HUB };
