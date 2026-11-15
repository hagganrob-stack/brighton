import { notFound } from 'next/navigation';
import { GUIDES, getGuide, guidePath } from '@/lib/guides';
import { meta } from '@/lib/seo';
import { GuidePage } from '@/components/GuidePage';

// Keyword-targeted guides at the top level, e.g. /pubs-in-brighton. Static routes (about, areas, best, pubs) win.
export const dynamicParams = false;
export function generateStaticParams() {
  return GUIDES.map((g) => ({ guide: g.slug }));
}

type Props = { params: Promise<{ guide: string }> };

export async function generateMetadata({ params }: Props) {
  const g = getGuide((await params).guide);
  if (!g) return {};
  return meta(guidePath(g.slug), g.title, g.description);
}

export default async function Page({ params }: Props) {
  const g = getGuide((await params).guide);
  if (!g) notFound();
  return <GuidePage guide={g} />;
}
