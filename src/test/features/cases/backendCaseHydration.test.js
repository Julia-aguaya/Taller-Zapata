import { describe, expect, it } from 'vitest';

import { hydrateBackendCaseDetail } from '../../../features/cases/lib/backendCaseHydration';

describe('hydrateBackendCaseDetail', () => {
  it('inyecta cliente y vehiculo usando los ids principales del caso', () => {
    const detail = {
      id: 77,
      folderCode: 'CAR-00077',
      principalCustomerPersonId: 15,
      principalVehicleId: 22,
    };

    const hydrated = hydrateBackendCaseDetail(
      detail,
      {
        id: 15,
        nombre: 'Juan',
        apellido: 'Perez',
        numeroDocumento: '30111222',
        telefonoPrincipal: '3415550000',
        emailPrincipal: 'juan@example.com',
      },
      {
        id: 22,
        brandText: 'Ford',
        modelText: 'Focus',
        plate: 'AA123BB',
        year: 2020,
        vehicleTypeCode: 'SUV',
        usageCode: 'Particular',
        color: 'Gris',
        chasis: 'CH-001',
        motor: 'EN-001',
        transmissionCode: 'MANUAL',
      },
    );

    expect(hydrated.client).toMatchObject({
      firstName: 'Juan',
      lastName: 'Perez',
      phone: '3415550000',
      document: '30111222',
      email: 'juan@example.com',
    });

    expect(hydrated.vehicle).toMatchObject({
      brand: 'Ford',
      model: 'Focus',
      plate: 'AA123BB',
      year: 2020,
      type: 'SUV',
      usage: 'Particular',
      color: 'Gris',
      chassis: 'CH-001',
      engine: 'EN-001',
      transmission: 'MANUAL',
    });
  });
});
