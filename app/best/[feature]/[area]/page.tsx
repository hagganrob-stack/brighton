import { notFound } from 'next/navigation';
import { combos, getRoundup, getArea, hasCombo, pubsWith } from '@/lib/data';
import { meta, roundupTitle, roundupDescription } from '@/lib/seo';
import { RoundupPage } from '@/components/Roundup';

// Only area + feature combinations with MIN_COMBO (3) or more qualifying pubs get a page.
export const dynamicParams = false;
export function generateStaticParams() {
  return combos().map((c) => ({ feature: c.roundup.slug, area: c.area.slug }));
}

type Props = { params: Promise<{ feature: string; area: string }> };

async function resolve(params: Props['params']) {
  const { feature, area } = await params;
  const r = getRoundup(feature);
  const a = getArea(area);
  return r && a && hasCombo(r.slug, a.slug) ? { r, a } : null;
}

export async function generateMetadata({ params }: Props) {
  const x = await resolve(params);
  if (!x) return {};
  const list = pubsWith(x.r.key, x.a.slug);
  return meta(`/best/${x.r.slug}/${x.a.slug}`, roundupTitle(x.r, list.length, x.a), roundupDescription(x.r, list.length, list, x.a));
}

export default async function ComboPage({ params }: Props) {
  const x = await resolve(params);
  if (!x) notFound();
  return <RoundupPage roundup={x.r} area={x.a} />;
}
