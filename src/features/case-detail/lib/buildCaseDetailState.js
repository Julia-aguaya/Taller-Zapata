/**
 * buildCaseDetailState.js
 * Transforms backend case detail data into UI state
 */
import { formatBackendState } from '../../cases/lib/caseFormatters';

/**
 * Build the main case detail state
 */
export function buildCaseDetailState(bundle) {
  const { detail, ...subresources } = bundle;

  return {
    // Main case data
    item: detail,
    status: detail ? 'success' : 'error',
    error: detail ? null : 'No se pudo cargar el detalle del caso',
    
    // Subresources
    workflowHistoryState: buildWorkflowHistoryState(subresources.workflowHistory),
    workflowActionsState: buildWorkflowActionsState(subresources.workflowActions),
    auditEventsState: buildAuditEventsState(subresources.auditEvents),
    relationsState: buildCaseRelationsState(subresources.relations),
    insuranceState: buildInsuranceState(subresources.insurance),
    insuranceProcessingState: buildInsuranceProcessingState(subresources.insuranceProcessing),
    insuranceProcessingDocumentsState: buildDocumentsState(subresources.insuranceProcessingDocuments),
    cleasState: buildCleasState(subresources.cleas),
    thirdPartyState: buildThirdPartyState(subresources.thirdParty),
    legalState: buildLegalState(subresources.legal),
    legalNewsState: buildLegalNewsState(subresources.legalNews),
    legalExpensesState: buildLegalExpensesState(subresources.legalExpenses),
    franchiseRecoveryState: buildFranchiseRecoveryState(subresources.franchiseRecovery),
    franchiseState: buildFranchiseState(subresources.franchise),
    budgetState: buildBudgetState(subresources.budget),
    appointmentsState: buildAppointmentsState(subresources.appointments),
    documentsState: buildDocumentsState(subresources.documents),
    financeSummaryState: buildFinanceSummaryState(subresources.financeSummary),
    financialMovementsState: buildFinancialMovementsState(subresources.financialMovements),
    receiptsState: buildReceiptsState(subresources.receipts),
    vehicleIntakesState: buildVehicleIntakesState(subresources.vehicleIntakes),
    vehicleOutcomesState: buildVehicleOutcomesState(subresources.vehicleOutcomes),
  };
}

function buildSuccessState(data, itemsKey = 'items') {
  if (!data) return { status: 'empty', data: null, items: [], total: 0 };
  return {
    status: 'success',
    data,
    items: data[itemsKey] || [],
    total: data.total || data[itemsKey]?.length || 0,
  };
}

function buildErrorState(error, detail = 'Error al cargar') {
  return { status: 'error', data: null, items: [], total: 0, detail };
}

function buildWorkflowHistoryState(data) {
  if (!data) return buildErrorState(null, 'Historial no disponible');
  return buildSuccessState(data, 'history');
}

function buildWorkflowActionsState(data) {
  if (!data) return buildErrorState(null, 'Acciones no disponibles');
  return buildSuccessState(data, 'actions');
}

function buildAuditEventsState(data) {
  if (!data) return buildErrorState(null, 'Auditoría no disponible');
  return buildSuccessState(data, 'events');
}

export function buildCaseRelationsState(data) {
  if (!data) return buildErrorState(null, 'Relaciones no disponibles');
  return buildSuccessState(data, 'relations');
}

export function buildInsuranceState(data) {
  if (!data) return { status: 'empty', data: null };
  return { status: 'success', data };
}

export function buildInsuranceProcessingState(data) {
  if (!data) return { status: 'empty', data: null };
  return { status: 'success', data };
}

function buildDocumentsState(data) {
  if (!data) return buildErrorState(null, 'Documentos no disponibles');
  return buildSuccessState(data, 'items');
}

function buildCleasState(data) {
  if (!data) return { status: 'empty', data: null };
  return { status: 'success', data };
}

function buildThirdPartyState(data) {
  if (!data) return { status: 'empty', data: null };
  return { status: 'success', data };
}

function buildLegalState(data) {
  if (!data) return { status: 'empty', data: null };
  return { status: 'success', data };
}

function buildLegalNewsState(data) {
  if (!data) return buildErrorState(null, 'Noticias legales no disponibles');
  return buildSuccessState(data, 'items');
}

function buildLegalExpensesState(data) {
  if (!data) return buildErrorState(null, 'Gastos legales no disponibles');
  return buildSuccessState(data, 'items');
}

function buildFranchiseRecoveryState(data) {
  if (!data) return { status: 'empty', data: null };
  return { status: 'success', data };
}

function buildFranchiseState(data) {
  if (!data) return { status: 'empty', data: null };
  return { status: 'success', data };
}

function buildBudgetState(data) {
  if (!data) return { status: 'empty', data: null };
  return { status: 'success', data };
}

export function buildAppointmentsState(data) {
  if (!data) return buildErrorState(null, 'Turnos no disponibles');
  return buildSuccessState(data, 'content');
}

function buildFinanceSummaryState(data) {
  if (!data) return { status: 'empty', data: null };
  return { status: 'success', data };
}

function buildFinancialMovementsState(data) {
  if (!data) return buildErrorState(null, 'Movimientos no disponibles');
  return buildSuccessState(data, 'items');
}

function buildReceiptsState(data) {
  if (!data) return buildErrorState(null, 'Recibos no disponibles');
  return buildSuccessState(data, 'items');
}

function buildVehicleIntakesState(data) {
  if (!data) return buildErrorState(null, 'Ingresos de vehículo no disponibles');
  return buildSuccessState(data, 'items');
}

function buildVehicleOutcomesState(data) {
  if (!data) return buildErrorState(null, 'Egresos de vehículo no disponibles');
  return buildSuccessState(data, 'items');
}