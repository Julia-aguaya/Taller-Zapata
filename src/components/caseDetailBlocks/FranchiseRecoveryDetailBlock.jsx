export default function FranchiseRecoveryDetailBlock({
  franchiseRecoveryState,
  formatBackendState,
  formatDateTime,
  money,
  StatusBadge,
}) {
  const data = franchiseRecoveryState.data || {};
  const recoveredAmount = data.recoveredAmount ?? data.amountRecovered ?? data.totalRecovered ?? 0;
  const pendingAmount = data.pendingAmount ?? data.amountPending ?? data.totalPending ?? 0;

  return (
    <section className="backend-detail-section backend-section-franchise-recovery">
      <div className="stack-tight">
        <span className="backend-detail-section-kicker">Recupero</span>
        <h4>Recupero de franquicia</h4>
      </div>

      {franchiseRecoveryState.status === 'loading' ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>Estamos cargando el recupero de franquicia.</strong>
          <p>{franchiseRecoveryState.detail || 'En unos instantes vas a ver esta información.'}</p>
        </div>
      ) : franchiseRecoveryState.status === 'success' ? (
        <div className="backend-document-summary" role="list" aria-label="Resumen del recupero de franquicia">
          <article className="backend-document-summary-card" role="listitem">
            <span>Recuperado</span>
            <strong>{money(recoveredAmount)}</strong>
            <small>{franchiseRecoveryState.detail || 'Monto recuperado a la fecha para este caso.'}</small>
          </article>
          <article className="backend-document-summary-card" role="listitem">
            <span>Pendiente</span>
            <strong>{money(pendingAmount)}</strong>
            <small>Saldo pendiente de recupero.</small>
          </article>
          <article className="backend-document-summary-card" role="listitem">
            <span>Estado</span>
            <strong>{formatBackendState(data.statusCode, 'Sin dato')}</strong>
            <small><StatusBadge tone="info">Actualizado</StatusBadge></small>
          </article>
          <article className="backend-document-summary-card" role="listitem">
            <span>Última gestión</span>
            <strong>{data.updatedAt ? formatDateTime(data.updatedAt) : 'Sin fecha visible'}</strong>
            <small>Última actualización del recupero.</small>
          </article>
        </div>
      ) : franchiseRecoveryState.status === 'error' ? (
        <div className="backend-cases-empty" role="status">
          <strong>No pudimos mostrar el recupero de franquicia de esta carpeta.</strong>
          <p>{franchiseRecoveryState.detail || 'Intentá nuevamente en unos instantes.'}</p>
        </div>
      ) : (
        <div className="backend-cases-empty" role="status">
          <strong>Todavía no vemos recupero de franquicia para esta carpeta.</strong>
          <p>{franchiseRecoveryState.detail || 'Cuando se registre, vas a verlo acá.'}</p>
        </div>
      )}
    </section>
  );
}
