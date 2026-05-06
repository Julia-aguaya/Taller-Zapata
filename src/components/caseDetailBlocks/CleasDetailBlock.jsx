function pickCleasFields(data) {
  if (!data || typeof data !== 'object') return [];

  const fields = [
    ['Estado CLEAS', data.statusCode || data.stageCode || data.cleasStatusCode],
    ['Referencia', data.referenceNumber || data.externalReference || data.cleasReference],
    ['Compañía contraparte', data.counterpartyCompanyName || data.thirdPartyCompanyName],
    ['Analista', data.analystName || data.managerName],
    ['Resultado', data.resultCode || data.outcomeCode],
  ];

  return fields.filter(([, value]) => Boolean(value)).slice(0, 5);
}

export default function CleasDetailBlock({ cleasState, formatBackendState, formatDateTime, StatusBadge }) {
  const fields = pickCleasFields(cleasState.data);
  const updatedAt = cleasState.data?.updatedAt || cleasState.data?.createdAt || '';

  return (
    <section className="backend-detail-section backend-section-cleas">
      <div className="stack-tight">
        <span className="backend-detail-section-kicker">Recupero</span>
        <h4>Gestión CLEAS</h4>
      </div>

      {cleasState.status === 'loading' ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>Estamos cargando los datos CLEAS.</strong>
          <p>{cleasState.detail || 'En unos instantes vas a ver esta información.'}</p>
        </div>
      ) : cleasState.status === 'success' ? (
        <>
          <div className="backend-document-summary" role="list" aria-label="Resumen de gestión CLEAS">
            <article className="backend-document-summary-card" role="listitem">
              <span>Última actualización</span>
              <strong>{updatedAt ? formatDateTime(updatedAt) : 'Sin fecha visible'}</strong>
              <small>{cleasState.detail || 'Estado actual del circuito CLEAS para esta carpeta.'}</small>
            </article>
          </div>
          <div className="backend-appointment-list backend-item-list-horizontal" role="list" aria-label="Datos CLEAS de la carpeta">
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
                <strong>No encontramos datos CLEAS visibles.</strong>
                <p>{cleasState.detail || 'Cuando estén cargados, vas a verlos acá.'}</p>
              </div>
            )}
          </div>
        </>
      ) : cleasState.status === 'error' ? (
        <div className="backend-cases-empty" role="status">
          <strong>No pudimos mostrar los datos CLEAS de esta carpeta.</strong>
          <p>{cleasState.detail || 'Intentá nuevamente en unos instantes.'}</p>
        </div>
      ) : (
        <div className="backend-cases-empty" role="status">
          <strong>Todavía no vemos datos CLEAS cargados para esta carpeta.</strong>
          <p>{cleasState.detail || 'Cuando se registren, vas a verlos acá.'}</p>
        </div>
      )}
    </section>
  );
}
