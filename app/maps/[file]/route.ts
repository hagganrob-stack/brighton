import { citySvg, MAP_VARIANTS, type MapVariant } from '@/lib/citymap';

// Static SVG files: /maps/central.svg, /maps/full.svg, /maps/home.svg (built once, cached like any image).
export const dynamic = 'force-static';
export const dynamicParams = false;
export function generateStaticParams() {
  return MAP_VARIANTS.map((v) => ({ file: `${v}.svg` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const variant = (await params).file.replace(/\.svg$/, '') as MapVariant;
  return new Response(citySvg(variant), { headers: { 'Content-Type': 'image/svg+xml' } });
}
