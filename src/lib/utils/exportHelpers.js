import { normalizeLookupText } from '../../features/cases/lib/caseNormalizers';
import { getFolderDisplayName } from '../../features/cases/lib/caseDomainCheckers';
import { numberValue } from '../../features/gestion/lib/gestionUtils';

// ══════════════════════════════════════════════════════════
// SIGNATURE BUILDERS (used for backend sync dedup)
// ══════════════════════════════════════════════════════════

export function buildLegalNewsSignature(entry) {
  const date = String(entry?.date || '').trim();
  const detail = normalizeLookupText(entry?.detail || '');
  const notify = entry?.notifyClient ? '1' : '0';
  return `${date}|${detail}|${notify}`;
}

export function buildLegalExpenseSignature(entry) {
  const concept = normalizeLookupText(entry?.concept || '');
  const amount = String(numberValue(entry?.amount || 0));
  const date = String(entry?.date || '').trim();
  const paidBy = String(entry?.paidBy || '').trim().toUpperCase();
  return `${concept}|${amount}|${date}|${paidBy}`;
}

export function buildReceiptSignature(entry) {
  const number = normalizeLookupText(entry?.invoiceNumber || entry?.receiptNumber || entry?.publicId || '');
  const amount = String(numberValue(entry?.amount ?? entry?.total ?? 0));
  const date = String(entry?.issuedAt || entry?.issuedDate || '').trim();
  return `${number}|${amount}|${date}`;
}

export function buildBudgetLineSignature(entry) {
  const piece = normalizeLookupText(entry?.piece || entry?.affectedPiece || '');
  const action = normalizeLookupText(entry?.repairAction || entry?.actionCode || '');
  const task = normalizeLookupText(entry?.task || entry?.taskCode || '');
  const partPrice = String(numberValue(entry?.partPrice ?? entry?.partValue ?? 0));
  const labor = String(numberValue(entry?.laborWithoutVat ?? entry?.laborAmount ?? 0));
  return `${piece}|${task}|${action}|${partPrice}|${labor}`;
}

export function buildPartSignature(entry) {
  const description = normalizeLookupText(entry?.name || entry?.description || '');
  const status = normalizeLookupText(entry?.state || entry?.statusCode || '');
  const price = String(numberValue(entry?.amount ?? entry?.finalPrice ?? 0));
  return `${description}|${status}|${price}`;
}

export function buildFinancialMovementSignature(entry) {
  const movementType = normalizeLookupText(entry?.movementTypeCode || entry?.kind || '');
  const amount = String(numberValue(entry?.netAmount ?? entry?.grossAmount ?? entry?.amount ?? 0));
  const dateRaw = String(entry?.movementAt || entry?.date || '').trim();
  const date = dateRaw.includes('T') ? dateRaw.slice(0, 10) : dateRaw;
  return `${movementType}|${amount}|${date}`;
}

// ══════════════════════════════════════════════════════════
// EXPORT UTILITIES (CSV / HTML / PANEL)
// ══════════════════════════════════════════════════════════

export function escapeCsvValue(value) {
  const normalized = String(value ?? '').replace(/"/g, '""');
  return `"${normalized}"`;
}

export function buildPanelExportRows(items) {
  return items.map((item) => ({
    carpeta: item.code,
    siniestro: item.claimNumber || '',
    cliente: getFolderDisplayName(item),
    vehiculo: `${item.vehicle.brand} ${item.vehicle.model}`,
    dominio: item.vehicle.plate,
    tramite: item.computed.tramiteStatus,
    reparacion: item.computed.repairStatus,
    pagos: item.computed.paymentState,
    tareasPendientes: item.computed.pendingTasksCount,
    fechaEstimada: item.computed.estimatedReferenceDate,
    saldo: item.computed.balance,
    totalCotizado: item.computed.totalQuoted,
  }));
}
