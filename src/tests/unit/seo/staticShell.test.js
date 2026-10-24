import React from 'react';
import ReactDOM from 'react-dom';
import fs from 'fs';
import path from 'path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderPage } from '../../../../scripts/prerender.mjs';
import { findPage } from '../../../seo/pages';

// The prerendered #root markup must vanish when the app mounts: src/index.js
// uses ReactDOM.render (React 17), which empties the container first. No
// hydration, so no hydration warnings and no duplicate content.
describe('prerendered static HTML in #root', () => {
  let container;

  afterEach(() => {
    if (container) {
      ReactDOM.unmountComponentAtNode(container);
      container.remove();
    }
  });

  it('is replaced by the app on mount, with no React warnings', () => {
    const template = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
    const html = renderPage(template, findPage('/blocks'));
    const rootHtml = html.match(/<div id="root">([\s\S]*?)<\/div>\s*<script/)[1];

    container = document.createElement('div');
    container.id = 'root';
    container.innerHTML = rootHtml;
    document.body.appendChild(container);
    expect(container.querySelector('h1').textContent).toBe('Latest DigiByte Blocks');

    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    ReactDOM.render(<p>live app</p>, container);
    expect(container.innerHTML).toBe('<p>live app</p>');
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('starts with a comment, so React never takes the legacy hydrate path', () => {
    const template = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
    const html = renderPage(template, findPage('/'));
    expect(html).toMatch(/<div id="root"><!--seo-shell-->/);
    expect(html).not.toContain('data-reactroot');
  });

  it('relies on src/index.js mounting with ReactDOM.render, not hydrate', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/index.js'), 'utf8');
    expect(src).toMatch(/ReactDOM\.render\(/);
    expect(src).not.toMatch(/hydrate/);
  });
});
