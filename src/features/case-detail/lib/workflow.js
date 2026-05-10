export const WORKFLOW_STATES = {
  PENDIENTE: 'pendiente',
  EN_PROCESO: 'en_proceso',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado',
};

export const WORKFLOW_ACTIONS = {
  APROBAR: 'aprobar',
  RECHAZAR: 'rechazar',
  DERIVAR: 'derivar',
  CERRAR: 'cerrar',
  REABRIR: 'reabrir',
  SUSPENDER: 'suspender',
};

const STATE_ACTIONS = {
  [WORKFLOW_STATES.PENDIENTE]: [WORKFLOW_ACTIONS.APROBAR, WORKFLOW_ACTIONS.RECHAZAR, WORKFLOW_ACTIONS.DERIVAR],
  [WORKFLOW_STATES.EN_PROCESO]: [WORKFLOW_ACTIONS.CERRAR, WORKFLOW_ACTIONS.SUSPENDER],
  [WORKFLOW_STATES.COMPLETADO]: [WORKFLOW_ACTIONS.REABRIR],
  [WORKFLOW_STATES.CANCELADO]: [WORKFLOW_ACTIONS.REABRIR],
};

const VALID_TRANSITIONS = {
  [WORKFLOW_STATES.PENDIENTE]: [WORKFLOW_STATES.EN_PROCESO, WORKFLOW_STATES.CANCELADO],
  [WORKFLOW_STATES.EN_PROCESO]: [WORKFLOW_STATES.COMPLETADO, WORKFLOW_STATES.PENDIENTE, WORKFLOW_STATES.CANCELADO],
  [WORKFLOW_STATES.COMPLETADO]: [WORKFLOW_STATES.EN_PROCESO],
  [WORKFLOW_STATES.CANCELADO]: [WORKFLOW_STATES.PENDIENTE],
};

export function getWorkflowActions(state) {
  return STATE_ACTIONS[state] || [];
}

export function canTransitionTo(currentState, targetState) {
  const validTargets = VALID_TRANSITIONS[currentState] || [];
  return validTargets.includes(targetState);
}

export function parseWorkflowHistory(historyData) {
  if (!Array.isArray(historyData)) return [];
  
  return historyData.map(item => ({
    fromState: item.fromState || item.estado_anterior,
    toState: item.toState || item.estado_nuevo,
    action: item.action || item.accion,
    actor: item.actor || item.usuario,
    timestamp: item.timestamp || item.fecha,
    comment: item.comment || item.comentario,
  }));
}

export function getWorkflowStateLabel(state) {
  const labels = {
    [WORKFLOW_STATES.PENDIENTE]: 'Pendiente',
    [WORKFLOW_STATES.EN_PROCESO]: 'En Proceso',
    [WORKFLOW_STATES.COMPLETADO]: 'Completado',
    [WORKFLOW_STATES.CANCELADO]: 'Cancelado',
  };
  return labels[state] || state;
}

export function getWorkflowActionLabel(action) {
  const labels = {
    [WORKFLOW_ACTIONS.APROBAR]: 'Aprobar',
    [WORKFLOW_ACTIONS.RECHAZAR]: 'Rechazar',
    [WORKFLOW_ACTIONS.DERIVAR]: 'Derivar',
    [WORKFLOW_ACTIONS.CERRAR]: 'Cerrar',
    [WORKFLOW_ACTIONS.REABRIR]: 'Reabrir',
    [WORKFLOW_ACTIONS.SUSPENDER]: 'Suspender',
  };
  return labels[action] || action;
}