import { describe, expect, it } from 'vitest';
import { inferTramiteTypeFromBackendCase, resolveFrontendCaseTypeCatalogEntry } from '../../../features/cases/lib/caseTypeResolvers';

describe('caseTypeResolvers', () => {
  it('reconoce el tramite de taller por codigo de backend (RECLAMO_TERCEROS)', () => {
    expect(inferTramiteTypeFromBackendCase({ caseTypeCode: 'RECLAMO_TERCEROS' })).toBe('Reclamo de Tercero - Taller');
  });

  it('reconoce el tramite de abogado por codigo de backend', () => {
    expect(inferTramiteTypeFromBackendCase({ caseTypeCode: 'RECLAMO_TERCEROS_ABOGADO' })).toBe('Reclamo de Tercero - Abogado');
  });

  it('resuelve el tipo de taller contra el catalogo de casos del backend', () => {
    const backendCaseTypes = [
      { id: 1, code: 'PARTICULAR', name: 'Particular' },
      { id: 5, code: 'RECLAMO_TERCEROS', name: 'Reclamo de Terceros' },
      { id: 6, code: 'RECLAMO_TERCEROS_ABOGADO', name: 'Reclamo de Terceros - Abogado' },
    ];

    const taller = resolveFrontendCaseTypeCatalogEntry(backendCaseTypes, 'Reclamo de Tercero - Taller');
    const abogado = resolveFrontendCaseTypeCatalogEntry(backendCaseTypes, 'Reclamo de Tercero - Abogado');

    expect(taller?.id).toBe(5);
    expect(abogado?.id).toBe(6);
    expect(resolveFrontendCaseTypeCatalogEntry(backendCaseTypes, 'Tipo inexistente')).toBeNull();
  });

  it('mantiene el reconocimiento por nombre para casos sin codigo normalizado', () => {
    expect(inferTramiteTypeFromBackendCase({ caseTypeCode: 'RECLAMO_TERCEROS_ABOGADO', caseTypeName: 'Reclamo de Terceros - Abogado' }))
      .toBe('Reclamo de Tercero - Abogado');
  });
});
