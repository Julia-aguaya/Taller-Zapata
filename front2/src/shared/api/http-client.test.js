import { afterEach, describe, expect, it, vi } from 'vitest';
import { readStoredAuth } from '@/shared/auth/session-storage';

vi.mock('@/shared/auth/session-storage', () => ({
  clearStoredAuth: vi.fn(),
  readStoredAuth: vi.fn(() => null),
  saveStoredAuth: vi.fn(),
}));

const { requestBlob } = await import('./http-client');
const { saveExtraBudgetDraft } = await import('@/modules/cases/api/extra-budget-api');

describe('http client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
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

  it('saves extra-budget drafts through the authenticated JSON client', async () => {
    readStoredAuth.mockReturnValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    const response = {
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ id: 9, versions: [] }),
    };
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchMock);

    await saveExtraBudgetDraft(9417, { expectedVersion: 3, items: [] });

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/cases/9417/extra-budget/draft', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ expectedVersion: 3, items: [] }),
      headers: expect.objectContaining({
        get: expect.any(Function),
      }),
    }));
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer access-token');
  });
});
