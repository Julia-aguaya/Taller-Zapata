/**
 * Case filtering utilities
 * Pure functions for filtering cases by search term, state, and branch
 */
import { normalizeLookupText } from '../cases/lib/caseNormalizers';
import { formatBackendState } from '../cases/lib/caseFormatters';

/**
 * Get searchable text from a case item
 */
export function getCaseSearchHaystack(item) {
  if (!item) return '';
  
  const parts = [
    item.caseNumber,
    item.clientName,
    item.clientDocument,
    item.vehiclePlate,
    item.vehicleBrand,
    item.vehicleModel,
    item.branchName,
    item.branchCode,
    item.insuranceCompanyName,
    item.currentCaseStateCode,
  ].filter(Boolean);
  
  return normalizeLookupText(parts.join(' '));
}

/**
 * Filter cases by search term, state, and branch
 */
export function filterCases(items, { searchTerm = '', caseState = 'all', branch = 'all' }) {
  if (!Array.isArray(items)) return [];
  
  const normalizedSearch = normalizeLookupText(searchTerm);
  
  return items.filter((item) => {
    // Search filter
    const matchesSearch = !normalizedSearch || getCaseSearchHaystack(item).includes(normalizedSearch);
    
    // State filter
    const caseStateLabel = formatBackendState(item.currentCaseStateCode, 'Sin dato');
    const matchesState = caseState === 'all' || caseStateLabel === caseState;
    
    // Branch filter
    const branchLabel = item.branchName || item.branchCode || '';
    const matchesBranch = branch === 'all' || branchLabel === branch;
    
    return matchesSearch && matchesState && matchesBranch;
  });
}

/**
 * Get unique branch options from cases
 */
export function getBranchOptions(items) {
  if (!Array.isArray(items)) return [];
  
  const branches = new Set();
  items.forEach((item) => {
    const branch = item.branchName || item.branchCode;
    if (branch) branches.add(branch);
  });
  
  return Array.from(branches).sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Get unique state options from cases
 */
export function getStateOptions(items) {
  if (!Array.isArray(items)) return [];
  
  const states = new Set();
  items.forEach((item) => {
    const state = formatBackendState(item.currentCaseStateCode, 'Sin dato');
    if (state) states.add(state);
  });
  
  return Array.from(states).sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Calculate case metrics from items
 */
export function calculateCaseMetrics(items) {
  if (!Array.isArray(items)) return { total: 0, byState: {}, byBranch: {} };
  
  const byState = {};
  const byBranch = {};
  
  items.forEach((item) => {
    const state = formatBackendState(item.currentCaseStateCode, 'Sin dato');
    const branch = item.branchName || item.branchCode || 'Sin sucursal';
    
    byState[state] = (byState[state] || 0) + 1;
    byBranch[branch] = (byBranch[branch] || 0) + 1;
  });
  
  return { total: items.length, byState, byBranch };
}

/**
 * Get branch label from case item
 */
export function getBackendBranchLabel(item) {
  return item.branchCode || (item.branchId ? `Sucursal ${item.branchId}` : 'Sucursal no informada');
}

/**
 * Get case identifier label
 */
export function getCaseIdentifierLabel(item) {
  return item.folderCode || item.publicId || (item.id ? `Caso ${item.id}` : 'Carpeta sin identificador');
}

/**
 * Get status badge tone based on status value
 */
export function getBackendStatusTone(value) {
  const normalized = String(value || '').toLowerCase();

  if (!normalized) {
    return 'warning';
  }

  if (/(pagad|cerrad|finaliz|acordad|resuelt)/.test(normalized)) {
    return 'success';
  }

  if (/(pendient|espera|proceso)/.test(normalized)) {
    return 'info';
  }

  if (/(rechazad|cancelad|vencid)/.test(normalized)) {
    return 'danger';
  }

  return 'warning';
}