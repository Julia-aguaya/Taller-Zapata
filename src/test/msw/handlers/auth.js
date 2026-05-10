import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

// Fixture de usuario mockeado
const mockUser = {
  id: 1,
  email: 'test@tallereszapata.com',
  displayName: 'Usuario Test',
  firstName: 'Usuario',
  lastName: 'Test',
  role: 'admin',
  branch: 'Z',
};

// Fixture de sesión mockeada
export const mockSession = {
  accessToken: 'mock-access-token-12345',
  refreshToken: 'mock-refresh-token-67890',
  expiresInSeconds: 3600,
  user: mockUser,
};

export const authHandlers = [
  // POST /api/v1/auth/login
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = await request.json();
    const { email, password } = body;

    // Simular login exitoso
    if (email && password) {
      return HttpResponse.json(mockSession, {
        status: 200,
        headers: {
          'Set-Cookie': 'session=mock-session-cookie; Path=/; HttpOnly',
        },
      });
    }

    // Login fallido
    return HttpResponse.json(
      { message: 'Credenciales inválidas' },
      { status: 401 }
    );
  }),

  // GET /api/v1/auth/me
  http.get('/api/v1/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    // Verificar que tenga token
    if (!authHeader?.includes('mock-access-token')) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    return HttpResponse.json(mockUser, { status: 200 });
  }),

  // GET /api/v1/cases (para connectivity probe)
  http.get('/api/v1/cases', () => {
    return HttpResponse.json({ content: [], total: 0 }, { status: 200 });
  }),
];