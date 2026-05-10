/**
 * Tests de autenticación - Helpers puros
 * Estos tests validan la lógica de autenticación independiente de la UI.
 */

import { describe, it, expect } from 'vitest';

// Copiar las funciones de App.jsx para testearlas
// Cuando se extraigan a un módulo propio, estos tests se moverán allí.

function getFriendlyAuthMessage(error) {
  if (!error) {
    return 'No pudimos iniciar sesión. Intentá nuevamente en unos instantes.';
  }

  if (error.httpStatus === 401 || error.httpStatus === 403) {
    return 'El email o la contraseña no coinciden. Revisalos e intentá de nuevo.';
  }

  if (error.httpStatus >= 500) {
    return 'Ahora no pudimos validar tu acceso. Probá de nuevo en unos instantes.';
  }

  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) {
    return 'No pudimos conectarnos para validar tu acceso. Revisá tu conexión e intentá nuevamente.';
  }

  return error.message || 'No pudimos iniciar sesión. Intentá nuevamente en unos instantes.';
}

function getSessionLabel(session) {
  return session?.user?.displayName || session?.user?.email || 'Usuario autenticado';
}

// Función de App.jsx para testear - usa slice(-8)
function maskToken(value) {
  if (!value) {
    return 'Sesión no iniciada';
  }

  if (value.length <= 24) {
    return value;
  }

  return `${value.slice(0, 16)}...${value.slice(-8)}`;
}

function formatProbeCheckedAt(value, idleMessage = 'Todavía no verificamos la conexión.') {
  if (!value) {
    return idleMessage;
  }

  return `Último intento ${new Date(value).toLocaleTimeString('es-AR')}`;
}

describe('Auth - getFriendlyAuthMessage', () => {
  it('should return default message when error is null/undefined', () => {
    expect(getFriendlyAuthMessage(null)).toBe(
      'No pudimos iniciar sesión. Intentá nuevamente en unos instantes.'
    );
    expect(getFriendlyAuthMessage(undefined)).toBe(
      'No pudimos iniciar sesión. Intentá nuevamente en unos instantes.'
    );
  });

  it('should return credential error message for 401 status', () => {
    const error = { httpStatus: 401 };
    expect(getFriendlyAuthMessage(error)).toBe(
      'El email o la contraseña no coinciden. Revisalos e intentá de nuevo.'
    );
  });

  it('should return credential error message for 403 status', () => {
    const error = { httpStatus: 403 };
    expect(getFriendlyAuthMessage(error)).toBe(
      'El email o la contraseña no coinciden. Revisalos e intentá de nuevo.'
    );
  });

  it('should return server error message for 500+ status', () => {
    const error = { httpStatus: 500 };
    expect(getFriendlyAuthMessage(error)).toBe(
      'Ahora no pudimos validar tu acceso. Probá de nuevo en unos instantes.'
    );
  });

  it('should return server error message for 502 status', () => {
    const error = { httpStatus: 502 };
    expect(getFriendlyAuthMessage(error)).toBe(
      'Ahora no pudimos validar tu acceso. Probá de nuevo en unos instantes.'
    );
  });

  it('should return network error message for fetch errors', () => {
    const error = { message: 'Failed to fetch' };
    expect(getFriendlyAuthMessage(error)).toBe(
      'No pudimos conectarnos para validar tu acceso. Revisá tu conexión e intentá nuevamente.'
    );
  });

  it('should return network error message for network errors', () => {
    const error = { message: 'Network error' };
    expect(getFriendlyAuthMessage(error)).toBe(
      'No pudimos conectarnos para validar tu acceso. Revisá tu conexión e intentá nuevamente.'
    );
  });

  it('should return raw message when no specific pattern matches', () => {
    const error = { message: 'Something unexpected happened' };
    expect(getFriendlyAuthMessage(error)).toBe('Something unexpected happened');
  });
});

describe('Auth - getSessionLabel', () => {
  it('should return displayName when available', () => {
    const session = { user: { displayName: 'Pablo Zapata' } };
    expect(getSessionLabel(session)).toBe('Pablo Zapata');
  });

  it('should return email when displayName is not available', () => {
    const session = { user: { email: 'pablo@tallereszapata.com' } };
    expect(getSessionLabel(session)).toBe('pablo@tallereszapata.com');
  });

  it('should return default label when session is empty', () => {
    expect(getSessionLabel({})).toBe('Usuario autenticado');
    expect(getSessionLabel(null)).toBe('Usuario autenticado');
    expect(getSessionLabel({ user: {} })).toBe('Usuario autenticado');
  });
});

describe('Auth - maskToken', () => {
  it('should return "Sesión no iniciada" for null/undefined', () => {
    expect(maskToken(null)).toBe('Sesión no iniciada');
    expect(maskToken(undefined)).toBe('Sesión no iniciada');
    expect(maskToken('')).toBe('Sesión no iniciada');
  });

  it('should return token as-is when length <= 24', () => {
    const shortToken = 'abc123';
    expect(maskToken(shortToken)).toBe('abc123');

    const exact24Token = '123456789012345678901234'; // 24 chars
    expect(maskToken(exact24Token)).toBe('123456789012345678901234');
  });

  it('should mask long tokens', () => {
    const longToken = 'very-long-token-that-should-be-masked';
    const result = maskToken(longToken);
    
    // Should be masked: first 16 chars + "..." + last 8 chars = 27 total
    // "very-long-token-" (16) + "..." (3) + "e-masked" (8) = 27
    expect(result).toBe('very-long-token-...e-masked');
  });
});

describe('Auth - formatProbeCheckedAt', () => {
  it('should return idle message when value is null/undefined', () => {
    expect(formatProbeCheckedAt(null)).toBe('Todavía no verificamos la conexión.');
    expect(formatProbeCheckedAt(undefined)).toBe('Todavía no verificamos la conexión.');
    expect(formatProbeCheckedAt('')).toBe('Todavía no verificamos la conexión.');
  });

  it('should return formatted time when value exists', () => {
    // Create a date with known time
    const testDate = new Date('2026-01-15T14:30:00Z');

    // Note: toLocaleTimeString depends on locale, so we just verify it contains "Último intento"
    const result = formatProbeCheckedAt(testDate.toISOString());
    expect(result).toContain('Último intento');
  });

  it('should use custom idle message when provided', () => {
    const customMessage = 'Esperando verificación...';
    expect(formatProbeCheckedAt(null, customMessage)).toBe(customMessage);
  });
});