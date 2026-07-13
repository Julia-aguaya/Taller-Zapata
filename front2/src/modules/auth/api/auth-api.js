import { clearStoredAuth, readStoredAuth, saveStoredAuth } from '@/shared/auth/session-storage';
import { requestJson } from '@/shared/api/http-client';

export const loginRequest = async ({ email, password }) => {
  const payload = await requestJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, false);

  saveStoredAuth({
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    expiresInSeconds: payload.expiresInSeconds,
  });

  return payload;
};

export const logoutRequest = async () => {
  const stored = readStoredAuth();

  try {
    if (stored?.accessToken) {
      await requestJson('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: stored?.refreshToken ?? null,
          revokeAllSessions: false,
        }),
      }, false);
    }
  } finally {
    clearStoredAuth();
  }
};

export const getSessionBootstrap = () => requestJson('/auth/session');
