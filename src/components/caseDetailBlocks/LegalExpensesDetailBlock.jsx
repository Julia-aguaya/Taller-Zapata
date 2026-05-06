export default function LegalExpensesDetailBlock({
  legalExpensesState,
  formatBackendState,
  formatDate,
  money,
  StatusBadge,
}) {
  return (
    <section className="backend-detail-section backend-section-legal-expenses">
      <div className="stack-tight">
        <span className="backend-detail-section-kicker">Gastos</span>
        <h4>Gastos legales</h4>
      </div>

      <div className="backend-document-summary" role="list" aria-label="Resumen de gastos legales">
        <article className="backend-document-summary-card" role="listitem">
          <span>Gastos</span>
          <strong>{legalExpensesState.total}</strong>
          <small>Registros económicos del frente legal.</small>
        </article>
      </div>

      {legalExpensesState.status === 'loading' ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>Estamos cargando los gastos legales.</strong>
          <p>{legalExpensesState.detail || 'En unos instantes vas a ver esta información.'}</p>
        </div>
      ) : legalExpensesState.status === 'success' ? (
        <div className="backend-appointment-list backend-item-list-horizontal" role="list" aria-label="Gastos legales de la carpeta">
          {legalExpensesState.items.slice(0, 6).map((expense, index) => (
            <article className="backend-appointment-card" key={expense.id || expense.publicId || `${expense.expenseDate || expense.createdAt || 'legal-expense'}-${index}`} role="listitem">
              <div className="backend-document-card-head">
                <div className="stack-tight">
                  <span className="client-case-kicker">{formatBackendState(expense.expenseTypeCode || expense.categoryCode || 'Gasto')}</span>
                  <strong>{expense.description || expense.reason || 'Gasto legal registrado'}</strong>
                </div>
                <StatusBadge tone="info">{formatDate(expense.expenseDate || expense.createdAt)}</StatusBadge>
              </div>
              <div className="backend-appointment-meta" role="list" aria-label="Datos del gasto legal">
                <div className="backend-appointment-meta-item" role="listitem"><span>Monto</span><strong>{money(expense.amount || expense.totalAmount || 0)}</strong></div>
                <div className="backend-appointment-meta-item" role="listitem"><span>Estado</span><strong>{formatBackendState(expense.statusCode, 'Sin dato')}</strong></div>
                <div className="backend-appointment-meta-item" role="listitem"><span>Referencia</span><strong>{expense.referenceNumber || expense.externalReference || '-'}</strong></div>
              </div>
            </article>
          ))}
        </div>
      ) : legalExpensesState.status === 'error' ? (
        <div className="backend-cases-empty" role="status">
          <strong>No pudimos mostrar los gastos legales de esta carpeta.</strong>
          <p>{legalExpensesState.detail || 'Intentá nuevamente en unos instantes.'}</p>
        </div>
      ) : (
        <div className="backend-cases-empty" role="status">
          <strong>Todavía no vemos gastos legales cargados para esta carpeta.</strong>
          <p>{legalExpensesState.detail || 'Cuando se registren, vas a verlos acá.'}</p>
        </div>
      )}
    </section>
  );
}
