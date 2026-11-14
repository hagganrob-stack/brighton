# The Brighton Beer Guide

https://brightonbeerguide.co.uk


An independent, non-commercial, fully static guide to pubs in Brighton & Hove.
Next.js (App Router, `output: 'export'`) + Tailwind CSS, deployed on Vercel.

## Data pipeline

```bash
SERPAPI_KEY=... npm run data:collect   # SerpApi Google Maps search, area by area -> data/pubs.json
npm run data:enrich                    # facilities from each pub's own website (with evidence + source URL)
npm run data:describe                  # nearby pubs + 150–250 word fact-only descriptions
```

- Raw SerpApi responses and fetched website text are cached in `data/raw/` (git-ignored), so re-runs cost no searches.
- Run `node scripts/enrich.mjs --refetch` to re-crawl websites; `--only=<slug>` for a single pub.
- Areas live in `data/areas.json` (shared by the scripts and the site).
- Facilities are `yes` / `no` / `unknown`; only explicit statements on the pub's own site count.

## SEO overrides

- Pubs: add `customTitle` and/or `customDescription` to a pub in `data/pubs.json` (kept across re-runs).
- Other pages: add `"/areas/hove": { "title": "...", "description": "..." }` to `data/overrides.json`.
- Canonical URLs are `https://brightonbeerguide.co.uk` on Vercel builds (set `NEXT_PUBLIC_SITE_URL` to override).

## Site

`npm run build` writes static HTML to `out/`. Routes: `/`, `/pubs`, `/pubs/[slug]`, `/areas`, `/areas/[area]`,
`/best/[feature]`, `/best/[feature]/[area]` (only where 3+ pubs qualify), `/about`, `/sitemap.xml`, `/robots.txt`.

## Design

Blue and white, modern. Tokens live in `app/globals.css` (`@theme`): `blue` (royal blue, primary), `blue-bright`,
`blue-deep`, `navy`, `sky` (decoration only), `sky-ink`, `mist` (page background), `wash` (chips), `paper` (cards),
`ink`, `muted`, `negative`. Utilities: `bg-brand-gradient`, `stripes` (blue/white shirt stripes), `stripes-faint`.
Headings use Bricolage Grotesque (self-hosted, `app/fonts/bricolage.woff2`); icons are `lucide-react` (static SVG).
Keep text at 4.5:1 contrast; never put text on `sky`. The header logo is a blue recolour of
`design/logo-original.webp` (`design/logo-blue.webp`); favicon is `app/icon.svg`.

## Photo headers

Pages can show a photo header (`Hero` component). Add the source photo as `design/heroes/<name>.jpg`, give it crops,
alt text and any required credit in `data/heroes.json`, then run `python3 scripts/hero-images.py <name>`.
The home page uses `seafront`; a `/best/<feature>` page (and its area pages) uses the photo named after the feature
slug automatically, e.g. `sunday-roasts`. Only use photos you own or that are public domain / openly licensed.
