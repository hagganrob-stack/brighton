import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import Link from 'next/link';
import { areas, ROUNDUPS, pubs } from '@/lib/data';
import { SITE_NAME, SITE_URL } from '@/lib/seo';
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
      className={size === 'sm' ? 'h-14 w-14 shrink-0 sm:h-16 sm:w-16' : 'h-20 w-20 shrink-0'}
    />
  );
}

const NAV = [
  { href: '/pubs', label: 'All pubs' },
  { href: '/areas', label: 'Areas' },
  { href: '/best/sunday-roasts', label: 'Best of' },
  { href: '/about', label: 'About' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={bricolage.variable}>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-paper focus:px-3 focus:py-2">
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b border-navy/10 bg-white/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
            <Link href="/" className="flex items-center gap-3 font-display text-lg font-extrabold tracking-tight text-navy sm:text-xl">
              <Logo />
              <span>
                {SITE_NAME}
                <span className="block text-xs font-medium tracking-normal text-muted">Independent pub guide</span>
              </span>
            </Link>
            <nav aria-label="Main" className="w-full sm:w-auto">
              <ul className="flex gap-1 text-sm font-semibold">
                {NAV.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} className="block rounded-full px-3 py-1.5 text-navy transition hover:bg-wash hover:text-blue">
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="h-1 bg-brand-gradient" aria-hidden="true" />
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>

        <footer className="relative mt-16 overflow-hidden bg-brand-gradient text-white">
          <div className="stripes relative h-2.5" aria-hidden="true" />
          <div className="stripes-faint pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 text-sm sm:grid-cols-[1.3fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <Logo size="lg" />
                <p className="font-display text-xl font-extrabold">{SITE_NAME}</p>
              </div>
              <p className="mt-4 max-w-sm text-white/90">
                An independent, non-commercial guide to {pubs.length} pubs in Brighton & Hove. Facilities are only listed when a pub&apos;s
                own website states them.
              </p>
            </div>
            <div>
              <p className="font-display text-base font-bold">Areas</p>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {areas.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/areas/${a.slug}`} className="text-white/90 hover:text-white hover:underline">{a.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-display text-base font-bold">Best of</p>
              <ul className="mt-3 space-y-1.5">
                {ROUNDUPS.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/best/${r.slug}`} className="text-white/90 hover:text-white hover:underline">{r.label}</Link>
                  </li>
                ))}
                <li>
                  <Link href="/about" className="text-white/90 hover:text-white hover:underline">About this guide</Link>
                </li>
              </ul>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
