export function getFriendlyErrorMessage(error) {
  if (!error) {
    return 'Ocurrió un error inesperado. Intentá nuevamente en unos instantes.';
  }

  if (error.httpStatus === 401 || error.httpStatus === 403) {
    return 'Tu sesión no tiene permiso para realizar esta acción. Volvé a ingresar e intentá nuevamente.';
  }

  if (error.httpStatus === 404) {
    return 'El recurso solicitado no está disponible en este momento.';
  }

  if (error.httpStatus >= 500) {
    return 'El servicio no está disponible en este momento. Probá de nuevo en unos instantes.';
  }

  if (error.httpStatus === 0 || error.message?.includes('timeout')) {
    return 'La solicitud tardó demasiado. Revisá tu conexión e intentá nuevamente.';
  }

  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) {
    return 'No pudimos conectarnos al servidor. Revisá tu conexión a internet e intentá nuevamente.';
  }

  return error.message || 'Ocurrió un error inesperado. Intentá nuevamente en unos instantes.';
}