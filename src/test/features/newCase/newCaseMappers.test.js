import { describe, it, expect } from 'vitest';
import { 
  mapClientToForm, 
  mapVehicleToForm, 
  mapFormToApi 
} from '../../../features/newCase/lib/mappers';

describe('NewCase - mapClientToForm', () => {
  it('debería transformar datos de cliente a formulario', () => {
    const clientData = {
      rut: '12345678-9',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@test.com',
      telefono: '912345678',
      direccion: 'Calle 123',
    };
    
    const result = mapClientToForm(clientData);
    
    expect(result.rut).toBe('12345678-9');
    expect(result.firstName).toBe('Juan');
    expect(result.lastName).toBe('Pérez');
    expect(result.email).toBe('juan@test.com');
    expect(result.phone).toBe('912345678');
    expect(result.address).toBe('Calle 123');
  });

  it('debería usar fono como fallback para teléfono', () => {
    const clientData = {
      rut: '12345678-9',
      nombre: 'Test',
      fono: '912345678',
    };
    
    const result = mapClientToForm(clientData);
    expect(result.phone).toBe('912345678');
  });

  it('debería manejar null', () => {
    expect(mapClientToForm(null)).toBeNull();
  });

  it('debería manejar propiedades faltantes', () => {
    const result = mapClientToForm({ rut: '12345678-9' });
    
    expect(result.rut).toBe('12345678-9');
    expect(result.firstName).toBe('');
    expect(result.email).toBe('');
  });
});

describe('NewCase - mapVehicleToForm', () => {
  it('debería transformar datos de vehículo a formulario', () => {
    const vehicleData = {
      patente: 'ABCD12',
      marca: 'Toyota',
      modelo: 'Corolla',
      año: 2020,
      color: 'Gris',
      vin: '1HGBH41JXMN109186',
    };
    
    const result = mapVehicleToForm(vehicleData);
    
    expect(result.plate).toBe('ABCD12');
    expect(result.brand).toBe('Toyota');
    expect(result.model).toBe('Corolla');
    expect(result.year).toBe(2020);
    expect(result.color).toBe('Gris');
    expect(result.vin).toBe('1HGBH41JXMN109186');
  });

  it('debería usar patente_anterior como fallback', () => {
    const vehicleData = {
      patente: '',
      patente_anterior: 'ABCD12',
    };
    
    const result = mapVehicleToForm(vehicleData);
    expect(result.plate).toBe('ABCD12');
  });

  it('debería usar año como fallback para anio', () => {
    const vehicleData = {
      patente: 'ABCD12',
      anio: 2019,
    };
    
    const result = mapVehicleToForm(vehicleData);
    expect(result.year).toBe(2019);
  });

  it('debería manejar null', () => {
    expect(mapVehicleToForm(null)).toBeNull();
  });

  it('debería manejar propiedades faltantes', () => {
    const result = mapVehicleToForm({ patente: 'ABCD12' });
    
    expect(result.plate).toBe('ABCD12');
    expect(result.brand).toBe('');
    expect(result.model).toBe('');
  });
});

describe('NewCase - mapFormToApi', () => {
  it('debería transformar formulario a payload de API', () => {
    const formData = {
      rut: '12.345.678-5',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@test.com',
      phone: '+56 9 1234 5678',
      plate: 'ABC-123',
      brand: 'Toyota',
      model: 'Corolla',
      year: '2020',
      color: 'Gris',
      incidentDate: '2024-01-15',
      description: 'Test incident',
      incidentLocation: 'Calle 123',
    };
    
    const result = mapFormToApi(formData);
    
    expect(result.cliente.rut).toBe('123456785');
    expect(result.cliente.nombre).toBe('Juan');
    expect(result.cliente.apellido).toBe('Pérez');
    expect(result.cliente.email).toBe('juan@test.com');
    expect(result.cliente.telefono).toBe('56912345678');
    
    expect(result.vehiculo.patente).toBe('ABC123');
    expect(result.vehiculo.marca).toBe('Toyota');
    expect(result.vehiculo.modelo).toBe('Corolla');
    expect(result.vehiculo.año).toBe(2020);
    expect(result.vehiculo.color).toBe('Gris');
    
    expect(result.incidente.fecha).toBe('2024-01-15');
    expect(result.incidente.descripcion).toBe('Test incident');
    expect(result.incidente.lugar).toBe('Calle 123');
  });

  it('debería incluir seguros cuando existen', () => {
    const formData = {
      rut: '12345678-5',
      firstName: 'Test',
      lastName: 'Test',
      email: 'test@test.com',
      phone: '912345678',
      plate: 'ABCD12',
      brand: 'Toyota',
      model: 'Corolla',
      year: '2020',
      incidentDate: '2024-01-15',
      description: 'Test',
      insuranceCompany: 'Seguros ABC',
      policyNumber: 'POL123',
      coverage: 'Full',
    };
    
    const result = mapFormToApi(formData);
    
    expect(result.seguros.compania).toBe('Seguros ABC');
    expect(result.seguros.poliza).toBe('POL123');
    expect(result.seguros.cobertura).toBe('Full');
  });

  it('debería normalizar email a minúsculas', () => {
    const formData = {
      rut: '12345678-5',
      firstName: 'Test',
      lastName: 'Test',
      email: 'TEST@TEST.COM',
      phone: '912345678',
      plate: 'ABCD12',
      brand: 'Toyota',
      model: 'Corolla',
      year: '2020',
      incidentDate: '2024-01-15',
      description: 'Test',
    };
    
    const result = mapFormToApi(formData);
    expect(result.cliente.email).toBe('test@test.com');
  });

  it('debería normalizar patente a mayúsculas sin guiones', () => {
    const formData = {
      rut: '12345678-5',
      firstName: 'Test',
      lastName: 'Test',
      email: 'test@test.com',
      phone: '912345678',
      plate: 'abc-123',
      brand: 'Toyota',
      model: 'Corolla',
      year: '2020',
      incidentDate: '2024-01-15',
      description: 'Test',
    };
    
    const result = mapFormToApi(formData);
    expect(result.vehiculo.patente).toBe('ABC123');
  });

  it('debería manejar null', () => {
    expect(mapFormToApi(null)).toBeNull();
  });

  it('debería usar trim en strings', () => {
    const formData = {
      rut: '  12345678-5  ',
      firstName: '  Juan  ',
      lastName: ' Pérez ',
      email: '  test@test.com  ',
      phone: '912345678',
      plate: 'ABCD12',
      brand: ' Toyota ',
      model: 'Corolla',
      year: '2020',
      incidentDate: '2024-01-15',
      description: '  Test incident  ',
    };
    
    const result = mapFormToApi(formData);
    expect(result.cliente.rut).toBe('123456785');
    expect(result.cliente.nombre).toBe('Juan');
    expect(result.cliente.apellido).toBe('Pérez');
    expect(result.cliente.email).toBe('test@test.com');
    expect(result.vehiculo.marca).toBe('Toyota');
    expect(result.incidente.descripcion).toBe('Test incident');
  });

  it('debería convertir year a número', () => {
    const formData = {
      rut: '12345678-5',
      firstName: 'Test',
      lastName: 'Test',
      email: 'test@test.com',
      phone: '912345678',
      plate: 'ABCD12',
      brand: 'Toyota',
      model: 'Corolla',
      year: '2020',
      incidentDate: '2024-01-15',
      description: 'Test',
    };
    
    const result = mapFormToApi(formData);
    expect(result.vehiculo.año).toBe(2020);
    expect(typeof result.vehiculo.año).toBe('number');
  });
});