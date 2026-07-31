import { requestJson } from '@/shared/api/http-client';

export const getFinanceCatalogs = () => requestJson('/finance/catalogs');

export const createFinancialMovement = (caseId, payload) => requestJson(`/cases/${caseId}/financial-movements`, {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const listFinancialMovements = (caseId) => requestJson(`/cases/${caseId}/financial-movements`);

export const createReceipt = (caseId, payload) => requestJson(`/cases/${caseId}/receipts`, {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const listReceipts = (caseId) => requestJson(`/cases/${caseId}/receipts`);

export const getReceiptPdfUrl = (receiptId) => `/api/v1/receipts/${receiptId}/pdf`;
