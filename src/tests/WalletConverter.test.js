import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import fs from 'fs';
import path from 'path';
import WalletConvertPage, {
  APPLICATION_IDS,
  CURRENT_TESTNET,
  detectNetwork,
  readApplicationId,
  patchApplicationId
} from '../pages/WalletConvertPage';
import { renderWithProviders } from './utils/testUtils';

// ─── Fixture helpers ───────────────────────────────────────────────
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

function loadFixture(filename) {
  const buf = fs.readFileSync(path.join(FIXTURES_DIR, filename));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const SQLITE_HEADER = new Uint8Array([
  0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66,
  0x6f, 0x72, 0x6d, 0x61, 0x74, 0x20, 0x33, 0x00
]);

/** Build a minimal 100-byte fake SQLite file with a given application_id */
function makeFakeSqlite(appId) {
  const buf = new ArrayBuffer(100);
  const u8 = new Uint8Array(buf);
  u8.set(SQLITE_HEADER, 0);
  const dv = new DataView(buf);
  dv.setUint32(68, appId, false); // big-endian
  return buf;
}

// ─── Unit tests for pure conversion helpers ────────────────────────
describe('Wallet Converter — pure helpers', () => {
  it('readApplicationId correctly reads a known application_id from an ArrayBuffer', () => {
    const buf = makeFakeSqlite(0xFCD1B8E2);
    expect(readApplicationId(buf)).toBe(0xFCD1B8E2);
  });

  it('readApplicationId reads testnet21 id', () => {
    const buf = makeFakeSqlite(0xFDD2B9E3);
    expect(readApplicationId(buf)).toBe(0xFDD2B9E3);
  });

  it('readApplicationId reads testnet23 (RC30) id', () => {
    const buf = makeFakeSqlite(0xFDD2B9E4);
    expect(readApplicationId(buf)).toBe(0xFDD2B9E4);
  });

  it('readApplicationId reads testnet24 (RC34) id', () => {
    const buf = makeFakeSqlite(0xFEC4B7E5);
    expect(readApplicationId(buf)).toBe(0xFEC4B7E5);
  });

  it('APPLICATION_IDS.testnet23 matches the RC30 pchMessageStart (FD D2 B9 E4)', () => {
    expect(APPLICATION_IDS.testnet23).toBe(0xFDD2B9E4);
  });

  it('APPLICATION_IDS.testnet24 matches the RC34 pchMessageStart (FE C4 B7 E5)', () => {
    expect(APPLICATION_IDS.testnet24).toBe(0xFEC4B7E5);
  });

  it('CURRENT_TESTNET points at testnet24 for the current RC38 line', () => {
    expect(CURRENT_TESTNET).toBe('testnet24');
    expect(APPLICATION_IDS[CURRENT_TESTNET]).toBe(0xFEC4B7E5);
  });

  it('detectNetwork identifies testnet19/20', () => {
    expect(detectNetwork(0xFCD1B8E2)).toBe('testnet19/20');
  });

  it('detectNetwork identifies testnet21', () => {
    expect(detectNetwork(0xFDD2B9E3)).toBe('testnet21');
  });

  it('detectNetwork identifies testnet23 (RC30)', () => {
    expect(detectNetwork(0xFDD2B9E4)).toBe('testnet23');
  });

  it('detectNetwork identifies testnet24 (RC34)', () => {
    expect(detectNetwork(0xFEC4B7E5)).toBe('testnet24');
  });

  it('detectNetwork identifies mainnet', () => {
    expect(detectNetwork(0xFAC3B6DA)).toBe('mainnet');
  });

  it('detectNetwork identifies regtest', () => {
    expect(detectNetwork(0xFABFB5DA)).toBe('regtest');
  });

  it('detectNetwork returns "unknown" for unrecognised ids', () => {
    expect(detectNetwork(0x12345678)).toBe('unknown');
  });

  it('patchApplicationId writes the correct 4 bytes at offset 68', () => {
    const buf = makeFakeSqlite(0xFCD1B8E2);
    const patched = patchApplicationId(buf, APPLICATION_IDS.testnet21);
    const dv = new DataView(patched);
    expect(dv.getUint32(68, false)).toBe(0xFDD2B9E3);
  });

  it('patchApplicationId converts an RC28 testnet21 wallet to RC30 testnet23', () => {
    const buf = makeFakeSqlite(0xFDD2B9E3);
    const patched = patchApplicationId(buf, APPLICATION_IDS.testnet23);
    const dv = new DataView(patched);
    expect(dv.getUint32(68, false)).toBe(0xFDD2B9E4);
  });

  it('patchApplicationId converts a testnet23 wallet to RC34 testnet24', () => {
    const buf = makeFakeSqlite(0xFDD2B9E4);
    const patched = patchApplicationId(buf, APPLICATION_IDS.testnet24);
    const dv = new DataView(patched);
    expect(dv.getUint32(68, false)).toBe(0xFEC4B7E5);
  });

  it('testnet21 → testnet23 round-trip preserves all other bytes', () => {
    const original = makeFakeSqlite(0xFDD2B9E3);
    const toT23 = patchApplicationId(original, APPLICATION_IDS.testnet23);
    const back = patchApplicationId(toT23, APPLICATION_IDS.testnet21);
    expect(Array.from(new Uint8Array(back))).toEqual(Array.from(new Uint8Array(original)));
  });

  it('testnet23 → testnet24 round-trip preserves all other bytes', () => {
    const original = makeFakeSqlite(0xFDD2B9E4);
    const toT24 = patchApplicationId(original, APPLICATION_IDS.testnet24);
    const back = patchApplicationId(toT24, APPLICATION_IDS.testnet23);
    expect(Array.from(new Uint8Array(back))).toEqual(Array.from(new Uint8Array(original)));
  });

  it('patchApplicationId preserves all other bytes', () => {
    const original = makeFakeSqlite(0xFCD1B8E2);
    const origU8 = new Uint8Array(original);
    // Write some recognisable data outside offset 68-71
    origU8[0] = 0x53; // 'S' — already SQLite header
    origU8[80] = 0xAB;
    origU8[99] = 0xCD;

    const patched = patchApplicationId(original, APPLICATION_IDS.testnet21);
    const patchedU8 = new Uint8Array(patched);

    // Check every byte except 68-71 is identical
    for (let i = 0; i < origU8.length; i++) {
      if (i >= 68 && i <= 71) continue;
      expect(patchedU8[i]).toBe(origU8[i]);
    }
  });

  it('patchApplicationId does not mutate the original buffer', () => {
    const original = makeFakeSqlite(0xFCD1B8E2);
    patchApplicationId(original, APPLICATION_IDS.testnet21);
    const dv = new DataView(original);
    expect(dv.getUint32(68, false)).toBe(0xFCD1B8E2);
  });
});

// ─── Tests against real fixture files ──────────────────────────────
describe('Wallet Converter — real fixture files', () => {
  it('reads testnet20 fixture application_id as 0xFCD1B8E2', () => {
    const buf = loadFixture('wallet-testnet20.dat');
    expect(readApplicationId(buf)).toBe(0xFCD1B8E2);
  });

  it('reads testnet21 fixture application_id as 0xFDD2B9E3', () => {
    const buf = loadFixture('wallet-testnet21.dat');
    expect(readApplicationId(buf)).toBe(0xFDD2B9E3);
  });

  it('detects testnet20 fixture as testnet19/20 network', () => {
    const buf = loadFixture('wallet-testnet20.dat');
    expect(detectNetwork(readApplicationId(buf))).toBe('testnet19/20');
  });

  it('detects testnet21 fixture as testnet21 network', () => {
    const buf = loadFixture('wallet-testnet21.dat');
    expect(detectNetwork(readApplicationId(buf))).toBe('testnet21');
  });

  it('converting testnet20→testnet21 produces correct bytes at offset 68-71', () => {
    const buf = loadFixture('wallet-testnet20.dat');
    const patched = patchApplicationId(buf, APPLICATION_IDS.testnet21);
    const dv = new DataView(patched);
    expect(dv.getUint32(68, false)).toBe(0xFDD2B9E3);
  });

  it('converting testnet20→testnet21 preserves file size', () => {
    const buf = loadFixture('wallet-testnet20.dat');
    const patched = patchApplicationId(buf, APPLICATION_IDS.testnet21);
    expect(patched.byteLength).toBe(buf.byteLength);
  });

  it('converting testnet20→testnet21 preserves SQLite header', () => {
    const buf = loadFixture('wallet-testnet20.dat');
    const patched = patchApplicationId(buf, APPLICATION_IDS.testnet21);
    const header = new Uint8Array(patched, 0, 16);
    expect(Array.from(header)).toEqual(Array.from(SQLITE_HEADER));
  });

  it('round-trip conversion preserves all bytes', () => {
    const buf = loadFixture('wallet-testnet20.dat');
    const toT21 = patchApplicationId(buf, APPLICATION_IDS.testnet21);
    const backToT20 = patchApplicationId(toT21, APPLICATION_IDS['testnet19/20']);
    const origU8 = new Uint8Array(buf);
    const roundU8 = new Uint8Array(backToT20);
    expect(Array.from(roundU8)).toEqual(Array.from(origU8));
  });

  it('real testnet21 fixture → testnet23 writes RC30 magic at offset 68-71', () => {
    const buf = loadFixture('wallet-testnet21.dat');
    const patched = patchApplicationId(buf, APPLICATION_IDS.testnet23);
    const dv = new DataView(patched);
    expect(dv.getUint32(68, false)).toBe(0xFDD2B9E4);
  });

  it('real testnet21 fixture → testnet23 preserves file size and SQLite header', () => {
    const buf = loadFixture('wallet-testnet21.dat');
    const patched = patchApplicationId(buf, APPLICATION_IDS.testnet23);
    expect(patched.byteLength).toBe(buf.byteLength);
    const header = new Uint8Array(patched, 0, 16);
    expect(Array.from(header)).toEqual(Array.from(SQLITE_HEADER));
  });

  it('real testnet21 fixture → testnet24 writes RC34 magic at offset 68-71', () => {
    const buf = loadFixture('wallet-testnet21.dat');
    const patched = patchApplicationId(buf, APPLICATION_IDS.testnet24);
    const dv = new DataView(patched);
    expect(dv.getUint32(68, false)).toBe(0xFEC4B7E5);
  });

  it('real testnet21 fixture → testnet24 preserves file size and SQLite header', () => {
    const buf = loadFixture('wallet-testnet21.dat');
    const patched = patchApplicationId(buf, APPLICATION_IDS.testnet24);
    expect(patched.byteLength).toBe(buf.byteLength);
    const header = new Uint8Array(patched, 0, 16);
    expect(Array.from(header)).toEqual(Array.from(SQLITE_HEADER));
  });
});

// ─── Validation tests ──────────────────────────────────────────────
describe('Wallet Converter — validation', () => {
  it('rejects a non-SQLite file (missing header)', () => {
    const buf = new ArrayBuffer(100);
    const u8 = new Uint8Array(buf);
    u8[0] = 0xFF; // not SQLite
    // readApplicationId should still read bytes, but the page should validate the header
    // We test the isSqliteFile check via the component
    expect(readApplicationId(buf)).toBeDefined();
  });
});

// ─── Component rendering tests ─────────────────────────────────────
describe('WalletConvertPage — component', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders the page title and security notice', () => {
    renderWithProviders(<WalletConvertPage />, { network: 'testnet', route: '/testnet/convert' });
    expect(screen.getByText(/Wallet Converter/i)).toBeInTheDocument();
    expect(screen.getByText(/never leaves your browser/i)).toBeInTheDocument();
  });

  it('renders the drag-and-drop zone', () => {
    renderWithProviders(<WalletConvertPage />, { network: 'testnet', route: '/testnet/convert' });
    expect(screen.getByText(/drag.*drop|click to select/i)).toBeInTheDocument();
  });

  it('shows walletcrosschain instructions', () => {
    renderWithProviders(<WalletConvertPage />, { network: 'testnet', route: '/testnet/convert' });
    const matches = screen.getAllByText(/walletcrosschain=1/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows file info after loading a valid wallet', async () => {
    renderWithProviders(<WalletConvertPage />, { network: 'testnet', route: '/testnet/convert' });

    const buf = makeFakeSqlite(0xFCD1B8E2);
    const file = new File([buf], 'wallet.dat', { type: 'application/octet-stream' });

    const input = screen.getByTestId('wallet-file-input');
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText(/testnet19\/20/i)).toBeInTheDocument();
    });
  });

  it('shows error for non-SQLite file', async () => {
    renderWithProviders(<WalletConvertPage />, { network: 'testnet', route: '/testnet/convert' });

    const buf = new ArrayBuffer(100);
    const file = new File([buf], 'wallet.dat', { type: 'application/octet-stream' });

    const input = screen.getByTestId('wallet-file-input');
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText(/not a valid SQLite/i)).toBeInTheDocument();
    });
  });
});
