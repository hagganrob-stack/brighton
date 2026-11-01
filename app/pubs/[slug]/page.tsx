import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  pubs,
  getPub,
  areaName,
  nearbyPubs,
  addressLines,
  monthYear,
  FEATURE_LABELS,
  FEATURE_ORDER,
  ROUNDUPS,
  hasCombo,
  type FeatureKey,
} from '@/lib/data';
import { DAYS, displayHours } from '@/lib/hours';
import { meta, pubTitle, pubDescription } from '@/lib/seo';
import { pubSchema } from '@/lib/schema';
import { Breadcrumbs, JsonLd, OsmMap, PubCard } from '@/components/ui';

export const dynamicParams = false;
export function generateStaticParams() {
  return pubs.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const p = getPub((await params).slug);
  if (!p) return {};
  return meta(`/pubs/${p.slug}`, pubTitle(p), pubDescription(p));
}

const ROUNDUP_BY_KEY = Object.fromEntries(ROUNDUPS.map((r) => [r.key, r])) as Partial<Record<FeatureKey, (typeof ROUNDUPS)[number]>>;

function FeatureRow({ k, pub }: { k: FeatureKey; pub: NonNullable<ReturnType<typeof getPub>> }) {
  const f = pub.features[k];
  const roundup = ROUNDUP_BY_KEY[k];
  const label = FEATURE_LABELS[k];
  const status =
    f.value === 'yes' ? (
      <span className="font-semibold text-green">✓ Yes</span>
    ) : f.value === 'no' ? (
      <span className="font-semibold text-claret">✗ No</span>
    ) : (
      <span className="text-ink/75">Not stated</span>
    );
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-green/10 py-2 last:border-0">
      <dt>
        {f.value === 'yes' && roundup ? (
          <Link href={hasCombo(roundup.slug, pub.area) ? `/best/${roundup.slug}/${pub.area}` : `/best/${roundup.slug}`} className="underline decoration-brass/60 underline-offset-2 hover:text-green">
            {label}
          </Link>
        ) : (
          label
        )}
        {k === 'pubQuiz' && f.value === 'yes' && f.days?.length ? <span className="text-sm text-ink/70"> ({f.days.join(', ')})</span> : null}
      </dt>
      <dd className="flex items-baseline gap-2 text-right text-sm">
        {status}
        {f.value !== 'unknown' && f.evidence?.url && (
          <a href={f.evidence.url} rel="nofollow noopener" className="text-xs text-ink/75 underline" aria-label={`Source for ${label.toLowerCase()}`}>
            source
          </a>
        )}
      </dd>
    </div>
  );
}

export default async function PubPage({ params }: Props) {
  const pub = getPub((await params).slug);
  if (!pub) notFound();
  const area = areaName(pub.area);
  const { street, town, postcode } = addressLines(pub);
  const near = nearbyPubs(pub, 5);
  const yes = FEATURE_ORDER.filter((k) => pub.features[k].value === 'yes');
  const website = pub.website ? pub.website.split('?')[0] : null;
  const websiteHost = website ? new URL(website).hostname.replace(/^www\./, '') : null;

  return (
    <>
      <JsonLd data={pubSchema(pub)} />
      <Breadcrumbs
        crumbs={[
          { name: 'Home', path: '/' },
          { name: 'Areas', path: '/areas' },
          { name: area, path: `/areas/${pub.area}` },
          { name: pub.name, path: `/pubs/${pub.slug}` },
        ]}
      />

      <header className="mb-6">
        <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-brass">
          {pub.googleType || 'Pub'} in <Link href={`/areas/${pub.area}`} className="underline underline-offset-2">{area}</Link>
        </p>
        <h1 className="font-serif text-4xl font-black leading-[1.05] text-green sm:text-5xl">{pub.name}</h1>
        <p className="mt-2 text-ink/80">
          {street}, {town} {postcode}
        </p>
        {yes.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Confirmed facilities">
            {yes.map((k) => (
              <li key={k} className="rounded-full bg-green px-2.5 py-0.5 text-sm font-medium text-cream">{FEATURE_LABELS[k]}</li>
            ))}
          </ul>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0">
          <section aria-labelledby="about-pub" className="prose-pub max-w-2xl text-[1.05rem]">
            <h2 id="about-pub" className="mb-3 font-serif text-2xl font-bold text-green">About {pub.name}</h2>
            {pub.description.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </section>

          <section aria-labelledby="facilities" className="mt-10 max-w-2xl">
            <h2 id="facilities" className="font-serif text-2xl font-bold text-green">Facilities</h2>
            <p className="mb-2 text-sm text-ink/70">
              From the pub&apos;s own website. &ldquo;Not stated&rdquo; means we couldn&apos;t confirm it either way, so check with the pub.
            </p>
            <dl className="rounded-lg border border-green/15 bg-paper px-4">
              {FEATURE_ORDER.map((k) => (
                <FeatureRow key={k} k={k} pub={pub} />
              ))}
            </dl>
          </section>

          <section aria-labelledby="map" className="mt-10 max-w-2xl">
            <h2 id="map" className="mb-3 font-serif text-2xl font-bold text-green">Map</h2>
            <OsmMap lat={pub.lat} lng={pub.lng} title={`Map showing the location of ${pub.name} on ${street}, ${area}`} />
            <p className="mt-2 text-sm">
              <a href={pub.googleMapsUrl} rel="noopener" className="font-semibold text-green underline">
                Get directions in Google Maps
              </a>
            </p>
          </section>
        </div>

        <aside className="space-y-6">
          <section aria-labelledby="details" className="rounded-lg border border-green/15 bg-paper p-5">
            <h2 id="details" className="mb-3 font-serif text-xl font-bold text-green">Details</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-semibold">Address</dt>
                <dd>
                  {street}
                  <br />
                  {town} {postcode}
                </dd>
              </div>
              {pub.phone && (
                <div>
                  <dt className="font-semibold">Phone</dt>
                  <dd><a href={`tel:${pub.phone.replace(/\s/g, '')}`} className="text-green underline">{pub.phone}</a></dd>
                </div>
              )}
              {website && (
                <div>
                  <dt className="font-semibold">Website</dt>
                  <dd><a href={website} rel="noopener" className="break-all text-green underline">{websiteHost}</a></dd>
                </div>
              )}
              {pub.rating != null && (
                <div>
                  <dt className="font-semibold">Google rating</dt>
                  <dd>
                    {pub.rating.toFixed(1)} / 5 from {(pub.reviewCount ?? 0).toLocaleString('en-GB')} reviews
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section aria-labelledby="hours" className="rounded-lg border border-green/15 bg-paper p-5">
            <h2 id="hours" className="mb-3 font-serif text-xl font-bold text-green">Opening hours</h2>
            {pub.openingHours ? (
              <table className="w-full text-sm">
                <caption className="sr-only">Opening hours for {pub.name}</caption>
                <tbody>
                  {DAYS.map((d) => (
                    <tr key={d} className="border-b border-green/10 last:border-0">
                      <th scope="row" className="py-1.5 text-left font-medium capitalize">{d}</th>
                      <td className="py-1.5 text-right">{displayHours(pub.openingHours?.[d])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm">Opening hours aren&apos;t listed. Contact the pub before visiting.</p>
            )}
            <p className="mt-3 text-xs text-ink/75">Hours from the pub&apos;s Google listing and can change.</p>
          </section>

          <p className="rounded-lg bg-green/5 p-4 text-sm text-ink/80">
            <strong>Details last checked {monthYear(pub.detailsCheckedAt)}.</strong> Spotted something out of date?{' '}
            <Link href="/about" className="underline">How this guide works</Link>.
          </p>
        </aside>
      </div>

      {near.length > 0 && (
        <section aria-labelledby="nearby" className="mt-12">
          <h2 id="nearby" className="mb-4 font-serif text-2xl font-bold text-green">Pubs near {pub.name}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {near.map(({ pub: n, distanceM }) => (
              <li key={n.slug}>
                <PubCard pub={n} distanceM={distanceM} />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm">
            <Link href={`/areas/${pub.area}`} className="font-semibold text-green underline">
              All pubs in {area}
            </Link>
          </p>
        </section>
      )}
    </>
  );
}
