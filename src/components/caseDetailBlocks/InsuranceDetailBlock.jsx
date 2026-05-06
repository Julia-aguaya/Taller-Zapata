function pickInsuranceFields(data) {
  if (!data || typeof data !== 'object') return [];

  const candidates = [
    ['Companía', data.companyName || data.insuranceCompanyName || data.insurerName],
    ['Póliza', data.policyNumber || data.policy || data.policyCode],
    ['Siniestro', data.claimNumber || data.claimCode],
    ['Asegurado', data.insuredName || data.holderName],
    ['Productor', data.brokerName || data.producerName],
    ['Cobertura', data.coverageTypeCode || data.coverageType],
  ];

  return candidates.filter(([, value]) => Boolean(value)).slice(0, 6);
}

export default function InsuranceDetailBlock({ insuranceState, formatBackendState, StatusBadge }) {
  const fields = pickInsuranceFields(insuranceState.data);

  return (
    <section className="backend-detail-section backend-section-insurance">
      <div className="stack-tight">
        <span className="backend-detail-section-kicker">Cobertura</span>
        <h4>Datos de seguro</h4>
      </div>

      {insuranceState.status === 'loading' ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>Estamos cargando la cobertura de esta carpeta.</strong>
          <p>{insuranceState.detail || 'En unos instantes vas a ver esta información.'}</p>
        </div>
      ) : insuranceState.status === 'success' ? (
        <div className="backend-appointment-list backend-item-list-horizontal" role="list" aria-label="Resumen de cobertura de la carpeta">
          {fields.length > 0 ? fields.map(([label, value]) => (
            <article className="backend-appointment-card" key={label} role="listitem">
              <div className="backend-document-card-head">
                <div className="stack-tight">
                  <span className="client-case-kicker">{label}</span>
                  <strong>{typeof value === 'string' ? formatBackendState(value, value) : String(value)}</strong>
                </div>
                <StatusBadge tone="info">Activo</StatusBadge>
              </div>
            </article>
          )) : (
            <div className="backend-cases-empty" role="status">
              <strong>No encontramos datos visibles de cobertura.</strong>
              <p>{insuranceState.detail || 'Cuando estén cargados, vas a verlos acá.'}</p>
            </div>
          )}
        </div>
      ) : insuranceState.status === 'error' ? (
        <div className="backend-cases-empty" role="status">
          <strong>No pudimos mostrar la cobertura de esta carpeta.</strong>
          <p>{insuranceState.detail || 'Intentá nuevamente en unos instantes.'}</p>
        </div>
      ) : (
        <div className="backend-cases-empty" role="status">
          <strong>Todavía no vemos cobertura cargada para esta carpeta.</strong>
          <p>{insuranceState.detail || 'Cuando se registre, vas a verla acá.'}</p>
        </div>
      )}
    </section>
  );
}
