import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import MainnetLayout from '../../../components/MainnetLayout';
import TestnetLayout from '../../../components/TestnetLayout';
import NotFoundPage from '../../../pages/NotFoundPage';
import { applySeo } from '../../../seo/usePageSeo';
import { findPage } from '../../../seo/pages';
import { createWebSocketMock } from '../../utils/testUtils';

const head = {
  title: () => document.title,
  meta: (name) => document.head.querySelector(`meta[name="${name}"]`)?.getAttribute('content'),
  prop: (name) => document.head.querySelector(`meta[property="${name}"]`)?.getAttribute('content'),
  canonical: () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href'),
  jsonLd: () => {
    const el = document.head.querySelector('script[type="application/ld+json"]');
    return el ? JSON.parse(el.textContent) : null;
  },
};

function renderApp(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Link to="/blocks">go-blocks</Link>
      <Link to="/activation">go-activation</Link>
      <Link to="/testnet/supply">go-testnet-supply</Link>
      <Link to="/no-such-page">go-missing</Link>
      <Routes>
        <Route element={<MainnetLayout />}>
          <Route path="/" element={<div>home page</div>} />
          <Route path="/blocks" element={<div>blocks page</div>} />
          <Route path="/activation" element={<div>activation page</div>} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="/testnet" element={<TestnetLayout />}>
          <Route index element={<div>testnet home</div>} />
          <Route path="supply" element={<div>testnet supply</div>} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('usePageSeo (runtime head tags)', () => {
  let wsSetup;

  beforeEach(() => {
    // Remove only SEO tags: MUI/emotion own the <style> tags in <head>.
    document.head
      .querySelectorAll('meta, link[rel="canonical"], script[type="application/ld+json"]')
      .forEach((el) => el.remove());
    document.title = '';
    wsSetup = createWebSocketMock();
    global.WebSocket = wsSetup.MockWebSocket;
  });

  afterEach(() => {
    wsSetup.instances.forEach((ws) => ws.close && ws.close());
  });

  it('sets title, description, canonical, og and twitter tags for the first route', async () => {
    renderApp('/blocks');
    const page = findPage('/blocks');
    await waitFor(() => expect(head.title()).toBe(page.title));
    expect(head.meta('description')).toBe(page.description);
    expect(head.canonical()).toBe('https://digibyte.io/blocks');
    expect(head.prop('og:url')).toBe('https://digibyte.io/blocks');
    expect(head.prop('og:title')).toBe(page.title);
    expect(head.prop('og:description')).toBe(page.description);
    expect(head.meta('twitter:title')).toBe(page.title);
    expect(head.meta('twitter:description')).toBe(page.description);
    expect(head.meta('robots')).toBe('index, follow');
    const ld = head.jsonLd();
    expect(ld['@context']).toBe('https://schema.org');
    expect(JSON.stringify(ld)).toContain('BreadcrumbList');
  });

  it('updates every tag on client-side navigation, across networks', async () => {
    renderApp('/');
    await waitFor(() => expect(head.title()).toBe(findPage('/').title));
    expect(head.canonical()).toBe('https://digibyte.io/');
    expect(JSON.stringify(head.jsonLd())).toContain('"WebSite"');

    fireEvent.click(screen.getByText('go-blocks'));
    await waitFor(() => expect(head.title()).toBe(findPage('/blocks').title));
    expect(head.canonical()).toBe('https://digibyte.io/blocks');

    fireEvent.click(screen.getByText('go-testnet-supply'));
    await waitFor(() => expect(head.title()).toBe(findPage('/testnet/supply').title));
    expect(head.canonical()).toBe('https://digibyte.io/testnet/supply');
    expect(head.prop('og:url')).toBe('https://digibyte.io/testnet/supply');
    expect(head.meta('description')).toBe(findPage('/testnet/supply').description);
    expect(head.meta('robots')).toBe('index, follow');
  });

  it('sets noindex on /activation and clears it on the next page', async () => {
    renderApp('/activation');
    await waitFor(() => expect(head.meta('robots')).toBe('noindex, follow'));
    expect(head.title()).toBe(findPage('/activation').title);

    fireEvent.click(screen.getByText('go-blocks'));
    await waitFor(() => expect(head.meta('robots')).toBe('index, follow'));
  });

  it('shows "Page not found" with links home and sets noindex for unknown routes', async () => {
    renderApp('/no-such-page');
    expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to digibyte stats/i })).toHaveAttribute('href', '/');
    await waitFor(() => expect(head.meta('robots')).toBe('noindex, follow'));
    expect(head.title()).toMatch(/Page Not Found/);
    expect(head.canonical()).toBeUndefined();
    expect(head.jsonLd()).toBe(null);
  });

  it('handles unknown testnet routes with the testnet layout', async () => {
    renderApp('/testnet/pools');
    expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /testnet home/i })).toHaveAttribute('href', '/testnet');
    await waitFor(() => expect(head.meta('robots')).toBe('noindex, follow'));
  });

  it('applySeo creates missing tags and reuses existing ones', () => {
    applySeo('/supply');
    applySeo('/supply/');
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
    expect(head.canonical()).toBe('https://digibyte.io/supply');
  });
});
