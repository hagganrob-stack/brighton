import Link from 'next/link';

export const metadata = { title: 'Page not found', robots: { index: false } };

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="font-serif text-4xl font-black text-night">Last orders: page not found</h1>
      <p className="mt-4">That page doesn&apos;t exist, or the pub may have left the guide.</p>
      <p className="mt-6">
        <Link href="/" className="rounded-full bg-brand px-5 py-2 font-semibold text-light">Back to the guide</Link>
      </p>
    </div>
  );
}
