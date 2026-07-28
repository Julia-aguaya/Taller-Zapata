import { requestJson } from '@/shared/api/http-client';

export const getCaseWorkspace = (caseId) => requestJson(`/cases/${caseId}/workspace`);

export const listCases = (params = {}) => {
  const searchParams = new URLSearchParams();
  const stringFilters = [
    'q',
    'folderStatus',
    'openedFrom',
    'openedTo',
    'paidFrom',
    'paidTo',
    'caseTypeCode',
    'opinionCode',
    'managerCode',
    'visibleTramiteState',
    'visibleRepairState',
    'paymentStateCode',
  ];

  if (params.page != null) searchParams.set('page', String(params.page));
  if (params.size != null) searchParams.set('size', String(params.size));
  stringFilters.forEach((key) => {
    if (params[key]) searchParams.set(key, params[key]);
  });
  if (params.branchId) searchParams.set('branchId', params.branchId);
  if (typeof params.hasPendingTasks === 'boolean') searchParams.set('hasPendingTasks', String(params.hasPendingTasks));
  if (params.pendingTaskAssignedUserId != null) searchParams.set('pendingTaskAssignedUserId', String(params.pendingTaskAssignedUserId));
  const qs = searchParams.toString();
  return requestJson(`/cases${qs ? `?${qs}` : ''}`);
};
