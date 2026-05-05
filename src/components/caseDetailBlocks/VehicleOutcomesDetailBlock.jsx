export default function VehicleOutcomesDetailBlock({ vehicleOutcomesState, formatDate, formatBackendState, getBackendStatusTone, StatusBadge }) {
  return (
    <section className="backend-detail-section backend-section-vehicle-outcomes">
      <div className="stack-tight"><span className="backend-detail-section-kicker">Entrega</span><h4>Acta de entrega</h4></div>
      <div className="backend-document-summary" role="list" aria-label="Resumen de entregas del vehículo">
        <article className="backend-document-summary-card" role="listitem"><span>Egresos registrados</span><strong>{vehicleOutcomesState.total}</strong><small>Entregas cargadas para esta carpeta.</small></article>
        <article className="backend-document-summary-card" role="listitem"><span>Última entrega</span><strong>{vehicleOutcomesState.latest?.outcomeDate ? formatDate(vehicleOutcomesState.latest.outcomeDate) : '-'}</strong><small>{vehicleOutcomesState.latest?.statusCode ? formatBackendState(vehicleOutcomesState.latest.statusCode) : 'Sin estado visible.'}</small></article>
      </div>

      {vehicleOutcomesState.status === 'loading' ? (
        <div className="backend-cases-empty" role="status" aria-live="polite"><strong>Estamos cargando la entrega del vehículo.</strong><p>{vehicleOutcomesState.detail || 'En unos instantes vas a ver la información cargada.'}</p></div>
      ) : vehicleOutcomesState.status === 'success' ? (
        <div className="backend-appointment-list backend-item-list-horizontal" role="list" aria-label="Entregas del vehículo">
          {vehicleOutcomesState.items.slice(0, 4).map((outcome) => (
            <article className="backend-appointment-card" key={outcome.id || outcome.publicId} role="listitem">
              <div className="backend-document-card-head">
                <div className="stack-tight"><span className="client-case-kicker">Entrega</span><strong>{outcome.outcomeDate ? formatDate(outcome.outcomeDate) : 'Fecha a confirmar'}</strong></div>
                <StatusBadge tone={getBackendStatusTone(outcome.statusCode)}>{formatBackendState(outcome.statusCode, 'Registrado')}</StatusBadge>
              </div>
              <div className="backend-appointment-meta" role="list" aria-label="Datos de entrega">
                <div className="backend-appointment-meta-item" role="listitem"><span>Km salida</span><strong>{outcome.mileage ?? 'Sin dato'}</strong></div>
                <div className="backend-appointment-meta-item" role="listitem"><span>Combustible</span><strong>{formatBackendState(outcome.fuelLevelCode, 'Sin dato')}</strong></div>
                <div className="backend-appointment-meta-item" role="listitem"><span>Recibe</span><strong>{outcome.deliveredToName || outcome.receiverName || 'Sin dato'}</strong></div>
              </div>
              {outcome.notes ? <p className="backend-appointment-note">{outcome.notes}</p> : null}
            </article>
          ))}
        </div>
      ) : vehicleOutcomesState.status === 'error' ? (
        <div className="backend-cases-empty" role="status"><strong>No pudimos mostrar la entrega del vehículo de esta carpeta.</strong><p>{vehicleOutcomesState.detail || 'Intentá nuevamente en unos instantes.'}</p></div>
      ) : (
        <div className="backend-cases-empty" role="status"><strong>Todavía no vemos entregas del vehículo para esta carpeta.</strong><p>{vehicleOutcomesState.detail || 'Cuando se registre una entrega, la vas a ver acá.'}</p></div>
      )}
    </section>
  );
}
