import { getCatalogEntries, resolveCatalogCode } from './caseCatalogHelpers';
import { normalizeLookupText } from './caseNormalizers';

const REPORT_STATUS_FALLBACKS = {
  'informe abierto': 'OPEN',
  'informe cerrado': 'CLOSED',
};

const PARTS_AUTHORIZATION_FALLBACKS = {
  pendiente: 'PENDING',
  'autorizacion total': 'TOTAL',
  'autorizacion parcial': 'PARTIAL',
  'sin repuestos autorizados': 'NONE',
};

function getPreferredCatalogKeys(catalogs, tokenGroups = []) {
  const keys = Object.keys(catalogs || {});
  const preferred = tokenGroups.flatMap((tokens) => keys.filter((key) => {
    const normalizedKey = normalizeLookupText(key);
    return tokens.every((token) => normalizedKey.includes(normalizeLookupText(token)));
  }));

  return [...new Set([...preferred, ...keys])];
}

export function resolveOperationCatalogCode(value, catalogs, { preferredKeyTokens = [], fallbackMap = {} } = {}) {
  const normalizedValue = normalizeLookupText(value);
  if (!normalizedValue) return null;

  const orderedKeys = getPreferredCatalogKeys(catalogs, preferredKeyTokens);
  for (const key of orderedKeys) {
    const resolvedCode = resolveCatalogCode(value, getCatalogEntries(catalogs, key));
    if (resolvedCode) {
      return resolvedCode;
    }
  }

  return fallbackMap[normalizedValue] || null;
}

export function resolveReportStatusCode(value, catalogs) {
  return resolveOperationCatalogCode(value, catalogs, {
    preferredKeyTokens: [['report', 'status'], ['budget', 'status']],
    fallbackMap: REPORT_STATUS_FALLBACKS,
  });
}

export function resolvePartsAuthorizationCode(value, catalogs) {
  return resolveOperationCatalogCode(value, catalogs, {
    preferredKeyTokens: [['part', 'authorization'], ['parts', 'authorization']],
    fallbackMap: PARTS_AUTHORIZATION_FALLBACKS,
  });
}
