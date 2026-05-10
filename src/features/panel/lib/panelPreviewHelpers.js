import { formatBackendState } from '../../cases/lib/caseFormatters';
import { formatWorkflowDomain } from '../../case-detail/lib/caseWorkflowUtils';

export function formatNotificationType(typeCode) {
  const normalized = String(typeCode || '').trim().toLowerCase();

  if (!normalized) {
    return 'Aviso';
  }

  const labels = {
    documentacion_vencida: 'Documentacion',
    turno_proximo: 'Turno',
    caso_actualizado: 'Carpeta',
    pago_acreditado: 'Cobro',
    tarea_vencida: 'Pendiente',
  };

  return labels[normalized] || formatBackendState(normalized, 'Aviso');
}

export function getNotificationTone(typeCode) {
  const normalized = String(typeCode || '').trim().toLowerCase();

  if (/(error|rechaz|vencid|atras)/.test(normalized)) {
    return 'danger';
  }

  if (/(pago|acredit|resuelt|cerrad)/.test(normalized)) {
    return 'success';
  }

  if (/(turno|document|tarea|caso|carpeta)/.test(normalized)) {
    return 'warning';
  }

  return 'info';
}

export function getWorkflowActionAudienceCopy(action) {
  if (!action?.targetStateName) {
    return 'Proximo paso disponible';
  }

  return `${formatWorkflowDomain(action.domain)}: ${action.targetStateName}`;
}

function formatDocumentOrigin(originCode) {
  const normalized = String(originCode || '').trim().toLowerCase();

  if (!normalized) {
    return 'Documento';
  }

  const labels = {
    operacion: 'Seguimiento',
    tramite: 'Tramite',
    documentacion: 'Documentacion',
    seguro: 'Seguro',
    legal: 'Gestión legal',
    finanza: 'Cobro',
    finanzas: 'Cobro',
  };

  return labels[normalized] || formatBackendState(normalized, 'Documento');
}

export function formatDocumentAudience(document) {
  if (document?.principal) {
    return 'Importante';
  }

  if (document?.visibleToCustomer) {
    return 'Disponible';
  }

  return 'Registrado';
}

export function formatDocumentDescriptor(document) {
  const mimeType = String(document?.mimeType || '').trim().toLowerCase();
  const fileName = String(document?.fileName || '').trim();
  const extension = fileName.includes('.') ? fileName.split('.').pop().toUpperCase() : '';

  if (mimeType === 'application/pdf') {
    return 'PDF';
  }

  if (mimeType.startsWith('image/')) {
    return extension ? `Imagen ${extension}` : 'Imagen';
  }

  if (mimeType.includes('word')) {
    return 'Documento Word';
  }

  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return 'Planilla';
  }

  if (mimeType.includes('zip') || mimeType.includes('compressed')) {
    return 'Archivo comprimido';
  }

  return extension || 'Archivo';
}

export function groupDocumentsByOrigin(documents) {
  const groups = new Map();

  documents.forEach((document) => {
    const key = formatDocumentOrigin(document?.originCode);
    const bucket = groups.get(key) || [];
    bucket.push(document);
    groups.set(key, bucket);
  });

  return Array.from(groups.entries()).map(([origin, items]) => ({
    origin,
    items,
  }));
}

export function formatDocumentSize(sizeBytes) {
  const size = Number(sizeBytes || 0);

  if (!Number.isFinite(size) || size <= 0) {
    return '';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatAppointmentTime(time) {
  if (!time) {
    return 'Horario a confirmar';
  }

  return String(time).slice(0, 5);
}

export function getAppointmentStatusTone(statusCode) {
  const normalized = String(statusCode || '').trim().toLowerCase();

  if (/(confirm|complet|cerrad)/.test(normalized)) {
    return 'success';
  }

  if (/(reprogram|pend|espera)/.test(normalized)) {
    return 'warning';
  }

  if (/(cancel|error|rechaz)/.test(normalized)) {
    return 'danger';
  }

  return 'info';
}

export function getBackendCaseKey(item) {
  return item.folderCode || item.publicId || item.id || 'Caso sin código';
}

export function getBackendCaseDetailHeadline(item) {
  return item.folderCode || item.publicId || (item.id ? `Caso ${item.id}` : 'Carpeta sin identificador');
}

export function getCaseClientLabel(item) {
  const directName = item?.customerName || item?.claimantName || item?.insuredName || item?.holderName || item?.ownerName;
  if (directName) return directName;

  const parts = [item?.lastName, item?.firstName].filter(Boolean);
  if (parts.length) return parts.join(', ');

  return 'Cliente no informado';
}
