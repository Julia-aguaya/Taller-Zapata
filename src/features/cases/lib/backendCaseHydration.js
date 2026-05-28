export function mapBackendPersonToCaseClient(person) {
  if (!person) {
    return null;
  }

  return {
    firstName: person.nombre || '',
    lastName: person.apellido || person.nombreMostrar || '',
    phone: person.telefonoPrincipal || '',
    document: person.numeroDocumento || '',
    email: person.emailPrincipal || '',
  };
}

export function mapBackendVehicleToCaseVehicle(vehicle) {
  if (!vehicle) {
    return null;
  }

  return {
    brand: vehicle.brandText || '',
    model: vehicle.modelText || '',
    plate: vehicle.plate || '',
    year: vehicle.year || '',
    type: vehicle.vehicleTypeCode || '',
    usage: vehicle.usageCode || '',
    color: vehicle.color || '',
    chassis: vehicle.chasis || '',
    engine: vehicle.motor || '',
    transmission: vehicle.transmissionCode || '',
  };
}

export function hydrateBackendCaseDetail(detail, person, vehicle) {
  const nextDetail = { ...(detail || {}) };
  const client = mapBackendPersonToCaseClient(person);
  const caseVehicle = mapBackendVehicleToCaseVehicle(vehicle);

  if (client) {
    nextDetail.client = {
      ...(nextDetail.client || nextDetail.customer || {}),
      ...client,
    };
  }

  if (caseVehicle) {
    nextDetail.vehicle = {
      ...(nextDetail.vehicle || {}),
      ...caseVehicle,
    };
  }

  return nextDetail;
}
