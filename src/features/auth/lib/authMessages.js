/**
 * Auth error messages
 * Human-friendly error messages for authentication flows
 */

export function getAuthErrorMessage(error) {
  if (!error) {
    return 'Ocurrió un error al iniciar sesión. Intentá nuevamente.';
  }

  if (error.httpStatus === 401) {
    return 'Credenciales inválidas. Verificá tu email y contraseña.';
  }

  if (error.httpStatus === 403) {
    return 'Tu cuenta no tiene permiso para acceder. Contactá al administrador.';
  }

  if (error.httpStatus >= 500) {
    return 'El servicio de autenticación no está disponible. Intentá más tarde.';
  }

  if (error.httpStatus === 0 || error.message?.includes('timeout')) {
    return 'La conexión tardó demasiado. Revisá tu internet e intentá nuevamente.';
  }

  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) {
    return 'No pudimos conectar con el servidor. Verificá tu conexión.';
  }

  return error.message || 'Error al iniciar sesión. Intentá nuevamente.';
}

export function getSessionExpiredMessage() {
  return 'Tu sesión expiró. Por favor, iniciá sesión nuevamente.';
}

export function getLogoutSuccessMessage() {
  return 'Sesión cerrada correctamente.';
}

export function getSessionLabel(session) {
  return session?.user?.displayName || session?.user?.email || 'Usuario autenticado';
}