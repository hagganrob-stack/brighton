import Link from 'next/link';
import { pubs, areas, monthYear, lastChecked, FEATURE_LABELS, FEATURE_ORDER } from '@/lib/data';
import { meta } from '@/lib/seo';
import { EDITOR, entityGraph, webPageSchema } from '@/lib/author';
import { Breadcrumbs, Eyebrow, Hero, JsonLd } from '@/components/ui';

export const metadata = meta(
  '/about',
  'Meet Dean James: The Man Behind Brighton Beer Guide',
  'Meet Dean James, the beer, food and football lover behind Brighton Beer Guide, and see how the guide checks every pub it lists.',
);

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-14">
      <h2 id={id} className="mb-4 text-3xl font-bold leading-[1.1]">
        {title}
      </h2>
      <div className="prose-pub space-y-4 text-lg leading-relaxed text-ink [&_a]:font-medium [&_a]:text-blue [&_a:hover]:underline">{children}</div>
    </section>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return <p className="card rounded-2xl p-6 font-display text-xl font-bold leading-snug text-navy sm:text-2xl">{children}</p>;
}

export default function About() {
  const websites = pubs.filter((p) => /own website/.test(p.featuresSource)).length;
  return (
    <>
      <JsonLd data={[entityGraph(), webPageSchema({ path: '/about', name: 'Meet Dean James: The Man Behind Brighton Beer Guide', dateModified: lastChecked, type: 'AboutPage' })]} />
      <Breadcrumbs crumbs={[{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }]} />

      <div id="dean-james" className="scroll-mt-28" />
      <Hero image="dean" kicker={`${EDITOR.role} · Brighton Beer Guide`} title="Meet Dean James: The Man Behind Brighton Beer Guide">
        <p>Some people collect stamps. Others collect trainers. Dean James collects good pubs.</p>
      </Hero>

      <article className="max-w-3xl">
        <div className="prose-pub space-y-4 text-lg leading-relaxed text-ink">
          <p>
            A lifelong lover of proper beer, good food and the beautiful game, Dean is the sort of bloke who believes that most of life&apos;s
            best moments happen down the pub. Preferably with a decent pint in hand.
          </p>
          <p>
            His perfect weekend? Friday night starts with a few beers and some live music in a lively Brighton boozer. Saturday is all about the
            football, cheering on the Seagulls with a pint (or two) before dissecting the result with anyone willing to listen. Sunday is
            reserved for one of Britain&apos;s greatest traditions: a proper roast dinner, complete with crispy potatoes, a giant Yorkshire
            pudding and enough gravy to sink a battleship.
          </p>
          <p>
            And if you think he takes Monday to Thursday off, think again. There&apos;s usually a midweek pub quiz to be won. Or, more
            realistically, enthusiastically lost.
          </p>
        </div>

        <Section id="passion" title="A passion for proper pubs">
          <p>For Dean, a pub has never just been somewhere to buy a drink.</p>
          <p>
            It&apos;s where friendships are made, football matches are debated, questionable quiz answers are confidently shouted and Sunday
            afternoons disappear over another round.
          </p>
          <p>
            Brighton has some of the best pubs in the country. From traditional backstreet boozers serving beautifully kept ales to buzzing
            music venues, cosy neighbourhood locals and brilliant little craft beer spots, there&apos;s something for everyone.
          </p>
          <p>But with so many to choose from, finding the right pub isn&apos;t always easy.</p>
          <p>
            Which ones serve a genuinely great pint? Where can you find the best <Link href="/best/sunday-roasts">Sunday roast</Link>? Who&apos;s{' '}
            <Link href="/best/live-sport">showing the football</Link>? Which pubs have <Link href="/best/live-music">live music</Link> on a
            Friday, or a <Link href="/best/pub-quizzes">quiz</Link> worth getting the team together for?
          </p>
          <p>Dean found himself answering these questions for friends, family and anyone else looking for a recommendation.</p>
          <p>Eventually, he had a thought.</p>
          <Callout>Why not put everything in one place?</Callout>
        </Section>

        <Section id="born" title="And so Brighton Beer Guide was born">
          <p>
            Brighton Beer Guide started with a simple idea: make it easier for people to discover the brilliant pubs that make Brighton such a
            fantastic place to live, work and visit.
          </p>
          <p>
            Not just the famous ones. Not just the trendy ones. The proper hidden gems, the much-loved locals and the places that deserve a bit
            more recognition.
          </p>
          <p>
            Whether you&apos;re hunting for a cracking Sunday roast, planning a Saturday afternoon watching Brighton, looking for somewhere with
            great live music or simply fancy a really good beer, Brighton Beer Guide is here to point you in the right direction.
          </p>
          <p>
            It&apos;s a celebration of Brighton&apos;s pub culture, the landlords and bar staff who keep it alive and the people who make every
            pub worth visiting.
          </p>
        </Section>

        <Section id="good-beer" title="Good beer. Good food. Great pubs.">
          <p>
            Dean isn&apos;t a beer snob. He just knows what he likes, and that&apos;s a proper pint served in a proper pub with good people
            around him.
          </p>
          <p>He&apos;s equally happy discovering a new craft beer as he is settling into a familiar local with a well-kept traditional ale.</p>
          <p>
            And while Brighton Beer Guide might give him a perfectly respectable excuse to spend even more time in the pub, there&apos;s a
            genuine mission behind it.
          </p>
          <Callout>To help people find their next favourite pub and support the fantastic independent venues that make Brighton special.</Callout>
          <p>
            So have a browse, discover somewhere new and raise a glass to Brighton&apos;s brilliant pubs. Start with{' '}
            <Link href="/pubs">all {pubs.length} pubs</Link> or <Link href="/areas">browse by neighbourhood</Link>.
          </p>
          <p>
            And if you happen to spot a big bearded bloke in a Brighton shirt, tucking into a Sunday roast with a pint on the go, there&apos;s a
            fair chance you&apos;ve found Dean.
          </p>
          <p className="font-display text-2xl font-bold text-navy">Mine&apos;s a pint. Cheers!</p>
        </Section>
      </article>

      {/* Methodology: the transparency half of E-E-A-T, linked from every byline. */}
      <section id="how-we-check" aria-labelledby="how-heading" className="mt-24 scroll-mt-28">
        <Eyebrow>How the guide works</Eyebrow>
        <h2 id="how-heading" className="mb-3 text-3xl font-bold sm:text-4xl">
          How we check pubs
        </h2>
        <p className="mb-8 max-w-2xl text-lg text-muted">
          An independent, non-commercial guide to {pubs.length} pubs and bars. No pub has paid to be included, and there are no ads or
          affiliate links.
        </p>
        <div className="prose-pub grid gap-5 text-[1.05rem] md:grid-cols-2 [&_a]:font-semibold [&_a]:text-blue">
          <section className="card rounded-3xl p-6 sm:p-8" aria-labelledby="sources">
            <h3 id="sources" className="mb-3 text-2xl font-bold">Where the information comes from</h3>
            <p>
              Names, addresses, phone numbers, opening hours and ratings come from each venue&apos;s public Google Maps listing, across{' '}
              {areas.length} areas: {areas.map((a) => a.name).join(', ')}. Each pub is assigned to the area it&apos;s closest to.
            </p>
            <p>
              Facilities come only from the pub&apos;s own website ({websites} websites checked). A facility is marked &ldquo;yes&rdquo; or
              &ldquo;no&rdquo; only when the site clearly says so; otherwise it shows as &ldquo;not stated&rdquo;. Each confirmed facility
              links to the page it came from.
            </p>
            <p>We track: {FEATURE_ORDER.map((k) => FEATURE_LABELS[k].toLowerCase()).join(', ')}.</p>
          </section>
          <section className="card rounded-3xl p-6 sm:p-8" aria-labelledby="descriptions">
            <h3 id="descriptions" className="mb-3 text-2xl font-bold">How descriptions are written</h3>
            <p>
              Each pub description is built only from the facts above: location, rating, opening hours, confirmed facilities and the nearest
              pubs in the guide. We don&apos;t copy text from pub websites or reviews, and we don&apos;t add details we haven&apos;t checked.
            </p>
          </section>
          <section className="card rounded-3xl p-6 sm:p-8" aria-labelledby="ranking">
            <h3 id="ranking" className="mb-3 text-2xl font-bold">How pubs are ranked</h3>
            <p>
              Lists are ordered by Google rating, weighted by number of reviews. That stops a 5.0 from a handful of reviews outranking a 4.6
              from hundreds. Area and feature pages only exist where at least three pubs qualify.
            </p>
          </section>
          <section className="card rounded-3xl p-6 sm:p-8" aria-labelledby="freshness">
            <h3 id="freshness" className="mb-3 text-2xl font-bold">Keeping it up to date</h3>
            <p>
              Details were last checked in {monthYear(lastChecked)}, and every pub page shows when its own details were checked. Pubs change
              their hours and events often, so please check with the pub before you travel.
            </p>
            <p>
              Maps are from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>. No photos are taken from Google.
            </p>
          </section>
        </div>
      </section>
    </>
  );
}
