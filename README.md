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

## Colours

The palette lives in `app/globals.css` (`@theme`): `brand` (hot pink), `brand-dark`, `night` (navy), `light`, `paper`,
`accent` (teal), `ink`, `negative`. Change those values to re-skin the site. A few hard-coded copies: the header logo in
`app/layout.tsx`, `themeColor` in the same file, and `app/icon.svg` / `public/favicon.svg`. Keep text at 4.5:1 contrast.
