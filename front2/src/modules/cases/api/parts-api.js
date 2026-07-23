import { requestJson } from '@/shared/api/http-client';

export const listCaseParts = (caseId) => requestJson(`/cases/${caseId}/parts`);

export const createCasePart = (caseId, payload) => requestJson(`/cases/${caseId}/parts`, {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const updateCasePart = (caseId, partId, payload) => requestJson(`/cases/${caseId}/parts/${partId}`, {
  method: 'PUT',
  body: JSON.stringify(payload),
});

export const syncPartsFromBudget = (caseId) => requestJson(`/cases/${caseId}/parts/sync-from-budget`, {
  method: 'POST',
});

export const deleteCasePart = (caseId, partId) => requestJson(`/cases/${caseId}/parts/${partId}`, {
  method: 'DELETE',
});

export const getPartsCatalogs = () => requestJson('/budget/parts/catalogs');
