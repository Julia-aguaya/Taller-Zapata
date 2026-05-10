import { describe, it, expect } from 'vitest';
import { getCaseHash, getCaseRouteFromHash } from '../../../features/routing/lib/caseHash';

describe('Routing - getCaseHash', () => {
  describe('construcción de hash básico', () => {
    it('debería construir hash con solo id de caso', () => {
      const result = getCaseHash('123');
      expect(result).toBe('#/caso/123');
    });

    it('debería construir hash con id y tab válido', () => {
      const result = getCaseHash('123', { tab: 'ficha' });
      expect(result).toBe('#/caso/123/ficha');
    });

    it('debería construir hash con id, tab y subtab válidos', () => {
      const result = getCaseHash('123', { tab: 'gestion', subtab: 'repuestos' });
      expect(result).toBe('#/caso/123/gestion/repuestos');
    });

    it('debería ignorar tab inválido', () => {
      const result = getCaseHash('123', { tab: 'invalid-tab' });
      expect(result).toBe('#/caso/123');
    });

    it('debería ignorar subtab inválido', () => {
      const result = getCaseHash('123', { tab: 'gestion', subtab: 'invalid-subtab' });
      expect(result).toBe('#/caso/123/gestion');
    });

    it('debería ignorar subtab cuando tab no es gestion', () => {
      const result = getCaseHash('123', { tab: 'ficha', subtab: 'repuestos' });
      expect(result).toBe('#/caso/123/ficha');
    });
  });

  describe('casos con tabs específicos', () => {
    it('debería construir hash para tab tramite', () => {
      expect(getCaseHash('456', { tab: 'tramite' })).toBe('#/caso/456/tramite');
    });

    it('debería construir hash para tab documentacion', () => {
      expect(getCaseHash('789', { tab: 'documentacion' })).toBe('#/caso/789/documentacion');
    });

    it('debería construir hash para tab presupuesto', () => {
      expect(getCaseHash('999', { tab: 'presupuesto' })).toBe('#/caso/999/presupuesto');
    });

    it('debería construir hash para tab abogado', () => {
      expect(getCaseHash('111', { tab: 'abogado' })).toBe('#/caso/111/abogado');
    });
  });

  describe('casos con subtabs de gestion', () => {
    it('debería construir hash para subtab repuestos', () => {
      expect(getCaseHash('222', { tab: 'gestion', subtab: 'repuestos' })).toBe('#/caso/222/gestion/repuestos');
    });

    it('debería construir hash para subtab turno', () => {
      expect(getCaseHash('333', { tab: 'gestion', subtab: 'turno' })).toBe('#/caso/333/gestion/turno');
    });

    it('debería construir hash para subtab ingreso', () => {
      expect(getCaseHash('444', { tab: 'gestion', subtab: 'ingreso' })).toBe('#/caso/444/gestion/ingreso');
    });
  });
});

describe('Routing - getCaseRouteFromHash', () => {
  describe('parsing de hash', () => {
    it('debería parsear hash vacío', () => {
      const result = getCaseRouteFromHash('');
      expect(result).toEqual({ id: '', tab: '', subtab: '' });
    });

    it('debería parsear hash con solo id', () => {
      const result = getCaseRouteFromHash('#/caso/123');
      expect(result).toEqual({ id: '123', tab: '', subtab: '' });
    });

    it('debería parsear hash con id y tab', () => {
      const result = getCaseRouteFromHash('#/caso/456/ficha');
      expect(result).toEqual({ id: '456', tab: 'ficha', subtab: '' });
    });

    it('debería parsear hash con id, tab y subtab', () => {
      const result = getCaseRouteFromHash('#/caso/789/gestion/repuestos');
      expect(result).toEqual({ id: '789', tab: 'gestion', subtab: 'repuestos' });
    });
  });

  describe('validación de tabs', () => {
    it('debería ignorar tab inválido', () => {
      const result = getCaseRouteFromHash('#/caso/123/invalid');
      expect(result).toEqual({ id: '123', tab: '', subtab: '' });
    });

    it('debería ignorar subtab inválido', () => {
      const result = getCaseRouteFromHash('#/caso/123/ficha/invalid');
      expect(result).toEqual({ id: '123', tab: 'ficha', subtab: '' });
    });

    it('debería aceptar todos los tabs válidos', () => {
      const tabs = ['ficha', 'tramite', 'gestion', 'documentacion', 'presupuesto', 'abogado'];
      tabs.forEach((tab) => {
        const result = getCaseRouteFromHash(`#/caso/1/${tab}`);
        expect(result.tab).toBe(tab);
      });
    });

    it('debería aceptar todos los subtabs válidos de gestion', () => {
      const subtabs = ['repuestos', 'turno', 'ingreso', 'egreso'];
      subtabs.forEach((subtab) => {
        const result = getCaseRouteFromHash('#/caso/1/gestion/' + subtab);
        expect(result.subtab).toBe(subtab);
      });
    });
  });

  describe('casos edge', () => {
    it('debería manejar hash sin formato válido', () => {
      const result = getCaseRouteFromHash('#/otro/123');
      expect(result).toEqual({ id: '', tab: '', subtab: '' });
    });

    it('debería manejar hash con id alfanumérico', () => {
      const result = getCaseRouteFromHash('#/caso/abc123xyz');
      expect(result.id).toBe('abc123xyz');
    });
  });
});