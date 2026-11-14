import Link from 'next/link';

export const metadata = { title: 'Page not found', robots: { index: false } };

export default function NotFound() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-20 text-center text-white">
      <div className="stripes-faint pointer-events-none absolute inset-0" aria-hidden="true" />
      <p className="relative font-display text-7xl font-extrabold text-white/90">404</p>
      <h1 className="relative mt-2 text-4xl font-extrabold">Last orders: page not found</h1>
      <p className="relative mt-4 text-white/90">That page doesn&apos;t exist, or the pub may have left the guide.</p>
      <p className="relative mt-8">
        <Link href="/" className="rounded-full bg-white px-6 py-3 font-semibold text-blue shadow-lg">Back to the guide</Link>
      </p>
    </div>
  );
}
