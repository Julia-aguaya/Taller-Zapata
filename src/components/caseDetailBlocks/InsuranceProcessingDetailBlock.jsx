function pickProcessingFields(data) {
  if (!data || typeof data !== 'object') return [];

  const entries = [
    ['Estado', data.statusCode || data.processingStatusCode || data.stageCode],
    ['Última gestión', data.lastActionCode || data.lastAction || data.actionCode],
    ['Referente', data.analystName || data.managerName || data.ownerName],
    ['Canal', data.channelCode || data.channel],
    ['SLA', data.slaStatusCode || data.slaStatus],
  ];

  return entries.filter(([, value]) => Boolean(value)).slice(0, 5);
}

export default function InsuranceProcessingDetailBlock({
  insuranceProcessingState,
  formatBackendState,
  formatDateTime,
  StatusBadge,
}) {
  const fields = pickProcessingFields(insuranceProcessingState.data);
  const updatedAt = insuranceProcessingState.data?.updatedAt || insuranceProcessingState.data?.createdAt || '';

  return (
    <section className="backend-detail-section backend-section-insurance-processing">
      <div className="stack-tight">
        <span className="backend-detail-section-kicker">Trámite</span>
        <h4>Gestión con la compañía</h4>
      </div>

      {insuranceProcessingState.status === 'loading' ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>Estamos cargando el trámite con la compañía.</strong>
          <p>{insuranceProcessingState.detail || 'En unos instantes vas a ver esta información.'}</p>
        </div>
      ) : insuranceProcessingState.status === 'success' ? (
        <>
          <div className="backend-document-summary" role="list" aria-label="Resumen del trámite con la compañía">
            <article className="backend-document-summary-card" role="listitem">
              <span>Actualización</span>
              <strong>{updatedAt ? formatDateTime(updatedAt) : 'Sin fecha visible'}</strong>
              <small>{insuranceProcessingState.detail || 'Estado actual del trámite visible para esta carpeta.'}</small>
            </article>
          </div>
          <div className="backend-appointment-list backend-item-list-horizontal" role="list" aria-label="Datos del trámite con la compañía">
            {fields.length > 0 ? fields.map(([label, value]) => (
              <article className="backend-appointment-card" key={label} role="listitem">
                <div className="backend-document-card-head">
                  <div className="stack-tight">
                    <span className="client-case-kicker">{label}</span>
                    <strong>{formatBackendState(value, String(value))}</strong>
                  </div>
                  <StatusBadge tone="info">Visible</StatusBadge>
                </div>
              </article>
            )) : (
              <div className="backend-cases-empty" role="status">
                <strong>No encontramos datos visibles del trámite.</strong>
                <p>{insuranceProcessingState.detail || 'Cuando estén cargados, vas a verlos acá.'}</p>
              </div>
            )}
          </div>
        </>
      ) : insuranceProcessingState.status === 'error' ? (
        <div className="backend-cases-empty" role="status">
          <strong>No pudimos mostrar el trámite con la compañía.</strong>
          <p>{insuranceProcessingState.detail || 'Intentá nuevamente en unos instantes.'}</p>
        </div>
      ) : (
        <div className="backend-cases-empty" role="status">
          <strong>Todavía no vemos datos del trámite con la compañía.</strong>
          <p>{insuranceProcessingState.detail || 'Cuando se registren novedades, vas a verlas acá.'}</p>
        </div>
      )}
    </section>
  );
}
