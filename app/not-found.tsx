import Link from 'next/link';

export const metadata = { title: 'Page not found', robots: { index: false } };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-24 text-center">
      <p className="font-display text-7xl font-bold text-slate-200">404</p>
      <h1 className="mt-4 text-4xl font-extrabold leading-[1.05]">Last orders: page not found</h1>
      <p className="mt-4 text-muted">That page doesn&apos;t exist, or the pub may have left the guide.</p>
      <p className="mt-8">
        <Link href="/" className="rounded-full bg-blue px-6 py-3 font-semibold text-white hover:bg-blue-deep">
          Back to the guide
        </Link>
      </p>
    </div>
  );
}
