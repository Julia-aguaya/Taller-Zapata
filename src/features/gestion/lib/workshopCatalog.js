import { WORKSHOPS } from '../constants/gestionOptions';

export const WORKSHOP_STORAGE_KEY = 'tallerDemo.workshops.catalog';

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

export function readWorkshopCatalog() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return getDefaultWorkshops();
  }

  try {
    const rawValue = window.localStorage.getItem(WORKSHOP_STORAGE_KEY);
    if (!rawValue) return getDefaultWorkshops();

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed) || !parsed.length) {
      return getDefaultWorkshops();
    }

    const sanitized = parsed
      .map((workshop, index) => sanitizeWorkshop(workshop, index))
      .filter((workshop) => workshop.label);

    return sanitized.length ? sanitized : getDefaultWorkshops();
  } catch {
    return getDefaultWorkshops();
  }
}

export function saveWorkshopCatalog(workshops) {
  const sanitized = (Array.isArray(workshops) ? workshops : [])
    .map((workshop, index) => sanitizeWorkshop(workshop, index))
    .filter((workshop) => workshop.label);

  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(WORKSHOP_STORAGE_KEY, JSON.stringify(sanitized.length ? sanitized : getDefaultWorkshops()));
  }

  return sanitized.length ? sanitized : getDefaultWorkshops();
}

export function getWorkshopOptions(workshops) {
  return (Array.isArray(workshops) ? workshops : []).map((workshop) => workshop.label).filter(Boolean);
}

export function findWorkshopByLabel(label, workshops) {
  return (Array.isArray(workshops) ? workshops : []).find((workshop) => workshop.label === label);
}
