import { requestJson } from '@/shared/api/http-client';

export const getCaseWorkspace = (caseId) => requestJson(`/cases/${caseId}/workspace`);

export const listCases = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page != null) searchParams.set('page', String(params.page));
  if (params.size != null) searchParams.set('size', String(params.size));
  if (params.q) searchParams.set('q', params.q);
  if (params.caseTypeCode) searchParams.set('caseTypeCode', params.caseTypeCode);
  if (params.visibleTramiteState) searchParams.set('visibleTramiteState', params.visibleTramiteState);
  if (params.visibleRepairState) searchParams.set('visibleRepairState', params.visibleRepairState);
  if (params.branchId) searchParams.set('branchId', params.branchId);
  const qs = searchParams.toString();
  return requestJson(`/cases${qs ? `?${qs}` : ''}`);
};
