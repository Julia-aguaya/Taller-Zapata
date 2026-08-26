import { requestBlob, requestJson } from '@/shared/api/http-client';

export const extraBudgetQueryKey = (caseId) => ['cases', String(caseId), 'extra-budget'];

const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const objects = (value) => Array.isArray(value) ? value.filter((entry) => entry && typeof entry === 'object') : [];
const list = (value) => Array.isArray(value) ? value : [];

// V72-V74 responses predate activation and can contain rows with only legacy item fields.
export const normalizeExtraBudget = (response) => {
  const budget = object(response);
  const activation = object(budget.activation);
  return {
    ...budget,
    // This is the @Version value of the extra-budget header, not currentVersion.
    versionLock: budget.versionLock ?? null,
    payments: objects(budget.payments),
    versions: objects(budget.versions).map((version) => ({ ...version, items: objects(version.items) })),
    activation: {
      active: activation.active ?? budget.id != null,
      requiresDeactivationConfirmation: activation.requiresDeactivationConfirmation ?? false,
      deactivationEligible: activation.deactivationEligible ?? true,
      deactivationReasons: list(activation.deactivationReasons),
    },
  };
};

const extraBudgetResponse = (request) => Promise.resolve(request).then(normalizeExtraBudget);

export const getExtraBudget = (caseId) => extraBudgetResponse(requestJson(`/cases/${caseId}/extra-budget`));

export const saveExtraBudgetDraft = (caseId, payload) => extraBudgetResponse(requestJson(`/cases/${caseId}/extra-budget/draft`, {
  method: 'PUT',
  body: JSON.stringify(payload),
}));

export const setExtraBudgetActivation = (caseId, payload) => extraBudgetResponse(requestJson(`/cases/${caseId}/extra-budget/activation`, {
  method: 'POST',
  body: JSON.stringify(payload),
}));

const transition = (caseId, action, payload) => extraBudgetResponse(requestJson(`/cases/${caseId}/extra-budget/${action}`, {
  method: 'POST',
  body: JSON.stringify(payload),
}));

export const presentExtraBudget = (caseId, payload) => transition(caseId, 'present', payload);
export const acceptExtraBudget = (caseId, payload) => transition(caseId, 'accept', payload);
export const rejectExtraBudget = (caseId, payload) => transition(caseId, 'reject', payload);
export const reviseExtraBudget = (caseId, payload) => transition(caseId, 'revise', payload);
export const confirmExtraBudget = (caseId, payload) => transition(caseId, 'confirm', payload);
export const registerExtraBudgetPayment = (caseId, payload) => requestJson(`/cases/${caseId}/extra-budget/payments`, {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const annulExtraBudgetPayment = (caseId, payload) => requestJson(`/cases/${caseId}/extra-budget/payments/annul`, {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const downloadExtraBudgetPdf = (caseId, version) => requestBlob(`/cases/${caseId}/extra-budget/versions/${version}/pdf`);
