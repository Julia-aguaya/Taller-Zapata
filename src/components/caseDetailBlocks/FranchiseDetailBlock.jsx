export default function FranchiseDetailBlock({ franchiseState, money, StatusBadge }) {
  const data = franchiseState.data || {};
  const franchiseAmount = data.franchiseAmount ?? data.amount ?? data.total ?? 0;
  const coveredAmount = data.coveredAmount ?? data.companyCoverageAmount ?? data.insurerAmount ?? 0;
  const customerAmount = data.customerAmount ?? data.customerPayAmount ?? data.differenceAmount ?? 0;

  return (
    <section className="backend-detail-section backend-section-franchise">
      <div className="stack-tight">
        <span className="backend-detail-section-kicker">Cobro</span>
        <h4>Franquicia del caso</h4>
      </div>

      {franchiseState.status === 'loading' ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>Estamos cargando la franquicia de esta carpeta.</strong>
          <p>{franchiseState.detail || 'En unos instantes vas a ver esta información.'}</p>
        </div>
      ) : franchiseState.status === 'success' ? (
        <div className="backend-document-summary" role="list" aria-label="Resumen de franquicia de la carpeta">
          <article className="backend-document-summary-card" role="listitem">
            <span>Franquicia</span>
            <strong>{money(franchiseAmount)}</strong>
            <small>{franchiseState.detail || 'Importe de franquicia informado para el caso.'}</small>
          </article>
          <article className="backend-document-summary-card" role="listitem">
            <span>Cobertura compañía</span>
            <strong>{money(coveredAmount)}</strong>
            <small>Parte cubierta por la compañía.</small>
          </article>
          <article className="backend-document-summary-card" role="listitem">
            <span>A cargo del cliente</span>
            <strong>{money(customerAmount)}</strong>
            <small>Diferencia estimada para este caso.</small>
          </article>
          <article className="backend-document-summary-card" role="listitem">
            <span>Estado</span>
            <strong>{data.statusCode || 'Visible'}</strong>
            <small><StatusBadge tone="info">Actualizado</StatusBadge></small>
          </article>
        </div>
      ) : franchiseState.status === 'error' ? (
        <div className="backend-cases-empty" role="status">
          <strong>No pudimos mostrar la franquicia de esta carpeta.</strong>
          <p>{franchiseState.detail || 'Intentá nuevamente en unos instantes.'}</p>
        </div>
      ) : (
        <div className="backend-cases-empty" role="status">
          <strong>Todavía no vemos franquicia cargada para esta carpeta.</strong>
          <p>{franchiseState.detail || 'Cuando esté registrada, vas a verla acá.'}</p>
        </div>
      )}
    </section>
  );
}
