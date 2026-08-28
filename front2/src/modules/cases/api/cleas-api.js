import { requestJson } from '@/shared/api/http-client';

const basePath = (caseId) => `/cases/${caseId}/cleas`;

export const getCleasDefinition = (caseId) => requestJson(`${basePath(caseId)}/definition`);
export const saveCleasDefinition = (caseId, payload) => requestJson(`${basePath(caseId)}/definition`, { method: 'PUT', body: JSON.stringify(payload) });

export const getCleasInsurance = (caseId) => requestJson(`${basePath(caseId)}/insurance`);
export const saveCleasInsurance = (caseId, payload) => requestJson(`${basePath(caseId)}/insurance`, { method: 'PUT', body: JSON.stringify(payload) });

export const getCleasIncident = (caseId) => requestJson(`${basePath(caseId)}/incident`);
export const saveCleasIncident = (caseId, payload) => requestJson(`${basePath(caseId)}/incident`, { method: 'PUT', body: JSON.stringify(payload) });

export const getCleasProcessing = (caseId) => requestJson(`${basePath(caseId)}/processing`);
export const saveCleasProcessing = (caseId, payload) => requestJson(`${basePath(caseId)}/processing`, { method: 'PATCH', body: JSON.stringify(payload) });
export const closeCleasCase = (caseId) => requestJson(`${basePath(caseId)}/close`, { method: 'POST' });

export const listCleasOrders = (caseId) => requestJson(`${basePath(caseId)}/orders`);
export const createCleasOrder = (caseId, payload) => requestJson(`${basePath(caseId)}/orders`, { method: 'POST', body: JSON.stringify(payload) });
export const deleteCleasOrder = (caseId, relationId) => requestJson(`${basePath(caseId)}/orders/${relationId}`, { method: 'DELETE' });
