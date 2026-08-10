import { describe, expect, it } from 'vitest';
import { resolvePartsAuthorizationCode, resolveReportStatusCode, toTodoRiesgoPartAuthorizationCode } from '../../../features/cases/lib/operationCatalogResolvers';

describe('operationCatalogResolvers', () => {
  it('resuelve reportStatusCode desde catálogos de operación', () => {
    const catalogs = {
      budgetReportStatusCodes: [
        { code: 'OPEN', name: 'Informe abierto' },
        { code: 'CLOSED', name: 'Informe cerrado' },
      ],
    };

    expect(resolveReportStatusCode('Informe cerrado', catalogs)).toBe('CLOSED');
  });

  it('resuelve partsAuthorizationCode usando el estado correcto de autorizacion', () => {
    const catalogs = {
      partsAuthorizationCodes: [
        { code: 'PENDING', name: 'Pendiente' },
        { code: 'PARTIAL', name: 'Autorización parcial' },
        { code: 'TOTAL', name: 'Autorización total' },
      ],
    };

    expect(resolvePartsAuthorizationCode('Autorización total', catalogs)).toBe('TOTAL');
  });

  it('mapea la autorización por fila TODO_RIESGO al código canónico del backend', () => {
    expect(toTodoRiesgoPartAuthorizationCode('Sí')).toBe('AUTORIZADO');
    expect(toTodoRiesgoPartAuthorizationCode('No')).toBe('RECHAZADO');
    expect(toTodoRiesgoPartAuthorizationCode('Pendiente')).toBeNull();
    expect(toTodoRiesgoPartAuthorizationCode(null)).toBeNull();
  });
});
