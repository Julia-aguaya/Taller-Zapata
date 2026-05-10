/**
 * Workflow utility functions
 * Functions for working with case workflow data
 */
import { formatBackendState } from '../../cases/lib/caseFormatters';

/**
 * Format workflow domain to user-friendly label
 * @param {string} domain - The workflow domain
 * @param {string} fallback - Fallback label if no match
 * @returns {string} Formatted domain label
 */
export function formatWorkflowDomain(domain, fallback = 'Seguimiento') {
  const normalized = String(domain || '').trim().toLowerCase();

  if (!normalized) {
    return fallback;
  }

  const labels = {
    tramite: 'Tramite',
    reparacion: 'Reparacion',
    pago: 'Cobro',
    documentacion: 'Documentacion',
    legal: 'Gestión legal',
  };

  return labels[normalized] || formatBackendState(normalized, fallback);
}

/**
 * Get workflow history items from payload
 * @param {Array|undefined} payload - The workflow history payload
 * @returns {Array} Array of workflow history items
 */
export function getWorkflowHistoryItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

/**
 * Get workflow actions items from payload
 * @param {Object|undefined} payload - The workflow actions payload
 * @returns {Array} Array of workflow action items
 */
export function getWorkflowActionsItems(payload) {
  return Array.isArray(payload?.actions) ? payload.actions : [];
}