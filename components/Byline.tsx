import Link from 'next/link';
import { CalendarCheck } from 'lucide-react';
import { EDITOR } from '@/lib/author';
import { monthYear } from '@/lib/data';

// Byline shown on content pages. Wording is deliberately accurate: Dean compiles and maintains the
// guide; facility details come from each pub's own website and are dated, not "reviewed in person".
export function Byline({ checked }: { checked: string }) {
  return (
    <div className="mb-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-line py-4 text-sm">
      <div className="flex items-center gap-3">
        <img src={EDITOR.imageSmall} srcSet={`${EDITOR.imageSmall} 1x, ${EDITOR.image} 2x`} width={40} height={40} alt="" loading="lazy" className="h-10 w-10 rounded-full object-cover ring-2 ring-white" />
        <p className="leading-tight">
          <span className="text-muted">Compiled by </span>
          <Link href="/about#dean-james" rel="author" className="font-semibold text-navy hover:text-blue">
            {EDITOR.name}
          </Link>
          <span className="block text-muted">{EDITOR.role}, Brighton Beer Guide</span>
        </p>
      </div>
      <p className="flex items-center gap-1.5 text-muted">
        <CalendarCheck aria-hidden="true" className="h-4 w-4 text-blue" />
        Details checked {monthYear(checked)}
      </p>
      <Link href="/about#how-we-check" className="font-medium text-blue hover:underline">
        How we check pubs
      </Link>
    </div>
  );
}

/** Short "meet the editor" card for the home page. */
export function EditorCard() {
  return (
    <section aria-labelledby="meet-editor" className="card mt-24 grid items-center gap-6 rounded-3xl p-6 sm:grid-cols-[auto_1fr] sm:p-8">
      <img
        src={EDITOR.image}
        width={112}
        height={112}
        alt={`${EDITOR.name}, ${EDITOR.role.toLowerCase()} of Brighton Beer Guide`}
        loading="lazy"
        className="h-24 w-24 rounded-full object-cover ring-4 ring-white sm:h-28 sm:w-28"
      />
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue">Meet the editor</p>
        <h2 id="meet-editor" className="text-2xl font-bold">
          {EDITOR.name}
        </h2>
        <p className="mt-2 max-w-2xl text-muted">{EDITOR.shortBio}</p>
        <Link href="/about" className="mt-3 inline-block font-semibold text-blue hover:underline">
          Read Dean&apos;s story
        </Link>
      </div>
    </section>
  );
}
