import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Beer, CalendarCheck, Check, Clock, ExternalLink, Globe, MapPin, Minus, Navigation, Phone, Star, X } from 'lucide-react';
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
  type Pub,
} from '@/lib/data';
import { DAYS, displayHours } from '@/lib/hours';
import { meta, pubTitle, pubDescription } from '@/lib/seo';
import { pubSchema } from '@/lib/schema';
import { Breadcrumbs, FEATURE_ICON, JsonLd, OsmMap, PageHeader, PubCard, SectionHeading } from '@/components/ui';
import { CityMap } from '@/components/CityMap';

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

function FeatureTile({ k, pub }: { k: FeatureKey; pub: Pub }) {
  const f = pub.features[k];
  const roundup = ROUNDUP_BY_KEY[k];
  const label = FEATURE_LABELS[k];
  const Icon = FEATURE_ICON[k];
  const yes = f.value === 'yes';
  const no = f.value === 'no';
  return (
    <li
      className={`relative flex items-start gap-3 rounded-2xl border p-4 transition ${
        yes ? 'border-blue/30 bg-blue-soft/40' : 'border-line bg-paper'
      }`}
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${yes ? 'bg-blue text-white' : 'bg-canvas text-muted'}`}>
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`font-semibold ${yes ? 'text-navy' : 'text-muted'}`}>
          {yes && roundup ? (
            <Link href={hasCombo(roundup.slug, pub.area) ? `/best/${roundup.slug}/${pub.area}` : `/best/${roundup.slug}`} className="hover:text-blue hover:underline">
              {label}
            </Link>
          ) : (
            label
          )}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm">
          {yes ? (
            <span className="inline-flex items-center gap-1 font-semibold text-blue">
              <Check aria-hidden="true" className="h-4 w-4" strokeWidth={3} /> Yes
              {k === 'pubQuiz' && f.days?.length ? <span className="font-normal text-muted">· {f.days.join(', ')}</span> : null}
            </span>
          ) : no ? (
            <span className="inline-flex items-center gap-1 font-semibold text-negative">
              <X aria-hidden="true" className="h-4 w-4" strokeWidth={3} /> No
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted">
              <Minus aria-hidden="true" className="h-4 w-4" /> Not stated
            </span>
          )}
          {f.value !== 'unknown' && f.evidence?.url && (
            <a href={f.evidence.url} rel="nofollow noopener" className="text-xs text-muted underline hover:text-blue" aria-label={`Source for ${label.toLowerCase()}`}>
              source
            </a>
          )}
        </p>
      </div>
    </li>
  );
}

function DetailRow({ icon: Icon, label, children }: { icon: typeof Phone; label: string; children: React.ReactNode }) {
  return (
    <div className="relative min-h-9 pl-12">
      <dt className="text-xs font-bold uppercase tracking-wider text-muted">
        <span className="absolute left-0 top-0 grid h-9 w-9 place-items-center rounded-xl bg-blue-soft text-blue" aria-hidden="true">
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </dt>
      <dd className="min-w-0 text-sm text-ink">{children}</dd>
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

  const stats = [
    ...(pub.rating != null ? [{ value: pub.rating.toFixed(1), label: 'Google rating' }] : []),
    ...(pub.reviewCount ? [{ value: pub.reviewCount.toLocaleString('en-GB'), label: 'reviews' }] : []),
    { value: yes.length, label: yes.length === 1 ? 'facility confirmed' : 'facilities confirmed' },
  ];

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

      <PageHeader
        kicker={`${pub.googleType || 'Pub'} in ${area}`}
        title={pub.name}
        icon={Beer}
        stats={stats}
        art={<CityMap id="pub-map" eager highlightPub={pub} className="w-full" />}
        intro={
          <p className="flex items-start gap-1.5">
            <MapPin aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />
            <span>
              {street}, {town} {postcode}
            </span>
          </p>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-12">
          <section aria-labelledby="about-pub" className="rounded-3xl bg-paper p-6 border border-line sm:p-8">
            <h2 id="about-pub" className="mb-4 text-2xl font-bold text-navy">About {pub.name}</h2>
            <div className="prose-pub text-[1.05rem] text-ink">
              {pub.description.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          <section aria-labelledby="facilities">
            <SectionHeading id="facilities" eyebrow="From the pub's own website">
              Facilities
            </SectionHeading>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {FEATURE_ORDER.map((k) => (
                <FeatureTile key={k} k={k} pub={pub} />
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted">&ldquo;Not stated&rdquo; means we couldn&apos;t confirm it either way, so check with the pub.</p>
          </section>

          <section aria-labelledby="map">
            <SectionHeading id="map" eyebrow={area}>
              Map
            </SectionHeading>
            <OsmMap lat={pub.lat} lng={pub.lng} title={`Map showing the location of ${pub.name} on ${street}, ${area}`} />
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <section aria-labelledby="details" className="rounded-3xl bg-paper p-6 border border-line">
            <h2 id="details" className="mb-4 text-xl font-bold text-navy">Details</h2>
            <dl className="space-y-4">
              <DetailRow icon={MapPin} label="Address">
                {street}
                <br />
                {town} {postcode}
              </DetailRow>
              {pub.phone && (
                <DetailRow icon={Phone} label="Phone">
                  <a href={`tel:${pub.phone.replace(/\s/g, '')}`} className="font-semibold text-blue hover:underline">{pub.phone}</a>
                </DetailRow>
              )}
              {website && (
                <DetailRow icon={Globe} label="Website">
                  <a href={website} rel="noopener" className="inline-flex items-center gap-1 break-all font-semibold text-blue hover:underline">
                    {websiteHost} <ExternalLink aria-hidden="true" className="h-3 w-3 shrink-0" />
                  </a>
                </DetailRow>
              )}
              {pub.rating != null && (
                <DetailRow icon={Star} label="Google rating">
                  {pub.rating.toFixed(1)} / 5 from {(pub.reviewCount ?? 0).toLocaleString('en-GB')} reviews
                </DetailRow>
              )}
            </dl>
            <a
              href={pub.googleMapsUrl}
              rel="noopener"
              className="mt-6 flex items-center justify-center gap-2 rounded-full bg-blue px-5 py-3 font-semibold text-white transition hover:bg-blue-deep"
            >
              <Navigation aria-hidden="true" className="h-4 w-4" /> Get directions
            </a>
          </section>

          <section aria-labelledby="hours" className="rounded-3xl bg-paper p-6 border border-line">
            <h2 id="hours" className="mb-4 flex items-center gap-2 text-xl font-bold text-navy">
              <Clock aria-hidden="true" className="h-5 w-5 text-blue" /> Opening hours
            </h2>
            {pub.openingHours ? (
              <table className="w-full text-sm">
                <caption className="sr-only">Opening hours for {pub.name}</caption>
                <tbody>
                  {DAYS.map((d) => (
                    <tr key={d} className="border-b border-navy/5 last:border-0">
                      <th scope="row" className="py-2 text-left font-medium capitalize text-navy">{d}</th>
                      <td className="py-2 text-right tabular-nums text-ink">{displayHours(pub.openingHours?.[d])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm">Opening hours aren&apos;t listed. Contact the pub before visiting.</p>
            )}
            <p className="mt-3 text-xs text-muted">From the pub&apos;s Google listing. Hours can change.</p>
          </section>

          <p className="flex gap-3 rounded-3xl bg-blue-soft p-5 text-sm text-ink">
            <CalendarCheck aria-hidden="true" className="h-5 w-5 shrink-0 text-blue" />
            <span>
              <strong>Details last checked {monthYear(pub.detailsCheckedAt)}.</strong> Spotted something out of date?{' '}
              <Link href="/about" className="font-semibold text-blue underline">How this guide works</Link>.
            </span>
          </p>
        </aside>
      </div>

      {near.length > 0 && (
        <section aria-labelledby="nearby" className="mt-16">
          <SectionHeading
            id="nearby"
            eyebrow="Within walking distance"
            action={
              <Link href={`/areas/${pub.area}`} className="text-sm font-semibold text-blue hover:underline">
                All pubs in {area}
              </Link>
            }
          >
            Pubs near {pub.name}
          </SectionHeading>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {near.map(({ pub: n, distanceM }) => (
              <li key={n.slug}>
                <PubCard pub={n} distanceM={distanceM} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
