/**
 * Case display helper functions
 * Functions for formatting case data for display
 */

/**
 * Get cases items from various payload formats
 * @param {Array|Object} payload - The payload from the API
 * @returns {Array} Array of case items
 */
export function getBackendCasesItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

/**
 * Get vehicle display label from a case item
 * @param {Object} item - Case item with vehicle data
 * @returns {string} Formatted vehicle label
 */
export function getCaseVehicleLabel(item) {
  const compact = [item?.brand, item?.model].filter(Boolean).join(' ');
  const plate = item?.plate || item?.licensePlate || item?.patent;
  if (compact && plate) return `${compact} · ${plate}`;
  if (compact) return compact;
  if (plate) return plate;
  return 'Vehiculo no informado';
}

/**
 * Get responsible person label for a case
 * @param {Object} item - Case item with assignee/owner info
 * @param {Array} workflowActions - Optional workflow actions
 * @returns {string} Formatted responsible label
 */
export function getCaseResponsibleLabel(item, workflowActions = []) {
  const byCase = item?.assigneeName || item?.assignedToName || item?.ownerName || item?.managerName;
  if (byCase) return byCase;

  const byAction = workflowActions.find((action) => action?.responsibleName || action?.assigneeName);
  return byAction?.responsibleName || byAction?.assigneeName || 'Sin responsable asignado';
}

/**
 * Get next task label from workflow actions
 * @param {Array} workflowActions - Workflow actions array
 * @returns {string} Formatted task label
 */
export function getCaseNextTaskLabel(workflowActions = []) {
  const nextAction = workflowActions[0];
  if (!nextAction) return 'Sin acción definida';
  return nextAction.label || nextAction.title || nextAction.reason || 'Acción pendiente';
}