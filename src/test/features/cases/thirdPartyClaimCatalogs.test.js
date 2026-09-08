import { describe, expect, it } from 'vitest';
import {
  resolveThirdPartyCompanyId,
  thirdPartyDocumentationStatusCode,
  thirdPartyDocumentationStatusLabel,
  thirdPartyPartsProviderCode,
  thirdPartyPartsProviderLabel,
} from '../../../features/cases/lib/thirdPartyClaimCatalogs';

describe('thirdPartyClaimCatalogs', () => {
  it('mapea el estado de documentacion de UI a codigo de catalogo', () => {
    expect(thirdPartyDocumentationStatusCode('Completa')).toBe('ACEPTADA');
    expect(thirdPartyDocumentationStatusCode('Incompleta')).toBe('PENDIENTE');
  });

  it('mapea el estado de documentacion de catalogo a label de UI', () => {
    expect(thirdPartyDocumentationStatusLabel('ACEPTADA')).toBe('Completa');
    expect(thirdPartyDocumentationStatusLabel('PENDIENTE')).toBe('Incompleta');
    expect(thirdPartyDocumentationStatusLabel('EN_REVISION')).toBe('Incompleta');
    expect(thirdPartyDocumentationStatusLabel('RECHAZADA')).toBe('Incompleta');
  });

  it('tolera codigos legados que ya viajaban crudos al backend', () => {
    expect(thirdPartyDocumentationStatusCode('ACEPTADA')).toBe('ACEPTADA');
    expect(thirdPartyPartsProviderCode('TALLER')).toBe('TALLER');
    expect(thirdPartyDocumentationStatusCode('otro-valor')).toBeNull();
    expect(thirdPartyPartsProviderCode('desconocido')).toBeNull();
  });

  it('mapea el modo de provision de repuestos en ambas direcciones', () => {
    expect(thirdPartyPartsProviderCode('Provee Taller')).toBe('TALLER');
    expect(thirdPartyPartsProviderCode('Provee Cía.')).toBe('COMPANIA');
    expect(thirdPartyPartsProviderCode('Provee cliente')).toBe('TERCERO');
    expect(thirdPartyPartsProviderLabel('TALLER')).toBe('Provee Taller');
    expect(thirdPartyPartsProviderLabel('COMPANIA')).toBe('Provee Cía.');
    expect(thirdPartyPartsProviderLabel('TERCERO')).toBe('Provee cliente');
  });

  it('resuelve la compania de la contraparte por nombre o codigo', () => {
    const companies = [
      { id: 2, code: 'SANCOR', name: 'Sancor' },
      { id: 5, code: 'RIVADAVIA', name: 'Rivadavia Seguros' },
    ];
    expect(resolveThirdPartyCompanyId('Sancor', companies)).toBe(2);
    expect(resolveThirdPartyCompanyId('RIVADAVIA', companies)).toBe(5);
    expect(resolveThirdPartyCompanyId('No existe', companies)).toBeNull();
    expect(resolveThirdPartyCompanyId('', companies)).toBeNull();
  });
});
