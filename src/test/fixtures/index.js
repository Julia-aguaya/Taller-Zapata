/**
 * Fixtures de prueba para el frontend.
 * Estos datos se usan en los tests de integración y unitarios.
 */

// ==================== AUTH ====================

export const user = {
  id: 1,
  email: 'test@tallereszapata.com',
  displayName: 'Usuario Test',
  firstName: 'Usuario',
  lastName: 'Test',
  role: 'admin',
  branch: 'Z',
};

export const session = {
  accessToken: 'mock-access-token-12345',
  refreshToken: 'mock-refresh-token-67890',
  expiresInSeconds: 3600,
  user,
  savedAt: '2026-01-15T10:00:00.000Z',
};

export const invalidCredentialsError = {
  message: 'El email o la contraseña no coinciden. Revisalos e intentá nuevamente.',
  httpStatus: 401,
};

// ==================== CASES ====================

export const caseList = [
  {
    id: 'case-001',
    folderCode: 'ZP-2026-0001',
    currentCaseStateCode: 'en_tramite',
    caseType: 'Particular',
    branch: 'Z',
    openAt: '2026-01-15T10:00:00Z',
    dueAt: '2026-02-15T10:00:00Z',
    vehicle: {
      plate: 'ABC123',
      brand: 'Chevrolet',
      model: 'Cruze',
    },
    client: {
      firstName: 'Juan',
      lastName: 'Perez',
      document: '20123456789',
    },
    priority: 'media',
    responsibleUserId: 1,
    pendingItemsCount: 2,
    nextSuggestedTask: 'Confirmar turno con cliente',
  },
  {
    id: 'case-002',
    folderCode: 'ZP-2026-0002',
    currentCaseStateCode: 'esperando_aprobacion',
    caseType: 'Todo Riesgo',
    branch: 'Z',
    openAt: '2026-02-01T14:30:00Z',
    dueAt: '2026-03-01T14:30:00Z',
    vehicle: {
      plate: 'XYZ987',
      brand: 'Toyota',
      model: 'Corolla',
    },
    client: {
      firstName: 'Maria',
      lastName: 'Gonzalez',
      email: 'maria@example.com',
    },
    priority: 'alta',
    responsibleUserId: 2,
    pendingItemsCount: 5,
    nextSuggestedTask: 'Esperar aprobación de presupuesto',
  },
];

export const caseFilters = {
  search: '',
  state: 'all',
  branch: 'all',
  page: 0,
  size: 10,
};

// ==================== CASE DETAIL ====================

export const caseDetail = {
  id: 'case-001',
  folderCode: 'ZP-2026-0001',
  currentCaseStateCode: 'en_tramite',
  caseType: 'Particular',
  branch: 'Z',
  openAt: '2026-01-15T10:00:00Z',
  dueAt: '2026-02-15T10:00:00Z',
  incident: {
    incidentDate: '2026-01-14T16:30:00Z',
    incidentLocation: 'Av. Pellegrini 1500, Rosario',
    description: 'Colisión trasera en semáforo',
  },
  vehicle: {
    plate: 'ABC123',
    brand: 'Chevrolet',
    model: 'Cruze LTZ',
    year: 2022,
    vin: '8AGJX6820NR123456',
    color: 'Gris',
    transmission: 'Automática',
  },
  client: {
    firstName: 'Juan',
    lastName: 'Perez',
    document: '20123456789',
    phone: '3414567890',
    email: 'juan.perez@example.com',
  },
  priority: 'media',
  responsibleUserId: 1,
};

export const appointments = [
  {
    id: 'apt-001',
    appointmentDate: '2026-02-01',
    appointmentTime: '09:00',
    status: 'confirmado',
    workshop: 'Taller Zapata',
    recipientName: 'Juan Perez',
    observations: 'Entrada por collision',
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
];

export const workflowHistory = [
  {
    id: 'wf-1',
    fromState: 'nuevo',
    toState: 'en_tramite',
    transitionCode: 'iniciar_tramite',
    performedBy: 'Usuario Test',
    performedAt: '2026-01-15T10:30:00Z',
    observation: 'Caso iniciado',
  },
  {
    id: 'wf-2',
    fromState: 'en_tramite',
    toState: 'esperando_aprobacion',
    transitionCode: 'enviar_presupuesto',
    performedBy: 'Usuario Test',
    performedAt: '2026-01-20T14:00:00Z',
    observation: 'Presupuesto enviado al cliente',
  },
];

export const workflowActions = [
  { code: 'confirmar_turno', label: 'Confirmar turno', requiresObservation: false },
  { code: 'actualizar_estado', label: 'Actualizar estado', requiresObservation: true },
  { code: 'cerrar_caso', label: 'Cerrar caso', requiresObservation: true },
];

// ==================== DOCUMENTS ====================

export const documents = [
  {
    documentId: 1,
    relationId: 1,
    fileName: 'presupuesto.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 245000,
    categoryId: 1,
    categoryName: 'Presupuesto',
    subcategoryCode: 'reparacion',
    originCode: 'TALLER',
    originLabel: 'Taller',
    documentDate: '2026-01-20',
    visibleToCustomer: true,
    principal: true,
    createdAt: '2026-01-20T10:00:00Z',
    createdBy: 'Usuario Test',
  },
  {
    documentId: 2,
    relationId: 2,
    fileName: 'fotos_dano_1.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 1250000,
    categoryId: 2,
    categoryName: 'Evidencia',
    subcategoryCode: 'fotos',
    originCode: 'CLIENTE',
    originLabel: 'Cliente',
    documentDate: '2026-01-14',
    visibleToCustomer: false,
    principal: false,
    createdAt: '2026-01-14T18:00:00Z',
    createdBy: 'Sistema',
  },
];

export const documentsCatalogs = {
  categories: [
    { id: 1, name: 'Presupuesto', requiresDate: true },
    { id: 2, name: 'Evidencia', requiresDate: false },
    { id: 3, name: 'Seguro', requiresDate: true },
    { id: 4, name: 'Personal', requiresDate: false },
    { id: 5, name: 'Vehículo', requiresDate: false },
  ],
};

// ==================== NOTIFICATIONS ====================

export const notifications = [
  {
    id: 1,
    title: 'Presupuesto aprobado',
    message: 'El cliente aprobó el presupuesto del caso ZP-2026-0001',
    type: 'success',
    read: false,
    createdAt: '2026-01-25T10:00:00Z',
    caseId: 'case-001',
  },
  {
    id: 2,
    title: 'Turno confirmado',
    message: 'El turno para el 01/02/2026 fue confirmado por el cliente',
    type: 'info',
    read: false,
    createdAt: '2026-01-24T14:30:00Z',
    caseId: 'case-001',
  },
  {
    id: 3,
    title: 'Documentación pendiente',
    message: 'Faltan subir fotos del vehículo para el caso ZP-2026-0002',
    type: 'warning',
    read: true,
    createdAt: '2026-01-22T09:15:00Z',
    caseId: 'case-002',
  },
];

// ==================== HELPERS ====================

export const emptyListResponse = {
  content: [],
  total: 0,
  page: 0,
  size: 10,
  totalPages: 0,
};

export const errorResponse = (message, status = 400) => ({
  message,
  status,
});

export const notFoundResponse = {
  message: 'Recurso no encontrado',
  status: 404,
};

export const unauthorizedResponse = {
  message: 'No autorizado',
  status: 401,
};

export const serverErrorResponse = {
  message: 'Error interno del servidor',
  status: 500,
};