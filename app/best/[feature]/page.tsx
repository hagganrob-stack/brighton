import { notFound } from 'next/navigation';
import { ROUNDUPS, getRoundup, pubsWith } from '@/lib/data';
import { meta, roundupTitle, roundupDescription } from '@/lib/seo';
import { RoundupPage } from '@/components/Roundup';

export const dynamicParams = false;
export function generateStaticParams() {
  return ROUNDUPS.map((r) => ({ feature: r.slug }));
}

type Props = { params: Promise<{ feature: string }> };

export async function generateMetadata({ params }: Props) {
  const r = getRoundup((await params).feature);
  if (!r) return {};
  const list = pubsWith(r.key);
  return meta(`/best/${r.slug}`, roundupTitle(r, list.length), roundupDescription(r, list.length, list));
}

export default async function FeaturePage({ params }: Props) {
  const r = getRoundup((await params).feature);
  if (!r) notFound();
  return <RoundupPage roundup={r} />;
}
