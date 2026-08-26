import { beforeEach, describe, expect, it, vi } from 'vitest';
import { annulExtraBudgetPayment, downloadExtraBudgetPdf, extraBudgetQueryKey, getExtraBudget, normalizeExtraBudget, registerExtraBudgetPayment, saveExtraBudgetDraft } from './extra-budget-api';

const requestJson = vi.fn();
const requestBlob = vi.fn();

vi.mock('@/shared/api/http-client', () => ({ requestJson: (...args) => requestJson(...args), requestBlob: (...args) => requestBlob(...args) }));

describe('extra budget API', () => {
  beforeEach(() => vi.clearAllMocks());
  it('uses a case-scoped query key and isolated draft/payment routes', () => {
    expect(extraBudgetQueryKey(42)).toEqual(['cases', '42', 'extra-budget']);

    saveExtraBudgetDraft(42, { expectedVersion: 3, items: [] });
    registerExtraBudgetPayment(42, { expectedVersion: 3, amount: 100, movementAt: '2026-08-24T14:30', paymentMethodCode: 'EFECTIVO', paymentMethodDetail: 'Caja', receiptId: 8, externalReference: 'OP-42', reason: 'Pago parcial' });
    annulExtraBudgetPayment(42, { expectedVersion: 4, movementId: 99 });

    expect(requestJson).toHaveBeenNthCalledWith(1, '/cases/42/extra-budget/draft', { method: 'PUT', body: JSON.stringify({ expectedVersion: 3, items: [] }) });
    expect(requestJson).toHaveBeenNthCalledWith(2, '/cases/42/extra-budget/payments', { method: 'POST', body: JSON.stringify({ expectedVersion: 3, amount: 100, movementAt: '2026-08-24T14:30', paymentMethodCode: 'EFECTIVO', paymentMethodDetail: 'Caja', receiptId: 8, externalReference: 'OP-42', reason: 'Pago parcial' }) });
    expect(requestJson).toHaveBeenNthCalledWith(3, '/cases/42/extra-budget/payments/annul', { method: 'POST', body: JSON.stringify({ expectedVersion: 4, movementId: 99 }) });
  });

  it('downloads a persisted extra-budget version PDF', () => {
    downloadExtraBudgetPdf(42, 2);
    expect(requestBlob).toHaveBeenCalledWith('/cases/42/extra-budget/versions/2/pdf');
  });

  it('normalizes partial V72-V75 and legacy responses before panels consume them', async () => {
    const v72 = normalizeExtraBudget({ id: 9, currentVersion: 1, versions: [{ number: 1, status: 'BORRADOR', items: [{ description: 'Moldura', partUnitAmount: 80 }] }] });
    const v73 = normalizeExtraBudget({ id: 9, versions: [{ number: 1, items: null }], payments: null });
    const v74 = normalizeExtraBudget({ id: 9, customerConfirmation: 'SI', versions: {} });
    const v75 = normalizeExtraBudget({ id: 9, activation: { active: false }, versions: [null], payments: {} });

    expect(v72.activation.active).toBe(true);
    expect(v72.versions[0].items).toEqual([{ description: 'Moldura', partUnitAmount: 80 }]);
    expect(v73.payments).toEqual([]);
    expect(v73.versions[0].items).toEqual([]);
    expect(v74.versions).toEqual([]);
    expect(v75).toMatchObject({ activation: { active: false, requiresDeactivationConfirmation: false }, versions: [], payments: [] });

    requestJson.mockResolvedValueOnce({ id: 9, versions: [{ number: 1, items: undefined }] });
    await expect(getExtraBudget(42)).resolves.toMatchObject({ activation: { active: true }, versions: [{ items: [] }] });
  });

  it('preserves the header version lock from the V78 GET response instead of deriving it from the current snapshot', async () => {
    const response = {
      id: 9,
      caseId: 42,
      currentVersion: 3,
      versionLock: 27,
      currentStatus: 'BORRADOR',
      activation: { active: true, requiresDeactivationConfirmation: false, deactivationEligible: true, deactivationReasons: [] },
      payments: [],
      versions: [{ id: 30, number: 3, status: 'BORRADOR', items: [] }],
    };

    requestJson.mockResolvedValueOnce(response);

    await expect(getExtraBudget(42)).resolves.toMatchObject({ currentVersion: 3, versionLock: 27 });
    expect(normalizeExtraBudget({ ...response, versionLock: undefined })).toMatchObject({ versionLock: null });
  });
});
