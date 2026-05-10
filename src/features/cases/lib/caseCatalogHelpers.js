/**
 * Catalog helper utilities
 * Functions for working with catalog data from the backend
 */
import { normalizeLookupText } from './caseNormalizers';

/**
 * Get catalog entries for a given key
 * @param {Object} catalogs - Catalog object from backend
 * @param {string} key - The catalog key to retrieve
 * @returns {Array} Array of catalog entries
 */
export function getCatalogEntries(catalogs, key) {
  const entries = catalogs?.[key];
  return Array.isArray(entries) ? entries : [];
}

/**
 * Get just the names from catalog entries
 * @param {Object} catalogs - Catalog object from backend
 * @param {string} key - The catalog key
 * @param {Array} fallback - Fallback array if no entries found
 * @returns {Array} Array of entry names
 */
export function getCatalogOptionNames(catalogs, key, fallback = []) {
  const entries = getCatalogEntries(catalogs, key);
  const names = entries.map((entry) => entry?.name).filter(Boolean);
  return names.length ? names : fallback;
}

/**
 * Get catalog entries as select options (value/label pairs)
 * @param {Object} catalogs - Catalog object from backend
 * @param {string} key - The catalog key
 * @param {Array} fallback - Fallback array of options
 * @returns {Array} Array of {value, label} objects
 */
export function getCatalogSelectOptions(catalogs, key, fallback = []) {
  const entries = getCatalogEntries(catalogs, key)
    .filter((entry) => entry?.code)
    .map((entry) => ({ value: entry.code, label: entry.name || entry.code }));

  if (entries.length) return entries;
  return fallback.map((option) => ({ value: option, label: option }));
}

/**
 * Resolve a catalog code from a value (code or name)
 * @param {string} value - The value to resolve
 * @param {Array} entries - Catalog entries to search
 * @param {Array} fallbackOptions - Fallback option values to consider valid
 * @returns {string|null} Resolved code or null
 */
export function resolveCatalogCode(value, entries = [], fallbackOptions = []) {
  const normalized = normalizeLookupText(value);
  if (!normalized) return null;

  const matched = entries.find((entry) => {
    const byCode = normalizeLookupText(entry?.code);
    const byName = normalizeLookupText(entry?.name);
    return normalized === byCode || normalized === byName;
  });
  if (matched?.code) return matched.code;

  if (fallbackOptions.some((option) => normalizeLookupText(option) === normalized)) {
    return value;
  }

  return null;
}