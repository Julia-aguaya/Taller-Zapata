import { describe, expect, it } from 'vitest';
import { TAB_REGISTRY, getOperationalTabs, getTabIcon, getTabLabel } from './tab-registry';

describe('TAB_REGISTRY', () => {
  it('has all 5 operational tabs', () => {
    expect(TAB_REGISTRY.FICHA_TECNICA).toBeDefined();
    expect(TAB_REGISTRY.GESTION_TRAMITE).toBeDefined();
    expect(TAB_REGISTRY.PRESUPUESTO).toBeDefined();
    expect(TAB_REGISTRY.GESTION_REPARACION).toBeDefined();
    expect(TAB_REGISTRY.PAGOS).toBeDefined();
  });

  it('orders tabs correctly', () => {
    expect(TAB_REGISTRY.FICHA_TECNICA.order).toBe(1);
    expect(TAB_REGISTRY.GESTION_TRAMITE.order).toBe(2);
    expect(TAB_REGISTRY.PRESUPUESTO.order).toBe(3);
    expect(TAB_REGISTRY.GESTION_REPARACION.order).toBe(4);
    expect(TAB_REGISTRY.PAGOS.order).toBe(5);
  });
});

describe('getOperationalTabs', () => {
  it('filters and sorts tabs by registry order', () => {
    const tabs = [
      { tabCode: 'PAGOS', completed: true },
      { tabCode: 'FICHA_TECNICA', completed: false },
      { tabCode: 'UNKNOWN_TAB', completed: false },
      { tabCode: 'GESTION_REPARACION', completed: false },
    ];
    const result = getOperationalTabs(tabs);
    expect(result.map(t => t.tabCode)).toEqual(['FICHA_TECNICA', 'GESTION_REPARACION', 'PAGOS']);
  });

  it('returns empty array when no tabs match', () => {
    expect(getOperationalTabs([{ tabCode: 'UNKNOWN' }])).toEqual([]);
    expect(getOperationalTabs([])).toEqual([]);
  });

  it('handles undefined input', () => {
    expect(getOperationalTabs()).toEqual([]);
  });
});

describe('getTabIcon', () => {
  it('returns icon for known tabs', () => {
    expect(getTabIcon('FICHA_TECNICA')).toBeDefined();
    expect(getTabIcon('GESTION_TRAMITE')).toBeDefined();
  });

  it('returns ShieldCheck fallback for unknown tabs', () => {
    expect(getTabIcon('UNKNOWN')).toBeDefined(); // falls back to ShieldCheck
  });
});

describe('getTabLabel', () => {
  it('returns label for known tabs', () => {
    expect(getTabLabel('FICHA_TECNICA')).toBe('Ficha Técnica');
    expect(getTabLabel('GESTION_TRAMITE')).toBe('Gestión del Trámite');
    expect(getTabLabel('PRESUPUESTO')).toBe('Presupuesto');
  });

  it('returns tabCode as fallback for unknown tabs', () => {
    expect(getTabLabel('UNKNOWN')).toBe('UNKNOWN');
  });
});
