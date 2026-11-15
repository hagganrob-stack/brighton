import { HUB } from '@/lib/christmas';
import { meta } from '@/lib/seo';
import { ChristmasPage } from '@/components/ChristmasPage';

export const metadata = meta(HUB.path, HUB.title, HUB.description);

export default function ChristmasHub() {
  return <ChristmasPage page={HUB} />;
}
