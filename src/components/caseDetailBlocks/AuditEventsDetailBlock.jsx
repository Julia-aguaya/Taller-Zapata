export default function AuditEventsDetailBlock({
  auditEventsState,
  formatBackendState,
  formatDateTime,
  StatusBadge,
}) {
  return (
    <section className="backend-detail-section backend-section-audit-events">
      <div className="stack-tight">
        <span className="backend-detail-section-kicker">Actividad</span>
        <h4>Historial de la carpeta</h4>
      </div>

      <div className="backend-document-summary" role="list" aria-label="Resumen de actividad de la carpeta">
        <article className="backend-document-summary-card" role="listitem">
          <span>Eventos</span>
          <strong>{auditEventsState.total}</strong>
          <small>Últimos registros visibles de la carpeta.</small>
        </article>
      </div>

      {auditEventsState.status === 'loading' ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>Estamos cargando la actividad reciente.</strong>
          <p>{auditEventsState.detail || 'En unos instantes vas a ver las últimas novedades.'}</p>
        </div>
      ) : auditEventsState.status === 'success' ? (
        <div className="backend-timeline backend-item-list-horizontal" role="list" aria-label="Eventos recientes de la carpeta">
          {auditEventsState.items.slice(0, 6).map((event, index) => (
            <article className="backend-timeline-item" key={event.id || event.publicId || `${event.occurredAt || event.createdAt || 'event'}-${index}`} role="listitem">
              <div className="backend-document-card-head">
                <div className="stack-tight">
                  <span className="client-case-kicker">{formatBackendState(event.domainCode || event.moduleCode || 'Seguimiento')}</span>
                  <strong>{formatBackendState(event.eventCode || event.actionCode || event.typeCode || 'Evento')}</strong>
                </div>
                <StatusBadge tone="info">{formatDateTime(event.occurredAt || event.createdAt)}</StatusBadge>
              </div>
              {event.description || event.summary || event.detail ? <p>{event.description || event.summary || event.detail}</p> : null}
              <small>{event.actorDisplayName || event.actorName || event.createdBy || 'Registro automático del sistema'}</small>
            </article>
          ))}
        </div>
      ) : auditEventsState.status === 'error' ? (
        <div className="backend-cases-empty" role="status">
          <strong>No pudimos mostrar la actividad de esta carpeta.</strong>
          <p>{auditEventsState.detail || 'Intentá nuevamente en unos instantes.'}</p>
        </div>
      ) : (
        <div className="backend-cases-empty" role="status">
          <strong>Todavía no vemos actividad registrada para esta carpeta.</strong>
          <p>{auditEventsState.detail || 'Cuando se registren novedades, vas a verlas acá.'}</p>
        </div>
      )}
    </section>
  );
}
