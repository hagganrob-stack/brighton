import type { MetadataRoute } from 'next';
import { pubs, areas, ROUNDUPS, combos, lastChecked } from '@/lib/data';
import { abs } from '@/lib/seo';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const at = new Date(lastChecked);
  const entry = (path: string, priority: number, lastModified = at) => ({ url: abs(path), lastModified, priority });
  return [
    entry('/', 1),
    entry('/pubs', 0.7),
    entry('/areas', 0.7),
    entry('/about', 0.3),
    ...ROUNDUPS.map((r) => entry(`/best/${r.slug}`, 0.9)),
    ...areas.map((a) => entry(`/areas/${a.slug}`, 0.8)),
    ...combos().map((c) => entry(`/best/${c.roundup.slug}/${c.area.slug}`, 0.7)),
    ...pubs.map((p) => entry(`/pubs/${p.slug}`, 0.6, new Date(p.detailsCheckedAt))),
  ];
}
