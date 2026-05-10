/**
 * Fixtures compartidos para tests E2E de Taller Zapata.
 * Cada test usa page.route() para interceptar APIs del backend.
 */

export const BASE_URL = 'http://localhost:5173';

// ─── Auth ────────────────────────────────────────
export const mockUser = {
  id: 1,
  email: 'admin@tallereszapata.com',
  displayName: 'Admin Test',
  firstName: 'Admin',
  lastName: 'Test',
  role: 'admin',
  branch: 'Z',
};

export const mockSession = {
  accessToken: 'e2e-mock-token-abc123',
  refreshToken: 'e2e-mock-refresh-xyz789',
  expiresInSeconds: 3600,
  user: mockUser,
  savedAt: new Date().toISOString(),
};

// ─── Cases ───────────────────────────────────────
export const mockCase = {
  id: 'e2e-case-001',
  folderCode: 'ZP-2026-0001',
  code: '0001PZ',
  currentCaseStateCode: 'en_tramite',
  caseType: 'Particular',
  counter: 1,
  claimNumber: '833612',
  branch: 'Z',
  openAt: '2026-03-12T00:00:00Z',
  createdAt: '2026-03-12',
  folderCreated: true,
  customer: {
    firstName: 'Juan',
    lastName: 'Perez',
    document: '20123456',
  },
  client: {
    firstName: 'Juan',
    lastName: 'Perez',
    document: '20123456',
    phone: '3414567890',
    email: 'juan@test.com',
  },
  vehicle: {
    brand: 'Toyota',
    model: 'Corolla',
    plate: 'ABC123',
    year: 2022,
    vin: 'VIN123',
    color: 'Blanco',
    transmission: 'Manual',
    vehicleType: 'Auto',
  },
  incident: {
    incidentDate: '2026-01-14',
    incidentLocation: 'Av. Siempreviva 742',
    description: 'Colision trasera',
  },
  priority: 'media',
  responsibleUserId: 1,
  pendingItemsCount: 2,
  nextSuggestedTask: 'Confirmar turno',
};

// ─── Mock API handlers ───────────────────────────

/**
 * Registra TODOS los handlers mock necesarios para que la app funcione en E2E.
 * Usa page.route() para interceptar fetch requests.
 */
export async function setupMockApi(page) {
  await page.route('**/api/v1/auth/login', async (route) => {
    const body = route.request().postDataJSON();
    if (body.password === 'wrong') {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Credenciales invalidas', httpStatus: 401 }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSession),
    });
  });

  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUser),
    });
  });

  await page.route('**/api/v1/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSession),
    });
  });

  await page.route('**/api/v1/cases**', async (route) => {
    const url = route.request().url();

    if (url.includes('/cases/catalogs')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ branches: [], states: [], priorities: [] }),
      });
      return;
    }

    if (url.includes('/cases/') && !url.includes('/cases?') && !url.includes('/cases/catalogs')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockCase,
          budget: { items: [], services: [], parts: [], accessories: [], settlement: null },
          repair: { parts: [], accessories: [], turno: { date: '', state: 'Pendiente' }, egreso: { date: '', shouldReenter: 'NO' } },
          payments: { paymentMethod: 'Transferencia', passedToPaymentsDate: '', paymentDate: '', invoices: [] },
          legal: { statusUpdates: [], expenses: [], closureItems: [], injured: [] },
          todoRisk: { processing: { quoteStatus: 'Pendiente' }, franchise: { status: '', recovery: '' }, cleas: { scope: '', dictamen: '' }, tasks: [], documents: [] },
          thirdParty: { participants: [], quoteRows: [], parts: [] },
          franchiseRecovery: { tramite: 'SINIESTRO', manager: '' },
        }),
      });
      return;
    }

    // Case list
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [mockCase], total: 1, page: 0, size: 10 }),
    });
  });

  // Notifications
  await page.route('**/api/v1/notifications**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], total: 0 }),
    });
  });

  // Catalogs (system, operation, finance, insurance, documents, tasks, companies)
  const catalogEndpoints = [
    'system-parameters', 'operation-catalogs', 'finance-catalogs',
    'insurance-catalogs', 'documents-catalogs', 'tasks',
    'insurance-companies',
  ];

  for (const endpoint of catalogEndpoints) {
    await page.route(`**/api/v1/${endpoint}**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
  }

  // Connectivity probe
  await page.route('**/api/v1/system/connectivity**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ connected: true }),
    });
  });

  // Catch-all for any other API calls
  await page.route('**/api/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });
}
