import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// SLOW-9: /logo.png is shown at 30-40 px but was a 109 KB 512x512 image,
// fetched (or revalidated) on every page load.
const PUBLIC = path.join(process.cwd(), 'public');

const pngSize = (file) => {
  const buf = fs.readFileSync(file);
  expect(buf.subarray(1, 4).toString()).toBe('PNG');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), bytes: buf.length };
};

describe('public assets', () => {
  it('keeps logo.png small: at most 128 px and 20 KB', () => {
    const { width, height, bytes } = pngSize(path.join(PUBLIC, 'logo.png'));
    expect(width).toBeLessThanOrEqual(128);
    expect(height).toBeLessThanOrEqual(128);
    expect(bytes).toBeLessThanOrEqual(20 * 1024);
  });

  it('lists logo.png in manifest.json with its real size', () => {
    const { width, height } = pngSize(path.join(PUBLIC, 'logo.png'));
    const manifest = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'manifest.json'), 'utf8'));
    const icon = manifest.icons.find((i) => i.src === 'logo.png');
    expect(icon.sizes).toBe(`${width}x${height}`);
  });
});
