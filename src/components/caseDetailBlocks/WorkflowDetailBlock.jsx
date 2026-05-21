export default function WorkflowDetailBlock({
  auditEventsState,
  workflowHistory,
  workflowActions,
  formatBackendState,
  getBackendStatusTone,
  formatWorkflowDomain,
  formatDateTime,
  getWorkflowActionAudienceCopy,
  StatusBadge,
}) {
  const auditItems = Array.isArray(auditEventsState?.items) ? auditEventsState.items : [];

  return (
    <>
      <section className="backend-detail-section backend-section-workflow">
        <div className="stack-tight">
          <span className="backend-detail-section-kicker">Seguimiento</span>
          <h4>Últimos movimientos</h4>
        </div>

        {auditItems.length > 0 ? (
          <div className="backend-timeline backend-item-list-horizontal" role="list" aria-label="Últimos movimientos de la carpeta">
            {auditItems.slice(0, 4).map((entry, index) => (
              <article className="backend-timeline-item" key={entry.id || `${entry.actionCode || entry.eventType || 'audit'}-${entry.createdAt || entry.occurredAt || index}`} role="listitem">
                <div className="backend-timeline-head">
                  <strong>{formatBackendState(entry.actionCode || entry.eventType || 'Cambio')}</strong>
                  <StatusBadge tone="info">{formatWorkflowDomain(entry.domain, 'Actividad')}</StatusBadge>
                </div>
                <p>{entry.changeNote || entry.detail || 'Actualización registrada en tu carpeta.'}</p>
                <small>
                  {formatDateTime(entry.createdAt || entry.occurredAt)}
                  {(entry.actorDisplayName || entry.performedBy) ? ` · ${entry.actorDisplayName || entry.performedBy}` : ' · Registro automático'}
                </small>
              </article>
            ))}
          </div>
        ) : workflowHistory.length > 0 ? (
          <div className="backend-timeline backend-item-list-horizontal" role="list" aria-label="Últimos movimientos de la carpeta">
            {workflowHistory.slice(0, 4).map((entry) => (
              <article className="backend-timeline-item" key={entry.id || `${entry.domain}-${entry.stateCode}-${entry.stateDate}`} role="listitem">
                <div className="backend-timeline-head">
                  <strong>{entry.stateName || formatBackendState(entry.stateCode)}</strong>
                  <StatusBadge tone={getBackendStatusTone(entry.stateName || entry.stateCode)}>{formatWorkflowDomain(entry.domain)}</StatusBadge>
                </div>
                <p>{entry.reason || 'Actualización registrada en tu carpeta.'}</p>
                <small>
                  {formatDateTime(entry.stateDate)}
                  {entry.automatic ? ' · Actualización automática' : ''}
                </small>
              </article>
            ))}
          </div>
        ) : (
          <div className="backend-cases-empty" role="status">
            <strong>Todavía no vemos novedades recientes.</strong>
            <p>Cuando haya novedades de seguimiento, van a aparecer acá.</p>
          </div>
        )}
      </section>

    </>
  );
}
