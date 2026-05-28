import { FRANCHISE_RECOVERY_TRAMITE } from '../../newCase/constants/formOptions';
import { normalizeLookupText } from './caseNormalizers';

const FRONTEND_CASE_TYPES = {
  PARTICULAR: 'Particular',
  TODO_RIESGO: 'Todo Riesgo',
  CLEAS: 'CLEAS / Terceros / Franquicia',
  RECLAMO_TERCEROS_TALLER: 'Reclamo de Tercero - Taller',
  RECLAMO_TERCEROS_ABOGADO: 'Reclamo de Tercero - Abogado',
  RECUPERO_FRANQUICIA: FRANCHISE_RECOVERY_TRAMITE,
};

function normalizeCaseTypeCode(value) {
  return String(value || '').trim().toUpperCase();
}

export function inferTramiteTypeFromBackendCase(item) {
  const code = normalizeCaseTypeCode(item?.caseTypeCode || item?.caseType);
  if (FRONTEND_CASE_TYPES[code]) {
    return FRONTEND_CASE_TYPES[code];
  }

  const normalized = normalizeLookupText(item?.caseTypeName || item?.caseType || item?.tramiteType);
  if (normalized.includes('todo riesgo')) return FRONTEND_CASE_TYPES.TODO_RIESGO;
  if (normalized.includes('cleas')) return FRONTEND_CASE_TYPES.CLEAS;
  if (normalized.includes('reclamo de tercero') && normalized.includes('abogado')) return FRONTEND_CASE_TYPES.RECLAMO_TERCEROS_ABOGADO;
  if (normalized.includes('reclamo de tercero') && normalized.includes('taller')) return FRONTEND_CASE_TYPES.RECLAMO_TERCEROS_TALLER;
  if (normalized.includes('recupero') && normalized.includes('franquicia')) return FRONTEND_CASE_TYPES.RECUPERO_FRANQUICIA;
  return item?.tramiteType || item?.caseTypeName || item?.caseType || FRONTEND_CASE_TYPES.PARTICULAR;
}

export function resolveFrontendCaseTypeCatalogEntry(entries = [], frontendType = '') {
  const expectedType = String(frontendType || '').trim();
  if (!expectedType) {
    return null;
  }

  const normalizedExpected = normalizeLookupText(expectedType);
  return entries.find((entry) => {
    const candidates = [entry?.name, entry?.label, entry?.description, FRONTEND_CASE_TYPES[normalizeCaseTypeCode(entry?.code)]]
      .filter(Boolean)
      .map((value) => normalizeLookupText(value));
    return candidates.includes(normalizedExpected);
  }) || null;
}
