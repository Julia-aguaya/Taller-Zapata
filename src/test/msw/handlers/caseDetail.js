import { http, HttpResponse } from 'msw';

// Fixture de detalle de caso
export const mockCaseDetail = {
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

// Workflow
export const mockWorkflowHistory = [
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

export const mockWorkflowActions = [
  { code: 'confirmar_turno', label: 'Confirmar turno', requiresObservation: false },
  { code: 'actualizar_estado', label: 'Actualizar estado', requiresObservation: true },
  { code: 'cerrar_caso', label: 'Cerrar caso', requiresObservation: true },
];

// Appointments
export const mockAppointments = [
  {
    id: 'apt-001',
    appointmentDate: '2026-02-01',
    appointmentTime: '09:00',
    status: 'confirmado',
    workshop: 'Taller Zapata',
    recipientName: 'Juan Perez',
    observations: 'Entrada por碰撞',
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

export const caseDetailHandlers = [
  // GET /api/v1/cases/:id
  http.get('/api/v1/cases/:id', ({ params }) => {
    if (params.id === 'error-500') {
      return HttpResponse.json({ message: 'Error interno' }, { status: 500 });
    }
    if (params.id === 'error-404') {
      return HttpResponse.json({ message: 'Caso no encontrado' }, { status: 404 });
    }
    return HttpResponse.json(mockCaseDetail, { status: 200 });
  }),

  // GET /api/v1/cases/:id/workflow/history
  http.get('/api/v1/cases/:id/workflow/history', ({ params }) => {
    if (params.id === 'empty') {
      return HttpResponse.json([], { status: 200 });
    }
    return HttpResponse.json(mockWorkflowHistory, { status: 200 });
  }),

  // GET /api/v1/cases/:id/workflow/actions
  http.get('/api/v1/cases/:id/workflow/actions', () => {
    return HttpResponse.json({ actions: mockWorkflowActions }, { status: 200 });
  }),

  // GET /api/v1/cases/:id/appointments
  http.get('/api/v1/cases/:id/appointments', ({ params }) => {
    if (params.id === 'no-appointments') {
      return HttpResponse.json([], { status: 200 });
    }
    return HttpResponse.json(mockAppointments, { status: 200 });
  }),

  // GET /api/v1/cases/:id/audit/events
  http.get('/api/v1/cases/:id/audit/events', () => {
    return HttpResponse.json(
      [
        {
          id: 'evt-1',
          eventType: 'case_created',
          occurredAt: '2026-01-15T10:00:00Z',
          performedBy: 'Usuario Test',
          detail: 'Caso creado',
        },
      ],
      { status: 200 }
    );
  }),

  // GET /api/v1/cases/:id/relations
  http.get('/api/v1/cases/:id/relations', () => {
    return HttpResponse.json([], { status: 200 });
  }),

  // GET /api/v1/cases/:id/insurance
  http.get('/api/v1/cases/:id/insurance', () => {
    return HttpResponse.json(null, { status: 200 });
  }),

  // GET /api/v1/cases/:id/documents
  http.get('/api/v1/cases/:id/documents', () => {
    return HttpResponse.json(
      [
        {
          documentId: 1,
          relationId: 1,
          fileName: 'presupuesto.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 245000,
          categoryId: 1,
          categoryName: 'Presupuesto',
          originCode: 'TALLER',
          visibleToCustomer: true,
          principal: true,
          createdAt: '2026-01-20T10:00:00Z',
        },
      ],
      { status: 200 }
    );
  }),
];