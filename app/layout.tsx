import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import Link from 'next/link';
import { areas, ROUNDUPS, pubs, roundupPath, areaPath } from '@/lib/data';
import { SITE_NAME, SITE_URL } from '@/lib/seo';
import { GUIDES, guidePath, guideMenu } from '@/lib/guides';
import './globals.css';

const bricolage = localFont({
  src: './fonts/bricolage.woff2',
  variable: '--font-bricolage',
  weight: '200 800',
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}: Pubs in Brighton & Hove`, template: `%s | ${SITE_NAME}` },
  applicationName: SITE_NAME,
  formatDetection: { telephone: false },
  icons: { icon: '/icon.svg', apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = { themeColor: '#0057b8', width: 'device-width', initialScale: 1 };

function Logo({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  // Decorative: the link text next to it carries the name.
  return (
    <img
      src="/logo-80.webp"
      srcSet="/logo-80.webp 1x, /logo-160.webp 2x, /logo-240.webp 3x"
      width={80}
      height={80}
      alt=""
      fetchPriority={size === 'sm' ? 'high' : 'low'}
      loading={size === 'sm' ? 'eager' : 'lazy'}
      className={size === 'sm' ? 'h-14 w-14 shrink-0 sm:h-16 sm:w-16' : 'h-16 w-16 shrink-0'}
    />
  );
}

const NAV = [
  { href: '/pubs-in-brighton', label: 'All pubs' },
  { href: '/guides', label: 'Guides' },
  { href: '/areas', label: 'Areas' },
  { href: '/about', label: 'About' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={bricolage.variable}>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-paper focus:px-3 focus:py-2">
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b border-line bg-white/95">
          <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
            <Link href="/" className="flex items-center gap-3 font-display text-lg font-extrabold tracking-tight text-navy sm:text-xl">
              <Logo />
              <span>
                {SITE_NAME}
                <span className="block text-xs font-medium tracking-normal text-muted">Independent pub guide</span>
              </span>
            </Link>
            <nav aria-label="Main" className="w-full sm:w-auto">
              <ul className="flex gap-1 text-sm font-semibold">
                {NAV.map((n) =>
                  n.href === '/guides' ? (
                    <li key={n.href} className="group">
                      <Link href={n.href} aria-haspopup="true" className="relative flex items-center gap-1 rounded-full after:absolute after:inset-x-0 after:top-full after:h-6 px-3 py-1.5 text-navy transition hover:bg-canvas hover:text-blue">
                        {n.label}
                        <svg aria-hidden="true" viewBox="0 0 12 12" className="hidden h-3 w-3 sm:block"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </Link>
                      {/* Desktop dropdown: opens on hover or keyboard focus. Mobile goes straight to /guides. */}
                      <div className="invisible absolute right-4 top-full z-50 hidden opacity-0 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 sm:block">
                        <div className="grid w-[min(52rem,calc(100vw-2rem))] gap-6 rounded-b-2xl rounded-t-none border border-line bg-white p-6 shadow-xl sm:grid-cols-3">
                          {guideMenu().map((g) => (
                            <div key={g.heading}>
                              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue">{g.heading}</p>
                              <ul className="space-y-0.5">
                                {g.items.map((i) => (
                                  <li key={i.href}>
                                    <Link href={i.href} prefetch={false} className="block rounded-lg px-2 py-1.5 font-medium text-navy hover:bg-canvas hover:text-blue">
                                      {i.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                          <p className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 sm:col-span-3">
                            <Link href="/guides" className="font-semibold text-blue hover:underline">
                              See all guides →
                            </Link>
                            <Link href="/christmas" className="font-semibold text-blue hover:underline">
                              Christmas in Brighton →
                            </Link>
                          </p>
                        </div>
                      </div>
                    </li>
                  ) : (
                    <li key={n.href}>
                      <Link href={n.href} className="block rounded-full px-3 py-1.5 text-navy transition hover:bg-canvas hover:text-blue">
                        {n.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </nav>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>

        <footer className="mt-24 border-t border-line bg-canvas text-ink">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 text-sm sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <Logo size="lg" />
                <p className="font-display text-xl font-extrabold text-navy">{SITE_NAME}</p>
              </div>
              <p className="mt-4 max-w-sm text-muted">
                An independent, non-commercial guide to {pubs.length} pubs in Brighton & Hove. Facilities are only listed when a pub&apos;s
                own website states them.
              </p>
            </div>
            <div>
              <p className="font-display text-base font-bold text-navy">Areas</p>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {areas.map((a) => (
                  <li key={a.slug}>
                    <Link href={areaPath(a.slug)} className="text-muted hover:text-blue">{a.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-display text-base font-bold text-navy">Guides</p>
              <ul className="mt-3 space-y-1.5">
                <li>
                  <Link href="/christmas" className="text-muted hover:text-blue">
                    Christmas in Brighton
                  </Link>
                </li>
                {GUIDES.map((g) => (
                  <li key={g.slug}>
                    <Link href={guidePath(g.slug)} className="text-muted hover:text-blue">{g.h1.replace(/:.*/, '')}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-display text-base font-bold text-navy">Best of</p>
              <ul className="mt-3 space-y-1.5">
                {ROUNDUPS.map((r) => (
                  <li key={r.slug}>
                    <Link href={roundupPath(r.slug)} className="text-muted hover:text-blue">{r.label}</Link>
                  </li>
                ))}
                <li>
                  <Link href="/about" className="text-muted hover:text-blue">About this guide</Link>
                </li>
              </ul>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
