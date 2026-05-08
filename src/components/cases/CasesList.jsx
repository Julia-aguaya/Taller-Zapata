export default function CasesList({
  detailState,
  filteredItems,
  formatBackendState,
  getBackendBranchLabel,
  getBackendCaseKey,
  getBackendStatusTone,
  onOpenCase,
  onOpenDetail,
  StatusBadge,
}) {
  return (
    <div className="client-cases-grid" role="list" aria-label="Listado de carpetas">
      {filteredItems.map((item) => {
        const caseState = formatBackendState(item.currentCaseStateCode);
        const repairState = formatBackendState(item.currentRepairStateCode);
        const paymentState = formatBackendState(item.currentPaymentStateCode);

        return (
          <article className="client-case-card" key={getBackendCaseKey(item)} role="listitem">
            <div className="client-case-header">
              <div className="stack-tight">
                <span className="client-case-kicker">Carpeta</span>
                <h3>{getBackendCaseKey(item)}</h3>
              </div>
              <StatusBadge tone="info">{getBackendBranchLabel(item)}</StatusBadge>
            </div>

            <div className="client-case-states">
              <div className="client-case-state-row">
                <span>Trámite</span>
                <StatusBadge tone={getBackendStatusTone(caseState)}>{caseState}</StatusBadge>
              </div>
              <div className="client-case-state-row">
                <span>Reparación</span>
                <StatusBadge tone={getBackendStatusTone(repairState)}>{repairState}</StatusBadge>
              </div>
              <div className="client-case-state-row">
                <span>Cobro</span>
                <StatusBadge tone={getBackendStatusTone(paymentState)}>{paymentState}</StatusBadge>
              </div>
            </div>

            <div className="client-case-actions">
              <button className="primary-button" onClick={() => { onOpenCase?.(item); }} type="button">
                Abrir carpeta
              </button>
              <button className="secondary-button" onClick={() => { void onOpenDetail(item); }} type="button">
                {detailState.item?.id === item.id && detailState.status === 'loading' ? 'Cargando detalle...' : 'Ver detalle'}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
