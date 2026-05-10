import { describe, it, expect } from 'vitest';
import {
  WORKFLOW_STATES,
  WORKFLOW_ACTIONS,
  getWorkflowActions,
  canTransitionTo,
  parseWorkflowHistory,
  getWorkflowStateLabel,
  getWorkflowActionLabel,
} from '../../../features/case-detail/lib/workflow';

describe('Workflow - States', () => {
  it('debería tener todos los estados definidos', () => {
    expect(WORKFLOW_STATES.PENDIENTE).toBe('pendiente');
    expect(WORKFLOW_STATES.EN_PROCESO).toBe('en_proceso');
    expect(WORKFLOW_STATES.COMPLETADO).toBe('completado');
    expect(WORKFLOW_STATES.CANCELADO).toBe('cancelado');
  });
});

describe('Workflow - Actions', () => {
  it('debería tener todas las acciones definidas', () => {
    expect(WORKFLOW_ACTIONS.APROBAR).toBe('aprobar');
    expect(WORKFLOW_ACTIONS.RECHAZAR).toBe('rechazar');
    expect(WORKFLOW_ACTIONS.DERIVAR).toBe('derivar');
    expect(WORKFLOW_ACTIONS.CERRAR).toBe('cerrar');
    expect(WORKFLOW_ACTIONS.REABRIR).toBe('reabrir');
    expect(WORKFLOW_ACTIONS.SUSPENDER).toBe('suspender');
  });
});

describe('Workflow - getWorkflowActions', () => {
  it('debería retornar acciones disponibles para estado pendiente', () => {
    const actions = getWorkflowActions(WORKFLOW_STATES.PENDIENTE);
    expect(actions).toContain(WORKFLOW_ACTIONS.APROBAR);
    expect(actions).toContain(WORKFLOW_ACTIONS.RECHAZAR);
    expect(actions).toContain(WORKFLOW_ACTIONS.DERIVAR);
  });

  it('debería retornar acciones para estado en_proceso', () => {
    const actions = getWorkflowActions(WORKFLOW_STATES.EN_PROCESO);
    expect(actions).toContain(WORKFLOW_ACTIONS.CERRAR);
    expect(actions).toContain(WORKFLOW_ACTIONS.SUSPENDER);
  });

  it('debería retornar array vacío para estado completado', () => {
    const actions = getWorkflowActions(WORKFLOW_STATES.COMPLETADO);
    expect(actions).toHaveLength(1);
    expect(actions).toContain(WORKFLOW_ACTIONS.REABRIR);
  });

  it('debería retornar array vacío para estado cancelado', () => {
    const actions = getWorkflowActions(WORKFLOW_STATES.CANCELADO);
    expect(actions).toHaveLength(1);
    expect(actions).toContain(WORKFLOW_ACTIONS.REABRIR);
  });

  it('debería retornar array vacío para estado desconocido', () => {
    const actions = getWorkflowActions('desconocido');
    expect(actions).toHaveLength(0);
  });
});

describe('Workflow - canTransitionTo', () => {
  it('debería permitir transición de pendiente a en_proceso', () => {
    expect(canTransitionTo(WORKFLOW_STATES.PENDIENTE, WORKFLOW_STATES.EN_PROCESO)).toBe(true);
  });

  it('debería permitir transición de pendiente a cancelado', () => {
    expect(canTransitionTo(WORKFLOW_STATES.PENDIENTE, WORKFLOW_STATES.CANCELADO)).toBe(true);
  });

  it('debería permitir transición de en_proceso a completado', () => {
    expect(canTransitionTo(WORKFLOW_STATES.EN_PROCESO, WORKFLOW_STATES.COMPLETADO)).toBe(true);
  });

  it('debería permitir transición de en_proceso a pendiente', () => {
    expect(canTransitionTo(WORKFLOW_STATES.EN_PROCESO, WORKFLOW_STATES.PENDIENTE)).toBe(true);
  });

  it('debería permitir transición de completado a en_proceso', () => {
    expect(canTransitionTo(WORKFLOW_STATES.COMPLETADO, WORKFLOW_STATES.EN_PROCESO)).toBe(true);
  });

  it('debería permitir transición de cancelado a pendiente', () => {
    expect(canTransitionTo(WORKFLOW_STATES.CANCELADO, WORKFLOW_STATES.PENDIENTE)).toBe(true);
  });

  it('no debería permitir transición directa de pendiente a completado', () => {
    expect(canTransitionTo(WORKFLOW_STATES.PENDIENTE, WORKFLOW_STATES.COMPLETADO)).toBe(false);
  });

  it('no debería permitir transición de completado a cancelado', () => {
    expect(canTransitionTo(WORKFLOW_STATES.COMPLETADO, WORKFLOW_STATES.CANCELADO)).toBe(false);
  });

  it('debería retornar false para estado desconocido', () => {
    expect(canTransitionTo('desconocido', WORKFLOW_STATES.PENDIENTE)).toBe(false);
  });
});

describe('Workflow - parseWorkflowHistory', () => {
  it('debería parsear historial vacío', () => {
    const result = parseWorkflowHistory([]);
    expect(result).toEqual([]);
  });

  it('debería retornar array vacío para entrada inválida', () => {
    expect(parseWorkflowHistory(null)).toEqual([]);
    expect(parseWorkflowHistory(undefined)).toEqual([]);
    expect(parseWorkflowHistory('not an array')).toEqual([]);
  });

  it('debería parsear entradas con formato legacy', () => {
    const history = [
      { estado_anterior: 'pendiente', estado_nuevo: 'en_proceso', accion: 'aprobar', usuario: 'admin', fecha: '2026-01-01' },
    ];
    const result = parseWorkflowHistory(history);
    expect(result).toHaveLength(1);
    expect(result[0].fromState).toBe('pendiente');
    expect(result[0].toState).toBe('en_proceso');
  });

  it('debería parsear entradas con formato nuevo', () => {
    const history = [
      { fromState: 'pendiente', toState: 'en_proceso', action: 'aprobar', actor: 'admin', timestamp: '2026-01-01' },
    ];
    const result = parseWorkflowHistory(history);
    expect(result).toHaveLength(1);
    expect(result[0].fromState).toBe('pendiente');
    expect(result[0].toState).toBe('en_proceso');
    expect(result[0].actor).toBe('admin');
  });
});

describe('Workflow - getWorkflowStateLabel', () => {
  it('debería retornar label para cada estado', () => {
    expect(getWorkflowStateLabel(WORKFLOW_STATES.PENDIENTE)).toBe('Pendiente');
    expect(getWorkflowStateLabel(WORKFLOW_STATES.EN_PROCESO)).toBe('En Proceso');
    expect(getWorkflowStateLabel(WORKFLOW_STATES.COMPLETADO)).toBe('Completado');
    expect(getWorkflowStateLabel(WORKFLOW_STATES.CANCELADO)).toBe('Cancelado');
  });

  it('debería retornar el estado mismo para estado desconocido', () => {
    expect(getWorkflowStateLabel('desconocido')).toBe('desconocido');
  });
});

describe('Workflow - getWorkflowActionLabel', () => {
  it('debería retornar label para cada acción', () => {
    expect(getWorkflowActionLabel(WORKFLOW_ACTIONS.APROBAR)).toBe('Aprobar');
    expect(getWorkflowActionLabel(WORKFLOW_ACTIONS.RECHAZAR)).toBe('Rechazar');
    expect(getWorkflowActionLabel(WORKFLOW_ACTIONS.DERIVAR)).toBe('Derivar');
    expect(getWorkflowActionLabel(WORKFLOW_ACTIONS.CERRAR)).toBe('Cerrar');
    expect(getWorkflowActionLabel(WORKFLOW_ACTIONS.REABRIR)).toBe('Reabrir');
    expect(getWorkflowActionLabel(WORKFLOW_ACTIONS.SUSPENDER)).toBe('Suspender');
  });

  it('debería retornar la acción misma para acción desconocida', () => {
    expect(getWorkflowActionLabel('desconocida')).toBe('desconocida');
  });
});