import { describe, it, expect } from 'vitest';
import {
  getBackendCasesItems,
  getCaseVehicleLabel,
  getCaseResponsibleLabel,
  getCaseNextTaskLabel,
} from '../../../features/cases/lib/caseDisplayHelpers';

describe('caseDisplayHelpers', () => {
  describe('getBackendCasesItems', () => {
    it('debería retornar array tal cual si es array', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const result = getBackendCasesItems(items);
      expect(result).toEqual(items);
    });

    it('debería extraer content si existe', () => {
      const payload = { content: [{ id: 1 }, { id: 2 }] };
      const result = getBackendCasesItems(payload);
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('debería extraer items si existe', () => {
      const payload = { items: [{ id: 1 }, { id: 2 }] };
      const result = getBackendCasesItems(payload);
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('debería preferir content sobre items', () => {
      const payload = { content: [{ id: 1 }], items: [{ id: 2 }] };
      const result = getBackendCasesItems(payload);
      expect(result).toEqual([{ id: 1 }]);
    });

    it('debería retornar array vacío para null', () => {
      const result = getBackendCasesItems(null);
      expect(result).toEqual([]);
    });

    it('debería retornar array vacío para undefined', () => {
      const result = getBackendCasesItems(undefined);
      expect(result).toEqual([]);
    });

    it('debería retornar array vacío para objeto sin propiedades válidas', () => {
      const result = getBackendCasesItems({ foo: 'bar' });
      expect(result).toEqual([]);
    });
  });

  describe('getCaseVehicleLabel', () => {
    it('debería retornar brand y model concatenados', () => {
      const item = { brand: 'Toyota', model: 'Corolla' };
      expect(getCaseVehicleLabel(item)).toBe('Toyota Corolla');
    });

    it('debería incluir plate cuando existe', () => {
      const item = { brand: 'Toyota', model: 'Corolla', plate: 'ABC123' };
      expect(getCaseVehicleLabel(item)).toBe('Toyota Corolla · ABC123');
    });

    it('debería usar licensePlate como fallback', () => {
      const item = { brand: 'Toyota', licensePlate: 'ABC123' };
      expect(getCaseVehicleLabel(item)).toBe('Toyota · ABC123');
    });

    it('debería usar patent como fallback', () => {
      const item = { brand: 'Toyota', patent: 'ABC123' };
      expect(getCaseVehicleLabel(item)).toBe('Toyota · ABC123');
    });

    it('debería retornar solo plate si no hay brand/model', () => {
      const item = { plate: 'ABC123' };
      expect(getCaseVehicleLabel(item)).toBe('ABC123');
    });

    it('debería retornar mensaje por defecto si no hay datos', () => {
      const item = {};
      expect(getCaseVehicleLabel(item)).toBe('Vehiculo no informado');
    });

    it('debería retornar mensaje por defecto para null', () => {
      expect(getCaseVehicleLabel(null)).toBe('Vehiculo no informado');
    });
  });

  describe('getCaseResponsibleLabel', () => {
    it('debería retornar assigneeName si existe', () => {
      const item = { assigneeName: 'Juan Perez' };
      expect(getCaseResponsibleLabel(item)).toBe('Juan Perez');
    });

    it('debería retornar assignedToName como fallback', () => {
      const item = { assignedToName: 'Maria Garcia' };
      expect(getCaseResponsibleLabel(item)).toBe('Maria Garcia');
    });

    it('debería retornar ownerName como fallback', () => {
      const item = { ownerName: 'Carlos Lopez' };
      expect(getCaseResponsibleLabel(item)).toBe('Carlos Lopez');
    });

    it('debería retornar managerName como fallback', () => {
      const item = { managerName: 'Ana Rodriguez' };
      expect(getCaseResponsibleLabel(item)).toBe('Ana Rodriguez');
    });

    it('debería buscar en workflowActions si no hay datos en item', () => {
      const item = {};
      const workflowActions = [{ responsibleName: 'Pedro Martinez' }];
      expect(getCaseResponsibleLabel(item, workflowActions)).toBe('Pedro Martinez');
    });

    it('debería buscar assigneeName en workflowActions', () => {
      const item = {};
      const workflowActions = [{ assigneeName: 'Laura Sanchez' }];
      expect(getCaseResponsibleLabel(item, workflowActions)).toBe('Laura Sanchez');
    });

    it('debería retornar mensaje por defecto si no hay datos', () => {
      const item = {};
      const workflowActions = [];
      expect(getCaseResponsibleLabel(item, workflowActions)).toBe('Sin responsable asignado');
    });
  });

  describe('getCaseNextTaskLabel', () => {
    it('debería retornar mensaje por defecto para array vacío', () => {
      expect(getCaseNextTaskLabel([])).toBe('Sin acción definida');
    });

    it('debería retornar label del primer action', () => {
      const workflowActions = [{ label: 'Revisar presupuesto' }];
      expect(getCaseNextTaskLabel(workflowActions)).toBe('Revisar presupuesto');
    });

    it('debería usar title como fallback', () => {
      const workflowActions = [{ title: 'Aprobar presupuesto' }];
      expect(getCaseNextTaskLabel(workflowActions)).toBe('Aprobar presupuesto');
    });

    it('debería usar reason como fallback', () => {
      const workflowActions = [{ reason: 'Esperando aprobación' }];
      expect(getCaseNextTaskLabel(workflowActions)).toBe('Esperando aprobación');
    });

    it('debería retornar acción pendiente como fallback', () => {
      const workflowActions = [{}];
      expect(getCaseNextTaskLabel(workflowActions)).toBe('Acción pendiente');
    });
  });
});