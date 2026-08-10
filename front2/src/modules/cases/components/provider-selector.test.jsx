import { describe, expect, it } from 'vitest';
import { providerPayload } from './provider-selector';

describe('providerPayload', () => {
  it('uses the canonical provider id and its name as the immutable transaction snapshot', () => {
    expect(providerPayload({ id: 18, name: 'Repuestos Norte' }, 'Texto anterior')).toEqual({
      providerId: 18,
      snapshot: 'Repuestos Norte',
    });
  });

  it('keeps free text and clears the provider id when no master is selected', () => {
    expect(providerPayload(null, '  Casa de repuestos local  ')).toEqual({
      providerId: null,
      snapshot: 'Casa de repuestos local',
    });
  });
});
