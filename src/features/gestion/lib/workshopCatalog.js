import { WORKSHOPS } from '../constants/gestionOptions';
import { readAuthenticatedSystemParameter, upsertAuthenticatedSystemParameter } from '../../../lib/api/backend';

export const WORKSHOP_STORAGE_KEY = 'tallerDemo.workshops.catalog';
export const WORKSHOP_SYSTEM_PARAMETER_CODE = 'WORKSHOP_CATALOG';

export function getDefaultWorkshops() {
  return WORKSHOPS.map((workshop) => ({ ...workshop }));
}

function sanitizeWorkshop(workshop, fallbackIndex = 0) {
  const fallback = WORKSHOPS[fallbackIndex] || {};
  const label = String(workshop?.label || fallback.label || '').trim();

  return {
    id: String(workshop?.id || fallback.id || `workshop-${fallbackIndex + 1}`),
    label,
    legalName: String(workshop?.legalName || '').trim(),
    taxId: String(workshop?.taxId || '').trim(),
    taxCondition: String(workshop?.taxCondition || '').trim(),
    address: String(workshop?.address || '').trim(),
    phone: String(workshop?.phone || '').trim(),
    email: String(workshop?.email || '').trim(),
    logo: String(workshop?.logo || '').trim(),
  };
}

function sanitizeWorkshops(workshops) {
  return (Array.isArray(workshops) ? workshops : [])
    .map((workshop, index) => sanitizeWorkshop(workshop, index))
    .filter((workshop) => workshop.label);
}

function persistWorkshopCache(workshops) {
  const nextWorkshops = sanitizeWorkshops(workshops);
  const resolved = nextWorkshops.length ? nextWorkshops : getDefaultWorkshops();

  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(WORKSHOP_STORAGE_KEY, JSON.stringify(resolved));
  }

  return resolved;
}

function parseWorkshopCatalogValue(rawValue) {
  if (!rawValue) {
    return getDefaultWorkshops();
  }

  const parsed = JSON.parse(rawValue);
  const sanitized = sanitizeWorkshops(parsed);
  return sanitized.length ? sanitized : getDefaultWorkshops();
}

export function readWorkshopCatalog() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return getDefaultWorkshops();
  }

  try {
    const rawValue = window.localStorage.getItem(WORKSHOP_STORAGE_KEY);
    return parseWorkshopCatalogValue(rawValue);
  } catch {
    return getDefaultWorkshops();
  }
}

export function saveWorkshopCatalog(workshops) {
  return persistWorkshopCache(workshops);
}

export function getWorkshopOptions(workshops) {
  return (Array.isArray(workshops) ? workshops : []).map((workshop) => workshop.label).filter(Boolean);
}

export function findWorkshopByLabel(label, workshops) {
  return (Array.isArray(workshops) ? workshops : []).find((workshop) => workshop.label === label);
}

export async function readWorkshopCatalogFromBackend(accessToken, options = {}) {
  if (!accessToken) {
    return readWorkshopCatalog();
  }

  try {
    const result = await readAuthenticatedSystemParameter(accessToken, WORKSHOP_SYSTEM_PARAMETER_CODE, options);
    return persistWorkshopCache(parseWorkshopCatalogValue(result?.data?.value));
  } catch (error) {
    if (error?.httpStatus === 404) {
      return persistWorkshopCache(getDefaultWorkshops());
    }
    throw error;
  }
}

export async function saveWorkshopCatalogToBackend(accessToken, workshops, options = {}) {
  const resolved = persistWorkshopCache(workshops);

  if (!accessToken) {
    return resolved;
  }

  await upsertAuthenticatedSystemParameter(accessToken, WORKSHOP_SYSTEM_PARAMETER_CODE, {
    code: WORKSHOP_SYSTEM_PARAMETER_CODE,
    value: JSON.stringify(resolved),
    dataTypeCode: 'JSON',
    description: 'Catalogo compartido de talleres para presupuesto',
    editable: true,
    visible: false,
    moduleCode: 'GESTION',
  }, options);

  return resolved;
}
