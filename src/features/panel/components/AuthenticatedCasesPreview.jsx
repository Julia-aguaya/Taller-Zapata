import { useEffect, useMemo, useState } from 'react';
import CasesList from '../../../components/cases/CasesList';
import CasesMetrics from '../../../components/cases/CasesMetrics';
import CasesToolbar from '../../../components/cases/CasesToolbar';
import StatusBadge from '../../../components/ui/StatusBadge';
import { formatBackendState } from '../../cases/lib/caseFormatters';
import { getCaseSearchHaystack, getBackendBranchLabel, getBackendStatusTone } from '../../cases/lib/caseFilters';
import { getBackendCaseKey } from '../lib/panelPreviewHelpers';
import AuthenticatedCaseDetail from './AuthenticatedCaseDetail';

const INITIAL_VISIBLE_CASES = 12;
const LOAD_MORE_CASES_STEP = 12;

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

export default function AuthenticatedCasesPreview({
  detailState,
  initialVisibleCases = INITIAL_VISIBLE_CASES,
  loadMoreStep = LOAD_MORE_CASES_STEP,
  onOpenCase,
  onOpenDetail,
  onRefresh,
  onSaveDocument,
  onDownloadDocument,
  onPreviewDocument,
  formatDate,
  formatDateTime,
  isSavingDocuments = false,
  isDownloadingDocument = false,
  isPreviewingDocument = false,
  documentsCatalogs = null,
  prioritizeForUser = false,
  showLoadMore = true,
  state,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCaseState, setSelectedCaseState] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [visibleCasesCount, setVisibleCasesCount] = useState(initialVisibleCases);
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
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
  const filteredItems = useMemo(() => {
    return state.items.filter((item) => {
      const matchesSearch = !normalizedSearchTerm || getCaseSearchHaystack(item).includes(normalizedSearchTerm);
      const caseState = formatBackendState(item.currentCaseStateCode, 'Sin dato');
      const branch = getBackendBranchLabel(item);
      const matchesState = selectedCaseState === 'all' || caseState === selectedCaseState;
      const matchesBranch = selectedBranch === 'all' || branch === selectedBranch;

      return matchesSearch && matchesState && matchesBranch;
    });
  }, [normalizedSearchTerm, selectedCaseState, selectedBranch, state.items]);
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

  useEffect(() => {
    setVisibleCasesCount(initialVisibleCases);
  }, [initialVisibleCases, normalizedSearchTerm, selectedCaseState, selectedBranch, state.items]);

  const handleLoadMore = () => {
    setVisibleCasesCount((current) => current + loadMoreStep);
  };

  return (
    <section className="card backend-cases-card simple-panel-section">
      <CasesToolbar
        branchOptions={branchOptions}
        caseStateOptions={caseStateOptions}
        isLoading={isLoading}
        onRefresh={onRefresh}
        searchTerm={searchTerm}
        selectedBranch={selectedBranch}
        selectedCaseState={selectedCaseState}
        setSearchTerm={setSearchTerm}
        setSelectedBranch={setSelectedBranch}
        setSelectedCaseState={setSelectedCaseState}
        statusLabel={statusLabel}
        statusTone={statusTone}
        StatusBadge={StatusBadge}
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
          onOpenCase={onOpenCase}
          onOpenDetail={onOpenDetail}
          onSaveDocument={onSaveDocument}
          onDownloadDocument={onDownloadDocument}
          onPreviewDocument={onPreviewDocument}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
          isSavingDocuments={isSavingDocuments}
          isDownloadingDocument={isDownloadingDocument}
          isPreviewingDocument={isPreviewingDocument}
          documentsCatalogs={documentsCatalogs}
        />
      ) : null}

      {state.status === 'success' && hasItems && !hasFilteredItems ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>No encontramos carpetas con estos filtros.</strong>
          <p>
            {`Búsqueda: ${searchTerm.trim() || 'sin texto'} · Estado: ${selectedCaseState === 'all' ? 'Todos' : selectedCaseState} · Sucursal: ${selectedBranch === 'all' ? 'Todos' : selectedBranch}.`}
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
