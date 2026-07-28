import { requestJson } from '@/shared/api/http-client';

export const listOperationalTasks = (params = {}) => {
  const searchParams = new URLSearchParams();

  if (params.page != null) searchParams.set('page', String(params.page));
  if (params.size != null) searchParams.set('size', String(params.size));
  if (params.caseId != null) searchParams.set('caseId', String(params.caseId));
  if (params.assignedUserId != null) searchParams.set('assignedUserId', String(params.assignedUserId));
  if (params.statusCode) searchParams.set('statusCode', params.statusCode);
  if (params.organizationId != null) searchParams.set('organizationId', String(params.organizationId));
  if (params.branchId != null) searchParams.set('branchId', String(params.branchId));

  const qs = searchParams.toString();
  return requestJson(`/tasks${qs ? `?${qs}` : ''}`);
};

export const updateOperationalTask = (taskId, payload) => requestJson(`/tasks/${taskId}`, {
  method: 'PUT',
  body: JSON.stringify(payload),
});
