import { describe, it, expect } from 'vitest';
import {
  getCatalogEntries,
  getCatalogOptionNames,
  getCatalogSelectOptions,
  resolveCatalogCode,
} from '../../../features/cases/lib/caseCatalogHelpers';

describe('caseCatalogHelpers', () => {
  const mockCatalogs = {
    caseTypes: [
      { code: 'REP', name: 'Reparación' },
      { code: 'CHA', name: 'Chapa y pintura' },
    ],
    branches: [
      { code: 'CABA', name: 'Capital' },
      { code: 'GBA', name: 'GBA' },
    ],
    empty: [],
  };

  describe('getCatalogEntries', () => {
    it('debería retornar array de entradas para una clave válida', () => {
      const result = getCatalogEntries(mockCatalogs, 'caseTypes');
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('REP');
    });

    it('debería retornar array vacío si la clave no existe', () => {
      const result = getCatalogEntries(mockCatalogs, 'inexistente');
      expect(result).toEqual([]);
    });

    it('debería retornar array vacío si catalogs es null', () => {
      const result = getCatalogEntries(null, 'caseTypes');
      expect(result).toEqual([]);
    });

    it('debería retornar array vacío si la entrada no es array', () => {
      const result = getCatalogEntries({ caseTypes: 'no es array' }, 'caseTypes');
      expect(result).toEqual([]);
    });

    it('debería retornar array vacío si catalogs es undefined', () => {
      const result = getCatalogEntries(undefined, 'caseTypes');
      expect(result).toEqual([]);
    });
  });

  describe('getCatalogOptionNames', () => {
    it('debería retornar array de nombres', () => {
      const result = getCatalogOptionNames(mockCatalogs, 'caseTypes');
      expect(result).toEqual(['Reparación', 'Chapa y pintura']);
    });

    it('debería usar fallback si no hay entradas', () => {
      const result = getCatalogOptionNames(mockCatalogs, 'empty', ['Opción 1']);
      expect(result).toEqual(['Opción 1']);
    });

    it('debería usar fallback si la clave no existe', () => {
      const result = getCatalogOptionNames(mockCatalogs, 'inexistente', ['Fallback']);
      expect(result).toEqual(['Fallback']);
    });
  });

  describe('getCatalogSelectOptions', () => {
    it('debería retornar opciones con value y label', () => {
      const result = getCatalogSelectOptions(mockCatalogs, 'caseTypes');
      expect(result).toEqual([
        { value: 'REP', label: 'Reparación' },
        { value: 'CHA', label: 'Chapa y pintura' },
      ]);
    });

    it('debería usar código como label si no hay nombre', () => {
      const result = getCatalogSelectOptions({ test: [{ code: 'T1' }] }, 'test');
      expect(result).toEqual([{ value: 'T1', label: 'T1' }]);
    });

    it('debería filtrar entradas sin código', () => {
      const result = getCatalogSelectOptions({ test: [{ name: 'Sin código' }] }, 'test');
      expect(result).toEqual([]);
    });

    it('debería usar fallback si no hay entradas', () => {
      const result = getCatalogSelectOptions(mockCatalogs, 'empty', ['A', 'B']);
      expect(result).toEqual([
        { value: 'A', label: 'A' },
        { value: 'B', label: 'B' },
      ]);
    });
  });

  describe('resolveCatalogCode', () => {
    const entries = [
      { code: 'REP', name: 'Reparación' },
      { code: 'CHA', name: 'Chapa y pintura' },
      { code: 'POL', name: 'Poliza' },
    ];

    it('debería resolver código exacto', () => {
      const result = resolveCatalogCode('REP', entries);
      expect(result).toBe('REP');
    });

    it('debería resolver nombre como código', () => {
      const result = resolveCatalogCode('reparación', entries);
      expect(result).toBe('REP');
    });

    it('debería ser case insensitive', () => {
      const result = resolveCatalogCode('REPARACIÓN', entries);
      expect(result).toBe('REP');
    });

    it('debería normalizar acentos', () => {
      const result = resolveCatalogCode('reparacion', entries);
      expect(result).toBe('REP');
    });

    it('debería usar fallbackOptions si no hay match en entries', () => {
      const result = resolveCatalogCode('Custom', entries, ['Custom', 'Other']);
      expect(result).toBe('Custom');
    });

    it('debería retornar null si no hay match y no hay fallback', () => {
      const result = resolveCatalogCode('Inexistente', entries);
      expect(result).toBeNull();
    });

    it('debería retornar null para valor vacío', () => {
      const result = resolveCatalogCode('', entries);
      expect(result).toBeNull();
    });

    it('debería retornar null para valor null', () => {
      const result = resolveCatalogCode(null, entries);
      expect(result).toBeNull();
    });
  });
});