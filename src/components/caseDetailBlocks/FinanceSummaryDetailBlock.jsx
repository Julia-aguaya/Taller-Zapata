export default function FinanceSummaryDetailBlock({ financeSummaryState, money }) {
  return (
    <section className="backend-detail-section backend-section-finance-summary">
      <div className="stack-tight">
        <span className="backend-detail-section-kicker">Finanzas</span>
        <h4>Resumen financiero del caso</h4>
      </div>

      {financeSummaryState.status === 'loading' ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>Estamos cargando el resumen financiero de esta carpeta.</strong>
          <p>{financeSummaryState.detail || 'En unos instantes vas a ver los importes disponibles.'}</p>
        </div>
      ) : financeSummaryState.status === 'success' ? (
        <>
          <div className="backend-document-summary" role="list" aria-label="Resumen financiero de la carpeta">
            <article className="backend-document-summary-card" role="listitem"><span>Ingresos</span><strong>{money(financeSummaryState.data?.totalIngresos)}</strong><small>Total cobrado o registrado a favor de la carpeta.</small></article>
            <article className="backend-document-summary-card" role="listitem"><span>Egresos</span><strong>{money(financeSummaryState.data?.totalEgresos)}</strong><small>Total de pagos o costos asociados a la carpeta.</small></article>
            <article className="backend-document-summary-card" role="listitem"><span>Saldo</span><strong>{money(financeSummaryState.data?.saldo)}</strong><small>Resultado neto entre ingresos y egresos.</small></article>
            <article className="backend-document-summary-card" role="listitem"><span>Retenciones</span><strong>{money(financeSummaryState.data?.totalRetenciones)}</strong><small>Importes retenidos informados para la carpeta.</small></article>
            <article className="backend-document-summary-card" role="listitem"><span>Aplicado</span><strong>{money(financeSummaryState.data?.totalAplicado)}</strong><small>Total aplicado a conceptos del caso.</small></article>
          </div>

          {financeSummaryState.detail ? (
            <div className="backend-detail-notice" role="status">
              <p>{financeSummaryState.detail}</p>
            </div>
          ) : null}
        </>
      ) : financeSummaryState.status === 'error' ? (
        <div className="backend-cases-empty" role="status">
          <strong>No pudimos mostrar el resumen financiero de esta carpeta.</strong>
          <p>{financeSummaryState.detail || 'Intentá nuevamente en unos instantes.'}</p>
        </div>
      ) : (
        <div className="backend-cases-empty" role="status">
          <strong>Todavía no vemos información financiera para esta carpeta.</strong>
          <p>{financeSummaryState.detail || 'Cuando se registren movimientos, el resumen va a aparecer acá.'}</p>
        </div>
      )}
    </section>
  );
}
