export function mapClientToForm(clientData) {
  if (!clientData) return null;

  return {
    rut: clientData.rut || '',
    firstName: clientData.nombre || '',
    lastName: clientData.apellido || '',
    email: clientData.email || '',
    phone: clientData.telefono || clientData.fono || '',
    address: clientData.direccion || '',
  };
}

export function mapVehicleToForm(vehicleData) {
  if (!vehicleData) return null;

  return {
    plate: vehicleData.patente || vehicleData.patente_anterior || '',
    brand: vehicleData.marca || '',
    model: vehicleData.modelo || '',
    year: vehicleData.año || vehicleData.anio || '',
    color: vehicleData.color || '',
    vin: vehicleData.vin || '',
  };
}

export function mapFormToApi(formData) {
  if (!formData) return null;

  const payload = {
    cliente: {
      rut: normalizeRUT(formData.rut),
      nombre: formData.firstName?.trim(),
      apellido: formData.lastName?.trim(),
      email: formData.email?.trim().toLowerCase(),
      telefono: normalizePhone(formData.phone),
    },
    vehiculo: {
      patente: normalizePlate(formData.plate),
      marca: formData.brand?.trim(),
      modelo: formData.model?.trim(),
      año: formData.year ? parseInt(formData.year, 10) : null,
      color: formData.color?.trim(),
      vin: formData.vin?.trim().toUpperCase(),
    },
    incidente: {
      fecha: formData.incidentDate,
      descripcion: formData.description?.trim(),
      lugar: formData.incidentLocation?.trim(),
    },
  };

  if (formData.insuranceCompany) {
    payload.seguros = {
      compania: formData.insuranceCompany,
      poliza: formData.policyNumber,
      cobertura: formData.coverage,
    };
  }

  return payload;
}

function normalizeRUT(rut) {
  if (!rut) return '';
  return rut.trim().replace(/[\.\-]/g, '').toUpperCase();
}

function normalizePhone(phone) {
  if (!phone) return '';
  // Remove +, spaces, dashes, parentheses, then trim
  return phone.replace(/^\+/, '').replace(/[\s\-\(\)]/g, '');
}

function normalizePlate(plate) {
  if (!plate) return '';
  return plate.replace(/[\s\-]/g, '').toUpperCase();
}