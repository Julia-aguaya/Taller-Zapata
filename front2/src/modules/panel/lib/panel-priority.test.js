import { describe, expect, it } from 'vitest';
import { resolveCasePriorityState } from '@/modules/panel/lib/panel-priority';

describe('resolveCasePriorityState', () => {
  it('descarta pago pendiente cuando el pago real ya esta pagado', () => {
    const state = resolveCasePriorityState({
      currentPaymentStateCode: 'PAGADO',
      visibleRepairState: { code: 'EN_REPARACION' },
      priorityReasons: ['Pago pendiente', 'Caso proximo a prescribir'],
    });

    expect(state.validReasons).toEqual(['Caso proximo a prescribir']);
    expect(state.priorityBucketCode).toBe('URGENT');
  });

  it('descarta tarea pendiente cuando la tarea ya esta resuelta o cancelada', () => {
    const state = resolveCasePriorityState({
      currentPaymentStateCode: 'PENDIENTE',
      visibleRepairState: { code: 'EN_REPARACION' },
      priorityReasons: ['Tareas pendientes vencidas'],
    }, { hasActiveTasks: false, hasOverdueTasks: false });

    expect(state.validReasons).toEqual([]);
    expect(state.isVisibleInPriority).toBe(false);
  });

  it('descarta pendiente de turno cuando el turno ya fue asignado', () => {
    const state = resolveCasePriorityState({
      currentPaymentStateCode: 'PENDIENTE',
      visibleRepairState: { code: 'EN_REPARACION' },
      priorityReasons: ['Pendiente de turno'],
    });

    expect(state.validReasons).toEqual([]);
  });

  it('descarta razones de reparacion pendiente cuando la reparacion ya esta resuelta', () => {
    const state = resolveCasePriorityState({
      currentPaymentStateCode: 'PENDIENTE',
      visibleRepairState: { code: 'REPARADO' },
      priorityReasons: ['Reparacion pendiente de validacion'],
    });

    expect(state.validReasons).toEqual([]);
    expect(state.isVisibleInPriority).toBe(false);
  });

  it('mantiene solo los motivos compatibles cuando hay mezcla de razones viejas y actuales', () => {
    const state = resolveCasePriorityState({
      currentPaymentStateCode: 'PENDIENTE',
      visibleRepairState: { code: 'EN_REPARACION' },
      priorityReasons: ['Pendiente de turno', 'Pago pendiente'],
    });

    expect(state.validReasons).toEqual(['Pago pendiente']);
    expect(state.priorityBucketCode).toBe('URGENT');
  });

  it('clasifica para atender cuando solo queda un motivo vigente no urgente', () => {
    const state = resolveCasePriorityState({
      currentPaymentStateCode: 'PENDIENTE',
      visibleRepairState: { code: 'DAR_TURNO' },
      priorityReasons: ['Pendiente de dar turno'],
    });

    expect(state.validReasons).toEqual(['Pendiente de dar turno']);
    expect(state.priorityBucketCode).toBe('ATTENTION');
    expect(state.priorityLabel).toBe('Para atender');
  });
});
