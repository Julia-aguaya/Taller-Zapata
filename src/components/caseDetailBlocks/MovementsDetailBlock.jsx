export default function MovementsDetailBlock({
  financialMovementsState,
  formatBackendState,
  money,
  formatDateTime,
  StatusBadge,
}) {
  return (
    <section className="backend-detail-section backend-section-movements">
      <div className="stack-tight">
        <span className="backend-detail-section-kicker">Movimientos</span>
        <h4>Actividad financiera</h4>
      </div>

      <div className="backend-document-summary" role="list" aria-label="Resumen de movimientos financieros">
        <article className="backend-document-summary-card" role="listitem">
          <span>Movimientos</span>
          <strong>{financialMovementsState.total}</strong>
          <small>Registros financieros visibles para esta carpeta.</small>
        </article>
      </div>

      {financialMovementsState.status === 'loading' ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>Estamos cargando los movimientos financieros.</strong>
           <p>{financialMovementsState.detail || 'En unos instantes vas a ver la actividad actualizada.'}</p>
        </div>
      ) : financialMovementsState.status === 'success' ? (
        <div className="backend-appointment-list backend-item-list-horizontal" role="list" aria-label="Movimientos financieros de la carpeta">
          {financialMovementsState.items.slice(0, 6).map((movement) => (
            <article className="backend-appointment-card" key={movement.id || movement.publicId} role="listitem">
              <div className="backend-document-card-head">
                <div className="stack-tight">
                  <span className="client-case-kicker">{formatBackendState(movement.movementTypeCode, 'Movimiento')}</span>
                  <strong>{money(movement.netAmount)}</strong>
                </div>
                <StatusBadge tone={Number(movement.netAmount || 0) >= 0 ? 'success' : 'danger'}>
                  {movement.movementAt ? formatDateTime(movement.movementAt) : 'Sin fecha visible'}
                </StatusBadge>
              </div>

              <div className="backend-appointment-meta" role="list" aria-label="Datos del movimiento financiero">
                <div className="backend-appointment-meta-item" role="listitem"><span>Bruto</span><strong>{money(movement.grossAmount)}</strong></div>
                <div className="backend-appointment-meta-item" role="listitem"><span>Origen</span><strong>{formatBackendState(movement.flowOriginCode, 'Sin dato')}</strong></div>
                <div className="backend-appointment-meta-item" role="listitem"><span>Medio</span><strong>{formatBackendState(movement.paymentMethodCode, 'Sin dato')}</strong></div>
              </div>

              {movement.reason ? <p className="backend-appointment-note">{movement.reason}</p> : null}
            </article>
          ))}
        </div>
      ) : financialMovementsState.status === 'error' ? (
        <div className="backend-cases-empty" role="status">
          <strong>No pudimos mostrar los movimientos financieros de esta carpeta.</strong>
          <p>{financialMovementsState.detail || 'Intentá nuevamente en unos instantes.'}</p>
        </div>
      ) : (
        <div className="backend-cases-empty" role="status">
          <strong>Todavía no vemos movimientos financieros para esta carpeta.</strong>
          <p>{financialMovementsState.detail || 'Cuando se registren importes, vas a verlos acá.'}</p>
        </div>
      )}
    </section>
  );
}
