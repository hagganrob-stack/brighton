import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import Link from 'next/link';
import { areas, ROUNDUPS } from '@/lib/data';
import { SITE_NAME, SITE_URL } from '@/lib/seo';
import './globals.css';

const fraunces = localFont({
  src: './fonts/fraunces.woff2',
  variable: '--font-fraunces',
  weight: '100 900',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}: Independent Guide to Local Pubs`, template: `%s | ${SITE_NAME}` },
  applicationName: SITE_NAME,
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: '#d0106a', width: 'device-width', initialScale: 1 };

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
      <rect x="2" y="2" width="28" height="28" rx="6" fill="#1c1b33" />
      <path d="M10 9h10v3h2a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-2v2a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1z" fill="#fff6f0" />
      <path d="M20 14h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2z" fill="#1c1b33" />
      <rect x="10" y="9" width="10" height="3" rx="1" fill="#ffd23f" />
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={fraunces.variable}>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-paper focus:px-3 focus:py-2">
          Skip to content
        </a>
        <header className="bg-brand text-light">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-serif text-lg font-extrabold tracking-tight sm:text-xl">
              <Logo />
              {SITE_NAME}
            </Link>
            <nav aria-label="Main">
              <ul className="flex gap-4 text-sm font-semibold">
                <li><Link href="/pubs" className="hover:underline">All pubs</Link></li>
                <li><Link href="/areas" className="hover:underline">Areas</Link></li>
                <li><Link href="/best/sunday-roasts" className="hover:underline">Best of</Link></li>
                <li><Link href="/about" className="hover:underline">About</Link></li>
              </ul>
            </nav>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="mt-12 bg-night text-light/90">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-3">
            <div>
              <p className="font-serif text-lg font-bold text-light">{SITE_NAME}</p>
              <p className="mt-2">An independent, non-commercial guide. Facilities are only listed when a pub's own website states them.</p>
            </div>
            <div>
              <p className="font-semibold text-light">Areas</p>
              <ul className="mt-2 grid grid-cols-2 gap-1">
                {areas.map((a) => (
                  <li key={a.slug}><Link href={`/areas/${a.slug}`} className="hover:underline">{a.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-light">Best of</p>
              <ul className="mt-2 space-y-1">
                {ROUNDUPS.map((r) => (
                  <li key={r.slug}><Link href={`/best/${r.slug}`} className="hover:underline">{r.label}</Link></li>
                ))}
                <li><Link href="/about" className="hover:underline">About this guide</Link></li>
              </ul>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
