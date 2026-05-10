import { describe, it, expect } from 'vitest';
import {
  buildCaseRelationsState,
  buildRejectedCaseRelationsState,
  buildCaseInsuranceState,
  buildRejectedCaseInsuranceState,
  buildCaseLegalState,
  buildRejectedCaseLegalState,
  buildCaseFinanceSummaryState,
  buildRejectedCaseFinanceSummaryState,
} from '../../../features/case-detail/lib/detailStateBuilders';

describe('CaseDetail - buildCaseRelationsState', () => {
  it('debería retornar estado success con items cuando hay relaciones', () => {
    const payload = [
      { id: 1, type: 'primary', relatedCaseId: 'ZP-2026-0001' },
      { id: 2, type: 'secondary', relatedCaseId: 'ZP-2026-0002' },
    ];
    const result = buildCaseRelationsState(payload);
    expect(result.status).toBe('success');
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('debería retornar estado empty cuando no hay relaciones', () => {
    const result = buildCaseRelationsState([]);
    expect(result.status).toBe('empty');
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('debería manejar payload null', () => {
    const result = buildCaseRelationsState(null);
    expect(result.status).toBe('empty');
    expect(result.items).toEqual([]);
  });

  it('debería manejar payload undefined', () => {
    const result = buildCaseRelationsState(undefined);
    expect(result.status).toBe('empty');
  });

  it('debería usar detail personalizado cuando se provee', () => {
    const result = buildCaseRelationsState([], 'Custom detail');
    expect(result.detail).toBe('Custom detail');
  });

  it('debería generar detail por defecto para caso vacío', () => {
    const result = buildCaseRelationsState([]);
    expect(result.detail).toContain('vínculos');
  });
});

describe('CaseDetail - buildRejectedCaseRelationsState', () => {
  it('debería retornar estado empty para error 404', () => {
    const result = buildRejectedCaseRelationsState({ httpStatus: 404 });
    expect(result.status).toBe('empty');
    expect(result.detail).toContain('vínculos');
  });

  it('debería retornar estado error para otros errores', () => {
    const result = buildRejectedCaseRelationsState({ httpStatus: 500 });
    expect(result.status).toBe('error');
  });

  it('debería retornar estado error para error sin status', () => {
    const result = buildRejectedCaseRelationsState(null);
    expect(result.status).toBe('error');
  });
});

describe('CaseDetail - buildCaseInsuranceState', () => {
  it('debería retornar estado success cuando hay datos de seguro', () => {
    const payload = {
      companyName: 'Seguros XYZ',
      policyNumber: 'POL-12345',
      coverageType: 'Todo Riesgo',
    };
    const result = buildCaseInsuranceState(payload);
    expect(result.status).toBe('success');
    expect(result.data).toEqual(payload);
  });

  it('debería retornar estado empty cuando no hay seguro', () => {
    const result = buildCaseInsuranceState(null);
    expect(result.status).toBe('empty');
    expect(result.data).toBeNull();
  });

  it('debería manejar undefined', () => {
    const result = buildCaseInsuranceState(undefined);
    expect(result.status).toBe('empty');
  });

  it('debería usar detail personalizado', () => {
    const result = buildCaseInsuranceState(null, 'Custom insurance detail');
    expect(result.detail).toBe('Custom insurance detail');
  });
});

describe('CaseDetail - buildRejectedCaseInsuranceState', () => {
  it('debería retornar estado empty para 404', () => {
    const result = buildRejectedCaseInsuranceState({ httpStatus: 404 });
    expect(result.status).toBe('empty');
    expect(result.detail).toContain('cobertura');
  });

  it('debería retornar estado error para otros errores', () => {
    const result = buildRejectedCaseInsuranceState({ httpStatus: 500 });
    expect(result.status).toBe('error');
  });
});

describe('CaseDetail - buildCaseLegalState', () => {
  it('debería retornar estado success cuando hay datos legales', () => {
    const payload = {
      lawyerName: 'Dr. Juan Pérez',
      courtName: 'Tribunal Civil',
      caseNumber: 'EXP-2026-001',
    };
    const result = buildCaseLegalState(payload);
    expect(result.status).toBe('success');
    expect(result.data).toEqual(payload);
  });

  it('debería retornar estado empty cuando no hay info legal', () => {
    const result = buildCaseLegalState(null);
    expect(result.status).toBe('empty');
    expect(result.data).toBeNull();
  });

  it('debería manejar undefined', () => {
    const result = buildCaseLegalState(undefined);
    expect(result.status).toBe('empty');
  });
});

describe('CaseDetail - buildRejectedCaseLegalState', () => {
  it('debería retornar estado empty para 404', () => {
    const result = buildRejectedCaseLegalState({ httpStatus: 404 });
    expect(result.status).toBe('empty');
    expect(result.detail).toContain('legales');
  });

  it('debería retornar estado error para otros errores', () => {
    const result = buildRejectedCaseLegalState({ httpStatus: 500 });
    expect(result.status).toBe('error');
  });
});

describe('CaseDetail - buildCaseFinanceSummaryState', () => {
  it('debería retornar estado success cuando hay datos financieros', () => {
    const payload = {
      totalAmount: 150000,
      pendingAmount: 50000,
      paidAmount: 100000,
    };
    const result = buildCaseFinanceSummaryState(payload);
    expect(result.status).toBe('success');
    expect(result.data).toEqual(payload);
  });

  it('debería retornar estado empty cuando no hay datos', () => {
    const result = buildCaseFinanceSummaryState(null);
    expect(result.status).toBe('empty');
    expect(result.data).toBeNull();
  });

  it('debería manejar undefined', () => {
    const result = buildCaseFinanceSummaryState(undefined);
    expect(result.status).toBe('empty');
  });

  it('debería manejar objeto vacío', () => {
    const result = buildCaseFinanceSummaryState({});
    expect(result.status).toBe('success');
    expect(result.data).toEqual({});
  });

  it('debería usar detail personalizado', () => {
    const result = buildCaseFinanceSummaryState(null, 'Custom finance detail');
    expect(result.detail).toBe('Custom finance detail');
  });
});

describe('CaseDetail - buildRejectedCaseFinanceSummaryState', () => {
  it('debería retornar estado empty para 404', () => {
    const result = buildRejectedCaseFinanceSummaryState({ httpStatus: 404 });
    expect(result.status).toBe('empty');
    expect(result.detail).toContain('financiero');
  });

  it('debería retornar estado error para otros errores', () => {
    const result = buildRejectedCaseFinanceSummaryState({ httpStatus: 500 });
    expect(result.status).toBe('error');
  });

  it('debería retornar estado error para error null', () => {
    const result = buildRejectedCaseFinanceSummaryState(null);
    expect(result.status).toBe('error');
  });
});