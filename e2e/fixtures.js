/**
 * Fixtures compartidos para tests E2E de Taller Zapata.
 * Usa UN SOLO page.route('**\/api/v1/**') con dispatch interno por URL
 * para evitar el bug de prioridad de Playwright (última ruta registrada gana).
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

// ─── Mock API handler (single route, internal dispatch) ──────────

/**
 * Registra TODOS los handlers mock necesarios para que la app funcione en E2E.
 * Usa UN SOLO page.route('**\/api/v1/**') con dispatch interno para evitar
 * el bug de prioridad de Playwright donde la catch-all sobreescribe rutas especificas.
 */
export async function setupMockApi(page) {
  await page.route('**/api/v1/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // ── Auth endpoints ──
    if (url.includes('/auth/login')) {
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
      return;
    }

    if (url.includes('/auth/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
      return;
    }

    if (url.includes('/auth/session')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSession),
      });
      return;
    }

    // ── Cases ──
    if (url.includes('/cases/catalogs')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ branches: [], states: [], priorities: [] }),
      });
      return;
    }

    // Case detail (URL contains /cases/ followed by a UUID or numeric ID)
    if (url.match(/\/cases\/[a-f0-9-]{20,}/) || url.match(/\/cases\/\d+/)) {
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
    if (url.includes('/cases')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [mockCase], total: 1, page: 0, size: 10 }),
      });
      return;
    }

    // ── Notifications ──
    if (url.includes('/notifications')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], total: 0 }),
      });
      return;
    }

    // ── System / catalogs ──
    if (url.includes('/system/parameters')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    if (url.includes('/system/connectivity')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ connected: true }),
      });
      return;
    }

    if (url.includes('/operation/catalogs')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    if (url.includes('/finance/catalogs')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    if (url.includes('/insurance/catalogs') || url.includes('/insurance/companies')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    if (url.includes('/documents/catalogs')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    if (url.includes('/tasks')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    // ── Catch-all ──
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });
}
