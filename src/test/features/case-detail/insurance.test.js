import { describe, it, expect } from 'vitest';
import {
  COVERAGE_LEVELS,
  INSURANCE_PROCESSING_STATES,
  parseInsuranceData,
  findInsuranceCompany,
  getCoverageLevelLabel,
  getProcessingStateLabel,
} from '../../../features/case-detail/lib/insurance';

describe('Insurance - Coverage Levels', () => {
  it('debería tener todos los niveles de cobertura definidos', () => {
    expect(COVERAGE_LEVELS.FULL).toBe('full');
    expect(COVERAGE_LEVELS.PARCIAL).toBe('parcial');
    expect(COVERAGE_LEVELS.BASICA).toBe('básica');
  });
});

describe('Insurance - Processing States', () => {
  it('debería tener todos los estados de procesamiento definidos', () => {
    expect(INSURANCE_PROCESSING_STATES.PENDIENTE).toBe('pendiente');
    expect(INSURANCE_PROCESSING_STATES.PROCESANDO).toBe('procesando');
    expect(INSURANCE_PROCESSING_STATES.APROBADO).toBe('aprobado');
    expect(INSURANCE_PROCESSING_STATES.RECHAZADO).toBe('rechazado');
  });
});

describe('Insurance - parseInsuranceData', () => {
  it('debería retornar null para entrada nula', () => {
    expect(parseInsuranceData(null)).toBeNull();
    expect(parseInsuranceData(undefined)).toBeNull();
  });

  it('debería parsear datos con formato nuevo', () => {
    const data = {
      policyNumber: 'POL-12345',
      company: { id: 1, name: 'Seguros ABC' },
      coverage: 'full',
      startDate: '2026-01-01',
      endDate: '2027-01-01',
      amount: 100000,
      processingState: 'aprobado',
    };
    const result = parseInsuranceData(data);
    expect(result.policyNumber).toBe('POL-12345');
    expect(result.company.name).toBe('Seguros ABC');
    expect(result.coverage).toBe(COVERAGE_LEVELS.FULL);
  });

  it('debería parsear datos con formato legacy', () => {
    const data = {
      numero_poliza: 'LEG-67890',
      compania: 'Seguros XYZ',
      cobertura: 'parcial',
      fecha_inicio: '2026-01-01',
      fecha_fin: '2027-01-01',
      monto: 50000,
      estado_procesamiento: 'pendiente',
    };
    const result = parseInsuranceData(data);
    expect(result.policyNumber).toBe('LEG-67890');
    expect(result.company.name).toBe('Seguros XYZ');
    expect(result.coverage).toBe(COVERAGE_LEVELS.PARCIAL);
  });

  it('debería parsear cobertura "full" correctamente', () => {
    const result = parseInsuranceData({ coverage: 'Full' });
    expect(result.coverage).toBe(COVERAGE_LEVELS.FULL);
  });

  it('debería parsear cobertura "completa" correctamente', () => {
    const result = parseInsuranceData({ coverage: 'completa' });
    expect(result.coverage).toBe(COVERAGE_LEVELS.FULL);
  });

  it('debería parsear cobertura "total" correctamente', () => {
    const result = parseInsuranceData({ coverage: 'total' });
    expect(result.coverage).toBe(COVERAGE_LEVELS.FULL);
  });

  it('debería parsear cobertura "parcial" correctamente', () => {
    const result = parseInsuranceData({ coverage: 'Parcial' });
    expect(result.coverage).toBe(COVERAGE_LEVELS.PARCIAL);
  });

  it('debería retornar cobertura básica para valores desconocidos', () => {
    const result = parseInsuranceData({ coverage: 'desconocido' });
    expect(result.coverage).toBe(COVERAGE_LEVELS.BASICA);
  });

  it('debería retornar cobertura básica para null', () => {
    const result = parseInsuranceData({ coverage: null });
    expect(result.coverage).toBe(COVERAGE_LEVELS.BASICA);
  });
});

describe('Insurance - findInsuranceCompany', () => {
  const companies = [
    { id: 1, nombre: 'Seguros ABC' },
    { id: 2, nombre: 'Seguros XYZ' },
    { id: 3, name: 'Other Insurance' },
  ];

  it('debería encontrar compañía por nombre', () => {
    const result = findInsuranceCompany(companies, 'ABC');
    expect(result).not.toBeNull();
    expect(result.nombre).toBe('Seguros ABC');
  });

  it('debería encontrar compañía por ID', () => {
    const result = findInsuranceCompany(companies, '2');
    expect(result).not.toBeNull();
    expect(result.nombre).toBe('Seguros XYZ');
  });

  it('debería retornar null para búsqueda vacía', () => {
    expect(findInsuranceCompany(companies, '')).toBeNull();
    expect(findInsuranceCompany(companies, null)).toBeNull();
  });

  it('debería retornar null para compañía no encontrada', () => {
    const result = findInsuranceCompany(companies, 'No Existe');
    expect(result).toBeNull();
  });

  it('debería retornar null para array vacío', () => {
    const result = findInsuranceCompany([], 'ABC');
    expect(result).toBeNull();
  });
});

describe('Insurance - getCoverageLevelLabel', () => {
  it('debería retornar label para cada nivel', () => {
    expect(getCoverageLevelLabel(COVERAGE_LEVELS.FULL)).toBe('Cobertura Completa');
    expect(getCoverageLevelLabel(COVERAGE_LEVELS.PARCIAL)).toBe('Cobertura Parcial');
    expect(getCoverageLevelLabel(COVERAGE_LEVELS.BASICA)).toBe('Cobertura Básica');
  });

  it('debería retornar el valor mismo para nivel desconocido', () => {
    expect(getCoverageLevelLabel('desconocido')).toBe('desconocido');
  });
});

describe('Insurance - getProcessingStateLabel', () => {
  it('debería retornar label para cada estado', () => {
    expect(getProcessingStateLabel(INSURANCE_PROCESSING_STATES.PENDIENTE)).toBe('Pendiente');
    expect(getProcessingStateLabel(INSURANCE_PROCESSING_STATES.PROCESANDO)).toBe('Procesando');
    expect(getProcessingStateLabel(INSURANCE_PROCESSING_STATES.APROBADO)).toBe('Aprobado');
    expect(getProcessingStateLabel(INSURANCE_PROCESSING_STATES.RECHAZADO)).toBe('Rechazado');
  });

  it('debería retornar el valor mismo para estado desconocido', () => {
    expect(getProcessingStateLabel('desconocido')).toBe('desconocido');
  });
});