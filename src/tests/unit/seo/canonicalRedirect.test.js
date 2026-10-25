import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { knownPathFor } from '../../../seo/pages';
import CanonicalRedirect from '../../../components/CanonicalRedirect';

// WEIRD-INPUT-9: /BLOCKS returned 404 but showed the page; /blocks.html returned
// 200 but showed "Page not found". The browser now moves to the real path.
describe('knownPathFor', () => {
  it.each([
    ['/BLOCKS', '/blocks'],
    ['/Nodes', '/nodes'],
    ['/blocks.html', '/blocks'],
    ['/txs.html', '/txs'],
    ['/BLOCKS.HTML', '/blocks'],
    ['//blocks', '/blocks'],
    ['/index.html', '/'],
    ['/testnet/index.html', '/testnet'],
    ['/testnet/Blocks.html', '/testnet/blocks'],
    ['/TESTNET', '/testnet'],
  ])('maps %s to %s', (input, expected) => {
    expect(knownPathFor(input)).toBe(expected);
  });

  it.each(['/', '/blocks', '/testnet', '/testnet/blocks', '/nope', '/nope.html', '/blocks/extra', '', null, 42, '/.html'])(
    'leaves %s alone (already right, or unknown)', (input) => {
      expect(knownPathFor(input)).toBeNull();
    });
});

const Where = () => {
  const loc = useLocation();
  return <p data-testid="where">{loc.pathname + loc.search + loc.hash}</p>;
};

const renderAt = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <CanonicalRedirect />
    <Routes><Route path="*" element={<Where />} /></Routes>
  </MemoryRouter>
);

describe('CanonicalRedirect', () => {
  it.each([['/BLOCKS', '/blocks'], ['/blocks.html?x=1#top', '/blocks?x=1#top'], ['/index.html', '/'], ['//blocks', '/blocks']])(
    'moves %s to %s', async (from, to) => {
      renderAt(from);
      expect((await screen.findByTestId('where')).textContent).toBe(to);
    });

  it.each(['/blocks', '/does-not-exist'])('does nothing on %s', (path) => {
    renderAt(path);
    expect(screen.getByTestId('where').textContent).toBe(path);
  });
});
