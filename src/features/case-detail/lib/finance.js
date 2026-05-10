export const MOVEMENT_TYPES = {
  INGRESO: 'ingreso',
  EGRESO: 'egreso',
  AJUSTE: 'ajuste',
};

export function parseFinanceSummary(summaryData) {
  if (!summaryData) return null;
  
  return {
    totalIngresos: parseAmount(summaryData.total_ingresos || summaryData.totalIngresos),
    totalEgresos: parseAmount(summaryData.total_egresos || summaryData.totalEgresos),
    balance: parseAmount(summaryData.saldo || summaryData.balance),
    retenciones: parseAmount(summaryData.retenciones || summaryData.retenciones),
    pendingAmount: parseAmount(summaryData.monto_pendiente || summaryData.pendingAmount),
    approvedAmount: parseAmount(summaryData.monto_aprobado || summaryData.approvedAmount),
    lastUpdate: summaryData.ultima_actualizacion || summaryData.lastUpdate,
  };
}

function parseAmount(amount) {
  if (!amount) return 0;
  if (typeof amount === 'number') return amount;
  const parsed = parseFloat(String(amount).replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

export function parseFinancialMovements(movementsData) {
  if (!movementsData) return [];
  if (!Array.isArray(movementsData)) return [];
  
  return movementsData.map(movement => ({
    id: movement.id || movement.movimiento_id,
    type: parseMovementType(movement.tipo || movement.type),
    amount: parseAmount(movement.monto || movement.amount),
    date: movement.fecha || movement.date,
    description: movement.descripcion || movement.description,
    category: movement.categoria || movement.category,
    status: movement.estado || movement.status,
  }));
}

function parseMovementType(type) {
  if (!type) return MOVEMENT_TYPES.AJUSTE;
  
  const normalized = String(type).toLowerCase().trim();
  
  if (normalized.includes('ingreso') || normalized === 'credit' || normalized === 'in') {
    return MOVEMENT_TYPES.INGRESO;
  }
  if (normalized.includes('egreso') || normalized === 'debit' || normalized === 'out') {
    return MOVEMENT_TYPES.EGRESO;
  }
  return MOVEMENT_TYPES.AJUSTE;
}

export function parseReceipts(receiptsData) {
  if (!receiptsData) return [];
  if (!Array.isArray(receiptsData)) return [];
  
  return receiptsData.map(receipt => ({
    id: receipt.id || receipt.recibo_id,
    number: receipt.numero || receipt.number,
    date: receipt.fecha || receipt.date,
    amount: parseAmount(receipt.monto || receipt.amount),
    type: receipt.tipo || receipt.type,
    status: receipt.estado || receipt.status,
    concept: receipt.concepto || receipt.concept,
  }));
}

export function parseVehicleIntakes(intakesData) {
  if (!intakesData) return [];
  if (!Array.isArray(intakesData)) return [];
  
  return intakesData.map(intake => ({
    id: intake.id || intake.entrada_id,
    date: intake.fecha || intake.date,
    vehiclePlate: intake.patente || intake.vehiclePlate,
    vehicleDescription: intake.descripcion_vehiculo || intake.vehicleDescription,
    entryType: intake.tipo_entrada || intake.entryType,
    observations: intake.observaciones || intake.observations,
    status: intake.estado || intake.status,
  }));
}

export function parseVehicleOutcomes(outcomesData) {
  if (!outcomesData) return [];
  if (!Array.isArray(outcomesData)) return [];
  
  return outcomesData.map(outcome => ({
    id: outcome.id || outcome.salida_id,
    date: outcome.fecha || outcome.date,
    vehiclePlate: outcome.patente || outcome.vehiclePlate,
    vehicleDescription: outcome.descripcion_vehiculo || outcome.vehicleDescription,
    exitType: outcome.tipo_salida || outcome.exitType,
    destination: outcome.destino || outcome.destination,
    observations: outcome.observaciones || outcome.observations,
    status: outcome.estado || outcome.status,
  }));
}

export function calculateFinanceTotals(summary) {
  if (!summary) {
    return {
      total: 0,
      available: 0,
      locked: 0,
      pending: 0,
    };
  }
  
  const total = parseAmount(summary.balance) + parseAmount(summary.totalEgresos);
  const available = parseAmount(summary.balance);
  const locked = parseAmount(summary.retenciones);
  const pending = parseAmount(summary.pendingAmount);
  
  return { total, available, locked, pending };
}

export function formatCurrency(amount) {
  const parsed = parseAmount(amount);
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(parsed);
}

export function getMovementTypeLabel(type) {
  const labels = {
    [MOVEMENT_TYPES.INGRESO]: 'Ingreso',
    [MOVEMENT_TYPES.EGRESO]: 'Egreso',
    [MOVEMENT_TYPES.AJUSTE]: 'Ajuste',
  };
  return labels[type] || type;
}