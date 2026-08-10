import { requestJson } from '@/shared/api/http-client';

export const createPerson = (payload) => requestJson('/persons', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const createVehicle = (payload) => requestJson('/vehicles', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const createCase = (payload) => requestJson('/cases', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const getCaseCatalogs = () => requestJson('/cases/catalogs');

export const getInsuranceCatalogs = () => requestJson('/insurance/catalogs');

export const listOrganizations = () => requestJson('/organizations');

export const listBranches = (organizationId) => requestJson(`/branches${organizationId ? `?organizationId=${organizationId}` : ''}`);

export const listVehicleBrands = () => requestJson('/vehicles/brands');

export const listVehicleModels = (brandId) => requestJson(`/vehicles/models${brandId ? `?brandId=${brandId}` : ''}`);

export const getVehicleCatalogs = () => requestJson('/vehicles/catalogs');

export const searchPersons = (params = {}) => {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.document) sp.set('document', params.document);
  const qs = sp.toString();
  return requestJson(`/persons${qs ? `?${qs}` : ''}`);
};

export const searchVehicles = (params = {}) => {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.plate) sp.set('plate', params.plate);
  const qs = sp.toString();
  return requestJson(`/vehicles${qs ? `?${qs}` : ''}`);
};

export const getPersonVehicles = (personId) => requestJson(`/persons/${personId}/vehicles`);

export const getVehiclePersons = (vehicleId) => requestJson(`/vehicles/${vehicleId}/persons`);
