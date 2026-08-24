import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/auth/session-storage', () => ({
  clearStoredAuth: vi.fn(),
  readStoredAuth: vi.fn(() => null),
  saveStoredAuth: vi.fn(),
}));

const { requestBlob } = await import('./http-client');

describe('requestBlob', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a successful binary response without reading it as JSON', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' });
    const response = {
      ok: true,
      blob: vi.fn().mockResolvedValue(blob),
      headers: new Headers({ 'content-type': 'application/pdf' }),
      json: vi.fn(),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

    await expect(requestBlob('/cases/42/budget-comparisons/7/pdf')).resolves.toBe(blob);

    expect(response.blob).toHaveBeenCalledOnce();
    expect(response.json).not.toHaveBeenCalled();
  });

  it('uses the JSON error payload when a download fails', async () => {
    const response = {
      ok: false,
      status: 422,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ message: 'No hay comparación' }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

    await expect(requestBlob('/cases/42/budget-comparisons/7/pdf')).rejects.toMatchObject({
      message: '[422] No hay comparación',
      httpStatus: 422,
      payload: { message: 'No hay comparación' },
    });
  });
});
