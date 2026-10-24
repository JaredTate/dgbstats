/**
 * Keeps the <head> SEO tags in step with the current route.
 *
 * Both layouts call usePageSeo(). On every route change it sets the title,
 * meta description, canonical, og/twitter tags, robots and JSON-LD from
 * src/seo/pages.js. Unknown routes get the "Page not found" text and noindex.
 * The prerendered HTML (scripts/prerender.mjs) starts with the same values.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { findPage, canonicalUrl, NOT_FOUND_PAGE } from './pages.js';
import { jsonLdText } from './schema.js';

function upsert(doc, selector, create) {
  let el = doc.head.querySelector(selector);
  if (!el) {
    el = create();
    doc.head.appendChild(el);
  }
  return el;
}

function setMeta(doc, attr, key, content) {
  const el = upsert(doc, `meta[${attr}="${key}"]`, () => {
    const m = doc.createElement('meta');
    m.setAttribute(attr, key);
    return m;
  });
  el.setAttribute('content', content);
}

function removeAll(doc, selector) {
  doc.head.querySelectorAll(selector).forEach((el) => el.remove());
}

/** Write the head tags for a URL path. Exported for tests. */
export function applySeo(pathname, doc = document) {
  const page = findPage(pathname);
  const meta = page || NOT_FOUND_PAGE;

  doc.title = meta.title;
  setMeta(doc, 'name', 'description', meta.description);
  setMeta(doc, 'name', 'robots', meta.noindex ? 'noindex, follow' : 'index, follow');
  setMeta(doc, 'property', 'og:title', meta.title);
  setMeta(doc, 'property', 'og:description', meta.description);
  setMeta(doc, 'name', 'twitter:title', meta.title);
  setMeta(doc, 'name', 'twitter:description', meta.description);

  if (page) {
    const url = canonicalUrl(page.path);
    upsert(doc, 'link[rel="canonical"]', () => {
      const l = doc.createElement('link');
      l.setAttribute('rel', 'canonical');
      return l;
    }).setAttribute('href', url);
    setMeta(doc, 'property', 'og:url', url);
    const ld = upsert(doc, 'script[type="application/ld+json"]', () => {
      const s = doc.createElement('script');
      s.setAttribute('type', 'application/ld+json');
      return s;
    });
    ld.textContent = jsonLdText(page);
  } else {
    // A page that does not exist has no canonical URL and no structured data.
    removeAll(doc, 'link[rel="canonical"]');
    removeAll(doc, 'meta[property="og:url"]');
    removeAll(doc, 'script[type="application/ld+json"]');
  }
}

export default function usePageSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    applySeo(pathname);
  }, [pathname]);
}
