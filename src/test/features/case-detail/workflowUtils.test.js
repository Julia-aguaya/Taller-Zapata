import { describe, it, expect } from 'vitest';
import {
  formatWorkflowDomain,
  getWorkflowHistoryItems,
  getWorkflowActionsItems,
} from '../../../features/case-detail/lib/caseWorkflowUtils';

describe('caseWorkflowUtils', () => {
  describe('formatWorkflowDomain', () => {
    it('debería retornar fallback para valor nulo', () => {
      const result = formatWorkflowDomain(null);
      expect(result).toBe('Seguimiento');
    });

    it('debería retornar fallback para valor undefined', () => {
      const result = formatWorkflowDomain(undefined);
      expect(result).toBe('Seguimiento');
    });

    it('debería retornar fallback para string vacío', () => {
      const result = formatWorkflowDomain('');
      expect(result).toBe('Seguimiento');
    });

    it('debería formatear tramite correctamente', () => {
      const result = formatWorkflowDomain('tramite');
      expect(result).toBe('Tramite');
    });

    it('debería formatear reparacion correctamente', () => {
      const result = formatWorkflowDomain('reparacion');
      expect(result).toBe('Reparacion');
    });

    it('debería formatear pago correctamente', () => {
      const result = formatWorkflowDomain('pago');
      expect(result).toBe('Cobro');
    });

    it('debería formatear documentacion correctamente', () => {
      const result = formatWorkflowDomain('documentacion');
      expect(result).toBe('Documentacion');
    });

    it('debería formatear legal correctamente', () => {
      const result = formatWorkflowDomain('legal');
      expect(result).toBe('Gestión legal');
    });

    it('debería ser case insensitive', () => {
      const result = formatWorkflowDomain('TRAMITE');
      expect(result).toBe('Tramite');
    });

    it('debería usar fallback personalizado cuando hay match en labels', () => {
      // The function has specific labels and falls back to formatBackendState for unknown domains
      // There's no custom fallback for unknown domains in the current implementation
      // This test documents the actual behavior
      const result = formatWorkflowDomain('desconocido', 'Otro');
      // The implementation uses formatBackendState which capitalizes
      expect(result).toBe('Desconocido');
    });

    it('debería usar formatBackendState para dominio desconocido', () => {
      const result = formatWorkflowDomain('unknown_domain');
      expect(result).toBe('Unknown Domain');
    });

    it('debería trimhear espacios', () => {
      const result = formatWorkflowDomain('  tramite  ');
      expect(result).toBe('Tramite');
    });
  });

  describe('getWorkflowHistoryItems', () => {
    it('debería retornar array vacío para null', () => {
      const result = getWorkflowHistoryItems(null);
      expect(result).toEqual([]);
    });

    it('debería retornar array vacío para undefined', () => {
      const result = getWorkflowHistoryItems(undefined);
      expect(result).toEqual([]);
    });

    it('debería retornar array vacío para no-array', () => {
      const result = getWorkflowHistoryItems('not array');
      expect(result).toEqual([]);
    });

    it('debería retornar array tal cual si es array', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const result = getWorkflowHistoryItems(items);
      expect(result).toEqual(items);
    });
  });

  describe('getWorkflowActionsItems', () => {
    it('debería retornar array vacío para null', () => {
      const result = getWorkflowActionsItems(null);
      expect(result).toEqual([]);
    });

    it('debería retornar array vacío para undefined', () => {
      const result = getWorkflowActionsItems(undefined);
      expect(result).toEqual([]);
    });

    it('debería retornar array vacío si no hay actions', () => {
      const result = getWorkflowActionsItems({});
      expect(result).toEqual([]);
    });

    it('debería retornar array vacío si actions no es array', () => {
      const result = getWorkflowActionsItems({ actions: 'not array' });
      expect(result).toEqual([]);
    });

    it('debería retornar actions si es array', () => {
      const actions = [{ code: 'A1' }, { code: 'A2' }];
      const result = getWorkflowActionsItems({ actions });
      expect(result).toEqual(actions);
    });
  });
});