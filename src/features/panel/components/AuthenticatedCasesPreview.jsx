import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CasesList from '../../../components/cases/CasesList';
import CasesMetrics from '../../../components/cases/CasesMetrics';
import CasesToolbar from '../../../components/cases/CasesToolbar';
import StatusBadge from '../../../components/ui/StatusBadge';
import { normalizeLookupText } from '../../cases/lib/caseNormalizers';
import { getCatalogSelectOptions } from '../../cases/lib/caseCatalogHelpers';
import { formatBackendState } from '../../cases/lib/caseFormatters';
import { MANUAL_VISIBLE_STATE_OPTIONS } from '../../cases/lib/backendVisibleStates';
import { getCaseSearchHaystack, getBackendBranchLabel, getBackendStatusTone } from '../../cases/lib/caseFilters';
import { getBackendCaseKey } from '../lib/panelPreviewHelpers';
import AuthenticatedCaseDetail from './AuthenticatedCaseDetail';

const INITIAL_VISIBLE_CASES = 12;
const LOAD_MORE_CASES_STEP = 12;
const EMPTY_ADVANCED_FILTERS = {
  openedFrom: '',
  openedTo: '',
  paidFrom: '',
  paidTo: '',
  caseTypeCode: '',
  opinionCode: '',
  managerCode: '',
  visibleTramiteState: '',
  visibleRepairState: '',
  paymentStateCode: '',
  hasPendingTasks: '',
  pendingTaskAssignedUserId: '',
};
const FILTER_FIELD_LABELS = {
  openedFrom: 'Abierta desde',
  openedTo: 'Abierta hasta',
  paidFrom: 'Pagado desde',
  paidTo: 'Pagado hasta',
  caseTypeCode: 'Tipo',
  opinionCode: 'Dictamen',
  managerCode: 'Responsable',
  visibleTramiteState: 'Visible en trámite',
  visibleRepairState: 'Visible en reparación',
  paymentStateCode: 'Cobro',
  hasPendingTasks: 'Pendientes',
  pendingTaskAssignedUserId: 'Asignado a',
};

function getPriorityWeight(item) {
  const normalized = String(item?.priorityCode || item?.priority || '').trim().toLowerCase();
  if (normalized === 'alta' || normalized === 'high') return 3;
  if (normalized === 'media' || normalized === 'medium') return 2;
  if (normalized === 'baja' || normalized === 'low') return 1;
  return 0;
}

function getActionableScore(item) {
  const stateCode = String(item?.currentCaseStateCode || '').trim().toLowerCase();

  if (/(cerrad|cancelad|finaliz|resuelt)/.test(stateCode)) {
    return -100;
  }

  let score = 0;
  const pendingItemsCount = Number(item?.pendingItemsCount || 0);
  score += Math.min(Math.max(pendingItemsCount, 0), 8) * 20;

  if (item?.nextSuggestedTask) {
    score += 30;
  }

  if (/(esperando_aprobacion|pendient|espera|observad|vencid)/.test(stateCode)) {
    score += 35;
  }

  if (/(en_tramite|en_proceso|activo|gestion)/.test(stateCode)) {
    score += 20;
  }

  score += getPriorityWeight(item) * 25;

  const dueAt = item?.dueAt || item?.dueDate || item?.scheduledAt || '';
  if (dueAt) {
    const dueTime = new Date(dueAt).getTime();
    if (Number.isFinite(dueTime)) {
      const diffDays = Math.floor((dueTime - Date.now()) / 86400000);
      if (diffDays < 0) score += 50;
      else if (diffDays <= 3) score += 35;
      else if (diffDays <= 7) score += 20;
      else if (diffDays <= 14) score += 10;
    }
  }

  return score;
}

function compareCasesByActionability(left, right) {
  const scoreDifference = getActionableScore(right) - getActionableScore(left);
  if (scoreDifference !== 0) return scoreDifference;

  const leftPending = Number(left?.pendingItemsCount || 0);
  const rightPending = Number(right?.pendingItemsCount || 0);
  if (rightPending !== leftPending) return rightPending - leftPending;

  const leftPriority = getPriorityWeight(left);
  const rightPriority = getPriorityWeight(right);
  if (rightPriority !== leftPriority) return rightPriority - leftPriority;

  const leftDue = String(left?.dueAt || left?.dueDate || left?.scheduledAt || '9999-12-31');
  const rightDue = String(right?.dueAt || right?.dueDate || right?.scheduledAt || '9999-12-31');
  if (leftDue !== rightDue) return leftDue.localeCompare(rightDue);

  return String(getBackendCaseKey(left)).localeCompare(String(getBackendCaseKey(right)), 'es');
}

function buildOptionsFromItems(items, fieldPairs, fallbackFormatter = formatBackendState) {
  const options = new Map();

  items.forEach((item) => {
    fieldPairs.forEach(({ valueField, labelField }) => {
      const rawValue = item?.[valueField];
      if (rawValue === null || rawValue === undefined || rawValue === '') {
        return;
      }

      const value = String(rawValue).trim();
      if (!value) {
        return;
      }

      const labelSource = labelField ? item?.[labelField] : '';
      const label = String(labelSource || fallbackFormatter(value, value)).trim();
      if (!options.has(value)) {
        options.set(value, { value, label });
      }
    });
  });

  return Array.from(options.values()).sort((left, right) => left.label.localeCompare(right.label, 'es'));
}

function buildUserIdOptions(items) {
  const options = new Map();

  items.forEach((item) => {
    const rawValue = item?.pendingTaskAssignedUserId ?? item?.assigneeUserId ?? item?.responsibleUserId;
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return;
    }

    const value = String(rawValue).trim();
    if (!value) {
      return;
    }

    const label = item?.pendingTaskAssignedUserName
      || item?.assigneeName
      || item?.responsibleUserName
      || item?.responsibleName
      || item?.managerName
      || `Usuario ${value}`;

    if (!options.has(value)) {
      options.set(value, { value, label: String(label).trim() });
    }
  });

  return Array.from(options.values()).sort((left, right) => left.label.localeCompare(right.label, 'es'));
}

function buildOptionLabelMap(options) {
  return options.reduce((accumulator, option) => {
    accumulator[option.value] = option.label;
    return accumulator;
  }, {});
}

function normalizeCaseTypeCode(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (!normalized) {
    return '';
  }

  if (normalized === 'particular') return 'PARTICULAR';
  if (normalized === 'todo riesgo' || normalized === 'todo_riesgo') return 'TODO_RIESGO';
  if (normalized === 'cleas' || normalized === 'cleas / terceros / franquicia') return 'CLEAS';
  if (normalized === 'reclamo de tercero - taller' || normalized === 'reclamo_taller' || normalized === 'reclamo_terceros_taller') return 'RECLAMO_TERCEROS_TALLER';
  if (normalized === 'reclamo de tercero - abogado' || normalized === 'reclamo_abogado' || normalized === 'reclamo_terceros_abogado') return 'RECLAMO_TERCEROS_ABOGADO';
  if (normalized === 'recupero de franquicia' || normalized === 'recupero_franquicia') return 'RECUPERO_FRANQUICIA';

  return String(value || '').trim().toUpperCase();
}

function buildCaseTypeOptions(items) {
  const options = new Map();

  items.forEach((item) => {
    const value = normalizeCaseTypeCode(item?.caseTypeCode || item?.caseTypeName || item?.caseType || item?.tramiteType);
    if (!value) {
      return;
    }

    const rawLabel = item?.caseTypeName || item?.caseType || item?.tramiteType;
    const label = String(rawLabel || formatBackendState(value, value)).trim();
    if (!options.has(value)) {
      options.set(value, { value, label });
    }
  });

  return Array.from(options.values()).sort((left, right) => left.label.localeCompare(right.label, 'es'));
}

function areAdvancedFiltersEqual(left, right) {
  return Object.keys(EMPTY_ADVANCED_FILTERS).every((field) => String(left?.[field] || '') === String(right?.[field] || ''));
}

function countActiveAdvancedFilters(filters) {
  return Object.values(filters).filter((value) => String(value || '').trim()).length;
}

function buildAdvancedFiltersPayload(filters) {
  const payload = {};
  const stringFields = [
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

  stringFields.forEach((field) => {
    const value = String(filters[field] || '').trim();
    if (value) {
      payload[field] = value;
    }
  });

  if (filters.hasPendingTasks === 'true') {
    payload.hasPendingTasks = true;
  }

  if (filters.hasPendingTasks === 'false') {
    payload.hasPendingTasks = false;
  }

  const pendingTaskAssignedUserId = String(filters.pendingTaskAssignedUserId || '').trim();
  if (/^\d+$/.test(pendingTaskAssignedUserId)) {
    payload.pendingTaskAssignedUserId = Number.parseInt(pendingTaskAssignedUserId, 10);
  }

  return payload;
}

function buildAdvancedFilterPills(filters, labelMaps) {
  return Object.entries(filters).reduce((accumulator, [field, rawValue]) => {
    const value = String(rawValue || '').trim();
    if (!value) {
      return accumulator;
    }

    const resolvedValue = labelMaps[field]?.[value] || value;
    accumulator.push(`${FILTER_FIELD_LABELS[field]}: ${resolvedValue}`);
    return accumulator;
  }, []);
}

function normalizeComparableValue(value) {
  return normalizeLookupText(String(value || '').replace(/[_-]+/g, ' '));
}

function resolveComparableCode(item, fieldNames) {
  const rawValue = fieldNames
    .map((fieldName) => item?.[fieldName])
    .find((value) => value !== null && value !== undefined && String(value).trim());

  return normalizeComparableValue(rawValue);
}

function resolveComparableDate(item, fieldNames) {
  const rawValue = fieldNames
    .map((fieldName) => item?.[fieldName])
    .find((value) => value !== null && value !== undefined && String(value).trim());

  return String(rawValue || '').slice(0, 10);
}

function hasPendingTasks(item) {
  if (typeof item?.hasPendingTasks === 'boolean') {
    return item.hasPendingTasks;
  }

  return Number(item?.pendingItemsCount || 0) > 0 || Boolean(item?.nextSuggestedTask);
}

function matchesAppliedAdvancedFilters(item, filters) {
  const openedFrom = String(filters.openedFrom || '').trim();
  const openedTo = String(filters.openedTo || '').trim();
  const paidFrom = String(filters.paidFrom || '').trim();
  const paidTo = String(filters.paidTo || '').trim();
  const caseTypeCode = normalizeCaseTypeCode(filters.caseTypeCode);
  const opinionCode = normalizeComparableValue(filters.opinionCode);
  const managerCode = normalizeComparableValue(filters.managerCode);
  const visibleTramiteState = normalizeComparableValue(filters.visibleTramiteState);
  const visibleRepairState = normalizeComparableValue(filters.visibleRepairState);
  const paymentStateCode = normalizeComparableValue(filters.paymentStateCode);
  const pendingTaskAssignedUserId = String(filters.pendingTaskAssignedUserId || '').trim();
  const openedAt = resolveComparableDate(item, ['openedAt', 'openedDate', 'openAt', 'createdAt', 'creationDate', 'entryDate']);
  const paidAt = resolveComparableDate(item, ['paidAt', 'paidDate', 'paymentDate', 'lastPaymentDate']);

  if (openedFrom && (!openedAt || openedAt < openedFrom)) {
    return false;
  }

  if (openedTo && (!openedAt || openedAt > openedTo)) {
    return false;
  }

  if (paidFrom && (!paidAt || paidAt < paidFrom)) {
    return false;
  }

  if (paidTo && (!paidAt || paidAt > paidTo)) {
    return false;
  }

  if (caseTypeCode && normalizeCaseTypeCode(item?.caseTypeCode || item?.caseTypeName || item?.caseType || item?.tramiteType) !== caseTypeCode) {
    return false;
  }

  if (opinionCode && resolveComparableCode(item, ['opinionCode', 'opinionName']) !== opinionCode) {
    return false;
  }

  if (managerCode && ![
    resolveComparableCode(item, ['managerCode']),
    resolveComparableCode(item, ['assigneeCode']),
    resolveComparableCode(item, ['assignedToCode']),
  ].includes(managerCode)) {
    return false;
  }

  if (visibleTramiteState && ![
    resolveComparableCode(item, ['visibleTramiteState']),
    normalizeComparableValue(item?.backendVisibleStates?.tramite?.code),
  ].includes(visibleTramiteState)) {
    return false;
  }

  if (visibleRepairState && ![
    resolveComparableCode(item, ['visibleRepairState']),
    normalizeComparableValue(item?.backendVisibleStates?.reparacion?.code),
  ].includes(visibleRepairState)) {
    return false;
  }

  if (paymentStateCode && ![
    resolveComparableCode(item, ['currentPaymentStateCode']),
    resolveComparableCode(item, ['paymentStateCode']),
  ].includes(paymentStateCode)) {
    return false;
  }

  if (filters.hasPendingTasks === 'true' && !hasPendingTasks(item)) {
    return false;
  }

  if (filters.hasPendingTasks === 'false' && hasPendingTasks(item)) {
    return false;
  }

  if (pendingTaskAssignedUserId && ![
    String(item?.pendingTaskAssignedUserId || '').trim(),
    String(item?.assigneeUserId || '').trim(),
    String(item?.responsibleUserId || '').trim(),
  ].includes(pendingTaskAssignedUserId)) {
    return false;
  }

  return true;
}

export default function AuthenticatedCasesPreview({
  detailState,
  documentsCatalogs = null,
  formatDate,
  formatDateTime,
  initialVisibleCases = INITIAL_VISIBLE_CASES,
  insuranceCatalogs = null,
  isSavingDocuments = { upload: false, byId: {} },
  isDownloadingDocument = { byId: {} },
  isPreviewingDocument = { byId: {} },
  loadMoreStep = LOAD_MORE_CASES_STEP,
  onOpenCase,
  onOpenDetail,
  onRefresh,
  onSaveDocument,
  onDownloadDocument,
  onPreviewDocument,
  prioritizeForUser = false,
  showLoadMore = true,
  state,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCaseState, setSelectedCaseState] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [draftAdvancedFilters, setDraftAdvancedFilters] = useState(EMPTY_ADVANCED_FILTERS);
  const [appliedAdvancedFilters, setAppliedAdvancedFilters] = useState(EMPTY_ADVANCED_FILTERS);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [visibleCasesCount, setVisibleCasesCount] = useState(initialVisibleCases);
  const onRefreshRef = useRef(onRefresh);
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const caseStateOptions = useMemo(() => {
    const values = Array.from(new Set(
      state.items
        .map((item) => formatBackendState(item.currentCaseStateCode, 'Sin dato'))
        .filter(Boolean),
    ));

    return values.sort((left, right) => left.localeCompare(right, 'es'));
  }, [state.items]);
  const branchOptions = useMemo(() => {
    const values = Array.from(new Set(
      state.items
        .map((item) => getBackendBranchLabel(item))
        .filter(Boolean),
    ));

    return values.sort((left, right) => left.localeCompare(right, 'es'));
  }, [state.items]);
  const caseTypeOptions = useMemo(() => buildCaseTypeOptions(state.items), [state.items]);
  const paymentStateOptions = useMemo(() => {
    const catalogOptions = getCatalogSelectOptions(insuranceCatalogs, 'paymentStatusCodes');
    if (catalogOptions.length) {
      return catalogOptions;
    }

    return buildOptionsFromItems(state.items, [
      { valueField: 'currentPaymentStateCode' },
      { valueField: 'paymentStateCode' },
    ]);
  }, [insuranceCatalogs, state.items]);
  const opinionOptions = useMemo(() => {
    const catalogOptions = getCatalogSelectOptions(insuranceCatalogs, 'opinionCodes');
    if (catalogOptions.length) {
      return catalogOptions;
    }

    return buildOptionsFromItems(state.items, [
      { valueField: 'opinionCode', labelField: 'opinionName' },
    ]);
  }, [insuranceCatalogs, state.items]);
  const managerOptions = useMemo(() => buildOptionsFromItems(state.items, [
    { valueField: 'managerCode', labelField: 'managerName' },
    { valueField: 'assigneeCode', labelField: 'assigneeName' },
    { valueField: 'assignedToCode', labelField: 'assignedToName' },
  ], (_, fallback) => fallback), [state.items]);
  const pendingTaskAssigneeOptions = useMemo(() => buildUserIdOptions(state.items), [state.items]);
  const visibleTramiteStateOptions = useMemo(() => MANUAL_VISIBLE_STATE_OPTIONS.tramite
    .filter((option) => option.code)
    .map((option) => ({ value: option.code, label: option.label })), []);
  const visibleRepairStateOptions = useMemo(() => MANUAL_VISIBLE_STATE_OPTIONS.reparacion
    .filter((option) => option.code)
    .map((option) => ({ value: option.code, label: option.label })), []);
  const advancedFilterLabelMaps = useMemo(() => ({
    caseTypeCode: buildOptionLabelMap(caseTypeOptions),
    opinionCode: buildOptionLabelMap(opinionOptions),
    managerCode: buildOptionLabelMap(managerOptions),
    visibleTramiteState: buildOptionLabelMap(visibleTramiteStateOptions),
    visibleRepairState: buildOptionLabelMap(visibleRepairStateOptions),
    paymentStateCode: buildOptionLabelMap(paymentStateOptions),
    hasPendingTasks: {
      true: 'Solo con pendientes',
      false: 'Solo sin pendientes',
    },
    pendingTaskAssignedUserId: buildOptionLabelMap(pendingTaskAssigneeOptions),
  }), [
    caseTypeOptions,
    opinionOptions,
    managerOptions,
    paymentStateOptions,
    pendingTaskAssigneeOptions,
    visibleRepairStateOptions,
    visibleTramiteStateOptions,
  ]);
  const activeAdvancedFiltersCount = useMemo(() => countActiveAdvancedFilters(appliedAdvancedFilters), [appliedAdvancedFilters]);
  const draftAdvancedFiltersCount = useMemo(() => countActiveAdvancedFilters(draftAdvancedFilters), [draftAdvancedFilters]);
  const activeAdvancedFilterPills = useMemo(
    () => buildAdvancedFilterPills(appliedAdvancedFilters, advancedFilterLabelMaps),
    [advancedFilterLabelMaps, appliedAdvancedFilters],
  );
  const hasPendingAdvancedFilterChanges = useMemo(
    () => !areAdvancedFiltersEqual(draftAdvancedFilters, appliedAdvancedFilters),
    [appliedAdvancedFilters, draftAdvancedFilters],
  );
  const advancedFilteredItems = useMemo(
    () => state.items.filter((item) => matchesAppliedAdvancedFilters(item, appliedAdvancedFilters)),
    [appliedAdvancedFilters, state.items],
  );
  const filteredItems = useMemo(() => {
    return advancedFilteredItems.filter((item) => {
      const matchesSearch = !normalizedSearchTerm || getCaseSearchHaystack(item).includes(normalizedSearchTerm);
      const caseState = formatBackendState(item.currentCaseStateCode, 'Sin dato');
      const branch = getBackendBranchLabel(item);
      const matchesState = selectedCaseState === 'all' || caseState === selectedCaseState;
      const matchesBranch = selectedBranch === 'all' || branch === selectedBranch;

      return matchesSearch && matchesState && matchesBranch;
    });
  }, [advancedFilteredItems, normalizedSearchTerm, selectedCaseState, selectedBranch]);
  const rankedItems = useMemo(() => {
    if (!prioritizeForUser) {
      return filteredItems;
    }

    return [...filteredItems].sort(compareCasesByActionability);
  }, [filteredItems, prioritizeForUser]);
  const visibleItems = rankedItems.slice(0, visibleCasesCount);
  const remainingItemsCount = Math.max(rankedItems.length - visibleItems.length, 0);
  const hasItems = state.items.length > 0;
  const hasFilteredItems = filteredItems.length > 0;
  const isLoading = state.status === 'loading';
  const statusTone = state.status === 'error'
    ? 'danger'
    : state.status === 'success'
      ? 'success'
      : 'info';
  const statusLabel = isLoading
    ? 'Cargando'
    : state.status === 'success'
      ? 'Conectado'
      : state.status === 'error'
        ? 'Revisar'
        : 'Pendiente';

  const refreshWithAdvancedFilters = useCallback((filters) => {
    return onRefreshRef.current(buildAdvancedFiltersPayload(filters));
  }, []);

  const handleSetAdvancedFilter = useCallback((field, value) => {
    setDraftAdvancedFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const handleApplyAdvancedFilters = useCallback(() => {
    setAppliedAdvancedFilters(draftAdvancedFilters);
    return refreshWithAdvancedFilters(draftAdvancedFilters);
  }, [draftAdvancedFilters, refreshWithAdvancedFilters]);

  const handleClearAdvancedFilters = useCallback(() => {
    setDraftAdvancedFilters(EMPTY_ADVANCED_FILTERS);
    setAppliedAdvancedFilters(EMPTY_ADVANCED_FILTERS);
    return refreshWithAdvancedFilters(EMPTY_ADVANCED_FILTERS);
  }, [refreshWithAdvancedFilters]);

  useEffect(() => {
    setVisibleCasesCount(initialVisibleCases);
  }, [initialVisibleCases, normalizedSearchTerm, selectedCaseState, selectedBranch, state.items]);

  useEffect(() => {
    if (draftAdvancedFiltersCount > 0 || activeAdvancedFiltersCount > 0) {
      setIsAdvancedFiltersOpen(true);
    }
  }, [activeAdvancedFiltersCount, draftAdvancedFiltersCount]);

  const handleLoadMore = () => {
    setVisibleCasesCount((current) => current + loadMoreStep);
  };

  const handleAdvancedFiltersToggle = (event) => {
    setIsAdvancedFiltersOpen(event.currentTarget.open);
  };

  return (
    <section className="card backend-cases-card simple-panel-section">
      <CasesToolbar
        activeAdvancedFilterPills={activeAdvancedFilterPills}
        activeAdvancedFiltersCount={activeAdvancedFiltersCount}
        advancedFilters={draftAdvancedFilters}
        branchOptions={branchOptions}
        caseStateOptions={caseStateOptions}
        caseTypeOptions={caseTypeOptions}
        draftAdvancedFiltersCount={draftAdvancedFiltersCount}
        hasManagerOptions={managerOptions.length > 0}
        hasPendingAdvancedFilterChanges={hasPendingAdvancedFilterChanges}
        hasPendingTaskAssigneeOptions={pendingTaskAssigneeOptions.length > 0}
        isAdvancedFiltersOpen={isAdvancedFiltersOpen}
        isLoading={isLoading}
        managerOptions={managerOptions}
        onApplyAdvancedFilters={handleApplyAdvancedFilters}
        onClearAdvancedFilters={handleClearAdvancedFilters}
        onRefresh={() => refreshWithAdvancedFilters(appliedAdvancedFilters)}
        onSetAdvancedFilter={handleSetAdvancedFilter}
        onToggleAdvancedFilters={handleAdvancedFiltersToggle}
        opinionOptions={opinionOptions}
        paymentStateOptions={paymentStateOptions}
        pendingTaskAssigneeOptions={pendingTaskAssigneeOptions}
        searchTerm={searchTerm}
        selectedBranch={selectedBranch}
        selectedCaseState={selectedCaseState}
        setSearchTerm={setSearchTerm}
        setSelectedBranch={setSelectedBranch}
        setSelectedCaseState={setSelectedCaseState}
        statusLabel={statusLabel}
        statusTone={statusTone}
        StatusBadge={StatusBadge}
        visibleRepairStateOptions={visibleRepairStateOptions}
        visibleTramiteStateOptions={visibleTramiteStateOptions}
      />

      <CasesMetrics
        formatDateTime={formatDateTime}
        hasFilteredItems={hasFilteredItems}
        isLoading={isLoading}
        normalizedSearchTerm={normalizedSearchTerm}
        state={state}
        visibleCount={visibleItems.length}
      />

      {state.status === 'error' ? (
        <div className={`alert-banner ${state.tone}-banner backend-inline-banner`} role="status" aria-live="polite">
          <div className="api-connection-copy">
            <strong>{state.title}</strong>
            <small>{state.detail}</small>
          </div>
        </div>
      ) : null}

      {hasItems && hasFilteredItems ? (
        <CasesList
          detailState={detailState}
          filteredItems={visibleItems}
          formatBackendState={formatBackendState}
          getBackendBranchLabel={getBackendBranchLabel}
          getBackendCaseKey={getBackendCaseKey}
          getBackendStatusTone={getBackendStatusTone}
          onLoadMore={handleLoadMore}
          onOpenCase={onOpenCase}
          onOpenDetail={onOpenDetail}
          remainingItemsCount={remainingItemsCount}
          showLoadMore={showLoadMore}
          StatusBadge={StatusBadge}
        />
      ) : null}

      {hasItems && hasFilteredItems ? (
        <AuthenticatedCaseDetail
          detailState={detailState}
          documentsCatalogs={documentsCatalogs}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
          isDownloadingDocument={isDownloadingDocument}
          isPreviewingDocument={isPreviewingDocument}
          isSavingDocuments={isSavingDocuments}
          onDownloadDocument={onDownloadDocument}
          onOpenCase={onOpenCase}
          onOpenDetail={onOpenDetail}
          onPreviewDocument={onPreviewDocument}
          onSaveDocument={onSaveDocument}
        />
      ) : null}

      {state.status === 'success' && hasItems && !hasFilteredItems ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>No encontramos carpetas con estos filtros.</strong>
          <p>
            {`Búsqueda: ${searchTerm.trim() || 'sin texto'} · Estado: ${selectedCaseState === 'all' ? 'Todos' : selectedCaseState} · Sucursal: ${selectedBranch === 'all' ? 'Todos' : selectedBranch}.`}
            {activeAdvancedFilterPills.length ? ` Avanzados: ${activeAdvancedFilterPills.join(' · ')}.` : ''}
            {' '}Probá ajustar los filtros para volver a ver resultados.
          </p>
        </div>
      ) : null}

      {state.status === 'loading' && !hasItems ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>Estamos cargando tus carpetas.</strong>
          <p>En unos instantes vas a ver la información más reciente de tu cuenta.</p>
        </div>
      ) : null}

      {state.status === 'success' && !hasItems ? (
        <div className="backend-cases-empty" role="status">
          <strong>Todavía no vemos carpetas para mostrar.</strong>
          <p>Cuando haya casos asociados a tu cuenta, van a aparecer acá automáticamente.</p>
        </div>
      ) : null}
    </section>
  );
}
