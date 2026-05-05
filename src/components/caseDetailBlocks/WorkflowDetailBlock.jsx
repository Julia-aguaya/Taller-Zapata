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
            <strong>Todavía no vemos movimientos recientes.</strong>
            <p>Cuando haya novedades de seguimiento, van a aparecer acá.</p>
          </div>
        )}
      </section>

      <section className="backend-detail-section backend-section-next-actions">
        <div className="stack-tight">
          <span className="backend-detail-section-kicker">Próximo</span>
          <h4>Lo que puede pasar ahora</h4>
        </div>

        {workflowActions.length > 0 ? (
          <div className="backend-action-grid backend-item-list-horizontal" role="list" aria-label="Posibles próximos pasos de la carpeta">
            {workflowActions.slice(0, 4).map((action) => (
              <article className="backend-action-card" key={`${action.domain}-${action.actionCode}-${action.targetStateCode}`} role="listitem">
                <strong>{getWorkflowActionAudienceCopy(action)}</strong>
                <small>{action.automatic ? 'Se actualiza automáticamente cuando corresponde.' : 'Puede aparecer como próximo avance de tu carpeta.'}</small>
              </article>
            ))}
          </div>
        ) : (
          <div className="backend-cases-empty" role="status">
            <strong>No vemos un próximo paso visible en este momento.</strong>
            <p>Eso puede cambiar apenas la carpeta reciba una nueva novedad.</p>
          </div>
        )}
      </section>
    </>
  );
}
