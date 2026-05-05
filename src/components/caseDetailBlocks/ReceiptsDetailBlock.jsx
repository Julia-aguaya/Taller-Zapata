export default function ReceiptsDetailBlock({ receiptsState, formatBackendState, formatDate, formatDateTime, money, StatusBadge }) {
  return (
    <section className="backend-detail-section backend-section-receipts">
      <div className="stack-tight">
        <span className="backend-detail-section-kicker">Comprobantes</span>
        <h4>Recibos emitidos</h4>
      </div>

      <div className="backend-document-summary" role="list" aria-label="Resumen de comprobantes de la carpeta">
        <article className="backend-document-summary-card" role="listitem">
          <span>Comprobantes</span>
          <strong>{receiptsState.total}</strong>
          <small>Recibos o facturas emitidas para esta carpeta.</small>
        </article>
        <article className="backend-document-summary-card" role="listitem">
          <span>Última emisión</span>
          <strong>{receiptsState.latest?.issuedDate ? formatDate(receiptsState.latest.issuedDate) : '-'}</strong>
          <small>{receiptsState.latest?.receiptTypeCode ? formatBackendState(receiptsState.latest.receiptTypeCode) : 'Sin tipo visible.'}</small>
        </article>
      </div>

      {receiptsState.status === 'loading' ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>Estamos cargando los comprobantes de esta carpeta.</strong>
          <p>{receiptsState.detail || 'En unos instantes vas a ver los recibos disponibles.'}</p>
        </div>
      ) : receiptsState.status === 'success' ? (
        <div className="backend-appointment-list backend-item-list-horizontal" role="list" aria-label="Comprobantes de la carpeta">
          {receiptsState.items.slice(0, 6).map((receipt) => (
            <article className="backend-appointment-card" key={receipt.id || receipt.publicId} role="listitem">
              <div className="backend-document-card-head">
                <div className="stack-tight">
                  <span className="client-case-kicker">{formatBackendState(receipt.receiptTypeCode, 'Comprobante')}</span>
                  <strong>{receipt.receiptNumber || 'Sin número visible'}</strong>
                </div>
                <StatusBadge tone="info">{receipt.issuedDate ? formatDate(receipt.issuedDate) : 'Sin fecha visible'}</StatusBadge>
              </div>

              <div className="backend-appointment-meta" role="list" aria-label="Datos del comprobante">
                <div className="backend-appointment-meta-item" role="listitem"><span>Total</span><strong>{money(receipt.total)}</strong></div>
                <div className="backend-appointment-meta-item" role="listitem"><span>Neto</span><strong>{money(receipt.taxableNet)}</strong></div>
                <div className="backend-appointment-meta-item" role="listitem"><span>IVA</span><strong>{money(receipt.vatAmount)}</strong></div>
              </div>

              <div className="backend-appointment-meta" role="list" aria-label="Datos del receptor del comprobante">
                <div className="backend-appointment-meta-item" role="listitem"><span>Receptor</span><strong>{receipt.receiverBusinessName || 'Sin dato visible'}</strong></div>
                <div className="backend-appointment-meta-item" role="listitem"><span>Conformidad</span><strong>{receipt.signedAt ? formatDateTime(receipt.signedAt) : 'Sin firma visible'}</strong></div>
                <div className="backend-appointment-meta-item" role="listitem"><span>Respaldo</span><strong>{receipt.documentId ? `Documento #${receipt.documentId}` : 'Sin documento asociado'}</strong></div>
              </div>

              {receipt.notes ? <p className="backend-appointment-note">{receipt.notes}</p> : null}
            </article>
          ))}
        </div>
      ) : receiptsState.status === 'error' ? (
        <div className="backend-cases-empty" role="status">
          <strong>No pudimos mostrar los comprobantes de esta carpeta.</strong>
          <p>{receiptsState.detail || 'Intentá nuevamente en unos instantes.'}</p>
        </div>
      ) : (
        <div className="backend-cases-empty" role="status">
          <strong>Todavía no vemos comprobantes emitidos para esta carpeta.</strong>
          <p>{receiptsState.detail || 'Cuando se emita un comprobante, lo vas a ver acá.'}</p>
        </div>
      )}
    </section>
  );
}
