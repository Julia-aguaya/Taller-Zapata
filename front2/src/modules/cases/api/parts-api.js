import { requestBlob, requestJson } from '@/shared/api/http-client';

export const listCaseParts = (caseId) => requestJson(`/cases/${caseId}/parts`);

export const listRepairParts = (caseId) => requestJson(`/cases/${caseId}/repair-parts`);

export const downloadRepairPartLabel = (caseId, partId) => requestBlob(`/cases/${caseId}/parts/${partId}/label`);

export const updateRepairPart = (caseId, partId, payload) => requestJson(`/cases/${caseId}/repair-parts/${partId}`, {
  method: 'PUT',
  body: JSON.stringify(payload),
});

export const createRepairPartReceipt = (caseId, partId, payload) => requestJson(`/cases/${caseId}/repair-parts/${partId}/receipts`, {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const updateRepairPartReceipt = (caseId, partId, receiptId, payload) => requestJson(`/cases/${caseId}/repair-parts/${partId}/receipts/${receiptId}`, {
  method: 'PUT',
  body: JSON.stringify(payload),
});

export const deleteRepairPartReceipt = (caseId, partId, receiptId) => requestJson(`/cases/${caseId}/repair-parts/${partId}/receipts/${receiptId}`, {
  method: 'DELETE',
});

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
export const syncWorkshopReplacementParts = (caseId) => requestJson(`/cases/${caseId}/parts/sync-workshop-replacements`, { method: 'POST' });

export const resolvePartReconciliationWarning = (caseId, partId, warningId, resolution) => requestJson(`/cases/${caseId}/parts/${partId}/reconciliation-warnings/${warningId}/resolve`, {
  method: 'POST',
  body: JSON.stringify({ resolution }),
});

export const deleteCasePart = (caseId, partId) => requestJson(`/cases/${caseId}/parts/${partId}`, {
  method: 'DELETE',
});

export const getPartsCatalogs = () => requestJson('/budget/parts/catalogs');
