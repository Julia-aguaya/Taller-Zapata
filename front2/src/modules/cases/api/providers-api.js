import { requestJson } from '@/shared/api/http-client';

export const searchProviders = (q) => {
  const params = new URLSearchParams({ active: 'true' });
  if (q?.trim()) params.set('q', q.trim());
  return requestJson(`/providers?${params}`);
};

export const createProvider = (payload) => requestJson('/providers', { method: 'POST', body: JSON.stringify(payload) });
