import { describe, expect, it } from 'vitest';
import {
  buildLawyerInjuredFullName,
  buildLegalLesionadoSignature,
  hasLawyerInjuredData,
  lawyerInjuredRoleCode,
  lawyerInjuredRoleLabel,
} from '../../../features/gestion/lib/gestionShared';

describe('lesionados: mapeo y firma para sync', () => {
  it('mapea el rol de lesionado entre UI y catalogo', () => {
    expect(lawyerInjuredRoleCode('titular registral')).toBe('TITULAR_REGISTRAL');
    expect(lawyerInjuredRoleCode('cliente')).toBe('CLIENTE');
    expect(lawyerInjuredRoleCode('otro')).toBe('OTRO');
    expect(lawyerInjuredRoleCode('TITULAR_REGISTRAL')).toBe('TITULAR_REGISTRAL');
    expect(lawyerInjuredRoleCode('raro')).toBeNull();

    expect(lawyerInjuredRoleLabel('TITULAR_REGISTRAL')).toBe('titular registral');
    expect(lawyerInjuredRoleLabel('CLIENTE')).toBe('cliente');
    expect(lawyerInjuredRoleLabel(null)).toBeNull();
  });

  it('detecta lesionados con datos suficientes para sincronizar', () => {
    expect(hasLawyerInjuredData({ firstName: 'Juan' })).toBe(true);
    expect(hasLawyerInjuredData({ lastName: 'Perez' })).toBe(true);
    expect(hasLawyerInjuredData({ document: '30111222' })).toBe(true);
    expect(hasLawyerInjuredData({ firstName: '', lastName: '', document: '' })).toBe(false);
    expect(hasLawyerInjuredData(null)).toBe(false);
  });

  it('arma el nombre completo apellido primero', () => {
    expect(buildLawyerInjuredFullName({ firstName: 'Juan', lastName: 'Perez' })).toBe('Perez Juan');
    expect(buildLawyerInjuredFullName({ firstName: 'Juan' })).toBe('Juan');
    expect(buildLawyerInjuredFullName({})).toBeNull();
  });

  it('firma igual al lesionado local y al backend ya sincronizado', () => {
    const local = {
      injuredRole: 'cliente',
      firstName: 'Juan',
      lastName: 'Perez',
      document: '30111222',
      accreditsIncome: 'SI',
    };
    const backend = {
      lesionadoEsCode: 'CLIENTE',
      fullName: 'Perez Juan',
      documentNumber: '30111222',
      provesIncome: true,
    };

    expect(buildLegalLesionadoSignature(local)).toBe(buildLegalLesionadoSignature(backend));
  });

  it('distingue lesionados por rol y datos', () => {
    const base = { lesionadoEsCode: 'OTRO', fullName: 'Juan Perez', documentNumber: '30111222', provesIncome: false };
    const distintoRol = { ...base, lesionadoEsCode: 'CLIENTE' };
    const distintoDocumento = { ...base, documentNumber: '99999999' };

    expect(buildLegalLesionadoSignature(base)).not.toBe(buildLegalLesionadoSignature(distintoRol));
    expect(buildLegalLesionadoSignature(base)).not.toBe(buildLegalLesionadoSignature(distintoDocumento));
  });
});
