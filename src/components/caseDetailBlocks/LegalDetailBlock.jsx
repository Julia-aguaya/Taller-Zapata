function pickLegalFields(data) {
  if (!data || typeof data !== 'object') return [];

  const fields = [
    ['Estado legal', data.statusCode || data.legalStatusCode || data.stageCode],
    ['Estudio', data.lawFirmName || data.firmName],
    ['Abogado', data.lawyerName || data.attorneyName],
    ['Expediente', data.caseFileNumber || data.fileNumber || data.referenceNumber],
    ['Juzgado', data.courtName || data.jurisdictionName],
    ['Responsable', data.ownerName || data.managerName],
  ];

  return fields.filter(([, value]) => Boolean(value)).slice(0, 6);
}

export default function LegalDetailBlock({ legalState, formatBackendState, formatDateTime, StatusBadge }) {
  const fields = pickLegalFields(legalState.data);
  const updatedAt = legalState.data?.updatedAt || legalState.data?.createdAt || '';

  return (
    <section className="backend-detail-section backend-section-legal">
      <div className="stack-tight">
        <span className="backend-detail-section-kicker">Legal</span>
        <h4>Gestión judicial y legal</h4>
      </div>

      {legalState.status === 'loading' ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>Estamos cargando los datos legales.</strong>
          <p>{legalState.detail || 'En unos instantes vas a ver esta información.'}</p>
        </div>
      ) : legalState.status === 'success' ? (
        <>
          <div className="backend-document-summary" role="list" aria-label="Resumen legal de la carpeta">
            <article className="backend-document-summary-card" role="listitem">
              <span>Última actualización</span>
              <strong>{updatedAt ? formatDateTime(updatedAt) : 'Sin fecha visible'}</strong>
              <small>{legalState.detail || 'Estado legal actual de esta carpeta.'}</small>
            </article>
          </div>
          <div className="backend-appointment-list backend-item-list-horizontal" role="list" aria-label="Datos legales de la carpeta">
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
                <strong>No encontramos datos legales visibles.</strong>
                <p>{legalState.detail || 'Cuando estén cargados, vas a verlos acá.'}</p>
              </div>
            )}
          </div>
        </>
      ) : legalState.status === 'error' ? (
        <div className="backend-cases-empty" role="status">
          <strong>No pudimos mostrar los datos legales de esta carpeta.</strong>
          <p>{legalState.detail || 'Intentá nuevamente en unos instantes.'}</p>
        </div>
      ) : (
        <div className="backend-cases-empty" role="status">
          <strong>Todavía no vemos datos legales cargados para esta carpeta.</strong>
          <p>{legalState.detail || 'Cuando se registren, vas a verlos acá.'}</p>
        </div>
      )}
    </section>
  );
}
