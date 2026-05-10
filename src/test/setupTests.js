import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';

// Import handlers de MSW
import { authHandlers } from './msw/handlers/auth.js';
import { casesHandlers } from './msw/handlers/cases.js';
import { caseDetailHandlers } from './msw/handlers/caseDetail.js';
import { documentsHandlers } from './msw/handlers/documents.js';
import { notificationsHandlers } from './msw/handlers/notifications.js';

// Configurar el servidor de MSW para tests de integración
export const server = setupServer(
  ...authHandlers,
  ...casesHandlers,
  ...caseDetailHandlers,
  ...documentsHandlers,
  ...notificationsHandlers
);

// Iniciar MSW antes de todos los tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reiniciar handlers después de cada test para limpiar estado
afterEach(() => server.resetHandlers());

// Cerrar MSW después de todos los tests
afterAll(() => server.close());

// Mock de window.location para tests de routing hash
const originalLocation = window.location;

beforeAll(() => {
  delete window.location;
  window.location = {
    href: 'http://localhost/',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
  };
});

afterAll(() => {
  window.location = originalLocation;
});

// Mock de console.error para filtrar warnings esperados en tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    // Ignorar warnings de React Testing Library sobre act()
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: An update to')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});