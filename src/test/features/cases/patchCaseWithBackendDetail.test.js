import { describe, expect, it } from 'vitest';

import { patchCaseWithBackendDetail } from '../../../features/cases/lib/patchCaseWithBackendDetail';

describe('patchCaseWithBackendDetail', () => {
  it('hidrata cliente y vehiculo cuando el backend devuelve objetos anidados', () => {
    const localCase = {
      id: 'case-123',
      customer: {
        firstName: '',
        lastName: '',
        phone: '',
        document: '',
        email: '',
      },
      vehicle: {
        brand: '',
        model: '',
        plate: '',
        year: '',
        color: '',
        chassis: '',
        engine: '',
        transmission: '',
      },
      budget: { amount: '', lines: [], services: [] },
    };

    patchCaseWithBackendDetail(localCase, {
      data: {
        client: {
          firstName: 'Juan',
          lastName: 'Perez',
          phone: '3415550000',
          document: '30111222',
          email: 'juan@example.com',
        },
        vehicle: {
          brand: 'Ford',
          model: 'Focus',
          plate: 'AA123BB',
          year: 2020,
          vehicleTypeCode: 'SUV',
          usageCode: 'Particular',
          color: 'Gris',
          chassis: 'CH-001',
          engine: 'EN-001',
          transmission: 'Manual',
        },
      },
    });

    expect(localCase.customer).toMatchObject({
      firstName: 'Juan',
      lastName: 'Perez',
      phone: '3415550000',
      document: '30111222',
      email: 'juan@example.com',
    });
    expect(localCase.vehicle).toMatchObject({
      brand: 'Ford',
      model: 'Focus',
      plate: 'AA123BB',
      year: 2020,
      type: 'SUV',
      usage: 'Particular',
      color: 'Gris',
      chassis: 'CH-001',
      engine: 'EN-001',
      transmission: 'Manual',
    });
  });

  it('reemplaza el placeholder Cliente cuando el detalle trae el nombre real', () => {
    const localCase = {
      id: 'case-456',
      customer: {
        firstName: 'Cliente',
        lastName: '',
        phone: '',
        document: '',
        email: '',
      },
      vehicle: {
        brand: '',
        model: '',
        plate: '',
        year: '',
        color: '',
        chassis: '',
        engine: '',
        transmission: '',
      },
      budget: { amount: '', lines: [], services: [] },
    };

    patchCaseWithBackendDetail(localCase, {
      data: {
        client: {
          firstName: 'Juan',
          lastName: 'Perez',
        },
      },
    });

    expect(localCase.customer.firstName).toBe('Juan');
    expect(localCase.customer.lastName).toBe('Perez');
  });

  it('hidrata el estado cerrado del presupuesto backend para habilitar el PDF real', () => {
    const localCase = {
      id: '9401',
      customer: {
        firstName: '',
        lastName: '',
        phone: '',
        document: '',
        email: '',
      },
      vehicle: {
        brand: '',
        model: '',
        plate: '',
        year: '',
        color: '',
        chassis: '',
        engine: '',
        transmission: '',
      },
      budget: {
        amount: '',
        lines: [],
        services: [],
        reportStatus: 'Informe abierto',
        generated: false,
        laborWithoutVat: 0,
        estimatedWorkDays: '',
        minimumLaborClose: '',
        observations: '',
      },
    };

    patchCaseWithBackendDetail(localCase, {
      budgetState: {
        data: {
          reportStatusCode: 'CERRADO',
          laborWithoutVat: 450000,
          estimatedDays: 4,
          minimumCloseAmount: 400000,
          observations: 'Presupuesto ejecutado y cerrado.',
          items: [],
        },
      },
    });

    expect(localCase.budget).toMatchObject({
      reportStatus: 'Informe cerrado',
      generated: true,
      laborWithoutVat: 450000,
      estimatedWorkDays: 4,
      minimumLaborClose: 400000,
      observations: 'Presupuesto ejecutado y cerrado.',
    });
  });
});
