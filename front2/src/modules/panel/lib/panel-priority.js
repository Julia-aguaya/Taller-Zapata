const normalizeText = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const normalizeCode = (value) => String(value || '')
  .trim()
  .toUpperCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[\s-]+/g, '_');

const PAYMENT_SETTLED_CODES = new Set(['PAGADO']);
const REPAIR_APPOINTMENT_PENDING_CODES = new Set(['DAR_TURNO', 'SIN_TURNO']);
const REPAIR_RESOLVED_CODES = new Set(['REPARADO', 'RESUELTA', 'RESUELTO', 'FINALIZADA', 'FINALIZADO']);

const PRIORITY_REASON_TYPES = {
  PAYMENT: 'PAYMENT',
  APPOINTMENT: 'APPOINTMENT',
  PRESCRIPTION: 'PRESCRIPTION',
  TASK: 'TASK',
  REPAIR: 'REPAIR',
  OTHER: 'OTHER',
};

const getCurrentPaymentCode = (item) => normalizeCode(item?.currentPaymentStateCode || item?.visibleTramiteState?.code);
const getCurrentRepairCode = (item) => normalizeCode(item?.visibleRepairState?.code || item?.currentRepairStateCode);

export const resolvePriorityReasonType = (reason) => {
  const normalizedReason = normalizeText(reason);

  if (!normalizedReason) return PRIORITY_REASON_TYPES.OTHER;
  if (normalizedReason === 'pago pendiente') return PRIORITY_REASON_TYPES.PAYMENT;
  if (normalizedReason === 'pendiente de dar turno' || normalizedReason === 'pendiente de turno') return PRIORITY_REASON_TYPES.APPOINTMENT;
  if (normalizedReason === 'caso proximo a prescribir') return PRIORITY_REASON_TYPES.PRESCRIPTION;
  if (normalizedReason.startsWith('tareas pendientes')) return PRIORITY_REASON_TYPES.TASK;
  if (normalizedReason.includes('repar') && normalizedReason.includes('pendient')) return PRIORITY_REASON_TYPES.REPAIR;
  return PRIORITY_REASON_TYPES.OTHER;
};

export const resolveCasePriorityState = (item, taskMeta = null) => {
  const isPaymentSettled = PAYMENT_SETTLED_CODES.has(getCurrentPaymentCode(item));
  const currentRepairCode = getCurrentRepairCode(item);
  const isRepairResolved = REPAIR_RESOLVED_CODES.has(currentRepairCode);
  const needsAppointment = REPAIR_APPOINTMENT_PENDING_CODES.has(currentRepairCode);
  const hasActiveTasks = Boolean(taskMeta?.hasActiveTasks);
  const hasOverdueTasks = Boolean(taskMeta?.hasOverdueTasks);

  const validReasons = [];
  const reasonTypes = new Set();

  for (const reason of item?.priorityReasons || []) {
    const reasonType = resolvePriorityReasonType(reason);

    if (reasonType === PRIORITY_REASON_TYPES.PAYMENT && isPaymentSettled) {
      continue;
    }

    if (reasonType === PRIORITY_REASON_TYPES.APPOINTMENT && (!needsAppointment || isRepairResolved)) {
      continue;
    }

    if (reasonType === PRIORITY_REASON_TYPES.REPAIR && isRepairResolved) {
      continue;
    }

    if (reasonType === PRIORITY_REASON_TYPES.TASK && !hasActiveTasks) {
      continue;
    }

    validReasons.push(reason);
    reasonTypes.add(reasonType);
  }

  let priorityBucketCode = '';
  if (validReasons.length > 0) {
    const hasUrgentReason = reasonTypes.has(PRIORITY_REASON_TYPES.PAYMENT)
      || reasonTypes.has(PRIORITY_REASON_TYPES.PRESCRIPTION)
      || (reasonTypes.has(PRIORITY_REASON_TYPES.TASK) && hasOverdueTasks);

    priorityBucketCode = hasUrgentReason ? 'URGENT' : 'ATTENTION';
  }

  return {
    validReasons,
    reasonTypes,
    priorityBucketCode,
    priorityLabel: priorityBucketCode === 'URGENT' ? 'Urgente' : priorityBucketCode === 'ATTENTION' ? 'Para atender' : '',
    isVisibleInPriority: validReasons.length > 0,
  };
};
