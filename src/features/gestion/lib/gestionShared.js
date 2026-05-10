import {
  AUTHORIZER_OPTIONS,
  COMPROBANTES,
  PAYMENT_MODES,
  REPAIR_PART_BUYER_OPTIONS,
  REPAIR_PART_PAYMENT_OPTIONS,
  REPAIR_PART_STATE_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  TODO_RIESGO_ASSIGNABLE_USERS,
  WORKSHOPS,
} from '../constants/gestionOptions';
import { todayIso } from '../../cases/lib/caseAgendaHelpers';
import { getFolderDisplayName } from '../../cases/lib/caseDomainCheckers';
import { numberValue } from './gestionUtils';

// ══════════════════════════════════════════════════════════
// FACTORIES
// ══════════════════════════════════════════════════════════

export function createBudgetLine(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    backendId: null,
    piece: '',
    task: '',
    damageLevel: '',
    partPrice: '',
    replacementDecision: '',
    action: '',
    ...overrides,
  };
}

export function createBudgetService(label, overrides = {}) {
  return {
    id: crypto.randomUUID(),
    label,
    status: 'NO',
    detail: '',
    ...overrides,
  };
}

export function createIngresoItem(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    type: 'Otro',
    detail: '',
    media: 'Carpeta',
    ...overrides,
  };
}

export function createRepairPart(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    backendId: null,
    name: '',
    provider: '',
    amount: '',
    state: 'Pendiente',
    purchaseBy: 'Taller',
    paymentStatus: 'Pendiente',
    source: 'manual',
    budgetAmount: '',
    sourceLineId: '',
    authorized: '',
    receivedDate: '',
    partCode: '',
    ...overrides,
  };
}

export function createAccessoryWork(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    detail: '',
    amount: '',
    includesReplacement: 'NO',
    replacementPiece: '',
    replacementAmount: '',
    ...overrides,
  };
}

export function createSettlement(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    backendId: null,
    kind: 'Parcial',
    amount: '',
    date: '',
    mode: 'Transferencia',
    modeDetail: '',
    reason: '',
    gainsRetention: '',
    ivaRetention: '',
    dreiRetention: '',
    employerContributionRetention: '',
    iibbRetention: '',
    ...overrides,
  };
}

export function createRepairQuoteRow(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    piece: '',
    provider1: '',
    provider2: '',
    provider3: '',
    provider4: '',
    billing: 'A',
    paymentMethod: 'Contado',
    source: 'manual',
    sourceLineId: '',
    ...overrides,
  };
}

export function createTodoRiskInvoice(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    backendId: null,
    invoiceNumber: '',
    amount: '',
    issuedAt: '',
    notes: '',
    ...overrides,
  };
}

export function createLawyerStatusUpdate(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    detail: '',
    date: '',
    notifyClient: false,
    ...overrides,
  };
}

export function createLawyerExpense(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    concept: '',
    amount: '',
    date: '',
    paidBy: 'CLIENTE',
    ...overrides,
  };
}

export function createLawyerClosureItem(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    concept: '',
    amount: '',
    paymentDate: '',
    sumWorkshop: 'SI',
    paidDate: '',
    ...overrides,
  };
}

export function createLawyerInjured(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    injuredRole: 'otro',
    firstName: '',
    lastName: '',
    document: '',
    birthDate: '',
    address: '',
    civilStatus: '',
    phone: '',
    email: '',
    profession: '',
    accreditsIncome: 'SI',
    notes: '',
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════
// BUDGET / REPAIR HELPERS
// ══════════════════════════════════════════════════════════

export function getWorkshopInfo(label) {
  return WORKSHOPS.find((workshop) => workshop.label === label);
}

export function lineIsComplete(line) {
  return Boolean(line.piece && line.task && line.damageLevel);
}

export function isReplacementTask(task) {
  return Boolean(task && task.startsWith('REEMPLAZAR'));
}

export function lineNeedsReplacementDecision(line) {
  return isReplacementTask(line.task);
}

export function getBudgetLineIssues(line) {
  const issues = [];

  if (!line.piece) issues.push('pieza afectada');
  if (!line.task) issues.push('tarea a ejecutar');
  if (!line.damageLevel) issues.push('nivel de dano');
  if (lineNeedsReplacementDecision(line) && !line.replacementDecision) {
    issues.push('decision interna de repuesto');
  }

  return issues;
}

export function getBudgetAction(task) {
  if (!task) return '';
  if (task.startsWith('REEMPLAZAR')) return 'Reemplazar';
  if (task.startsWith('REPARAR')) return 'Reparar';
  if (task === 'CARGAR') return 'Cargar';
  if (task === 'DIFUMINAR') return 'Difuminar';
  if (task === 'ESCUADRAR') return 'Escuadrar';
  return 'Verificar';
}

export function buildBudgetParts(lines) {
  return lines
    .filter((line) => line.piece && isReplacementTask(line.task))
    .map((line) => ({
      lineId: line.id,
      name: line.piece,
      task: line.task,
      damageLevel: line.damageLevel,
      replacementDecision: line.replacementDecision,
      amount: line.partPrice || '0',
    }));
}

export function buildThirdPartyBudgetParts(lines, accessoryWorks = []) {
  const baseParts = buildBudgetParts(lines);
  const accessoryParts = (accessoryWorks || [])
    .filter((work) => work.includesReplacement === 'SI' && work.replacementPiece)
    .map((work) => ({
      lineId: work.id,
      name: work.replacementPiece,
      task: 'REEMPLAZAR',
      damageLevel: 'Trabajo extra',
      replacementDecision: 'Debe reemplazarse',
      amount: work.replacementAmount || work.amount || '0',
    }));

  return [...baseParts, ...accessoryParts];
}

export function getBestQuoteValue(row) {
  const values = ['provider1', 'provider2', 'provider3', 'provider4']
    .map((field) => numberValue(row?.[field]))
    .filter((value) => value > 0);

  return values.length ? Math.min(...values) : 0;
}

export function getThirdPartyMinimumAmount({ minimumLabor = 0, minimumParts = 0, providerMode = '', hasReplacementParts = false }) {
  if (providerMode === 'Provee Taller' && hasReplacementParts) {
    return minimumLabor + minimumParts;
  }

  return minimumLabor;
}

export function getThirdPartyInventoryCode(folderCode, index) {
  return `${folderCode}-${String(index + 1).padStart(2, '0')}`;
}

export function syncThirdPartyQuoteRowsWithBudget(draft) {
  if (!draft.repair.quoteRows) {
    draft.repair.quoteRows = [];
  }

  const budgetParts = buildThirdPartyBudgetParts(draft.budget.lines, draft.budget.accessoryWorks);
  const existingRows = new Map(draft.repair.quoteRows.map((row) => [row.sourceLineId, row]));

  draft.repair.quoteRows = budgetParts.map((part) => ({
    ...createRepairQuoteRow({ piece: part.name, source: 'budget', sourceLineId: part.lineId }),
    ...existingRows.get(part.lineId),
    piece: part.name,
    source: 'budget',
    sourceLineId: part.lineId,
  }));
}

export function syncRepairPartsWithBudget(draft) {
  if (!draft.repair.removedBudgetLineIds) {
    draft.repair.removedBudgetLineIds = [];
  }

  const budgetParts = buildBudgetParts(draft.budget.lines);
  const validBudgetLineIds = new Set(budgetParts.map((part) => part.lineId));
  draft.repair.removedBudgetLineIds = draft.repair.removedBudgetLineIds.filter((lineId) => validBudgetLineIds.has(lineId));

  const removedBudgetLineIds = new Set(draft.repair.removedBudgetLineIds);
  const manualParts = draft.repair.parts.filter((part) => part.source !== 'budget');
  const existingBudgetParts = new Map(
    draft.repair.parts
      .filter((part) => part.source === 'budget' && part.sourceLineId)
      .map((part) => [part.sourceLineId, part]),
  );

  const syncedBudgetParts = budgetParts
    .filter((part) => !removedBudgetLineIds.has(part.lineId))
    .map((part) => {
      const existing = existingBudgetParts.get(part.lineId);

      if (!existing) {
        return createRepairPart({
          name: part.name,
          amount: part.amount,
          budgetAmount: part.amount,
          provider: draft.budget.partsProvider || '',
          source: 'budget',
          sourceLineId: part.lineId,
        });
      }

      return {
        ...existing,
        name: part.name,
        provider: existing.provider || draft.budget.partsProvider || '',
        amount: !existing.amount || existing.amount === existing.budgetAmount ? part.amount : existing.amount,
        budgetAmount: part.amount,
        source: 'budget',
        sourceLineId: part.lineId,
      };
    });

  draft.repair.parts = [...syncedBudgetParts, ...manualParts];
}

// ══════════════════════════════════════════════════════════
// PAYMENT HELPERS
// ══════════════════════════════════════════════════════════

export function collectPaymentEvents(items) {
  return items.flatMap((item) => {
    const events = [];

    if (item.payments.hasSena === 'SI' && item.payments.senaDate && item.payments.senaAmount) {
      events.push({
        id: `${item.id}-sena`,
        type: 'Seña',
        date: item.payments.senaDate,
        amount: numberValue(item.payments.senaAmount),
        gainsRetention: 0,
        ivaRetention: 0,
        dreiRetention: 0,
        employerContributionRetention: 0,
        iibbRetention: 0,
        caseCode: item.code,
        customerName: `${item.customer.lastName}, ${item.customer.firstName}`,
        folderName: `${item.customer.lastName}, ${item.customer.firstName} - ${item.vehicle.brand} ${item.vehicle.model}`,
        repairStatus: item.computed.repairStatus,
        tramiteStatus: item.computed.tramiteStatus,
      });
    }

    item.payments.settlements.forEach((settlement) => {
      if (!settlement.date || !settlement.amount) {
        return;
      }

      events.push({
        id: settlement.id,
        type: settlement.kind,
        date: settlement.date,
        amount: numberValue(settlement.amount),
        gainsRetention: numberValue(settlement.gainsRetention),
        ivaRetention: numberValue(settlement.ivaRetention),
        dreiRetention: numberValue(settlement.dreiRetention),
        employerContributionRetention: numberValue(settlement.employerContributionRetention),
        iibbRetention: numberValue(settlement.iibbRetention),
        caseCode: item.code,
        customerName: `${item.customer.lastName}, ${item.customer.firstName}`,
        folderName: `${item.customer.lastName}, ${item.customer.firstName} - ${item.vehicle.brand} ${item.vehicle.model}`,
        repairStatus: item.computed.repairStatus,
        tramiteStatus: item.computed.tramiteStatus,
      });
    });

    return events;
  });
}

// ══════════════════════════════════════════════════════════
// UTILITY HELPERS
// ══════════════════════════════════════════════════════════

export function triggerBlobDownload(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function triggerDownload(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  triggerBlobDownload(filename, blob);
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
