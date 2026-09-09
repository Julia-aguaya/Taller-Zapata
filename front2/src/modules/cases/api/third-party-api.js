import { requestJson } from '@/shared/api/http-client';

const casePath = (caseId) => `/cases/${caseId}`;

export const getThirdParty = (caseId) => requestJson(`${casePath(caseId)}/third-party`);
export const saveThirdParty = (caseId, payload) => requestJson(`${casePath(caseId)}/third-party`, { method: 'PUT', body: JSON.stringify(payload) });
export const getLegalCase = (caseId) => requestJson(`${casePath(caseId)}/legal`);
export const saveLegalCase = (caseId, payload) => requestJson(`${casePath(caseId)}/legal`, { method: 'PUT', body: JSON.stringify(payload) });
export const getLegalNews = (caseId) => requestJson(`${casePath(caseId)}/legal-news`);
export const createLegalNews = (caseId, payload) => requestJson(`${casePath(caseId)}/legal-news`, { method: 'POST', body: JSON.stringify(payload) });
export const getLegalExpenses = (caseId) => requestJson(`${casePath(caseId)}/legal-expenses`);
export const createLegalExpense = (caseId, payload) => requestJson(`${casePath(caseId)}/legal-expenses`, { method: 'POST', body: JSON.stringify(payload) });
export const getLegalInjuredParties = (caseId) => requestJson(`${casePath(caseId)}/legal/lesionados`);
export const createLegalInjuredParty = (caseId, payload) => requestJson(`${casePath(caseId)}/legal/lesionados`, { method: 'POST', body: JSON.stringify(payload) });
export const getCasePersons = (caseId) => requestJson(`${casePath(caseId)}/persons`);
export const addCasePerson = (caseId, payload) => requestJson(`${casePath(caseId)}/persons`, { method: 'POST', body: JSON.stringify(payload) });
