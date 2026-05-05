export default function DocumentsDetailBlock({
  documentsState,
  documentGroups,
  formatDate,
  formatDateTime,
  formatDocumentSize,
  formatDocumentDescriptor,
  formatDocumentAudience,
  StatusBadge,
}) {
  return (
    <section className="backend-detail-section backend-section-documents">
      <div className="stack-tight"><span className="backend-detail-section-kicker">Documentos</span><h4>Archivos compartidos</h4></div>
      <div className="backend-document-summary" role="list" aria-label="Resumen de documentos de la carpeta">
        <article className="backend-document-summary-card" role="listitem"><span>Archivos visibles</span><strong>{documentsState.visibleCount}</strong><small>Mostramos los archivos disponibles para seguir esta carpeta.</small></article>
        <article className="backend-document-summary-card" role="listitem"><span>Total registrados</span><strong>{documentsState.total}</strong><small>Es el total informado para esta carpeta.</small></article>
      </div>

      {documentsState.status === 'success' ? (
        <div className="backend-document-groups">
          {documentGroups.map((group) => (
            <div className="backend-document-group" key={group.origin}>
              <div className="backend-document-group-head"><strong>{group.origin}</strong><small>{group.items.length} archivo{group.items.length === 1 ? '' : 's'}</small></div>
              <div className="backend-document-list backend-item-list-horizontal" role="list" aria-label={`Documentos ${group.origin.toLowerCase()} de la carpeta`}>
                {group.items.map((document) => {
                  const documentDateLabel = document.documentDate ? `Fecha ${formatDate(document.documentDate)}` : document.createdAt ? `Compartido ${formatDateTime(document.createdAt)}` : '';
                  const documentSizeLabel = formatDocumentSize(document.sizeBytes);
                  return (
                    <article className="backend-document-card" key={document.relationId || document.documentId} role="listitem">
                      <div className="backend-document-card-head">
                        <div className="stack-tight"><span className="client-case-kicker">{formatDocumentDescriptor(document)}</span><strong>{document.fileName || `Documento ${document.documentId}`}</strong></div>
                        <StatusBadge tone={document.principal ? 'info' : 'success'}>{formatDocumentAudience(document)}</StatusBadge>
                      </div>
                      <div className="backend-document-meta">
                        {documentDateLabel ? <small>{documentDateLabel}</small> : null}
                        {documentSizeLabel ? <small>{documentSizeLabel}</small> : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : documentsState.status === 'error' ? (
        <div className="backend-cases-empty" role="status"><strong>No pudimos mostrar los archivos de esta carpeta.</strong><p>{documentsState.detail || 'Intentá nuevamente en unos instantes.'}</p></div>
      ) : (
        <div className="backend-cases-empty" role="status">
          <strong>{documentsState.hiddenCount > 0 ? 'Todavía no hay archivos listos para compartir.' : 'Todavía no vemos archivos cargados para esta carpeta.'}</strong>
          <p>{documentsState.hiddenCount > 0 ? `Ya hay ${documentsState.hiddenCount} archivo${documentsState.hiddenCount === 1 ? '' : 's'} registrado${documentsState.hiddenCount === 1 ? '' : 's'}, pero el equipo todavía no lo${documentsState.hiddenCount === 1 ? '' : 's'} dejó visible${documentsState.hiddenCount === 1 ? '' : 's'} para esta vista.` : 'Cuando haya documentos disponibles, los vas a ver acá automáticamente.'}</p>
        </div>
      )}

      {documentsState.detail && documentsState.status !== 'error' ? (
        <div className="backend-detail-notice" role="status"><p>{documentsState.detail}</p></div>
      ) : null}
    </section>
  );
}
