import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, TODO_RIESGO_ASSIGNABLE_USERS } from '../../gestion/constants/gestionOptions';

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function normalizeAgendaTask(task = {}, fallback = {}) {
  const rawStatus = String(task.status || '').toLowerCase();
  const resolved = rawStatus === 'resuelta' || Boolean(task.resolved);
  const status = resolved ? 'resuelta' : rawStatus === 'en curso' ? 'en curso' : 'pendiente';

  return {
    ...task,
    description: task.description || '',
    scheduledAt: task.scheduledAt || '',
    assignee: task.assignee || TODO_RIESGO_ASSIGNABLE_USERS[0],
    priority: TASK_PRIORITY_OPTIONS.includes(task.priority) ? task.priority : 'media',
    status,
    resolved,
    sourceArea: task.sourceArea || fallback.sourceArea || 'Gestión del trámite',
    sourceLabel: task.sourceLabel || fallback.sourceLabel || task.sourceArea || fallback.sourceArea || 'Gestión del trámite',
    relatedTab: task.relatedTab || fallback.relatedTab || 'tramite',
    relatedSubtab: task.relatedSubtab || fallback.relatedSubtab || '',
    linkedCaseId: task.linkedCaseId || fallback.linkedCaseId || '',
    linkedCaseCode: task.linkedCaseCode || fallback.linkedCaseCode || '',
    createdAt: task.createdAt || fallback.createdAt || '',
    resolvedAt: resolved ? task.resolvedAt || fallback.resolvedAt || '' : '',
  };
}

export function isAgendaTaskResolved(task) {
  return normalizeAgendaTask(task).resolved;
}

export function setAgendaTaskResolved(task, resolved) {
  const normalized = normalizeAgendaTask(task);
  task.description = normalized.description;
  task.priority = normalized.priority;
  task.sourceArea = normalized.sourceArea;
  task.sourceLabel = normalized.sourceLabel;
  task.relatedTab = normalized.relatedTab;
  task.relatedSubtab = normalized.relatedSubtab;
  task.linkedCaseId = normalized.linkedCaseId;
  task.linkedCaseCode = normalized.linkedCaseCode;
  task.createdAt = normalized.createdAt;
  task.resolved = resolved;
  task.status = resolved ? 'resuelta' : normalized.status === 'resuelta' ? 'pendiente' : normalized.status;
  task.resolvedAt = resolved ? todayIso() : '';
}

export function setAgendaTaskStatus(task, status) {
  const normalizedStatus = TASK_STATUS_OPTIONS.includes(status) ? status : 'pendiente';
  task.status = normalizedStatus;
  task.resolved = normalizedStatus === 'resuelta';
  task.resolvedAt = normalizedStatus === 'resuelta' ? (task.resolvedAt || todayIso()) : '';
}

export function getAgendaTaskDueMeta(date) {
  if (!date) {
    return { bucket: 'pending', label: 'Sin fecha límite', tone: 'info', sortValue: Number.POSITIVE_INFINITY };
  }

  const today = new Date(`${todayIso()}T12:00:00`);
  const due = new Date(`${date}T12:00:00`);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) {
    return { bucket: 'overdue', label: `Vencida hace ${Math.abs(diffDays)} día(s)`, tone: 'danger', sortValue: diffDays };
  }

  if (diffDays === 0) {
    return { bucket: 'upcoming', label: 'Vence hoy', tone: 'danger', sortValue: diffDays };
  }

  if (diffDays <= 2) {
    return { bucket: 'upcoming', label: `Vence en ${diffDays} día(s)`, tone: 'warning', sortValue: diffDays };
  }

  return { bucket: 'pending', label: `Vence en ${diffDays} día(s)`, tone: 'success', sortValue: diffDays };
}

export function getAgendaStatusLabel(status) {
  if (status === 'en curso') return 'En curso';
  if (status === 'resuelta') return 'Resuelta';
  return 'Pendiente';
}

export function getAgendaPriorityLabel(priority) {
  if (priority === 'alta') return 'Alta';
  if (priority === 'baja') return 'Baja';
  return 'Media';
}

export function getAgendaPriorityTone(priority) {
  if (priority === 'alta') return 'danger';
  if (priority === 'baja') return 'success';
  return 'info';
}
