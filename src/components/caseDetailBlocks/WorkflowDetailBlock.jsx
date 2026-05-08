export default function WorkflowDetailBlock({
  workflowHistory,
  workflowActions,
  formatBackendState,
  getBackendStatusTone,
  formatWorkflowDomain,
  formatDateTime,
  getWorkflowActionAudienceCopy,
  StatusBadge,
}) {
  return (
    <>
      <section className="backend-detail-section backend-section-workflow">
        <div className="stack-tight">
          <span className="backend-detail-section-kicker">Seguimiento</span>
          <h4>Últimos movimientos</h4>
        </div>

        {workflowHistory.length > 0 ? (
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
