import { normalizeLookupText } from './caseNormalizers';

const TECHNICAL_FIELD_MESSAGES = {
  partsautorizationcode: {
    label: 'autorizacion de repuestos',
    location: 'Gestion del tramite',
  },
  partsauthorizationcode: {
    label: 'autorizacion de repuestos',
    location: 'Gestion del tramite',
  },
  reportstatuscode: {
    label: 'estado del informe',
    location: 'Presupuesto',
  },
};

function getTechnicalValidationMessage(rawMessage) {
  const normalizedMessage = normalizeLookupText(rawMessage);
  if (!normalizedMessage) return '';

  const matchedEntry = Object.entries(TECHNICAL_FIELD_MESSAGES).find(([technicalField]) => normalizedMessage.includes(technicalField));
  if (!matchedEntry) return '';

  const [, metadata] = matchedEntry;
  const invalidValuePattern = /no permitido|not allowed|invalid|invalido|incorrecto|unsupported/;

  if (invalidValuePattern.test(normalizedMessage)) {
    return `Revisa ${metadata.location}: la ${metadata.label} que intentas guardar no es valida.`;
  }

  return `Revisa ${metadata.location}: falta completar o corregir la ${metadata.label}.`;
}

export function getFriendlyErrorMessage(error) {
  if (!error) {
    return 'Ocurrió un error inesperado. Intentá nuevamente en unos instantes.';
  }

  const technicalValidationMessage = getTechnicalValidationMessage(error.message);
  if (technicalValidationMessage) {
    return technicalValidationMessage;
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
