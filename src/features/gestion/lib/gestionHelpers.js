import {
  isFranchiseRecoveryCase,
  isInsuranceWorkflowCase,
} from '../../cases/lib/caseDomainCheckers';

export function getTramiteStepperConfig(item) {
  if (isFranchiseRecoveryCase(item)) {
    return {
      items: ['Sin presentar', 'Presentado (PD)', 'En trámite', 'Pasado a pagos', 'Pagado'],
      activeValue: item.computed.tramiteStatus,
    };
  }

  if (isInsuranceWorkflowCase(item)) {
    return {
      items: ['Sin presentar', 'Presentado (PD) o En trámite', 'Acordado', 'Pasado a pagos', 'Pagado', 'Rechazado / Desistido'],
      activeValue: ['Presentado (PD)', 'En trámite'].includes(item.computed.tramiteStatus)
        ? 'Presentado (PD) o En trámite'
        : item.computed.tramiteStatus,
    };
  }

  return {
    items: ['Ingresado', 'Pasado a pagos', 'Pagado'],
    activeValue: item.computed.tramiteStatus,
  };
}

export function getRepairStepperConfig(item) {
  if (isFranchiseRecoveryCase(item)) {
    return {
      items: ['En trámite', 'Faltan repuestos', 'Dar Turno', 'Con Turno', 'Debe reingresar', 'No debe repararse', 'Reparado'],
      activeValue: item.computed.repairStatus,
    };
  }

  if (isInsuranceWorkflowCase(item)) {
    return {
      items: ['En trámite', 'Faltan repuestos / Dar Turno', 'Con Turno', 'Debe reingresar', 'Reparado'],
      activeValue: ['Faltan repuestos', 'Dar Turno'].includes(item.computed.repairStatus)
        ? 'Faltan repuestos / Dar Turno'
        : item.computed.repairStatus,
    };
  }

  return {
    items: ['En trámite', 'Faltan repuestos', 'Dar Turno', 'Con Turno', 'Debe reingresar', 'Reparado'],
    activeValue: item.computed.repairStatus,
  };
}

export function bindWorkflowActions(actions = [], domainHint = '', availableActions = []) {
  const hasAvailable = Array.isArray(availableActions) && availableActions.length > 0;
  return actions.map((action) => {
    const backendAction = availableActions.find(
      (entry) =>
        normalizeActionLabel(entry.label || entry.actionCode) === normalizeActionLabel(action.label) &&
        (domainHint ? (entry.domain || entry.workflowDomain) === domainHint : true),
    );
    return {
      ...action,
      backendAction,
      disabled: action.disabled || (hasAvailable && !backendAction),
    };
  });
}

function normalizeActionLabel(text) {
  return (text || '').trim().toLowerCase();
}
