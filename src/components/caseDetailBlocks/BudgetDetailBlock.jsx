export default function BudgetDetailBlock({ budgetState, money, formatDate, formatBackendState, getBackendStatusTone, StatusBadge }) {
  return (
    <section className="backend-detail-section backend-section-budget">
      <div className="stack-tight">
        <span className="backend-detail-section-kicker">Presupuesto</span>
        <h4>Estimación de reparación</h4>
      </div>

      {budgetState.status === 'loading' ? (
        <div className="backend-cases-empty" role="status" aria-live="polite"><strong>Estamos cargando el presupuesto de esta carpeta.</strong><p>{budgetState.detail || 'En unos instantes vas a ver los montos informados.'}</p></div>
      ) : budgetState.status === 'success' ? (
        <>
          <div className="backend-document-summary" role="list" aria-label="Resumen del presupuesto de la carpeta">
            <article className="backend-document-summary-card" role="listitem"><span>Total estimado</span><strong>{money(budgetState.data?.totalQuoted)}</strong><small>Incluye mano de obra e insumos informados para esta reparación.</small></article>
            <article className="backend-document-summary-card" role="listitem"><span>Mano de obra</span><strong>{money(budgetState.data?.laborWithVat)}</strong><small>Valor final con impuestos incluidos.</small></article>
            <article className="backend-document-summary-card" role="listitem"><span>Repuestos</span><strong>{money(budgetState.data?.partsTotal)}</strong><small>{budgetState.totalItems} tarea{budgetState.totalItems === 1 ? '' : 's'} visible{budgetState.totalItems === 1 ? '' : 's'} en esta vista.</small></article>
            <article className="backend-document-summary-card" role="listitem"><span>Tiempo estimado</span><strong>{budgetState.data?.estimatedDays ? `${budgetState.data.estimatedDays} día${budgetState.data.estimatedDays === 1 ? '' : 's'}` : '-'}</strong><small>{budgetState.data?.budgetDate ? `Actualizado el ${formatDate(budgetState.data.budgetDate)}` : 'Todavía no vemos una fecha visible.'}</small></article>
          </div>

          <div className="backend-budget-head">
            <div className="stack-tight"><span className="client-case-kicker">Estado del presupuesto</span><strong>{formatBackendState(budgetState.data?.reportStatusCode, 'Disponible')}</strong></div>
            <StatusBadge tone={getBackendStatusTone(budgetState.data?.reportStatusCode)}>Version {budgetState.data?.currentVersion || 1}</StatusBadge>
          </div>

          {budgetState.items.length > 0 ? (
            <div className="backend-budget-list backend-item-list-horizontal" role="list" aria-label="Detalle visible del presupuesto de la carpeta">
              {budgetState.items.slice(0, 4).map((budgetItem) => (
                <article className="backend-budget-card" key={budgetItem.id || `${budgetItem.visualOrder}-${budgetItem.affectedPiece}`} role="listitem">
                  <div className="backend-document-card-head">
                    <div className="stack-tight"><span className="client-case-kicker">{budgetItem.visualOrder ? `Paso ${budgetItem.visualOrder}` : 'Trabajo estimado'}</span><strong>{budgetItem.affectedPiece || 'Detalle pendiente'}</strong></div>
                    <StatusBadge tone={budgetItem.requiresReplacement ? 'warning' : 'success'}>{budgetItem.requiresReplacement ? 'Con reemplazo' : 'Sin reemplazo'}</StatusBadge>
                  </div>
                  <div className="backend-budget-meta" role="list" aria-label="Datos del item presupuestado">
                    <div className="backend-budget-meta-item" role="listitem"><span>Trabajo</span><strong>{formatBackendState(budgetItem.taskCode, 'A definir')}</strong></div>
                     <div className="backend-budget-meta-item" role="listitem"><span>Acción</span><strong>{formatBackendState(budgetItem.actionCode, 'A confirmar')}</strong></div>
                    <div className="backend-budget-meta-item" role="listitem"><span>Pieza</span><strong>{money(budgetItem.partValue)}</strong></div>
                    <div className="backend-budget-meta-item" role="listitem"><span>Mano de obra</span><strong>{money(budgetItem.laborAmount)}</strong></div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
             <div className="backend-cases-empty" role="status"><strong>Ya hay una estimación general cargada.</strong><p>El detalle por trabajo todavía no aparece disponible en esta vista.</p></div>
          )}
        </>
      ) : budgetState.status === 'error' ? (
        <div className="backend-cases-empty" role="status"><strong>No pudimos mostrar el presupuesto de esta carpeta.</strong><p>{budgetState.detail || 'Intentá nuevamente en unos instantes.'}</p></div>
      ) : (
        <div className="backend-cases-empty" role="status"><strong>Todavía no vemos una estimación cargada para esta carpeta.</strong><p>{budgetState.detail || 'Cuando el taller registre el presupuesto, lo vas a ver acá automáticamente.'}</p></div>
      )}

      {budgetState.detail && budgetState.status === 'success' ? (
        <div className="backend-detail-notice" role="status"><p>{budgetState.detail}</p></div>
      ) : null}
    </section>
  );
}
