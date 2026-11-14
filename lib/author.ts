// Author / publisher entities for E-E-A-T: one place for bylines and structured data.
import authorsJson from '@/data/authors.json';
import { abs, SITE_NAME } from './seo';

export type Author = {
  name: string;
  role: string;
  shortBio: string;
  image: string;
  imageSmall: string;
  url: string;
  sameAs: string[];
  knowsAbout: string[];
};

const AUTHORS = authorsJson as unknown as Record<string, Author>;
export const EDITOR = AUTHORS['dean-james'];
const PERSON_ID = abs('/about#dean-james');
const ORG_ID = abs('/#organization');

export function personSchema() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: EDITOR.name,
    jobTitle: EDITOR.role,
    description: EDITOR.shortBio,
    image: abs(EDITOR.image),
    url: abs(EDITOR.url),
    knowsAbout: EDITOR.knowsAbout,
    worksFor: { '@id': ORG_ID },
    ...(EDITOR.sameAs.length ? { sameAs: EDITOR.sameAs } : {}),
  };
}

export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: abs('/'),
    logo: abs('/logo-240.webp'),
    founder: { '@id': PERSON_ID },
  };
}

/** WebPage wrapper naming the author, publisher and when the page's facts were last checked. */
export function webPageSchema({ path, name, dateModified, about, type = 'WebPage' }: { path: string; name: string; dateModified: string; about?: string; type?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${abs(path)}#webpage`,
    url: abs(path),
    name,
    inLanguage: 'en-GB',
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: abs('/') },
    author: { '@id': PERSON_ID },
    publisher: { '@id': ORG_ID },
    dateModified,
    ...(about ? { about: { '@id': about } } : {}),
  };
}

/** The Person + Organization entities, emitted once on the About page and home page. */
export function entityGraph() {
  return { '@context': 'https://schema.org', '@graph': [personSchema(), organizationSchema()] };
}
