function getCaseRelationsItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

export function buildCaseRelationsState(payload, fallbackDetail = '') {
  const items = getCaseRelationsItems(payload);
  return {
    status: items.length > 0 ? 'success' : 'empty',
    items,
    total: items.length,
    detail: fallbackDetail || (items.length > 0
      ? 'Vínculos registrados para esta carpeta.'
      : 'Cuando se registren vínculos, vas a verlos acá.'),
  };
}

export function buildRejectedCaseRelationsState(error) {
  const friendlyMessage = getFriendlyCaseRelationsMessage(error);
  if (error?.httpStatus === 404) {
    return { status: 'empty', items: [], total: 0, detail: friendlyMessage };
  }
  return { status: 'error', items: [], total: 0, detail: friendlyMessage };
}

function getFriendlyCaseRelationsMessage(error) {
  if (!error) return 'No pudimos traer los vínculos de esta carpeta ahora.';
  if (error.httpStatus === 401 || error.httpStatus === 403) return 'Tu sesión no tiene permiso para ver los vínculos de esta carpeta.';
  if (error.httpStatus === 404) return 'No hay vínculos registrados para esta carpeta.';
  if (error.httpStatus >= 500) return 'Ahora no pudimos traer los vínculos de la carpeta. Probá de nuevo en unos instantes.';
  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) return 'No pudimos conectarnos para traer los vínculos. Revisá que el sistema esté disponible.';
  return error.message || 'No pudimos traer los vínculos de esta carpeta ahora.';
}

export function buildCaseInsuranceState(payload, fallbackDetail = '') {
  return {
    status: payload ? 'success' : 'empty',
    data: payload || null,
    detail: fallbackDetail || (payload
      ? 'Datos de cobertura informados para esta carpeta.'
      : 'Cuando se registre la cobertura, vas a verla acá.'),
  };
}

export function buildRejectedCaseInsuranceState(error) {
  const friendlyMessage = getFriendlyCaseInsuranceMessage(error);
  if (error?.httpStatus === 404) {
    return { status: 'empty', data: null, detail: friendlyMessage };
  }
  return { status: 'error', data: null, detail: friendlyMessage };
}

function getFriendlyCaseInsuranceMessage(error) {
  if (!error) return 'No pudimos traer la cobertura de esta carpeta ahora.';
  if (error.httpStatus === 401 || error.httpStatus === 403) return 'Tu sesión no tiene permiso para ver la cobertura de esta carpeta.';
  if (error.httpStatus === 404) return 'Todavía no vemos cobertura cargada para esta carpeta.';
  if (error.httpStatus >= 500) return 'Ahora no pudimos traer la cobertura de esta carpeta. Probá de nuevo en unos instantes.';
  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) return 'No pudimos conectarnos para traer la cobertura. Revisá que el sistema esté disponible.';
  return error.message || 'No pudimos traer la cobertura de esta carpeta ahora.';
}

export function buildCaseLegalState(payload, fallbackDetail = '') {
  return {
    status: payload ? 'success' : 'empty',
    data: payload || null,
    detail: fallbackDetail || (payload
      ? 'Información legal vinculada al caso.'
      : 'Cuando haya datos legales, vas a verlos acá.'),
  };
}

export function buildRejectedCaseLegalState(error) {
  const friendlyMessage = getFriendlyCaseLegalMessage(error);
  if (error?.httpStatus === 404) {
    return { status: 'empty', data: null, detail: friendlyMessage };
  }
  return { status: 'error', data: null, detail: friendlyMessage };
}

function getFriendlyCaseLegalMessage(error) {
  if (!error) return 'No pudimos traer los datos legales de esta carpeta ahora.';
  if (error.httpStatus === 401 || error.httpStatus === 403) return 'Tu sesión no tiene permiso para ver los datos legales de esta carpeta.';
  if (error.httpStatus === 404) return 'No hay datos legales vinculados a esta carpeta.';
  if (error.httpStatus >= 500) return 'Ahora no pudimos traer los datos legales. Probá de nuevo en unos instantes.';
  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) return 'No pudimos conectarnos para traer los datos legales. Revisá que el sistema esté disponible.';
  return error.message || 'No pudimos traer los datos legales de esta carpeta ahora.';
}

export function buildCaseFinanceSummaryState(payload, fallbackDetail = '') {
  const summary = payload || null;
  const hasData = Boolean(summary);
  const detail = fallbackDetail || (hasData
    ? 'Estos valores cambian cuando se registran movimientos, retenciones o aplicaciones del caso.'
    : 'Cuando haya datos financieros cargados para esta carpeta, vas a ver el resumen acá.');

  return {
    status: hasData ? 'success' : 'empty',
    data: summary,
    detail,
  };
}

export function buildRejectedCaseFinanceSummaryState(error) {
  const friendlyMessage = getFriendlyCaseFinanceSummaryMessage(error);
  if (error?.httpStatus === 404) {
    return {
      status: 'empty',
      data: null,
      detail: friendlyMessage,
    };
  }

  return {
    status: 'error',
    data: null,
    detail: friendlyMessage,
  };
}

function getFriendlyCaseFinanceSummaryMessage(error) {
  if (!error) return 'No pudimos traer el resumen financiero de esta carpeta ahora.';
  if (error.httpStatus === 401 || error.httpStatus === 403) return 'Tu sesión no tiene permiso para ver el resumen financiero de esta carpeta.';
  if (error.httpStatus === 404) return 'No hay datos financieros cargados para esta carpeta.';
  if (error.httpStatus >= 500) return 'Ahora no pudimos traer el resumen financiero. Probá de nuevo en unos instantes.';
  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) return 'No pudimos conectarnos para traer el resumen financiero. Revisá que el sistema esté disponible.';
  return error.message || 'No pudimos traer el resumen financiero de esta carpeta ahora.';
}