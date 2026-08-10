import { describe, expect, it } from 'vitest';
import { requiresReferenciador } from './new-case-page';

describe('NewCasePage canonical referenciador validation', () => {
  it('requires a canonical referenciador only for referred cases', () => {
    expect(requiresReferenciador('SI', null)).toBe(true);
    expect(requiresReferenciador('SI', 77)).toBe(false);
    expect(requiresReferenciador('NO', null)).toBe(false);
  });
});
