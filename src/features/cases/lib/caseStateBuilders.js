import { getFriendlyErrorMessage } from './caseErrorMessages';

export function getCasesTechnicalDetail({ endpoint, httpStatus, errorMessage }) {
  const parts = [];

  if (httpStatus) {
    parts.push(`HTTP ${httpStatus}`);
  }

  if (endpoint) {
    parts.push(endpoint);
  }

  if (errorMessage && errorMessage !== getFriendlyErrorMessage({ message: errorMessage, httpStatus })) {
    parts.push(errorMessage);
  }

  return parts.join(' · ');
}

// --- Item getters ---

export function getCaseRelationsItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

export function getCaseInsuranceProcessingDocumentItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

export function getCaseLegalNewsItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

export function getCaseLegalExpensesItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

export function getCaseAuditEventItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

export function getCaseDocumentItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

export function getCaseAppointmentItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

export function getCaseVehicleIntakeItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

export function getCaseBudgetItems(payload) {
  return Array.isArray(payload?.items)
    ? payload.items.filter((item) => item?.active !== false)
    : [];
}

export function getCaseVehicleOutcomeItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

export function getCaseFinancialMovementItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

export function getCaseReceiptItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

// --- Sort helpers ---

export function sortAppointmentsByDate(items) {
  return [...items].sort((left, right) => {
    const leftKey = `${left?.appointmentDate || '9999-12-31'}T${left?.appointmentTime || '23:59:59'}`;
    const rightKey = `${right?.appointmentDate || '9999-12-31'}T${right?.appointmentTime || '23:59:59'}`;
    return leftKey.localeCompare(rightKey);
  });
}

// --- State builders: Relations ---

export function buildCaseRelationsState(payload, fallbackDetail = '') {
  const items = getCaseRelationsItems(payload);
  return {
    status: items.length > 0 ? 'success' : 'empty',
    items,
    total: items.length,
    detail: fallbackDetail || (items.length > 0
      ? 'Vínculos registrados para esta carpeta.'
      : 'Cuando se registren vínculos, vas a verlos acá.'),
  };
}

export function buildRejectedCaseRelationsState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', items: [], total: 0, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', items: [], total: 0, detail: getFriendlyErrorMessage(error) };
}

// --- State builders: Insurance ---

export function buildCaseInsuranceState(payload, fallbackDetail = '') {
  return {
    status: payload ? 'success' : 'empty',
    data: payload || null,
    detail: fallbackDetail || (payload
      ? 'Datos de cobertura informados para esta carpeta.'
      : 'Cuando se registre la cobertura, vas a verla acá.'),
  };
}

export function buildRejectedCaseInsuranceState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', data: null, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', data: null, detail: getFriendlyErrorMessage(error) };
}

// --- State builders: InsuranceProcessing ---

export function buildCaseInsuranceProcessingState(payload, fallbackDetail = '') {
  return {
    status: payload ? 'success' : 'empty',
    data: payload || null,
    detail: fallbackDetail || (payload
      ? 'Estado actual del trámite con la compañía para esta carpeta.'
      : 'Cuando haya novedades del trámite, vas a verlas acá.'),
  };
}

export function buildRejectedCaseInsuranceProcessingState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', data: null, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', data: null, detail: getFriendlyErrorMessage(error) };
}

// --- State builders: Franchise ---

export function buildCaseFranchiseState(payload, fallbackDetail = '') {
  return {
    status: payload ? 'success' : 'empty',
    data: payload || null,
    detail: fallbackDetail || (payload
      ? 'Estos importes muestran la franquicia asociada al caso.'
      : 'Cuando haya datos de franquicia, vas a verlos acá.'),
  };
}

export function buildRejectedCaseFranchiseState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', data: null, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', data: null, detail: getFriendlyErrorMessage(error) };
}

// --- State builders: InsuranceProcessingDocuments ---

export function buildCaseInsuranceProcessingDocumentsState(payload, fallbackDetail = '') {
  const items = getCaseInsuranceProcessingDocumentItems(payload);
  return {
    status: items.length > 0 ? 'success' : 'empty',
    items,
    total: items.length,
    detail: fallbackDetail || (items.length > 0
      ? 'Documentos cargados para la gestión con la compañía.'
      : 'Cuando se carguen documentos de este trámite, vas a verlos acá.'),
  };
}

export function buildRejectedCaseInsuranceProcessingDocumentsState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', items: [], total: 0, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', items: [], total: 0, detail: getFriendlyErrorMessage(error) };
}

// --- State builders: Cleas ---

export function buildCaseCleasState(payload, fallbackDetail = '') {
  return {
    status: payload ? 'success' : 'empty',
    data: payload || null,
    detail: fallbackDetail || (payload
      ? 'Estado actual de gestión CLEAS para esta carpeta.'
      : 'Cuando haya datos CLEAS, vas a verlos acá.'),
  };
}

export function buildRejectedCaseCleasState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', data: null, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', data: null, detail: getFriendlyErrorMessage(error) };
}

// --- State builders: ThirdParty ---

export function buildCaseThirdPartyState(payload, fallbackDetail = '') {
  return {
    status: payload ? 'success' : 'empty',
    data: payload || null,
    detail: fallbackDetail || (payload
      ? 'Información de terceros vinculados a esta carpeta.'
      : 'Cuando haya datos de terceros, vas a verlos acá.'),
  };
}

export function buildRejectedCaseThirdPartyState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', data: null, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', data: null, detail: getFriendlyErrorMessage(error) };
}

// --- State builders: Legal ---

export function buildCaseLegalState(payload, fallbackDetail = '') {
  return {
    status: payload ? 'success' : 'empty',
    data: payload || null,
    detail: fallbackDetail || (payload
      ? 'Información legal vinculada al caso.'
      : 'Cuando haya datos legales, vas a verlos acá.'),
  };
}

export function buildRejectedCaseLegalState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', data: null, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', data: null, detail: getFriendlyErrorMessage(error) };
}

// --- State builders: LegalNews ---

export function buildCaseLegalNewsState(payload, fallbackDetail = '') {
  const items = getCaseLegalNewsItems(payload).slice().sort((left, right) => {
    const leftKey = left?.newsDate || left?.createdAt || '';
    const rightKey = right?.newsDate || right?.createdAt || '';
    return rightKey.localeCompare(leftKey);
  });

  return {
    status: items.length > 0 ? 'success' : 'empty',
    items,
    total: items.length,
    detail: fallbackDetail || (items.length > 0
      ? 'Últimas novedades del frente legal de esta carpeta.'
      : 'Cuando haya novedades legales, vas a verlas acá.'),
  };
}

export function buildRejectedCaseLegalNewsState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', items: [], total: 0, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', items: [], total: 0, detail: getFriendlyErrorMessage(error) };
}

// --- State builders: LegalExpenses ---

export function buildCaseLegalExpensesState(payload, fallbackDetail = '') {
  const items = getCaseLegalExpensesItems(payload).slice().sort((left, right) => {
    const leftKey = left?.expenseDate || left?.createdAt || '';
    const rightKey = right?.expenseDate || right?.createdAt || '';
    return rightKey.localeCompare(leftKey);
  });

  return {
    status: items.length > 0 ? 'success' : 'empty',
    items,
    total: items.length,
    detail: fallbackDetail || (items.length > 0
      ? 'Gastos legales registrados para esta carpeta.'
      : 'Cuando se registren gastos legales, vas a verlos acá.'),
  };
}

export function buildRejectedCaseLegalExpensesState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', items: [], total: 0, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', items: [], total: 0, detail: getFriendlyErrorMessage(error) };
}

// --- State builders: FranchiseRecovery ---

export function buildCaseFranchiseRecoveryState(payload, fallbackDetail = '') {
  return {
    status: payload ? 'success' : 'empty',
    data: payload || null,
    detail: fallbackDetail || (payload
      ? 'Estado de recupero de franquicia informado para esta carpeta.'
      : 'Cuando haya datos de recupero, vas a verlos acá.'),
  };
}

export function buildRejectedCaseFranchiseRecoveryState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', data: null, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', data: null, detail: getFriendlyErrorMessage(error) };
}

// --- State builders: AuditEvents ---

export function buildCaseAuditEventsState(payload, fallbackDetail = '') {
  const items = getCaseAuditEventItems(payload).slice().sort((left, right) => {
    const leftKey = left?.occurredAt || left?.createdAt || '';
    const rightKey = right?.occurredAt || right?.createdAt || '';
    return rightKey.localeCompare(leftKey);
  });
  const detail = fallbackDetail || (items.length > 0
    ? 'Estos registros muestran las últimas acciones realizadas sobre la carpeta.'
    : 'Cuando haya actividad registrada, la vas a ver acá.');

  return {
    status: items.length > 0 ? 'success' : 'empty',
    items,
    total: items.length,
    detail,
  };
}

export function buildRejectedCaseAuditEventsState(error) {
  if (error?.httpStatus === 404) {
    return {
      status: 'empty',
      items: [],
      total: 0,
      detail: getFriendlyErrorMessage(error),
    };
  }

  return {
    status: 'error',
    items: [],
    total: 0,
    detail: getFriendlyErrorMessage(error),
  };
}

// --- State builders: Appointments ---

export function buildCaseAppointmentsState(payload, fallbackDetail = '') {
  const items = sortAppointmentsByDate(getCaseAppointmentItems(payload));
  const today = new Date().toISOString().slice(0, 10);
  const upcomingAppointment = items.find((item) => item?.appointmentDate && item.appointmentDate >= today) || null;
  const nextAppointment = upcomingAppointment || items[items.length - 1] || null;
  const hasUpcomingAppointment = Boolean(upcomingAppointment);
  const detail = fallbackDetail || (items.length === 0
    ? 'Cuando haya un turno asignado para esta carpeta, lo vas a ver acá automáticamente.'
    : hasUpcomingAppointment
      ? 'Las fechas pueden actualizarse si el taller reprograma la recepción del vehículo.'
      : 'El último turno informado ya pasó. Si aparece una nueva fecha, la vas a ver acá automáticamente.');

  return {
    status: items.length > 0 ? 'success' : 'empty',
    items,
    total: items.length,
    nextAppointment,
    hasUpcomingAppointment,
    detail,
  };
}

// --- State builders: VehicleIntakes ---

export function buildCaseVehicleIntakesState(payload, fallbackDetail = '') {
  const items = getCaseVehicleIntakeItems(payload);
  const sorted = [...items].sort((left, right) => {
    const leftKey = left?.intakeDate || left?.receivedAt || left?.createdAt || '9999-12-31';
    const rightKey = right?.intakeDate || right?.receivedAt || right?.createdAt || '9999-12-31';
    return rightKey.localeCompare(leftKey);
  });
  const latest = sorted[0] || null;
  const detail = fallbackDetail || (sorted.length === 0
    ? 'Cuando se registre la recepción del vehículo, la vas a ver acá.'
    : 'Los datos de recepción se actualizan a medida que el taller registra novedades.');

  return {
    status: sorted.length > 0 ? 'success' : 'empty',
    items: sorted,
    total: sorted.length,
    latest,
    detail,
  };
}

export function buildRejectedCaseVehicleIntakesState(error) {
  if (error?.httpStatus === 404) {
    return {
      status: 'empty',
      items: [],
      total: 0,
      latest: null,
      detail: getFriendlyErrorMessage(error),
    };
  }

  return {
    status: 'error',
    items: [],
    total: 0,
    latest: null,
    detail: getFriendlyErrorMessage(error),
  };
}

// --- State builders: VehicleOutcomes ---

export function buildCaseVehicleOutcomesState(payload, fallbackDetail = '') {
  const items = getCaseVehicleOutcomeItems(payload);
  const sorted = [...items].sort((left, right) => {
    const leftKey = left?.outcomeDate || left?.deliveredAt || left?.createdAt || '9999-12-31';
    const rightKey = right?.outcomeDate || right?.deliveredAt || right?.createdAt || '9999-12-31';
    return rightKey.localeCompare(leftKey);
  });
  const latest = sorted[0] || null;
  const detail = fallbackDetail || (sorted.length === 0
    ? 'Cuando se registre la entrega del vehículo, la vas a ver acá.'
    : 'Los datos de egreso se actualizan a medida que el taller confirma la entrega.');

  return {
    status: sorted.length > 0 ? 'success' : 'empty',
    items: sorted,
    total: sorted.length,
    latest,
    detail,
  };
}

export function buildRejectedCaseVehicleOutcomesState(error) {
  if (error?.httpStatus === 404) {
    return {
      status: 'empty',
      items: [],
      total: 0,
      latest: null,
      detail: getFriendlyErrorMessage(error),
    };
  }

  return {
    status: 'error',
    items: [],
    total: 0,
    latest: null,
    detail: getFriendlyErrorMessage(error),
  };
}

// --- State builders: Budget ---

export function buildCaseBudgetState(payload, fallbackDetail = '') {
  const items = getCaseBudgetItems(payload);
  const detail = fallbackDetail || (items.length > 0
    ? 'Los importes pueden ajustarse si el equipo confirma nuevas piezas o mano de obra.'
    : 'Cuando el equipo cargue el detalle del presupuesto, lo vas a ver reflejado acá.');

  return {
    status: 'success',
    data: payload,
    items,
    totalItems: items.length,
    detail,
  };
}

export function buildRejectedCaseBudgetState(error) {
  const baseState = {
    data: null,
    items: [],
    totalItems: 0,
    detail: getFriendlyErrorMessage(error),
  };

  if (error?.httpStatus === 404) {
    return {
      ...baseState,
      status: 'empty',
    };
  }

  return {
    ...baseState,
    status: 'error',
  };
}

// --- State builders: FinanceSummary ---

export function buildCaseFinanceSummaryState(payload, fallbackDetail = '') {
  const summary = payload || null;
  const hasData = Boolean(summary);
  const detail = fallbackDetail || (hasData
    ? 'Estos valores cambian cuando se registran movimientos, retenciones o aplicaciones del caso.'
    : 'Cuando haya datos financieros cargados para esta carpeta, vas a ver el resumen acá.');

  return {
    status: hasData ? 'success' : 'empty',
    data: summary,
    detail,
  };
}

export function buildRejectedCaseFinanceSummaryState(error) {
  if (error?.httpStatus === 404) {
    return {
      status: 'empty',
      data: null,
      detail: getFriendlyErrorMessage(error),
    };
  }

  return {
    status: 'error',
    data: null,
    detail: getFriendlyErrorMessage(error),
  };
}

// --- State builders: FinancialMovements ---

export function buildCaseFinancialMovementsState(payload, fallbackDetail = '') {
  const items = getCaseFinancialMovementItems(payload);
  const sorted = [...items].sort((left, right) => {
    const leftKey = `${left?.movementAt || ''}-${left?.id || 0}`;
    const rightKey = `${right?.movementAt || ''}-${right?.id || 0}`;
    return rightKey.localeCompare(leftKey);
  });
  const detail = fallbackDetail || (sorted.length > 0
    ? 'Este listado refleja los últimos registros económicos de la carpeta.'
    : 'Cuando haya movimientos financieros cargados, los vas a ver acá.');

  return {
    status: sorted.length > 0 ? 'success' : 'empty',
    items: sorted,
    total: sorted.length,
    detail,
  };
}

export function buildRejectedCaseFinancialMovementsState(error) {
  if (error?.httpStatus === 404) {
    return {
      status: 'empty',
      items: [],
      total: 0,
      detail: getFriendlyErrorMessage(error),
    };
  }

  return {
    status: 'error',
    items: [],
    total: 0,
    detail: getFriendlyErrorMessage(error),
  };
}

// --- State builders: Receipts ---

export function buildCaseReceiptsState(payload, fallbackDetail = '') {
  const items = getCaseReceiptItems(payload);
  const sorted = [...items].sort((left, right) => {
    const leftKey = `${left?.issuedDate || left?.createdAt || ''}-${left?.id || 0}`;
    const rightKey = `${right?.issuedDate || right?.createdAt || ''}-${right?.id || 0}`;
    return rightKey.localeCompare(leftKey);
  });
  const latest = sorted[0] || null;
  const detail = fallbackDetail || (sorted.length > 0
    ? 'Este listado muestra los comprobantes registrados para esta carpeta.'
    : 'Cuando se registre un comprobante para esta carpeta, lo vas a ver acá.');

  return {
    status: sorted.length > 0 ? 'success' : 'empty',
    items: sorted,
    total: sorted.length,
    latest,
    detail,
  };
}

export function buildRejectedCaseReceiptsState(error) {
  if (error?.httpStatus === 404) {
    return {
      status: 'empty',
      items: [],
      total: 0,
      latest: null,
      detail: getFriendlyErrorMessage(error),
    };
  }

  return {
    status: 'error',
    items: [],
    total: 0,
    latest: null,
    detail: getFriendlyErrorMessage(error),
  };
}

// --- State builders: Documents ---

export function buildCaseDocumentsState(payload, fallbackDetail = '') {
  const items = getCaseDocumentItems(payload);
  const visibleItems = items.filter((item) => item?.visibleToCustomer === true);
  const hiddenCount = Math.max(items.length - visibleItems.length, 0);
  const detail = fallbackDetail || (hiddenCount > 0
    ? `${hiddenCount} archivo${hiddenCount === 1 ? '' : 's'} sigue${hiddenCount === 1 ? '' : 'n'} en revision y por eso no aparece${hiddenCount === 1 ? '' : 'n'} para abrir desde esta vista.`
    : '');

  return {
    status: visibleItems.length > 0 ? 'success' : 'empty',
    items: visibleItems,
    total: items.length,
    visibleCount: visibleItems.length,
    hiddenCount,
    detail,
  };
}
