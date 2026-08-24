import { requestJson } from '@/shared/api/http-client';

export const upsertCaseBudget = (caseId, payload) => requestJson(`/cases/${caseId}/budget`, {
  method: 'PUT',
  body: JSON.stringify(payload),
});

export const createCaseBudgetItem = (caseId, payload) => requestJson(`/cases/${caseId}/budget/items`, {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const updateCaseBudgetItem = (caseId, itemId, payload) => requestJson(`/cases/${caseId}/budget/items/${itemId}`, {
  method: 'PUT',
  body: JSON.stringify(payload),
});

export const closeCaseBudget = (caseId, payload) => requestJson(`/cases/${caseId}/budget/close`, {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const generateCaseBudget = (caseId, payload, idempotencyKey) => requestJson(`/cases/${caseId}/budget/generate`, {
  method: 'POST',
  headers: { 'Idempotency-Key': idempotencyKey },
  body: JSON.stringify(payload),
});
