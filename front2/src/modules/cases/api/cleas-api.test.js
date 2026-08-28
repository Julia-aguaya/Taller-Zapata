import { describe, expect, it, vi } from 'vitest';
import { requestJson } from '@/shared/api/http-client';
import { closeCleasCase, createCleasOrder, deleteCleasOrder, getCleasDefinition, getCleasIncident, getCleasInsurance, getCleasProcessing, listCleasOrders, saveCleasDefinition, saveCleasIncident, saveCleasInsurance, saveCleasProcessing } from './cleas-api';

vi.mock('@/shared/api/http-client', () => ({ requestJson: vi.fn() }));

describe('cleas-api', () => {
  it('uses the CLEAS section endpoints with their required HTTP methods', () => {
    getCleasDefinition(42); saveCleasDefinition(42, { scopeCode: 'DANIO_TOTAL' });
    getCleasInsurance(42); saveCleasInsurance(42, { insuranceCompanyId: 5 });
    getCleasIncident(42); saveCleasIncident(42, { incident: {} });
    getCleasProcessing(42); saveCleasProcessing(42, { expectedVersion: 0 });
    closeCleasCase(42); listCleasOrders(42); createCleasOrder(42, { documentId: 8 }); deleteCleasOrder(42, 9);

    expect(requestJson).toHaveBeenNthCalledWith(1, '/cases/42/cleas/definition');
    expect(requestJson).toHaveBeenNthCalledWith(2, '/cases/42/cleas/definition', { method: 'PUT', body: JSON.stringify({ scopeCode: 'DANIO_TOTAL' }) });
    expect(requestJson).toHaveBeenNthCalledWith(3, '/cases/42/cleas/insurance');
    expect(requestJson).toHaveBeenNthCalledWith(4, '/cases/42/cleas/insurance', { method: 'PUT', body: JSON.stringify({ insuranceCompanyId: 5 }) });
    expect(requestJson).toHaveBeenNthCalledWith(5, '/cases/42/cleas/incident');
    expect(requestJson).toHaveBeenNthCalledWith(6, '/cases/42/cleas/incident', { method: 'PUT', body: JSON.stringify({ incident: {} }) });
    expect(requestJson).toHaveBeenNthCalledWith(7, '/cases/42/cleas/processing');
    expect(requestJson).toHaveBeenNthCalledWith(8, '/cases/42/cleas/processing', { method: 'PATCH', body: JSON.stringify({ expectedVersion: 0 }) });
    expect(requestJson).toHaveBeenNthCalledWith(9, '/cases/42/cleas/close', { method: 'POST' });
    expect(requestJson).toHaveBeenNthCalledWith(10, '/cases/42/cleas/orders');
    expect(requestJson).toHaveBeenNthCalledWith(11, '/cases/42/cleas/orders', { method: 'POST', body: JSON.stringify({ documentId: 8 }) });
    expect(requestJson).toHaveBeenNthCalledWith(12, '/cases/42/cleas/orders/9', { method: 'DELETE' });
  });
});
