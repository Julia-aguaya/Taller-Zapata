import { http, HttpResponse } from 'msw';

// Fixture de casos de prueba
export const mockCases = [
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
  {
    id: 'case-003',
    folderCode: 'CE-2026-0001',
    currentCaseStateCode: 'cerrado',
    caseType: 'Terceros',
    branch: 'C',
    openAt: '2025-12-10T09:00:00Z',
    dueAt: null,
    vehicle: {
      plate: 'DEF456',
      brand: 'Ford',
      model: 'Focus',
    },
    client: {
      firstName: 'Carlos',
      lastName: 'Lopez',
    },
    priority: 'baja',
    responsibleUserId: 1,
    pendingItemsCount: 0,
    nextSuggestedTask: null,
  },
];

export const casesHandlers = [
  // GET /api/v1/cases
  http.get('/api/v1/cases', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const state = url.searchParams.get('state');
    const branch = url.searchParams.get('branch');
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);

    let filtered = [...mockCases];

    // Filtrar por búsqueda
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.folderCode.toLowerCase().includes(searchLower) ||
          c.client?.firstName?.toLowerCase().includes(searchLower) ||
          c.client?.lastName?.toLowerCase().includes(searchLower) ||
          c.vehicle?.plate?.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por estado
    if (state && state !== 'all') {
      filtered = filtered.filter((c) => c.currentCaseStateCode === state);
    }

    // Filtrar por sucursal
    if (branch && branch !== 'all') {
      filtered = filtered.filter((c) => c.branch === branch);
    }

    // Paginación
    const start = page * size;
    const paged = filtered.slice(start, start + size);

    return HttpResponse.json(
      {
        content: paged,
        total: filtered.length,
        page,
        size,
        totalPages: Math.ceil(filtered.length / size),
      },
      { status: 200 }
    );
  }),

  // GET /api/v1/cases/:id
  http.get('/api/v1/cases/:id', ({ params }) => {
    const found = mockCases.find((c) => c.id === params.id);
    if (!found) {
      return HttpResponse.json({ message: 'Caso no encontrado' }, { status: 404 });
    }
    return HttpResponse.json(found, { status: 200 });
  }),
];