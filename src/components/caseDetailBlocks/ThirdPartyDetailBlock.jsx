function pickThirdPartyFields(data) {
  if (!data || typeof data !== 'object') return [];

  const fields = [
    ['Persona', data.fullName || data.displayName || data.name],
    ['Documento', data.document || data.documentNumber],
    ['Compañía', data.insuranceCompanyName || data.companyName],
    ['Patente', data.plate || data.vehiclePlate],
    ['Contacto', data.phone || data.email],
    ['Rol', data.roleCode || data.relationshipCode],
  ];

  return fields.filter(([, value]) => Boolean(value)).slice(0, 6);
}

export default function ThirdPartyDetailBlock({ thirdPartyState, formatBackendState, StatusBadge }) {
  const fields = pickThirdPartyFields(thirdPartyState.data);

  return (
    <section className="backend-detail-section backend-section-third-party">
      <div className="stack-tight">
        <span className="backend-detail-section-kicker">Terceros</span>
        <h4>Datos vinculados</h4>
      </div>

      {thirdPartyState.status === 'loading' ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>Estamos cargando los datos de terceros.</strong>
          <p>{thirdPartyState.detail || 'En unos instantes vas a ver esta información.'}</p>
        </div>
      ) : thirdPartyState.status === 'success' ? (
        <div className="backend-appointment-list backend-item-list-horizontal" role="list" aria-label="Datos de terceros vinculados a la carpeta">
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
              <strong>No encontramos datos de terceros visibles.</strong>
              <p>{thirdPartyState.detail || 'Cuando estén cargados, vas a verlos acá.'}</p>
            </div>
          )}
        </div>
      ) : thirdPartyState.status === 'error' ? (
        <div className="backend-cases-empty" role="status">
          <strong>No pudimos mostrar los datos de terceros de esta carpeta.</strong>
          <p>{thirdPartyState.detail || 'Intentá nuevamente en unos instantes.'}</p>
        </div>
      ) : (
        <div className="backend-cases-empty" role="status">
          <strong>Todavía no vemos datos de terceros cargados para esta carpeta.</strong>
          <p>{thirdPartyState.detail || 'Cuando se registren, vas a verlos acá.'}</p>
        </div>
      )}
    </section>
  );
}
