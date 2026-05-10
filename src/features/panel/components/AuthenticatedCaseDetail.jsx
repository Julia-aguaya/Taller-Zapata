import CaseAppointmentsSection from '../../../components/detail/CaseAppointmentsSection';
import CaseDocumentsSection from '../../../components/detail/CaseDocumentsSection';
import CaseWorkflowSection from '../../../components/detail/CaseWorkflowSection';
import StatusBadge from '../../../components/ui/StatusBadge';
import { getCaseHash } from '../../routing/lib/caseHash';
import { formatBackendState } from '../../cases/lib/caseFormatters';
import { getBackendBranchLabel, getBackendStatusTone } from '../../cases/lib/caseFilters';
import { getCaseVehicleLabel, getCaseResponsibleLabel, getCaseNextTaskLabel } from '../../cases/lib/caseDisplayHelpers';
import { formatWorkflowDomain } from '../../case-detail/lib/caseWorkflowUtils';
import {
  formatAppointmentTime,
  formatDocumentAudience,
  formatDocumentDescriptor,
  formatDocumentSize,
  getAppointmentStatusTone,
  getBackendCaseDetailHeadline,
  getCaseClientLabel,
  getWorkflowActionAudienceCopy,
  groupDocumentsByOrigin,
} from '../lib/panelPreviewHelpers';

export default function AuthenticatedCaseDetail({
  detailState,
  onOpenDetail,
  onSaveDocument,
  onDownloadDocument,
  onPreviewDocument,
  formatDate,
  formatDateTime,
  isSavingDocuments = false,
  isDownloadingDocument = false,
  isPreviewingDocument = false,
  documentsCatalogs = null,
}) {
  if (detailState.status === 'idle') {
    return (
      <div className="backend-cases-empty backend-detail-empty" role="status">
        <strong>Elegí una carpeta para ver su detalle.</strong>
        <p>Vas a poder revisar un resumen real con los datos principales del caso.</p>
      </div>
    );
  }

  if (detailState.status === 'loading') {
    return (
      <div className="backend-cases-empty backend-detail-empty" role="status" aria-live="polite">
        <strong>Estamos abriendo la carpeta.</strong>
        <p>En unos instantes vas a ver el resumen actualizado del caso.</p>
      </div>
    );
  }

  if (detailState.status === 'error') {
    return (
      <div className="backend-detail-feedback" role="status" aria-live="polite">
        <div className="backend-cases-empty backend-detail-empty">
          <strong>{detailState.title}</strong>
          <p>{detailState.detail}</p>
        </div>
        {detailState.item ? (
          <button className="secondary-button" onClick={() => { void onOpenDetail(detailState.item); }} type="button">
            Reintentar
          </button>
        ) : null}
      </div>
    );
  }

  const item = detailState.data;
  const workflowHistory = detailState.workflowHistory;
  const workflowActions = detailState.workflowActions;
  const appointmentsState = detailState.appointmentsState;
  const documentsState = detailState.documentsState;
  const documentGroups = groupDocumentsByOrigin(documentsState.items);
  const mainStateLabel = formatBackendState(item.currentCaseStateCode);
  const priorityLabel = formatBackendState(item.priorityCode, 'Estandar');
  const priorityTone = getBackendStatusTone(priorityLabel);
  const pendingCount = item?.pendingTasksCount ?? item?.computed?.pendingTasksCount ?? workflowActions.length;
  const nextTaskLabel = getCaseNextTaskLabel(workflowActions);
  const openAt = item?.openedAt || item?.createdAt || item?.entryDate;
  const dueAt = item?.dueAt || item?.nextActionAt || appointmentsState.nextAppointment?.appointmentDate;
  const responsibleLabel = getCaseResponsibleLabel(item, workflowActions);

  return (
    <article className="backend-detail-card" aria-live="polite">
      <div className="backend-detail-head">
        <div className="stack-tight">
          <p className="eyebrow">Detalle de carpeta</p>
          <h3>{getBackendCaseDetailHeadline(item)}</h3>
          <p className="muted">{getCaseClientLabel(item)} · {getCaseVehicleLabel(item)}</p>
        </div>
        <StatusBadge tone="info">{getBackendBranchLabel(item)}</StatusBadge>
      </div>

      <div className="backend-detail-grid" role="list" aria-label="Resumen de la carpeta seleccionada">
        <div className="backend-detail-row" role="listitem"><span>Codigo</span><strong>{getBackendCaseDetailHeadline(item)}</strong></div>
        <div className="backend-detail-row" role="listitem"><span>Cliente</span><strong>{getCaseClientLabel(item)}</strong></div>
        <div className="backend-detail-row" role="listitem"><span>Vehiculo</span><strong>{getCaseVehicleLabel(item)}</strong></div>
        <div className="backend-detail-row" role="listitem"><span>Estado actual</span><StatusBadge tone={getBackendStatusTone(mainStateLabel)}>{mainStateLabel}</StatusBadge></div>
        <div className="backend-detail-row" role="listitem"><span>Prioridad</span><StatusBadge tone={priorityTone}>{priorityLabel}</StatusBadge></div>
        <div className="backend-detail-row" role="listitem"><span>Responsable</span><strong>{responsibleLabel}</strong></div>
        <div className="backend-detail-row" role="listitem"><span>Ingreso</span><strong>{openAt ? formatDate(openAt) : 'Sin fecha'}</strong></div>
        <div className="backend-detail-row" role="listitem"><span>Vencimiento</span><strong>{dueAt ? formatDate(dueAt) : 'Sin fecha'}</strong></div>
      </div>

      <div className="backend-detail-highlights" role="list" aria-label="Resumen rapido del estado de la carpeta">
        <article className="backend-detail-highlight" role="listitem">
          <span>Pendientes</span>
          <strong>{pendingCount}</strong>
          <small>{pendingCount === 1 ? '1 tema pendiente en seguimiento.' : `${pendingCount} temas pendientes en seguimiento.`}</small>
        </article>
        <article className="backend-detail-highlight" role="listitem">
          <span>Tarea sugerida</span>
          <strong>{nextTaskLabel}</strong>
          <small>Priorizar este paso reduce demoras en la carpeta.</small>
        </article>
      </div>

      <div className="backend-detail-primary-actions" role="group" aria-label="Acciones principales de la carpeta">
        <a className="primary-button button-link backend-detail-action" href={getCaseHash(item.id, { tab: 'gestion' })}>Abrir gestion</a>
        <a className="secondary-button button-link backend-detail-action" href={getCaseHash(item.id, { tab: 'documentacion' })}>Documentacion</a>
      </div>

      <div className="backend-detail-sections">
        <CaseWorkflowSection
          workflowHistory={workflowHistory}
          workflowActions={workflowActions}
          formatBackendState={formatBackendState}
          formatDateTime={formatDateTime}
          formatWorkflowDomain={formatWorkflowDomain}
          getBackendStatusTone={getBackendStatusTone}
          getWorkflowActionAudienceCopy={getWorkflowActionAudienceCopy}
          StatusBadge={StatusBadge}
        />

        <CaseAppointmentsSection
          appointmentsState={appointmentsState}
          formatAppointmentTime={formatAppointmentTime}
          formatBackendState={formatBackendState}
          formatDate={formatDate}
          getAppointmentStatusTone={getAppointmentStatusTone}
          StatusBadge={StatusBadge}
        />

        <CaseDocumentsSection
          documentGroups={documentGroups}
          documentsState={documentsState}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
          formatDocumentAudience={formatDocumentAudience}
          formatDocumentDescriptor={formatDocumentDescriptor}
          formatDocumentSize={formatDocumentSize}
          onSaveDocument={onSaveDocument}
          onDownloadDocument={onDownloadDocument}
          onPreviewDocument={onPreviewDocument}
          isSavingDocuments={isSavingDocuments}
          isDownloadingDocument={isDownloadingDocument}
          isPreviewingDocument={isPreviewingDocument}
          documentsCatalogs={documentsCatalogs}
          caseId={item?.id}
          StatusBadge={StatusBadge}
        />
      </div>

      {detailState.trackingNotice ? (
        <div className="backend-detail-notice" role="status">
          <p>{detailState.trackingNotice}</p>
        </div>
      ) : null}
    </article>
  );
}
