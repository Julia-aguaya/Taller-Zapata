/**
 * Tests de builders de estado del detalle del caso
 * Estos tests validan la lógica de transformación de datos del backend.
 */

import { describe, it, expect } from 'vitest';

// Datos de prueba
const mockAppointments = [
  {
    id: 'apt-001',
    appointmentDate: '2026-02-01',
    appointmentTime: '09:00',
    status: 'confirmado',
    workshop: 'Taller Zapata',
    recipientName: 'Juan Perez',
    observations: 'Entrada por colisión',
  },
  {
    id: 'apt-002',
    appointmentDate: '2026-02-10',
    appointmentTime: '14:00',
    status: 'pendiente',
    workshop: 'Taller Zapata',
    recipientName: 'Juan Perez',
    observations: 'Revisión final',
  },
  {
    id: 'apt-003',
    appointmentDate: '2025-12-15',
    appointmentTime: '10:00',
    status: 'realizado',
    workshop: 'Taller Zapata',
    recipientName: 'Juan Perez',
    observations: 'Inspección inicial',
  },
];

const mockDocuments = [
  {
    documentId: 1,
    relationId: 1,
    fileName: 'presupuesto.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 245000,
    categoryId: 1,
    originCode: 'TALLER',
    visibleToCustomer: true,
    principal: true,
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    documentId: 2,
    relationId: 2,
    fileName: 'fotos_dano_1.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 1250000,
    categoryId: 2,
    originCode: 'CLIENTE',
    visibleToCustomer: false,
    principal: false,
    createdAt: '2026-01-14T18:00:00Z',
  },
];

// Funciones de builders (copiadas de App.jsx)
function getCaseAppointmentItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

function sortAppointmentsByDate(items) {
  return [...items].sort((left, right) => {
    const leftKey = `${left?.appointmentDate || '9999-12-31'}T${left?.appointmentTime || '23:59:59'}`;
    const rightKey = `${right?.appointmentDate || '9999-12-31'}T${right?.appointmentTime || '23:59:59'}`;
    return leftKey.localeCompare(rightKey);
  });
}

function buildCaseAppointmentsState(payload, fallbackDetail = '') {
  const items = sortAppointmentsByDate(getCaseAppointmentItems(payload));
  const today = new Date().toISOString().slice(0, 10);
  const upcomingAppointment = items.find((item) => item?.appointmentDate && item.appointmentDate >= today) || null;
  const nextAppointment = upcomingAppointment || items[items.length - 1] || null;
  const hasUpcomingAppointment = Boolean(upcomingAppointment);
  const detail = fallbackDetail || (items.length === 0
    ? 'Cuando haya un turno asignado para esta carpeta, lo vas a ver acá automáticamente.'
    : hasUpcomingAppointment
      ? 'Las fechas pueden actualizarse si el taller reprograma la recepción del vehículo.'
      : 'El último turno informado ya pasó. Si aparece una nueva fecha, la vas a ver acá automáticamente.');

  return {
    status: items.length > 0 ? 'success' : 'empty',
    items,
    total: items.length,
    nextAppointment,
    hasUpcomingAppointment,
    detail,
  };
}

function getCaseDocumentItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

function buildCaseDocumentsState(payload, fallbackDetail = '') {
  const items = getCaseDocumentItems(payload);
  const visibleCount = items.filter((item) => item?.visibleToCustomer).length;
  const hiddenCount = items.length - visibleCount;
  const detail = fallbackDetail || (items.length > 0
    ? 'Documentos cargados para esta carpeta.'
    : 'Cuando haya documentos disponibles, los vas a ver acá automáticamente.');

  return {
    status: items.length > 0 ? 'success' : 'empty',
    items,
    total: items.length,
    visibleCount,
    hiddenCount,
    detail,
  };
}

function buildRejectedCaseDocumentsState(error) {
  if (error?.httpStatus === 404) {
    return {
      status: 'empty',
      items: [],
      total: 0,
      visibleCount: 0,
      hiddenCount: 0,
      detail: 'No hay documentos cargados para esta carpeta.',
    };
  }
  return {
    status: 'error',
    items: [],
    total: 0,
    visibleCount: 0,
    hiddenCount: 0,
    detail: 'No pudimos cargar los documentos. Intentá nuevamente.',
  };
}

function getFriendlyCaseDocumentsMessage(error) {
  if (!error) return 'No pudimos traer la documentación de esta carpeta ahora.';
  if (error.httpStatus === 401 || error.httpStatus === 403) return 'Tu sesión no tiene permiso para ver esta documentación.';
  if (error.httpStatus === 404) return 'La documentación de esta carpeta no está disponible en este momento.';
  if (error.httpStatus >= 500) return 'Ahora no pudimos traer la documentación de la carpeta. Probá de nuevo.';
  return error.message || 'No pudimos traer la documentación de esta carpeta ahora.';
}

function formatDocumentSize(bytes) {
  if (!bytes || bytes === 0) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatDocumentAudience(doc) {
  return doc?.visibleToCustomer ? 'Visible' : 'Oculto';
}

function formatDocumentDescriptor(doc) {
  return `DOC-${doc?.documentId || '?'}`;
}

describe('CaseDetail - buildCaseAppointmentsState', () => {
  it('should return empty state when payload is null/undefined', () => {
    const result = buildCaseAppointmentsState(null);
    expect(result.status).toBe('empty');
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.nextAppointment).toBeNull();
    expect(result.hasUpcomingAppointment).toBe(false);
  });

  it('should return empty state when payload is empty array', () => {
    const result = buildCaseAppointmentsState([]);
    expect(result.status).toBe('empty');
    expect(result.items).toEqual([]);
  });

  it('should sort appointments by date ascending', () => {
    const result = buildCaseAppointmentsState(mockAppointments);
    expect(result.items[0].id).toBe('apt-003'); // 2025-12-15
    expect(result.items[1].id).toBe('apt-001'); // 2026-02-01
    expect(result.items[2].id).toBe('apt-002'); // 2026-02-10
  });

  it('should find next upcoming appointment', () => {
    const result = buildCaseAppointmentsState(mockAppointments);
    // Today's date is 2026-05-09 according to system
    // Both 2026-02-01 and 2026-02-10 are in the past
    // So nextAppointment should be the last one (2026-02-10)
    // And hasUpcomingAppointment should be false
    expect(result.hasUpcomingAppointment).toBe(false);
  });

  it('should correctly identify upcoming appointment when exists', () => {
    // Create appointments with future dates
    const futureAppointments = [
      { id: 'apt-future', appointmentDate: '2027-01-01', appointmentTime: '10:00' },
    ];
    const result = buildCaseAppointmentsState(futureAppointments);
    expect(result.hasUpcomingAppointment).toBe(true);
    expect(result.nextAppointment?.id).toBe('apt-future');
  });

  it('should provide appropriate detail message based on state', () => {
    const emptyResult = buildCaseAppointmentsState([]);
    expect(emptyResult.detail).toContain('turno');

    const pastResult = buildCaseAppointmentsState(mockAppointments);
    expect(pastResult.detail).toContain('pasó');
  });

  it('should count items correctly', () => {
    const result = buildCaseAppointmentsState(mockAppointments);
    expect(result.total).toBe(3);
  });

  it('should use fallback detail when provided', () => {
    const customDetail = 'Custom detail message';
    const result = buildCaseAppointmentsState(mockAppointments, customDetail);
    expect(result.detail).toBe(customDetail);
  });
});

describe('CaseDetail - buildCaseDocumentsState', () => {
  it('should return empty state when payload is null/undefined', () => {
    const result = buildCaseDocumentsState(null);
    expect(result.status).toBe('empty');
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('should count visible and hidden documents', () => {
    const result = buildCaseDocumentsState(mockDocuments);
    expect(result.visibleCount).toBe(1); // presupuesto.pdf is visible
    expect(result.hiddenCount).toBe(1); // fotos_dano_1.jpg is hidden
    expect(result.total).toBe(2);
  });

  it('should return success status when documents exist', () => {
    const result = buildCaseDocumentsState(mockDocuments);
    expect(result.status).toBe('success');
  });

  it('should return empty status when no documents', () => {
    const result = buildCaseDocumentsState([]);
    expect(result.status).toBe('empty');
  });

  it('should handle all documents visible', () => {
    const allVisible = mockDocuments.map((d) => ({ ...d, visibleToCustomer: true }));
    const result = buildCaseDocumentsState(allVisible);
    expect(result.visibleCount).toBe(2);
    expect(result.hiddenCount).toBe(0);
  });

  it('should handle all documents hidden', () => {
    const allHidden = mockDocuments.map((d) => ({ ...d, visibleToCustomer: false }));
    const result = buildCaseDocumentsState(allHidden);
    expect(result.visibleCount).toBe(0);
    expect(result.hiddenCount).toBe(2);
  });
});

describe('CaseDetail - buildRejectedCaseDocumentsState', () => {
  it('should return empty state for 404 error', () => {
    const result = buildRejectedCaseDocumentsState({ httpStatus: 404 });
    expect(result.status).toBe('empty');
  });

  it('should return error state for other errors', () => {
    const result = buildRejectedCaseDocumentsState({ httpStatus: 500 });
    expect(result.status).toBe('error');
  });

  it('should return error state when no specific error', () => {
    const result = buildRejectedCaseDocumentsState(null);
    expect(result.status).toBe('error');
  });
});

describe('CaseDetail - formatDocumentSize', () => {
  it('should return empty string for null/undefined/zero', () => {
    expect(formatDocumentSize(null)).toBe('');
    expect(formatDocumentSize(undefined)).toBe('');
    expect(formatDocumentSize(0)).toBe('');
  });

  it('should format in KB for small files', () => {
    expect(formatDocumentSize(500)).toBe('0 KB');
    expect(formatDocumentSize(1024)).toBe('1 KB');
    expect(formatDocumentSize(51200)).toBe('50 KB');
  });

  it('should format in MB for larger files', () => {
    expect(formatDocumentSize(1048576)).toBe('1.0 MB');
    expect(formatDocumentSize(2621440)).toBe('2.5 MB');
    expect(formatDocumentSize(15728640)).toBe('15.0 MB');
  });
});

describe('CaseDetail - formatDocumentAudience', () => {
  it('should return "Visible" when document is visible to customer', () => {
    expect(formatDocumentAudience({ visibleToCustomer: true })).toBe('Visible');
  });

  it('should return "Oculto" when document is hidden from customer', () => {
    expect(formatDocumentAudience({ visibleToCustomer: false })).toBe('Oculto');
  });
});

describe('CaseDetail - formatDocumentDescriptor', () => {
  it('should format document ID with prefix', () => {
    expect(formatDocumentDescriptor({ documentId: 1 })).toBe('DOC-1');
    expect(formatDocumentDescriptor({ documentId: 42 })).toBe('DOC-42');
  });

  it('should handle missing documentId', () => {
    expect(formatDocumentDescriptor({})).toBe('DOC-?');
    expect(formatDocumentDescriptor(null)).toBe('DOC-?');
  });
});