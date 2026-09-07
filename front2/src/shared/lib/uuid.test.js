import { afterEach, describe, expect, it, vi } from 'vitest';
import { randomUuid } from './uuid';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('randomUuid', () => {
  it('returns a valid UUID v4 when crypto.randomUUID is available (secure context)', () => {
    expect(randomUuid()).toMatch(UUID_V4);
  });

  it('falls back to getRandomValues when crypto.randomUUID is missing (insecure context)', () => {
    vi.stubGlobal('crypto', { getRandomValues: (arr) => arr.map(() => Math.floor(Math.random() * 256)) });
    const value = randomUuid();
    expect(value).toMatch(UUID_V4);
    expect(value).not.toBe(randomUuid());
  });

  it('falls back to non-crypto generator when Web Crypto is entirely unavailable', () => {
    vi.stubGlobal('crypto', undefined);
    expect(randomUuid()).toMatch(UUID_V4);
  });

  it('generates unique values across calls', () => {
    const values = new Set(Array.from({ length: 100 }, () => randomUuid()));
    expect(values.size).toBe(100);
  });
});
