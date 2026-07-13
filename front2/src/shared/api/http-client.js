import { clearStoredAuth, readStoredAuth, saveStoredAuth } from '@/shared/auth/session-storage';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').trim();

class AuthExpiredError extends Error {
  constructor(message = 'La sesion vencio. Volve a iniciar sesion.') {
    super(message);
    this.name = 'AuthExpiredError';
  }
}

const readJson = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  return response.json();
};

const buildError = (response, payload, fallbackMessage) => {
  const detail = payload?.message || payload?.detail || payload?.error || fallbackMessage;
  const error = new Error(detail);
  error.httpStatus = response.status;
  error.payload = payload;
  return error;
};

const refreshAccessToken = async () => {
  const stored = readStoredAuth();
  if (!stored?.refreshToken) {
    throw new AuthExpiredError();
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken: stored.refreshToken }),
  });

  const payload = await readJson(response);
  if (!response.ok) {
    clearStoredAuth();
    throw new AuthExpiredError(payload?.message);
  }

  const nextSession = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    expiresInSeconds: payload.expiresInSeconds,
  };

  saveStoredAuth(nextSession);
  return nextSession.accessToken;
};

export const requestJson = async (path, options = {}, retryOnAuthError = true) => {
  const stored = readStoredAuth();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (stored?.accessToken) {
    headers.set('Authorization', `Bearer ${stored.accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && retryOnAuthError && stored?.refreshToken) {
    try {
      const refreshedAccessToken = await refreshAccessToken();
      return requestJson(path, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${refreshedAccessToken}`,
        },
      }, false);
    } catch (error) {
      clearStoredAuth();
      throw error;
    }
  }

  const payload = await readJson(response);
  if (!response.ok) {
    throw buildError(response, payload, 'No se pudo completar la solicitud');
  }

  return payload;
};

export { AuthExpiredError };
