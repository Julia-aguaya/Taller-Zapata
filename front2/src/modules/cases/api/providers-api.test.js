import { describe, expect, it, vi } from 'vitest';

const requestJson = vi.fn();

vi.mock('@/shared/api/http-client', () => ({ requestJson }));

const { searchProviders } = await import('./providers-api');

describe('provider search API', () => {
  it('sends a free-text search through q', () => {
    searchProviders(' Repuestos Norte ');

    expect(requestJson).toHaveBeenCalledWith('/providers?active=true&q=Repuestos+Norte');
  });
});
