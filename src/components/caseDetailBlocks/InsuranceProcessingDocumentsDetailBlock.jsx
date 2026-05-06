export default function InsuranceProcessingDocumentsDetailBlock({
  insuranceProcessingDocumentsState,
  formatDate,
  formatDateTime,
  formatDocumentAudience,
  formatDocumentDescriptor,
  formatDocumentSize,
  StatusBadge,
}) {
  return (
    <section className="backend-detail-section backend-section-insurance-processing-documents">
      <div className="stack-tight">
        <span className="backend-detail-section-kicker">Documentación</span>
        <h4>Documentos del trámite con la compañía</h4>
      </div>

      <div className="backend-document-summary" role="list" aria-label="Resumen de documentos del trámite con la compañía">
        <article className="backend-document-summary-card" role="listitem">
          <span>Documentos</span>
          <strong>{insuranceProcessingDocumentsState.total}</strong>
          <small>Archivos asociados a la gestión con la compañía.</small>
        </article>
      </div>

      {insuranceProcessingDocumentsState.status === 'loading' ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>Estamos cargando los documentos del trámite.</strong>
          <p>{insuranceProcessingDocumentsState.detail || 'En unos instantes vas a ver esta información.'}</p>
        </div>
      ) : insuranceProcessingDocumentsState.status === 'success' ? (
        <div className="backend-document-list backend-item-list-horizontal" role="list" aria-label="Documentos del trámite con la compañía">
          {insuranceProcessingDocumentsState.items.slice(0, 6).map((document, index) => (
            <article className="backend-document-card" key={document.documentId || document.relationId || document.publicId || `${document.fileName || 'doc'}-${index}`} role="listitem">
              <div className="backend-document-card-head">
                <div className="stack-tight">
                  <span className="client-case-kicker">{formatDocumentDescriptor(document)}</span>
                  <strong>{document.fileName || 'Archivo sin nombre visible'}</strong>
                </div>
                <StatusBadge tone={document.visibleToCustomer ? 'success' : 'neutral'}>{formatDocumentAudience(document)}</StatusBadge>
              </div>
              <div className="backend-document-meta" role="list" aria-label="Datos del documento del trámite">
                <div className="backend-document-meta-item" role="listitem"><span>Tamaño</span><strong>{formatDocumentSize(document.sizeBytes)}</strong></div>
                <div className="backend-document-meta-item" role="listitem"><span>Fecha doc.</span><strong>{formatDate(document.documentDate)}</strong></div>
                <div className="backend-document-meta-item" role="listitem"><span>Cargado</span><strong>{formatDateTime(document.createdAt)}</strong></div>
              </div>
            </article>
          ))}
        </div>
      ) : insuranceProcessingDocumentsState.status === 'error' ? (
        <div className="backend-cases-empty" role="status">
          <strong>No pudimos mostrar los documentos del trámite con la compañía.</strong>
          <p>{insuranceProcessingDocumentsState.detail || 'Intentá nuevamente en unos instantes.'}</p>
        </div>
      ) : (
        <div className="backend-cases-empty" role="status">
          <strong>Todavía no vemos documentos del trámite con la compañía.</strong>
          <p>{insuranceProcessingDocumentsState.detail || 'Cuando se carguen, vas a verlos acá.'}</p>
        </div>
      )}
    </section>
  );
}
