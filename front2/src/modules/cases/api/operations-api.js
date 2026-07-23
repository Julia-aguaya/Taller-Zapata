import { requestJson } from '@/shared/api/http-client';

export const createRepairAppointment = (caseId, payload) => requestJson(`/cases/${caseId}/appointments`, {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const updateRepairAppointment = (appointmentId, payload) => requestJson(`/appointments/${appointmentId}`, {
  method: 'PUT',
  body: JSON.stringify(payload),
});

export const createVehicleIntake = (caseId, payload) => requestJson(`/cases/${caseId}/vehicle-intakes`, {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const createVehicleOutcome = (caseId, payload) => requestJson(`/cases/${caseId}/vehicle-outcomes`, {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const listRepairAppointments = (caseId) => requestJson(`/cases/${caseId}/appointments`);

export const listVehicleIntakes = (caseId) => requestJson(`/cases/${caseId}/vehicle-intakes`);

export const listVehicleOutcomes = (caseId) => requestJson(`/cases/${caseId}/vehicle-outcomes`);

export const getOperationCatalogs = () => requestJson('/operation/catalogs');
