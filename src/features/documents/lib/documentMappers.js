/**
 * documentMappers.js
 * Document data transformation utilities
 */

/**
 * Transform API document response to UI format
 */
export function mapDocumentToUI(apiDocument) {
  if (!apiDocument) return null;
  
  return {
    id: apiDocument.id,
    name: apiDocument.name || apiDocument.nombre || '',
    category: apiDocument.category || apiDocument.categoria || '',
    type: apiDocument.type || apiDocument.tipo || '',
    issueDate: apiDocument.issueDate || apiDocument.fechaEmision || null,
    principal: apiDocument.principal || apiDocument.esPrincipal || false,
    visibleToCustomer: apiDocument.visibleToCustomer || apiDocument.visibleCliente || false,
    fileName: apiDocument.fileName || apiDocument.nombreArchivo || '',
    fileSize: apiDocument.fileSize || apiDocument.tamanoArchivo || 0,
    mimeType: apiDocument.mimeType || apiDocument.tipoMime || '',
    uploadedAt: apiDocument.uploadedAt || apiDocument.fechaSubida || null,
    uploadedBy: apiDocument.uploadedBy || apiDocument.subidoPor || '',
  };
}

/**
 * Transform UI form data to API payload
 */
export function mapFormToApi(formData, file) {
  const payload = {
    nombre: formData.name?.trim(),
    categoria: formData.category,
    tipo: formData.type,
    fechaEmision: formData.issueDate || null,
    esPrincipal: formData.principal || false,
    visibleCliente: formData.visibleToCustomer || false,
  };
  
  if (file) {
    payload.archivo = file;
  }
  
  return payload;
}

/**
 * Transform document update to API payload
 */
export function mapUpdateToApi(updates) {
  const payload = {};
  
  if (updates.name !== undefined) {
    payload.nombre = updates.name.trim();
  }
  if (updates.category !== undefined) {
    payload.categoria = updates.category;
  }
  if (updates.type !== undefined) {
    payload.tipo = updates.type;
  }
  if (updates.issueDate !== undefined) {
    payload.fechaEmision = updates.issueDate;
  }
  if (updates.principal !== undefined) {
    payload.esPrincipal = updates.principal;
  }
  if (updates.visibleToCustomer !== undefined) {
    payload.visibleCliente = updates.visibleToCustomer;
  }
  
  return payload;
}

/**
 * Group documents by category
 */
export function groupDocumentsByCategory(documents) {
  if (!Array.isArray(documents)) return {};
  
  return documents.reduce((groups, doc) => {
    const category = doc.category || 'other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(doc);
    return groups;
  }, {});
}

/**
 * Sort documents by date (newest first)
 */
export function sortDocumentsByDate(documents, ascending = false) {
  if (!Array.isArray(documents)) return [];
  
  const sorted = [...documents].sort((a, b) => {
    const dateA = new Date(a.uploadedAt || 0);
    const dateB = new Date(b.uploadedAt || 0);
    return dateA.getTime() - dateB.getTime();
  });
  
  return ascending ? sorted : sorted.reverse();
}

/**
 * Filter documents by category
 */
export function filterDocumentsByCategory(documents, category) {
  if (!Array.isArray(documents)) return [];
  if (!category || category === 'all') return documents;
  
  return documents.filter((doc) => doc.category === category);
}

/**
 * Get document download URL
 */
export function getDocumentDownloadUrl(caseId, documentId) {
  return `/api/v1/cases/${caseId}/documents/${documentId}/download`;
}

/**
 * Build document preview URL
 */
export function getDocumentPreviewUrl(caseId, documentId) {
  return `/api/v1/cases/${caseId}/documents/${documentId}/preview`;
}