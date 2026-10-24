/**
 * JSON-LD (schema.org) for each page. Shared by the runtime hook and the
 * build-time prerender so both write the same data.
 */
import { SITE_URL, SITE_NAME, OG_IMAGE, canonicalUrl, breadcrumbTrail } from './pages.js';

const WEBSITE_ID = `${SITE_URL}/#website`;
const CREATOR = { '@type': 'Person', name: 'Jared Tate' };

function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    description:
      'Free, open-source live statistics for the DigiByte (DGB) blockchain: blocks, transactions, supply, nodes, mining and DigiDollar.',
    inLanguage: 'en',
    creator: CREATOR,
    publisher: CREATOR,
  };
}

/** The JSON-LD object for a PAGES entry, or null (e.g. for 404). */
export function buildJsonLd(page) {
  if (!page || !page.path) return null;
  const url = canonicalUrl(page.path);

  if (page.path === '/') {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        websiteNode(),
        {
          '@type': 'WebApplication',
          name: 'DigiByte Blockchain Stats',
          description: 'Real-time DigiByte blockchain statistics and network analytics',
          url,
          applicationCategory: 'Cryptocurrency Analytics',
          operatingSystem: 'Web Browser',
          isAccessibleForFree: true,
          author: CREATOR,
          isPartOf: { '@id': WEBSITE_ID },
        },
      ],
    };
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: page.title,
        description: page.description,
        inLanguage: 'en',
        primaryImageOfPage: OG_IMAGE,
        isPartOf: { '@type': 'WebSite', '@id': WEBSITE_ID, name: SITE_NAME, url: `${SITE_URL}/` },
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: breadcrumbTrail(page).map((crumb, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: crumb.name,
          item: canonicalUrl(crumb.path),
        })),
      },
    ],
  };
}

/** JSON for a <script> body: `<` escaped so the text can never close the tag. */
export function jsonLdText(page) {
  const data = buildJsonLd(page);
  return data ? JSON.stringify(data).replace(/</g, '\\u003c') : '';
}
