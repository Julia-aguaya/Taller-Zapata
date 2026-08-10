import { requestJson } from '@/shared/api/http-client';

const query = (path, q, active) => {
  const params = new URLSearchParams();
  if (q?.trim()) params.set('q', q.trim());
  if (active != null) params.set('active', String(active));
  const suffix = params.toString();
  return requestJson(`${path}${suffix ? `?${suffix}` : ''}`);
};

const resource = (path) => ({
  list: (q) => query(path, q),
  get: (id) => requestJson(`${path}/${id}`),
  create: (payload) => requestJson(path, { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => requestJson(`${path}/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deactivate: (id) => requestJson(`${path}/${id}/deactivate`, { method: 'POST' }),
});

export const referrersApi = resource('/referenciadores');
export const providersApi = resource('/providers');
export const insuranceCompaniesApi = resource('/insurance/companies');

export const listInsuranceCompanyContacts = (companyId) => requestJson(`/insurance/companies/${companyId}/contacts`);
export const createInsuranceCompanyContact = (companyId, payload) => requestJson(`/insurance/companies/${companyId}/contacts`, { method: 'POST', body: JSON.stringify(payload) });
export const deleteInsuranceCompanyContact = (companyId, contactId) => requestJson(`/insurance/companies/${companyId}/contacts/${contactId}`, { method: 'DELETE' });
