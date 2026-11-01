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
  icons: { icon: '/icon.svg', apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = { themeColor: '#d0106a', width: 'device-width', initialScale: 1 };

function Logo() {
  // Decorative here: the link text next to it carries the name.
  return (
    <img
      src="/logo-80.webp"
      srcSet="/logo-80.webp 1x, /logo-160.webp 2x, /logo-240.webp 3x"
      width={80}
      height={80}
      alt=""
      fetchPriority="high"
      className="h-16 w-16 shrink-0 sm:h-20 sm:w-20"
    />
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={fraunces.variable}>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-paper focus:px-3 focus:py-2">
          Skip to content
        </a>
        <header className="border-b-4 border-brand bg-night text-light">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2">
            <Link href="/" className="flex items-center gap-3 font-serif text-lg font-extrabold tracking-tight sm:text-xl">
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
