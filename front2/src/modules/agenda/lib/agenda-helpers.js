export const DEFAULT_TASK_PRIORITY = 'MEDIA';
export const OPEN_TASK_FALLBACK_STATUS = 'PENDIENTE';
export const RESOLVED_TASK_STATUS = 'RESUELTA';

const CANCELLED_TASK_STATUSES = new Set(['CANCELADA', 'CANCELADO', 'CANCELLED', 'CANCELED', 'ANULADA', 'ANULADO']);
const RESOLVED_TASK_STATUSES = new Set(['RESUELTA', 'RESUELTO', 'CERRADA', 'CERRADO', 'COMPLETADA', 'COMPLETADO']);
const IN_PROGRESS_TASK_STATUSES = new Set(['EN_PROGRESO', 'EN_PROCESO', 'EN_CURSO']);
const TASK_DISPLAY_STATUS_META = {
  CANCELLED: { bucket: 'CANCELLED', label: 'Cancelada', variant: 'outline', isActive: false, isVisibleInCalendar: false },
  RESOLVED: { bucket: 'RESOLVED', label: 'Resuelta', variant: 'success', isActive: false, isVisibleInCalendar: true },
  OVERDUE: { bucket: 'OVERDUE', label: 'Vencida', variant: 'destructive', isActive: true, isVisibleInCalendar: true },
  IN_PROGRESS: { bucket: 'IN_PROGRESS', label: 'En curso', variant: 'default', isActive: true, isVisibleInCalendar: true },
  PENDING: { bucket: 'PENDING', label: 'Pendiente', variant: 'secondary', isActive: true, isVisibleInCalendar: true },
};

export const TODAY = () => new Date().toISOString().slice(0, 10);

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SLASH_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

const buildValidatedIsoDate = (year, month, day) => {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);

  if (!Number.isInteger(numericYear) || !Number.isInteger(numericMonth) || !Number.isInteger(numericDay)) {
    return null;
  }

  const candidate = new Date(numericYear, numericMonth - 1, numericDay, 12, 0, 0);
  if (Number.isNaN(candidate.getTime())) return null;
  if (candidate.getFullYear() !== numericYear) return null;
  if (candidate.getMonth() !== numericMonth - 1) return null;
  if (candidate.getDate() !== numericDay) return null;

  return `${String(numericYear).padStart(4, '0')}-${String(numericMonth).padStart(2, '0')}-${String(numericDay).padStart(2, '0')}`;
};

export const normalizeTaskDate = (value) => {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }

  const normalized = String(value).trim();
  if (!normalized) return null;
  if (ISO_DATE_PATTERN.test(normalized)) {
    const [year, month, day] = normalized.split('-');
    return buildValidatedIsoDate(year, month, day);
  }

  const slashMatch = normalized.match(SLASH_DATE_PATTERN);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return buildValidatedIsoDate(year, month, day);
  }

  const isoMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})[T\s]/);
  if (isoMatch) {
    const [year, month, day] = isoMatch[1].split('-');
    return buildValidatedIsoDate(year, month, day);
  }

  return null;
};

export const parseIsoDate = (value) => {
  const normalized = normalizeTaskDate(value);
  if (!normalized) return new Date(Number.NaN);
  return new Date(`${normalized}T12:00:00`);
};

export const getMonthKey = (value = TODAY()) => {
  const date = typeof value === 'string' ? parseIsoDate(value) : value;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const shiftMonth = (value, amount) => {
  const date = typeof value === 'string' ? parseIsoDate(value) : value;
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12, 0, 0).toISOString().slice(0, 10);
};

export const formatMonthLabel = (value) => parseIsoDate(typeof value === 'string' ? value : value.toISOString().slice(0, 10)).toLocaleDateString('es-AR', {
  month: 'long',
  year: 'numeric',
});

export const formatSelectedDateLabel = (value) => parseIsoDate(value).toLocaleDateString('es-AR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  const date = parseIsoDate(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';

  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const diffInDays = (date) => {
  const normalizedDate = normalizeTaskDate(date);
  if (!normalizedDate) return null;
  const today = new Date(`${TODAY()}T00:00:00`);
  const target = new Date(`${normalizedDate}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};

export const matchesSearch = (needle, values) => {
  const normalizedNeedle = needle.trim().toLowerCase();
  if (!normalizedNeedle) return true;

  return values.some((value) => String(value || '').toLowerCase().includes(normalizedNeedle));
};

export const normalizeTaskStatusCode = (code) => String(code || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toUpperCase()
  .replace(/[\s-]+/g, '_');

export const isCancelledTaskStatus = (code) => CANCELLED_TASK_STATUSES.has(normalizeTaskStatusCode(code));

export const isResolvedTaskStatus = (code) => RESOLVED_TASK_STATUSES.has(normalizeTaskStatusCode(code));

export const isInProgressTaskStatus = (code) => IN_PROGRESS_TASK_STATUSES.has(normalizeTaskStatusCode(code));

export const getTaskDisplayStatus = (task) => {
  if (task?.displayStatus?.bucket && TASK_DISPLAY_STATUS_META[task.displayStatus.bucket]) {
    return task.displayStatus;
  }

  if (isCancelledTaskStatus(task?.statusCode)) return TASK_DISPLAY_STATUS_META.CANCELLED;
  if (isResolvedTaskStatus(task?.statusCode)) return TASK_DISPLAY_STATUS_META.RESOLVED;

  const dueDays = diffInDays(task?.dueDate);
  if (dueDays != null && dueDays < 0) return TASK_DISPLAY_STATUS_META.OVERDUE;
  if (isInProgressTaskStatus(task?.statusCode)) return TASK_DISPLAY_STATUS_META.IN_PROGRESS;
  return TASK_DISPLAY_STATUS_META.PENDING;
};

export const getTaskStatusLabel = (statusCode, options = []) => {
  const normalizedStatusCode = normalizeTaskStatusCode(statusCode);
  const matchedOption = options.find((option) => normalizeTaskStatusCode(option.value) === normalizedStatusCode);

  if (matchedOption?.label) return matchedOption.label;
  if (isCancelledTaskStatus(statusCode)) return 'Cancelada';
  if (isResolvedTaskStatus(statusCode)) return 'Resuelta';
  if (isInProgressTaskStatus(statusCode)) return 'En curso';
  if (normalizedStatusCode === 'PENDIENTE') return 'Pendiente';
  return statusCode || OPEN_TASK_FALLBACK_STATUS;
};

export const resolveTaskBucket = (task) => getTaskDisplayStatus(task).bucket;

export const getTaskBucketMeta = (bucket) => TASK_DISPLAY_STATUS_META[bucket] || TASK_DISPLAY_STATUS_META.PENDING;

export const getTaskPriorityVariant = (code) => {
  if (code === 'ALTA') return 'destructive';
  if (code === 'MEDIA') return 'secondary';
  return 'outline';
};

export const getTaskStatusVariant = (code) => {
  if (isCancelledTaskStatus(code)) return 'outline';
  if (isResolvedTaskStatus(code)) return 'success';
  if (isInProgressTaskStatus(code)) return 'default';
  return 'outline';
};

export const getTaskDueVariant = (task) => {
  const bucket = getTaskDisplayStatus(task).bucket;
  if (bucket === 'CANCELLED') return 'outline';
  if (bucket === 'OVERDUE') return 'destructive';
  if (bucket === 'PENDING' && diffInDays(task.dueDate) === 0) return 'default';
  return 'outline';
};

export const formatTaskDueDate = (value) => {
  const task = value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  const dueDate = task ? task.dueDate : value;

  if (task && getTaskDisplayStatus(task).bucket === 'CANCELLED') {
    return dueDate ? formatDate(dueDate) : 'Sin vencimiento';
  }

  if (!dueDate) return 'Sin vencimiento';

  const days = diffInDays(dueDate);
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence manana';
  if (days != null && days > 1) return `Vence en ${days} dias`;
  if (days != null && days < 0) return `Vencio hace ${Math.abs(days)} dias`;
  return formatDate(dueDate);
};

export const getTaskScopeLabel = (task) => {
  if (task.originSubtabCode === 'AGENDA') return 'Agenda';
  if (task.originSubtabCode) return task.originSubtabCode.replaceAll('_', ' ');
  if (task.originModuleCode) return task.originModuleCode.replaceAll('_', ' ');
  return 'Operacion';
};

export const getTaskAssigneeLabel = (task, currentUserId) => {
  const assignedUserId = Number(task.assignedUserId || 0);
  if (!assignedUserId) return 'Sin responsable';
  if (currentUserId && assignedUserId === currentUserId) return 'Mi usuario';
  return `Usuario ${assignedUserId}`;
};

export const sortTasksByUrgency = (items) => [...items].sort((left, right) => {
  const urgencyOrder = { OVERDUE: 0, IN_PROGRESS: 1, PENDING: 2, RESOLVED: 3, CANCELLED: 4 };
  const leftBucket = getTaskDisplayStatus(left).bucket;
  const rightBucket = getTaskDisplayStatus(right).bucket;
  if (leftBucket !== rightBucket) return urgencyOrder[leftBucket] - urgencyOrder[rightBucket];

  const leftDate = left.dueDate || '9999-12-31';
  const rightDate = right.dueDate || '9999-12-31';
  return leftDate.localeCompare(rightDate) || String(left.title || '').localeCompare(String(right.title || ''));
});

export const sortTasksByDueDate = (items) => [...items].sort((left, right) => {
  const leftDate = normalizeTaskDate(left.dueDate) || '9999-12-31';
  const rightDate = normalizeTaskDate(right.dueDate) || '9999-12-31';

  return leftDate.localeCompare(rightDate) || String(left.title || '').localeCompare(String(right.title || ''));
});

export const buildCalendarCells = (tasks, monthValue = TODAY()) => {
  const todayIso = TODAY();
  const monthReference = typeof monthValue === 'string' ? parseIsoDate(monthValue) : monthValue;
  const monthStart = new Date(monthReference.getFullYear(), monthReference.getMonth(), 1, 12, 0, 0);
  const startDay = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - startDay);
  const totalCells = startDay + new Date(monthReference.getFullYear(), monthReference.getMonth() + 1, 0).getDate() > 35 ? 42 : 35;

  return Array.from({ length: totalCells }, (_, index) => {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);
    const iso = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    const dayTasks = tasks.filter((task) => normalizeTaskDate(task.dueDate) === iso && getTaskDisplayStatus(task).isVisibleInCalendar);
    const hasOverdue = dayTasks.some((task) => getTaskDisplayStatus(task).bucket === 'OVERDUE');
    const hasInProgress = dayTasks.some((task) => getTaskDisplayStatus(task).bucket === 'IN_PROGRESS');

    return {
      iso,
      date: current,
      inCurrentMonth: current.getMonth() === monthReference.getMonth(),
      isToday: iso === todayIso,
      isWeekend: current.getDay() === 0 || current.getDay() === 6,
      tasks: dayTasks,
      tone: hasOverdue ? 'destructive' : hasInProgress ? 'default' : 'secondary',
    };
  });
};
