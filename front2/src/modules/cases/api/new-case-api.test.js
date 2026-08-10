import { describe, expect, it, vi } from 'vitest';

const requestJson = vi.fn();

vi.mock('@/shared/api/http-client', () => ({ requestJson }));

const { searchPersons, searchVehicles } = await import('./new-case-api');

describe('autocomplete search API', () => {
  it('serializes person free-text autocomplete as q only', () => {
    searchPersons({ q: 'perez' });

    expect(requestJson).toHaveBeenCalledWith('/persons?q=perez');
  });

  it('serializes free-text autocomplete as q only', () => {
    searchVehicles({ q: 'toy' });

    expect(requestJson).toHaveBeenCalledWith('/vehicles?q=toy');
  });

  it('keeps exact plate lookup available for duplicate checks', () => {
    searchVehicles({ plate: 'AB123CD' });

    expect(requestJson).toHaveBeenCalledWith('/vehicles?plate=AB123CD');
  });
});
