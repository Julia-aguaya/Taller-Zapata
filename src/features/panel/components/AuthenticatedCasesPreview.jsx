import { useMemo, useState } from 'react';
import CasesList from '../../../components/cases/CasesList';
import CasesMetrics from '../../../components/cases/CasesMetrics';
import CasesToolbar from '../../../components/cases/CasesToolbar';
import StatusBadge from '../../../components/ui/StatusBadge';
import { formatBackendState } from '../../cases/lib/caseFormatters';
import { getCaseSearchHaystack, getBackendBranchLabel, getBackendStatusTone } from '../../cases/lib/caseFilters';
import { getBackendCaseKey } from '../lib/panelPreviewHelpers';
import AuthenticatedCaseDetail from './AuthenticatedCaseDetail';

export default function AuthenticatedCasesPreview({
  detailState,
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
  state,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCaseState, setSelectedCaseState] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
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
        filteredItems={filteredItems}
        formatDateTime={formatDateTime}
        hasFilteredItems={hasFilteredItems}
        isLoading={isLoading}
        normalizedSearchTerm={normalizedSearchTerm}
        state={state}
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
          filteredItems={filteredItems}
          formatBackendState={formatBackendState}
          getBackendBranchLabel={getBackendBranchLabel}
          getBackendCaseKey={getBackendCaseKey}
          getBackendStatusTone={getBackendStatusTone}
          onOpenCase={onOpenCase}
          onOpenDetail={onOpenDetail}
          StatusBadge={StatusBadge}
        />
      ) : null}

      {hasItems && hasFilteredItems ? (
        <AuthenticatedCaseDetail
          detailState={detailState}
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
