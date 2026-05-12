import { describe, expect, it } from 'vitest';
import { resolvePartsAuthorizationCode, resolveReportStatusCode } from '../../../features/cases/lib/operationCatalogResolvers';

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
});
