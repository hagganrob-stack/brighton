import type { MetadataRoute } from 'next';
import { pubs, areas, ROUNDUPS, combos, lastChecked, ROUNDUP_GUIDE, AREA_GUIDE } from '@/lib/data';
import { GUIDES, guidePath } from '@/lib/guides';
import { abs } from '@/lib/seo';
import { CHRISTMAS_PAGES, lastReviewed } from '@/lib/christmas';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const at = new Date(lastChecked);
  const entry = (path: string, priority: number, lastModified = at) => ({ url: abs(path), lastModified, priority });
  return [
    entry('/', 1),
    entry('/guides', 0.8),
    ...CHRISTMAS_PAGES.map((p) => entry(p.path, 0.8, new Date(lastReviewed(p.listed)))),
    entry('/areas', 0.7),
    entry('/about', 0.3),
    ...GUIDES.map((g) => entry(guidePath(g.slug), g.slug === 'pubs-in-brighton' ? 1 : 0.9)),
    ...ROUNDUPS.filter((r) => !ROUNDUP_GUIDE[r.slug]).map((r) => entry(`/best/${r.slug}`, 0.8)),
    ...areas.filter((a) => !AREA_GUIDE[a.slug]).map((a) => entry(`/areas/${a.slug}`, 0.8)),
    ...combos().map((c) => entry(`/best/${c.roundup.slug}/${c.area.slug}`, 0.7)),
    ...pubs.map((p) => entry(`/pubs/${p.slug}`, 0.6, new Date(p.detailsCheckedAt))),
  ];
}
