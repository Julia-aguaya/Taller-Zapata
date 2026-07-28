const EMPTY_FILTER_VALUE = '';

export const EMPTY_CASE_FILTERS = {
  q: EMPTY_FILTER_VALUE,
  folderStatus: EMPTY_FILTER_VALUE,
  currentCaseStateCode: EMPTY_FILTER_VALUE,
  currentRepairStateCode: EMPTY_FILTER_VALUE,
  branchId: EMPTY_FILTER_VALUE,
  openedFrom: EMPTY_FILTER_VALUE,
  openedTo: EMPTY_FILTER_VALUE,
  paidFrom: EMPTY_FILTER_VALUE,
  paidTo: EMPTY_FILTER_VALUE,
  caseTypeCode: EMPTY_FILTER_VALUE,
  opinionCode: EMPTY_FILTER_VALUE,
  managerCode: EMPTY_FILTER_VALUE,
  visibleTramiteState: EMPTY_FILTER_VALUE,
  visibleRepairState: EMPTY_FILTER_VALUE,
  paymentStateCode: EMPTY_FILTER_VALUE,
  hasPendingTasks: EMPTY_FILTER_VALUE,
  pendingTaskAssignedUserId: EMPTY_FILTER_VALUE,
};

export const MAIN_FILTER_KEYS = [
  'q',
  'folderStatus',
  'visibleTramiteState',
  'visibleRepairState',
];

export const ADVANCED_FILTER_KEYS = [
  'branchId',
  'openedFrom',
  'openedTo',
  'paidFrom',
  'paidTo',
  'caseTypeCode',
  'opinionCode',
  'managerCode',
  'paymentStateCode',
  'hasPendingTasks',
  'pendingTaskAssignedUserId',
];

export const FILTER_LABELS = {
  q: 'Búsqueda',
  folderStatus: 'Estado de carpeta',
  currentCaseStateCode: 'Estado interno del trámite',
  currentRepairStateCode: 'Estado interno de reparación',
  branchId: 'Sucursal',
  openedFrom: 'Alta desde',
  openedTo: 'Alta hasta',
  paidFrom: 'Pago desde',
  paidTo: 'Pago hasta',
  caseTypeCode: 'Trámite',
  opinionCode: 'Dictamen',
  managerCode: 'Gestor',
  visibleTramiteState: 'Estado del trámite',
  visibleRepairState: 'Estado de reparación',
  paymentStateCode: 'Estado de pago',
  hasPendingTasks: 'Tareas pendientes',
  pendingTaskAssignedUserId: 'Responsable',
};

const FOLDER_STATUS_KEYS = ['ABIERTA', 'CERRADA', 'ARCHIVADA'];

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function buildSearchHaystack(item) {
  return normalizeText([
    item?.folderCode,
    item?.principalCustomerName,
    item?.principalVehiclePlate,
    item?.orderNumber,
  ].filter(Boolean).join(' '));
}

export function formatCodeLabel(value, fallback = '-') {
  if (!value) return fallback;

  return String(value)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(' ');
}

export function getFolderStatusCode(item) {
  if (item?.archivedAt) return 'ARCHIVADA';
  if (item?.closedAt) return 'CERRADA';
  return 'ABIERTA';
}

function getComparableDate(value) {
  return String(value || '').slice(0, 10);
}

function isResolvedTask(task) {
  if (!task) return false;
  if (task.resolved === true) return true;
  return ['RESUELTA', 'RESUELTO', 'CANCELADA', 'CANCELADO'].includes(String(task.statusCode || '').trim().toUpperCase());
}

export function buildPendingTaskIndex(pendingTasks = []) {
  return pendingTasks.reduce((accumulator, task) => {
    if (!task || isResolvedTask(task) || task.caseId == null) {
      return accumulator;
    }

    const caseKey = String(task.caseId);
    const current = accumulator.get(caseKey) || {
      hasPendingTasks: false,
      assignedUserIds: new Set(),
    };

    current.hasPendingTasks = true;
    if (task.assignedUserId != null && String(task.assignedUserId).trim()) {
      current.assignedUserIds.add(String(task.assignedUserId).trim());
    }

    accumulator.set(caseKey, current);
    return accumulator;
  }, new Map());
}

function getUniqueOptions(items, resolver, formatter = formatCodeLabel) {
  const options = new Map();

  items.forEach((item) => {
    const resolved = resolver(item);
    if (!resolved || !String(resolved.value || '').trim()) {
      return;
    }

    const value = String(resolved.value).trim();
    if (!options.has(value)) {
      options.set(value, {
        value,
        label: String(resolved.label || formatter(value, value)).trim(),
      });
    }
  });

  return Array.from(options.values()).sort((left, right) => left.label.localeCompare(right.label, 'es'));
}

function resolveManagerOption(item) {
  const code = item?.manager?.code || item?.managerCode || item?.manager?.id;
  const label = item?.manager?.label || item?.managerLabel || item?.manager?.name;

  if (!code || !label) {
    return null;
  }

  return { value: code, label };
}

function resolvePendingTaskAssigneeOption(task) {
  const value = task?.assignedUserId;
  const label = task?.assignedUser?.displayName || task?.assignedUserDisplayName || task?.assignedUserName;

  if (value == null || !String(label || '').trim()) {
    return null;
  }

  return {
    value,
    label,
  };
}

function resolveCaseTypeOptionFromCatalog(item) {
  const value = item?.code || item?.caseTypeCode || item?.id;
  const label = item?.name || item?.label || item?.description || item?.caseTypeName || item?.caseTypeLabel;

  if (!value) {
    return null;
  }

  return {
    value,
    label: label || formatCodeLabel(value, value),
  };
}

function resolveCaseTypeOptionFromItem(item) {
  const value = item?.caseTypeCode || item?.caseType?.code || item?.caseType;
  const label = item?.caseTypeLabel || item?.caseTypeName || item?.caseType?.label || item?.caseType?.name;

  if (!value) {
    return null;
  }

  return {
    value,
    label: label || formatCodeLabel(value, value),
  };
}

function buildMergedCaseTypeOptions(items = [], caseTypes = []) {
  const options = new Map();

  caseTypes.forEach((item) => {
    const resolved = resolveCaseTypeOptionFromCatalog(item);
    if (!resolved) return;
    options.set(String(resolved.value).trim(), {
      value: String(resolved.value).trim(),
      label: String(resolved.label || formatCodeLabel(resolved.value, resolved.value)).trim(),
    });
  });

  getUniqueOptions(items, resolveCaseTypeOptionFromItem).forEach((option) => {
    if (!options.has(option.value)) {
      options.set(option.value, option);
    }
  });

  return Array.from(options.values()).sort((left, right) => left.label.localeCompare(right.label, 'es'));
}

export function buildFolderStatusOptions(items = []) {
  const available = new Set(items.map(getFolderStatusCode));

  return FOLDER_STATUS_KEYS
    .filter((value) => available.has(value))
    .map((value) => ({ value, label: formatCodeLabel(value, value) }));
}

export function buildCaseFilterOptions({ items = [], caseTypes = [], insuranceCatalogs = null, pendingTasks = [] }) {
  return {
    folderStatuses: buildFolderStatusOptions(items),
    currentCaseStates: getUniqueOptions(items, (item) => ({ value: item?.currentCaseStateCode })),
    currentRepairStates: getUniqueOptions(items, (item) => ({ value: item?.currentRepairStateCode })),
    branches: getUniqueOptions(items, (item) => ({
      value: item?.branchId,
      label: item?.branchCode || (item?.branchId ? `Sucursal ${item.branchId}` : ''),
    })),
    caseTypes: buildMergedCaseTypeOptions(items, Array.isArray(caseTypes) ? caseTypes : []),
    opinions: Array.isArray(insuranceCatalogs?.opinionCodes)
      ? insuranceCatalogs.opinionCodes
        .filter((item) => item?.code)
        .map((item) => ({ value: item.code, label: item.name || item.code }))
        .sort((left, right) => left.label.localeCompare(right.label, 'es'))
      : [],
    managers: getUniqueOptions(items, resolveManagerOption, (_, fallback) => fallback),
    visibleTramiteStates: getUniqueOptions(items, (item) => ({
      value: item?.visibleTramiteState?.code,
      label: item?.visibleTramiteState?.label,
    })),
    visibleRepairStates: getUniqueOptions(items, (item) => ({
      value: item?.visibleRepairState?.code,
      label: item?.visibleRepairState?.label,
    })),
    paymentStates: Array.isArray(insuranceCatalogs?.paymentStatusCodes) && insuranceCatalogs.paymentStatusCodes.length > 0
      ? insuranceCatalogs.paymentStatusCodes
        .filter((item) => item?.code)
        .map((item) => ({ value: item.code, label: item.name || item.code }))
        .sort((left, right) => left.label.localeCompare(right.label, 'es'))
      : getUniqueOptions(items, (item) => ({ value: item?.currentPaymentStateCode })),
    pendingTaskAssignees: getUniqueOptions(
      pendingTasks.filter((task) => !isResolvedTask(task) && task?.assignedUserId != null),
      resolvePendingTaskAssigneeOption,
      (_, fallback) => fallback,
    ),
  };
}

function matchesVisibleState(state, expectedValue) {
  const normalizedExpectedValue = normalizeText(expectedValue);
  if (!normalizedExpectedValue) {
    return true;
  }

  return [state?.code, state?.label].some((candidate) => normalizeText(candidate) === normalizedExpectedValue);
}

function matchesPendingTasks(item, filters, pendingTaskIndex) {
  const taskState = pendingTaskIndex.get(String(item?.id || '')) || {
    hasPendingTasks: false,
    assignedUserIds: new Set(),
  };

  const hasPendingTasksFilter = normalizeBooleanFilter(filters.hasPendingTasks);
  if (typeof hasPendingTasksFilter === 'boolean' && taskState.hasPendingTasks !== hasPendingTasksFilter) {
    return false;
  }

  if (!filters.pendingTaskAssignedUserId) {
    return true;
  }

  return taskState.assignedUserIds.has(String(filters.pendingTaskAssignedUserId));
}

function normalizeBooleanFilter(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export function sanitizeFilters(filters = {}) {
  const next = {
    ...EMPTY_CASE_FILTERS,
    ...filters,
  };

  Object.keys(next).forEach((key) => {
    next[key] = String(next[key] || '').trim();
  });

  if (next.pendingTaskAssignedUserId) {
    next.hasPendingTasks = 'true';
  }

  return next;
}

export function validateCaseFilters(filters = {}) {
  const next = sanitizeFilters(filters);

  if (next.openedFrom && next.openedTo && next.openedFrom > next.openedTo) {
    return 'El rango de alta es invalido: la fecha desde no puede ser mayor que la fecha hasta.';
  }

  if (next.paidFrom && next.paidTo && next.paidFrom > next.paidTo) {
    return 'El rango de pago es invalido: la fecha desde no puede ser mayor que la fecha hasta.';
  }

  return '';
}

export function buildBackendCaseFilters(filters = {}) {
  const next = sanitizeFilters(filters);
  const payload = {};

  [
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
  ].forEach((field) => {
    if (next[field]) {
      payload[field] = next[field];
    }
  });

  if (/^\d+$/.test(next.branchId)) {
    payload.branchId = Number.parseInt(next.branchId, 10);
  }

  const hasPendingTasks = normalizeBooleanFilter(next.hasPendingTasks);
  if (typeof hasPendingTasks === 'boolean') {
    payload.hasPendingTasks = hasPendingTasks;
  }

  if (/^\d+$/.test(next.pendingTaskAssignedUserId)) {
    payload.pendingTaskAssignedUserId = Number.parseInt(next.pendingTaskAssignedUserId, 10);
    payload.hasPendingTasks = true;
  }

  return payload;
}

export function applyLocalCaseFilters(items = [], filters = {}, options = {}) {
  const next = sanitizeFilters(filters);
  const pendingTaskIndex = options.pendingTaskIndex ?? buildPendingTaskIndex(options.pendingTasks ?? []);

  return items.filter((item) => {
    if (next.q && !buildSearchHaystack(item).includes(normalizeText(next.q))) {
      return false;
    }

    if (next.folderStatus && getFolderStatusCode(item) !== next.folderStatus) {
      return false;
    }

    if (next.currentCaseStateCode && normalizeText(item?.currentCaseStateCode) !== normalizeText(next.currentCaseStateCode)) {
      return false;
    }

    if (next.currentRepairStateCode && normalizeText(item?.currentRepairStateCode) !== normalizeText(next.currentRepairStateCode)) {
      return false;
    }

    if (next.branchId && String(item?.branchId || '') !== next.branchId) {
      return false;
    }

    if (next.caseTypeCode && normalizeText(item?.caseTypeCode) !== normalizeText(next.caseTypeCode)) {
      return false;
    }

    if (!matchesVisibleState(item?.visibleTramiteState, next.visibleTramiteState)) {
      return false;
    }

    if (!matchesVisibleState(item?.visibleRepairState, next.visibleRepairState)) {
      return false;
    }

    if (next.paymentStateCode && normalizeText(item?.currentPaymentStateCode) !== normalizeText(next.paymentStateCode)) {
      return false;
    }

    if (!matchesPendingTasks(item, next, pendingTaskIndex)) {
      return false;
    }

    return true;
  });
}

export function countActiveFilters(filters = {}, keys = Object.keys(EMPTY_CASE_FILTERS)) {
  const next = sanitizeFilters(filters);
  return keys.filter((key) => Boolean(next[key])).length;
}

function buildOptionMap(options = []) {
  return options.reduce((accumulator, option) => {
    accumulator[String(option.value)] = option.label;
    return accumulator;
  }, {});
}

export function buildFilterMaps(options) {
  return {
    folderStatus: buildOptionMap(options.folderStatuses),
    currentCaseStateCode: buildOptionMap(options.currentCaseStates),
    currentRepairStateCode: buildOptionMap(options.currentRepairStates),
    branchId: buildOptionMap(options.branches),
    caseTypeCode: buildOptionMap(options.caseTypes),
    opinionCode: buildOptionMap(options.opinions),
    managerCode: buildOptionMap(options.managers),
    visibleTramiteState: buildOptionMap(options.visibleTramiteStates),
    visibleRepairState: buildOptionMap(options.visibleRepairStates),
    paymentStateCode: buildOptionMap(options.paymentStates),
    hasPendingTasks: {
      true: 'Solo con tareas pendientes',
      false: 'Solo sin tareas pendientes',
    },
    pendingTaskAssignedUserId: buildOptionMap(options.pendingTaskAssignees),
  };
}

export function buildFilterChips(filters = {}, maps = {}) {
  const next = sanitizeFilters(filters);

  return Object.entries(next).reduce((accumulator, [key, value]) => {
    if (!value) return accumulator;

    const label = FILTER_LABELS[key] || key;
    const resolvedValue = maps[key]?.[value] || value;
    accumulator.push({
      key,
      label,
      value,
      text: `${label}: ${resolvedValue}`,
    });
    return accumulator;
  }, []);
}

export function clearFilter(filters = {}, key) {
  return sanitizeFilters({
    ...filters,
    [key]: EMPTY_FILTER_VALUE,
  });
}

export function getAdvancedFilterCount(filters = {}) {
  return countActiveFilters(filters, ADVANCED_FILTER_KEYS);
}

export function getRenderedResultsLabel(count, totalCount, hasActiveFilters = false) {
  const hasReliableTotal = Number.isFinite(totalCount);
  const safeTotal = hasReliableTotal ? totalCount : count;
  if (!hasActiveFilters) {
    return `${safeTotal} carpeta${safeTotal === 1 ? '' : 's'}`;
  }

  if (!hasReliableTotal) {
    return `${count} carpeta${count === 1 ? '' : 's'}`;
  }

  return `${count} de ${safeTotal} carpeta${safeTotal === 1 ? '' : 's'}`;
}

export function getCaseCreatedDate(item) {
  return getComparableDate(item?.createdAt);
}

export function getCasePaidDate(item) {
  return getComparableDate(item?.paidAt || item?.paymentDate || item?.lastPaymentDate);
}
