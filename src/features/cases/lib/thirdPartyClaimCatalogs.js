/**
 * Mapeo entre los valores de UI del reclamo de terceros y los codigos de catalogo del backend.
 *
 * - estados_documentacion_terceros: PENDIENTE / EN_REVISION / ACEPTADA / RECHAZADA
 * - modos_provision_repuestos: TALLER / TERCERO / COMPANIA / NO_APLICA
 *
 * El boton manual de documentacion maneja Completa/Incompleta y el desplegable de
 * provision de repuestos usa los labels 'Provee Cia.' / 'Provee Taller' / 'Provee cliente'.
 * Enviar el label crudo al backend termina en ConflictException de validacion de catalogo.
 */
const DOCUMENTATION_STATUS_LABEL_BY_CODE = {
  ACEPTADA: 'Completa',
  PENDIENTE: 'Incompleta',
  EN_REVISION: 'Incompleta',
  RECHAZADA: 'Incompleta',
};

const DOCUMENTATION_STATUS_CODE_BY_LABEL = {
  Completa: 'ACEPTADA',
  Incompleta: 'PENDIENTE',
};

const PARTS_PROVIDER_LABEL_BY_CODE = {
  TALLER: 'Provee Taller',
  COMPANIA: 'Provee Cía.',
  TERCERO: 'Provee cliente',
  // La UI no representa "no aplica": cae al default de provision sin taller.
  NO_APLICA: 'Provee Cía.',
};

const PARTS_PROVIDER_CODE_BY_LABEL = {
  'Provee Taller': 'TALLER',
  'Provee Cía.': 'COMPANIA',
  'Provee cliente': 'TERCERO',
};

const DOCUMENTATION_CODES = new Set(Object.keys(DOCUMENTATION_STATUS_LABEL_BY_CODE));
const PARTS_PROVIDER_CODES = new Set(Object.keys(PARTS_PROVIDER_LABEL_BY_CODE));

function trimValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/** Codigo de catalogo -> label de UI para el estado de documentacion (null si no es reconocible). */
export function thirdPartyDocumentationStatusLabel(code) {
  const normalized = trimValue(code).toUpperCase();
  return DOCUMENTATION_STATUS_LABEL_BY_CODE[normalized] || null;
}

/** Label de UI (o codigo legado) -> codigo de catalogo del estado de documentacion. */
export function thirdPartyDocumentationStatusCode(value) {
  const trimmed = trimValue(value);
  if (!trimmed) return null;
  const byLabel = DOCUMENTATION_STATUS_CODE_BY_LABEL[trimmed];
  if (byLabel) return byLabel;
  const asCode = trimmed.toUpperCase();
  return DOCUMENTATION_CODES.has(asCode) ? asCode : null;
}

/** Codigo de catalogo -> label de UI para el modo de provision de repuestos. */
export function thirdPartyPartsProviderLabel(code) {
  const normalized = trimValue(code).toUpperCase();
  return PARTS_PROVIDER_LABEL_BY_CODE[normalized] || null;
}

/** Label de UI (o codigo legado) -> codigo de catalogo del modo de provision de repuestos. */
export function thirdPartyPartsProviderCode(value) {
  const trimmed = trimValue(value);
  if (!trimmed) return null;
  const byLabel = PARTS_PROVIDER_CODE_BY_LABEL[trimmed];
  if (byLabel) return byLabel;
  const asCode = trimmed.toUpperCase();
  return PARTS_PROVIDER_CODES.has(asCode) ? asCode : null;
}

/** Resuelve el id de la compania de la contraparte a partir del texto de la UI (nombre o codigo). */
export function resolveThirdPartyCompanyId(text, companies = []) {
  const normalized = trimValue(text).toLowerCase();
  if (!normalized) return null;
  const matched = companies.find((company) => {
    const byName = trimValue(company?.name).toLowerCase();
    const byCode = trimValue(company?.code).toLowerCase();
    return normalized === byName || normalized === byCode;
  });
  return matched?.id ?? null;
}
