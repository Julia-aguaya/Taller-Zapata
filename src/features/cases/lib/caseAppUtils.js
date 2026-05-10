/**
 * Application utility functions
 * General utility functions used throughout the app
 */
import { normalizeLookupText } from './caseNormalizers';

/**
 * Format a probe timestamp for display
 * @param {string|number|Date} value - The timestamp value
 * @param {string} idleMessage - Message to show when no value
 * @returns {string} Formatted time string or idle message
 */
export function formatProbeCheckedAt(value, idleMessage = 'Todavía no verificamos la conexión.') {
  if (!value) {
    return idleMessage;
  }

  return `Último intento ${new Date(value).toLocaleTimeString('es-AR')}`;
}

/**
 * Mask a token/secret for display
 * @param {string} value - The token to mask
 * @returns {string} Masked token or default message
 */
export function maskToken(value) {
  if (!value) {
    return 'Sesión no iniciada';
  }

  if (value.length <= 24) {
    return value;
  }

  return `${value.slice(0, 16)}...${value.slice(-8)}`;
}

/**
 * Resolve insurance company ID by name (exact or partial match)
 * @param {Array} companies - Array of company objects with id, name, businessName, label
 * @param {string} name - Name to search for
 * @returns {string|null} Company ID or null if not found
 */
export function resolveInsuranceCompanyIdByName(companies = [], name = '') {
  if (!companies || !Array.isArray(companies)) return null;
  
  const normalizedTarget = normalizeLookupText(name);
  if (!normalizedTarget) return null;

  // Try exact match first on name
  const exactMatch = companies.find((company) => 
    normalizeLookupText(company?.name) === normalizedTarget
  );
  if (exactMatch?.id) return exactMatch.id;

  // Try exact match on label
  const labelMatch = companies.find((company) => 
    normalizeLookupText(company?.label) === normalizedTarget
  );
  if (labelMatch?.id) return labelMatch.id;

  // Try partial match on name
  const partialMatch = companies.find((company) => {
    const hay = normalizeLookupText(company?.name || company?.label);
    return hay && (hay.includes(normalizedTarget) || normalizedTarget.includes(hay));
  });
  return partialMatch?.id || null;
}