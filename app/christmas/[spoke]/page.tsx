import { notFound } from 'next/navigation';
import { SPOKES, getSpoke } from '@/lib/christmas';
import { meta } from '@/lib/seo';
import { ChristmasPage } from '@/components/ChristmasPage';

export const dynamicParams = false;
export function generateStaticParams() {
  return SPOKES.map((s) => ({ spoke: s.slug }));
}

type Props = { params: Promise<{ spoke: string }> };

export async function generateMetadata({ params }: Props) {
  const s = getSpoke((await params).spoke);
  return s ? meta(s.path, s.title, s.description) : {};
}

export default async function ChristmasSpoke({ params }: Props) {
  const s = getSpoke((await params).spoke);
  if (!s) notFound();
  return <ChristmasPage page={s} />;
}
