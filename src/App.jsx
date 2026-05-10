import { useEffect, useMemo, useRef, useState } from 'react';
import { getCaseHash, getCaseRouteFromHash, CASE_TABS, REPAIR_TABS } from './features/routing/lib/caseHash';
import { normalizeDocument, normalizePlate, normalizeLookupText } from './features/cases/lib/caseNormalizers';
import { formatBackendState, formatCaseNumber, formatDate, formatCurrency } from './features/cases/lib/caseFormatters';
import { getFriendlyErrorMessage } from './features/cases/lib/caseErrorMessages';
import { getStoredSession, saveSession, clearSession, hasStoredSession } from './features/auth/lib/sessionStorage';
import { getAuthErrorMessage, getSessionExpiredMessage, getLogoutSuccessMessage, getSessionLabel } from './features/auth/lib/authMessages';
import { useBackendSession } from './features/auth/hooks/useBackendSession';
import { useAuthenticatedCases } from './features/cases/hooks/useAuthenticatedCases';
import { filterCases, getBranchOptions, getStateOptions, calculateCaseMetrics, getCaseSearchHaystack, getBackendBranchLabel, getCaseIdentifierLabel, getBackendStatusTone } from './features/cases/lib/caseFilters';
import { getCatalogEntries, getCatalogOptionNames, getCatalogSelectOptions, resolveCatalogCode } from './features/cases/lib/caseCatalogHelpers';
import { formatProbeCheckedAt, maskToken, resolveInsuranceCompanyIdByName } from './features/cases/lib/caseAppUtils';
import { formatWorkflowDomain, getWorkflowHistoryItems, getWorkflowActionsItems } from './features/case-detail/lib/caseWorkflowUtils';
import { getBackendCasesItems, getCaseVehicleLabel, getCaseResponsibleLabel, getCaseNextTaskLabel } from './features/cases/lib/caseDisplayHelpers';
import { useCaseDetail } from './features/case-detail/hooks/useCaseDetail';
import { loadCaseDetailBundle } from './features/case-detail/lib/loadCaseDetailBundle';
import { buildCaseDetailState } from './features/case-detail/lib/buildCaseDetailState';
import { useDocumentEditor } from './features/documents/hooks/useDocumentEditor';
import { validateDocumentMetadata, requiresIssueDate, isVisibleToCustomer, canBePrincipal, getAllowedExtensions, getMaxFileSize, getCategoriesForCaseType } from './features/documents/lib/documentCapabilities';
import { mapDocumentToUI, mapFormToApi, groupDocumentsByCategory, sortDocumentsByDate, filterDocumentsByCategory } from './features/documents/lib/documentMappers';
import { useCaseDraftSync } from './features/cases/hooks/useCaseDraftSync';
import { detectDirtyState, calculateSyncDebounceDelay, prepareSyncPayload, consolidateOperations, calculateSyncRetryDelay, shouldSyncRetry, validateDraftForSync } from './features/cases/lib/caseSyncOperations';
import AuthenticatedAppShell from './app/AuthenticatedAppShell';
import BlockingDocGateModal from './app/BlockingDocGateModal';
import { NAV_ITEMS, getActiveViewTitle } from './app/authenticatedShellConfig';
import {
  clearBackendSession,
  getCaseAppointmentsUrl,
  getCaseAuditEventsUrl,
  getCaseBudgetUrl,
  getCaseDetailUrl,
  getCaseFinanceSummaryUrl,
  getCaseFinancialMovementsUrl,
  getCaseReceiptsUrl,
  getCaseRelationsUrl,
  getCaseInsuranceUrl,
  getCaseInsuranceProcessingUrl,
  getCaseFranchiseUrl,
  getCaseInsuranceProcessingDocumentsUrl,
  getCaseCleasUrl,
  getCaseThirdPartyUrl,
  getCaseLegalUrl,
  getCaseLegalNewsUrl,
  getCaseLegalExpensesUrl,
  getCaseFranchiseRecoveryUrl,
  getCaseVehicleIntakesUrl,
  getCaseVehicleOutcomesUrl,
  getConnectivityProbeUrl,
  getCurrentUserUrl,
  getLoginUrl,
  getUnreadNotificationsUrl,
  getNotificationsUrl,
  getSystemParametersUrl,
  getOperationCatalogsUrl,
  getFinanceCatalogsUrl,
  getInsuranceCatalogsUrl,
  getDocumentsCatalogsUrl,
  getTasksUrl,
  getInsuranceCompaniesUrl,
  getCasesCatalogsUrl,
  loginAgainstBackend,
  createAuthenticatedCase,
  createAuthenticatedCaseBudgetItem,
  createAuthenticatedCaseFinancialMovement,
  createAuthenticatedCaseLegalExpense,
  createAuthenticatedCaseLegalNews,
  createAuthenticatedCasePart,
  createAuthenticatedCaseReceipt,
  createAuthenticatedCaseWorkflowTransition,
  createAuthenticatedDocumentRelation,
  createAuthenticatedPerson,
  createAuthenticatedVehicle,
  markAuthenticatedNotificationAsRead,
  probeBackendConnection,
  readAuthenticatedCasesCatalogs,
  readAuthenticatedCaseAppointments,
  readAuthenticatedCaseAuditEvents,
  readAuthenticatedCaseBudget,
  readAuthenticatedCaseDetail,
  readAuthenticatedCaseDocuments,
  downloadAuthenticatedCaseDocument,
  readAuthenticatedCaseFinanceSummary,
  readAuthenticatedCaseFinancialMovements,
  readAuthenticatedCaseReceipts,
  readAuthenticatedCaseRelations,
  readAuthenticatedCaseInsurance,
  readAuthenticatedCaseInsuranceProcessing,
  readAuthenticatedCaseFranchise,
  readAuthenticatedCaseInsuranceProcessingDocuments,
  readAuthenticatedCaseCleas,
  readAuthenticatedCaseThirdParty,
  readAuthenticatedCaseLegal,
  readAuthenticatedCaseLegalNews,
  readAuthenticatedCaseLegalExpenses,
  readAuthenticatedCaseFranchiseRecovery,
  readAuthenticatedCaseVehicleIntakes,
  readAuthenticatedCaseVehicleOutcomes,
  readAuthenticatedCaseWorkflowActions,
  readAuthenticatedCaseWorkflowHistory,
  readAuthenticatedCases,
  readAuthenticatedUnreadNotifications,
  readAuthenticatedNotifications,
  readAuthenticatedSystemParameters,
  readAuthenticatedOperationCatalogs,
  readAuthenticatedFinanceCatalogs,
  readAuthenticatedInsuranceCatalogs,
  readAuthenticatedDocumentsCatalogs,
  readAuthenticatedTasks,
  readAuthenticatedInsuranceCompanies,
  readAuthenticatedInsuranceCompanyContacts,
  readAuthenticatedUnreadNotificationsCount,
  readBackendSession,
  readCurrentUser,
  replaceAuthenticatedDocument,
  searchAuthenticatedPersons,
  searchAuthenticatedVehicles,
  storeBackendSession,
  updateAuthenticatedDocument,
  updateAuthenticatedDocumentRelation,
  updateAuthenticatedCaseIncident,
  updateAuthenticatedCaseBudgetItem,
  updateAuthenticatedCaseCleas,
  updateAuthenticatedCaseFranchise,
  updateAuthenticatedCaseInsurance,
  updateAuthenticatedCaseInsuranceProcessing,
  updateAuthenticatedCaseLegal,
  updateAuthenticatedCasePart,
  updateAuthenticatedCaseThirdParty,
  uploadAuthenticatedDocument,
  upsertAuthenticatedCaseBudget,
} from './lib/api/backend';
import CaseAppointmentsSection from './components/detail/CaseAppointmentsSection';
import CaseDocumentsSection from './components/detail/CaseDocumentsSection';
import CaseWorkflowSection from './components/detail/CaseWorkflowSection';
import DataField from './components/ui/DataField';
import SelectField from './components/ui/SelectField';
import StatusActionBar from './components/ui/StatusActionBar';
import StatusBadge from './components/ui/StatusBadge';
import StatusStepper from './components/ui/StatusStepper';
import TabButton from './components/ui/TabButton';
import ToggleField from './components/ui/ToggleField';
import NuevoCaso from './features/newCase/components/NuevoCaso';
import PanelGeneral from './features/panel/components/PanelGeneral';
import GestionView from './features/gestion/components/GestionView';
import AgendaView from './features/agenda/components/AgendaView';
import AuthenticatedCasesPreview from './features/panel/components/AuthenticatedCasesPreview';
import { BRANCHES, FRANCHISE_RECOVERY_TRAMITE, PAINT_TYPES, VEHICLE_TYPES, VEHICLE_USES } from './features/newCase/constants/formOptions';
import { formatDocumentAudience, getBackendCaseDetailHeadline, getBackendCaseKey } from './features/panel/lib/panelPreviewHelpers';
import { createEmptyForm } from './features/newCase/factories/newCaseForm';
import { createAuthenticatedCaseDetailInitialState } from './lib/ui/authenticatedCaseDetailState';
import {
  AUTHORIZER_OPTIONS,
  BUDGET_DAMAGE_OPTIONS,
  BUDGET_PART_DECISION_OPTIONS,
  BUDGET_TASK_OPTIONS,
  CIVIL_STATUS_OPTIONS,
  CLEAS_DICTAMEN_OPTIONS,
  CLEAS_PAYMENT_STATUS_OPTIONS,
  CLEAS_SCOPE_OPTIONS,
  COMPROBANTES,
  FRANCHISE_CLIENT_PAYMENT_STATUS_OPTIONS,
  FRANCHISE_MANAGER_OPTIONS,
  FRANCHISE_RECOVERY_DICTAMEN_OPTIONS,
  INGRESO_TYPES,
  LAWYER_CLOSE_BY_OPTIONS,
  LAWYER_EXPEDIENT_DOC_CATEGORY_OPTIONS,
  LAWYER_EXPENSE_PAID_BY_OPTIONS,
  LAWYER_GENERAL_DOC_CATEGORY_OPTIONS,
  LAWYER_INJURED_ROLE_OPTIONS,
  LAWYER_INSTANCE_OPTIONS,
  LAWYER_RECLAMA_OPTIONS,
  LAWYER_TRAMITA_OPTIONS,
  OWNERSHIP_PERCENTAGE_OPTIONS,
  PAYMENT_MODES,
  REPAIR_PART_BUYER_OPTIONS,
  REPAIR_PART_PAYMENT_OPTIONS,
  REPAIR_PART_STATE_OPTIONS,
  REPORT_STATUS_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  THIRD_PARTY_BILLING_OPTIONS,
  THIRD_PARTY_ORDER_STATE_OPTIONS,
  THIRD_PARTY_PARTS_PROVIDER_OPTIONS,
  THIRD_PARTY_PAYMENT_OPTIONS,
  TODO_RIESGO_ASSIGNABLE_USERS,
  TODO_RIESGO_DICTAMEN_OPTIONS,
  TODO_RIESGO_DOC_CATEGORY_OPTIONS,
  TODO_RIESGO_FRANCHISE_STATUS_OPTIONS,
  TODO_RIESGO_INSURANCE_OPTIONS,
  TODO_RIESGO_MODALITY_OPTIONS,
  TODO_RIESGO_QUOTE_STATUS_OPTIONS,
  TODO_RIESGO_RECOVERY_OPTIONS,
  TRANSMISSION_OPTIONS,
  TURNO_STATE_OPTIONS,
  VEHICLE_BRAND_OPTIONS,
  WORKSHOP_OPTIONS,
  WORKSHOPS,
  YES_NO_AV_OPTIONS,
} from './features/gestion/constants/gestionOptions';
import { initialCases } from './lib/mocks/initialCases';
import {
  isCleasCase,
  isFranchiseRecoveryCase,
  isInsuranceWorkflowCase,
  isJudicialInstance,
  isThirdPartyClaimCase,
  isThirdPartyLawyerCase,
  isThirdPartyWorkshopCase,
  isTodoRiesgoCase,
  isThirdPartyDocumentationIncomplete,
  isThirdPartyWorkshopCase as isThirdPartyWorkshopCaseDetailed,
  hasRegistryOwnerIdentity,
} from './features/cases/lib/caseDomainCheckers';
import {
  todayIso,
  normalizeAgendaTask,
  isAgendaTaskResolved,
  setAgendaTaskResolved,
  setAgendaTaskStatus,
  getAgendaTaskDueMeta,
  getAgendaCollectionDescriptors,
  getMutableAgendaCollection,
  buildAgendaStore,
  getAgendaStatusLabel,
  getAgendaPriorityLabel,
  getAgendaPriorityTone,
} from './features/cases/lib/caseAgendaHelpers';
import {
  createFranchiseRecoveryDefaults,
  createBudgetDefaults,
  createTodoRiskDefaults,
  createThirdPartyDefaults,
  createLawyerDefaults,
  createRegistryOwner,
  createThirdPartyParticipant,
  createTodoRiskDocument,
  createTodoRiskTask,
} from './features/cases/lib/caseFactories';



const TRAMITE_TYPES = ['Particular', 'Todo Riesgo', 'CLEAS / Terceros / Franquicia', 'Reclamo de Tercero - Taller', 'Reclamo de Tercero - Abogado', FRANCHISE_RECOVERY_TRAMITE];



































function getCasesTechnicalDetail({ endpoint, httpStatus, errorMessage }) {
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







function getCaseRelationsItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

function buildCaseRelationsState(payload, fallbackDetail = '') {
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

function buildRejectedCaseRelationsState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', items: [], total: 0, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', items: [], total: 0, detail: getFriendlyErrorMessage(error) };
}


function buildCaseInsuranceState(payload, fallbackDetail = '') {
  return {
    status: payload ? 'success' : 'empty',
    data: payload || null,
    detail: fallbackDetail || (payload
      ? 'Datos de cobertura informados para esta carpeta.'
      : 'Cuando se registre la cobertura, vas a verla acá.'),
  };
}

function buildRejectedCaseInsuranceState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', data: null, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', data: null, detail: getFriendlyErrorMessage(error) };
}


function buildCaseInsuranceProcessingState(payload, fallbackDetail = '') {
  return {
    status: payload ? 'success' : 'empty',
    data: payload || null,
    detail: fallbackDetail || (payload
      ? 'Estado actual del trámite con la compañía para esta carpeta.'
      : 'Cuando haya novedades del trámite, vas a verlas acá.'),
  };
}

function buildRejectedCaseInsuranceProcessingState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', data: null, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', data: null, detail: getFriendlyErrorMessage(error) };
}


function buildCaseFranchiseState(payload, fallbackDetail = '') {
  return {
    status: payload ? 'success' : 'empty',
    data: payload || null,
    detail: fallbackDetail || (payload
      ? 'Estos importes muestran la franquicia asociada al caso.'
      : 'Cuando haya datos de franquicia, vas a verlos acá.'),
  };
}

function buildRejectedCaseFranchiseState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', data: null, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', data: null, detail: getFriendlyErrorMessage(error) };
}


function getCaseInsuranceProcessingDocumentItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

function buildCaseInsuranceProcessingDocumentsState(payload, fallbackDetail = '') {
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

function buildRejectedCaseInsuranceProcessingDocumentsState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', items: [], total: 0, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', items: [], total: 0, detail: getFriendlyErrorMessage(error) };
}


function buildCaseCleasState(payload, fallbackDetail = '') {
  return {
    status: payload ? 'success' : 'empty',
    data: payload || null,
    detail: fallbackDetail || (payload
      ? 'Estado actual de gestión CLEAS para esta carpeta.'
      : 'Cuando haya datos CLEAS, vas a verlos acá.'),
  };
}

function buildRejectedCaseCleasState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', data: null, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', data: null, detail: getFriendlyErrorMessage(error) };
}


function buildCaseThirdPartyState(payload, fallbackDetail = '') {
  return {
    status: payload ? 'success' : 'empty',
    data: payload || null,
    detail: fallbackDetail || (payload
      ? 'Información de terceros vinculados a esta carpeta.'
      : 'Cuando haya datos de terceros, vas a verlos acá.'),
  };
}

function buildRejectedCaseThirdPartyState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', data: null, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', data: null, detail: getFriendlyErrorMessage(error) };
}


function buildCaseLegalState(payload, fallbackDetail = '') {
  return {
    status: payload ? 'success' : 'empty',
    data: payload || null,
    detail: fallbackDetail || (payload
      ? 'Información legal vinculada al caso.'
      : 'Cuando haya datos legales, vas a verlos acá.'),
  };
}

function buildRejectedCaseLegalState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', data: null, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', data: null, detail: getFriendlyErrorMessage(error) };
}


function getCaseLegalNewsItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

function buildCaseLegalNewsState(payload, fallbackDetail = '') {
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

function buildRejectedCaseLegalNewsState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', items: [], total: 0, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', items: [], total: 0, detail: getFriendlyErrorMessage(error) };
}


function getCaseLegalExpensesItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

function buildCaseLegalExpensesState(payload, fallbackDetail = '') {
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

function buildRejectedCaseLegalExpensesState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', items: [], total: 0, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', items: [], total: 0, detail: getFriendlyErrorMessage(error) };
}


function buildCaseFranchiseRecoveryState(payload, fallbackDetail = '') {
  return {
    status: payload ? 'success' : 'empty',
    data: payload || null,
    detail: fallbackDetail || (payload
      ? 'Estado de recupero de franquicia informado para esta carpeta.'
      : 'Cuando haya datos de recupero, vas a verlos acá.'),
  };
}

function buildRejectedCaseFranchiseRecoveryState(error) {
  if (error?.httpStatus === 404) {
    return { status: 'empty', data: null, detail: getFriendlyErrorMessage(error) };
  }
  return { status: 'error', data: null, detail: getFriendlyErrorMessage(error) };
}


function getCaseAuditEventItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

function buildCaseAuditEventsState(payload, fallbackDetail = '') {
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

function buildRejectedCaseAuditEventsState(error) {
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

function getCaseDocumentItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

function getCaseAppointmentItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

function getCaseVehicleIntakeItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

function getCaseBudgetItems(payload) {
  return Array.isArray(payload?.items)
    ? payload.items.filter((item) => item?.active !== false)
    : [];
}

function sortAppointmentsByDate(items) {
  return [...items].sort((left, right) => {
    const leftKey = `${left?.appointmentDate || '9999-12-31'}T${left?.appointmentTime || '23:59:59'}`;
    const rightKey = `${right?.appointmentDate || '9999-12-31'}T${right?.appointmentTime || '23:59:59'}`;
    return leftKey.localeCompare(rightKey);
  });
}

function buildCaseAppointmentsState(payload, fallbackDetail = '') {
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

function buildCaseVehicleIntakesState(payload, fallbackDetail = '') {
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

function buildRejectedCaseVehicleIntakesState(error) {
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

function getCaseVehicleOutcomeItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

function buildCaseVehicleOutcomesState(payload, fallbackDetail = '') {
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

function buildRejectedCaseVehicleOutcomesState(error) {
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

function buildCaseBudgetState(payload, fallbackDetail = '') {
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

function buildRejectedCaseBudgetState(error) {
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

function buildCaseFinanceSummaryState(payload, fallbackDetail = '') {
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

function buildRejectedCaseFinanceSummaryState(error) {
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

function getCaseFinancialMovementItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

function getCaseReceiptItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

function buildCaseFinancialMovementsState(payload, fallbackDetail = '') {
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

function buildRejectedCaseFinancialMovementsState(error) {
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

function buildCaseReceiptsState(payload, fallbackDetail = '') {
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

function buildRejectedCaseReceiptsState(error) {
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

function buildCaseDocumentsState(payload, fallbackDetail = '') {
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

function getUnreadNotificationItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

function getNotificationItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

function getSystemParameterItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  return [];
}

function getOperationCatalogSummary(payload) {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  return Object.entries(payload)
    .filter(([, value]) => Array.isArray(value))
    .map(([key, value]) => ({ key, count: value.length }))
    .sort((left, right) => right.count - left.count);
}

function getFinanceCatalogSummary(payload) {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  return Object.entries(payload)
    .filter(([, value]) => Array.isArray(value))
    .map(([key, value]) => ({ key, count: value.length }))
    .sort((left, right) => right.count - left.count);
}

function getInsuranceCatalogSummary(payload) {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  return Object.entries(payload)
    .filter(([, value]) => Array.isArray(value))
    .map(([key, value]) => ({ key, count: value.length }))
    .sort((left, right) => right.count - left.count);
}

function getDocumentsCatalogSummary(payload) {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  return Object.entries(payload)
    .filter(([, value]) => Array.isArray(value))
    .map(([key, value]) => ({ key, count: value.length }))
    .sort((left, right) => right.count - left.count);
}

function getTaskItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function getInsuranceCompanyItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function getInsuranceCompanyContactItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function getUnreadNotificationCount(payload, fallbackCount = 0) {
  const raw = typeof payload === 'number' ? payload : payload?.count;
  const parsed = Number(raw);

  if (Number.isFinite(parsed) && parsed >= 0) {
    return Math.floor(parsed);
  }

  return fallbackCount;
}

function formatNotificationType(typeCode) {
  const normalized = String(typeCode || '').trim().toLowerCase();

  if (!normalized) {
    return 'Aviso';
  }

  const labels = {
    documentacion_vencida: 'Documentacion',
    turno_proximo: 'Turno',
    caso_actualizado: 'Carpeta',
    pago_acreditado: 'Cobro',
    tarea_vencida: 'Pendiente',
  };

  return labels[normalized] || formatBackendState(normalized, 'Aviso');
}

function getNotificationTone(typeCode) {
  const normalized = String(typeCode || '').trim().toLowerCase();

  if (/(error|rechaz|vencid|atras)/.test(normalized)) {
    return 'danger';
  }

  if (/(pago|acredit|resuelt|cerrad)/.test(normalized)) {
    return 'success';
  }

  if (/(turno|document|tarea|caso|carpeta)/.test(normalized)) {
    return 'warning';
  }

  return 'info';
}

function getWorkflowActionAudienceCopy(action) {
  if (!action?.targetStateName) {
    return 'Proximo paso disponible';
  }

  return `${formatWorkflowDomain(action.domain)}: ${action.targetStateName}`;
}

function formatDocumentOrigin(originCode) {
  const normalized = String(originCode || '').trim().toLowerCase();

  if (!normalized) {
    return 'Documento';
  }

  const labels = {
    operacion: 'Seguimiento',
    tramite: 'Tramite',
    documentacion: 'Documentacion',
    seguro: 'Seguro',
    legal: 'Gestión legal',
    finanza: 'Cobro',
    finanzas: 'Cobro',
  };

  return labels[normalized] || formatBackendState(normalized, 'Documento');
}


function formatDocumentDescriptor(document) {
  const mimeType = String(document?.mimeType || '').trim().toLowerCase();
  const fileName = String(document?.fileName || '').trim();
  const extension = fileName.includes('.') ? fileName.split('.').pop().toUpperCase() : '';

  if (mimeType === 'application/pdf') {
    return 'PDF';
  }

  if (mimeType.startsWith('image/')) {
    return extension ? `Imagen ${extension}` : 'Imagen';
  }

  if (mimeType.includes('word')) {
    return 'Documento Word';
  }

  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return 'Planilla';
  }

  if (mimeType.includes('zip') || mimeType.includes('compressed')) {
    return 'Archivo comprimido';
  }

  return extension || 'Archivo';
}

function groupDocumentsByOrigin(documents) {
  const groups = new Map();

  documents.forEach((document) => {
    const key = formatDocumentOrigin(document?.originCode);
    const bucket = groups.get(key) || [];
    bucket.push(document);
    groups.set(key, bucket);
  });

  return Array.from(groups.entries()).map(([origin, items]) => ({
    origin,
    items,
  }));
}

function formatDocumentSize(sizeBytes) {
  const size = Number(sizeBytes || 0);

  if (!Number.isFinite(size) || size <= 0) {
    return '';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatAppointmentTime(time) {
  if (!time) {
    return 'Horario a confirmar';
  }

  return String(time).slice(0, 5);
}

function getAppointmentStatusTone(statusCode) {
  const normalized = String(statusCode || '').trim().toLowerCase();

  if (/(confirm|complet|cerrad)/.test(normalized)) {
    return 'success';
  }

  if (/(reprogram|pend|espera)/.test(normalized)) {
    return 'warning';
  }

  if (/(cancel|error|rechaz)/.test(normalized)) {
    return 'danger';
  }

  return 'info';
}

function buildCaseDetailSupportNotice(parts) {
  const filtered = parts.filter(Boolean);

  if (filtered.length === 0) {
    return '';
  }

  if (filtered.length === 1) {
    return filtered[0];
  }

  if (filtered.length === 2) {
    return `${filtered[0]} ${filtered[1]}`;
  }

  return `${filtered.slice(0, -1).join(' ')} ${filtered[filtered.length - 1]}`;
}

function normalizeAuthenticatedCasesPayload(payload) {
  const items = getBackendCasesItems(payload);

  return {
    items,
    total: typeof payload?.totalElements === 'number' ? payload.totalElements : items.length,
    visible: items.length,
    page: typeof payload?.page === 'number' ? payload.page : 0,
    size: typeof payload?.size === 'number' ? payload.size : items.length,
    totalPages: typeof payload?.totalPages === 'number' ? payload.totalPages : (items.length ? 1 : 0),
  };
}





function summarizeCasesPayload(payload) {
  const { items, total } = normalizeAuthenticatedCasesPayload(payload);
  const firstItem = items[0];
  const firstLabel = firstItem?.folderCode || firstItem?.publicId || firstItem?.id || 'sin registros';

  return {
    total,
    visible: items.length,
    firstLabel,
  };
}


function getCaseClientLabel(item) {
  const directName = item?.customerName || item?.claimantName || item?.insuredName || item?.holderName || item?.ownerName;
  if (directName) return directName;

  const parts = [item?.lastName, item?.firstName].filter(Boolean);
  if (parts.length) return parts.join(', ');

  return 'Cliente no informado';
}















function buildCustomerMockData(items) {
  const registry = new Map();

  items.forEach((item) => {
    const key = normalizeDocument(item.customer.document);
    if (!key || registry.has(key)) return;

    registry.set(key, {
      firstName: item.customer.firstName,
      lastName: item.customer.lastName,
      phone: item.customer.phone,
      document: item.customer.document,
      birthDate: item.customer.birthDate,
      street: item.customer.street,
      streetNumber: item.customer.streetNumber,
      addressExtra: item.customer.addressExtra,
      occupation: item.customer.occupation,
      civilStatus: item.customer.civilStatus,
      locality: item.customer.locality,
      email: item.customer.email,
      referenced: item.customer.referenced,
      referencedName: item.customer.referencedName,
    });
  });

  return registry;
}

function buildVehicleMockData(items) {
  const registry = new Map();

  items.forEach((item) => {
    const key = normalizePlate(item.vehicle.plate);
    if (!key || registry.has(key)) return;

    registry.set(key, {
      brand: item.vehicle.brand,
      model: item.vehicle.model,
      plate: item.vehicle.plate,
      vehicleType: item.vehicle.type,
      vehicleUse: item.vehicle.usage,
      paint: item.vehicle.paint,
      color: item.vehicle.color,
      year: item.vehicle.year,
      engine: item.vehicle.engine,
      chassis: item.vehicle.chassis,
      transmission: item.vehicle.transmission,
      mileage: item.vehicle.mileage,
      observations: item.vehicle.observations,
    });
  });

  return registry;
}

function getWorkshopInfo(label) {
  return WORKSHOPS.find((workshop) => workshop.label === label);
}

function hasVehicleCoreData(vehicle) {
  return Boolean(
    vehicle.brand
      && vehicle.model
      && vehicle.plate
      && vehicle.type
      && vehicle.usage
      && vehicle.paint
      && vehicle.year
      && vehicle.color
      && vehicle.chassis
      && vehicle.engine
      && vehicle.transmission
      && vehicle.mileage,
  );
}



function createTodoRiskInvoice(overrides = {}) {
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



function createRepairQuoteRow(overrides = {}) {
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

function createLawyerStatusUpdate(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    detail: '',
    date: '',
    notifyClient: false,
    ...overrides,
  };
}

function createLawyerExpense(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    concept: '',
    amount: '',
    date: '',
    paidBy: 'CLIENTE',
    ...overrides,
  };
}

function createLawyerClosureItem(overrides = {}) {
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

function createLawyerInjured(overrides = {}) {
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


function getThirdPartyInventoryCode(folderCode, index) {
  return `${folderCode}-${String(index + 1).padStart(2, '0')}`;
}



function getVehicleFieldMissing(vehicle) {
  const missing = [];

  if (!vehicle.brand) missing.push('marca');
  if (!vehicle.model) missing.push('modelo');
  if (!vehicle.plate) missing.push('dominio');
  if (!vehicle.type) missing.push('tipo');
  if (!vehicle.usage) missing.push('uso');
  if (!vehicle.paint) missing.push('pintura');
  if (!vehicle.year) missing.push('año');
  if (!vehicle.color) missing.push('color');
  if (!vehicle.chassis) missing.push('chasis');
  if (!vehicle.engine) missing.push('motor');
  if (!vehicle.transmission) missing.push('caja');
  if (!vehicle.mileage) missing.push('kilometraje');

  return missing;
}


function money(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function numberValue(value) {
  const normalized = Number(String(value || '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(normalized) ? normalized : 0;
}


function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function addBusinessDays(date, days) {
  if (!date || !days) {
    return '';
  }

  const next = new Date(`${date}T12:00:00`);
  let pending = Number(days);

  while (pending > 0) {
    next.setDate(next.getDate() + 1);
    const day = next.getDay();

    if (day !== 0 && day !== 6) {
      pending -= 1;
    }
  }

  return next.toISOString().slice(0, 10);
}

function addYears(date, years) {
  if (!date || !years) {
    return '';
  }

  const next = new Date(`${date}T12:00:00`);
  next.setFullYear(next.getFullYear() + Number(years));
  return next.toISOString().slice(0, 10);
}

function diffDaysFromToday(date) {
  if (!date) {
    return '';
  }

  const today = new Date();
  const base = new Date(`${date}T12:00:00`);
  const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const utcBase = Date.UTC(base.getFullYear(), base.getMonth(), base.getDate());
  return Math.max(Math.floor((utcToday - utcBase) / 86400000), 0);
}


function maxDate(a, b) {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }
  return new Date(`${a}T12:00:00`) > new Date(`${b}T12:00:00`) ? a : b;
}












function isDateInRange(date, from, to) {
  if (!date) {
    return !from && !to;
  }

  const value = new Date(`${date}T12:00:00`).getTime();
  const min = from ? new Date(`${from}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const max = to ? new Date(`${to}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;
  return value >= min && value <= max;
}

function formatMonth(date) {
  if (!date) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
}

function getBudgetServiceStatus(item, label) {
  return item.budget.services?.find((service) => service.label === label)?.status ?? 'NO';
}








function getPrimaryFolderPerson(item) {
  if (isThirdPartyClaimCase(item) && item.thirdParty?.clientRegistry?.isOwner === 'NO') {
    return item.thirdParty.clientRegistry.owners?.find((owner) => owner.firstName || owner.lastName) || item.customer;
  }

  return item.customer;
}

function getFolderDisplayName(item) {
  const person = getPrimaryFolderPerson(item);
  return `${person.lastName || ''}, ${person.firstName || ''}`.replace(/^,\s*/, '').trim() || 'Sin titular';
}



function hasResolvedTodoRiskAgenda(item) {
  return (item.todoRisk?.processing?.agenda ?? []).every((task) => isAgendaTaskResolved(task));
}

function hasPendingTodoRiskAgenda(item) {
  return (item.todoRisk?.processing?.agenda ?? []).some((task) => !isAgendaTaskResolved(task));
}

function isTodoRiskDocumentReady(document) {
  return Boolean(document?.name && document?.uploadedAt);
}

function isTodoRiskDocumentationComplete(items) {
  return Boolean(items.length) && items.every(isTodoRiskDocumentReady);
}

function getTodoRiskPartsAuthorization(parts) {
  if (!parts.length) return 'Sin repuestos';
  if (parts.every((part) => part.authorized === 'NO')) return 'Sin repuestos autorizados';
  const authorizedParts = parts.filter((part) => part.authorized === 'SI');

  if (!authorizedParts.length) return 'Pendiente';
  if (authorizedParts.length === parts.length) return 'Autorización total';
  return 'Autorización parcial';
}

function getTramiteStepperConfig(item) {
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

function getRepairStepperConfig(item) {
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

function getTodoRiskPaymentStatus(expectedDate, paymentDate) {
  if (!paymentDate) {
    if (expectedDate && new Date(`${expectedDate}T23:59:59`) < new Date()) {
      return 'Atrasado';
    }
    return 'Pendiente';
  }

  if (!expectedDate) {
    return 'Pagado a término';
  }

  return new Date(`${paymentDate}T12:00:00`) <= new Date(`${expectedDate}T23:59:59`)
    ? 'Pagado a término'
    : 'Pagado con mora';
}

function hasTodoRiskRetentionsDefined(payments) {
  if (payments.hasRetentions !== 'SI') {
    return true;
  }

  return ['iva', 'gains', 'employerContribution', 'iibb', 'drei', 'other'].every((field) => payments.retentions?.[field] !== '');
}

function getBranchCode(branch) {
  return BRANCHES.find((item) => item.label === branch)?.code ?? 'Z';
}

function getTramiteCode(type) {
  if (type === 'Todo Riesgo') return 'T';
  if (type === 'CLEAS / Terceros / Franquicia') return 'C';
  if (type === 'Reclamo de Tercero - Taller') return 'R';
  if (type === 'Reclamo de Tercero - Abogado') return 'RA';
  if (type === FRANCHISE_RECOVERY_TRAMITE) return 'F';
  return 'P';
}

function buildCaseCode(counter, type, branch) {
  const tramiteCode = getTramiteCode(type);
  const branchCode = getBranchCode(branch);

  if (type === 'Reclamo de Tercero - Abogado') {
    return `${String(counter).padStart(3, '0')}${tramiteCode}${branchCode}`;
  }

  return `${String(counter).padStart(4, '0')}${tramiteCode}${branchCode}`;
}

function claimIncludesInjuries(reclama) {
  return String(reclama || '').includes('lesiones');
}


function getFolderMissing(form) {
  const missing = [];

  if (!form.type) missing.push('tipo de tramite');
  if (!form.firstName) missing.push('nombre');
  if (!form.lastName) missing.push('apellido');
  if (!form.brand) missing.push('marca');
  if (!form.model) missing.push('modelo');
  if (!form.plate) missing.push('dominio');
  if (!form.referenced) missing.push('referenciado si/no');
  if (form.referenced === 'SI' && !form.referencedName) missing.push('nombre del referenciado');

  return missing;
}

function lineIsComplete(line) {
  return Boolean(line.piece && line.task && line.damageLevel);
}

function isReplacementTask(task) {
  return Boolean(task && task.startsWith('REEMPLAZAR'));
}

function lineNeedsReplacementDecision(line) {
  return isReplacementTask(line.task);
}

function getBudgetLineIssues(line) {
  const issues = [];

  if (!line.piece) issues.push('pieza afectada');
  if (!line.task) issues.push('tarea a ejecutar');
  if (!line.damageLevel) issues.push('nivel de dano');
  if (lineNeedsReplacementDecision(line) && !line.replacementDecision) {
    issues.push('decision interna de repuesto');
  }

  return issues;
}

function getBudgetAction(task) {
  if (!task) return '';
  if (task.startsWith('REEMPLAZAR')) return 'Reemplazar';
  if (task.startsWith('REPARAR')) return 'Reparar';
  if (task === 'CARGAR') return 'Cargar';
  if (task === 'DIFUMINAR') return 'Difuminar';
  if (task === 'ESCUADRAR') return 'Escuadrar';
  return 'Verificar';
}

function buildBudgetParts(lines) {
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

function buildThirdPartyBudgetParts(lines, accessoryWorks = []) {
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

function getBestQuoteValue(row) {
  const values = ['provider1', 'provider2', 'provider3', 'provider4']
    .map((field) => numberValue(row?.[field]))
    .filter((value) => value > 0);

  return values.length ? Math.min(...values) : 0;
}

function getThirdPartyMinimumAmount({ minimumLabor = 0, minimumParts = 0, providerMode = '', hasReplacementParts = false }) {
  if (providerMode === 'Provee Taller' && hasReplacementParts) {
    return minimumLabor + minimumParts;
  }

  return minimumLabor;
}

function syncThirdPartyQuoteRowsWithBudget(draft) {
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

function syncRepairPartsWithBudget(draft) {
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

function getComputedCase(item) {
  const budgetServices = item.budget.services?.length ? item.budget.services : createBudgetDefaults().services;
  const ingresoItems = item.repair.ingreso.items?.length
    ? item.repair.ingreso.items
    : item.repair.ingreso.observation
      ? [createIngresoItem({ type: 'Otro', detail: item.repair.ingreso.observation, media: 'Migrado' })]
      : [];
  const partsTotal = item.budget.lines.reduce((sum, line) => sum + numberValue(line.partPrice), 0);
  const laborWithoutVat = numberValue(item.budget.laborWithoutVat);
  const laborVat = laborWithoutVat * 0.21;
  const laborWithVat = laborWithoutVat + laborVat;
  const usesVat = item.payments.comprobante === 'A';
  const totalQuoted = (usesVat ? laborWithVat : laborWithoutVat) + partsTotal;
  const repairPartsTotal = item.repair.parts.reduce((sum, part) => sum + numberValue(part.amount), 0);
  const senaAmount = item.payments.hasSena === 'SI' ? numberValue(item.payments.senaAmount) : 0;
  const settlementsTotal = item.payments.settlements.reduce((sum, settlement) => sum + numberValue(settlement.amount), 0);
  const totalRetentions = item.payments.settlements.reduce(
    (sum, settlement) => sum
      + numberValue(settlement.gainsRetention)
      + numberValue(settlement.ivaRetention)
      + numberValue(settlement.dreiRetention)
      + numberValue(settlement.employerContributionRetention)
      + numberValue(settlement.iibbRetention),
    0,
  );
  const paidAmount = senaAmount + settlementsTotal;
  const balance = Math.max(totalQuoted - paidAmount, 0);
  const incompleteBudgetLine = item.budget.lines.find((line) => !lineIsComplete(line));
  const pendingReplacementDecision = item.budget.lines.find(
    (line) => lineNeedsReplacementDecision(line) && !line.replacementDecision,
  );
  const reportClosed = item.budget.reportStatus === 'Informe cerrado';
  const hasVehicleData = hasVehicleCoreData(item.vehicle);
  const vehicleMissingFields = getVehicleFieldMissing(item.vehicle);
  const canGenerateBudget = Boolean(
    reportClosed
      && item.budget.lines.length
      && !incompleteBudgetLine
      && !pendingReplacementDecision
      && laborWithoutVat > 0
      && item.budget.workshop
      && hasVehicleData,
  );
  const budgetReady = canGenerateBudget && item.budget.generated;
  const budgetParts = buildBudgetParts(item.budget.lines);
  const budgetTotalWithVat = laborWithVat + partsTotal;
  const hasReplacementParts = budgetParts.length > 0;
  const allPartsReceived = hasReplacementParts
    ? budgetParts.every((source) => item.repair.parts.some((part) => part.name === source.name && part.state === 'Recibido'))
    : false;
  const turnoEstimatedExit = addBusinessDays(item.repair.turno.date, item.repair.turno.estimatedDays);
  const turnoReady = Boolean(item.repair.turno.date && item.repair.turno.estimatedDays && item.repair.turno.state && turnoEstimatedExit);
  const reentryEstimatedExit = addBusinessDays(item.repair.egreso.reentryDate, item.repair.egreso.reentryEstimatedDays);
  const hasRepairExitDate = Boolean(item.repair.egreso.date);
  const repairResolved = item.folderCreated && hasRepairExitDate && (item.repair.egreso.shouldReenter === 'NO' || item.repair.egreso.definitiveExit);
  const estimatedReferenceDate = item.repair.egreso.reentryDate || turnoEstimatedExit || item.repair.egreso.date || item.createdAt;
  const paymentState = balance === 0 ? 'Total' : paidAmount > 0 ? 'Parcial' : 'Pendiente';
  const settlementMissingCoreData = item.payments.settlements.some(
    (settlement) => !settlement.amount || !settlement.date || (settlement.kind !== 'Bonificacion' && !settlement.mode),
  );
  const isTodoRiesgo = isTodoRiesgoCase(item);
  const isCleas = isCleasCase(item);
  const isThirdPartyWorkshop = isThirdPartyWorkshopCase(item);
  const isThirdPartyLawyer = isThirdPartyLawyerCase(item);
  const isFranchiseRecovery = isFranchiseRecoveryCase(item);
  const isInsuranceWorkflow = isTodoRiesgo || isCleas || isThirdPartyWorkshop || isThirdPartyLawyer;
  const todoRisk = isInsuranceWorkflow ? createTodoRiskDefaults(item.todoRisk || {}) : null;
  const thirdParty = isThirdPartyClaimCase(item) ? createThirdPartyDefaults(item.thirdParty || {}) : null;

  if (isThirdPartyLawyer) {
    const lawyer = createLawyerDefaults(item.lawyer || {});
    const incidentDate = todoRisk?.incident?.date || '';
    const presentedDate = thirdParty.claim.presentedDate;
    const prescriptionDate = addYears(incidentDate, 3);
    const daysProcessing = diffDaysFromToday(lawyer.entryDate);
    const quoteRows = item.repair.quoteRows || [];
    const subtotalBestQuote = quoteRows.reduce((sum, row) => sum + getBestQuoteValue(row), 0);
    const replacementSources = buildThirdPartyBudgetParts(item.budget.lines, item.budget.accessoryWorks);
    const hasReplacementPartsForClaim = replacementSources.length > 0;
    const totalFinalParts = item.repair.parts.reduce((sum, part) => sum + numberValue(part.amount), 0);
    const documentationComplete = thirdParty.claim.documentationStatus === 'Completa';
    const minimumLabor = numberValue(item.budget.minimumLaborClose);
    const minimumParts = subtotalBestQuote;
    const applicableMinimum = getThirdPartyMinimumAmount({
      minimumLabor,
      minimumParts,
      providerMode: thirdParty.claim.partsProviderMode,
      hasReplacementParts: hasReplacementPartsForClaim,
    });
    const extraWorksTotal = (item.budget.accessoryWorks || []).reduce((sum, work) => sum + numberValue(work.amount), 0);
    const clientPaymentsTotal = (thirdParty.payments.clientPayments || []).reduce((sum, payment) => sum + numberValue(payment.amount), 0);
    const clientExtrasBalance = Math.max(extraWorksTotal - clientPaymentsTotal, 0);
    const hasExtraWorks = item.budget.accessoryWorkEnabled === 'SI' && extraWorksTotal > 0;
    const clientExtrasReady = !hasExtraWorks || clientExtrasBalance === 0;
    const amountToInvoice = numberValue(item.payments.manualTotalAmount || lawyer.closure.totalAmount || item.payments.invoices?.[0]?.amount || 0);
    const amountMeetsMinimum = !applicableMinimum || amountToInvoice >= applicableMinimum;
    const companyPaymentReady = Boolean(item.payments.paymentDate && numberValue(item.payments.depositedAmount) > 0);
    const paymentsReady = companyPaymentReady && clientExtrasReady;
    const paymentsOpen = Boolean(amountToInvoice || item.payments.passedToPaymentsDate || item.payments.paymentDate);
    const primaryRegistryOwner = thirdParty.clientRegistry.owners?.[0];
    const hasPrimaryRegistryOwner = thirdParty.clientRegistry.isOwner === 'SI' || hasRegistryOwnerIdentity(primaryRegistryOwner);
    const hasThirdParties = thirdParty.claim.thirdParties.length > 0;
    const includesInjuries = claimIncludesInjuries(lawyer.reclama);
    const hasInjuredData = !includesInjuries || lawyer.injuredParties.some((injured) => injured.firstName || injured.lastName || injured.document);
    const isJudicial = isJudicialInstance(lawyer.instance);
    const managementAdvanced = Boolean(incidentDate && presentedDate && hasThirdParties && lawyer.repairVehicle);
    const legalAdvanced = Boolean(lawyer.entryDate || lawyer.statusUpdates.some((update) => update.detail || update.date) || lawyer.expedienteDocuments.some((doc) => doc.name || doc.uploadedAt));
    const legalCloseReady = lawyer.closure.closeBy !== 'pendiente' && amountToInvoice > 0;
    const latestPaymentDate = maxDate(item.payments.paymentDate, (thirdParty.payments.clientPayments || []).reduce((latest, payment) => maxDate(latest, payment.date), ''));
    const repairResolvedByFlow = lawyer.repairVehicle === 'NO' || (item.folderCreated && Boolean(item.repair.egreso.date) && (item.repair.egreso.shouldReenter === 'NO' || item.repair.egreso.definitiveExit));

    let repairStatus = 'En trámite';
    if (lawyer.repairVehicle === 'NO') {
      repairStatus = 'No debe repararse';
    } else if (repairResolvedByFlow) {
      repairStatus = 'Reparado';
    } else if (item.repair.egreso.shouldReenter === 'SI' && item.repair.egreso.date) {
      repairStatus = 'Debe reingresar';
    } else if (item.repair.turno.date) {
      repairStatus = 'Con Turno';
    } else if (hasReplacementPartsForClaim && item.repair.parts.some((part) => part.state !== 'Recibido')) {
      repairStatus = 'Faltan repuestos';
    }

    let tramiteStatus = 'Sin presentar';
    if (presentedDate) {
      tramiteStatus = documentationComplete ? 'En trámite' : 'Presentado (PD)';
    }
    if (item.payments.passedToPaymentsDate && !paymentsReady) {
      tramiteStatus = 'Pasado a pagos';
    }
    if (paymentsReady) {
      tramiteStatus = 'Pagado';
    }

    const closeReady = legalCloseReady && paymentsReady && repairResolvedByFlow;
    const closeDate = closeReady ? maxDate(maxDate(lawyer.closure.closeDate, latestPaymentDate), item.repair.egreso.date) : '';
    const blockers = [];

    if (!item.folderCreated) blockers.push('No hay carpeta generada para iniciar el reclamo de tercero por abogado.');
    if (!incidentDate) blockers.push('Falta fecha del siniestro para calcular la prescripción del reclamo.');
    if (!hasThirdParties) blockers.push('Cargá al menos un tercero en Gestión del trámite.');
    if (!hasPrimaryRegistryOwner) blockers.push('Si el cliente no es titular, falta cargar el titular registral principal.');
    if (!documentationComplete) blockers.push('La documentación general del reclamo sigue incompleta.');
    if (!presentedDate) blockers.push('Falta fecha de presentado del reclamo.');
    if (!lawyer.entryDate) blockers.push('Falta fecha de ingreso en la gestión por abogado.');
    if (isJudicial && (!lawyer.cuij || !lawyer.court || !lawyer.autos)) blockers.push('Instancia judicial exige CUIJ, juzgado y autos.');
    if (includesInjuries && !hasInjuredData) blockers.push('El reclamo incluye lesiones: cargá al menos un lesionado.');
    if (!amountMeetsMinimum && amountToInvoice > 0) blockers.push('El importe total quedó por debajo del mínimo operativo definido desde taller.');
    if (!companyPaymentReady) blockers.push('Falta registrar fecha y monto del pago principal del convenio/expediente.');
    if (hasExtraWorks && !clientExtrasReady) blockers.push('Hay tareas extras y todavía no quedó cancelado el tramo particular.');
    if (lawyer.repairVehicle === 'SI' && !repairResolvedByFlow) blockers.push('La reparación todavía no terminó; si no se repara, marcá Repara vehículo = NO.');
    if (!legalCloseReady) blockers.push('La solapa Abogado cierra cuando definís cierre por, importe total y rubros del expediente.');

    return {
      ...item,
      thirdParty,
      todoRisk: createTodoRiskDefaults(item.todoRisk || {}),
      lawyer,
      computed: {
        budgetParts: replacementSources,
        partsTotal,
        repairPartsTotal: totalFinalParts,
        laborWithoutVat,
        laborVat,
        laborWithVat,
        budgetTotalWithVat,
        totalQuoted,
        paidAmount: numberValue(item.payments.depositedAmount),
        balance: Math.max(amountToInvoice - numberValue(item.payments.depositedAmount), 0),
        totalRetentions: Object.values(item.payments.retentions || {}).reduce((sum, value) => sum + numberValue(value), 0),
        paymentState: paymentsReady ? 'Pagado' : companyPaymentReady || clientPaymentsTotal > 0 ? 'Parcial' : 'Pendiente',
        canGenerateBudget,
        budgetReady,
        hasReplacementParts: hasReplacementPartsForClaim,
        allPartsReceived: item.repair.parts.length ? item.repair.parts.every((part) => part.state === 'Recibido') : false,
        partsStatus: item.repair.parts.length ? (item.repair.parts.every((part) => part.state === 'Recibido') ? 'Recibido' : 'Pendiente') : 'Sin repuestos',
        budgetServices,
        ingresoItems,
        turnoEstimatedExit,
        turnoReady,
        reentryEstimatedExit,
        estimatedReferenceDate: item.payments.estimatedPaymentDate || item.repair.turno.date || item.createdAt,
        repairResolved: repairResolvedByFlow,
        closeReady,
        closeDate,
        tramiteStatus,
        repairStatus,
        blockers,
        pendingTasksCount: blockers.length,
        urgency: blockers.length,
        reportClosed,
        hasVehicleData,
        vehicleMissingFields,
        pendingReplacementDecision,
        lawyer: {
          prescriptionDate,
          daysProcessing,
          includesInjuries,
          isJudicial,
          amountToInvoice,
          paymentsReady,
          repairVehicle: lawyer.repairVehicle,
          legalCloseReady,
          expensesTotal: lawyer.closure.expenses.reduce((sum, expense) => sum + numberValue(expense.amount), 0),
        },
        thirdParty: {
          subtotalBestQuote,
          minimumLabor,
          minimumParts,
          applicableMinimum,
          amountMeetsMinimum,
          providerMode: thirdParty.claim.partsProviderMode,
          totalFinalParts,
          finalInFavorTaller: thirdParty.claim.partsProviderMode === 'Provee Taller' && hasReplacementPartsForClaim ? amountToInvoice - totalFinalParts : amountToInvoice,
          amountToInvoice,
          extraWorksTotal,
          clientPaymentsTotal,
          clientExtrasBalance,
          clientExtrasReady,
          hasExtraWorks,
          companyPaymentReady,
          adminAlerts: !amountMeetsMinimum && amountToInvoice > 0 ? [`Aviso al administrador: el importe total ${money(amountToInvoice)} quedó por debajo del mínimo ${money(applicableMinimum)}.`] : [],
        },
        tabs: {
          ficha: hasPrimaryRegistryOwner ? 'resolved' : item.folderCreated ? 'advanced' : 'pending',
          tramite: managementAdvanced ? 'resolved' : 'advanced',
          presupuesto: budgetReady ? 'resolved' : reportClosed || canGenerateBudget ? 'advanced' : 'pending',
          documentacion: documentationComplete ? 'resolved' : thirdParty.claim.documents.length ? 'advanced' : 'pending',
          gestion: lawyer.repairVehicle === 'NO' || repairResolvedByFlow ? 'resolved' : item.repair.turno.date || item.repair.parts.length ? 'advanced' : 'pending',
          pagos: paymentsReady ? 'resolved' : paymentsOpen || clientPaymentsTotal > 0 ? 'advanced' : 'pending',
          abogado: closeReady ? 'resolved' : legalAdvanced ? 'advanced' : 'pending',
        },
      },
    };
  }

  if (isThirdPartyWorkshop) {
    const incidentDate = todoRisk?.incident?.date || '';
    const prescriptionDate = addYears(incidentDate, 3);
    const presentedDate = thirdParty.claim.presentedDate;
    const daysProcessing = diffDaysFromToday(presentedDate);
    const quoteRows = item.repair.quoteRows || [];
    const subtotalBestQuote = quoteRows.reduce((sum, row) => sum + getBestQuoteValue(row), 0);
    const replacementSources = buildThirdPartyBudgetParts(item.budget.lines, item.budget.accessoryWorks);
    const hasReplacementPartsForClaim = replacementSources.length > 0;
    const totalFinalParts = item.repair.parts.reduce((sum, part) => sum + numberValue(part.amount), 0);
    const providerMode = thirdParty.claim.partsProviderMode;
    const documentationComplete = thirdParty.claim.documentationStatus === 'Completa';
    const invoiceAmount = numberValue(item.payments.invoices?.[0]?.amount || 0);
    const agreedAmount = numberValue(todoRisk?.processing?.agreedAmount || 0);
    const minimumLabor = numberValue(item.budget.minimumLaborClose);
    const minimumParts = subtotalBestQuote;
    const applicableMinimum = getThirdPartyMinimumAmount({
      minimumLabor,
      minimumParts,
      providerMode,
      hasReplacementParts: hasReplacementPartsForClaim,
    });
    const amountToInvoice = numberValue(item.payments.depositedAmount || invoiceAmount || agreedAmount || 0);
    const amountMeetsMinimum = !applicableMinimum || amountToInvoice >= applicableMinimum;
    const finalInFavorTaller = providerMode === 'Provee Taller' && hasReplacementPartsForClaim
      ? amountToInvoice - totalFinalParts
      : amountToInvoice;
    const extraWorksTotal = (item.budget.accessoryWorks || []).reduce((sum, work) => sum + numberValue(work.amount), 0);
    const clientPaymentsTotal = (thirdParty.payments.clientPayments || []).reduce((sum, payment) => sum + numberValue(payment.amount), 0);
    const clientExtrasBalance = Math.max(extraWorksTotal - clientPaymentsTotal, 0);
    const hasExtraWorks = item.budget.accessoryWorkEnabled === 'SI' && extraWorksTotal > 0;
    const clientExtrasReady = !hasExtraWorks || clientExtrasBalance === 0;
    const companyPaymentReady = Boolean(item.payments.paymentDate && numberValue(item.payments.depositedAmount) > 0);
    const paymentsReady = companyPaymentReady && clientExtrasReady;
    const paymentStatus = paymentsReady ? 'Pagado' : companyPaymentReady || clientPaymentsTotal > 0 ? 'Parcial' : 'Pendiente';
    const primaryRegistryOwner = thirdParty.clientRegistry.owners?.[0];
    const hasPrimaryRegistryOwner = thirdParty.clientRegistry.isOwner === 'SI' || hasRegistryOwnerIdentity(primaryRegistryOwner);
    const hasThirdParties = thirdParty.claim.thirdParties.length > 0;
    const managementAdvanced = Boolean(incidentDate && presentedDate && hasThirdParties);
    const latestPaymentDate = maxDate(item.payments.paymentDate, (thirdParty.payments.clientPayments || []).reduce((latest, payment) => maxDate(latest, payment.date), ''));
    const allPartsReceived = item.repair.parts.every((part) => part.state === 'Recibido');

    let repairStatus = 'En trámite';
    if (repairResolved) {
      repairStatus = 'Reparado';
    } else if (item.repair.egreso.shouldReenter === 'SI' && item.repair.egreso.date) {
      repairStatus = 'Debe reingresar';
    } else if (item.repair.turno.date) {
      repairStatus = 'Con Turno';
    }

    let tramiteStatus = 'Sin presentar';
    if (presentedDate) {
      tramiteStatus = documentationComplete ? 'En trámite' : 'Presentado (PD)';
    }
    if (item.payments.passedToPaymentsDate && !paymentsReady) {
      tramiteStatus = 'Pasado a pagos';
    }
    if (paymentsReady) {
      tramiteStatus = 'Pagado';
    }

    const closeReady = repairResolved && paymentsReady;
    const closeDate = closeReady ? maxDate(item.repair.egreso.date || item.repair.egreso.reentryDate, latestPaymentDate) : '';
    const adminAlerts = [];
    if (amountToInvoice > 0 && !amountMeetsMinimum) {
      adminAlerts.push(`Aviso al administrador: la cotización acordada ${money(amountToInvoice)} quedó por debajo del mínimo ${money(applicableMinimum)}.`);
    }
    const blockers = [];
    if (!item.folderCreated) blockers.push('No hay carpeta generada para iniciar el reclamo de tercero.');
    if (!incidentDate) blockers.push('Falta fecha del siniestro para calcular la prescripción a 3 años.');
    if (!hasThirdParties) blockers.push('Cargá al menos un tercero en Datos del siniestro.');
    if (!hasPrimaryRegistryOwner) blockers.push('Si el cliente no es titular, falta cargar el titular registral principal.');
    if (!documentationComplete) blockers.push('La documentación sigue incompleta y dispara aviso bloqueante al entrar.');
    if (!presentedDate) blockers.push('Falta fecha de presentación básica del trámite.');
    if (!amountMeetsMinimum && amountToInvoice > 0) blockers.push('La cotización acordada quedó por debajo del mínimo correspondiente y requiere aviso a administración.');
    if (!companyPaymentReady) blockers.push('Falta registrar fecha y monto del pago de la compañía para cerrar Pagos.');
    if (hasExtraWorks && !clientExtrasReady) blockers.push('Hay tareas extras y el cliente todavía no canceló el saldo total de ese tramo particular.');
    if (!closeReady) blockers.push('El reclamo de tercero cierra cuando termina la reparación y queda completo el cierre económico de compañía + cliente si hubo extras.');

    return {
      ...item,
      thirdParty,
      todoRisk: createTodoRiskDefaults(item.todoRisk || {}),
      computed: {
        budgetParts: replacementSources,
        partsTotal,
        repairPartsTotal: totalFinalParts,
        laborWithoutVat,
        laborVat,
        laborWithVat,
        budgetTotalWithVat,
        totalQuoted,
        paidAmount: numberValue(item.payments.depositedAmount),
        balance: Math.max(amountToInvoice - numberValue(item.payments.depositedAmount), 0),
        totalRetentions: Object.values(item.payments.retentions || {}).reduce((sum, value) => sum + numberValue(value), 0),
        paymentState: paymentStatus,
        canGenerateBudget,
        budgetReady,
        hasReplacementParts: hasReplacementPartsForClaim,
        allPartsReceived,
        partsStatus: item.repair.parts.length ? (allPartsReceived ? 'Recibido' : 'Pendiente') : 'Sin repuestos',
        budgetServices,
        ingresoItems,
        turnoEstimatedExit,
        turnoReady,
        reentryEstimatedExit,
        estimatedReferenceDate: item.payments.estimatedPaymentDate || item.repair.turno.date || item.createdAt,
        repairResolved,
        closeReady,
        closeDate,
        tramiteStatus,
        repairStatus,
        blockers,
        pendingTasksCount: blockers.length,
        urgency: blockers.length,
        reportClosed,
        hasVehicleData,
        vehicleMissingFields,
        pendingReplacementDecision,
        todoRisk: {
          prescriptionDate,
          daysProcessing,
          quoteAgreed: amountToInvoice > 0,
          minimumClosingAmount: applicableMinimum,
          amountMeetsMinimum,
          documentationComplete,
          amountToInvoice,
          paymentStatus,
          managementAdvanced,
          hasPendingAgenda: false,
          canProgressFromPresentation: Boolean(presentedDate),
          canCompleteProcessingCore: Boolean(incidentDate),
          paymentsReady,
          noRepairNeeded: false,
          pendingPartsAuthorization: false,
        },
        thirdParty: {
          subtotalBestQuote,
          minimumLabor,
          minimumParts,
          applicableMinimum,
          amountMeetsMinimum,
          providerMode,
          totalFinalParts,
          finalInFavorTaller,
          amountToInvoice,
          extraWorksTotal,
          clientPaymentsTotal,
          clientExtrasBalance,
          clientExtrasReady,
          hasExtraWorks,
          companyPaymentReady,
          adminAlerts,
        },
        tabs: {
          ficha: hasPrimaryRegistryOwner ? 'resolved' : item.folderCreated ? 'advanced' : 'pending',
          tramite: managementAdvanced ? 'resolved' : 'advanced',
          presupuesto: budgetReady ? 'resolved' : reportClosed || canGenerateBudget ? 'advanced' : 'pending',
          documentacion: documentationComplete ? 'resolved' : thirdParty.claim.documents.length ? 'advanced' : 'pending',
          gestion: repairResolved ? 'resolved' : item.repair.turno.date || item.repair.parts.length ? 'advanced' : 'pending',
          pagos: paymentsReady ? 'resolved' : item.payments.invoiceNumber || item.payments.paymentDate || clientPaymentsTotal > 0 ? 'advanced' : 'pending',
        },
      },
    };
  }

  if (isFranchiseRecovery) {
    const franchiseRecovery = createFranchiseRecoveryDefaults(item.franchiseRecovery || {});
    const hasAssociatedFolder = Boolean(franchiseRecovery.associatedFolderCode || franchiseRecovery.associatedCaseId);
    const hasDictamen = Boolean(franchiseRecovery.dictamen && franchiseRecovery.dictamen !== 'Pendiente');
    const repairEnabled = franchiseRecovery.enablesRepair !== 'NO';
    const dictamenShared = franchiseRecovery.dictamen === 'Culpa compartida';
    const amountToRecover = numberValue(franchiseRecovery.amountToRecover);
    const agreementAmount = numberValue(franchiseRecovery.agreementAmount);
    const sharedReferenceAmount = agreementAmount || amountToRecover;
    const clientChargeActive = franchiseRecovery.recoverToClient === 'SI' || dictamenShared;
    const suggestedClientAmount = dictamenShared && sharedReferenceAmount > 0 ? Math.round(sharedReferenceAmount * 0.5) : 0;
    const clientResponsibilitySeed = numberValue(franchiseRecovery.clientResponsibilityAmount);
    const clientResponsibilityAmount = clientChargeActive
      ? (dictamenShared ? clientResponsibilitySeed || suggestedClientAmount : clientResponsibilitySeed)
      : 0;
    const companyExpectedAmount = dictamenShared
      ? Math.max(sharedReferenceAmount - clientResponsibilityAmount, 0)
      : amountToRecover;
    const economicGapAmount = !dictamenShared && agreementAmount > 0 && amountToRecover > 0 && amountToRecover < agreementAmount
      ? agreementAmount - amountToRecover
      : 0;
    const hasEconomicAlert = economicGapAmount > 0;
    const canStartPayments = hasAssociatedFolder && hasDictamen && amountToRecover > 0;
    const paymentsStarted = Boolean(item.payments.passedToPaymentsDate || item.payments.paymentDate || numberValue(item.payments.depositedAmount) > 0);
    const companyPaymentReady = Boolean(item.payments.paymentDate && numberValue(item.payments.depositedAmount) > 0);
    const clientRecoveryReady = !clientChargeActive
      || !clientResponsibilityAmount
      || Boolean(franchiseRecovery.clientRecoveryDate && franchiseRecovery.clientRecoveryStatus === 'Cancelado');
    const paymentsReady = companyPaymentReady && clientRecoveryReady;
    const budgetReadyForFlow = repairEnabled ? budgetReady : true;
    const turnoReadyForFlow = repairEnabled ? turnoReady : true;
    const allPartsReceivedForFlow = repairEnabled ? allPartsReceived : true;
    const repairResolvedForFlow = repairEnabled ? repairResolved : true;

    let repairStatus = 'No debe repararse';
    if (repairEnabled) {
      repairStatus = 'En trámite';
      if (budgetReady && turnoReady) {
        repairStatus = 'Con Turno';
      } else if (budgetReady && hasReplacementParts && !allPartsReceived) {
        repairStatus = 'Faltan repuestos';
      } else if (budgetReady && item.payments.comprobante) {
        repairStatus = 'Dar Turno';
      }
      if (item.repair.egreso.shouldReenter === 'SI' && item.repair.egreso.date) {
        repairStatus = 'Debe reingresar';
      }
      if (repairResolved) {
        repairStatus = 'Reparado';
      }
    }

    let tramiteStatus = 'Sin presentar';
    if (hasAssociatedFolder) {
      tramiteStatus = amountToRecover > 0 && hasDictamen ? 'En trámite' : 'Presentado (PD)';
    }
    if (item.payments.passedToPaymentsDate && !paymentsReady) {
      tramiteStatus = 'Pasado a pagos';
    }
    if (paymentsReady) {
      tramiteStatus = 'Pagado';
    }

    const closeReady = hasAssociatedFolder && amountToRecover > 0 && hasDictamen && repairResolvedForFlow && (paymentsReady || !paymentsStarted);
    const closeDate = closeReady
      ? maxDate(repairEnabled ? item.repair.egreso.date || item.repair.egreso.reentryDate : item.createdAt, item.payments.paymentDate || item.payments.passedToPaymentsDate)
      : '';
    const blockers = [];

    if (!item.folderCreated) blockers.push('No hay carpeta generada para iniciar el recupero de franquicia.');
    if (!hasAssociatedFolder) blockers.push('Vinculá una carpeta compatible de Todo Riesgo para iniciar la gestión.');
    if (!hasDictamen) blockers.push('Definí un dictamen final para el recupero de franquicia.');
    if (!amountToRecover) blockers.push('Cargá el monto a recuperar para cerrar la gestión base.');
    if (repairEnabled && !budgetReady) blockers.push(reportClosed ? 'Presupuesto listo pero falta generar el documento final antes de reparación.' : 'Presupuesto incompleto o en rojo: la reparación de franquicia sigue bloqueada.');
    if (repairEnabled && item.budget.lines.length && incompleteBudgetLine) blockers.push('Hay líneas de presupuesto incompletas y eso frena la reparación del recupero.');
    if (repairEnabled && pendingReplacementDecision) blockers.push('Cada línea REEMPLAZAR debe cerrar su decisión interna antes de avanzar.');
    if (repairEnabled && !canGenerateBudget) blockers.push('No se puede generar presupuesto hasta cerrar informe, vehículo y mano de obra.');
    if (repairEnabled && !item.budget.authorizer) blockers.push('Falta autorizante del presupuesto asociado a la reparación.');
    if (repairEnabled && !turnoReady && budgetReady) blockers.push('La reparación sigue sin turno consistente.');
    if (!repairEnabled && franchiseRecovery.recoverToClient !== 'SI' && franchiseRecovery.recoverToClient !== 'NO') blockers.push('Definí si corresponde recupero a cliente.');
    if (clientChargeActive && !clientResponsibilityAmount) blockers.push('Definí el tramo a cargo del cliente para reflejar el recupero.');
    if (clientChargeActive && clientResponsibilityAmount > 0 && franchiseRecovery.clientRecoveryStatus === 'Cancelado' && !franchiseRecovery.clientRecoveryDate) blockers.push('Si el recupero cliente figura cancelado, cargá la fecha correspondiente.');
    if (paymentsStarted && !paymentsReady) blockers.push('Pagos quedó iniciado de forma básica, pero todavía no se registró el cobro final.');
    if (hasEconomicAlert) blockers.push('El monto a recuperar quedó por debajo del monto acordado con la compañía.');

    let urgency = 0;
    if (!hasAssociatedFolder) urgency += 5;
    if (!hasDictamen) urgency += 4;
    if (!amountToRecover) urgency += 4;
    if (repairEnabled && !budgetReady) urgency += 3;
    if (paymentsStarted && !paymentsReady) urgency += 2;
    if (hasEconomicAlert) urgency += 3;

    return {
      ...item,
      franchiseRecovery,
      computed: {
        budgetParts,
        partsTotal,
        repairPartsTotal,
        laborWithoutVat,
        laborVat,
        laborWithVat,
        budgetTotalWithVat,
        totalQuoted,
        paidAmount: numberValue(item.payments.depositedAmount),
        balance: Math.max(amountToRecover - numberValue(item.payments.depositedAmount), 0),
        totalRetentions,
        paymentState: paymentsReady ? 'Pagado' : paymentsStarted ? 'Parcial' : 'Pendiente',
        canGenerateBudget: repairEnabled ? canGenerateBudget : true,
        budgetReady: budgetReadyForFlow,
        hasReplacementParts: repairEnabled ? hasReplacementParts : false,
        allPartsReceived: allPartsReceivedForFlow,
        partsStatus: repairEnabled ? (hasReplacementParts ? (allPartsReceived ? 'Recibido' : 'Pendiente') : 'Sin repuestos') : 'No aplica',
        budgetServices,
        ingresoItems,
        turnoEstimatedExit,
        turnoReady: turnoReadyForFlow,
        reentryEstimatedExit,
        estimatedReferenceDate: item.payments.paymentDate || item.payments.passedToPaymentsDate || item.createdAt,
        repairResolved: repairResolvedForFlow,
        closeReady,
        closeDate,
        tramiteStatus,
        repairStatus,
        blockers,
        pendingTasksCount: blockers.length,
        urgency,
        reportClosed,
        hasVehicleData,
        vehicleMissingFields,
        pendingReplacementDecision,
        franchiseRecovery: {
          amountToRecover,
          agreementAmount,
          hasAssociatedFolder,
          repairEnabled,
          canRecoverToClient: !repairEnabled,
          recoverToClient: !repairEnabled ? franchiseRecovery.recoverToClient : 'NO',
          dictamenShared,
          clientChargeActive,
          clientResponsibilityAmount,
          suggestedClientAmount,
          companyExpectedAmount,
          economicGapAmount,
          hasEconomicAlert,
          canStartPayments,
          paymentsStarted,
          paymentsReady,
          companyPaymentReady,
          clientRecoveryReady,
          paymentPhaseLabel: !canStartPayments
            ? 'Pendiente base'
            : !item.payments.passedToPaymentsDate
              ? 'Listo para pasar a pagos'
              : !companyPaymentReady
                ? 'Cobro compañía pendiente'
                : clientRecoveryReady
                  ? 'Base cobrada'
                  : 'Cobro cliente pendiente',
        },
        tabs: {
          ficha: item.folderCreated ? 'advanced' : 'pending',
          tramite: hasAssociatedFolder && amountToRecover > 0 && hasDictamen ? 'resolved' : hasAssociatedFolder ? 'advanced' : 'pending',
          presupuesto: repairEnabled ? (budgetReady ? 'resolved' : reportClosed || canGenerateBudget ? 'advanced' : 'pending') : 'resolved',
          gestion: repairResolvedForFlow ? 'resolved' : repairEnabled && budgetReady ? 'advanced' : 'resolved',
          pagos: paymentsReady ? 'resolved' : paymentsStarted ? 'advanced' : 'pending',
        },
      },
    };
  }

  if (isInsuranceWorkflow) {
    if (isCleas) {
      const incidentDate = todoRisk.incident.date;
      const prescriptionDate = addYears(incidentDate, 1);
      const presentedDate = todoRisk.processing.presentedDate;
      const daysProcessing = diffDaysFromToday(presentedDate);
      const cleasScope = todoRisk.processing.cleasScope;
      const dictamen = todoRisk.processing.dictamen || 'Pendiente';
      const quoteStatus = todoRisk.processing.quoteStatus;
      const quoteAgreed = quoteStatus === 'Acordada' && todoRisk.processing.quoteDate && numberValue(todoRisk.processing.agreedAmount) > 0;
      const minimumClosingAmount = numberValue(item.budget.minimumLaborClose);
      const agreedAmount = numberValue(todoRisk.processing.agreedAmount);
      const amountMeetsMinimum = !minimumClosingAmount || agreedAmount >= minimumClosingAmount;
      const documentationComplete = isTodoRiskDocumentationComplete(todoRisk.documentation.items);
      const todoRiskBudgetParts = item.repair.parts.filter((part) => part.source === 'budget');
      const allBudgetPartsReceived = todoRiskBudgetParts.length
        ? todoRiskBudgetParts.every((part) => part.state === 'Recibido')
        : true;
      const hasScheduledTurn = Boolean(item.repair.turno.date);
      const isDamageTotal = cleasScope === 'Sobre daño total';
      const isFranchiseFlow = cleasScope === 'Sobre franquicia';
      const dictamenPending = dictamen === 'Pendiente';
      const dictamenAgainst = dictamen === 'En contra';
      const dictamenFavorable = dictamen === 'A favor';
      const dictamenShared = dictamen === 'Culpa compartida';
      const noRepairNeeded = Boolean(isDamageTotal && dictamenAgainst);
      const franchiseAmount = numberValue(todoRisk.processing.franchiseAmount || todoRisk.franchise.amount);
      const clientChargeDefined = todoRisk.processing.clientChargeAmount !== '';
      const clientChargeSeed = numberValue(todoRisk.processing.clientChargeAmount);
      const clientChargeAmount = isFranchiseFlow && dictamenAgainst && clientChargeDefined
        ? Math.min(clientChargeSeed, agreedAmount)
        : 0;
      const companyFranchisePaymentAmount = isFranchiseFlow && dictamenAgainst && clientChargeDefined
        ? Math.max(franchiseAmount - clientChargeAmount, 0)
        : 0;
      const amountToInvoice = dictamenFavorable
        ? agreedAmount
        : dictamenShared
          ? Math.round(agreedAmount * 0.5)
          : isFranchiseFlow && dictamenAgainst
            ? (clientChargeDefined ? Math.max(agreedAmount - clientChargeAmount, 0) : 0)
            : 0;
      const clientPaymentReady = !isFranchiseFlow || !dictamenAgainst
        ? true
        : Boolean(clientChargeDefined && (!clientChargeAmount || (todoRisk.processing.clientChargeDate && todoRisk.processing.clientChargeStatus === 'Cancelado')));
      const retentionsReady = hasTodoRiskRetentionsDefined(item.payments);
      const paymentStatus = getTodoRiskPaymentStatus(item.payments.estimatedPaymentDate, item.payments.paymentDate);
      const paymentsReady = noRepairNeeded
        ? true
        : Boolean(item.payments.paymentDate && numberValue(item.payments.depositedAmount) > 0 && retentionsReady && clientPaymentReady);
      const managementAdvanced = noRepairNeeded
        ? true
        : Boolean(!dictamenPending && quoteAgreed && amountMeetsMinimum && documentationComplete);
      const canCompleteProcessingCore = Boolean(incidentDate && cleasScope);
      const canProgressFromPresentation = Boolean(presentedDate && !dictamenPending);
      const latestPaymentDate = item.payments.paymentDate || item.payments.passedToPaymentsDate || item.payments.estimatedPaymentDate;

      let repairStatus = 'En trámite';
      if (noRepairNeeded) {
        repairStatus = 'No debe repararse';
      } else if (repairResolved) {
        repairStatus = 'Reparado';
      } else if (item.repair.egreso.shouldReenter === 'SI' && item.repair.egreso.date) {
        repairStatus = 'Debe reingresar';
      } else if (hasScheduledTurn) {
        repairStatus = 'Con Turno';
      } else if (quoteAgreed && hasReplacementParts && !allBudgetPartsReceived) {
        repairStatus = 'Faltan repuestos';
      } else if (quoteAgreed) {
        repairStatus = 'Dar Turno';
      }

      let tramiteStatus = 'Sin presentar';
      if (presentedDate) {
        tramiteStatus = documentationComplete ? 'En trámite' : 'Presentado (PD)';
      }
      if (noRepairNeeded) {
        tramiteStatus = 'Rechazado / Desistido';
      } else if (quoteAgreed) {
        tramiteStatus = 'Acordado';
      }
      if (!noRepairNeeded && item.payments.passedToPaymentsDate && !item.payments.paymentDate) {
        tramiteStatus = 'Pasado a pagos';
      }
      if (!noRepairNeeded && item.payments.paymentDate) {
        tramiteStatus = 'Pagado';
      }

      const closeReady = noRepairNeeded || (repairResolved && paymentsReady);
      const closeDate = closeReady
        ? maxDate(item.repair.egreso.date || item.repair.egreso.reentryDate || presentedDate, latestPaymentDate)
        : '';
      const blockers = [];

      if (!item.folderCreated) blockers.push('No hay carpeta generada para iniciar el flujo CLEAS.');
      if (!incidentDate) blockers.push('Falta fecha del siniestro para calcular prescripción y abrir la secuencia CLEAS.');
      if (!cleasScope) blockers.push('Definí CLEAS sobre franquicia o sobre daño total antes de avanzar.');
      if (!presentedDate && (todoRisk.processing.derivedToInspectionDate || todoRisk.processing.quoteDate || todoRisk.processing.agreedAmount)) blockers.push('La fecha de presentación sigue siendo obligatoria para inspección, cotización y pagos.');
      if (!documentationComplete) blockers.push('Completá la documentación base antes de cerrar Gestión del trámite.');
      if (dictamenPending) blockers.push('Con dictamen pendiente se muestra el flujo, pero no se habilita avance operativo.');
      if (!budgetReady) blockers.push(reportClosed ? 'Presupuesto listo pero falta generar el documento final antes de reparación.' : 'Presupuesto incompleto o en rojo: Gestión reparación permanece bloqueada.');
      if (item.budget.lines.length && incompleteBudgetLine) blockers.push('Hay líneas de presupuesto incompletas y eso frena el flujo operativo.');
      if (pendingReplacementDecision) blockers.push('Cada línea REEMPLAZAR debe cerrar su decisión interna antes de seguir.');
      if (!canGenerateBudget) blockers.push('No se puede generar presupuesto hasta cerrar informe, vehículo y mano de obra.');
      if (!item.budget.authorizer) blockers.push('Falta autorizante del presupuesto.');
      if (!amountMeetsMinimum && quoteAgreed) blockers.push('El monto acordado no alcanza el mínimo para cierre definido en Presupuesto.');
      if (isFranchiseFlow && !franchiseAmount) blockers.push('CLEAS sobre franquicia necesita monto de franquicia para facturación y pagos.');
      if (isFranchiseFlow && dictamenAgainst && !clientChargeDefined) blockers.push('CLEAS sobre franquicia con dictamen en contra exige definir manualmente el monto a cargo del cliente antes de derivar facturación.');
      if (isDamageTotal && dictamenAgainst) blockers.push('Caso especial CLEAS: en daño total con dictamen en contra no sigue reparación normal y se cierra directo.');
      if (!noRepairNeeded && !managementAdvanced) blockers.push('Gestión del trámite sigue abierta hasta cerrar documentación, dictamen y cotización.');
      if (isFranchiseFlow && dictamenAgainst && clientChargeAmount && !clientPaymentReady) blockers.push('Falta registrar el pago a cargo del cliente para cerrar el camino mixto de CLEAS.');
      if (!closeReady) blockers.push('El caso CLEAS cierra cuando termina la reparación y pagos, salvo daño total en contra que se corta directo.');

      let urgency = 0;
      if (!incidentDate) urgency += 5;
      if (!cleasScope) urgency += 4;
      if (dictamenPending) urgency += 4;
      if (!budgetReady) urgency += 4;
      if (!managementAdvanced) urgency += 3;
      if (!paymentsReady && !noRepairNeeded) urgency += 2;

      return {
        ...item,
        todoRisk,
        computed: {
          budgetParts,
          partsTotal,
          repairPartsTotal,
          laborWithoutVat,
          laborVat,
          laborWithVat,
          budgetTotalWithVat,
          totalQuoted,
          paidAmount: numberValue(item.payments.depositedAmount),
          balance: Math.max(amountToInvoice - numberValue(item.payments.depositedAmount), 0),
          totalRetentions: Object.values(item.payments.retentions || {}).reduce((sum, value) => sum + numberValue(value), 0),
          paymentState: paymentsReady ? 'Pagado' : numberValue(item.payments.depositedAmount) > 0 ? 'Parcial' : 'Pendiente',
          canGenerateBudget,
          budgetReady,
          hasReplacementParts,
          allPartsReceived: allBudgetPartsReceived,
          partsStatus: hasReplacementParts ? (allBudgetPartsReceived ? 'Recibido' : 'Pendiente') : 'Sin repuestos',
          budgetServices,
          ingresoItems,
          turnoEstimatedExit,
          turnoReady,
          reentryEstimatedExit,
          estimatedReferenceDate: item.payments.estimatedPaymentDate || item.repair.turno.date || item.createdAt,
          repairResolved,
          closeReady,
          closeDate,
          tramiteStatus,
          repairStatus,
          blockers,
          pendingTasksCount: blockers.length,
          urgency,
          reportClosed,
          hasVehicleData,
          vehicleMissingFields,
          pendingReplacementDecision,
          todoRisk: {
            isCleas: true,
            prescriptionDate,
            daysProcessing,
            quoteAgreed,
            minimumClosingAmount,
            amountMeetsMinimum,
            documentationComplete,
            amountToInvoice,
            paymentStatus,
            managementAdvanced,
            hasPendingAgenda: false,
            canProgressFromPresentation,
            canCompleteProcessingCore,
            paymentsReady,
            noRepairNeeded,
            pendingPartsAuthorization: false,
            cleasScope,
            dictamen,
            franchiseAmount,
            clientChargeDefined,
            clientChargeAmount,
            companyFranchisePaymentAmount,
            clientPaymentReady,
          },
          tabs: {
            ficha: item.folderCreated ? 'advanced' : 'pending',
            tramite: managementAdvanced || noRepairNeeded ? 'advanced' : 'pending',
            presupuesto: budgetReady ? 'resolved' : reportClosed || canGenerateBudget ? 'advanced' : 'pending',
            gestion: repairResolved || noRepairNeeded ? 'resolved' : budgetReady ? 'advanced' : 'pending',
            pagos: paymentsReady ? 'resolved' : amountToInvoice > 0 || clientChargeAmount > 0 ? 'advanced' : 'pending',
          },
        },
      };
    }

    const incidentDate = todoRisk.incident.date;
    const prescriptionDate = addYears(incidentDate, 1);
    const presentedDate = todoRisk.processing.presentedDate;
    const daysProcessing = diffDaysFromToday(presentedDate);
    const hasRecoveryType = Boolean(todoRisk.franchise.recoveryType);
    const quoteStatus = todoRisk.processing.quoteStatus;
    const quoteAgreed = quoteStatus === 'Acordada' && todoRisk.processing.quoteDate && numberValue(todoRisk.processing.agreedAmount) > 0;
    const minimumClosingAmount = numberValue(item.budget.minimumLaborClose);
    const agreedAmount = numberValue(todoRisk.processing.agreedAmount);
    const amountMeetsMinimum = !minimumClosingAmount || agreedAmount >= minimumClosingAmount;
    const hasPendingAgenda = hasPendingTodoRiskAgenda({ todoRisk });
    const resolvedAgenda = hasResolvedTodoRiskAgenda({ todoRisk });
    const documentationComplete = isTodoRiskDocumentationComplete(todoRisk.documentation.items);
    const todoRiskBudgetParts = item.repair.parts.filter((part) => part.source === 'budget');
    const authorizedParts = todoRiskBudgetParts.filter((part) => part.authorized === 'SI');
    const hasAuthorizedPendingParts = authorizedParts.some((part) => part.state !== 'Recibido');
    const hasAuthorizedParts = authorizedParts.length > 0;
    const hasPartsAuthorizationDefined = todoRiskBudgetParts.every((part) => part.authorized === 'SI' || part.authorized === 'NO');
    const allAuthorizedPartsReceived = authorizedParts.length ? authorizedParts.every((part) => part.state === 'Recibido') : false;
    const noPartsNeeded = !budgetParts.length;
    const allPartsDenied = todoRiskBudgetParts.length > 0 && todoRiskBudgetParts.every((part) => part.authorized === 'NO');
    const pendingPartsAuthorization = todoRiskBudgetParts.some((part) => !part.authorized);
    const operativePartsReady = noPartsNeeded || allPartsDenied || allAuthorizedPartsReceived;
    const partsAuthorization = getTodoRiskPartsAuthorization(todoRiskBudgetParts);
    const shouldInvoiceFullAmount = todoRisk.franchise.recoveryType === 'Propia Cía.';
    const franchiseAmount = numberValue(todoRisk.franchise.amount);
    const amountToInvoice = Math.max(shouldInvoiceFullAmount ? agreedAmount : agreedAmount - franchiseAmount, 0);
    const paymentStatus = getTodoRiskPaymentStatus(item.payments.estimatedPaymentDate, item.payments.paymentDate);
    const retentionsReady = hasTodoRiskRetentionsDefined(item.payments);
    const franchiseReadyForPayments = todoRisk.franchise.status !== 'Pendiente';
    const paymentsReady = Boolean(item.payments.paymentDate && numberValue(item.payments.depositedAmount) > 0 && retentionsReady && franchiseReadyForPayments);
    const managementAdvanced = Boolean(operativePartsReady && quoteAgreed && amountMeetsMinimum && resolvedAgenda);
    const canProgressFromPresentation = Boolean(presentedDate);
    const canCompleteProcessingCore = Boolean(incidentDate && hasRecoveryType);
    const latestPaymentDate = item.payments.paymentDate || item.payments.passedToPaymentsDate || item.payments.estimatedPaymentDate;
    const noRepairNeeded = todoRisk.processing.noRepairNeeded;

    const hasScheduledTurn = Boolean(item.repair.turno.date);

    // Prioridad Todo Riesgo: No debe repararse > Reparado > Debe reingresar > Con Turno > Faltan repuestos > Dar Turno > En trámite.
    let repairStatus = 'En trámite';
    if (noRepairNeeded) {
      repairStatus = 'No debe repararse';
    } else if (repairResolved) {
      repairStatus = 'Reparado';
    } else if (item.repair.egreso.shouldReenter === 'SI' && item.repair.egreso.date) {
      repairStatus = 'Debe reingresar';
    } else if (hasScheduledTurn) {
      repairStatus = 'Con Turno';
    } else if (quoteAgreed && hasAuthorizedPendingParts) {
      repairStatus = 'Faltan repuestos';
    } else if (quoteAgreed && (!hasAuthorizedParts || !hasAuthorizedPendingParts) && (noPartsNeeded || allPartsDenied || hasPartsAuthorizationDefined)) {
      repairStatus = 'Dar Turno';
    }

    // Prioridad Todo Riesgo: Pagado > Pasado a pagos > Acordado > En trámite > Presentado (PD) > Sin presentar.
    let tramiteStatus = 'Sin presentar';
    if (presentedDate) {
      tramiteStatus = documentationComplete ? 'En trámite' : 'Presentado (PD)';
    }
    if (quoteAgreed) {
      tramiteStatus = 'Acordado';
    }
    if (item.payments.passedToPaymentsDate && !item.payments.paymentDate) {
      tramiteStatus = 'Pasado a pagos';
    }
    if (item.payments.paymentDate) {
      tramiteStatus = 'Pagado';
    }

    const closeReady = noRepairNeeded || (repairResolved && paymentsReady);
    const closeDate = closeReady ? maxDate(item.repair.egreso.date || item.repair.egreso.reentryDate, latestPaymentDate) : '';
    const blockers = [];

    if (!item.folderCreated) blockers.push('No hay carpeta generada para iniciar el flujo de Todo Riesgo.');
    if (!incidentDate) blockers.push('Falta fecha del siniestro: sin ese dato no corre la prescripción ni se habilitan avances.');
    if (!hasRecoveryType) blockers.push('Completá recupero en Franquicia antes de cargar fecha de presentación o avanzar en tramitación.');
    if (!presentedDate && (todoRisk.processing.derivedToInspectionDate || todoRisk.processing.quoteDate || todoRisk.processing.agreedAmount)) blockers.push('La fecha de presentación es obligatoria para derivación, cotización y montos acordados.');
    if (!amountMeetsMinimum && quoteAgreed) blockers.push('El monto acordado no alcanza el mínimo para cierre definido en Presupuesto.');
    if (!budgetReady) blockers.push(reportClosed ? 'Presupuesto listo pero falta generar el documento final antes de reparación.' : 'Presupuesto incompleto o en rojo: Gestión reparación permanece bloqueada.');
    if (item.budget.lines.length && incompleteBudgetLine) blockers.push('Hay líneas de presupuesto incompletas y eso frena el flujo operativo.');
    if (pendingReplacementDecision) blockers.push('Cada línea REEMPLAZAR debe cerrar su decisión interna antes de seguir.');
    if (!canGenerateBudget) blockers.push('No se puede generar presupuesto hasta cerrar informe, vehículo y mano de obra.');
    if (!item.budget.authorizer) blockers.push('Falta autorizante del presupuesto.');
    if (todoRisk.franchise.recoveryType === 'Cía. del 3ero' && !todoRisk.franchise.associatedCase) blockers.push('Recupero por Cía. del 3ero exige Caso asociado.');
    if (todoRisk.franchise.recoveryType === 'Propia Cía.' && !todoRisk.franchise.dictamen) blockers.push('Recupero por Propia Cía. exige Dictamen.');
    if (todoRisk.franchise.exceedsFranchise === 'NO' && !todoRisk.franchise.recoveryAmount) blockers.push('Si la cotización no supera franquicia, cargá el monto a recuperar.');
    if (pendingPartsAuthorization && canProgressFromPresentation) blockers.push('Definí autorización SI/NO de cada repuesto antes de cerrar Gestión del trámite.');
    if (!managementAdvanced) blockers.push('Gestión del trámite sigue en rojo hasta acordar cotización, resolver agenda y recibir repuestos requeridos o marcar que no aplican.');
    if (!noRepairNeeded && !quoteAgreed) blockers.push('No podés dar turno sin cotización acordada con fecha y monto.');
    if (item.payments.invoice === 'SI' && (!item.payments.businessName || !item.payments.invoiceNumber)) blockers.push('Facturación en SI exige razón social y número principal.');
    if (item.payments.hasRetentions === 'SI' && !retentionsReady) blockers.push('Si hay retenciones, deben quedar todas definidas antes de cerrar Pagos.');
    if (!franchiseReadyForPayments) blockers.push('Pagos no cierra mientras la franquicia siga pendiente.');
    if (!closeReady) blockers.push('El caso Todo Riesgo cierra con pago listo y reparación resuelta, salvo No debe repararse.');

    let urgency = 0;
    if (!incidentDate) urgency += 5;
    if (!hasRecoveryType) urgency += 4;
    if (!budgetReady) urgency += 4;
    if (!managementAdvanced) urgency += 3;
    if (!paymentsReady) urgency += 2;

    return {
      ...item,
      todoRisk,
      computed: {
        budgetParts,
        partsTotal,
        repairPartsTotal,
        laborWithoutVat,
        laborVat,
        laborWithVat,
        budgetTotalWithVat,
        totalQuoted,
        paidAmount: numberValue(item.payments.depositedAmount),
        balance: Math.max(amountToInvoice - numberValue(item.payments.depositedAmount), 0),
        totalRetentions: Object.values(item.payments.retentions || {}).reduce((sum, value) => sum + numberValue(value), 0),
        paymentState: paymentStatus,
        canGenerateBudget,
        budgetReady,
        hasReplacementParts,
        allPartsReceived: operativePartsReady,
        partsStatus: noPartsNeeded || allPartsDenied ? 'Sin repuestos' : allAuthorizedPartsReceived ? 'Recibido' : 'Pendiente',
        budgetServices,
        ingresoItems,
        turnoEstimatedExit,
        turnoReady,
        reentryEstimatedExit,
        estimatedReferenceDate: item.payments.estimatedPaymentDate || item.repair.turno.date || item.createdAt,
        repairResolved,
        closeReady,
        closeDate,
        tramiteStatus,
        repairStatus,
        blockers,
        pendingTasksCount: blockers.length,
        urgency,
        reportClosed,
        hasVehicleData,
        vehicleMissingFields,
        pendingReplacementDecision,
        todoRisk: {
          prescriptionDate,
          daysProcessing,
          quoteAgreed,
          minimumClosingAmount,
          amountMeetsMinimum,
          documentationComplete,
          partsAuthorization,
          amountToInvoice,
          paymentStatus,
          managementAdvanced,
          hasPendingAgenda,
          canProgressFromPresentation,
          canCompleteProcessingCore,
          paymentsReady,
          noRepairNeeded,
          pendingPartsAuthorization,
        },
        tabs: {
          ficha: item.folderCreated ? 'advanced' : 'pending',
          tramite: managementAdvanced ? 'advanced' : 'pending',
          presupuesto: budgetReady ? 'resolved' : reportClosed || canGenerateBudget ? 'advanced' : 'pending',
          gestion: repairResolved || noRepairNeeded ? 'resolved' : 'pending',
          pagos: paymentsReady ? 'resolved' : item.payments.passedToPaymentsDate || item.payments.invoice === 'SI' ? 'advanced' : 'pending',
        },
      },
    };
  }

  // Prioridad Particular: Reparado > Debe reingresar > Con Turno > Faltan repuestos > Dar Turno > En trámite.
  let repairStatus = 'En trámite';
  const hasSelectedComprobante = Boolean(item.payments.comprobante);
  const hasTotalSettlement = item.payments.settlements.some((settlement) => settlement.kind === 'Total');

  if (budgetReady && turnoReady) {
    repairStatus = 'Con Turno';
  } else if (budgetReady && hasReplacementParts && !allPartsReceived) {
    repairStatus = 'Faltan repuestos';
  } else if (budgetReady && hasSelectedComprobante) {
    repairStatus = 'Dar Turno';
  }
  if (item.repair.egreso.shouldReenter === 'SI' && item.repair.egreso.date) {
    repairStatus = 'Debe reingresar';
  }
  if (repairResolved) {
    repairStatus = 'Reparado';
  }

  // Prioridad Particular: Pagado > Pasado a pagos > Ingresado.
  let tramiteStatus = 'Ingresado';
  if (item.folderCreated) {
    tramiteStatus = 'Ingresado';
  }
  if (repairStatus === 'Reparado' && balance > 0) {
    tramiteStatus = 'Pasado a pagos';
  }
  if (hasTotalSettlement && balance === 0) {
    tramiteStatus = 'Pagado';
  }

  const closeReady = repairResolved && balance === 0;
  const latestPaymentDate = item.payments.settlements.reduce((latest, settlement) => maxDate(latest, settlement.date), item.payments.senaDate);
  const closeDate = closeReady ? maxDate(item.repair.egreso.date || item.repair.egreso.reentryDate, latestPaymentDate) : '';
  const blockers = [];

  if (!item.folderCreated) {
    blockers.push('No hay carpeta generada: faltan minimos obligatorios del caso particular.');
  }
  if (!budgetReady) {
    blockers.push(reportClosed ? 'Presupuesto listo pero falta generar el documento final.' : 'Presupuesto incompleto o en rojo: gestión de reparación permanece bloqueada.');
  }
  if (item.budget.lines.length && incompleteBudgetLine) {
    blockers.push('Hay lineas de presupuesto sin pieza afectada, tarea a ejecutar o nivel de dano.');
  }
  if (pendingReplacementDecision) {
    blockers.push('Cada linea con tarea REEMPLAZAR debe definir la decision interna de repuesto antes de cerrar el informe.');
  }
  if (!canGenerateBudget) {
    blockers.push('No se puede generar presupuesto si el informe no esta completo y cerrado.');
  }
  if (!item.budget.workshop) {
    blockers.push('Selecciona el taller antes de cerrar y generar el presupuesto.');
  }
  if (!hasVehicleData) {
    blockers.push('Completa la ficha tecnica del vehiculo antes de cerrar el informe.');
  }
  if (!item.budget.authorizer) {
    blockers.push('Falta autorizante del presupuesto particular.');
  }
  if (!item.budget.estimatedWorkDays) {
    blockers.push('Faltan dias de trabajo estimado del presupuesto.');
  }
  if (!turnoReady && budgetReady) {
    blockers.push('No se puede agendar turno sin fecha, dias estimados, salida estimada y estado.');
  }
  if (!closeReady) {
    blockers.push('El caso no cierra hasta tener salida definitiva/no reingreso y pago total.');
  }
  if (item.payments.hasSena === 'SI' && (!item.payments.senaAmount || !item.payments.senaDate || !item.payments.senaMode)) {
    blockers.push('Seña en SI exige monto, fecha y modo de pago.');
  }
  if (settlementMissingCoreData) {
    blockers.push('Cada cancelación exige monto y fecha; además modo de pago salvo que sea bonificación.');
  }
  if (item.payments.senaMode === 'Otro' && !item.payments.senaModeDetail) {
    blockers.push('Modo de pago Otro exige detalle.');
  }
  if (item.payments.invoice === 'SI' && (!item.payments.businessName || !item.payments.invoiceNumber)) {
    blockers.push('Factura en SI exige razon social y numero.');
  }
  if (item.payments.settlements.some((settlement) => settlement.mode === 'Otro' && !settlement.modeDetail)) {
    blockers.push('Cada cobro con modo Otro requiere detalle obligatorio.');
  }
  if (item.payments.settlements.some((settlement) => settlement.kind === 'Bonificacion' && (!settlement.amount || !settlement.date || !settlement.reason))) {
    blockers.push('Bonificacion exige monto, fecha y motivo.');
  }
  if (item.repair.ingreso.hasObservation === 'SI' && !ingresoItems.length) {
    blockers.push('Ingreso marcado con observaciones pero sin items cargados.');
  }

  let urgency = 0;
  if (!item.folderCreated) urgency += 5;
  if (!budgetReady) urgency += 4;
  if (budgetReady && !turnoReady) urgency += 3;
  if (balance > 0) urgency += 3;
  if (hasReplacementParts && !allPartsReceived) urgency += 2;

  const presupuestoTabState = budgetReady ? 'resolved' : reportClosed || canGenerateBudget ? 'advanced' : 'pending';
  const gestionTabState = repairResolved ? 'resolved' : budgetReady ? 'advanced' : 'pending';

  return {
    ...item,
    computed: {
      budgetParts,
      partsTotal,
      repairPartsTotal,
      laborWithoutVat,
      laborVat,
      laborWithVat,
      budgetTotalWithVat,
      totalQuoted,
      paidAmount,
      balance,
      totalRetentions,
      paymentState,
      canGenerateBudget,
      budgetReady,
      hasReplacementParts,
      allPartsReceived,
      partsStatus: hasReplacementParts ? (allPartsReceived ? 'Recibido' : 'Pendiente') : 'Sin repuestos',
      budgetServices,
      ingresoItems,
      turnoEstimatedExit,
      turnoReady,
      reentryEstimatedExit,
      estimatedReferenceDate,
      repairResolved,
      closeReady,
      closeDate,
      tramiteStatus,
      repairStatus,
      blockers,
      pendingTasksCount: blockers.length,
      urgency,
      reportClosed,
      hasVehicleData,
      vehicleMissingFields,
      pendingReplacementDecision,
      tabs: {
        ficha: item.folderCreated ? 'advanced' : 'pending',
        presupuesto: presupuestoTabState,
        gestion: gestionTabState,
        pagos: balance === 0 ? 'resolved' : paidAmount > 0 ? 'advanced' : 'pending',
      },
    },
  };
}









function getStatusTone(status) {
  if (['Pagado', 'Reparado', 'Pagado a término', 'Autorización total'].includes(status)) return 'success';
  if (['Pasado a pagos', 'Con Turno', 'En trámite', 'Acordado', 'Recibido', 'Parcial', 'Presentado (PD)', 'Autorización parcial'].includes(status)) return 'info';
  return 'danger';
}

function getBudgetPendingMeta(item) {
  const incompleteBudgetLine = item.budget.lines.find((line) => !lineIsComplete(line));

  if (!item.budget.workshop) {
    return {
      reason: 'Definir taller del presupuesto',
      status: 'Selecciona el taller asignado antes de avanzar',
    };
  }

  if (!item.computed.hasVehicleData) {
    const missing = item.computed.vehicleMissingFields.join(', ');
    return {
      reason: 'Completar datos del vehiculo',
      status: missing ? `Falta ${missing}` : 'Revisar ficha tecnica',
    };
  }

  if (item.budget.reportStatus !== 'Informe cerrado') {
    return {
      reason: 'Cerrar informe de presupuesto',
      status: 'El informe sigue abierto y bloquea la emisión',
    };
  }

  if (incompleteBudgetLine) {
    return {
      reason: 'Completar líneas del presupuesto',
      status: 'Falta pieza, tarea o nivel de daño obligatorio',
    };
  }

  if (item.computed.pendingReplacementDecision) {
    return {
      reason: 'Definir decisión interna de repuesto',
      status: 'Cada línea REEMPLAZAR debe indicar si reemplaza o puede repararse',
    };
  }

  if (!numberValue(item.budget.laborWithoutVat)) {
    return {
      reason: 'Definir mano de obra del presupuesto',
      status: 'Falta cargar mano de obra sin IVA para emitir',
    };
  }

  if (!item.budget.generated) {
    return {
      reason: 'Emitir presupuesto cerrado',
      status: 'El informe ya está listo, resta generar el presupuesto',
    };
  }

  return {
    reason: 'Revisar bloqueo de presupuesto',
    status: 'Presupuesto todavía sin habilitar Gestión reparación',
  };
}

function getTurnoPendingMeta(item) {
  const missing = [];

  if (!item.repair.turno.date) missing.push('fecha');
  if (!item.repair.turno.estimatedDays) missing.push('días');
  if (!item.computed.turnoEstimatedExit) missing.push('salida estimada');
  if (!item.repair.turno.state) missing.push('estado');

  return {
    reason: 'Asignar turno de reparación',
    status: missing.length
      ? `Falta ${missing.join(', ')} para agendar`
      : item.repair.turno.state || 'Agenda pendiente',
  };
}

function getPartsPendingMeta(item) {
  const pendingParts = item.repair.parts.filter((part) => part.state !== 'Recibido');

  return {
    reason: 'Completar repuestos para iniciar',
    status: pendingParts.length
      ? `${pendingParts.length} repuesto(s) siguen sin recibir`
      : 'Todavía hay repuestos pendientes',
  };
}

function getReentryPendingMeta(item) {
  return {
    reason: 'Resolver reingreso o egreso definitivo',
    status: item.repair.egreso.reentryDate
      ? `Reingreso previsto para ${formatDate(item.repair.egreso.reentryDate)}`
      : 'Falta definir fecha y salida del reingreso',
  };
}

function getPaymentFilterDate(item, type) {
  if (type === 'Fecha estimada') return item.computed.estimatedReferenceDate;
  if (type === 'Fecha de cierre') return item.computed.closeDate;
  if (type === 'Fecha de cobro') {
    return item.payments.settlements.reduce((latest, settlement) => maxDate(latest, settlement.date), item.payments.senaDate);
  }
  return item.createdAt;
}

function getPendingPriorityMeta(item) {
  const hasIncompleteBudget = !item.computed.budgetReady;
  const missingTurno = item.computed.budgetReady && !item.computed.turnoReady;
  const pendingParts = item.computed.hasReplacementParts && !item.computed.allPartsReceived;
  const needsReentry = item.computed.repairStatus === 'Debe reingresar';
  const franchiseNeedsManagement = isFranchiseRecoveryCase(item) && item.computed.tabs.tramite !== 'resolved';

  if (franchiseNeedsManagement) {
    return {
      score: 115,
      attention: 'danger',
      attentionLabel: 'Urge',
      reason: 'Completar gestión base del recupero',
      status: item.computed.blockers[0] || 'Vinculá carpeta, dictamen y monto a recuperar.',
      target: { tab: 'tramite' },
      routeLabel: 'Gestión del trámite',
    };
  }

  if (missingTurno) {
    const turnoMeta = getTurnoPendingMeta(item);
    return {
      score: 120,
      attention: 'danger',
      attentionLabel: 'Urge',
      reason: turnoMeta.reason,
      status: turnoMeta.status,
      target: { tab: 'gestion', subtab: 'turno' },
      routeLabel: 'Gestión > Turno',
    };
  }

  if (hasIncompleteBudget) {
    const budgetMeta = getBudgetPendingMeta(item);
    return {
      score: 110,
      attention: 'danger',
      attentionLabel: 'Urge',
      reason: budgetMeta.reason,
      status: budgetMeta.status,
      target: { tab: 'presupuesto' },
      routeLabel: 'Presupuesto',
    };
  }

  if (pendingParts) {
    const partsMeta = getPartsPendingMeta(item);
    return {
      score: 100,
      attention: 'danger',
      attentionLabel: 'Urge',
      reason: partsMeta.reason,
      status: partsMeta.status,
      target: { tab: 'gestion', subtab: 'repuestos' },
      routeLabel: 'Gestión > Repuestos',
    };
  }

  if (needsReentry) {
    const reentryMeta = getReentryPendingMeta(item);
    return {
      score: 90,
      attention: 'danger',
      attentionLabel: 'Reingreso',
      reason: reentryMeta.reason,
      status: reentryMeta.status,
      target: { tab: 'gestion', subtab: 'egreso' },
      routeLabel: 'Gestión > Egreso',
    };
  }

  return {
    score: item.computed.urgency,
    attention: item.computed.pendingTasksCount > 0 ? 'danger' : 'info',
    attentionLabel: item.computed.pendingTasksCount > 0 ? 'Atender' : 'OK',
    reason: item.computed.blockers[0] ? 'Resolver bloqueo activo del caso' : 'Seguimiento operativo del caso',
    status: item.computed.blockers[0] || (item.computed.repairStatus === 'En trámite' ? 'Caso en curso' : item.computed.repairStatus),
    target: { tab: 'ficha' },
    routeLabel: 'Ficha técnica',
  };
}



function resolveGestionAccess(item, target = {}) {
  const requestedTab = CASE_TABS.includes(target.tab) ? target.tab : 'ficha';
  const companyWorkflow = isInsuranceWorkflowCase(item) || isFranchiseRecoveryCase(item);
  const thirdPartyWorkshop = isThirdPartyWorkshopCase(item);
  const thirdPartyLawyer = isThirdPartyLawyerCase(item);
  const franchiseRecovery = isFranchiseRecoveryCase(item);
  const franchiseEnablesRepair = franchiseRecovery ? item.franchiseRecovery?.enablesRepair !== 'NO' : true;

  if ((requestedTab === 'tramite' || requestedTab === 'documentacion') && !companyWorkflow) {
    return {
      tab: 'ficha',
      subtab: '',
    };
  }

  if (requestedTab === 'tramite') {
    return {
      tab: 'tramite',
      subtab: '',
    };
  }

  if (requestedTab === 'documentacion') {
    return {
      tab: thirdPartyWorkshop ? 'documentacion' : 'tramite',
      subtab: '',
    };
  }

  if (franchiseRecovery && !franchiseEnablesRepair && ['presupuesto', 'gestion'].includes(requestedTab)) {
    return {
      tab: 'tramite',
      subtab: '',
    };
  }

  if (requestedTab === 'abogado') {
    return {
      tab: thirdPartyLawyer ? 'abogado' : 'ficha',
      subtab: '',
    };
  }

  if (requestedTab !== 'gestion') {
    return {
      tab: requestedTab,
      subtab: '',
    };
  }

  if (!item?.computed?.budgetReady) {
    return {
      tab: item?.computed?.reportClosed ? 'presupuesto' : 'ficha',
      subtab: '',
    };
  }

  return {
    tab: 'gestion',
    subtab: REPAIR_TABS.includes(target.subtab) ? target.subtab : 'repuestos',
  };
}

function collectPaymentEvents(items) {
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

function triggerDownload(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  triggerBlobDownload(filename, blob);
}

function getGestionEntryTarget(item) {
  if (isThirdPartyLawyerCase(item)) {
    return { tab: 'abogado' };
  }

  if (isThirdPartyWorkshopCase(item)) {
    return { tab: 'documentacion' };
  }

  if (isInsuranceWorkflowCase(item) || isFranchiseRecoveryCase(item)) {
    return { tab: 'tramite' };
  }

  return { tab: 'gestion', subtab: 'repuestos' };
}

function inferTramiteTypeFromBackendCase(item) {
  const haystack = [
    item?.caseTypeName,
    item?.caseTypeCode,
    item?.domain,
    item?.workflowDomain,
    item?.currentWorkflowDomain,
    item?.folderCode,
  ]
    .filter(Boolean)
    .map((value) => normalizeLookupText(value))
    .join(' ');

  if (haystack.includes('abogado')) return 'Reclamo de Tercero - Abogado';
  if (haystack.includes('tercero') && haystack.includes('taller')) return 'Reclamo de Tercero - Taller';
  if (haystack.includes('todo riesgo') || haystack.includes('todo_riesgo')) return 'Todo Riesgo';
  if (haystack.includes('cleas') || haystack.includes('franquicia')) return 'CLEAS / Terceros / Franquicia';
  if (haystack.includes('recupero')) return FRANCHISE_RECOVERY_TRAMITE;

  return 'Particular';
}

function buildLocalCaseFromBackend(item, nextCounter) {
  const tramiteType = inferTramiteTypeFromBackendCase(item);
  const isInsuranceCase = ['Todo Riesgo', 'CLEAS / Terceros / Franquicia', 'Reclamo de Tercero - Taller', 'Reclamo de Tercero - Abogado'].includes(tramiteType);
  const isThirdPartyWorkshop = tramiteType === 'Reclamo de Tercero - Taller';
  const isThirdPartyLawyer = tramiteType === 'Reclamo de Tercero - Abogado';
  const isFranchiseRecovery = tramiteType === FRANCHISE_RECOVERY_TRAMITE;
  const holder = String(item?.holderName || item?.customerName || '').trim();
  const holderParts = holder.split(/\s+/).filter(Boolean);

  return {
    id: String(item?.id ?? crypto.randomUUID()),
    code: getBackendCaseKey(item),
    counter: nextCounter,
    tramiteType,
    claimNumber: item?.claimNumber || '',
    branch: item?.branchName || item?.branchCode || BRANCHES[0].label,
    createdAt: String(item?.createdAt || item?.creationDate || item?.openedAt || todayIso()).slice(0, 10),
    folderCreated: true,
    customer: {
      firstName: item?.firstName || holderParts.slice(0, -1).join(' ') || holder || 'Cliente',
      lastName: item?.lastName || holderParts.slice(-1).join(' ') || '',
      phone: item?.phone || '',
      document: item?.dni || item?.document || '',
      birthDate: '',
      locality: '',
      email: item?.email || '',
      street: '',
      streetNumber: '',
      addressExtra: '',
      occupation: '',
      civilStatus: '',
      referenced: 'NO',
      referencedName: '',
    },
    vehicle: {
      brand: item?.brand || item?.vehicleBrand || '',
      model: item?.model || item?.vehicleModel || '',
      plate: item?.plate || item?.patent || item?.licensePlate || '',
      type: '',
      usage: '',
      paint: '',
      year: '',
      color: '',
      chassis: '',
      engine: '',
      transmission: '',
      mileage: '',
      observations: '',
    },
    vehicleMedia: [],
    franchiseRecovery: isFranchiseRecovery ? createFranchiseRecoveryDefaults() : undefined,
    budget: createBudgetDefaults({ workshop: '', authorizer: AUTHORIZER_OPTIONS[0] }),
    todoRisk: isInsuranceCase
      ? createTodoRiskDefaults({
        insurance: { company: '' },
        documentation: { items: [] },
        processing: { agenda: [] },
      })
      : undefined,
    thirdParty: (isThirdPartyWorkshop || isThirdPartyLawyer)
      ? createThirdPartyDefaults({ claim: { documents: [] } })
      : undefined,
    lawyer: isThirdPartyLawyer
      ? createLawyerDefaults({ repairVehicle: 'SI', agenda: [], statusUpdates: [], closure: { expenses: [], items: [] } })
      : undefined,
    repair: {
      parts: [],
      turno: { date: '', estimatedDays: '', state: 'Pendiente programar', notes: '' },
      ingreso: { realDate: '', hasObservation: 'NO', observation: '', items: [] },
      egreso: {
        date: '',
        notes: '',
        shouldReenter: 'SI',
        reentryDate: '',
        reentryEstimatedDays: '',
        reentryState: 'Pendiente programar',
        reentryNotes: '',
        definitiveExit: false,
        repairedPhotos: false,
        repairedMedia: [],
      },
    },
    payments: {
      comprobante: 'A',
      hasSena: 'NO',
      senaAmount: '',
      senaDate: '',
      senaMode: 'Transferencia',
      senaModeDetail: '',
      settlements: [],
      invoice: 'NO',
      businessName: '',
      invoiceNumber: '',
      invoices: [],
      signedAgreementDate: '',
      passedToPaymentsDate: '',
      estimatedPaymentDate: '',
      paymentDate: '',
      depositedAmount: '',
      manualTotalAmount: '',
      hasRetentions: 'NO',
      retentions: {
        iva: '',
        gains: '',
        employerContribution: '',
        iibb: '',
        drei: '',
        other: '',
      },
    },
    meta: {
      dirtyTabs: {},
      lastSavedByTab: {},
      syncErrorsByTab: {},
      removedBudgetItemIds: [],
      removedPartIds: [],
    },
  };
}

function pickFirstNonEmpty(...values) {
  for (const value of values) {
    if (value != null && String(value).trim() !== '') {
      return value;
    }
  }
  return '';
}

function patchCaseWithBackendDetail(localCase, detailState) {
  const normalized = ensureCaseStructure(localCase);
  Object.assign(localCase, normalized);

  const detail = detailState?.data || {};
  const budget = detailState?.budgetState?.data || {};
  const documents = Array.isArray(detailState?.documentsState?.items) ? detailState.documentsState.items : [];
  const appointments = Array.isArray(detailState?.appointmentsState?.items) ? detailState.appointmentsState.items : [];
  const intakes = Array.isArray(detailState?.vehicleIntakesState?.items) ? detailState.vehicleIntakesState.items : [];
  const outcomes = Array.isArray(detailState?.vehicleOutcomesState?.items) ? detailState.vehicleOutcomesState.items : [];
  const insurance = detailState?.insuranceState?.data || {};
  const insuranceProcessing = detailState?.insuranceProcessingState?.data || {};
  const franchise = detailState?.franchiseState?.data || {};
  const thirdParty = detailState?.thirdPartyState?.data || {};
  const legal = detailState?.legalState?.data || {};
  const legalNews = Array.isArray(detailState?.legalNewsState?.items) ? detailState.legalNewsState.items : [];
  const legalExpenses = Array.isArray(detailState?.legalExpensesState?.items) ? detailState.legalExpensesState.items : [];
  const financeSummary = detailState?.financeSummaryState?.data || {};
  const receipts = Array.isArray(detailState?.receiptsState?.items) ? detailState.receiptsState.items : [];
  const financialMovements = Array.isArray(detailState?.financialMovementsState?.items) ? detailState.financialMovementsState.items : [];
  const workflowHistory = Array.isArray(detailState?.workflowHistory) ? detailState.workflowHistory : [];
  const workflowActions = Array.isArray(detailState?.workflowActions) ? detailState.workflowActions : [];

  const mapYesNo = (value) => (value ? 'SI' : 'NO');
  const mapQuoteStatus = (value) => {
    const normalized = normalizeLookupText(value);
    if (normalized.includes('acord')) return 'Acordada';
    if (normalized.includes('observ')) return 'Observada';
    return 'Pendiente';
  };
  const mapFranchiseStatus = (value) => {
    const normalized = normalizeLookupText(value);
    if (normalized.includes('bonific')) return 'Bonificada';
    if (normalized.includes('cobrad')) return 'Cobrada';
    if (normalized.includes('sin')) return 'Sin Franquicia';
    return 'Pendiente';
  };

  localCase.claimNumber = pickFirstNonEmpty(localCase.claimNumber, detail.claimNumber, detail.claimCode, detail.externalReference);
  localCase.customer.firstName = pickFirstNonEmpty(localCase.customer.firstName, detail.firstName, detail.customerFirstName, detail.holderFirstName);
  localCase.customer.lastName = pickFirstNonEmpty(localCase.customer.lastName, detail.lastName, detail.customerLastName, detail.holderLastName, detail.holderName);
  localCase.customer.phone = pickFirstNonEmpty(localCase.customer.phone, detail.phone, detail.customerPhone, detail.holderPhone);
  localCase.customer.document = pickFirstNonEmpty(localCase.customer.document, detail.dni, detail.document, detail.customerDocument, detail.holderDocument);
  localCase.customer.email = pickFirstNonEmpty(localCase.customer.email, detail.email, detail.customerEmail, detail.holderEmail);

  localCase.vehicle.brand = pickFirstNonEmpty(localCase.vehicle.brand, detail.brand, detail.brandText, detail.vehicleBrand);
  localCase.vehicle.model = pickFirstNonEmpty(localCase.vehicle.model, detail.model, detail.modelText, detail.vehicleModel);
  localCase.vehicle.plate = pickFirstNonEmpty(localCase.vehicle.plate, detail.plate, detail.licensePlate, detail.patent, detail.domain);

  localCase.todoRisk = localCase.todoRisk || createTodoRiskDefaults({
    insurance: { company: '' },
    documentation: { items: [] },
    processing: { agenda: [] },
  });

  localCase.todoRisk.insurance.coverageDetail = pickFirstNonEmpty(localCase.todoRisk.insurance.coverageDetail, insurance.coverageDetail);
  localCase.todoRisk.insurance.cleasNumber = pickFirstNonEmpty(localCase.todoRisk.insurance.cleasNumber, insurance.cleasNumber);
  localCase.todoRisk.insurance.policyNumber = pickFirstNonEmpty(localCase.todoRisk.insurance.policyNumber, insurance.policyNumber);
  localCase.todoRisk.insurance.certificateNumber = pickFirstNonEmpty(localCase.todoRisk.insurance.certificateNumber, insurance.certificateNumber);

  localCase.todoRisk.processing.presentedDate = pickFirstNonEmpty(localCase.todoRisk.processing.presentedDate, insuranceProcessing.presentedAt).slice(0, 10);
  localCase.todoRisk.processing.derivedToInspectionDate = pickFirstNonEmpty(localCase.todoRisk.processing.derivedToInspectionDate, insuranceProcessing.inspectionForwardedAt).slice(0, 10);
  localCase.todoRisk.processing.quoteDate = pickFirstNonEmpty(localCase.todoRisk.processing.quoteDate, insuranceProcessing.quotationDate).slice(0, 10);
  localCase.todoRisk.processing.quoteStatus = mapQuoteStatus(pickFirstNonEmpty(localCase.todoRisk.processing.quoteStatus, insuranceProcessing.quotationStatusCode));
  localCase.todoRisk.processing.agreedAmount = pickFirstNonEmpty(localCase.todoRisk.processing.agreedAmount, insuranceProcessing.agreedAmount);
  localCase.todoRisk.processing.noRepairNeeded = Boolean(insuranceProcessing.noRepair);
  localCase.todoRisk.processing.adminTurnOverride = Boolean(insuranceProcessing.adminOverrideAppointment);

  localCase.todoRisk.franchise.status = mapFranchiseStatus(pickFirstNonEmpty(localCase.todoRisk.franchise.status, franchise.franchiseStatusCode));
  localCase.todoRisk.franchise.amount = pickFirstNonEmpty(localCase.todoRisk.franchise.amount, franchise.franchiseAmount);
  localCase.todoRisk.franchise.recoveryType = pickFirstNonEmpty(localCase.todoRisk.franchise.recoveryType, franchise.recoveryTypeCode);
  localCase.todoRisk.franchise.dictamen = pickFirstNonEmpty(localCase.todoRisk.franchise.dictamen, franchise.franchiseOpinionCode);
  localCase.todoRisk.franchise.exceedsFranchise = mapYesNo(Boolean(franchise.exceedsFranchise));
  localCase.todoRisk.franchise.recoveryAmount = pickFirstNonEmpty(localCase.todoRisk.franchise.recoveryAmount, franchise.recoveryAmount);
  localCase.todoRisk.franchise.notes = pickFirstNonEmpty(localCase.todoRisk.franchise.notes, franchise.notes);

  if (typeof budget.totalAmount === 'number' && Number.isFinite(budget.totalAmount)) {
    localCase.budget.amount = String(Math.round(budget.totalAmount));
  }

  if (Array.isArray(budget.items) && budget.items.length) {
    localCase.budget.lines = budget.items.map((entry) => createBudgetLine({
      backendId: entry.id || null,
      piece: entry.affectedPiece || entry.description || '',
      task: entry.taskCode || '',
      damageLevel: entry.damageLevelCode || '',
      partPrice: pickFirstNonEmpty(entry.partValue, ''),
      replacementDecision: entry.partDecisionCode || '',
      action: entry.actionCode || '',
      laborWithoutVat: pickFirstNonEmpty(entry.laborAmount, ''),
      hours: pickFirstNonEmpty(entry.estimatedHours, ''),
    }));

    localCase.budget.services = budget.items.map((entry, index) => ({
      id: entry.id || `${localCase.id}-budget-${index}`,
      label: entry.description || entry.name || `Item ${index + 1}`,
      amount: String(entry.amount ?? entry.total ?? ''),
      status: 'SI',
      observations: entry.notes || '',
    }));
  }

  if (documents.length) {
    localCase.todoRisk.documentation.items = documents.map((doc, index) => ({
      id: doc.id || `${localCase.id}-doc-${index}`,
      category: formatDocumentAudience(doc?.audienceCode),
      name: doc.fileName || doc.name || `Documento ${index + 1}`,
      uploadedAt: (doc.createdAt || doc.uploadedAt || '').slice(0, 10),
      notes: doc.description || '',
    }));
  }

  if (thirdParty && Object.keys(thirdParty).length > 0) {
    localCase.thirdParty = localCase.thirdParty || createThirdPartyDefaults({ claim: { documents: [] } });
    localCase.thirdParty.claim.claimReference = pickFirstNonEmpty(localCase.thirdParty.claim.claimReference, thirdParty.claimReference);
    localCase.thirdParty.claim.documentationStatus = pickFirstNonEmpty(localCase.thirdParty.claim.documentationStatus, thirdParty.documentationStatusCode, 'Incompleta');
    localCase.thirdParty.claim.documentationAccepted = Boolean(thirdParty.documentationAccepted);
    localCase.thirdParty.claim.partsProviderMode = pickFirstNonEmpty(localCase.thirdParty.claim.partsProviderMode, thirdParty.partsProvisionModeCode, 'Provee Cía.');
  }

  if (legal && Object.keys(legal).length > 0) {
    localCase.lawyer = localCase.lawyer || createLawyerDefaults({ agenda: [], statusUpdates: [], closure: { expenses: [], items: [] } });
    localCase.lawyer.tramita = pickFirstNonEmpty(localCase.lawyer.tramita, legal.processorCode, 'Con Poder');
    localCase.lawyer.reclama = pickFirstNonEmpty(localCase.lawyer.reclama, legal.claimantCode, 'Daño material');
    localCase.lawyer.instance = pickFirstNonEmpty(localCase.lawyer.instance, legal.instanceCode, 'Administrativa');
    localCase.lawyer.entryDate = pickFirstNonEmpty(localCase.lawyer.entryDate, legal.entryDate).slice(0, 10);
    localCase.lawyer.cuij = pickFirstNonEmpty(localCase.lawyer.cuij, legal.cuij);
    localCase.lawyer.court = pickFirstNonEmpty(localCase.lawyer.court, legal.court);
    localCase.lawyer.autos = pickFirstNonEmpty(localCase.lawyer.autos, legal.caseNumber);
    localCase.lawyer.opponentLawyer = pickFirstNonEmpty(localCase.lawyer.opponentLawyer, legal.counterpartLawyer);
    localCase.lawyer.opponentPhone = pickFirstNonEmpty(localCase.lawyer.opponentPhone, legal.counterpartPhone);
    localCase.lawyer.opponentEmail = pickFirstNonEmpty(localCase.lawyer.opponentEmail, legal.counterpartEmail);
    localCase.lawyer.repairVehicle = mapYesNo(legal.repairsVehicle !== false);
    localCase.lawyer.observations = pickFirstNonEmpty(localCase.lawyer.observations, legal.observations, legal.closingNotes);
    localCase.lawyer.closure.closeBy = pickFirstNonEmpty(localCase.lawyer.closure.closeBy, legal.closedByCode, 'pendiente');
    localCase.lawyer.closure.closeDate = pickFirstNonEmpty(localCase.lawyer.closure.closeDate, legal.legalCloseDate).slice(0, 10);
    localCase.lawyer.closure.totalAmount = pickFirstNonEmpty(localCase.lawyer.closure.totalAmount, legal.totalProceedsAmount);
  }

  if (legalNews.length) {
    localCase.lawyer = localCase.lawyer || createLawyerDefaults({ agenda: [], statusUpdates: [], closure: { expenses: [], items: [] } });
    localCase.lawyer.statusUpdates = legalNews.map((entry, index) => ({
      id: entry.id || `${localCase.id}-legal-news-${index}`,
      date: (entry.newsDate || '').slice(0, 10),
      detail: entry.detail || '',
      notifyClient: Boolean(entry.notifyCustomer),
      notifiedAt: (entry.notifiedAt || '').slice(0, 10),
    }));
  }

  if (legalExpenses.length) {
    localCase.lawyer = localCase.lawyer || createLawyerDefaults({ agenda: [], statusUpdates: [], closure: { expenses: [], items: [] } });
    localCase.lawyer.closure.expenses = legalExpenses.map((entry, index) => ({
      id: entry.id || `${localCase.id}-legal-expense-${index}`,
      concept: entry.concept || '',
      amount: pickFirstNonEmpty(entry.amount, ''),
      date: (entry.expenseDate || '').slice(0, 10),
      paidBy: pickFirstNonEmpty(entry.paidByCode, 'CLIENTE'),
    }));
  }

  if (financeSummary && Object.keys(financeSummary).length > 0) {
    localCase.payments.manualTotalAmount = pickFirstNonEmpty(localCase.payments.manualTotalAmount, financeSummary.totalAplicado);
    localCase.payments.depositedAmount = pickFirstNonEmpty(localCase.payments.depositedAmount, financeSummary.totalIngresos);
    localCase.payments.hasRetentions = Number(financeSummary.totalRetenciones || 0) > 0 ? 'SI' : localCase.payments.hasRetentions;
    localCase.payments.retentions.other = pickFirstNonEmpty(localCase.payments.retentions.other, financeSummary.totalRetenciones);
  }

  if (receipts.length) {
    const latestReceipt = receipts[0];
    localCase.payments.invoice = 'SI';
    localCase.payments.invoiceNumber = pickFirstNonEmpty(localCase.payments.invoiceNumber, latestReceipt.receiptNumber);
    localCase.payments.businessName = pickFirstNonEmpty(localCase.payments.businessName, latestReceipt.receiverBusinessName);
    localCase.payments.paymentDate = pickFirstNonEmpty(localCase.payments.paymentDate, latestReceipt.issuedDate).slice(0, 10);
    localCase.payments.depositedAmount = pickFirstNonEmpty(localCase.payments.depositedAmount, latestReceipt.total);
    localCase.payments.invoices = receipts.map((entry, index) => createTodoRiskInvoice({
      id: `${localCase.id}-receipt-${index}`,
      backendId: entry.id || null,
      invoiceNumber: entry.receiptNumber || entry.publicId || '',
      amount: pickFirstNonEmpty(entry.total, ''),
      issuedAt: (entry.issuedDate || '').slice(0, 10),
      notes: entry.notes || '',
    }));
  }

  if (financialMovements.length && (!localCase.payments.settlements || localCase.payments.settlements.length === 0)) {
    localCase.payments.settlements = financialMovements.slice(0, 20).map((entry, index) => createSettlement({
      id: `${localCase.id}-movement-${index}`,
      backendId: entry.id || null,
      kind: entry.netAmount === entry.grossAmount ? 'Total' : 'Parcial',
      amount: pickFirstNonEmpty(entry.netAmount, entry.grossAmount, ''),
      date: (entry.movementAt || '').slice(0, 10),
      mode: pickFirstNonEmpty(entry.paymentMethodCode, 'Transferencia'),
      modeDetail: entry.paymentMethodDetail || '',
    }));
  }

  if (appointments.length) {
    const next = appointments[0];
    localCase.repair.turno.date = pickFirstNonEmpty(localCase.repair.turno.date, next.scheduledDate, next.date);
    localCase.repair.turno.state = 'Con Turno';
  }

  if (intakes.length) {
    const latestIntake = intakes[0];
    localCase.repair.ingreso.realDate = pickFirstNonEmpty(localCase.repair.ingreso.realDate, latestIntake.intakeDate, latestIntake.date);
  }

  if (outcomes.length) {
    const latestOutcome = outcomes[0];
    localCase.repair.egreso.date = pickFirstNonEmpty(localCase.repair.egreso.date, latestOutcome.outcomeDate, latestOutcome.date);
  }

  if (Array.isArray(detailState?.partsState?.items) && detailState.partsState.items.length) {
    localCase.repair.parts = detailState.partsState.items.map((entry) => createRepairPart({
      backendId: entry.id || null,
      name: entry.description || '',
      provider: entry.finalSupplier || '',
      amount: pickFirstNonEmpty(entry.finalPrice, ''),
      state: entry.statusCode || 'Pendiente',
      purchaseBy: entry.purchasedByCode || 'Taller',
      paymentStatus: entry.paymentStatusCode || 'Pendiente',
      budgetAmount: pickFirstNonEmpty(entry.budgetedPrice, ''),
      source: 'budget',
      sourceLineId: entry.budgetItemId ? String(entry.budgetItemId) : '',
      authorized: entry.authorizationCode || '',
      receivedDate: (entry.receivedDate || '').slice(0, 10),
      partCode: entry.partCode || '',
      used: Boolean(entry.used),
      returned: Boolean(entry.returned),
    }));
  }

  localCase.backendWorkflow = {
    history: workflowHistory,
    actions: workflowActions,
    updatedAt: new Date().toISOString(),
  };
}

function deriveWorkflowOverrides(history = []) {
  const latestByDomain = new Map();

  history
    .slice()
    .sort((left, right) => String(right?.stateDate || '').localeCompare(String(left?.stateDate || '')))
    .forEach((entry) => {
      const domain = normalizeLookupText(entry?.domain);
      if (!domain || latestByDomain.has(domain)) return;
      latestByDomain.set(domain, entry);
    });

  const mapTabStatus = (entry) => {
    const raw = normalizeLookupText(entry?.stateName || entry?.stateCode);
    if (!raw) return 'pending';
    if (/(pagad|cerrad|finaliz|resuelt|complet|acordad)/.test(raw)) return 'resolved';
    if (/(pend|sin|espera|nuevo|inici)/.test(raw)) return 'pending';
    return 'advanced';
  };

  const tramiteEntry = latestByDomain.get('tramite') || latestByDomain.get('documentacion');
  const repairEntry = latestByDomain.get('reparacion');
  const paymentEntry = latestByDomain.get('pago');
  const legalEntry = latestByDomain.get('legal');

  const paymentRaw = normalizeLookupText(paymentEntry?.stateName || paymentEntry?.stateCode);
  const paymentState = !paymentRaw
    ? ''
    : /(pagad|total|complet)/.test(paymentRaw)
      ? 'Total'
      : /(parcial)/.test(paymentRaw)
        ? 'Parcial'
        : 'Pendiente';

  return {
    tramiteStatus: pickFirstNonEmpty(tramiteEntry?.stateName, tramiteEntry?.stateCode),
    repairStatus: pickFirstNonEmpty(repairEntry?.stateName, repairEntry?.stateCode),
    paymentState,
    tabs: {
      tramite: mapTabStatus(tramiteEntry),
      documentacion: mapTabStatus(latestByDomain.get('documentacion') || tramiteEntry),
      gestion: mapTabStatus(repairEntry),
      pagos: mapTabStatus(paymentEntry),
      abogado: mapTabStatus(legalEntry),
    },
  };
}

function applyBackendWorkflowToCase(item) {
  const history = Array.isArray(item?.backendWorkflow?.history) ? item.backendWorkflow.history : [];
  if (!history.length || !item?.computed) {
    return item;
  }

  const overrides = deriveWorkflowOverrides(history);
  return {
    ...item,
    computed: {
      ...item.computed,
      tramiteStatus: overrides.tramiteStatus || item.computed.tramiteStatus,
      repairStatus: overrides.repairStatus || item.computed.repairStatus,
      paymentState: overrides.paymentState || item.computed.paymentState,
      tabs: {
        ...item.computed.tabs,
        ...Object.fromEntries(Object.entries(overrides.tabs).filter(([, value]) => Boolean(value))),
      },
    },
  };
}

function inferWorkflowTransitionTarget(label, domainHint = '') {
  const normalized = normalizeLookupText(label);
  const domain = normalizeLookupText(domainHint);

  if (domain.includes('tramite')) {
    if (normalized.includes('sin presentar')) return ['sin presentar', 'presentado'];
    if (normalized.includes('presentado')) return ['presentado', 'tramite'];
    if (normalized.includes('acordado')) return ['acordado'];
    if (normalized.includes('pasado a pagos')) return ['pago', 'pagos'];
    if (normalized.includes('pagado')) return ['pagado'];
  }

  if (domain.includes('reparacion')) {
    if (normalized.includes('en tramite')) return ['tramite', 'en curso'];
    if (normalized.includes('faltan repuestos')) return ['repuesto', 'turno', 'pendiente'];
    if (normalized.includes('reparado')) return ['reparado', 'finalizado'];
    if (normalized.includes('debe reingresar')) return ['reingreso', 'reingresar'];
    if (normalized.includes('no debe repararse')) return ['no debe repararse', 'total'];
  }

  return [normalized];
}

function findWorkflowActionByLabel(actions = [], label, domainHint = '') {
  const domain = normalizeLookupText(domainHint);
  const keywords = inferWorkflowTransitionTarget(label, domainHint);

  const candidates = actions.filter((action) => {
    const actionDomain = normalizeLookupText(action?.domain);
    if (!domain) return true;
    return actionDomain === domain;
  });

  return candidates.find((action) => {
    const hay = [action?.targetStateCode, action?.targetStateName, action?.actionCode, action?.reason]
      .filter(Boolean)
      .map((value) => normalizeLookupText(value))
      .join(' ');
    return keywords.some((keyword) => hay.includes(normalizeLookupText(keyword)));
  }) || null;
}

function bindWorkflowActions(actions = [], domainHint = '', availableActions = []) {
  const hasAvailable = Array.isArray(availableActions) && availableActions.length > 0;
  return actions.map((action) => {
    const backendAction = findWorkflowActionByLabel(availableActions, action.label, domainHint);
    return {
      ...action,
      backendAction,
      disabled: action.disabled || (hasAvailable && !backendAction),
    };
  });
}

function normalizeCaseCodesWithCatalogs(caseItem, insuranceCatalogs = null, financeCatalogs = null) {
  const draft = ensureCaseStructure(caseItem);

  const mapValue = (currentValue, catalogs, key, fallback = []) => (
    resolveCatalogCode(currentValue, getCatalogEntries(catalogs, key), fallback) || currentValue
  );

  draft.todoRisk.processing.modality = mapValue(draft.todoRisk.processing.modality, insuranceCatalogs, 'modalityCodes', TODO_RIESGO_MODALITY_OPTIONS);
  draft.todoRisk.processing.quoteStatus = mapValue(draft.todoRisk.processing.quoteStatus, insuranceCatalogs, 'quotationStatusCodes', TODO_RIESGO_QUOTE_STATUS_OPTIONS);
  draft.todoRisk.processing.cleasScope = mapValue(draft.todoRisk.processing.cleasScope, insuranceCatalogs, 'cleasScopeCodes', CLEAS_SCOPE_OPTIONS);
  draft.todoRisk.processing.dictamen = mapValue(draft.todoRisk.processing.dictamen, insuranceCatalogs, 'opinionCodes', [...TODO_RIESGO_DICTAMEN_OPTIONS, ...CLEAS_DICTAMEN_OPTIONS]);
  draft.todoRisk.processing.clientChargeStatus = mapValue(draft.todoRisk.processing.clientChargeStatus, insuranceCatalogs, 'paymentStatusCodes', CLEAS_PAYMENT_STATUS_OPTIONS);
  draft.todoRisk.processing.companyFranchisePaymentStatus = mapValue(draft.todoRisk.processing.companyFranchisePaymentStatus, insuranceCatalogs, 'paymentStatusCodes', CLEAS_PAYMENT_STATUS_OPTIONS);

  draft.todoRisk.franchise.status = mapValue(draft.todoRisk.franchise.status, insuranceCatalogs, 'franchiseStatusCodes', TODO_RIESGO_FRANCHISE_STATUS_OPTIONS);
  draft.todoRisk.franchise.recoveryType = mapValue(draft.todoRisk.franchise.recoveryType, insuranceCatalogs, 'franchiseRecoveryTypeCodes', TODO_RIESGO_RECOVERY_OPTIONS);
  draft.todoRisk.franchise.dictamen = mapValue(draft.todoRisk.franchise.dictamen, insuranceCatalogs, 'franchiseOpinionCodes', TODO_RIESGO_DICTAMEN_OPTIONS);

  draft.lawyer.tramita = mapValue(draft.lawyer.tramita, insuranceCatalogs, 'legalProcessorCodes', LAWYER_TRAMITA_OPTIONS);
  draft.lawyer.reclama = mapValue(draft.lawyer.reclama, insuranceCatalogs, 'legalClaimantCodes', LAWYER_RECLAMA_OPTIONS);
  draft.lawyer.instance = mapValue(draft.lawyer.instance, insuranceCatalogs, 'legalInstanceCodes', LAWYER_INSTANCE_OPTIONS);
  draft.lawyer.closure.closeBy = mapValue(draft.lawyer.closure.closeBy, insuranceCatalogs, 'legalClosureReasonCodes', LAWYER_CLOSE_BY_OPTIONS);
  draft.lawyer.closure.expenses = draft.lawyer.closure.expenses.map((entry) => ({
    ...entry,
    paidBy: mapValue(entry.paidBy, insuranceCatalogs, 'legalExpensePayerCodes', LAWYER_EXPENSE_PAID_BY_OPTIONS),
  }));

  draft.payments.comprobante = mapValue(draft.payments.comprobante, financeCatalogs, 'receiptTypeCodes', COMPROBANTES);
  draft.payments.senaMode = mapValue(draft.payments.senaMode, financeCatalogs, 'paymentMethodCodes', PAYMENT_MODES);
  draft.payments.settlements = draft.payments.settlements.map((entry) => ({
    ...entry,
    mode: mapValue(entry.mode, financeCatalogs, 'paymentMethodCodes', PAYMENT_MODES),
  }));

  return draft;
}

function ensureCaseStructure(caseItem) {
  const draft = structuredClone(caseItem || {});

  if (!draft.todoRisk) draft.todoRisk = createTodoRiskDefaults();
  if (!draft.todoRisk.processing) draft.todoRisk.processing = createTodoRiskDefaults().processing;
  if (!draft.todoRisk.franchise) draft.todoRisk.franchise = createTodoRiskDefaults().franchise;
  if (!draft.todoRisk.insurance) draft.todoRisk.insurance = createTodoRiskDefaults().insurance;

  if (!draft.lawyer) draft.lawyer = createLawyerDefaults();
  if (!draft.lawyer.closure) draft.lawyer.closure = createLawyerDefaults().closure;
  if (!Array.isArray(draft.lawyer.closure.expenses)) draft.lawyer.closure.expenses = [];

  if (!draft.payments) draft.payments = createPaymentDefaults();
  if (!Array.isArray(draft.payments.settlements)) draft.payments.settlements = [];
  if (!Array.isArray(draft.payments.invoices)) draft.payments.invoices = [];

  if (!draft.repair) {
    draft.repair = {
      parts: [],
      turno: { date: '', estimatedDays: '', state: 'Pendiente programar', notes: '' },
      ingreso: { realDate: '', hasObservation: 'NO', observation: '', items: [] },
      egreso: {
        date: '',
        notes: '',
        shouldReenter: 'SI',
        reentryDate: '',
        reentryEstimatedDays: '',
        reentryState: 'Pendiente programar',
        reentryNotes: '',
        definitiveExit: false,
        repairedPhotos: false,
        repairedMedia: [],
      },
    };
  }
  if (!Array.isArray(draft.repair.parts)) draft.repair.parts = [];

  if (!draft.meta) {
    draft.meta = { dirtyTabs: {}, lastSavedByTab: {}, syncErrorsByTab: {}, removedBudgetItemIds: [], removedPartIds: [] };
  }

  return draft;
}

function collectCaseCodeValidationIssues(caseItem, insuranceCatalogs = null, financeCatalogs = null) {
  const issues = [];
  const check = (label, currentValue, catalogs, key, fallback = []) => {
    if (!currentValue) return;
    const resolved = resolveCatalogCode(currentValue, getCatalogEntries(catalogs, key), fallback);
    if (!resolved) {
      issues.push(`${label}: "${String(currentValue)}"`);
    }
  };

  check('tramite.modality', caseItem.todoRisk?.processing?.modality, insuranceCatalogs, 'modalityCodes', TODO_RIESGO_MODALITY_OPTIONS);
  check('tramite.quoteStatus', caseItem.todoRisk?.processing?.quoteStatus, insuranceCatalogs, 'quotationStatusCodes', TODO_RIESGO_QUOTE_STATUS_OPTIONS);
  check('tramite.cleasScope', caseItem.todoRisk?.processing?.cleasScope, insuranceCatalogs, 'cleasScopeCodes', CLEAS_SCOPE_OPTIONS);
  check('tramite.dictamen', caseItem.todoRisk?.processing?.dictamen, insuranceCatalogs, 'opinionCodes', [...TODO_RIESGO_DICTAMEN_OPTIONS, ...CLEAS_DICTAMEN_OPTIONS]);
  check('tramite.clientChargeStatus', caseItem.todoRisk?.processing?.clientChargeStatus, insuranceCatalogs, 'paymentStatusCodes', CLEAS_PAYMENT_STATUS_OPTIONS);
  check('tramite.companyFranchisePaymentStatus', caseItem.todoRisk?.processing?.companyFranchisePaymentStatus, insuranceCatalogs, 'paymentStatusCodes', CLEAS_PAYMENT_STATUS_OPTIONS);

  check('franchise.status', caseItem.todoRisk?.franchise?.status, insuranceCatalogs, 'franchiseStatusCodes', TODO_RIESGO_FRANCHISE_STATUS_OPTIONS);
  check('franchise.recoveryType', caseItem.todoRisk?.franchise?.recoveryType, insuranceCatalogs, 'franchiseRecoveryTypeCodes', TODO_RIESGO_RECOVERY_OPTIONS);
  check('franchise.dictamen', caseItem.todoRisk?.franchise?.dictamen, insuranceCatalogs, 'franchiseOpinionCodes', TODO_RIESGO_DICTAMEN_OPTIONS);

  check('lawyer.tramita', caseItem.lawyer?.tramita, insuranceCatalogs, 'legalProcessorCodes', LAWYER_TRAMITA_OPTIONS);
  check('lawyer.reclama', caseItem.lawyer?.reclama, insuranceCatalogs, 'legalClaimantCodes', LAWYER_RECLAMA_OPTIONS);
  check('lawyer.instance', caseItem.lawyer?.instance, insuranceCatalogs, 'legalInstanceCodes', LAWYER_INSTANCE_OPTIONS);
  check('lawyer.closeBy', caseItem.lawyer?.closure?.closeBy, insuranceCatalogs, 'legalClosureReasonCodes', LAWYER_CLOSE_BY_OPTIONS);

  (caseItem.lawyer?.closure?.expenses || []).forEach((entry, index) => {
    check(`lawyer.expenses[${index}].paidBy`, entry?.paidBy, insuranceCatalogs, 'legalExpensePayerCodes', LAWYER_EXPENSE_PAID_BY_OPTIONS);
  });

  check('pagos.comprobante', caseItem.payments?.comprobante, financeCatalogs, 'receiptTypeCodes', COMPROBANTES);
  check('pagos.senaMode', caseItem.payments?.senaMode, financeCatalogs, 'paymentMethodCodes', PAYMENT_MODES);
  (caseItem.payments?.settlements || []).forEach((entry, index) => {
    check(`pagos.settlements[${index}].mode`, entry?.mode, financeCatalogs, 'paymentMethodCodes', PAYMENT_MODES);
  });

  return issues;
}

function buildLegalNewsSignature(entry) {
  const date = String(entry?.date || '').trim();
  const detail = normalizeLookupText(entry?.detail || '');
  const notify = entry?.notifyClient ? '1' : '0';
  return `${date}|${detail}|${notify}`;
}

function buildLegalExpenseSignature(entry) {
  const concept = normalizeLookupText(entry?.concept || '');
  const amount = String(numberValue(entry?.amount || 0));
  const date = String(entry?.date || '').trim();
  const paidBy = String(entry?.paidBy || '').trim().toUpperCase();
  return `${concept}|${amount}|${date}|${paidBy}`;
}

function buildReceiptSignature(entry) {
  const number = normalizeLookupText(entry?.invoiceNumber || entry?.receiptNumber || entry?.publicId || '');
  const amount = String(numberValue(entry?.amount ?? entry?.total ?? 0));
  const date = String(entry?.issuedAt || entry?.issuedDate || '').trim();
  return `${number}|${amount}|${date}`;
}

function buildBudgetLineSignature(entry) {
  const piece = normalizeLookupText(entry?.piece || entry?.affectedPiece || '');
  const action = normalizeLookupText(entry?.repairAction || entry?.actionCode || '');
  const task = normalizeLookupText(entry?.task || entry?.taskCode || '');
  const partPrice = String(numberValue(entry?.partPrice ?? entry?.partValue ?? 0));
  const labor = String(numberValue(entry?.laborWithoutVat ?? entry?.laborAmount ?? 0));
  return `${piece}|${task}|${action}|${partPrice}|${labor}`;
}

function buildPartSignature(entry) {
  const description = normalizeLookupText(entry?.name || entry?.description || '');
  const status = normalizeLookupText(entry?.state || entry?.statusCode || '');
  const price = String(numberValue(entry?.amount ?? entry?.finalPrice ?? 0));
  return `${description}|${status}|${price}`;
}

function buildFinancialMovementSignature(entry) {
  const movementType = normalizeLookupText(entry?.movementTypeCode || entry?.kind || '');
  const amount = String(numberValue(entry?.netAmount ?? entry?.grossAmount ?? entry?.amount ?? 0));
  const dateRaw = String(entry?.movementAt || entry?.date || '').trim();
  const date = dateRaw.includes('T') ? dateRaw.slice(0, 10) : dateRaw;
  return `${movementType}|${amount}|${date}`;
}

function triggerBlobDownload(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeCsvValue(value) {
  const normalized = String(value ?? '').replace(/"/g, '""');
  return `"${normalized}"`;
}

function buildPanelExportRows(items) {
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












function App() {
  const probeEndpoint = getConnectivityProbeUrl();
  const loginEndpoint = getLoginUrl();
  const currentUserEndpoint = getCurrentUserUrl();
  const unreadNotificationsEndpoint = getUnreadNotificationsUrl();
  const notificationsEndpoint = getNotificationsUrl();
  const systemParametersEndpoint = getSystemParametersUrl();
  const operationCatalogsEndpoint = getOperationCatalogsUrl();
  const financeCatalogsEndpoint = getFinanceCatalogsUrl();
  const insuranceCatalogsEndpoint = getInsuranceCatalogsUrl();
  const documentsCatalogsEndpoint = getDocumentsCatalogsUrl();
  const tasksEndpoint = getTasksUrl();
  const insuranceCompaniesEndpoint = getInsuranceCompaniesUrl();
  const storedSession = readBackendSession();
  const hasStoredSession = Boolean(storedSession?.accessToken);
  const [shouldBootstrapSession] = useState(hasStoredSession);
  const [cases, setCases] = useState(initialCases);
  const [activeView, setActiveView] = useState('panel');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [isSavingCase, setIsSavingCase] = useState(false);
  const [isSavingDocuments, setIsSavingDocuments] = useState(false);
  const [isDownloadingDocument, setIsDownloadingDocument] = useState(false);
  const [isPreviewingDocument, setIsPreviewingDocument] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [dirtyTabs, setDirtyTabs] = useState(new Set());
  const [activeTab, setActiveTab] = useState('ficha');
  const [activeRepairTab, setActiveRepairTab] = useState('repuestos');
  const [docGateAcceptedCaseId, setDocGateAcceptedCaseId] = useState('');
  const [notice, setNotice] = useState(null);
  const [newCaseForm, setNewCaseForm] = useState(createEmptyForm);
  const [showNewCaseValidation, setShowNewCaseValidation] = useState(false);
  const [customerLookupState, setCustomerLookupState] = useState({ status: 'idle', message: '', detail: '' });
  const [vehicleLookupState, setVehicleLookupState] = useState({ status: 'idle', message: '', detail: '' });
  const [autofilledFields, setAutofilledFields] = useState([]);
  const [apiConnection, setApiConnection] = useState({
    status: 'idle',
    tone: 'info',
    title: 'Conectividad sin verificar',
    detail: `Todavía no probamos la conexión al sistema (${probeEndpoint}).`,
    endpoint: probeEndpoint,
    checkedAt: '',
    httpStatus: null,
  });
  const [loginForm, setLoginForm] = useState({
    email: storedSession?.user?.email || '',
    password: '',
  });
  const [backendSession, setBackendSession] = useState(storedSession);
  const [sessionExpiryNotice, setSessionExpiryNotice] = useState('');
  const [sessionExpirySeconds, setSessionExpirySeconds] = useState(0);
  const [isSessionExpiring, setIsSessionExpiring] = useState(false);
  const sessionExpiryTimerRef = useRef(null);
  const sessionExpiryIntervalRef = useRef(null);
  const [appAccess, setAppAccess] = useState(hasStoredSession ? 'checking' : 'guest');
  const [authState, setAuthState] = useState({
    status: hasStoredSession ? 'loading' : 'idle',
    tone: hasStoredSession ? 'info' : 'info',
    title: hasStoredSession ? 'Recuperando tu acceso' : 'Bienvenido/a',
    detail: hasStoredSession
      ? 'Estamos verificando tu sesión guardada para que puedas continuar.'
      : 'Ingresá con tu email y tu contraseña para ver tus carpetas.',
    endpoint: loginEndpoint,
    checkedAt: storedSession?.savedAt || '',
    httpStatus: null,
  });
  const [currentUserState, setCurrentUserState] = useState({
    status: 'idle',
    tone: 'info',
    title: 'Verificación pendiente',
    detail: 'Después de iniciar sesión validamos tu cuenta para continuar.',
    endpoint: currentUserEndpoint,
    checkedAt: '',
    httpStatus: null,
  });
  const [authenticatedCasesState, setAuthenticatedCasesState] = useState({
    status: 'idle',
    tone: 'info',
    title: 'Carga pendiente',
    detail: 'Todavía no cargamos tus carpetas.',
    endpoint: probeEndpoint,
    checkedAt: '',
    httpStatus: null,
    technicalDetail: '',
    items: [],
    total: 0,
    visible: 0,
    page: 0,
    size: 5,
    totalPages: 0,
  });
  const [authenticatedCaseDetailState, setAuthenticatedCaseDetailState] = useState({
    ...createAuthenticatedCaseDetailInitialState(),
  });
  const [authenticatedNotificationsState, setAuthenticatedNotificationsState] = useState({
    status: 'idle',
    tone: 'info',
    title: 'Avisos pendientes',
    detail: 'Todavía no cargamos tus avisos.',
    endpoint: unreadNotificationsEndpoint,
    checkedAt: '',
    httpStatus: null,
    items: [],
    recentItems: [],
    recentCount: 0,
    unreadCount: 0,
    unreadCountSource: 'none',
  });
  const [authenticatedSystemParametersState, setAuthenticatedSystemParametersState] = useState({
    status: 'idle',
    tone: 'info',
    title: 'Parámetros del sistema',
    detail: 'Todavía no cargamos esta referencia.',
    endpoint: systemParametersEndpoint,
    checkedAt: '',
    httpStatus: null,
    items: [],
  });
  const [authenticatedOperationCatalogsState, setAuthenticatedOperationCatalogsState] = useState({
    status: 'idle',
    tone: 'info',
    title: 'Catálogos de operación',
    detail: 'Todavía no cargamos esta referencia.',
    endpoint: operationCatalogsEndpoint,
    checkedAt: '',
    httpStatus: null,
    items: [],
  });
  const [authenticatedFinanceCatalogsState, setAuthenticatedFinanceCatalogsState] = useState({
    status: 'idle',
    tone: 'info',
    title: 'Catálogos de finanzas',
    detail: 'Todavía no cargamos esta referencia.',
    endpoint: financeCatalogsEndpoint,
    checkedAt: '',
    httpStatus: null,
    items: [],
    catalogs: null,
  });
  const [authenticatedInsuranceCatalogsState, setAuthenticatedInsuranceCatalogsState] = useState({
    status: 'idle',
    tone: 'info',
    title: 'Catálogos de seguros',
    detail: 'Todavía no cargamos esta referencia.',
    endpoint: insuranceCatalogsEndpoint,
    checkedAt: '',
    httpStatus: null,
    items: [],
    catalogs: null,
  });
  const [authenticatedDocumentsCatalogsState, setAuthenticatedDocumentsCatalogsState] = useState({
    status: 'idle',
    tone: 'info',
    title: 'Catálogos de documentos',
    detail: 'Todavía no cargamos esta referencia.',
    endpoint: documentsCatalogsEndpoint,
    checkedAt: '',
    httpStatus: null,
    items: [],
    catalogs: null,
  });
  const [authenticatedTasksState, setAuthenticatedTasksState] = useState({
    status: 'idle',
    tone: 'info',
    title: 'Tareas operativas',
    detail: 'Todavía no cargamos esta vista.',
    endpoint: tasksEndpoint,
    checkedAt: '',
    httpStatus: null,
    items: [],
  });
  const [authenticatedInsuranceCompaniesState, setAuthenticatedInsuranceCompaniesState] = useState({
    status: 'idle',
    tone: 'info',
    title: 'Compañías de seguros',
    detail: 'Todavía no cargamos esta vista.',
    endpoint: insuranceCompaniesEndpoint,
    checkedAt: '',
    httpStatus: null,
    items: [],
  });
  const [authenticatedInsuranceContactsState, setAuthenticatedInsuranceContactsState] = useState({
    status: 'idle',
    tone: 'info',
    title: 'Contactos de compañía',
    detail: 'Todavía no cargamos esta vista.',
    endpoint: '',
    checkedAt: '',
    httpStatus: null,
    companyName: '',
    items: [],
  });
  const [pendingNotificationIds, setPendingNotificationIds] = useState([]);
  const [notificationActionStateById, setNotificationActionStateById] = useState({});

  const computedCases = useMemo(() => cases.map((item) => applyBackendWorkflowToCase(getComputedCase(item))), [cases]);
  const agendaItems = useMemo(() => buildAgendaStore(computedCases), [computedCases]);

  const selectedCase = computedCases.find((item) => String(item.id) === String(selectedCaseId)) || computedCases[0];
  const selectedCaseCodeIssues = useMemo(() => {
    if (!import.meta.env.DEV || !selectedCase) {
      return [];
    }
    return collectCaseCodeValidationIssues(
      selectedCase,
      authenticatedInsuranceCatalogsState.catalogs,
      authenticatedFinanceCatalogsState.catalogs,
    );
  }, [selectedCase, authenticatedInsuranceCatalogsState.catalogs, authenticatedFinanceCatalogsState.catalogs]);
  const nextCounter = computedCases.reduce((max, item) => Math.max(max, item.counter), 0) + 1;
  const nextCode = buildCaseCode(nextCounter, newCaseForm.type, newCaseForm.branch);
  const folderMissing = getFolderMissing(newCaseForm);
  useEffect(() => {
    const syncCaseFromHash = () => {
      const route = getCaseRouteFromHash(window.location.hash);
      const caseId = route.id;

      if (!caseId) {
        return;
      }

      const caseExists = computedCases.some((item) => String(item.id) === String(caseId));
      if (!caseExists) {
        return;
      }

      const selectedFromHash = computedCases.find((item) => String(item.id) === String(caseId));
      const resolvedRoute = resolveGestionAccess(selectedFromHash, route);

      setSelectedCaseId(caseId);
      setActiveView('gestion');
      setActiveTab(resolvedRoute.tab);
      setActiveRepairTab(resolvedRoute.subtab || 'repuestos');
    };

    syncCaseFromHash();
    window.addEventListener('hashchange', syncCaseFromHash);

    return () => window.removeEventListener('hashchange', syncCaseFromHash);
  }, [computedCases]);

  useEffect(() => {
    if (authenticatedCaseDetailState.status !== 'success') {
      return;
    }

    const backendCaseId = authenticatedCaseDetailState.item?.id;
    if (backendCaseId == null) {
      return;
    }

    setCases((current) => current.map((item) => {
      if (String(item.id) !== String(backendCaseId)) {
        return item;
      }

      const draft = structuredClone(item);
      patchCaseWithBackendDetail(draft, authenticatedCaseDetailState);
      return draft;
    }));
  }, [authenticatedCaseDetailState]);

  useEffect(() => {
    if (activeView !== 'gestion' || !selectedCaseId) {
      return;
    }

    const nextHash = getCaseHash(selectedCaseId, {
      tab: activeTab,
      subtab: activeTab === 'gestion' ? activeRepairTab : '',
    });

    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`);
    }
  }, [activeView, selectedCaseId, activeTab, activeRepairTab]);

  useEffect(() => {
    if (activeView !== 'gestion' || !hasUnsavedChanges || isSavingCase || !selectedCase) {
      return;
    }

    const caseId = Number(selectedCase.id);
    if (!Number.isFinite(caseId)) {
      return;
    }

    const timer = window.setTimeout(() => {
      void syncSelectedCaseToBackend({ silent: true, tabs: [activeTab] });
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [activeView, activeTab, activeRepairTab, hasUnsavedChanges, isSavingCase, selectedCase]);

  useEffect(() => {
    setHasUnsavedChanges(dirtyTabs.size > 0);
  }, [dirtyTabs]);

  useEffect(() => {
    const insuranceCatalogs = authenticatedInsuranceCatalogsState.catalogs;
    const financeCatalogs = authenticatedFinanceCatalogsState.catalogs;

    if (!insuranceCatalogs && !financeCatalogs) {
      return;
    }

    setCases((current) => current.map((item) => normalizeCaseCodesWithCatalogs(item, insuranceCatalogs, financeCatalogs)));
  }, [authenticatedInsuranceCatalogsState.catalogs, authenticatedFinanceCatalogsState.catalogs]);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    const insuranceCatalogs = authenticatedInsuranceCatalogsState.catalogs;
    const financeCatalogs = authenticatedFinanceCatalogsState.catalogs;

    if (!insuranceCatalogs && !financeCatalogs) {
      return;
    }

    cases.forEach((caseItem) => {
      const issues = collectCaseCodeValidationIssues(caseItem, insuranceCatalogs, financeCatalogs);
      if (issues.length) {
        console.warn(`[code-check] ${caseItem.code || caseItem.id}: ${issues.join(' | ')}`);
      }
    });
  }, [cases, authenticatedInsuranceCatalogsState.catalogs, authenticatedFinanceCatalogsState.catalogs]);

  useEffect(() => {
    if (activeView !== 'gestion' || activeTab !== 'gestion' || !selectedCase) {
      return;
    }

    if (!selectedCase.computed.budgetReady) {
      setActiveTab(selectedCase.computed.reportClosed ? 'presupuesto' : 'ficha');
      setActiveRepairTab('repuestos');
    }
  }, [activeView, activeTab, selectedCase]);

  useEffect(() => {
    if (activeView !== 'gestion' || !selectedCase || !isFranchiseRecoveryCase(selectedCase)) {
      return;
    }

    if (selectedCase.franchiseRecovery?.enablesRepair === 'NO' && ['presupuesto', 'gestion'].includes(activeTab)) {
      setActiveTab('tramite');
      setActiveRepairTab('repuestos');
    }
  }, [activeRepairTab, activeTab, activeView, selectedCase]);

  useEffect(() => {
    if (activeView === 'gestion') {
      return;
    }

    if (docGateAcceptedCaseId) {
      setDocGateAcceptedCaseId('');
    }
  }, [activeView, docGateAcceptedCaseId]);

  useEffect(() => {
    if (!autofilledFields.length) {
      return undefined;
    }

    const timer = window.setTimeout(() => setAutofilledFields([]), 1800);
    return () => window.clearTimeout(timer);
  }, [autofilledFields]);

  const refreshApiConnection = async (signal) => {
    setApiConnection({
      status: 'loading',
      tone: 'info',
      title: 'Probando backend...',
      detail: `Haciendo un GET real a ${probeEndpoint}.`,
      endpoint: probeEndpoint,
      checkedAt: '',
      httpStatus: null,
    });

    try {
      const result = await probeBackendConnection({ signal });

      setApiConnection({
        status: result.ok ? 'success' : 'error',
        tone: result.tone,
        title: result.title,
        detail: result.detail,
        endpoint: result.endpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: result.httpStatus,
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        setApiConnection({
          status: 'error',
          tone: 'danger',
          title: 'Error al probar backend',
          detail: `Falló la verificación real hacia ${probeEndpoint}.`,
          endpoint: probeEndpoint,
          checkedAt: new Date().toISOString(),
          httpStatus: null,
        });
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void refreshApiConnection(controller.signal);
    return () => controller.abort();
  }, []);

  const resetSessionState = ({ authTitle, authDetail, authTone = 'info', checkedAt = new Date().toISOString() }) => {
    if (sessionExpiryTimerRef.current) {
      window.clearTimeout(sessionExpiryTimerRef.current);
      sessionExpiryTimerRef.current = null;
    }
    if (sessionExpiryIntervalRef.current) {
      window.clearInterval(sessionExpiryIntervalRef.current);
      sessionExpiryIntervalRef.current = null;
    }
    setIsSessionExpiring(false);
    setSessionExpiryNotice('');
    setSessionExpirySeconds(0);

    clearBackendSession();
    setBackendSession(null);
    setAppAccess('guest');
    setAuthState({
      status: authTone === 'danger' ? 'error' : 'idle',
      tone: authTone,
      title: authTitle,
      detail: authDetail,
      endpoint: loginEndpoint,
      checkedAt,
      httpStatus: null,
    });
    setCurrentUserState({
      status: 'idle',
      tone: 'info',
      title: 'Verificación pendiente',
      detail: 'Sin sesión iniciada no podemos validar tu cuenta.',
      endpoint: currentUserEndpoint,
      checkedAt: '',
      httpStatus: null,
    });
    setAuthenticatedCasesState({
      status: 'idle',
      tone: 'info',
      title: 'Carga pendiente',
      detail: 'Volvé a ingresar para recuperar tus carpetas.',
      endpoint: probeEndpoint,
      checkedAt: '',
      httpStatus: null,
      technicalDetail: '',
      items: [],
      total: 0,
      visible: 0,
      page: 0,
      size: 5,
      totalPages: 0,
    });
    setAuthenticatedCaseDetailState(createAuthenticatedCaseDetailInitialState());
    setAuthenticatedNotificationsState({
      status: 'idle',
      tone: 'info',
      title: 'Avisos pendientes',
      detail: 'Volvé a ingresar para recuperar tus avisos.',
      endpoint: unreadNotificationsEndpoint,
      checkedAt: '',
      httpStatus: null,
      items: [],
      recentItems: [],
      recentCount: 0,
      unreadCount: 0,
      unreadCountSource: 'none',
    });
    setPendingNotificationIds([]);
    setAuthenticatedSystemParametersState({
      status: 'idle',
      tone: 'info',
      title: 'Parámetros del sistema',
      detail: 'Volvé a ingresar para recuperar esta referencia.',
      endpoint: systemParametersEndpoint,
      checkedAt: '',
      httpStatus: null,
      items: [],
    });
    setAuthenticatedOperationCatalogsState({
      status: 'idle',
      tone: 'info',
      title: 'Catálogos de operación',
      detail: 'Volvé a ingresar para recuperar esta referencia.',
      endpoint: operationCatalogsEndpoint,
      checkedAt: '',
      httpStatus: null,
      items: [],
    });
    setAuthenticatedFinanceCatalogsState({
      status: 'idle',
      tone: 'info',
      title: 'Catálogos de finanzas',
      detail: 'Volvé a ingresar para recuperar esta referencia.',
      endpoint: financeCatalogsEndpoint,
      checkedAt: '',
      httpStatus: null,
      items: [],
      catalogs: null,
    });
    setAuthenticatedInsuranceCatalogsState({
      status: 'idle',
      tone: 'info',
      title: 'Catálogos de seguros',
      detail: 'Volvé a ingresar para recuperar esta referencia.',
      endpoint: insuranceCatalogsEndpoint,
      checkedAt: '',
      httpStatus: null,
      items: [],
      catalogs: null,
    });
    setAuthenticatedDocumentsCatalogsState({
      status: 'idle',
      tone: 'info',
      title: 'Catálogos de documentos',
      detail: 'Volvé a ingresar para recuperar esta referencia.',
      endpoint: documentsCatalogsEndpoint,
      checkedAt: '',
      httpStatus: null,
      items: [],
      catalogs: null,
    });
    setAuthenticatedTasksState({
      status: 'idle',
      tone: 'info',
      title: 'Tareas operativas',
      detail: 'Volvé a ingresar para recuperar esta vista.',
      endpoint: tasksEndpoint,
      checkedAt: '',
      httpStatus: null,
      items: [],
    });
    setAuthenticatedInsuranceCompaniesState({
      status: 'idle',
      tone: 'info',
      title: 'Compañías de seguros',
      detail: 'Volvé a ingresar para recuperar esta vista.',
      endpoint: insuranceCompaniesEndpoint,
      checkedAt: '',
      httpStatus: null,
      items: [],
    });
    setAuthenticatedInsuranceContactsState({
      status: 'idle',
      tone: 'info',
      title: 'Contactos de compañía',
      detail: 'Volvé a ingresar para recuperar esta vista.',
      endpoint: '',
      checkedAt: '',
      httpStatus: null,
      companyName: '',
      items: [],
    });
  };

  const runCurrentUserRead = async (accessToken, signal) => {
    setCurrentUserState({
      status: 'loading',
      tone: 'info',
      title: 'Leyendo usuario autenticado...',
      detail: `Haciendo un GET real a ${currentUserEndpoint}.`,
      endpoint: currentUserEndpoint,
      checkedAt: '',
      httpStatus: null,
    });

    try {
      const result = await readCurrentUser(accessToken, { signal });
      const user = result.data || {};

      setCurrentUserState({
        status: 'success',
        tone: 'success',
        title: 'Usuario autenticado leído',
        detail: `${user.displayName || 'Usuario sin nombre'} · rol ${user.role || 'sin rol informado'}`,
        endpoint: result.endpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: result.httpStatus,
      });

      setBackendSession((current) => {
        if (!current) {
          return current;
        }

        const nextSession = {
          ...current,
          user: {
            ...current.user,
            ...user,
          },
        };
        storeBackendSession(nextSession);
        return nextSession;
      });
    } catch (error) {
      setCurrentUserState({
        status: 'error',
        tone: 'danger',
        title: 'Falló GET /auth/me',
        detail: error.message,
        endpoint: currentUserEndpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: error.httpStatus || null,
      });
      throw error;
    }
  };

  const runAuthenticatedCasesRead = async (accessToken, signal) => {
    setAuthenticatedCasesState({
      status: 'loading',
      tone: 'info',
      title: 'Actualizando carpetas',
      detail: 'Estamos trayendo la información más reciente de tu cuenta.',
      endpoint: probeEndpoint,
      checkedAt: '',
      httpStatus: null,
      technicalDetail: '',
      items: [],
      total: 0,
      visible: 0,
      page: 0,
      size: 5,
      totalPages: 0,
    });
    setAuthenticatedCaseDetailState((current) => (current.status === 'idle'
        ? current
        : {
            ...current,
            status: 'idle',
            tone: 'info',
            title: 'Detalle pendiente',
            detail: 'Elegí una carpeta para ver un resumen real del caso.',
            endpoint: '',
            checkedAt: '',
            httpStatus: null,
            item: null,
            data: null,
            workflowHistory: [],
            workflowActions: [],
            budgetState: {
              status: 'idle',
              data: null,
              items: [],
              totalItems: 0,
              detail: '',
            },
            appointmentsState: {
              status: 'idle',
              items: [],
              total: 0,
              nextAppointment: null,
              hasUpcomingAppointment: false,
              detail: '',
            },
            documentsState: {
              status: 'idle',
              items: [],
              total: 0,
              visibleCount: 0,
              hiddenCount: 0,
              detail: '',
            },
            financeSummaryState: {
              status: 'idle',
              data: null,
              detail: '',
            },
            financialMovementsState: {
              status: 'idle',
              items: [],
              total: 0,
              detail: '',
            },
            receiptsState: {
              status: 'idle',
              items: [],
              total: 0,
              latest: null,
              detail: '',
            },
            vehicleIntakesState: {
              status: 'idle',
              items: [],
              total: 0,
              latest: null,
              detail: '',
            },
            vehicleOutcomesState: {
              status: 'idle',
              items: [],
              total: 0,
              latest: null,
              detail: '',
            },
            trackingNotice: '',
          }));

    try {
      const result = await readAuthenticatedCases(accessToken, { page: 0, size: 200, signal });
      const summary = summarizeCasesPayload(result.data);
      const normalized = normalizeAuthenticatedCasesPayload(result.data);

      setAuthenticatedCasesState({
        status: 'success',
        tone: 'success',
        title: 'Carpetas actualizadas',
        detail: `Te mostramos ${summary.visible} carpeta${summary.visible === 1 ? '' : 's'} y la primera visible es ${summary.firstLabel}.`,
        endpoint: result.endpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: result.httpStatus,
        technicalDetail: getCasesTechnicalDetail({ endpoint: result.endpoint, httpStatus: result.httpStatus }),
        ...normalized,
      });
    } catch (error) {
      setAuthenticatedCasesState({
        status: 'error',
        tone: 'danger',
        title: 'No pudimos cargar tus carpetas',
        detail: getFriendlyErrorMessage(error),
        endpoint: probeEndpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: error.httpStatus || null,
        technicalDetail: getCasesTechnicalDetail({ endpoint: probeEndpoint, httpStatus: error.httpStatus || null, errorMessage: error.message }),
        items: [],
        total: 0,
        visible: 0,
        page: 0,
        size: 5,
        totalPages: 0,
      });
    }
  };

  const runAuthenticatedNotificationsRead = async (accessToken, signal) => {
    setAuthenticatedNotificationsState((current) => ({
      ...current,
      status: 'loading',
      tone: 'info',
      title: 'Actualizando avisos',
      detail: 'Estamos trayendo las novedades pendientes de tu cuenta.',
      endpoint: unreadNotificationsEndpoint,
      checkedAt: current.checkedAt,
      httpStatus: null,
    }));

    try {
      const [unreadResult, unreadCountResult, notificationsResult] = await Promise.allSettled([
        readAuthenticatedUnreadNotifications(accessToken, { signal }),
        readAuthenticatedUnreadNotificationsCount(accessToken, { signal }),
        readAuthenticatedNotifications(accessToken, { signal }),
      ]);

      if (unreadResult.status !== 'fulfilled') {
        throw unreadResult.reason;
      }

      const result = unreadResult.value;
      const items = getUnreadNotificationItems(result.data);
      const recentItems = notificationsResult.status === 'fulfilled'
        ? getNotificationItems(notificationsResult.value.data)
        : [];
      const countResponsePayload = unreadCountResult.status === 'fulfilled' ? unreadCountResult.value.data : null;
      const unreadCount = getUnreadNotificationCount(countResponsePayload, items.length);
      const unreadCountSource = unreadCountResult.status === 'fulfilled' ? 'api' : 'fallback-list';

      setNotificationActionStateById((current) => {
        const next = {};
        items.forEach((item) => {
          if (current[item.id]?.status === 'error') {
            next[item.id] = current[item.id];
          }
        });
        return next;
      });

      setAuthenticatedNotificationsState({
        status: 'success',
        tone: 'success',
        title: 'Avisos actualizados',
        detail: items.length === 0
          ? 'No hay avisos pendientes en este momento.'
          : unreadCountSource === 'api'
            ? `Trajimos ${items.length} aviso${items.length === 1 ? '' : 's'} y el contador oficial marca ${unreadCount}.`
            : `Trajimos ${items.length} aviso${items.length === 1 ? '' : 's'}. El contador oficial no respondió y usamos un conteo estimado.`,
        endpoint: notificationsResult.status === 'fulfilled' ? notificationsResult.value.endpoint : result.endpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: result.httpStatus,
        items,
        recentItems,
        recentCount: recentItems.length,
        unreadCount,
        unreadCountSource,
      });
    } catch (error) {
      const countResult = await readAuthenticatedUnreadNotificationsCount(accessToken, { signal }).catch(() => null);
      const fallbackCount = countResult ? getUnreadNotificationCount(countResult.data, 0) : 0;

      setAuthenticatedNotificationsState({
        status: 'error',
        tone: 'danger',
        title: 'No pudimos cargar tus avisos',
        detail: getFriendlyErrorMessage(error),
        endpoint: unreadNotificationsEndpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: error.httpStatus || null,
        items: [],
        recentItems: [],
        recentCount: 0,
        unreadCount: fallbackCount,
        unreadCountSource: countResult ? 'api' : 'none',
      });
    }
  };

  const runAuthenticatedSystemParametersRead = async (accessToken, signal) => {
    setAuthenticatedSystemParametersState((current) => ({
      ...current,
      status: 'loading',
      tone: 'info',
      title: 'Actualizando parámetros',
      detail: 'Estamos trayendo la referencia del sistema.',
      endpoint: systemParametersEndpoint,
      checkedAt: current.checkedAt,
      httpStatus: null,
    }));

    try {
      const result = await readAuthenticatedSystemParameters(accessToken, { signal });
      const items = getSystemParameterItems(result.data);

      setAuthenticatedSystemParametersState({
        status: 'success',
        tone: 'success',
        title: 'Parámetros actualizados',
        detail: items.length > 0
          ? `Trajimos ${items.length} parámetro${items.length === 1 ? '' : 's'} de referencia.`
          : 'No hay parámetros visibles en este momento.',
        endpoint: result.endpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: result.httpStatus,
        items,
      });
    } catch (error) {
      setAuthenticatedSystemParametersState((current) => ({
        ...current,
        status: 'error',
        tone: 'danger',
        title: 'No pudimos cargar parámetros',
        detail: error?.message || 'Intentá nuevamente en unos instantes.',
        endpoint: systemParametersEndpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: error?.httpStatus || null,
        items: [],
      }));
    }
  };

  const runAuthenticatedOperationCatalogsRead = async (accessToken, signal) => {
    setAuthenticatedOperationCatalogsState((current) => ({
      ...current,
      status: 'loading',
      tone: 'info',
      title: 'Actualizando catálogos',
      detail: 'Estamos trayendo la referencia de operación.',
      endpoint: operationCatalogsEndpoint,
      checkedAt: current.checkedAt,
      httpStatus: null,
    }));

    try {
      const result = await readAuthenticatedOperationCatalogs(accessToken, { signal });
      const items = getOperationCatalogSummary(result.data);

      setAuthenticatedOperationCatalogsState({
        status: 'success',
        tone: 'success',
        title: 'Catálogos actualizados',
        detail: items.length > 0
          ? `Trajimos ${items.length} categoría${items.length === 1 ? '' : 's'} de catálogo.`
          : 'No hay categorías visibles en este momento.',
        endpoint: result.endpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: result.httpStatus,
        items,
      });
    } catch (error) {
      setAuthenticatedOperationCatalogsState((current) => ({
        ...current,
        status: 'error',
        tone: 'danger',
        title: 'No pudimos cargar catálogos',
        detail: error?.message || 'Intentá nuevamente en unos instantes.',
        endpoint: operationCatalogsEndpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: error?.httpStatus || null,
        items: [],
      }));
    }
  };

  const runAuthenticatedFinanceCatalogsRead = async (accessToken, signal) => {
    setAuthenticatedFinanceCatalogsState((current) => ({
      ...current,
      status: 'loading',
      tone: 'info',
      title: 'Actualizando catálogos',
      detail: 'Estamos trayendo la referencia de finanzas.',
      endpoint: financeCatalogsEndpoint,
      checkedAt: current.checkedAt,
      httpStatus: null,
    }));

    try {
      const result = await readAuthenticatedFinanceCatalogs(accessToken, { signal });
      const items = getFinanceCatalogSummary(result.data);

      setAuthenticatedFinanceCatalogsState({
        status: 'success',
        tone: 'success',
        title: 'Catálogos actualizados',
        detail: items.length > 0
          ? `Trajimos ${items.length} categoría${items.length === 1 ? '' : 's'} de finanzas.`
          : 'No hay categorías visibles en este momento.',
        endpoint: result.endpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: result.httpStatus,
        items,
        catalogs: result.data || null,
      });
    } catch (error) {
      setAuthenticatedFinanceCatalogsState((current) => ({
        ...current,
        status: 'error',
        tone: 'danger',
        title: 'No pudimos cargar catálogos',
        detail: error?.message || 'Intentá nuevamente en unos instantes.',
        endpoint: financeCatalogsEndpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: error?.httpStatus || null,
        items: [],
        catalogs: null,
      }));
    }
  };

  const runAuthenticatedInsuranceCatalogsRead = async (accessToken, signal) => {
    setAuthenticatedInsuranceCatalogsState((current) => ({
      ...current,
      status: 'loading',
      tone: 'info',
      title: 'Actualizando catálogos',
      detail: 'Estamos trayendo la referencia de seguros.',
      endpoint: insuranceCatalogsEndpoint,
      checkedAt: current.checkedAt,
      httpStatus: null,
    }));

    try {
      const result = await readAuthenticatedInsuranceCatalogs(accessToken, { signal });
      const items = getInsuranceCatalogSummary(result.data);

      setAuthenticatedInsuranceCatalogsState({
        status: 'success',
        tone: 'success',
        title: 'Catálogos actualizados',
        detail: items.length > 0
          ? `Trajimos ${items.length} categoría${items.length === 1 ? '' : 's'} de seguros.`
          : 'No hay categorías visibles en este momento.',
        endpoint: result.endpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: result.httpStatus,
        items,
        catalogs: result.data || null,
      });
    } catch (error) {
      setAuthenticatedInsuranceCatalogsState((current) => ({
        ...current,
        status: 'error',
        tone: 'danger',
        title: 'No pudimos cargar catálogos',
        detail: error?.message || 'Intentá nuevamente en unos instantes.',
        endpoint: insuranceCatalogsEndpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: error?.httpStatus || null,
        items: [],
        catalogs: null,
      }));
    }
  };

  const runAuthenticatedDocumentsCatalogsRead = async (accessToken, signal) => {
    setAuthenticatedDocumentsCatalogsState((current) => ({
      ...current,
      status: 'loading',
      tone: 'info',
      title: 'Actualizando catálogos',
      detail: 'Estamos trayendo la referencia de documentos.',
      endpoint: documentsCatalogsEndpoint,
      checkedAt: current.checkedAt,
      httpStatus: null,
    }));

    try {
      const result = await readAuthenticatedDocumentsCatalogs(accessToken, { signal });
      const items = getDocumentsCatalogSummary(result.data);

      setAuthenticatedDocumentsCatalogsState({
        status: 'success',
        tone: 'success',
        title: 'Catálogos actualizados',
        detail: items.length > 0
          ? `Trajimos ${items.length} categoría${items.length === 1 ? '' : 's'} de documentos.`
          : 'No hay categorías visibles en este momento.',
        endpoint: result.endpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: result.httpStatus,
        items,
        catalogs: result.data || null,
      });
    } catch (error) {
      setAuthenticatedDocumentsCatalogsState((current) => ({
        ...current,
        status: 'error',
        tone: 'danger',
        title: 'No pudimos cargar catálogos',
        detail: error?.message || 'Intentá nuevamente en unos instantes.',
        endpoint: documentsCatalogsEndpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: error?.httpStatus || null,
        items: [],
        catalogs: null,
      }));
    }
  };

  const runAuthenticatedTasksRead = async (accessToken, signal) => {
    setAuthenticatedTasksState((current) => ({
      ...current,
      status: 'loading',
      tone: 'info',
      title: 'Actualizando tareas',
      detail: 'Estamos trayendo las tareas operativas.',
      endpoint: tasksEndpoint,
      checkedAt: current.checkedAt,
      httpStatus: null,
    }));

    try {
      const result = await readAuthenticatedTasks(accessToken, { signal });
      const items = getTaskItems(result.data);

      setAuthenticatedTasksState({
        status: 'success',
        tone: 'success',
        title: 'Tareas actualizadas',
        detail: items.length > 0
          ? `Trajimos ${items.length} tarea${items.length === 1 ? '' : 's'} operativa${items.length === 1 ? '' : 's'}.`
          : 'No hay tareas visibles en este momento.',
        endpoint: result.endpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: result.httpStatus,
        items,
      });
    } catch (error) {
      setAuthenticatedTasksState((current) => ({
        ...current,
        status: 'error',
        tone: 'danger',
        title: 'No pudimos cargar tareas',
        detail: error?.message || 'Intentá nuevamente en unos instantes.',
        endpoint: tasksEndpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: error?.httpStatus || null,
        items: [],
      }));
    }
  };

  const runAuthenticatedInsuranceCompaniesRead = async (accessToken, signal) => {
    setAuthenticatedInsuranceCompaniesState((current) => ({
      ...current,
      status: 'loading',
      tone: 'info',
      title: 'Actualizando compañías',
      detail: 'Estamos trayendo las compañías de seguros.',
      endpoint: insuranceCompaniesEndpoint,
      checkedAt: current.checkedAt,
      httpStatus: null,
    }));

    try {
      const result = await readAuthenticatedInsuranceCompanies(accessToken, { signal });
      const items = getInsuranceCompanyItems(result.data);
      const primaryCompany = items.find((company) => company?.id != null);

      setAuthenticatedInsuranceCompaniesState({
        status: 'success',
        tone: 'success',
        title: 'Compañías actualizadas',
        detail: items.length > 0
          ? `Trajimos ${items.length} compañía${items.length === 1 ? '' : 's'} de seguros.`
          : 'No hay compañías visibles en este momento.',
        endpoint: result.endpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: result.httpStatus,
        items,
      });

      if (primaryCompany?.id != null) {
        void runAuthenticatedInsuranceContactsRead(accessToken, primaryCompany, signal);
      } else {
        setAuthenticatedInsuranceContactsState({
          status: 'empty',
          tone: 'info',
          title: 'Sin contactos disponibles',
          detail: 'No encontramos una compañía con identificador para consultar contactos.',
          endpoint: '',
          checkedAt: new Date().toISOString(),
          httpStatus: null,
          companyName: '',
          items: [],
        });
      }
    } catch (error) {
      setAuthenticatedInsuranceCompaniesState((current) => ({
        ...current,
        status: 'error',
        tone: 'danger',
        title: 'No pudimos cargar compañías',
        detail: error?.message || 'Intentá nuevamente en unos instantes.',
        endpoint: insuranceCompaniesEndpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: error?.httpStatus || null,
        items: [],
      }));

      setAuthenticatedInsuranceContactsState((current) => ({
        ...current,
        status: 'error',
        tone: 'danger',
        title: 'No pudimos cargar contactos',
        detail: 'Primero necesitamos cargar una compañía válida para consultar sus contactos.',
        checkedAt: new Date().toISOString(),
        items: [],
      }));
    }
  };

  const runAuthenticatedInsuranceContactsRead = async (accessToken, company, signal) => {
    const companyId = company?.id;
    const companyName = company?.name || company?.displayName || `Compañía ${companyId}`;

    if (companyId == null) {
      return;
    }

    setAuthenticatedInsuranceContactsState((current) => ({
      ...current,
      status: 'loading',
      tone: 'info',
      title: 'Actualizando contactos',
      detail: `Estamos trayendo los referentes de ${companyName}.`,
      endpoint: '',
      companyName,
      checkedAt: current.checkedAt,
      httpStatus: null,
    }));

    try {
      const result = await readAuthenticatedInsuranceCompanyContacts(accessToken, companyId, { signal });
      const items = getInsuranceCompanyContactItems(result.data);

      setAuthenticatedInsuranceContactsState({
        status: 'success',
        tone: 'success',
        title: 'Contactos actualizados',
        detail: items.length > 0
          ? `Trajimos ${items.length} contacto${items.length === 1 ? '' : 's'} de ${companyName}.`
          : `No hay contactos visibles para ${companyName}.`,
        endpoint: result.endpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: result.httpStatus,
        companyName,
        items,
      });
    } catch (error) {
      setAuthenticatedInsuranceContactsState((current) => ({
        ...current,
        status: 'error',
        tone: 'danger',
        title: 'No pudimos cargar contactos',
        detail: error?.message || 'Intentá nuevamente en unos instantes.',
        checkedAt: new Date().toISOString(),
        httpStatus: error?.httpStatus || null,
        companyName,
        items: [],
      }));
    }
  };

  const openAuthenticatedCaseDetail = async (item) => {
    if (!backendSession?.accessToken || !item?.id) {
      return;
    }

    const endpoint = getCaseDetailUrl(item.id);
    const relationsEndpoint = getCaseRelationsUrl(item.id);
    const insuranceEndpoint = getCaseInsuranceUrl(item.id);
    const insuranceProcessingEndpoint = getCaseInsuranceProcessingUrl(item.id);
    const franchiseEndpoint = getCaseFranchiseUrl(item.id);
    const insuranceProcessingDocumentsEndpoint = getCaseInsuranceProcessingDocumentsUrl(item.id);
    const cleasEndpoint = getCaseCleasUrl(item.id);
    const thirdPartyEndpoint = getCaseThirdPartyUrl(item.id);
    const legalEndpoint = getCaseLegalUrl(item.id);
    const legalNewsEndpoint = getCaseLegalNewsUrl(item.id);
    const legalExpensesEndpoint = getCaseLegalExpensesUrl(item.id);
    const franchiseRecoveryEndpoint = getCaseFranchiseRecoveryUrl(item.id);
    const budgetEndpoint = getCaseBudgetUrl(item.id);
    const auditEventsEndpoint = getCaseAuditEventsUrl(item.id);
    const appointmentsEndpoint = getCaseAppointmentsUrl(item.id);
    const financeSummaryEndpoint = getCaseFinanceSummaryUrl(item.id);
    const financialMovementsEndpoint = getCaseFinancialMovementsUrl(item.id);
    const receiptsEndpoint = getCaseReceiptsUrl(item.id);
    const vehicleIntakesEndpoint = getCaseVehicleIntakesUrl(item.id);
    const vehicleOutcomesEndpoint = getCaseVehicleOutcomesUrl(item.id);

    setAuthenticatedCaseDetailState({
      status: 'loading',
      tone: 'info',
      title: 'Abriendo carpeta',
      detail: 'Estamos trayendo el resumen más reciente de este caso.',
      endpoint,
      checkedAt: '',
      httpStatus: null,
      item,
      data: null,
      workflowHistory: [],
      workflowActions: [],
      auditEventsState: {
        status: 'loading',
        items: [],
        total: 0,
        detail: 'Estamos revisando la actividad reciente de esta carpeta.',
        endpoint: auditEventsEndpoint,
      },
      relationsState: {
        status: 'loading',
        items: [],
        total: 0,
        detail: 'Estamos revisando los vínculos de esta carpeta.',
        endpoint: relationsEndpoint,
      },
      insuranceState: {
        status: 'loading',
        data: null,
        detail: 'Estamos revisando la cobertura de esta carpeta.',
        endpoint: insuranceEndpoint,
      },
      insuranceProcessingState: {
        status: 'loading',
        data: null,
        detail: 'Estamos revisando el estado del trámite con la compañía.',
        endpoint: insuranceProcessingEndpoint,
      },
      franchiseState: {
        status: 'loading',
        data: null,
        detail: 'Estamos revisando los datos de franquicia de esta carpeta.',
        endpoint: franchiseEndpoint,
      },
      insuranceProcessingDocumentsState: {
        status: 'loading',
        items: [],
        total: 0,
        detail: 'Estamos revisando los documentos del trámite con la compañía.',
        endpoint: insuranceProcessingDocumentsEndpoint,
      },
      cleasState: {
        status: 'loading',
        data: null,
        detail: 'Estamos revisando los datos CLEAS de esta carpeta.',
        endpoint: cleasEndpoint,
      },
      thirdPartyState: {
        status: 'loading',
        data: null,
        detail: 'Estamos revisando los datos de terceros de esta carpeta.',
        endpoint: thirdPartyEndpoint,
      },
      legalState: {
        status: 'loading',
        data: null,
        detail: 'Estamos revisando los datos legales de esta carpeta.',
        endpoint: legalEndpoint,
      },
      legalNewsState: {
        status: 'loading',
        items: [],
        total: 0,
        detail: 'Estamos revisando las novedades legales de esta carpeta.',
        endpoint: legalNewsEndpoint,
      },
      legalExpensesState: {
        status: 'loading',
        items: [],
        total: 0,
        detail: 'Estamos revisando los gastos legales de esta carpeta.',
        endpoint: legalExpensesEndpoint,
      },
      franchiseRecoveryState: {
        status: 'loading',
        data: null,
        detail: 'Estamos revisando el recupero de franquicia de esta carpeta.',
        endpoint: franchiseRecoveryEndpoint,
      },
      budgetState: {
        status: 'loading',
        data: null,
        items: [],
        totalItems: 0,
        detail: 'Estamos revisando la estimación cargada para esta carpeta.',
        endpoint: budgetEndpoint,
      },
      appointmentsState: {
        status: 'loading',
        items: [],
        total: 0,
        nextAppointment: null,
        hasUpcomingAppointment: false,
        detail: 'Estamos revisando las fechas de recepción disponibles para esta carpeta.',
        endpoint: appointmentsEndpoint,
      },
      documentsState: {
        status: 'loading',
        items: [],
        total: 0,
        visibleCount: 0,
        hiddenCount: 0,
        detail: 'Estamos revisando los archivos cargados en esta carpeta.',
      },
      financeSummaryState: {
        status: 'loading',
        data: null,
        detail: 'Estamos revisando el resumen financiero disponible para esta carpeta.',
        endpoint: financeSummaryEndpoint,
      },
      financialMovementsState: {
        status: 'loading',
        items: [],
        total: 0,
        detail: 'Estamos revisando los movimientos financieros de esta carpeta.',
        endpoint: financialMovementsEndpoint,
      },
      receiptsState: {
        status: 'loading',
        items: [],
        total: 0,
        latest: null,
        detail: 'Estamos revisando los comprobantes de esta carpeta.',
        endpoint: receiptsEndpoint,
      },
      vehicleIntakesState: {
        status: 'loading',
        items: [],
        total: 0,
        latest: null,
        detail: 'Estamos revisando los ingresos del vehículo de esta carpeta.',
        endpoint: vehicleIntakesEndpoint,
      },
      vehicleOutcomesState: {
        status: 'loading',
        items: [],
        total: 0,
        latest: null,
        detail: 'Estamos revisando los egresos del vehículo de esta carpeta.',
        endpoint: vehicleOutcomesEndpoint,
      },
      trackingNotice: '',
    });

    try {
      const [detailResult, historyResult, actionsResult, auditEventsResult, relationsResult, insuranceResult, insuranceProcessingResult, insuranceProcessingDocumentsResult, cleasResult, thirdPartyResult, legalResult, legalNewsResult, legalExpensesResult, franchiseRecoveryResult, franchiseResult, budgetResult, appointmentsResult, documentsResult, financeSummaryResult, financialMovementsResult, receiptsResult, vehicleIntakesResult, vehicleOutcomesResult] = await Promise.allSettled([
        readAuthenticatedCaseDetail(backendSession.accessToken, item.id),
        readAuthenticatedCaseWorkflowHistory(backendSession.accessToken, item.id),
        readAuthenticatedCaseWorkflowActions(backendSession.accessToken, item.id),
        readAuthenticatedCaseAuditEvents(backendSession.accessToken, item.id),
        readAuthenticatedCaseRelations(backendSession.accessToken, item.id),
        readAuthenticatedCaseInsurance(backendSession.accessToken, item.id),
        readAuthenticatedCaseInsuranceProcessing(backendSession.accessToken, item.id),
        readAuthenticatedCaseInsuranceProcessingDocuments(backendSession.accessToken, item.id),
        readAuthenticatedCaseCleas(backendSession.accessToken, item.id),
        readAuthenticatedCaseThirdParty(backendSession.accessToken, item.id),
        readAuthenticatedCaseLegal(backendSession.accessToken, item.id),
        readAuthenticatedCaseLegalNews(backendSession.accessToken, item.id),
        readAuthenticatedCaseLegalExpenses(backendSession.accessToken, item.id),
        readAuthenticatedCaseFranchiseRecovery(backendSession.accessToken, item.id),
        readAuthenticatedCaseFranchise(backendSession.accessToken, item.id),
        readAuthenticatedCaseBudget(backendSession.accessToken, item.id),
        readAuthenticatedCaseAppointments(backendSession.accessToken, item.id),
        readAuthenticatedCaseDocuments(backendSession.accessToken, item.id),
        readAuthenticatedCaseFinanceSummary(backendSession.accessToken, item.id),
        readAuthenticatedCaseFinancialMovements(backendSession.accessToken, item.id),
        readAuthenticatedCaseReceipts(backendSession.accessToken, item.id),
        readAuthenticatedCaseVehicleIntakes(backendSession.accessToken, item.id),
        readAuthenticatedCaseVehicleOutcomes(backendSession.accessToken, item.id),
      ]);

      if (detailResult.status === 'rejected') {
        throw detailResult.reason;
      }

      const workflowHistory = historyResult.status === 'fulfilled'
        ? getWorkflowHistoryItems(historyResult.value.data)
        : [];
      const workflowActions = actionsResult.status === 'fulfilled'
        ? getWorkflowActionsItems(actionsResult.value.data)
        : [];
      const auditEventsState = auditEventsResult.status === 'fulfilled'
        ? buildCaseAuditEventsState(auditEventsResult.value.data)
        : buildRejectedCaseAuditEventsState(auditEventsResult.reason);
      const relationsState = relationsResult.status === 'fulfilled'
        ? buildCaseRelationsState(relationsResult.value.data)
        : buildRejectedCaseRelationsState(relationsResult.reason);
      const insuranceState = insuranceResult.status === 'fulfilled'
        ? buildCaseInsuranceState(insuranceResult.value.data)
        : buildRejectedCaseInsuranceState(insuranceResult.reason);
      const insuranceProcessingState = insuranceProcessingResult.status === 'fulfilled'
        ? buildCaseInsuranceProcessingState(insuranceProcessingResult.value.data)
        : buildRejectedCaseInsuranceProcessingState(insuranceProcessingResult.reason);
      const franchiseState = franchiseResult.status === 'fulfilled'
        ? buildCaseFranchiseState(franchiseResult.value.data)
        : buildRejectedCaseFranchiseState(franchiseResult.reason);
      const insuranceProcessingDocumentsState = insuranceProcessingDocumentsResult.status === 'fulfilled'
        ? buildCaseInsuranceProcessingDocumentsState(insuranceProcessingDocumentsResult.value.data)
        : buildRejectedCaseInsuranceProcessingDocumentsState(insuranceProcessingDocumentsResult.reason);
      const cleasState = cleasResult.status === 'fulfilled'
        ? buildCaseCleasState(cleasResult.value.data)
        : buildRejectedCaseCleasState(cleasResult.reason);
      const thirdPartyState = thirdPartyResult.status === 'fulfilled'
        ? buildCaseThirdPartyState(thirdPartyResult.value.data)
        : buildRejectedCaseThirdPartyState(thirdPartyResult.reason);
      const legalState = legalResult.status === 'fulfilled'
        ? buildCaseLegalState(legalResult.value.data)
        : buildRejectedCaseLegalState(legalResult.reason);
      const legalNewsState = legalNewsResult.status === 'fulfilled'
        ? buildCaseLegalNewsState(legalNewsResult.value.data)
        : buildRejectedCaseLegalNewsState(legalNewsResult.reason);
      const legalExpensesState = legalExpensesResult.status === 'fulfilled'
        ? buildCaseLegalExpensesState(legalExpensesResult.value.data)
        : buildRejectedCaseLegalExpensesState(legalExpensesResult.reason);
      const franchiseRecoveryState = franchiseRecoveryResult.status === 'fulfilled'
        ? buildCaseFranchiseRecoveryState(franchiseRecoveryResult.value.data)
        : buildRejectedCaseFranchiseRecoveryState(franchiseRecoveryResult.reason);
      const budgetState = budgetResult.status === 'fulfilled'
        ? buildCaseBudgetState(budgetResult.value.data)
        : buildRejectedCaseBudgetState(budgetResult.reason);
      const appointmentsState = appointmentsResult.status === 'fulfilled'
        ? buildCaseAppointmentsState(appointmentsResult.value.data)
          : {
              status: 'error',
              items: [],
              total: 0,
              nextAppointment: null,
              hasUpcomingAppointment: false,
              detail: getFriendlyErrorMessage(appointmentsResult.reason),
            };
      const documentsState = documentsResult.status === 'fulfilled'
        ? buildCaseDocumentsState(documentsResult.value.data)
        : {
            status: 'error',
            items: [],
            total: 0,
            visibleCount: 0,
            hiddenCount: 0,
            detail: getFriendlyErrorMessage(documentsResult.reason),
          };
      const financeSummaryState = financeSummaryResult.status === 'fulfilled'
        ? buildCaseFinanceSummaryState(financeSummaryResult.value.data)
        : buildRejectedCaseFinanceSummaryState(financeSummaryResult.reason);
      const financialMovementsState = financialMovementsResult.status === 'fulfilled'
        ? buildCaseFinancialMovementsState(financialMovementsResult.value.data)
        : buildRejectedCaseFinancialMovementsState(financialMovementsResult.reason);
      const receiptsState = receiptsResult.status === 'fulfilled'
        ? buildCaseReceiptsState(receiptsResult.value.data)
        : buildRejectedCaseReceiptsState(receiptsResult.reason);
      const vehicleIntakesState = vehicleIntakesResult.status === 'fulfilled'
        ? buildCaseVehicleIntakesState(vehicleIntakesResult.value.data)
        : buildRejectedCaseVehicleIntakesState(vehicleIntakesResult.reason);
      const vehicleOutcomesState = vehicleOutcomesResult.status === 'fulfilled'
        ? buildCaseVehicleOutcomesState(vehicleOutcomesResult.value.data)
        : buildRejectedCaseVehicleOutcomesState(vehicleOutcomesResult.reason);
      const trackingNotice = buildCaseDetailSupportNotice([
        appointmentsResult.status === 'rejected'
          ? 'Abrimos la carpeta, pero los turnos no pudieron mostrarse ahora.'
          : '',
        budgetResult.status === 'rejected' && budgetResult.reason?.httpStatus !== 404
          ? 'Abrimos la carpeta, pero el presupuesto no pudo mostrarse ahora.'
          : '',
        historyResult.status === 'rejected' || actionsResult.status === 'rejected'
          ? 'Abrimos la carpeta, pero algunas novedades de seguimiento no pudieron mostrarse ahora.'
          : '',
        auditEventsResult.status === 'rejected' && auditEventsResult.reason?.httpStatus !== 404
          ? 'Abrimos la carpeta, pero la actividad reciente no pudo mostrarse ahora.'
          : '',
        relationsResult.status === 'rejected' && relationsResult.reason?.httpStatus !== 404
          ? 'Abrimos la carpeta, pero los vínculos no pudieron mostrarse ahora.'
          : '',
        insuranceResult.status === 'rejected' && insuranceResult.reason?.httpStatus !== 404
          ? 'Abrimos la carpeta, pero la cobertura no pudo mostrarse ahora.'
          : '',
        insuranceProcessingResult.status === 'rejected' && insuranceProcessingResult.reason?.httpStatus !== 404
          ? 'Abrimos la carpeta, pero el estado del trámite con la compañía no pudo mostrarse ahora.'
          : '',
        franchiseResult.status === 'rejected' && franchiseResult.reason?.httpStatus !== 404
          ? 'Abrimos la carpeta, pero la franquicia no pudo mostrarse ahora.'
          : '',
        insuranceProcessingDocumentsResult.status === 'rejected' && insuranceProcessingDocumentsResult.reason?.httpStatus !== 404
          ? 'Abrimos la carpeta, pero los documentos del trámite con la compañía no pudieron mostrarse ahora.'
          : '',
        cleasResult.status === 'rejected' && cleasResult.reason?.httpStatus !== 404
          ? 'Abrimos la carpeta, pero los datos CLEAS no pudieron mostrarse ahora.'
          : '',
        thirdPartyResult.status === 'rejected' && thirdPartyResult.reason?.httpStatus !== 404
          ? 'Abrimos la carpeta, pero los datos de terceros no pudieron mostrarse ahora.'
          : '',
        legalResult.status === 'rejected' && legalResult.reason?.httpStatus !== 404
          ? 'Abrimos la carpeta, pero los datos legales no pudieron mostrarse ahora.'
          : '',
        legalNewsResult.status === 'rejected' && legalNewsResult.reason?.httpStatus !== 404
          ? 'Abrimos la carpeta, pero las novedades legales no pudieron mostrarse ahora.'
          : '',
        legalExpensesResult.status === 'rejected' && legalExpensesResult.reason?.httpStatus !== 404
          ? 'Abrimos la carpeta, pero los gastos legales no pudieron mostrarse ahora.'
          : '',
        franchiseRecoveryResult.status === 'rejected' && franchiseRecoveryResult.reason?.httpStatus !== 404
          ? 'Abrimos la carpeta, pero el recupero de franquicia no pudo mostrarse ahora.'
          : '',
        financeSummaryResult.status === 'rejected' && financeSummaryResult.reason?.httpStatus !== 404
          ? 'Abrimos la carpeta, pero el resumen financiero no pudo mostrarse ahora.'
          : '',
        financialMovementsResult.status === 'rejected' && financialMovementsResult.reason?.httpStatus !== 404
          ? 'Abrimos la carpeta, pero los movimientos financieros no pudieron mostrarse ahora.'
          : '',
        receiptsResult.status === 'rejected' && receiptsResult.reason?.httpStatus !== 404
          ? 'Abrimos la carpeta, pero los comprobantes no pudieron mostrarse ahora.'
          : '',
        vehicleIntakesResult.status === 'rejected' && vehicleIntakesResult.reason?.httpStatus !== 404
          ? 'Abrimos la carpeta, pero la recepción del vehículo no pudo mostrarse ahora.'
          : '',
        vehicleOutcomesResult.status === 'rejected' && vehicleOutcomesResult.reason?.httpStatus !== 404
          ? 'Abrimos la carpeta, pero la entrega del vehículo no pudo mostrarse ahora.'
          : '',
      ]);

      setAuthenticatedCaseDetailState({
        status: 'success',
        tone: 'success',
        title: 'Detalle actualizado',
        detail: `Abrimos la carpeta ${getBackendCaseDetailHeadline(detailResult.value.data)} con informacion real del backend.`,
        endpoint: detailResult.value.endpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: detailResult.value.httpStatus,
        item,
        data: detailResult.value.data,
        workflowHistory,
        workflowActions,
        auditEventsState,
        relationsState,
        insuranceState,
        insuranceProcessingState,
        franchiseState,
        insuranceProcessingDocumentsState,
        cleasState,
        thirdPartyState,
        legalState,
        legalNewsState,
        legalExpensesState,
        franchiseRecoveryState,
        budgetState,
        appointmentsState,
        documentsState,
        financeSummaryState,
        financialMovementsState,
        receiptsState,
        vehicleIntakesState,
        vehicleOutcomesState,
        trackingNotice,
      });
    } catch (error) {
      setAuthenticatedCaseDetailState({
        status: 'error',
        tone: 'danger',
        title: 'No pudimos abrir esta carpeta',
        detail: getFriendlyErrorMessage(error),
        endpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: error.httpStatus || null,
        item,
        data: null,
        workflowHistory: [],
        workflowActions: [],
        auditEventsState: {
          status: 'error',
          items: [],
          total: 0,
          detail: '',
        },
        relationsState: {
          status: 'error',
          items: [],
          total: 0,
          detail: '',
        },
        insuranceState: {
          status: 'error',
          data: null,
          detail: '',
        },
        insuranceProcessingState: {
          status: 'error',
          data: null,
          detail: '',
        },
        franchiseState: {
          status: 'error',
          data: null,
          detail: '',
        },
        insuranceProcessingDocumentsState: {
          status: 'error',
          items: [],
          total: 0,
          detail: '',
        },
        cleasState: {
          status: 'error',
          data: null,
          detail: '',
        },
        thirdPartyState: {
          status: 'error',
          data: null,
          detail: '',
        },
        legalState: {
          status: 'error',
          data: null,
          detail: '',
        },
        legalNewsState: {
          status: 'error',
          items: [],
          total: 0,
          detail: '',
        },
        legalExpensesState: {
          status: 'error',
          items: [],
          total: 0,
          detail: '',
        },
        franchiseRecoveryState: {
          status: 'error',
          data: null,
          detail: '',
        },
        budgetState: {
          status: 'error',
          data: null,
          items: [],
          totalItems: 0,
          detail: '',
        },
        appointmentsState: {
          status: 'error',
          items: [],
          total: 0,
          nextAppointment: null,
          hasUpcomingAppointment: false,
          detail: '',
        },
        documentsState: {
          status: 'error',
          items: [],
          total: 0,
          visibleCount: 0,
          hiddenCount: 0,
          detail: '',
        },
        financeSummaryState: {
          status: 'error',
          data: null,
          detail: '',
        },
        financialMovementsState: {
          status: 'error',
          items: [],
          total: 0,
          detail: '',
        },
        receiptsState: {
          status: 'error',
          items: [],
          total: 0,
          latest: null,
          detail: '',
        },
        vehicleIntakesState: {
          status: 'error',
          items: [],
          total: 0,
          latest: null,
          detail: '',
        },
        vehicleOutcomesState: {
          status: 'error',
          items: [],
          total: 0,
          latest: null,
          detail: '',
        },
        trackingNotice: '',
      });
    }
  };

  useEffect(() => {
    if (!shouldBootstrapSession) {
      return undefined;
    }

    const controller = new AbortController();

    const validateStoredSession = async () => {
      try {
        await runCurrentUserRead(storedSession.accessToken, controller.signal);
        setAppAccess('authenticated');
        void runAuthenticatedCasesRead(storedSession.accessToken, controller.signal).catch(() => {});
        void runAuthenticatedNotificationsRead(storedSession.accessToken, controller.signal).catch(() => {});
        void runAuthenticatedSystemParametersRead(storedSession.accessToken, controller.signal).catch(() => {});
        void runAuthenticatedOperationCatalogsRead(storedSession.accessToken, controller.signal).catch(() => {});
        void runAuthenticatedFinanceCatalogsRead(storedSession.accessToken, controller.signal).catch(() => {});
        void runAuthenticatedInsuranceCatalogsRead(storedSession.accessToken, controller.signal).catch(() => {});
        void runAuthenticatedDocumentsCatalogsRead(storedSession.accessToken, controller.signal).catch(() => {});
        void runAuthenticatedTasksRead(storedSession.accessToken, controller.signal).catch(() => {});
        void runAuthenticatedInsuranceCompaniesRead(storedSession.accessToken, controller.signal).catch(() => {});
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }

        resetSessionState({
          authTitle: 'Sesión vencida o inválida',
          authDetail: 'Tu sesión anterior venció o ya no es válida. Volvé a iniciar sesión para continuar.',
          authTone: 'danger',
        });
      }
    };

    void validateStoredSession();
    return () => controller.abort();
  }, [shouldBootstrapSession]);

  const submitRealLogin = async () => {
    const email = loginForm.email.trim();
    const password = loginForm.password;

    if (!email || !password) {
      setAuthState({
        status: 'error',
        tone: 'danger',
        title: 'Completá tus datos',
        detail: 'Ingresá tu email y tu contraseña para continuar.',
        endpoint: loginEndpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: null,
      });
      return;
    }

    setAuthState({
      status: 'loading',
      tone: 'info',
      title: 'Ingresando...',
      detail: 'Estamos verificando tus datos.',
      endpoint: loginEndpoint,
      checkedAt: '',
      httpStatus: null,
    });

    try {
      const result = await loginAgainstBackend({ email, password });
      const nextSession = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresInSeconds: result.expiresInSeconds,
        user: {
          email,
          ...(result.user || {}),
        },
        savedAt: new Date().toISOString(),
      };

      storeBackendSession(nextSession);
      setBackendSession(nextSession);
      setAppAccess('authenticated');
      setAuthState({
        status: 'success',
        tone: 'success',
        title: 'Acceso confirmado',
        detail: `Bienvenido/a${result.user?.displayName ? `, ${result.user.displayName}` : ''}.`,
        endpoint: result.endpoint,
        checkedAt: nextSession.savedAt,
        httpStatus: result.httpStatus,
      });

      flash({ tone: 'success', title: 'Bienvenido/a', message: 'Tu sesión se inició correctamente.' });

      void runCurrentUserRead(result.accessToken).catch(() => {});
      void runAuthenticatedCasesRead(result.accessToken).catch(() => {});
      void runAuthenticatedNotificationsRead(result.accessToken).catch(() => {});
      void runAuthenticatedSystemParametersRead(result.accessToken).catch(() => {});
      void runAuthenticatedOperationCatalogsRead(result.accessToken).catch(() => {});
      void runAuthenticatedFinanceCatalogsRead(result.accessToken).catch(() => {});
      void runAuthenticatedInsuranceCatalogsRead(result.accessToken).catch(() => {});
      void runAuthenticatedDocumentsCatalogsRead(result.accessToken).catch(() => {});
      void runAuthenticatedTasksRead(result.accessToken).catch(() => {});
      void runAuthenticatedInsuranceCompaniesRead(result.accessToken).catch(() => {});
    } catch (error) {
      setAuthState({
        status: 'error',
        tone: 'danger',
        title: 'No pudimos ingresar',
        detail: getAuthErrorMessage(error),
        endpoint: loginEndpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: error.httpStatus || null,
      });
    }
  };

  const handleExpiredSessionRedirect = () => {
    if (isSessionExpiring) {
      return;
    }

    if (sessionExpiryTimerRef.current) {
      window.clearTimeout(sessionExpiryTimerRef.current);
      sessionExpiryTimerRef.current = null;
    }
    if (sessionExpiryIntervalRef.current) {
      window.clearInterval(sessionExpiryIntervalRef.current);
      sessionExpiryIntervalRef.current = null;
    }

    let remaining = 3;
    setIsSessionExpiring(true);
    setSessionExpirySeconds(remaining);
    setSessionExpiryNotice(`Tu sesión venció. Te vamos a redirigir al login en ${remaining} segundos...`);

    sessionExpiryIntervalRef.current = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (sessionExpiryIntervalRef.current) {
          window.clearInterval(sessionExpiryIntervalRef.current);
          sessionExpiryIntervalRef.current = null;
        }
        return;
      }
      setSessionExpirySeconds(remaining);
      setSessionExpiryNotice(`Tu sesión venció. Te vamos a redirigir al login en ${remaining} segundos...`);
    }, 1000);

    sessionExpiryTimerRef.current = window.setTimeout(() => {
      if (sessionExpiryIntervalRef.current) {
        window.clearInterval(sessionExpiryIntervalRef.current);
        sessionExpiryIntervalRef.current = null;
      }
      sessionExpiryTimerRef.current = null;
      resetSessionState({
        authTitle: 'Sesión vencida',
        authDetail: 'Tu sesión venció. Volvé a ingresar para continuar.',
        authTone: 'danger',
      });
      setSessionExpiryNotice('');
      setSessionExpirySeconds(0);
      setIsSessionExpiring(false);
      flash({ tone: 'danger', title: 'Sesión vencida', message: 'Volvé a ingresar para continuar.' });
    }, 3000);
  };

  const readWithStoredToken = async (reader) => {
    if (isSessionExpiring) {
      return;
    }

    if (!backendSession?.accessToken) {
      flash({ tone: 'danger', title: 'Sin token', message: 'Primero necesitás hacer login real o recuperar una sesión guardada.' });
      return;
    }

    try {
      await reader(backendSession.accessToken);
    } catch (error) {
      if (error?.httpStatus === 401 || error?.httpStatus === 403) {
        handleExpiredSessionRedirect();
        return;
      }
      // El estado de error ya se informa dentro del reader.
    }
  };

  useEffect(() => {
    const sources = [
      currentUserState,
      authenticatedCasesState,
      authenticatedNotificationsState,
      authenticatedSystemParametersState,
      authenticatedOperationCatalogsState,
      authenticatedFinanceCatalogsState,
      authenticatedInsuranceCatalogsState,
      authenticatedDocumentsCatalogsState,
      authenticatedTasksState,
      authenticatedInsuranceCompaniesState,
      authenticatedInsuranceContactsState,
      authenticatedCaseDetailState,
    ];

    const hasSessionExpired = sources.some((source) => source?.httpStatus === 401 || source?.httpStatus === 403);

    if (!backendSession?.accessToken || !hasSessionExpired) {
      return;
    }

    handleExpiredSessionRedirect();
  }, [
    sessionExpiryNotice,
    isSessionExpiring,
    backendSession,
    currentUserState,
    authenticatedCasesState,
    authenticatedNotificationsState,
    authenticatedSystemParametersState,
    authenticatedOperationCatalogsState,
    authenticatedFinanceCatalogsState,
    authenticatedInsuranceCatalogsState,
    authenticatedDocumentsCatalogsState,
    authenticatedTasksState,
    authenticatedInsuranceCompaniesState,
    authenticatedInsuranceContactsState,
    authenticatedCaseDetailState,
  ]);

  useEffect(() => () => {
    if (sessionExpiryTimerRef.current) {
      window.clearTimeout(sessionExpiryTimerRef.current);
      sessionExpiryTimerRef.current = null;
    }
    if (sessionExpiryIntervalRef.current) {
      window.clearInterval(sessionExpiryIntervalRef.current);
      sessionExpiryIntervalRef.current = null;
    }
  }, []);

  const resetStoredSession = () => {
    resetSessionState({
      authTitle: 'Sesión cerrada',
      authDetail: 'Tu sesión se cerró correctamente.',
    });
  };

  const handleForgotPassword = () => {
    flash({
      tone: 'info',
      title: 'Recuperar acceso',
      message: 'Si no recordás tu contraseña, comunicate con quien administra tu cuenta para restablecerla.',
    });
  };

  const updateCase = (id, mutator) => {
    setCases((current) => current.map((item) => {
      if (item.id !== id) {
        return item;
      }

      const draft = ensureCaseStructure(item);
      mutator(draft);
      return draft;
    }));
  };

  const updateSelectedCase = (mutator) => {
    if (!selectedCase) {
      return;
    }
    updateCase(selectedCase.id, mutator);
    setHasUnsavedChanges(true);
    setDirtyTabs((current) => {
      const next = new Set(current);
      next.add(activeTab);
      return next;
    });
    updateCase(selectedCase.id, (draft) => {
      if (!draft.meta) {
        draft.meta = { dirtyTabs: {}, lastSavedByTab: {}, syncErrorsByTab: {}, removedBudgetItemIds: [], removedPartIds: [] };
      }
      draft.meta.dirtyTabs = { ...(draft.meta.dirtyTabs || {}), [activeTab]: true };
      draft.meta.syncErrorsByTab = { ...(draft.meta.syncErrorsByTab || {}), [activeTab]: '' };
    });
  };

  const updateAgendaTask = (taskRef, mutator) => {
    setCases((current) => current.map((item) => {
      if (item.id !== taskRef.caseId) {
        return item;
      }

      const draft = structuredClone(item);
      const collection = getMutableAgendaCollection(draft, taskRef.collectionKey);
      const target = collection?.find((entry) => entry.id === taskRef.id);

      if (!target) {
        return item;
      }

      mutator(target, draft);
      return draft;
    }));
  };

  const flash = (message) => {
    const payload = typeof message === 'string' ? { tone: 'info', title: 'Aviso', message } : { title: 'Aviso', ...message };
    setNotice(payload);
    window.clearTimeout(window.__demoNoticeTimer);
    window.__demoNoticeTimer = window.setTimeout(() => setNotice(null), 3200);
  };

  const updateNewCaseField = (field, value) => {
    setNewCaseForm((current) => ({ ...current, [field]: value }));
    setAutofilledFields((current) => current.filter((item) => item !== field));

    if (field === 'document') {
      setCustomerLookupState({ status: 'idle', message: '', detail: '' });
    }

    if (field === 'plate') {
      setVehicleLookupState({ status: 'idle', message: '', detail: '' });
    }

    if (field === 'referenced' && value !== 'SI') {
      setNewCaseForm((current) => ({ ...current, referencedName: '' }));
      setAutofilledFields((current) => current.filter((item) => item !== 'referencedName'));
    }
  };

  const highlightAutofilledFields = (fields) => {
    setAutofilledFields(Array.from(new Set(fields.filter(Boolean))));
  };

  const autofillCustomerByDocument = async () => {
    const document = normalizeDocument(newCaseForm.document);

    if (!document) {
      setCustomerLookupState({ status: 'empty', message: 'Ingresá un DNI', detail: 'Cargá un DNI para buscar el cliente.' });
      return;
    }

    if (!backendSession?.accessToken) {
      setCustomerLookupState({ status: 'empty', message: 'Sin sesión', detail: 'Necesitás iniciar sesión para buscar el cliente real.' });
      return;
    }

    try {
      const result = await searchAuthenticatedPersons(backendSession.accessToken, { document });
      const person = Array.isArray(result.data) ? result.data[0] : null;

      if (!person) {
        setCustomerLookupState({ status: 'empty', message: 'Sin coincidencias', detail: 'No encontramos un cliente con ese DNI.' });
        return;
      }

      setNewCaseForm((current) => ({
        ...current,
        firstName: person.nombre || current.firstName,
        lastName: person.apellido || current.lastName,
        phone: person.telefonoPrincipal || current.phone,
        document: person.numeroDocumento || current.document,
      }));

      highlightAutofilledFields(['document', 'firstName', 'lastName', 'phone']);
      setCustomerLookupState({
        status: 'found',
        message: 'Cliente encontrado',
        detail: `${person.nombre || ''} ${person.apellido || ''}`.trim() + ` · DNI ${person.numeroDocumento || document}`,
      });
    } catch (error) {
      setCustomerLookupState({
        status: 'empty',
        message: 'No se pudo buscar',
        detail: error?.message || 'No pudimos consultar personas en este momento.',
      });
    }
  };

  const autofillVehicleByPlate = async () => {
    const plate = normalizePlate(newCaseForm.plate);

    if (!plate) {
      setVehicleLookupState({ status: 'empty', message: 'Ingresá una patente', detail: 'Cargá una patente para buscar el vehículo.' });
      return;
    }

    if (!backendSession?.accessToken) {
      setVehicleLookupState({ status: 'empty', message: 'Sin sesión', detail: 'Necesitás iniciar sesión para buscar el vehículo real.' });
      return;
    }

    try {
      const result = await searchAuthenticatedVehicles(backendSession.accessToken, { plate });
      const vehicle = Array.isArray(result.data) ? result.data[0] : null;

      if (!vehicle) {
        setVehicleLookupState({ status: 'empty', message: 'Sin coincidencias', detail: 'No encontramos un vehículo con esa patente.' });
        return;
      }

      setNewCaseForm((current) => ({
        ...current,
        brand: vehicle.brandText || current.brand,
        model: vehicle.modelText || current.model,
        plate: vehicle.plate || current.plate,
      }));

      highlightAutofilledFields(['plate', 'brand', 'model']);
      setVehicleLookupState({
        status: 'found',
        message: 'Vehículo encontrado',
        detail: `${vehicle.brandText || ''} ${vehicle.modelText || ''}`.trim() + ` · ${vehicle.plate || plate}`,
      });
    } catch (error) {
      setVehicleLookupState({
        status: 'empty',
        message: 'No se pudo buscar',
        detail: error?.message || 'No pudimos consultar vehículos en este momento.',
      });
    }
  };

  const openView = (view) => {
    setActiveView(view);

    if (view !== 'gestion' && window.location.hash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  };

  const exportPanelExcel = (items) => {
    const rows = buildPanelExportRows(items);
    const csv = [
      ['Carpeta', 'Cliente', 'Vehiculo', 'Dominio', 'Estado del tramite', 'Estado de reparacion', 'Pagos', 'Tareas pendientes', 'Fecha estimada', 'Saldo', 'Total cotizado']
        .map(escapeCsvValue)
        .join(','),
      ...rows.map((row) => [
        row.carpeta,
        row.cliente,
        row.vehiculo,
        row.dominio,
        row.tramite,
        row.reparacion,
        row.pagos,
        row.tareasPendientes,
        row.fechaEstimada,
        row.saldo,
        row.totalCotizado,
      ].map(escapeCsvValue).join(',')),
    ].join('\n');

    triggerDownload('panel-general-particular.csv', csv, 'text/csv;charset=utf-8;');
    flash(`Exportación Excel generada con ${rows.length} carpetas visibles.`);
  };

  const exportPanelPdf = (items) => {
    const rows = buildPanelExportRows(items);
    const printable = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');

    if (!printable) {
      flash('No pude abrir la ventana de impresión para el PDF.');
      return;
    }

    printable.document.write(`<!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Panel General Particular</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #18252f; }
            h1 { margin: 0 0 8px; }
            p { margin: 0 0 16px; color: #4f6674; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #c9d5dc; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #eef2f4; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <h1>Panel General - Particular</h1>
          <p>Exportación imprimible con ${rows.length} carpetas visibles.</p>
          <table>
            <thead>
              <tr>
                <th>Carpeta</th>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th>Trámite</th>
                <th>Reparación</th>
                <th>Pagos</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((row) => `
                <tr>
                  <td>${escapeHtml(row.carpeta)}</td>
                  <td>${escapeHtml(row.cliente)}</td>
                  <td>${escapeHtml(`${row.vehiculo} - ${row.dominio}`)}</td>
                  <td>${escapeHtml(row.tramite)}</td>
                  <td>${escapeHtml(row.reparacion)}</td>
                  <td>${escapeHtml(row.pagos)}</td>
                  <td>${escapeHtml(money(row.saldo))}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>`);
    printable.document.close();
    printable.focus();
    printable.print();
    flash(`Exportación PDF preparada para impresión con ${rows.length} carpetas visibles.`);
  };

  const openCase = (id, target = {}) => {
    let targetCase = computedCases.find((item) => String(item.id) === String(id));

    if (!targetCase) {
      const backendItem = authenticatedCasesState.items.find((item) => String(item.id) === String(id));

      if (backendItem) {
        const bridgedCase = buildLocalCaseFromBackend(backendItem, nextCounter);
        setCases((current) => {
          if (current.some((item) => String(item.id) === String(bridgedCase.id))) {
            return current;
          }
          return [...current, bridgedCase];
        });
        targetCase = bridgedCase;
      }
    }

    if (!targetCase) {
      flash({ tone: 'danger', title: 'No pudimos abrir la carpeta', message: 'No encontramos los datos necesarios para abrir esta ficha técnica.' });
      return;
    }

    const resolvedTarget = resolveGestionAccess(targetCase, target);
    const nextTab = resolvedTarget.tab;
    const nextRepairTab = resolvedTarget.subtab || 'repuestos';

    setSelectedCaseId(String(id));
    setHasUnsavedChanges(false);
    setDirtyTabs(new Set());
    setActiveView('gestion');
    setActiveTab(nextTab);
    setActiveRepairTab(nextRepairTab);
    window.location.hash = getCaseHash(id, { tab: nextTab, subtab: nextRepairTab });

    if (backendSession?.accessToken) {
      void openAuthenticatedCaseDetail({ id });
    }
  };

  const syncSelectedCaseToBackend = async ({ silent = false, tabs = null } = {}) => {
    if (!selectedCase) {
      if (!silent) {
        flash({ tone: 'danger', title: 'Sin carpeta seleccionada', message: 'Elegí una carpeta antes de guardar cambios.' });
      }
      return;
    }

    const caseId = Number(selectedCase.id);
    if (!Number.isFinite(caseId)) {
      if (!silent) {
        flash({ tone: 'danger', title: 'Carpeta no sincronizable', message: 'Esta carpeta todavía no tiene un identificador backend válido.' });
      }
      return;
    }

    const toDate = (value) => {
      const normalized = String(value || '').trim();
      return normalized ? normalized : null;
    };
    const toDecimal = (value) => {
      const numeric = numberValue(value);
      return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
    };
    const toBooleanSiNo = (value) => value === 'SI';

    const targetTabs = tabs ? new Set(tabs) : new Set(dirtyTabs);
    const shouldSync = (tabId) => targetTabs.size === 0 || targetTabs.has(tabId);

    setIsSavingCase(true);

    try {
      await readWithStoredToken(async (accessToken) => {
        const syncOps = [];
        const pushSyncOp = (tabId, request) => {
          syncOps.push({ tabId, request });
        };

        if (shouldSync('ficha') || shouldSync('tramite')) {
          pushSyncOp('ficha', updateAuthenticatedCaseIncident(accessToken, caseId, {
              incidentDate: toDate(selectedCase.todoRisk?.incident?.date),
              incidentTime: selectedCase.todoRisk?.incident?.time || null,
              location: selectedCase.todoRisk?.incident?.location || null,
              dynamics: selectedCase.todoRisk?.incident?.dynamics || null,
              observations: selectedCase.todoRisk?.incident?.observations || null,
              prescriptionDate: toDate(addYears(selectedCase.todoRisk?.incident?.date || '', 3)),
            }));
        }

        if ((isInsuranceWorkflowCase(selectedCase) || isFranchiseRecoveryCase(selectedCase)) && shouldSync('tramite')) {
          const insuranceCatalogs = authenticatedInsuranceCatalogsState.catalogs || {};
          const modalityEntries = getCatalogEntries(insuranceCatalogs, 'modalityCodes');
          const opinionEntries = getCatalogEntries(insuranceCatalogs, 'opinionCodes');
          const quoteStatusEntries = getCatalogEntries(insuranceCatalogs, 'quotationStatusCodes');
          const franchiseStatusEntries = getCatalogEntries(insuranceCatalogs, 'franchiseStatusCodes');
          const franchiseRecoveryEntries = getCatalogEntries(insuranceCatalogs, 'franchiseRecoveryTypeCodes');
          const franchiseOpinionEntries = getCatalogEntries(insuranceCatalogs, 'franchiseOpinionCodes');
          const cleasScopeEntries = getCatalogEntries(insuranceCatalogs, 'cleasScopeCodes');
          const paymentStatusEntries = getCatalogEntries(insuranceCatalogs, 'paymentStatusCodes');

          const insuranceDetail = authenticatedCaseDetailState.insuranceState?.data || {};
          const mappedInsuranceCompanyId = resolveInsuranceCompanyIdByName(
            authenticatedInsuranceCompaniesState.items,
            selectedCase.todoRisk?.insurance?.company,
          );
          const insuranceCompanyId = insuranceDetail.insuranceCompanyId || mappedInsuranceCompanyId || null;

          const franchiseStatusCode = resolveCatalogCode(selectedCase.todoRisk?.franchise?.status, franchiseStatusEntries, TODO_RIESGO_FRANCHISE_STATUS_OPTIONS);
          const recoveryTypeCode = resolveCatalogCode(selectedCase.todoRisk?.franchise?.recoveryType, franchiseRecoveryEntries, TODO_RIESGO_RECOVERY_OPTIONS);
          const franchiseOpinionCode = resolveCatalogCode(selectedCase.todoRisk?.franchise?.dictamen, franchiseOpinionEntries, TODO_RIESGO_DICTAMEN_OPTIONS);
          const cleasScopeCode = resolveCatalogCode(selectedCase.todoRisk?.processing?.cleasScope, cleasScopeEntries, CLEAS_SCOPE_OPTIONS);
          const cleasOpinionCode = resolveCatalogCode(selectedCase.todoRisk?.processing?.dictamen, opinionEntries, CLEAS_DICTAMEN_OPTIONS);
          const customerPaymentStatusCode = resolveCatalogCode(selectedCase.todoRisk?.processing?.clientChargeStatus, paymentStatusEntries, CLEAS_PAYMENT_STATUS_OPTIONS);
          const companyPaymentStatusCode = resolveCatalogCode(selectedCase.todoRisk?.processing?.companyFranchisePaymentStatus, paymentStatusEntries, CLEAS_PAYMENT_STATUS_OPTIONS);
          const modalityCode = resolveCatalogCode(selectedCase.todoRisk?.processing?.modality, modalityEntries, TODO_RIESGO_MODALITY_OPTIONS);
          const processingOpinionCode = resolveCatalogCode(selectedCase.todoRisk?.processing?.dictamen, opinionEntries, [...TODO_RIESGO_DICTAMEN_OPTIONS, ...CLEAS_DICTAMEN_OPTIONS]);
          const quotationStatusCode = resolveCatalogCode(selectedCase.todoRisk?.processing?.quoteStatus, quoteStatusEntries, TODO_RIESGO_QUOTE_STATUS_OPTIONS);

          const invalidFields = [];
          if (!insuranceCompanyId && selectedCase.todoRisk?.insurance?.company) invalidFields.push('Compañía de seguro');
          if (selectedCase.todoRisk?.franchise?.status && !franchiseStatusCode) invalidFields.push('Franquicia: estado');
          if (selectedCase.todoRisk?.franchise?.recoveryType && !recoveryTypeCode) invalidFields.push('Franquicia: recupero');
          if (selectedCase.todoRisk?.franchise?.dictamen && !franchiseOpinionCode) invalidFields.push('Franquicia: dictamen');
          if (selectedCase.todoRisk?.processing?.cleasScope && !cleasScopeCode) invalidFields.push('CLEAS: alcance');
          if (selectedCase.todoRisk?.processing?.dictamen && !processingOpinionCode) invalidFields.push('Trámite: dictamen');
          if (selectedCase.todoRisk?.processing?.quoteStatus && !quotationStatusCode) invalidFields.push('Trámite: estado cotización');
          if (selectedCase.todoRisk?.processing?.modality && !modalityCode) invalidFields.push('Trámite: modalidad');
          if (selectedCase.todoRisk?.processing?.clientChargeStatus && !customerPaymentStatusCode) invalidFields.push('CLEAS: estado pago cliente');
          if (selectedCase.todoRisk?.processing?.companyFranchisePaymentStatus && !companyPaymentStatusCode) invalidFields.push('CLEAS: estado pago compañía');

          if (invalidFields.length > 0) {
            const validationError = new Error(`Revisá estos campos antes de guardar: ${invalidFields.join(', ')}.`);
            validationError.tabId = 'tramite';
            throw validationError;
          }

          if (insuranceCompanyId) {
            pushSyncOp('tramite', updateAuthenticatedCaseInsurance(accessToken, caseId, {
              insuranceCompanyId,
              policyNumber: selectedCase.todoRisk?.insurance?.policyNumber || null,
              certificateNumber: selectedCase.todoRisk?.insurance?.certificateNumber || null,
              coverageDetail: selectedCase.todoRisk?.insurance?.coverageDetail || null,
              thirdPartyCompanyId: insuranceDetail.thirdPartyCompanyId || null,
              cleasNumber: selectedCase.todoRisk?.insurance?.cleasNumber || null,
              processorCasePersonId: insuranceDetail.processorCasePersonId || null,
              inspectorCasePersonId: insuranceDetail.inspectorCasePersonId || null,
            }));
          }

          pushSyncOp('tramite', updateAuthenticatedCaseFranchise(accessToken, caseId, {
            franchiseStatusCode,
            franchiseAmount: toDecimal(selectedCase.todoRisk?.franchise?.amount),
            recoveryTypeCode,
            relatedCaseId: null,
            franchiseOpinionCode,
            exceedsFranchise: selectedCase.todoRisk?.franchise?.exceedsFranchise === 'SI',
            recoveryAmount: toDecimal(selectedCase.todoRisk?.franchise?.recoveryAmount),
            notes: selectedCase.todoRisk?.franchise?.notes || null,
          }));

          pushSyncOp('tramite', updateAuthenticatedCaseCleas(accessToken, caseId, {
            scopeCode: cleasScopeCode,
            opinionCode: cleasOpinionCode,
            franchiseAmount: toDecimal(selectedCase.todoRisk?.franchise?.amount),
            customerChargeAmount: toDecimal(selectedCase.todoRisk?.processing?.clientChargeAmount),
            customerPaymentStatusCode,
            customerPaymentDate: toDate(selectedCase.todoRisk?.processing?.clientChargeDate),
            companyFranchisePaymentAmount: toDecimal(selectedCase.todoRisk?.processing?.companyFranchisePaymentAmount),
            companyFranchisePaymentStatusCode: companyPaymentStatusCode,
            companyFranchisePaymentDate: toDate(selectedCase.todoRisk?.processing?.companyFranchisePaymentDate),
          }));

          pushSyncOp('tramite', updateAuthenticatedCaseInsuranceProcessing(accessToken, caseId, {
            presentedAt: toDate(selectedCase.todoRisk?.processing?.presentedDate),
              inspectionForwardedAt: toDate(selectedCase.todoRisk?.processing?.derivedToInspectionDate),
              modalityCode,
              opinionCode: processingOpinionCode,
              quotationStatusCode,
              quotationDate: toDate(selectedCase.todoRisk?.processing?.quoteDate),
              agreedAmount: toDecimal(selectedCase.todoRisk?.processing?.agreedAmount),
              minimumCloseAmount: toDecimal(selectedCase.computed?.todoRisk?.minimumClosingAmount),
              includesParts: Boolean(selectedCase.computed?.hasReplacementParts),
              partsAuthorizationCode: selectedCase.computed?.partsStatus || null,
              partsSupplierText: selectedCase.todoRisk?.processing?.cleasScope || null,
              amountToBillCompany: toDecimal(selectedCase.computed?.todoRisk?.amountToInvoice || selectedCase.computed?.thirdParty?.amountToInvoice),
              finalAmountForWorkshop: toDecimal(selectedCase.computed?.thirdParty?.finalInFavorTaller || selectedCase.computed?.todoRisk?.amountToInvoice),
              noRepair: Boolean(selectedCase.todoRisk?.processing?.noRepairNeeded),
              adminOverrideAppointment: Boolean(selectedCase.todoRisk?.processing?.adminTurnOverride),
            }));
        }

        if ((isThirdPartyWorkshopCase(selectedCase) || isThirdPartyLawyerCase(selectedCase)) && shouldSync('tramite')) {
          pushSyncOp('tramite', updateAuthenticatedCaseThirdParty(accessToken, caseId, {
              thirdPartyCompanyId: null,
              claimReference: selectedCase.thirdParty?.claim?.claimReference || null,
              documentationStatusCode: selectedCase.thirdParty?.claim?.documentationStatus || null,
              documentationAccepted: Boolean(selectedCase.thirdParty?.claim?.documentationAccepted),
              partsProvisionModeCode: selectedCase.thirdParty?.claim?.partsProviderMode || null,
              minimumLaborAmount: toDecimal(selectedCase.computed?.thirdParty?.minimumLabor),
              minimumPartsAmount: toDecimal(selectedCase.computed?.thirdParty?.minimumParts),
              bestQuotationSubtotal: toDecimal(selectedCase.computed?.thirdParty?.subtotalBestQuote),
              finalPartsTotal: toDecimal(selectedCase.computed?.thirdParty?.totalFinalParts),
              amountToBillCompany: toDecimal(selectedCase.computed?.thirdParty?.amountToInvoice),
              finalAmountForWorkshop: toDecimal(selectedCase.computed?.thirdParty?.finalInFavorTaller),
            }));
        }

        if (isThirdPartyLawyerCase(selectedCase) && shouldSync('abogado')) {
          const insuranceCatalogs = authenticatedInsuranceCatalogsState.catalogs || {};
          const legalProcessorEntries = getCatalogEntries(insuranceCatalogs, 'legalProcessorCodes');
          const legalClaimantEntries = getCatalogEntries(insuranceCatalogs, 'legalClaimantCodes');
          const legalInstanceEntries = getCatalogEntries(insuranceCatalogs, 'legalInstanceCodes');
          const legalClosureEntries = getCatalogEntries(insuranceCatalogs, 'legalClosureReasonCodes');
          const legalExpensePayerEntries = getCatalogEntries(insuranceCatalogs, 'legalExpensePayerCodes');

          const processorCode = resolveCatalogCode(selectedCase.lawyer?.tramita, legalProcessorEntries, LAWYER_TRAMITA_OPTIONS);
          const claimantCode = resolveCatalogCode(selectedCase.lawyer?.reclama, legalClaimantEntries, LAWYER_RECLAMA_OPTIONS);
          const instanceCode = resolveCatalogCode(selectedCase.lawyer?.instance, legalInstanceEntries, LAWYER_INSTANCE_OPTIONS);
          const closedByCode = resolveCatalogCode(selectedCase.lawyer?.closure?.closeBy, legalClosureEntries, LAWYER_CLOSE_BY_OPTIONS);

          const invalidLegalFields = [];
          if (selectedCase.lawyer?.tramita && !processorCode) invalidLegalFields.push('Abogado: tramita');
          if (selectedCase.lawyer?.reclama && !claimantCode) invalidLegalFields.push('Abogado: reclama');
          if (selectedCase.lawyer?.instance && !instanceCode) invalidLegalFields.push('Abogado: instancia');
          if (selectedCase.lawyer?.closure?.closeBy && !closedByCode) invalidLegalFields.push('Abogado: cierre por');

          if (invalidLegalFields.length > 0) {
            const validationError = new Error(`Revisá estos campos antes de guardar: ${invalidLegalFields.join(', ')}.`);
            validationError.tabId = 'abogado';
            throw validationError;
          }

          pushSyncOp('abogado', updateAuthenticatedCaseLegal(accessToken, caseId, {
              processorCode,
              claimantCode,
              instanceCode,
              entryDate: toDate(selectedCase.lawyer?.entryDate),
              cuij: selectedCase.lawyer?.cuij || null,
              court: selectedCase.lawyer?.court || null,
              caseNumber: selectedCase.lawyer?.autos || null,
              counterpartLawyer: selectedCase.lawyer?.opponentLawyer || null,
              counterpartPhone: selectedCase.lawyer?.opponentPhone || null,
              counterpartEmail: selectedCase.lawyer?.opponentEmail || null,
              repairsVehicle: toBooleanSiNo(selectedCase.lawyer?.repairVehicle),
              closedByCode,
              legalCloseDate: toDate(selectedCase.lawyer?.closure?.closeDate),
              totalProceedsAmount: toDecimal(selectedCase.lawyer?.closure?.totalAmount),
              observations: selectedCase.lawyer?.observations || null,
              closingNotes: selectedCase.lawyer?.closure?.notes || null,
            }));

          const latestNews = (selectedCase.lawyer?.statusUpdates || []).find((entry) => entry?.detail);
          if (latestNews) {
            const existingNewsSignatures = new Set(
              (authenticatedCaseDetailState.legalNewsState?.items || []).map((entry) => buildLegalNewsSignature({
                date: entry.newsDate,
                detail: entry.detail,
                notifyClient: Boolean(entry.notifyCustomer),
              })),
            );
            const latestNewsSignature = buildLegalNewsSignature(latestNews);
            if (!existingNewsSignatures.has(latestNewsSignature)) {
              pushSyncOp('abogado', createAuthenticatedCaseLegalNews(accessToken, caseId, {
                newsDate: toDate(latestNews.date) || todayIso(),
                detail: latestNews.detail,
                notifyCustomer: Boolean(latestNews.notifyClient),
              }));
            }
          }

          const latestExpense = (selectedCase.lawyer?.closure?.expenses || []).find((entry) => entry?.concept && numberValue(entry?.amount) > 0);
          if (latestExpense) {
            const paidByCode = resolveCatalogCode(latestExpense.paidBy, legalExpensePayerEntries, LAWYER_EXPENSE_PAID_BY_OPTIONS);
            if (latestExpense.paidBy && !paidByCode) {
              const validationError = new Error('Revisá Abogado: abonó (gastos).');
              validationError.tabId = 'abogado';
              throw validationError;
            }
            const existingExpenseSignatures = new Set(
              (authenticatedCaseDetailState.legalExpensesState?.items || []).map((entry) => buildLegalExpenseSignature({
                concept: entry.concept,
                amount: entry.amount,
                date: entry.expenseDate,
                paidBy: entry.paidByCode,
              })),
            );
            const latestExpenseSignature = buildLegalExpenseSignature(latestExpense);
            if (!existingExpenseSignatures.has(latestExpenseSignature)) {
              pushSyncOp('abogado', createAuthenticatedCaseLegalExpense(accessToken, caseId, {
                concept: latestExpense.concept,
                amount: toDecimal(latestExpense.amount),
                expenseDate: toDate(latestExpense.date),
                paidByCode,
                financialMovementId: null,
              }));
            }
          }
        }

        if (shouldSync('presupuesto')) {
          pushSyncOp('presupuesto', upsertAuthenticatedCaseBudget(accessToken, caseId, {
            budgetDate: toDate(selectedCase.budget?.date || todayIso()),
            reportStatusCode: selectedCase.budget?.reportStatus || null,
            laborWithoutVat: toDecimal(selectedCase.budget?.laborWithoutVat),
            vatRate: 0.21,
            partsTotal: toDecimal(selectedCase.computed?.partsTotal),
            estimatedDays: Number.parseInt(selectedCase.repair?.turno?.estimatedDays || '0', 10) || null,
            minimumCloseAmount: toDecimal(selectedCase.budget?.minimumLaborClose),
            observations: selectedCase.budget?.notes || null,
          }));

          const existingBudgetBySignature = new Map(
            (authenticatedCaseDetailState.budgetState?.data?.items || []).map((entry) => [
              buildBudgetLineSignature({
                affectedPiece: entry.affectedPiece,
                actionCode: entry.actionCode,
                taskCode: entry.taskCode,
                partValue: entry.partValue,
                laborAmount: entry.laborAmount,
              }),
              entry,
            ]),
          );

          (selectedCase.budget?.lines || []).forEach((line, index) => {
            const signature = buildBudgetLineSignature(line);
            const existingItem = line.backendId
              ? { id: line.backendId }
              : existingBudgetBySignature.get(signature);
            const payload = {
              visualOrder: index + 1,
              affectedPiece: line.piece || null,
              taskCode: line.task || null,
              damageLevelCode: line.damageLevel || null,
              partDecisionCode: line.replacementDecision || null,
              actionCode: line.repairAction || null,
              requiresReplacement: Boolean(line.replacementDecision && line.replacementDecision !== 'Sin definir'),
              partValue: toDecimal(line.partPrice),
              estimatedHours: toDecimal(line.hours),
              laborAmount: toDecimal(line.laborWithoutVat),
            };
            if (existingItem?.id) {
              pushSyncOp('presupuesto', updateAuthenticatedCaseBudgetItem(accessToken, caseId, existingItem.id, {
                ...payload,
                active: true,
              }));
            } else {
              pushSyncOp('presupuesto', createAuthenticatedCaseBudgetItem(accessToken, caseId, payload));
            }
          });

          (selectedCase.meta?.removedBudgetItemIds || []).forEach((backendId) => {
            if (!backendId) return;
            pushSyncOp('presupuesto', updateAuthenticatedCaseBudgetItem(accessToken, caseId, backendId, {
              visualOrder: 0,
              affectedPiece: null,
              taskCode: null,
              damageLevelCode: null,
              partDecisionCode: null,
              actionCode: null,
              requiresReplacement: false,
              partValue: null,
              estimatedHours: null,
              laborAmount: null,
              active: false,
            }));
          });

          const existingPartsBySignature = new Map(
            (authenticatedCaseDetailState.partsState?.items || []).map((entry) => [
              buildPartSignature({
                description: entry.description,
                statusCode: entry.statusCode,
                finalPrice: entry.finalPrice,
              }),
              entry,
            ]),
          );

          (selectedCase.repair?.parts || []).forEach((part) => {
            const signature = buildPartSignature(part);
            const payload = {
              budgetItemId: null,
              description: part.name || null,
              partCode: null,
              finalSupplier: part.provider || null,
              authorizationCode: part.authorization || null,
              statusCode: part.state || null,
              purchasedByCode: part.purchasedBy || null,
              paymentStatusCode: part.paymentStatus || null,
              budgetedPrice: toDecimal(part.budgetAmount),
              finalPrice: toDecimal(part.amount),
              receivedDate: toDate(part.receivedAt),
              used: Boolean(part.used),
              returned: Boolean(part.returned),
            };
            const existingPart = part.backendId
              ? { id: part.backendId }
              : existingPartsBySignature.get(signature);
            if (existingPart?.id) {
              pushSyncOp('presupuesto', updateAuthenticatedCasePart(accessToken, caseId, existingPart.id, payload));
            } else {
              pushSyncOp('presupuesto', createAuthenticatedCasePart(accessToken, caseId, payload));
            }
          });
        }

        if (shouldSync('pagos')) {
          const financeCatalogs = authenticatedFinanceCatalogsState.catalogs || {};
          const receiptTypeEntries = getCatalogEntries(financeCatalogs, 'receiptTypeCodes');
          const paymentMethodEntries = getCatalogEntries(financeCatalogs, 'paymentMethodCodes');
          const movementTypeEntries = getCatalogEntries(financeCatalogs, 'movementTypeCodes');
          const flowOriginEntries = getCatalogEntries(financeCatalogs, 'flowOriginCodes');
          const counterpartyTypeEntries = getCatalogEntries(financeCatalogs, 'counterpartyTypeCodes');

          const receiptTypeCode = resolveCatalogCode(selectedCase.payments?.comprobante, receiptTypeEntries, COMPROBANTES);
          const paymentMethodCode = resolveCatalogCode(selectedCase.payments?.senaMode, paymentMethodEntries, PAYMENT_MODES);
          const movementTypeCode = resolveCatalogCode('INGRESO', movementTypeEntries, ['INGRESO']);
          const flowOriginCode = resolveCatalogCode('COMPANIA', flowOriginEntries, ['COMPANIA']);
          const counterpartyTypeCode = resolveCatalogCode('COMPANY', counterpartyTypeEntries, ['COMPANY']);

          const invalidPaymentFields = [];
          if (selectedCase.payments?.comprobante && !receiptTypeCode) invalidPaymentFields.push('Pagos: comprobante');
          if (selectedCase.payments?.senaMode && !paymentMethodCode) invalidPaymentFields.push('Pagos: modo de pago');
          if (!movementTypeCode) invalidPaymentFields.push('Pagos: tipo de movimiento');
          if (!flowOriginCode) invalidPaymentFields.push('Pagos: origen de flujo');
          if (!counterpartyTypeCode) invalidPaymentFields.push('Pagos: contraparte');

          if (invalidPaymentFields.length > 0) {
            const validationError = new Error(`Revisá estos campos antes de guardar: ${invalidPaymentFields.join(', ')}.`);
            validationError.tabId = 'pagos';
            throw validationError;
          }

          const receipts = selectedCase.payments?.invoices || [];
          const backendReceiptsById = new Map((authenticatedCaseDetailState.receiptsState?.items || []).map((entry) => [entry.id, entry]));
          const existingReceiptSignatures = new Set(
            (authenticatedCaseDetailState.receiptsState?.items || []).map((entry) => buildReceiptSignature({
              receiptNumber: entry.receiptNumber,
              total: entry.total,
              issuedDate: entry.issuedDate,
            })),
          );

          receipts.forEach((receipt) => {
            if (receipt.backendId) {
              const currentBackend = backendReceiptsById.get(receipt.backendId);
              if (currentBackend) {
                const backendSignature = buildReceiptSignature({
                  receiptNumber: currentBackend.receiptNumber,
                  total: currentBackend.total,
                  issuedDate: currentBackend.issuedDate,
                });
                const localSignature = buildReceiptSignature(receipt);
                if (backendSignature !== localSignature) {
                  const validationError = new Error('Detectamos cambios en un recibo ya emitido. El update de recibos existentes todavía no está habilitado en backend.');
                  validationError.tabId = 'pagos';
                  throw validationError;
                }
              }
              return;
            }

            const signature = buildReceiptSignature(receipt);
            if (existingReceiptSignatures.has(signature)) return;
            const total = toDecimal(receipt.amount);
            const taxableNet = total != null ? Number((total / 1.21).toFixed(2)) : null;
            const vatAmount = total != null && taxableNet != null ? Number((total - taxableNet).toFixed(2)) : null;
            if (total == null || taxableNet == null || vatAmount == null) return;

            pushSyncOp('pagos', createAuthenticatedCaseReceipt(accessToken, caseId, {
              receiptTypeCode,
              receiptNumber: receipt.invoiceNumber || `REC-${Date.now()}`,
              receiverBusinessName: selectedCase.payments?.businessName || 'Consumidor final',
              issuedDate: toDate(receipt.issuedAt) || todayIso(),
              taxableNet,
              vatAmount,
              total,
              signedAt: null,
              notes: receipt.notes || null,
              documentId: null,
            }));
          });

          const depositedAmount = toDecimal(selectedCase.payments?.depositedAmount);
          const paymentDate = toDate(selectedCase.payments?.paymentDate);
          if (depositedAmount != null && paymentDate) {
            const existingMovementSignatures = new Set(
              (authenticatedCaseDetailState.financialMovementsState?.items || []).map((entry) => buildFinancialMovementSignature(entry)),
            );
            const movementSignature = buildFinancialMovementSignature({
              movementTypeCode,
              netAmount: depositedAmount,
              movementAt: `${paymentDate}T12:00:00`,
            });
            if (existingMovementSignatures.has(movementSignature)) {
              // already registered in backend
            } else {
            pushSyncOp('pagos', createAuthenticatedCaseFinancialMovement(accessToken, caseId, {
              receiptId: null,
              movementTypeCode,
              flowOriginCode,
              counterpartyTypeCode,
              counterpartyPersonId: null,
              counterpartyCompanyId: null,
              movementAt: `${paymentDate}T12:00:00`,
              grossAmount: depositedAmount,
              netAmount: depositedAmount,
              paymentMethodCode,
              paymentMethodDetail: selectedCase.payments?.senaModeDetail || null,
              cancellationTypeCode: null,
              advancePayment: false,
              bonification: false,
              reason: 'Ingreso registrado desde ficha técnica',
              externalReference: selectedCase.code || null,
              retentions: [],
              applications: [],
            }));
            }
          }
        }

        if (syncOps.length === 0) {
          return;
        }

        const settled = await Promise.allSettled(syncOps.map((entry) => entry.request));
        const failedByTab = {};

        settled.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            return;
          }
          const tabId = syncOps[index]?.tabId || activeTab;
          const reason = result.reason;
          failedByTab[tabId] = reason?.message || 'Error de sincronización';
        });

        const hasFailures = Object.keys(failedByTab).length > 0;
        if (!hasFailures) {
          await openAuthenticatedCaseDetail({ id: caseId });
        }

        if (selectedCase) {
          updateCase(selectedCase.id, (draft) => {
            if (!draft.meta) {
              draft.meta = { dirtyTabs: {}, lastSavedByTab: {}, syncErrorsByTab: {}, removedBudgetItemIds: [], removedPartIds: [] };
            }
            draft.meta.syncErrorsByTab = { ...(draft.meta.syncErrorsByTab || {}), ...failedByTab };
          });
        }

        if (hasFailures) {
          const failure = new Error('Falló la sincronización parcial en una o más solapas.');
          failure.failedByTab = failedByTab;
          throw failure;
        }
      });

      const syncedAt = new Date().toISOString();
      const syncedTabs = targetTabs.size ? Array.from(targetTabs) : [activeTab];

      setDirtyTabs((current) => {
        if (!targetTabs.size) {
          return new Set();
        }
        const next = new Set(current);
        targetTabs.forEach((tabId) => next.delete(tabId));
        return next;
      });
      if (selectedCase) {
        updateCase(selectedCase.id, (draft) => {
          if (!draft.meta) {
            draft.meta = { dirtyTabs: {}, lastSavedByTab: {}, syncErrorsByTab: {}, removedBudgetItemIds: [], removedPartIds: [] };
          }
          const dirtyTabsMap = { ...(draft.meta.dirtyTabs || {}) };
          const lastSavedByTab = { ...(draft.meta.lastSavedByTab || {}) };
          const syncErrorsByTab = { ...(draft.meta.syncErrorsByTab || {}) };
          syncedTabs.forEach((tabId) => {
            dirtyTabsMap[tabId] = false;
            lastSavedByTab[tabId] = syncedAt;
            syncErrorsByTab[tabId] = '';
          });
          if (syncedTabs.includes('presupuesto')) {
            draft.meta.removedBudgetItemIds = [];
            draft.meta.removedPartIds = [];
          }
          draft.meta.dirtyTabs = dirtyTabsMap;
          draft.meta.lastSavedByTab = lastSavedByTab;
          draft.meta.syncErrorsByTab = syncErrorsByTab;
        });
      }
      if (!silent) {
        flash({ tone: 'success', title: 'Cambios guardados', message: 'Sincronizamos la ficha técnica con backend y refrescamos el detalle.' });
      }
    } catch (error) {
      if (selectedCase && error?.tabId) {
        updateCase(selectedCase.id, (draft) => {
          draft.meta = draft.meta || {};
          draft.meta.syncErrorsByTab = { ...(draft.meta.syncErrorsByTab || {}), [error.tabId]: error.message || 'Error de sincronización' };
        });
      }
      if (!silent) {
        flash({ tone: 'danger', title: 'No pudimos guardar todo', message: error?.message || 'Falló la sincronización con backend.' });
      }
    } finally {
      setIsSavingCase(false);
    }
  };

  const runWorkflowTransitionForCase = async ({ caseId, domain, label, backendAction = null, availableActions = [] }) => {
    const numericCaseId = Number(caseId);
    if (!Number.isFinite(numericCaseId)) {
      return false;
    }

    const action = backendAction || findWorkflowActionByLabel(availableActions, label, domain);
    if (!action?.actionCode || !action?.domain) {
      return false;
    }

    try {
      await readWithStoredToken(async (accessToken) => {
        await createAuthenticatedCaseWorkflowTransition(accessToken, numericCaseId, {
          domain: action.domain,
          actionCode: action.actionCode,
          reason: `Transición ejecutada desde ficha técnica: ${label}`,
          automatic: false,
        });
        await openAuthenticatedCaseDetail({ id: numericCaseId });
      });

      flash({ tone: 'success', title: 'Workflow actualizado', message: `Aplicamos la acción "${label}" en backend.` });
      return true;
    } catch (error) {
      flash({ tone: 'danger', title: 'No pudimos cambiar de etapa', message: error?.message || 'Falló el cambio de etapa.' });
      return false;
    }
  };

  const saveCaseDocument = async ({ caseId, documentId = null, relationId = null, file = null, fileName = '', categoryId = null, subcategoryCode = '', documentDate = '', originCode = 'CLIENTE', observations = '', visibleToCustomer = true, principal = false, visualOrder = 1 }) => {
    const numericCaseId = Number(caseId);
    if (!Number.isFinite(numericCaseId)) {
      flash({ tone: 'danger', title: 'Carpeta inválida', message: 'No pudimos identificar la carpeta para guardar el documento.' });
      return false;
    }

    setIsSavingDocuments(true);

    try {
      await readWithStoredToken(async (accessToken) => {
        let currentDocumentId = documentId;

        if (!currentDocumentId) {
          if (!file) {
            throw new Error('Seleccioná un archivo para subir.');
          }
          const uploadData = new FormData();
          uploadData.append('file', file, fileName || file.name || 'archivo');
          if (categoryId) uploadData.append('categoryId', String(categoryId));
          if (subcategoryCode) uploadData.append('subcategoryCode', subcategoryCode);
          if (documentDate) uploadData.append('documentDate', documentDate);
          if (originCode) uploadData.append('originCode', originCode);
          if (observations) uploadData.append('observations', observations);

          const uploadResult = await uploadAuthenticatedDocument(accessToken, uploadData);
          currentDocumentId = uploadResult.data?.id;

          if (!currentDocumentId) {
            throw new Error('No recibimos el id del documento subido.');
          }

          await createAuthenticatedDocumentRelation(accessToken, currentDocumentId, {
            caseId: numericCaseId,
            entityType: 'CASE',
            entityId: numericCaseId,
            moduleCode: 'GENERAL',
            principal,
            visibleToCustomer,
            visualOrder,
          });
        } else if (file) {
          const replaceData = new FormData();
          replaceData.append('file', file, fileName || file.name || 'archivo');
          if (categoryId) replaceData.append('categoryId', String(categoryId));
          if (subcategoryCode) replaceData.append('subcategoryCode', subcategoryCode);
          if (documentDate) replaceData.append('documentDate', documentDate);
          if (originCode) replaceData.append('originCode', originCode);
          if (observations) replaceData.append('observations', observations);
          await replaceAuthenticatedDocument(accessToken, currentDocumentId, replaceData);
        }

        if (currentDocumentId && !file) {
          await updateAuthenticatedDocument(accessToken, currentDocumentId, {
            categoryId: categoryId || 1,
            subcategoryCode: subcategoryCode || null,
            documentDate: documentDate || null,
            originCode: originCode || null,
            observations: observations || null,
            active: true,
          });
        }

        if (relationId) {
          await updateAuthenticatedDocumentRelation(accessToken, relationId, {
            principal,
            visibleToCustomer,
            visualOrder,
          });
        }

        await openAuthenticatedCaseDetail({ id: numericCaseId });
      });

      flash({ tone: 'success', title: 'Documento guardado', message: 'Sincronizamos el documento con backend y refrescamos el detalle.' });
      return true;
    } catch (error) {
      flash({ tone: 'danger', title: 'No pudimos guardar documento', message: error?.message || 'Falló la sincronización del documento.' });
      return false;
    } finally {
      setIsSavingDocuments(false);
    }
  };

  const downloadCaseDocument = async ({ caseId, documentId }) => {
    const numericCaseId = Number(caseId);
    const numericDocumentId = Number(documentId);
    if (!Number.isFinite(numericCaseId) || !Number.isFinite(numericDocumentId)) {
      flash({ tone: 'danger', title: 'Documento inválido', message: 'No pudimos identificar el documento para descargar.' });
      return false;
    }

    setIsDownloadingDocument(true);
    try {
      await readWithStoredToken(async (accessToken) => {
        const result = await downloadAuthenticatedCaseDocument(accessToken, numericCaseId, numericDocumentId);
        triggerBlobDownload(result.fileName || `documento-${numericDocumentId}`, result.blob);
      });
      return true;
    } catch (error) {
      flash({ tone: 'danger', title: 'No pudimos descargar', message: error?.message || 'Falló la descarga del documento.' });
      return false;
    } finally {
      setIsDownloadingDocument(false);
    }
  };

  const previewCaseDocument = async ({ caseId, documentId }) => {
    const numericCaseId = Number(caseId);
    const numericDocumentId = Number(documentId);
    if (!Number.isFinite(numericCaseId) || !Number.isFinite(numericDocumentId)) {
      flash({ tone: 'danger', title: 'Documento inválido', message: 'No pudimos identificar el documento para previsualizar.' });
      return false;
    }

    setIsPreviewingDocument(true);
    try {
      await readWithStoredToken(async (accessToken) => {
        const result = await downloadAuthenticatedCaseDocument(accessToken, numericCaseId, numericDocumentId);
        const blobUrl = URL.createObjectURL(result.blob);
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
        window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      });
      return true;
    } catch (error) {
      flash({ tone: 'danger', title: 'No pudimos previsualizar', message: error?.message || 'Falló la apertura del documento.' });
      return false;
    } finally {
      setIsPreviewingDocument(false);
    }
  };

  const createCase = async () => {
    setShowNewCaseValidation(true);

    if (folderMissing.length) {
      flash({ tone: 'danger', title: 'Validación', message: 'Faltan campos obligatorios' });
      return;
    }

    await readWithStoredToken(async (accessToken) => {
      const catalogsResponse = await readAuthenticatedCasesCatalogs(accessToken);
      const caseTypes = Array.isArray(catalogsResponse.data?.caseTypes) ? catalogsResponse.data.caseTypes : [];
      const customerRoles = Array.isArray(catalogsResponse.data?.customerRoleCodes) ? catalogsResponse.data.customerRoleCodes : [];
      const vehicleRoles = Array.isArray(catalogsResponse.data?.principalVehicleRoleCodes) ? catalogsResponse.data.principalVehicleRoleCodes : [];

      const typeMap = {
        Particular: ['particular'],
        'Todo Riesgo': ['todo riesgo', 'todo_riesgo'],
        'CLEAS / Terceros / Franquicia': ['cleas', 'terceros', 'franquicia'],
        'Reclamo de Tercero - Taller': ['tercero', 'taller'],
        'Reclamo de Tercero - Abogado': ['tercero', 'abogado'],
        [FRANCHISE_RECOVERY_TRAMITE]: ['recupero', 'franquicia'],
      };

      const typeNeedles = typeMap[newCaseForm.type] || [newCaseForm.type];
      const selectedCaseType = caseTypes.find((item) => {
        const name = normalizeLookupText(item?.name);
        const code = normalizeLookupText(item?.code);
        return typeNeedles.some((needle) => name.includes(normalizeLookupText(needle)) || code.includes(normalizeLookupText(needle)));
      });

      if (!selectedCaseType?.id) {
        throw new Error('No pudimos resolver el tipo de trámite en los catálogos de casos.');
      }

      const customerRoleCode = customerRoles.find((item) => normalizeLookupText(item?.code) === 'cliente')?.code || customerRoles[0]?.code;
      const principalVehicleRoleCode = vehicleRoles.find((item) => normalizeLookupText(item?.code) === 'principal')?.code || vehicleRoles[0]?.code;

      if (!customerRoleCode || !principalVehicleRoleCode) {
        throw new Error('Faltan roles de cliente/vehículo principal en catálogos.');
      }

      const branchCode = getBranchCode(newCaseForm.branch);
      const orgId = authenticatedCasesState.items.find((item) => item?.organizationId)?.organizationId || 1;
      const branchId = authenticatedCasesState.items.find((item) => normalizeLookupText(item?.branchCode) === normalizeLookupText(branchCode))?.branchId
        || authenticatedCasesState.items.find((item) => item?.branchId)?.branchId
        || 1;

      const document = normalizeDocument(newCaseForm.document);
      const foundPersons = await searchAuthenticatedPersons(accessToken, { document });
      let person = Array.isArray(foundPersons.data)
        ? foundPersons.data.find((item) => normalizeDocument(item?.numeroDocumento) === document)
        : null;

      if (!person) {
        const createdPerson = await createAuthenticatedPerson(accessToken, {
          tipoPersona: 'fisica',
          nombre: newCaseForm.firstName.trim(),
          apellido: newCaseForm.lastName.trim(),
          razonSocial: null,
          tipoDocumentoCodigo: 'DNI',
          numeroDocumento: document,
          cuitCuil: null,
          fechaNacimiento: null,
          telefonoPrincipal: newCaseForm.phone.trim() || null,
          emailPrincipal: null,
          ocupacion: null,
          observaciones: null,
          activo: true,
        });
        person = createdPerson.data;
      }

      const plate = normalizePlate(newCaseForm.plate);
      const foundVehicles = await searchAuthenticatedVehicles(accessToken, { plate });
      let vehicle = Array.isArray(foundVehicles.data)
        ? foundVehicles.data.find((item) => normalizePlate(item?.plate) === plate)
        : null;

      if (!vehicle) {
        const createdVehicle = await createAuthenticatedVehicle(accessToken, {
          brandId: null,
          modelId: null,
          brandText: newCaseForm.brand.trim(),
          modelText: newCaseForm.model.trim(),
          plate,
          year: null,
          vehicleTypeCode: null,
          usageCode: null,
          color: null,
          paintCode: null,
          chasis: null,
          motor: null,
          transmissionCode: null,
          mileage: null,
          observaciones: null,
          activo: true,
        });
        vehicle = createdVehicle.data;
      }

      const createdCaseResponse = await createAuthenticatedCase(accessToken, {
        caseTypeId: selectedCaseType.id,
        organizationId: orgId,
        branchId,
        principalVehicleId: vehicle.id,
        principalCustomerPersonId: person.id,
        referenced: newCaseForm.referenced === 'SI',
        referredByPersonId: null,
        referredByText: newCaseForm.referencedName.trim() || null,
        priorityCode: 'ALTA',
        generalObservations: null,
        incidentDate: null,
        incidentTime: null,
        incidentPlace: null,
        incidentDynamics: null,
        incidentObservations: null,
        prescriptionDate: null,
        daysInProcess: null,
        customerRoleCode,
        principalVehicleRoleCode,
      });

      await runAuthenticatedCasesRead(accessToken);

      const createdCaseId = createdCaseResponse.data?.id;
      if (createdCaseId) {
        openCase(String(createdCaseId), { tab: 'ficha' });
      }

      setNewCaseForm(createEmptyForm());
      setShowNewCaseValidation(false);
      setCustomerLookupState({ status: 'idle', message: '', detail: '' });
      setVehicleLookupState({ status: 'idle', message: '', detail: '' });
      setAutofilledFields([]);
      flash({ tone: 'success', title: 'Alta exitosa', message: `Carpeta ${createdCaseResponse.data?.folderCode || ''} creada con éxito` });
    });
  };

  const refreshAuthenticatedCasesPreview = async () => {
    await readWithStoredToken(async (accessToken) => {
      await runAuthenticatedCasesRead(accessToken);
    });
  };

  const refreshAuthenticatedNotificationsPreview = async () => {
    await readWithStoredToken(async (accessToken) => {
      await runAuthenticatedNotificationsRead(accessToken);
    });
  };

  const refreshAuthenticatedSystemParametersPreview = async () => {
    await readWithStoredToken(async (accessToken) => {
      await runAuthenticatedSystemParametersRead(accessToken);
    });
  };

  const refreshAuthenticatedOperationCatalogsPreview = async () => {
    await readWithStoredToken(async (accessToken) => {
      await runAuthenticatedOperationCatalogsRead(accessToken);
    });
  };

  const refreshAuthenticatedFinanceCatalogsPreview = async () => {
    await readWithStoredToken(async (accessToken) => {
      await runAuthenticatedFinanceCatalogsRead(accessToken);
    });
  };

  const refreshAuthenticatedInsuranceCatalogsPreview = async () => {
    await readWithStoredToken(async (accessToken) => {
      await runAuthenticatedInsuranceCatalogsRead(accessToken);
    });
  };

  const refreshAuthenticatedDocumentsCatalogsPreview = async () => {
    await readWithStoredToken(async (accessToken) => {
      await runAuthenticatedDocumentsCatalogsRead(accessToken);
    });
  };

  const refreshAuthenticatedTasksPreview = async () => {
    await readWithStoredToken(async (accessToken) => {
      await runAuthenticatedTasksRead(accessToken);
    });
  };

  const refreshAuthenticatedInsuranceCompaniesPreview = async () => {
    await readWithStoredToken(async (accessToken) => {
      await runAuthenticatedInsuranceCompaniesRead(accessToken);
    });
  };

  const refreshAuthenticatedInsuranceContactsPreview = async () => {
    await readWithStoredToken(async (accessToken) => {
      const primaryCompany = (authenticatedInsuranceCompaniesState.items || []).find((company) => company?.id != null);

      if (primaryCompany?.id != null) {
        await runAuthenticatedInsuranceContactsRead(accessToken, primaryCompany);
      } else {
        await runAuthenticatedInsuranceCompaniesRead(accessToken);
      }
    });
  };

  const refreshCurrentUserPreview = async () => {
    await readWithStoredToken(async (accessToken) => {
      await runCurrentUserRead(accessToken);
    });
  };

  const markNotificationAsRead = async (notification) => {
    if (!notification?.id || !backendSession?.accessToken) {
      return;
    }

    setPendingNotificationIds((current) => (current.includes(notification.id) ? current : [...current, notification.id]));
    setNotificationActionStateById((current) => ({
      ...current,
      [notification.id]: {
        status: 'loading',
        message: '',
      },
    }));

    await readWithStoredToken(async (accessToken) => {
      try {
        await markAuthenticatedNotificationAsRead(accessToken, notification.id);
        setAuthenticatedNotificationsState((current) => {
          const nextItems = current.items.filter((item) => item.id !== notification.id);
          const nextRecentItems = (current.recentItems || []).map((item) => (
            item.id === notification.id
              ? { ...item, read: true, readAt: new Date().toISOString() }
              : item
          ));
          return {
            ...current,
            status: 'success',
            tone: 'success',
            title: 'Avisos actualizados',
            detail: nextItems.length === 0
              ? 'Ya no quedan avisos pendientes en este momento.'
              : `Todavía tenés ${nextItems.length} aviso${nextItems.length === 1 ? '' : 's'} pendiente${nextItems.length === 1 ? '' : 's'} para revisar.`,
            checkedAt: new Date().toISOString(),
            httpStatus: 200,
            items: nextItems,
            recentItems: nextRecentItems,
            recentCount: nextRecentItems.length,
            unreadCount: nextItems.length,
            unreadCountSource: 'fallback-list',
          };
        });
        setNotificationActionStateById((current) => {
          const next = { ...current };
          delete next[notification.id];
          return next;
        });
        flash({ tone: 'success', title: 'Aviso actualizado', message: 'La notificación se marcó como leída.' });
      } catch (error) {
        setNotificationActionStateById((current) => ({
          ...current,
          [notification.id]: {
            status: 'error',
            message: getFriendlyErrorMessage(error),
          },
        }));
        flash({ tone: 'danger', title: 'No pudimos actualizar el aviso', message: getFriendlyErrorMessage(error) });
      } finally {
        setPendingNotificationIds((current) => current.filter((id) => id !== notification.id));
      }
    });
  };

  if (appAccess !== 'authenticated') {
    const isCheckingSession = appAccess === 'checking';

    return (
      <div className="auth-shell">
        <section className="auth-stage">
          <article className="auth-panel auth-panel-brand">
              <p className="eyebrow">Acceso</p>
              <h1>Bienvenido/a.</h1>
              <p className="muted">
                Ingresá para consultar tus carpetas y seguir el estado general de tus casos desde un solo lugar.
              </p>

            <div className="auth-highlight-grid">
              <div className="auth-highlight-card">
                <span>Acceso simple</span>
                <strong>Entrá con tus datos</strong>
                <small>Solo necesitás tu email y tu contraseña.</small>
              </div>
              <div className="auth-highlight-card">
                <span>Seguimiento</span>
                <strong>Volvé a tus carpetas</strong>
                <small>Si ya tenías una sesión guardada, la retomamos automáticamente.</small>
              </div>
            </div>
          </article>

          <article className="auth-panel auth-panel-form">
            <div className="stack-tight">
              <p className="eyebrow">Acceso</p>
              <h2>{isCheckingSession ? 'Estamos verificando tu acceso' : 'Ingresá a tu cuenta'}</h2>
              <p className="muted">
                {isCheckingSession ? 'Aguardá un instante mientras validamos tu sesión guardada.' : 'Usá tu email y tu contraseña para continuar.'}
              </p>
            </div>

            {isCheckingSession ? (
              <div className="auth-check-card">
                <StatusBadge tone="info">Verificando</StatusBadge>
                <strong>{getSessionLabel(backendSession)}</strong>
                <p className="muted">En breve te llevamos a la pantalla principal.</p>
              </div>
            ) : (
              <>
                <div className="form-grid two-columns auth-login-grid">
                  <DataField label="Email" onChange={(value) => setLoginForm((current) => ({ ...current, email: value }))} value={loginForm.email} />
                  <DataField label="Contraseña" onChange={(value) => setLoginForm((current) => ({ ...current, password: value }))} type="password" value={loginForm.password} />
                </div>

                <div className="auth-demo-actions">
                  <button className="primary-button" disabled={authState.status === 'loading'} onClick={() => { void submitRealLogin(); }} type="button">
                    Ingresar
                  </button>
                  <button className="auth-forgot-button" onClick={handleForgotPassword} type="button">
                    Olvidé mi contraseña
                  </button>
                </div>
              </>
            )}

            <div className={`alert-banner ${authState.tone}-banner auth-demo-banner`} role="status" aria-live="polite">
              <div className="api-connection-copy">
                <strong>{authState.title}</strong>
                <small>{authState.detail}</small>
              </div>
            </div>
          </article>
        </section>
      </div>
    );
  }

  return (
    <AuthenticatedAppShell
      activeView={activeView}
      activeViewTitle={getActiveViewTitle(activeView)}
      backendSession={backendSession}
      navItems={NAV_ITEMS}
      notice={flashState}
      onLogout={handleLogout}
      onOpenView={openView}
      sessionExpiryNotice={sessionExpirySeconds > 0 ? getSessionExpiredMessage(backendSession) : null}
      sessionExpirySeconds={sessionExpirySeconds}
      unreadCount={authenticatedNotificationsState.unreadCount}
      unreadCountSource={authenticatedNotificationsState.unreadCountSource}
    >
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">DT</span>
          <div>
            <strong>Delta Taller</strong>
            <small>Seguimiento de carpetas</small>
          </div>
        </div>

        <nav className="nav-list" aria-label="Principal">
          {NAV_ITEMS.map((item) => (
            <button className={`nav-item ${activeView === item.id ? 'is-active' : ''}`} key={item.id} onClick={() => openView(item.id)} type="button">
              {item.label}
            </button>
          ))}
        </nav>

      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Panel</p>
            <h2>{activeView === 'panel' ? 'Panel general' : activeView === 'carpetas' ? 'Mis carpetas' : activeView === 'agenda' ? 'Agenda de tareas' : activeView === 'nuevo' ? 'Nuevo caso' : 'Gestión de trámites'}</h2>
          </div>

          <div className="topbar-right">
            <div className="topbar-notification-pill" role="status" aria-live="polite">
              <span>Avisos pendientes</span>
              <strong>{authenticatedNotificationsState.unreadCount}</strong>
              {authenticatedNotificationsState.unreadCountSource === 'fallback-list' ? <small>estimado</small> : null}
            </div>
            <div className="session-badge-panel">
              <div>
                <span>Cuenta activa</span>
                <strong>{getSessionLabel(backendSession)}</strong>
              </div>
              <button className="ghost-button" onClick={resetStoredSession} type="button">Cerrar sesión</button>
            </div>
          </div>
        </header>

        {notice ? (
          <div className={`floating-notice ${notice.tone || 'info'}`} role="status" aria-live="polite">
            <strong>{notice.title}</strong>
            <span>{notice.message}</span>
          </div>
        ) : null}

        {sessionExpiryNotice ? (
          <div className="alert-banner danger-banner" role="status" aria-live="polite">
            <strong>Sesión vencida {sessionExpirySeconds > 0 ? `(${sessionExpirySeconds})` : ''}</strong>
            <p>{sessionExpiryNotice}</p>
          </div>
        ) : null}

        {activeView === 'gestion' && selectedCase && isThirdPartyDocumentationIncomplete(selectedCase) && docGateAcceptedCaseId !== selectedCase.id ? (
          <div className="blocking-modal-overlay" role="presentation">
            <div aria-labelledby="doc-gate-title" aria-modal="true" className="blocking-modal" role="dialog">
              <p className="eyebrow">Aviso bloqueante</p>
              <h3 id="doc-gate-title">Carpeta con documentación pendiente</h3>
              <p className="muted">
                La carpeta sigue marcada como incompleta. Aceptá para seguir navegando y revisá la solapa
                {' '}
                {isThirdPartyWorkshopCase(selectedCase) ? 'Documentación' : 'Gestión del trámite'}.
              </p>
              <div className="blocking-modal-actions">
                <button className="primary-button" onClick={() => setDocGateAcceptedCaseId(selectedCase.id)} type="button">Aceptar</button>
              </div>
            </div>
          </div>
        ) : null}

        {activeView === 'panel' ? (
          <PanelGeneral
            backendSession={backendSession}
            currentUserEndpoint={currentUserEndpoint}
            currentUserState={currentUserState}
            authenticatedCaseDetailState={authenticatedCaseDetailState}
            authenticatedCasesState={authenticatedCasesState}
            authenticatedNotificationsState={authenticatedNotificationsState}
            authenticatedSystemParametersState={authenticatedSystemParametersState}
            authenticatedOperationCatalogsState={authenticatedOperationCatalogsState}
            authenticatedFinanceCatalogsState={authenticatedFinanceCatalogsState}
            authenticatedInsuranceCatalogsState={authenticatedInsuranceCatalogsState}
            authenticatedDocumentsCatalogsState={authenticatedDocumentsCatalogsState}
            authenticatedTasksState={authenticatedTasksState}
            authenticatedInsuranceCompaniesState={authenticatedInsuranceCompaniesState}
            authenticatedInsuranceContactsState={authenticatedInsuranceContactsState}
            flash={flash}
            items={computedCases}
            onMarkNotificationAsRead={markNotificationAsRead}
            onExportExcel={exportPanelExcel}
            onExportPdf={exportPanelPdf}
            onOpenCase={(item) => {
              openCase(item.id, getGestionEntryTarget(item));
            }}
            onSaveDocument={saveCaseDocument}
            onDownloadDocument={downloadCaseDocument}
            onPreviewDocument={previewCaseDocument}
            isSavingDocuments={isSavingDocuments}
            isDownloadingDocument={isDownloadingDocument}
            isPreviewingDocument={isPreviewingDocument}
            onOpenAuthenticatedCaseDetail={openAuthenticatedCaseDetail}
            onRefreshCurrentUser={refreshCurrentUserPreview}
            onRefreshAuthenticatedCases={refreshAuthenticatedCasesPreview}
            onRefreshAuthenticatedNotifications={refreshAuthenticatedNotificationsPreview}
            onRefreshAuthenticatedSystemParameters={refreshAuthenticatedSystemParametersPreview}
            onRefreshAuthenticatedOperationCatalogs={refreshAuthenticatedOperationCatalogsPreview}
            onRefreshAuthenticatedFinanceCatalogs={refreshAuthenticatedFinanceCatalogsPreview}
            onRefreshAuthenticatedInsuranceCatalogs={refreshAuthenticatedInsuranceCatalogsPreview}
            onRefreshAuthenticatedDocumentsCatalogs={refreshAuthenticatedDocumentsCatalogsPreview}
            onRefreshAuthenticatedTasks={refreshAuthenticatedTasksPreview}
            onRefreshAuthenticatedInsuranceCompanies={refreshAuthenticatedInsuranceCompaniesPreview}
            onRefreshAuthenticatedInsuranceContacts={refreshAuthenticatedInsuranceContactsPreview}
            pendingNotificationIds={pendingNotificationIds}
            notificationActionStateById={notificationActionStateById}
          />
        ) : null}

        {activeView === 'carpetas' ? (
          <div className="stack-lg">
              <AuthenticatedCasesPreview
                detailState={authenticatedCaseDetailState}
                documentsCatalogs={authenticatedDocumentsCatalogsState.catalogs}
                isSavingDocuments={isSavingDocuments}
                isDownloadingDocument={isDownloadingDocument}
                isPreviewingDocument={isPreviewingDocument}
                onOpenCase={(item) => {
                  openCase(item.id, getGestionEntryTarget(item));
                }}
                onDownloadDocument={downloadCaseDocument}
                onPreviewDocument={previewCaseDocument}
                onOpenDetail={openAuthenticatedCaseDetail}
                onRefresh={refreshAuthenticatedCasesPreview}
                onSaveDocument={saveCaseDocument}
                state={authenticatedCasesState}
              />
          </div>
        ) : null}

        {activeView === 'agenda' ? (
          <AgendaView
            items={agendaItems}
            onOpenCase={openCase}
            onUpdateTask={updateAgendaTask}
          />
        ) : null}

        {activeView === 'nuevo' ? (
          <NuevoCaso
            customerLookupState={customerLookupState}
            form={newCaseForm}
            missing={folderMissing}
            nextCode={nextCode}
            onChange={updateNewCaseField}
            onCreate={createCase}
            onSearchDocument={autofillCustomerByDocument}
            onSearchPlate={autofillVehicleByPlate}
            showValidation={showNewCaseValidation}
            autofilledFields={autofilledFields}
            vehicleLookupState={vehicleLookupState}
          />
        ) : null}

        {activeView === 'gestion' ? (
          <GestionView
            activeRepairTab={activeRepairTab}
            activeTab={activeTab}
            allCases={computedCases}
            flash={flash}
            item={selectedCase}
            insuranceCatalogs={authenticatedInsuranceCatalogsState.catalogs}
            financeCatalogs={authenticatedFinanceCatalogsState.catalogs}
            debugCodeIssues={selectedCaseCodeIssues}
            onChangeRepairTab={setActiveRepairTab}
            onChangeTab={setActiveTab}
            onSyncCase={syncSelectedCaseToBackend}
            onRunWorkflowTransition={runWorkflowTransitionForCase}
            isSavingCase={isSavingCase}
            hasUnsavedChanges={hasUnsavedChanges}
            updateCase={updateSelectedCase}
          />
        ) : null}
      </main>
    </AuthenticatedAppShell>
  );
}

export default App;
