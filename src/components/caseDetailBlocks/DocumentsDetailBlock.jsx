import { useState } from 'react';

export default function DocumentsDetailBlock({
  documentsState,
  documentGroups,
  formatDate,
  formatDateTime,
  formatDocumentSize,
  formatDocumentDescriptor,
  formatDocumentAudience,
  onSaveDocument,
  onDownloadDocument,
  onPreviewDocument,
  isSavingDocuments,
  isDownloadingDocument,
  isPreviewingDocument,
  caseId,
  documentsCatalogs,
  StatusBadge,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMeta, setUploadMeta] = useState({
    categoryId: '1',
    subcategoryCode: '',
    documentDate: '',
    originCode: 'CLIENTE',
    observations: '',
    visibleToCustomer: true,
    principal: false,
    visualOrder: '1',
  });
  const [editingDocumentId, setEditingDocumentId] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [replacementFileByDocId, setReplacementFileByDocId] = useState({});
  const [draftMeta, setDraftMeta] = useState({
    categoryId: '1',
    subcategoryCode: '',
    documentDate: '',
    originCode: 'CLIENTE',
    observations: '',
    visibleToCustomer: true,
    principal: false,
    visualOrder: '1',
  });
  const categoryOptions = Array.isArray(documentsCatalogs?.categories)
    ? documentsCatalogs.categories.map((category) => ({ value: String(category.id), label: category.name || `Categoría ${category.id}` }))
    : [{ value: '1', label: 'Categoría 1' }];
  const categories = Array.isArray(documentsCatalogs?.categories) ? documentsCatalogs.categories : [];
  const originOptions = ['CLIENTE', 'ASEGURADORA', 'TALLER', 'ABOGADO', 'SISTEMA'];
  const existingSubcategories = Array.from(
    new Set(
      (documentsState.items || [])
        .map((entry) => String(entry.subcategoryCode || '').trim())
        .filter(Boolean),
    ),
  );
  const requiresDateForUploadCategory = Boolean(categories.find((entry) => String(entry.id) === String(uploadMeta.categoryId))?.requiresDate);

  const closePreviewDocument = () => {
    if (previewDocument?.blobUrl) {
      URL.revokeObjectURL(previewDocument.blobUrl);
    }
    setPreviewDocument(null);
  };

  return (
    <section className="backend-detail-section backend-section-documents">
      <div className="stack-tight"><span className="backend-detail-section-kicker">Documentos</span><h4>Archivos compartidos</h4></div>
      <div className="form-grid two-columns compact-grid" style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #e6edf2' }}>
        <label className="field" style={{ gridColumn: '1 / -1' }}>
          <span>Archivo</span>
          <input
            accept="*/*"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] || null;
              setSelectedFile(nextFile);
            }}
            type="file"
          />
        </label>
        <label className="field">
          <span>Categoría</span>
          <select
            onChange={(event) => setUploadMeta((current) => ({ ...current, categoryId: event.target.value }))}
            value={uploadMeta.categoryId}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Origen</span>
          <select
            onChange={(event) => setUploadMeta((current) => ({ ...current, originCode: event.target.value }))}
            value={uploadMeta.originCode}
          >
            {originOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Subcategoría</span>
          <input
            list="document-subcategory-suggestions"
            onChange={(event) => setUploadMeta((current) => ({ ...current, subcategoryCode: event.target.value }))}
            value={uploadMeta.subcategoryCode}
          />
        </label>
        <label className="field">
          <span>Fecha documento</span>
          <input
            onChange={(event) => setUploadMeta((current) => ({ ...current, documentDate: event.target.value }))}
            type="date"
            value={uploadMeta.documentDate}
          />
        </label>
        <label className="field">
          <span>Orden visual</span>
          <input
            onChange={(event) => setUploadMeta((current) => ({ ...current, visualOrder: event.target.value }))}
            type="number"
            value={uploadMeta.visualOrder}
          />
        </label>
        <label className="field" style={{ gridColumn: '1 / -1' }}>
          <span>Observaciones</span>
          <input
            onChange={(event) => setUploadMeta((current) => ({ ...current, observations: event.target.value }))}
            value={uploadMeta.observations}
          />
        </label>
        <div className="notification-card-actions" style={{ gridColumn: '1 / -1' }}>
          <button
            className="ghost-button"
            onClick={() => setUploadMeta((current) => ({ ...current, visibleToCustomer: !current.visibleToCustomer }))}
            type="button"
          >
            {uploadMeta.visibleToCustomer ? 'Visible cliente: SI' : 'Visible cliente: NO'}
          </button>
          <button
            className="ghost-button"
            onClick={() => setUploadMeta((current) => ({ ...current, principal: !current.principal }))}
            type="button"
          >
            {uploadMeta.principal ? 'Principal: SI' : 'Principal: NO'}
          </button>
          <button
            className="secondary-button"
            disabled={!selectedFile || isSavingDocuments || (requiresDateForUploadCategory && !uploadMeta.documentDate)}
            onClick={() => {
              if (requiresDateForUploadCategory && !uploadMeta.documentDate) {
                window.alert('La categoría seleccionada exige fecha de documento.');
                return;
              }
              void onSaveDocument?.({
                caseId,
                file: selectedFile,
                fileName: selectedFile?.name || 'documento',
                categoryId: Number(uploadMeta.categoryId) || 1,
                subcategoryCode: uploadMeta.subcategoryCode,
                documentDate: uploadMeta.documentDate,
                originCode: uploadMeta.originCode,
                observations: uploadMeta.observations,
                visibleToCustomer: uploadMeta.visibleToCustomer,
                principal: uploadMeta.principal,
                visualOrder: Number(uploadMeta.visualOrder) || 1,
              }).then((saved) => {
                if (!saved) return;
                setSelectedFile(null);
                setUploadMeta({
                  categoryId: uploadMeta.categoryId,
                  subcategoryCode: '',
                  documentDate: '',
                  originCode: uploadMeta.originCode,
                  observations: '',
                  visibleToCustomer: true,
                  principal: false,
                  visualOrder: '1',
                });
              });
            }}
            type="button"
          >
            {isSavingDocuments ? 'Guardando...' : 'Subir documento'}
          </button>
        </div>
      </div>
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
                  const lowerName = String(document.fileName || '').toLowerCase();
                  const lowerMime = String(document.mimeType || '').toLowerCase();
                  const canPreview = lowerMime.includes('pdf')
                    || lowerMime.startsWith('image/')
                    || /\.(pdf|png|jpe?g|webp|gif|bmp|svg)$/.test(lowerName);
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
                      <div className="notification-card-actions backend-document-actions" style={{ marginTop: 8 }}>
                        <button
                          className="ghost-button"
                          disabled={isSavingDocuments}
                          onClick={() => {
                            setEditingDocumentId((current) => {
                              if (current === document.documentId) return null;
                              setDraftMeta({
                                categoryId: String(document.categoryId || 1),
                                subcategoryCode: document.subcategoryCode || '',
                                documentDate: (document.documentDate || '').slice(0, 10),
                                originCode: document.originCode || 'CLIENTE',
                                observations: document.observations || '',
                                visibleToCustomer: Boolean(document.visibleToCustomer),
                                principal: Boolean(document.principal),
                                visualOrder: String(document.visualOrder || 1),
                              });
                              return document.documentId;
                            });
                          }}
                          type="button"
                        >
                          {editingDocumentId === document.documentId ? 'Cancelar edicion' : 'Editar documento'}
                        </button>
                        {canPreview ? (
                          <button
                            className="secondary-button"
                            disabled={isPreviewingDocument}
                            onClick={async () => {
                              const preview = await onPreviewDocument?.({ caseId, documentId: document.documentId });
                              if (preview?.blobUrl) {
                                setPreviewDocument({
                                  ...preview,
                                  description: document.fileName || `Documento ${document.documentId}`,
                                });
                              }
                            }}
                            type="button"
                          >
                            {isPreviewingDocument ? 'Abriendo...' : 'Vista previa'}
                          </button>
                        ) : null}
                        <button
                          className="ghost-button backend-document-download"
                          disabled={isDownloadingDocument}
                          onClick={() => {
                            void onDownloadDocument?.({ caseId, documentId: document.documentId });
                          }}
                          type="button"
                        >
                          {isDownloadingDocument ? 'Descargando...' : 'Descargar archivo'}
                        </button>
                        <button
                          className="ghost-button"
                          disabled={isSavingDocuments}
                          onClick={() => {
                            void onSaveDocument?.({
                              caseId,
                              documentId: document.documentId,
                              relationId: document.relationId,
                              categoryId: Number(document.categoryId) || 1,
                              subcategoryCode: document.subcategoryCode || '',
                              originCode: document.originCode || 'CLIENTE',
                              observations: document.observations || '',
                              visibleToCustomer: !document.visibleToCustomer,
                              principal: Boolean(document.principal),
                              visualOrder: Number(document.visualOrder) || 1,
                            });
                          }}
                          type="button"
                        >
                          {document.visibleToCustomer ? 'Ocultar a cliente' : 'Mostrar a cliente'}
                        </button>
                      </div>
                      {editingDocumentId === document.documentId ? (
                        <div className="form-grid two-columns compact-grid" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #e6edf2' }}>
                          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <small style={{ color: '#5f7481' }}>Edicion rapida del documento</small>
                            <small style={{ color: '#5f7481' }}>Doc #{document.documentId}</small>
                          </div>
                          <label className="field">
                            <span>Categoría</span>
                            <select
                              onChange={(event) => setDraftMeta((current) => ({ ...current, categoryId: event.target.value }))}
                              value={draftMeta.categoryId}
                            >
                              {categoryOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            <span>Subcategoría</span>
                            <input
                              list="document-subcategory-suggestions"
                              onChange={(event) => setDraftMeta((current) => ({ ...current, subcategoryCode: event.target.value }))}
                              value={draftMeta.subcategoryCode}
                            />
                            <datalist id="document-subcategory-suggestions">
                              {existingSubcategories.map((code) => (
                                <option key={code} value={code} />
                              ))}
                            </datalist>
                          </label>
                          <label className="field">
                            <span>Fecha documento</span>
                            <input
                              onChange={(event) => setDraftMeta((current) => ({ ...current, documentDate: event.target.value }))}
                              type="date"
                              value={draftMeta.documentDate}
                            />
                          </label>
                          <label className="field">
                            <span>Origen</span>
                            <select
                              onChange={(event) => setDraftMeta((current) => ({ ...current, originCode: event.target.value }))}
                              value={draftMeta.originCode}
                            >
                              {originOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            <span>Orden visual</span>
                            <input
                              onChange={(event) => setDraftMeta((current) => ({ ...current, visualOrder: event.target.value }))}
                              type="number"
                              value={draftMeta.visualOrder}
                            />
                          </label>
                          <label className="field" style={{ gridColumn: '1 / -1' }}>
                            <span>Observaciones</span>
                            <input
                              onChange={(event) => setDraftMeta((current) => ({ ...current, observations: event.target.value }))}
                              value={draftMeta.observations}
                            />
                          </label>
                          <div className="notification-card-actions" style={{ gridColumn: '1 / -1' }}>
                            {Boolean(categories.find((entry) => String(entry.id) === String(draftMeta.categoryId))?.requiresDate) && !draftMeta.documentDate ? (
                              <small style={{ color: '#9b1c1c' }}>Esta categoría exige fecha de documento.</small>
                            ) : null}
                            <button
                              className="secondary-button"
                              disabled={isSavingDocuments}
                              onClick={() => {
                                if (Boolean(categories.find((entry) => String(entry.id) === String(draftMeta.categoryId))?.requiresDate) && !draftMeta.documentDate) {
                                  window.alert('La categoría seleccionada exige fecha de documento.');
                                  return;
                                }
                                void onSaveDocument?.({
                                  caseId,
                                  documentId: document.documentId,
                                  relationId: document.relationId,
                                  categoryId: Number(draftMeta.categoryId) || 1,
                                  subcategoryCode: draftMeta.subcategoryCode,
                                  documentDate: draftMeta.documentDate,
                                  originCode: draftMeta.originCode,
                                  observations: draftMeta.observations,
                                  visibleToCustomer: draftMeta.visibleToCustomer,
                                  principal: draftMeta.principal,
                                  visualOrder: Number(draftMeta.visualOrder) || 1,
                                }).then((saved) => {
                                  if (!saved) return;
                                  setEditingDocumentId(null);
                                });
                              }}
                              type="button"
                            >
                              Guardar cambios
                            </button>
                            <button
                              className="ghost-button"
                              onClick={() => setDraftMeta((current) => ({ ...current, visibleToCustomer: !current.visibleToCustomer }))}
                              type="button"
                            >
                              {draftMeta.visibleToCustomer ? 'Visible cliente: SI' : 'Visible cliente: NO'}
                            </button>
                            <button
                              className="ghost-button"
                              onClick={() => setDraftMeta((current) => ({ ...current, principal: !current.principal }))}
                              type="button"
                            >
                              {draftMeta.principal ? 'Principal: SI' : 'Principal: NO'}
                            </button>
                            <input
                              accept="*/*"
                              onChange={(event) => {
                                const replacementFile = event.target.files?.[0] || null;
                                setReplacementFileByDocId((current) => ({ ...current, [document.documentId]: replacementFile }));
                              }}
                              type="file"
                            />
                            <button
                              className="ghost-button"
                              disabled={!replacementFileByDocId[document.documentId] || isSavingDocuments}
                              onClick={() => {
                                if (Boolean(categories.find((entry) => String(entry.id) === String(draftMeta.categoryId))?.requiresDate) && !draftMeta.documentDate) {
                                  window.alert('La categoría seleccionada exige fecha de documento.');
                                  return;
                                }
                                const replacementFile = replacementFileByDocId[document.documentId];
                                if (!replacementFile) return;
                                const confirmed = window.confirm('Vas a reemplazar el archivo actual de este documento. ¿Querés continuar?');
                                if (!confirmed) return;
                                void onSaveDocument?.({
                                  caseId,
                                  documentId: document.documentId,
                                  relationId: document.relationId,
                                  file: replacementFile,
                                  fileName: replacementFile.name,
                                  categoryId: Number(draftMeta.categoryId) || 1,
                                  subcategoryCode: draftMeta.subcategoryCode,
                                  documentDate: draftMeta.documentDate,
                                  originCode: draftMeta.originCode,
                                  observations: draftMeta.observations,
                                  visibleToCustomer: draftMeta.visibleToCustomer,
                                  principal: draftMeta.principal,
                                  visualOrder: Number(draftMeta.visualOrder) || 1,
                                }).then((saved) => {
                                  if (!saved) return;
                                  setReplacementFileByDocId((current) => ({ ...current, [document.documentId]: null }));
                                  setEditingDocumentId(null);
                                });
                              }}
                              type="button"
                            >
                              Reemplazar archivo
                            </button>
                          </div>
                        </div>
                      ) : null}
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

      {previewDocument ? (
        <div className="media-overlay" onClick={closePreviewDocument} role="presentation">
          <div aria-label={`Vista previa de ${previewDocument.fileName}`} aria-modal="true" className="media-modal document-preview-modal" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="media-modal-head">
              <div>
                <strong>{previewDocument.fileName}</strong>
                <p>Previsualización del archivo sin descargarlo a tu PC.</p>
              </div>
              <button className="ghost-button" onClick={closePreviewDocument} type="button">Cerrar</button>
            </div>

            {String(previewDocument.mimeType || '').includes('pdf') ? (
              <iframe className="document-preview-frame" src={previewDocument.blobUrl} title={previewDocument.fileName} />
            ) : (
              <img alt={previewDocument.fileName} src={previewDocument.blobUrl} />
            )}

            <div className="media-preview-actions">
              <a className="secondary-button button-link" href={previewDocument.blobUrl} rel="noreferrer" target="_blank">Abrir en pestaña nueva</a>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
