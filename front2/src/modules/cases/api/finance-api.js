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

export const getClientPaymentPdfUrl = (caseId, clientName, vehiclePlate, comprobanteTipo, observaciones, razonSocial, facturaNumero) => {
  const p = new URLSearchParams({ clientName, vehiclePlate, comprobanteTipo });
  if (observaciones) p.set('observaciones', observaciones);
  if (razonSocial) p.set('facturaRazonSocial', razonSocial);
  if (facturaNumero) p.set('facturaNumero', facturaNumero);
  return `/api/v1/cases/${caseId}/finance/client-payment-pdf?${p.toString()}`;
};
