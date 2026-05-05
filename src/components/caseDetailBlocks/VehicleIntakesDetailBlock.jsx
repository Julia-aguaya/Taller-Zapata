export default function VehicleIntakesDetailBlock({ vehicleIntakesState, formatDate, formatBackendState, getBackendStatusTone, StatusBadge }) {
  return (
    <section className="backend-detail-section backend-section-vehicle-intakes">
      <div className="stack-tight"><span className="backend-detail-section-kicker">Ingreso</span><h4>Acta de recepción</h4></div>
      <div className="backend-document-summary" role="list" aria-label="Resumen de ingresos del vehículo">
        <article className="backend-document-summary-card" role="listitem"><span>Ingresos registrados</span><strong>{vehicleIntakesState.total}</strong><small>Recepciones cargadas para esta carpeta.</small></article>
        <article className="backend-document-summary-card" role="listitem"><span>Último ingreso</span><strong>{vehicleIntakesState.latest?.intakeDate ? formatDate(vehicleIntakesState.latest.intakeDate) : '-'}</strong><small>{vehicleIntakesState.latest?.statusCode ? formatBackendState(vehicleIntakesState.latest.statusCode) : 'Sin estado visible.'}</small></article>
      </div>

      {vehicleIntakesState.status === 'loading' ? (
        <div className="backend-cases-empty" role="status" aria-live="polite"><strong>Estamos cargando la recepción del vehículo.</strong><p>{vehicleIntakesState.detail || 'En unos instantes vas a ver la información cargada.'}</p></div>
      ) : vehicleIntakesState.status === 'success' ? (
        <div className="backend-appointment-list backend-item-list-horizontal" role="list" aria-label="Recepciones del vehículo">
          {vehicleIntakesState.items.slice(0, 4).map((intake) => (
            <article className="backend-appointment-card" key={intake.id || intake.publicId} role="listitem">
              <div className="backend-document-card-head">
                <div className="stack-tight"><span className="client-case-kicker">Recepción</span><strong>{intake.intakeDate ? formatDate(intake.intakeDate) : 'Fecha a confirmar'}</strong></div>
                <StatusBadge tone={getBackendStatusTone(intake.statusCode)}>{formatBackendState(intake.statusCode, 'Registrado')}</StatusBadge>
              </div>
              <div className="backend-appointment-meta" role="list" aria-label="Datos de recepción">
                <div className="backend-appointment-meta-item" role="listitem"><span>Km</span><strong>{intake.mileage ?? 'Sin dato'}</strong></div>
                <div className="backend-appointment-meta-item" role="listitem"><span>Combustible</span><strong>{formatBackendState(intake.fuelLevelCode, 'Sin dato')}</strong></div>
                <div className="backend-appointment-meta-item" role="listitem"><span>Conductor</span><strong>{intake.driverName || 'Sin dato'}</strong></div>
              </div>
              {intake.notes ? <p className="backend-appointment-note">{intake.notes}</p> : null}
            </article>
          ))}
        </div>
      ) : vehicleIntakesState.status === 'error' ? (
        <div className="backend-cases-empty" role="status"><strong>No pudimos mostrar la recepción del vehículo de esta carpeta.</strong><p>{vehicleIntakesState.detail || 'Intentá nuevamente en unos instantes.'}</p></div>
      ) : (
        <div className="backend-cases-empty" role="status"><strong>Todavía no vemos ingresos del vehículo para esta carpeta.</strong><p>{vehicleIntakesState.detail || 'Cuando se registre una recepción, la vas a ver acá.'}</p></div>
      )}
    </section>
  );
}
