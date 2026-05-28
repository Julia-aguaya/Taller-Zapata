import { describe, expect, it } from 'vitest';

import {
  buildBudgetItemPersistenceFields,
  buildBudgetPersistenceFields,
  buildPersistedPartsBySignature,
  resolvePersistedPartId,
} from '../../../features/cases/lib/caseBudgetRehydrationFixes';

describe('caseBudgetRehydrationFixes', () => {
  it('usa los campos reales del presupuesto al persistir cotizacion', () => {
    expect(buildBudgetPersistenceFields({
      budget: {
        estimatedWorkDays: '4',
        observations: 'Cotizacion confirmada con proveedor sugerido.',
      },
      repair: {
        turno: {
          estimatedDays: '9',
        },
      },
    })).toEqual({
      estimatedDays: 4,
      observations: 'Cotizacion confirmada con proveedor sugerido.',
    });
  });

  it('normaliza importes del item de presupuesto para no mandar null al backend', () => {
    expect(buildBudgetItemPersistenceFields({
      partPrice: '',
    })).toEqual({
      partValue: 0,
      laborAmount: 0,
    });

    expect(buildBudgetItemPersistenceFields({
      partPrice: '125000',
      laborWithoutVat: '45000',
    })).toEqual({
      partValue: 125000,
      laborAmount: 45000,
    });
  });

  it('encuentra el id backend de repuestos recien persistidos por firma', () => {
    const persistedPartsBySignature = buildPersistedPartsBySignature([
      {
        id: 501,
        description: 'Paragolpe delantero',
        statusCode: 'Pendiente',
        finalPrice: 125000,
      },
    ]);

    expect(resolvePersistedPartId({
      backendId: null,
      name: 'Paragolpe delantero',
      state: 'Pendiente',
      amount: '125000',
    }, persistedPartsBySignature)).toBe(501);
  });
});
