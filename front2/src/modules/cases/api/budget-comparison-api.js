import { requestBlob, requestJson } from '@/shared/api/http-client';

const base = (caseId, snapshotId = '') => `/cases/${caseId}/budget-comparisons${snapshotId ? `/${snapshotId}` : ''}`;
export const listBudgetComparisons = (caseId, context) => requestJson(`${base(caseId)}${context ? `?context=${context}` : ''}`);
export const getBudgetComparison = (caseId, snapshotId) => requestJson(base(caseId, snapshotId));
export const addComparisonProvider = (caseId, snapshotId, payload) => requestJson(`${base(caseId, snapshotId)}/providers`, { method: 'POST', body: JSON.stringify(payload) });
export const updateComparisonTerms = (caseId, snapshotId, columnId, payload) => requestJson(`${base(caseId, snapshotId)}/providers/${columnId}/terms`, { method: 'PATCH', body: JSON.stringify(payload) });
export const deleteComparisonProvider = (caseId, snapshotId, columnId) => requestJson(`${base(caseId, snapshotId)}/providers/${columnId}`, { method: 'DELETE' });
export const saveComparisonPrice = (caseId, snapshotId, pieceId, columnId, payload) => requestJson(`${base(caseId, snapshotId)}/pieces/${pieceId}/prices/${columnId}`, { method: 'PATCH', body: JSON.stringify(payload) });
export const clearComparisonPrice = (caseId, snapshotId, pieceId, columnId) => requestJson(`${base(caseId, snapshotId)}/pieces/${pieceId}/prices/${columnId}`, { method: 'DELETE' });
export const selectComparisonQuote = (caseId, snapshotId, pieceId, columnId) => requestJson(`${base(caseId, snapshotId)}/pieces/${pieceId}/providers/${columnId}/select`, { method: 'POST' });
export const downloadBudgetComparisonPdf = (caseId, snapshotId) => requestBlob(`${base(caseId, snapshotId)}/pdf`);
