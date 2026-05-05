import { useEffect, useMemo, useState } from 'react';
import {
  clearBackendSession,
  getCaseAppointmentsUrl,
  getCaseBudgetUrl,
  getCaseDetailUrl,
  getCaseFinanceSummaryUrl,
  getCaseFinancialMovementsUrl,
  getCaseReceiptsUrl,
  getCaseVehicleIntakesUrl,
  getCaseVehicleOutcomesUrl,
  getConnectivityProbeUrl,
  getCurrentUserUrl,
  getLoginUrl,
  getUnreadNotificationsUrl,
  loginAgainstBackend,
  markAuthenticatedNotificationAsRead,
  probeBackendConnection,
  readAuthenticatedCaseAppointments,
  readAuthenticatedCaseBudget,
  readAuthenticatedCaseDetail,
  readAuthenticatedCaseDocuments,
  readAuthenticatedCaseFinanceSummary,
  readAuthenticatedCaseFinancialMovements,
  readAuthenticatedCaseReceipts,
  readAuthenticatedCaseVehicleIntakes,
  readAuthenticatedCaseVehicleOutcomes,
  readAuthenticatedCaseWorkflowActions,
  readAuthenticatedCaseWorkflowHistory,
  readAuthenticatedCases,
  readAuthenticatedUnreadNotifications,
  readBackendSession,
  readCurrentUser,
  storeBackendSession,
} from './lib/api/backend';
import AuthenticatedUserSnapshot from './components/AuthenticatedUserSnapshot';
import CasesList from './components/cases/CasesList';
import CasesMetrics from './components/cases/CasesMetrics';
import CasesToolbar from './components/cases/CasesToolbar';
import CaseAppointmentsSection from './components/detail/CaseAppointmentsSection';
import CaseBudgetSection from './components/detail/CaseBudgetSection';
import CaseDocumentsSection from './components/detail/CaseDocumentsSection';
import CaseFinanceSection from './components/detail/CaseFinanceSection';
import CaseFinancialMovementsSection from './components/detail/CaseFinancialMovementsSection';
import CaseReceiptsSection from './components/detail/CaseReceiptsSection';
import CaseVehicleIntakesSection from './components/detail/CaseVehicleIntakesSection';
import CaseVehicleOutcomesSection from './components/detail/CaseVehicleOutcomesSection';
import CaseWorkflowSection from './components/detail/CaseWorkflowSection';
import { createAuthenticatedCaseDetailInitialState } from './lib/ui/authenticatedCaseDetailState';

const NAV_ITEMS = [
  { id: 'panel', label: 'Carpetas' },
];

const BRANCHES = [
  { label: 'Zapata', code: 'Z' },
  { label: 'Centro', code: 'C' },
];

const VEHICLE_TYPES = ['Sedan', 'Hatch', 'SUV', 'Pick-up', 'Utilitario'];
const VEHICLE_BRAND_OPTIONS = ['Chevrolet', 'Peugeot', 'Volkswagen', 'Fiat', 'Ford', 'Renault', 'Toyota', 'Citroen', 'Jeep', 'Nissan'];
const VEHICLE_USES = ['Particular', 'Comercial', 'Aplicacion'];
const PAINT_TYPES = ['Monocapa', 'Bicapa', 'Tricapa', 'Perlado'];
const TRANSMISSION_OPTIONS = ['Manual', 'Automatica', 'CVT', 'Secuencial'];
const CIVIL_STATUS_OPTIONS = ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Otro'];
const WORKSHOPS = [
  {
    id: 'zapata',
    label: 'Taller Zapata',
    legalName: 'Talleres Zapata SRL',
    taxId: '30-54986217-5',
    taxCondition: 'Responsable Inscripto',
    address: 'Bv. Oroño 2150 · Rosario',
    phone: '341 426 1200',
    email: 'contacto@tallereszapata.com',
    logo:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=320&q=80',
  },
  {
    id: 'casablanca',
    label: 'Taller Casablanca',
    legalName: 'Casablanca Car Center SAS',
    taxId: '30-61123344-2',
    taxCondition: 'Responsable Inscripto',
    address: 'Av. Pellegrini 1820 · Rosario',
    phone: '341 420 8800',
    email: 'turnos@casablancacar.com',
    logo:
      'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=320&q=80',
  },
  {
    id: 'repararte',
    label: 'Taller Repararte',
    legalName: 'Repararte Automotores SRL',
    taxId: '30-70321456-9',
    taxCondition: 'Monotributo categoría K',
    address: 'Catamarca 1450 · Rosario',
    phone: '341 525 9000',
    email: 'hola@repararte.com',
    logo:
      'https://images.unsplash.com/photo-1453475250267-163ff185e88b?auto=format&fit=crop&w=320&q=80',
  },
];
const WORKSHOP_OPTIONS = WORKSHOPS.map((workshop) => workshop.label);
const BUDGET_DAMAGE_OPTIONS = ['Daño leve (0 a 8%)', 'Daño medio (8 a 25%)', 'Daño fuerte (+ 25%)', 'Igualacion'];
const BUDGET_TASK_OPTIONS = [
  'REEMPLAZAR',
  'REEMPLAZAR Y PINTAR',
  'REEMPLAZAR Y CARGAR',
  'REPARAR',
  'REPARAR Y PINTAR',
  'REPARAR Y ESCUADRAR',
  'REPARAR, ESCUADRAR Y PINTAR',
  'CARGAR',
  'DIFUMINAR',
  'ESCUADRAR',
  'A VERIFICAR',
];
const BUDGET_PART_DECISION_OPTIONS = ['Debe reemplazarse', 'Puede repararse', 'A verificar'];
const REPORT_STATUS_OPTIONS = ['Informe cerrado', 'Informe abierto'];
const AUTHORIZER_OPTIONS = ['PABLO ZAPATA', 'ENRIQUE ZAPATA', 'MELINA ZAPATA', 'DAMIAN ZAPATA'];
const YES_NO_AV_OPTIONS = ['SI', 'NO', 'A/V'];
const REPAIR_PART_STATE_OPTIONS = ['Pendiente', 'Pedido', 'Encargado', 'Recibido', 'Devuelto', 'Devolver'];
const REPAIR_PART_BUYER_OPTIONS = ['Taller', 'Cliente'];
const REPAIR_PART_PAYMENT_OPTIONS = ['Pendiente', 'Cancelado'];
const TURNO_STATE_OPTIONS = ['Pendiente programar', 'Probable a confirmar', 'A confirmar cliente', 'Confirmado', 'Reprogramar'];
const INGRESO_TYPES = ['Carrocería', 'Mecánica', 'Accesorios', 'Otro'];
const TRAMITE_STATUS_OPTIONS = ['Ingresado', 'Sin presentar', 'En trámite', 'Presentado (PD)', 'Acordado', 'Pasado a pagos', 'Pagado', 'Rechazado / Desistido'];
const REPAIR_STATUS_OPTIONS = ['Reparado', 'Con Turno', 'Dar Turno', 'Faltan repuestos', 'En trámite', 'No debe repararse', 'Debe reingresar', 'Rechazado / Desistido'];
const PAYMENT_MODES = ['Transferencia', 'Efectivo', 'Debito', 'Credito', 'Otro'];
const COMPROBANTES = ['A', 'C', 'R'];
const FRANCHISE_RECOVERY_TRAMITE = 'Trámite Recupero de Franquicia';
const FRANCHISE_MANAGER_OPTIONS = ['Taller', 'Abogado'];
const FRANCHISE_RECOVERY_DICTAMEN_OPTIONS = ['Pendiente', 'A favor', 'Rechazado', 'Culpa compartida'];
const FRANCHISE_CLIENT_PAYMENT_STATUS_OPTIONS = ['Pendiente', 'Cancelado'];
const TRAMITE_TYPES = ['Particular', 'Todo Riesgo', 'CLEAS / Terceros / Franquicia', 'Reclamo de Tercero - Taller', 'Reclamo de Tercero - Abogado', FRANCHISE_RECOVERY_TRAMITE];
const PANEL_PAYMENT_FILTERS = ['Todos', 'Por cobrar', 'Ya cobrado'];
const PANEL_TASK_FILTERS = ['Todos', 'Con pendientes', 'Sin pendientes'];
const PANEL_DATE_FILTERS = ['Creación', 'Fecha estimada', 'Fecha de cobro', 'Fecha de cierre'];
const CASE_TABS = ['ficha', 'tramite', 'presupuesto', 'documentacion', 'gestion', 'pagos', 'abogado'];
const REPAIR_TABS = ['repuestos', 'turno', 'ingreso', 'egreso'];
const TODO_RIESGO_INSURANCE_OPTIONS = ['La Segunda', 'Sancor Seguros', 'Federación Patronal', 'Mercantil Andina', 'Rivadavia'];
const TODO_RIESGO_ASSIGNABLE_USERS = ['Melina Z', 'Pablo Z', 'Romina G', 'Damian Z'];
const TODO_RIESGO_FRANCHISE_STATUS_OPTIONS = ['Sin Franquicia', 'Pendiente', 'Cobrada', 'Bonificada'];
const TODO_RIESGO_RECOVERY_OPTIONS = ['Cía. del 3ero', 'Abona cliente', '3ero particular', 'Propia Cía.'];
const TODO_RIESGO_DICTAMEN_OPTIONS = ['Pendiente', 'A favor', 'Rechazado'];
const TODO_RIESGO_DOC_CATEGORY_OPTIONS = ['Personal', 'Vehículo', 'Seguro', '3ero', 'Otro'];
const TODO_RIESGO_MODALITY_OPTIONS = ['Presencial', 'Por fotos'];
const TODO_RIESGO_QUOTE_STATUS_OPTIONS = ['Pendiente', 'Acordada', 'Observada'];
const CLEAS_SCOPE_OPTIONS = ['Sobre franquicia', 'Sobre daño total'];
const CLEAS_DICTAMEN_OPTIONS = ['A favor', 'En contra', 'Culpa compartida', 'Pendiente'];
const CLEAS_PAYMENT_STATUS_OPTIONS = ['Pendiente', 'Cancelado'];
const TASK_STATUS_OPTIONS = ['pendiente', 'en curso', 'resuelta'];
const TASK_PRIORITY_OPTIONS = ['alta', 'media', 'baja'];
const OWNERSHIP_PERCENTAGE_OPTIONS = ['100%', '50%'];
const THIRD_PARTY_PARTS_PROVIDER_OPTIONS = ['Provee Cía.', 'Provee Taller', 'Provee cliente'];
const THIRD_PARTY_ORDER_STATE_OPTIONS = ['Pendiente', 'Encargado', 'Recibido', 'Devolver'];
const THIRD_PARTY_BILLING_OPTIONS = ['A', 'C', 'Sin F'];
const THIRD_PARTY_PAYMENT_OPTIONS = ['Tarjeta 1 pago', 'Tarjetas cuotas', 'Contado'];
const LAWYER_TRAMITA_OPTIONS = ['Con Poder', 'Con Patrocinio'];
const LAWYER_RECLAMA_OPTIONS = ['Daño material', 'Daño material y lesiones', 'Franquicia', 'Franquicia y lesiones'];
const LAWYER_INSTANCE_OPTIONS = ['Administrativa', 'Judicial'];
const LAWYER_INJURED_ROLE_OPTIONS = ['titular registral', 'cliente', 'otro'];
const LAWYER_CLOSE_BY_OPTIONS = ['pendiente', 'conciliación', 'sentencia', 'desistimiento'];
const LAWYER_EXPENSE_PAID_BY_OPTIONS = ['CLIENTE', 'ABOGADO', 'TALLER', 'ASEGURADORA'];
const LAWYER_GENERAL_DOC_CATEGORY_OPTIONS = ['Personal', 'Vehículo', 'Seguro', 'Tercero', 'Otro'];
const LAWYER_EXPEDIENT_DOC_CATEGORY_OPTIONS = ['Escrito', 'Cédula', 'Prueba', 'Honorarios', 'Pericia', 'Otro'];

function createFranchiseRecoveryDefaults(overrides = {}) {
  return {
    managerType: 'Taller',
    associatedCaseId: '',
    associatedFolderCode: '',
    dictamen: 'Pendiente',
    agreementAmount: '',
    amountToRecover: '',
    enablesRepair: 'SI',
    recoverToClient: 'NO',
    clientResponsibilityAmount: '',
    clientRecoveryStatus: 'Pendiente',
    clientRecoveryDate: '',
    approvedBelowAgreement: false,
    approvalNote: '',
    reuseCompatibleData: true,
    ...overrides,
  };
}

function createBudgetService(label, overrides = {}) {
  return {
    id: crypto.randomUUID(),
    label,
    status: 'NO',
    detail: '',
    ...overrides,
  };
}

function createIngresoItem(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    type: 'Otro',
    detail: '',
    media: 'Carpeta demo',
    ...overrides,
  };
}

function createBudgetDefaults(overrides = {}) {
  return {
    workshop: '',
    reportStatus: 'Informe abierto',
    authorizer: AUTHORIZER_OPTIONS[0],
    laborWithoutVat: 0,
    generated: false,
    lines: [createBudgetLine()],
    services: [
      createBudgetService('Estiraje en bancada'),
      createBudgetService('Alineación'),
      createBudgetService('Balanceo'),
      createBudgetService('Recambio cristales'),
      createBudgetService('Trabajos sobre sist. eléctrico'),
      createBudgetService('Trabajos de mecánicas'),
    ],
    partsQuotedDate: '',
    partsProvider: '',
    observations: '',
    estimatedWorkDays: '',
    minimumLaborClose: '',
    accessoryWorkEnabled: 'NO',
    accessoryWorks: overrides.accessoryWorks ?? [createAccessoryWork()],
    accessoryNotes: '',
    ...overrides,
  };
}

function createBudgetLine(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    piece: '',
    task: '',
    damageLevel: '',
    partPrice: '',
    replacementDecision: '',
    action: '',
    ...overrides,
  };
}

function createRepairPart(overrides = {}) {
  return {
    id: crypto.randomUUID(),
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

function createAccessoryWork(overrides = {}) {
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

function createMediaItem(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    type: 'image',
    label: 'Vista general',
    description: '',
    url: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1280&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=480&q=60',
    ...overrides,
  };
}

function createSettlement(overrides = {}) {
  return {
    id: crypto.randomUUID(),
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

function createEmptyForm() {
  return {
    type: 'Particular',
    branch: 'Zapata',
    claimNumber: '',
    firstName: '',
    lastName: '',
    phone: '',
    document: '',
    brand: '',
    model: '',
    plate: '',
    vehicleType: 'Sedan',
    vehicleUse: 'Particular',
    paint: 'Bicapa',
    referenced: '',
    referencedName: '',
  };
}

function normalizeDocument(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function normalizePlate(value) {
  return String(value ?? '').replace(/\s+/g, '').toUpperCase();
}

function formatProbeCheckedAt(value, idleMessage = 'Todavía no se verificó la conexión real.') {
  if (!value) {
    return idleMessage;
  }

  return `Último intento ${new Date(value).toLocaleTimeString('es-AR')}`;
}

function maskToken(value) {
  if (!value) {
    return 'Sin token guardado';
  }

  if (value.length <= 24) {
    return value;
  }

  return `${value.slice(0, 16)}...${value.slice(-8)}`;
}

function getSessionLabel(session) {
  return session?.user?.displayName || session?.user?.email || 'Usuario autenticado';
}

function getFriendlyAuthMessage(error) {
  if (!error) {
    return 'No pudimos iniciar sesión. Intentá nuevamente en unos instantes.';
  }

  if (error.httpStatus === 401 || error.httpStatus === 403) {
    return 'El email o la contraseña no coinciden. Revisalos e intentalo de nuevo.';
  }

  if (error.httpStatus >= 500) {
    return 'Ahora no pudimos validar tu acceso. Probá de nuevo en unos instantes.';
  }

  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) {
    return 'No pudimos conectarnos para validar tu acceso. Revisá tu conexión e intentá nuevamente.';
  }

  return error.message || 'No pudimos iniciar sesión. Intentá nuevamente en unos instantes.';
}

function getFriendlyCasesMessage(error) {
  if (!error) {
    return 'No pudimos traer tus carpetas reales. Intentá nuevamente en unos instantes.';
  }

  if (error.httpStatus === 401 || error.httpStatus === 403) {
    return 'Tu sesión ya no tiene permiso para ver tus carpetas. Volvé a ingresar e intentá nuevamente.';
  }

  if (error.httpStatus >= 500) {
    return 'Ahora no pudimos traer tus carpetas. Probá de nuevo en unos instantes.';
  }

  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) {
    return 'No pudimos conectarnos para traer tus carpetas. Revisá que el backend siga disponible.';
  }

  return error.message || 'No pudimos traer tus carpetas reales. Intentá nuevamente en unos instantes.';
}

function getFriendlyCaseDetailMessage(error) {
  if (!error) {
    return 'No pudimos abrir esta carpeta ahora. Intentá nuevamente en unos instantes.';
  }

  if (error.httpStatus === 401 || error.httpStatus === 403) {
    return 'Tu sesión ya no tiene permiso para abrir esta carpeta. Volvé a ingresar e intentá nuevamente.';
  }

  if (error.httpStatus === 404) {
    return 'Esta carpeta ya no está disponible para consultar en este momento.';
  }

  if (error.httpStatus >= 500) {
    return 'Ahora no pudimos abrir el detalle de esta carpeta. Probá de nuevo en unos instantes.';
  }

  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) {
    return 'No pudimos conectarnos para abrir esta carpeta. Revisá tu conexión e intentá nuevamente.';
  }

  return error.message || 'No pudimos abrir esta carpeta ahora. Intentá nuevamente en unos instantes.';
}

function getFriendlyNotificationsMessage(error) {
  if (!error) {
    return 'No pudimos traer tus avisos ahora. Intentá nuevamente en unos instantes.';
  }

  if (error.httpStatus === 401 || error.httpStatus === 403) {
    return 'Tu sesión no tiene permiso para ver avisos pendientes. Volvé a ingresar e intentá nuevamente.';
  }

  if (error.httpStatus >= 500) {
    return 'Ahora no pudimos traer tus avisos. Probá de nuevo en unos instantes.';
  }

  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) {
    return 'No pudimos conectarnos para traer tus avisos. Revisá que el backend siga disponible.';
  }

  return error.message || 'No pudimos traer tus avisos ahora. Intentá nuevamente en unos instantes.';
}

function getFriendlyNotificationReadMessage(error) {
  if (!error) {
    return 'No pudimos actualizar este aviso ahora. Intentá nuevamente en unos instantes.';
  }

  if (error.httpStatus === 401 || error.httpStatus === 403) {
    return 'Tu sesión no tiene permiso para actualizar este aviso. Volvé a ingresar e intentá nuevamente.';
  }

  if (error.httpStatus === 404) {
    return 'Este aviso ya no está disponible para actualizar.';
  }

  if (error.httpStatus >= 500) {
    return 'Ahora no pudimos actualizar este aviso. Probá de nuevo en unos instantes.';
  }

  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) {
    return 'No pudimos conectarnos para actualizar este aviso. Revisá que el backend siga disponible.';
  }

  return error.message || 'No pudimos actualizar este aviso ahora. Intentá nuevamente en unos instantes.';
}

function getFriendlyCaseDocumentsMessage(error) {
  if (!error) {
    return 'No pudimos traer la documentación de esta carpeta ahora.';
  }

  if (error.httpStatus === 401 || error.httpStatus === 403) {
    return 'Tu sesión no tiene permiso para ver esta documentación. Volvé a ingresar e intentá nuevamente.';
  }

  if (error.httpStatus === 404) {
    return 'La documentación de esta carpeta no está disponible en este momento.';
  }

  if (error.httpStatus >= 500) {
    return 'Ahora no pudimos traer la documentación de esta carpeta. Probá de nuevo en unos instantes.';
  }

  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) {
    return 'No pudimos conectarnos para traer esta documentación. Revisá que el backend siga disponible.';
  }

  return error.message || 'No pudimos traer la documentación de esta carpeta ahora.';
}

function getFriendlyCaseAppointmentsMessage(error) {
  if (!error) {
    return 'No pudimos traer los turnos de esta carpeta ahora.';
  }

  if (error.httpStatus === 401 || error.httpStatus === 403) {
    return 'Tu sesión no tiene permiso para ver los turnos de esta carpeta. Volvé a ingresar e intentá nuevamente.';
  }

  if (error.httpStatus === 404) {
    return 'Los turnos de esta carpeta no están disponibles en este momento.';
  }

  if (error.httpStatus >= 500) {
    return 'Ahora no pudimos traer los turnos de esta carpeta. Probá de nuevo en unos instantes.';
  }

  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) {
    return 'No pudimos conectarnos para traer los turnos de esta carpeta. Revisá que el backend siga disponible.';
  }

  return error.message || 'No pudimos traer los turnos de esta carpeta ahora.';
}

function getFriendlyCaseBudgetMessage(error) {
  if (!error) {
    return 'No pudimos traer el presupuesto de esta carpeta ahora.';
  }

  if (error.httpStatus === 401 || error.httpStatus === 403) {
    return 'Tu sesión no tiene permiso para ver el presupuesto de esta carpeta. Volvé a ingresar e intentá nuevamente.';
  }

  if (error.httpStatus === 404) {
    return 'Todavía no hay un presupuesto cargado para esta carpeta.';
  }

  if (error.httpStatus >= 500) {
    return 'Ahora no pudimos traer el presupuesto de esta carpeta. Probá de nuevo en unos instantes.';
  }

  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) {
    return 'No pudimos conectarnos para traer el presupuesto de esta carpeta. Revisá que el backend siga disponible.';
  }

  return error.message || 'No pudimos traer el presupuesto de esta carpeta ahora.';
}

function getFriendlyCaseFinanceSummaryMessage(error) {
  if (!error) {
    return 'No pudimos traer el resumen financiero de esta carpeta ahora.';
  }

  if (error.httpStatus === 401 || error.httpStatus === 403) {
    return 'Tu sesión no tiene permiso para ver el resumen financiero de esta carpeta. Volvé a ingresar e intentá nuevamente.';
  }

  if (error.httpStatus === 404) {
    return 'Todavía no hay resumen financiero visible para esta carpeta.';
  }

  if (error.httpStatus >= 500) {
    return 'Ahora no pudimos traer el resumen financiero de esta carpeta. Probá de nuevo en unos instantes.';
  }

  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) {
    return 'No pudimos conectarnos para traer el resumen financiero de esta carpeta. Revisá que el backend siga disponible.';
  }

  return error.message || 'No pudimos traer el resumen financiero de esta carpeta ahora.';
}

function getFriendlyCaseFinancialMovementsMessage(error) {
  if (!error) {
    return 'No pudimos traer los movimientos financieros de esta carpeta ahora.';
  }

  if (error.httpStatus === 401 || error.httpStatus === 403) {
    return 'Tu sesión no tiene permiso para ver los movimientos financieros de esta carpeta. Volvé a ingresar e intentá nuevamente.';
  }

  if (error.httpStatus === 404) {
    return 'Todavía no hay movimientos financieros visibles para esta carpeta.';
  }

  if (error.httpStatus >= 500) {
    return 'Ahora no pudimos traer los movimientos financieros de esta carpeta. Probá de nuevo en unos instantes.';
  }

  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) {
    return 'No pudimos conectarnos para traer los movimientos financieros. Revisá que el backend siga disponible.';
  }

  return error.message || 'No pudimos traer los movimientos financieros de esta carpeta ahora.';
}

function getFriendlyCaseReceiptsMessage(error) {
  if (!error) {
    return 'No pudimos traer los comprobantes de esta carpeta ahora.';
  }

  if (error.httpStatus === 401 || error.httpStatus === 403) {
    return 'Tu sesión no tiene permiso para ver los comprobantes de esta carpeta. Volvé a ingresar e intentá nuevamente.';
  }

  if (error.httpStatus === 404) {
    return 'Todavía no hay comprobantes visibles para esta carpeta.';
  }

  if (error.httpStatus >= 500) {
    return 'Ahora no pudimos traer los comprobantes de esta carpeta. Probá de nuevo en unos instantes.';
  }

  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) {
    return 'No pudimos conectarnos para traer los comprobantes de esta carpeta. Revisá que el backend siga disponible.';
  }

  return error.message || 'No pudimos traer los comprobantes de esta carpeta ahora.';
}

function getFriendlyCaseVehicleIntakesMessage(error) {
  if (!error) {
    return 'No pudimos traer las recepciones del vehículo de esta carpeta ahora.';
  }

  if (error.httpStatus === 401 || error.httpStatus === 403) {
    return 'Tu sesión no tiene permiso para ver las recepciones del vehículo de esta carpeta. Volvé a ingresar e intentá nuevamente.';
  }

  if (error.httpStatus === 404) {
    return 'Todavía no vemos ingresos de vehículo cargados para esta carpeta.';
  }

  if (error.httpStatus >= 500) {
    return 'Ahora no pudimos traer las recepciones del vehículo de esta carpeta. Probá de nuevo en unos instantes.';
  }

  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) {
    return 'No pudimos conectarnos para traer las recepciones del vehículo. Revisá que el backend siga disponible.';
  }

  return error.message || 'No pudimos traer las recepciones del vehículo de esta carpeta ahora.';
}

function getFriendlyCaseVehicleOutcomesMessage(error) {
  if (!error) {
    return 'No pudimos traer las entregas del vehículo de esta carpeta ahora.';
  }

  if (error.httpStatus === 401 || error.httpStatus === 403) {
    return 'Tu sesión no tiene permiso para ver las entregas del vehículo de esta carpeta. Volvé a ingresar e intentá nuevamente.';
  }

  if (error.httpStatus === 404) {
    return 'Todavía no vemos egresos de vehículo cargados para esta carpeta.';
  }

  if (error.httpStatus >= 500) {
    return 'Ahora no pudimos traer las entregas del vehículo de esta carpeta. Probá de nuevo en unos instantes.';
  }

  if (error.message && /fetch|network|failed to fetch/i.test(error.message)) {
    return 'No pudimos conectarnos para traer las entregas del vehículo. Revisá que el backend siga disponible.';
  }

  return error.message || 'No pudimos traer las entregas del vehículo de esta carpeta ahora.';
}

function getCasesTechnicalDetail({ endpoint, httpStatus, errorMessage }) {
  const parts = [];

  if (httpStatus) {
    parts.push(`HTTP ${httpStatus}`);
  }

  if (endpoint) {
    parts.push(endpoint);
  }

  if (errorMessage && errorMessage !== getFriendlyCasesMessage({ message: errorMessage, httpStatus })) {
    parts.push(errorMessage);
  }

  return parts.join(' · ');
}

function getBackendCasesItems(payload) {
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

function formatBackendState(code, fallback = 'Sin dato') {
  if (!code) {
    return fallback;
  }

  return String(code)
    .split(/[._-]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(' ');
}

function formatWorkflowDomain(domain, fallback = 'Seguimiento') {
  const normalized = String(domain || '').trim().toLowerCase();

  if (!normalized) {
    return fallback;
  }

  const labels = {
    tramite: 'Tramite',
    reparacion: 'Reparacion',
    pago: 'Cobro',
    documentacion: 'Documentacion',
    legal: 'Gestion legal',
  };

  return labels[normalized] || formatBackendState(normalized, fallback);
}

function getWorkflowHistoryItems(payload) {
  return Array.isArray(payload) ? payload : [];
}

function getWorkflowActionsItems(payload) {
  return Array.isArray(payload?.actions) ? payload.actions : [];
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
      detail: getFriendlyCaseVehicleIntakesMessage(error),
    };
  }

  return {
    status: 'error',
    items: [],
    total: 0,
    latest: null,
    detail: getFriendlyCaseVehicleIntakesMessage(error),
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
      detail: getFriendlyCaseVehicleOutcomesMessage(error),
    };
  }

  return {
    status: 'error',
    items: [],
    total: 0,
    latest: null,
    detail: getFriendlyCaseVehicleOutcomesMessage(error),
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
    detail: getFriendlyCaseBudgetMessage(error),
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
      detail: getFriendlyCaseFinanceSummaryMessage(error),
    };
  }

  return {
    status: 'error',
    data: null,
    detail: getFriendlyCaseFinanceSummaryMessage(error),
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
      detail: getFriendlyCaseFinancialMovementsMessage(error),
    };
  }

  return {
    status: 'error',
    items: [],
    total: 0,
    detail: getFriendlyCaseFinancialMovementsMessage(error),
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
      detail: getFriendlyCaseReceiptsMessage(error),
    };
  }

  return {
    status: 'error',
    items: [],
    total: 0,
    latest: null,
    detail: getFriendlyCaseReceiptsMessage(error),
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
    legal: 'Gestion legal',
    finanza: 'Cobro',
    finanzas: 'Cobro',
  };

  return labels[normalized] || formatBackendState(normalized, 'Documento');
}

function formatDocumentAudience(document) {
  if (document?.principal) {
    return 'Importante';
  }

  if (document?.visibleToCustomer) {
    return 'Disponible';
  }

  return 'Registrado';
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

function getBackendCaseKey(item) {
  return item.folderCode || item.publicId || item.id || 'Caso sin código';
}

function getBackendCaseDetailHeadline(item) {
  return item.folderCode || item.publicId || (item.id ? `Caso ${item.id}` : 'Carpeta sin identificador');
}

function getBackendBranchLabel(item) {
  return item.branchCode || (item.branchId ? `Sucursal ${item.branchId}` : 'Sucursal no informada');
}

function getBackendStatusTone(value) {
  const normalized = String(value || '').toLowerCase();

  if (!normalized) {
    return 'warning';
  }

  if (/(pagad|cerrad|finaliz|acordad|resuelt)/.test(normalized)) {
    return 'success';
  }

  if (/(rechaz|error|anulad|vencid)/.test(normalized)) {
    return 'danger';
  }

  if (/(pend|espera|sin|programar)/.test(normalized)) {
    return 'warning';
  }

  return 'info';
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

function getCaseSearchHaystack(item) {
  const parts = [
    item?.folderCode,
    item?.publicId,
    item?.id,
    item?.domain,
    item?.patent,
    item?.plate,
    item?.licensePlate,
    item?.currentCaseStateCode,
    item?.currentRepairStateCode,
    item?.currentPaymentStateCode,
    item?.holderName,
    item?.ownerName,
    item?.claimantName,
    item?.insuredName,
    item?.customerName,
    item?.firstName,
    item?.lastName,
    item?.dni,
    item?.document,
    item?.email,
    item?.phone,
    item?.insuranceCompany,
    item?.insuranceCompanyName,
    item?.branchCode,
    item?.branchName,
  ];

  return parts
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())
    .join(' ');
}

function AuthenticatedCaseDetail({ detailState, onOpenDetail }) {
  if (detailState.status === 'idle') {
    return (
      <div className="backend-cases-empty backend-detail-empty" role="status">
        <strong>Elegí una carpeta para ver su detalle.</strong>
        <p>Vas a poder revisar un resumen real con los datos principales del caso.</p>
      </div>
    );
  }

  if (detailState.status === 'loading') {
    return (
      <div className="backend-cases-empty backend-detail-empty" role="status" aria-live="polite">
        <strong>Estamos abriendo la carpeta.</strong>
        <p>En unos instantes vas a ver el resumen actualizado del caso.</p>
      </div>
    );
  }

  if (detailState.status === 'error') {
    return (
      <div className="backend-detail-feedback" role="status" aria-live="polite">
        <div className="backend-cases-empty backend-detail-empty">
          <strong>{detailState.title}</strong>
          <p>{detailState.detail}</p>
        </div>
        {detailState.item ? (
          <button className="secondary-button" onClick={() => { void onOpenDetail(detailState.item); }} type="button">
            Reintentar
          </button>
        ) : null}
      </div>
    );
  }

  const item = detailState.data;
  const workflowHistory = detailState.workflowHistory;
  const workflowActions = detailState.workflowActions;
  const budgetState = detailState.budgetState;
  const appointmentsState = detailState.appointmentsState;
  const documentsState = detailState.documentsState;
  const financeSummaryState = detailState.financeSummaryState;
  const financialMovementsState = detailState.financialMovementsState;
  const receiptsState = detailState.receiptsState;
  const vehicleIntakesState = detailState.vehicleIntakesState;
  const vehicleOutcomesState = detailState.vehicleOutcomesState;
  const documentGroups = groupDocumentsByOrigin(documentsState.items);

  return (
    <article className="backend-detail-card" aria-live="polite">
      <div className="backend-detail-head">
        <div className="stack-tight">
          <p className="eyebrow">Detalle de carpeta</p>
          <h3>{getBackendCaseDetailHeadline(item)}</h3>
          <p className="muted">
            Este resumen trae el estado real informado por el sistema para que puedas seguir tu caso sin salir del panel.
          </p>
        </div>
        <StatusBadge tone="info">{getBackendBranchLabel(item)}</StatusBadge>
      </div>

      <div className="backend-detail-grid" role="list" aria-label="Resumen de la carpeta seleccionada">
        <div className="backend-detail-row" role="listitem"><span>Trámite</span><strong>{formatBackendState(item.currentCaseStateCode)}</strong></div>
        <div className="backend-detail-row" role="listitem"><span>Reparación</span><strong>{formatBackendState(item.currentRepairStateCode)}</strong></div>
        <div className="backend-detail-row" role="listitem"><span>Cobro</span><strong>{formatBackendState(item.currentPaymentStateCode)}</strong></div>
        <div className="backend-detail-row" role="listitem"><span>Documentación</span><strong>{formatBackendState(item.currentDocumentationStateCode, 'En revisión')}</strong></div>
        <div className="backend-detail-row" role="listitem"><span>Gestión legal</span><strong>{formatBackendState(item.currentLegalStateCode, 'Sin novedad')}</strong></div>
        <div className="backend-detail-row" role="listitem"><span>Prioridad</span><strong>{formatBackendState(item.priorityCode, 'Estándar')}</strong></div>
        <div className="backend-detail-row" role="listitem"><span>Cierre</span><strong>{item.closedAt ? formatDateTime(item.closedAt) : 'Todavía en curso'}</strong></div>
        <div className="backend-detail-row" role="listitem"><span>Archivo</span><strong>{item.archivedAt ? formatDateTime(item.archivedAt) : 'Disponible para seguimiento'}</strong></div>
      </div>

      <div className="backend-detail-note">
        <span>Observación general</span>
        <p>{item.generalObservations || 'Por ahora esta carpeta no tiene una observación visible para compartir en esta vista.'}</p>
      </div>

      <div className="backend-detail-highlights" role="list" aria-label="Resumen rapido del estado de la carpeta">
        <article className="backend-detail-highlight" role="listitem">
          <span>Próximo turno</span>
          <strong>{appointmentsState.nextAppointment?.appointmentDate ? formatDate(appointmentsState.nextAppointment.appointmentDate) : '-'}</strong>
          <small>{appointmentsState.nextAppointment?.appointmentTime ? `Horario ${formatAppointmentTime(appointmentsState.nextAppointment.appointmentTime)}` : 'Sin horario confirmado todavía.'}</small>
        </article>
        <article className="backend-detail-highlight" role="listitem">
          <span>Presupuesto</span>
          <strong>{budgetState.status === 'success' ? money(budgetState.data?.totalQuoted) : '-'}</strong>
          <small>{budgetState.status === 'success' ? 'Estimación total visible hoy.' : 'Sin estimación visible por ahora.'}</small>
        </article>
        <article className="backend-detail-highlight" role="listitem">
          <span>Saldo del caso</span>
          <strong>{financeSummaryState.status === 'success' ? money(financeSummaryState.data?.saldo) : '-'}</strong>
          <small>{financeSummaryState.status === 'success' ? 'Resultado actual entre ingresos y egresos.' : 'Todavía sin saldo visible.'}</small>
        </article>
        <article className="backend-detail-highlight" role="listitem">
          <span>Documentos visibles</span>
          <strong>{documentsState.visibleCount}</strong>
          <small>{documentsState.total} registrados para esta carpeta.</small>
        </article>
        <article className="backend-detail-highlight" role="listitem">
          <span>Movimientos</span>
          <strong>{financialMovementsState.total}</strong>
          <small>Registros económicos visibles.</small>
        </article>
        <article className="backend-detail-highlight" role="listitem">
          <span>Entregas</span>
          <strong>{vehicleOutcomesState.total}</strong>
          <small>Egresos del vehículo cargados.</small>
        </article>
      </div>

      <div className="backend-detail-sections">
        <CaseWorkflowSection
          workflowHistory={workflowHistory}
          workflowActions={workflowActions}
          formatBackendState={formatBackendState}
          formatDateTime={formatDateTime}
          formatWorkflowDomain={formatWorkflowDomain}
          getBackendStatusTone={getBackendStatusTone}
          getWorkflowActionAudienceCopy={getWorkflowActionAudienceCopy}
          StatusBadge={StatusBadge}
        />

        <CaseFinancialMovementsSection
          financialMovementsState={financialMovementsState}
          formatBackendState={formatBackendState}
          formatDateTime={formatDateTime}
          money={money}
          StatusBadge={StatusBadge}
        />

        <CaseReceiptsSection
          receiptsState={receiptsState}
          formatBackendState={formatBackendState}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
          money={money}
          StatusBadge={StatusBadge}
        />

        <CaseFinanceSection
          financeSummaryState={financeSummaryState}
          money={money}
        />



        <CaseBudgetSection
          budgetState={budgetState}
          formatBackendState={formatBackendState}
          formatDate={formatDate}
          getBackendStatusTone={getBackendStatusTone}
          money={money}
          StatusBadge={StatusBadge}
        />

        <CaseAppointmentsSection
          appointmentsState={appointmentsState}
          formatAppointmentTime={formatAppointmentTime}
          formatBackendState={formatBackendState}
          formatDate={formatDate}
          getAppointmentStatusTone={getAppointmentStatusTone}
          StatusBadge={StatusBadge}
        />

        <CaseVehicleIntakesSection
          vehicleIntakesState={vehicleIntakesState}
          formatBackendState={formatBackendState}
          formatDate={formatDate}
          getBackendStatusTone={getBackendStatusTone}
          StatusBadge={StatusBadge}
        />

        <CaseVehicleOutcomesSection
          vehicleOutcomesState={vehicleOutcomesState}
          formatBackendState={formatBackendState}
          formatDate={formatDate}
          getBackendStatusTone={getBackendStatusTone}
          StatusBadge={StatusBadge}
        />

        <CaseDocumentsSection
          documentGroups={documentGroups}
          documentsState={documentsState}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
          formatDocumentAudience={formatDocumentAudience}
          formatDocumentDescriptor={formatDocumentDescriptor}
          formatDocumentSize={formatDocumentSize}
          StatusBadge={StatusBadge}
        />
      </div>

      {detailState.trackingNotice ? (
        <div className="backend-detail-notice" role="status">
          <p>{detailState.trackingNotice}</p>
        </div>
      ) : null}
    </article>
  );
}

function AuthenticatedCasesPreview({ detailState, onOpenDetail, onRefresh, state }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCaseState, setSelectedCaseState] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const caseStateOptions = useMemo(() => {
    const values = Array.from(new Set(
      state.items
        .map((item) => formatBackendState(item.currentCaseStateCode, 'Sin dato'))
        .filter(Boolean),
    ));

    return values.sort((left, right) => left.localeCompare(right, 'es'));
  }, [state.items]);
  const branchOptions = useMemo(() => {
    const values = Array.from(new Set(
      state.items
        .map((item) => getBackendBranchLabel(item))
        .filter(Boolean),
    ));

    return values.sort((left, right) => left.localeCompare(right, 'es'));
  }, [state.items]);
  const filteredItems = useMemo(() => {
    return state.items.filter((item) => {
      const matchesSearch = !normalizedSearchTerm || getCaseSearchHaystack(item).includes(normalizedSearchTerm);
      const caseState = formatBackendState(item.currentCaseStateCode, 'Sin dato');
      const branch = getBackendBranchLabel(item);
      const matchesState = selectedCaseState === 'all' || caseState === selectedCaseState;
      const matchesBranch = selectedBranch === 'all' || branch === selectedBranch;

      return matchesSearch && matchesState && matchesBranch;
    });
  }, [normalizedSearchTerm, selectedCaseState, selectedBranch, state.items]);
  const hasItems = state.items.length > 0;
  const hasFilteredItems = filteredItems.length > 0;
  const isLoading = state.status === 'loading';
  const statusTone = state.status === 'error'
    ? 'danger'
    : state.status === 'success'
      ? 'success'
      : 'info';
  const statusLabel = isLoading
    ? 'Cargando'
    : state.status === 'success'
      ? 'Conectado'
      : state.status === 'error'
        ? 'Revisar'
        : 'Pendiente';

  return (
    <section className="card backend-cases-card simple-panel-section">
      <CasesToolbar
        branchOptions={branchOptions}
        caseStateOptions={caseStateOptions}
        isLoading={isLoading}
        onRefresh={onRefresh}
        searchTerm={searchTerm}
        selectedBranch={selectedBranch}
        selectedCaseState={selectedCaseState}
        setSearchTerm={setSearchTerm}
        setSelectedBranch={setSelectedBranch}
        setSelectedCaseState={setSelectedCaseState}
        statusLabel={statusLabel}
        statusTone={statusTone}
        StatusBadge={StatusBadge}
      />

      <CasesMetrics
        filteredItems={filteredItems}
        formatDateTime={formatDateTime}
        hasFilteredItems={hasFilteredItems}
        isLoading={isLoading}
        normalizedSearchTerm={normalizedSearchTerm}
        state={state}
      />

      {state.status === 'error' ? (
        <div className={`alert-banner ${state.tone}-banner backend-inline-banner`} role="status" aria-live="polite">
          <div className="api-connection-copy">
            <strong>{state.title}</strong>
            <small>{state.detail}</small>
          </div>
        </div>
      ) : null}

      {hasItems && hasFilteredItems ? (
        <CasesList
          detailState={detailState}
          filteredItems={filteredItems}
          formatBackendState={formatBackendState}
          getBackendBranchLabel={getBackendBranchLabel}
          getBackendCaseKey={getBackendCaseKey}
          getBackendStatusTone={getBackendStatusTone}
          onOpenDetail={onOpenDetail}
          StatusBadge={StatusBadge}
        />
      ) : null}

      {hasItems && hasFilteredItems ? (
        <AuthenticatedCaseDetail
          detailState={detailState}
          onOpenDetail={onOpenDetail}
        />
      ) : null}

      {state.status === 'success' && hasItems && !hasFilteredItems ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>No encontramos carpetas con estos filtros.</strong>
          <p>
            {`Búsqueda: ${searchTerm.trim() || 'sin texto'} · Estado: ${selectedCaseState === 'all' ? 'Todos' : selectedCaseState} · Sucursal: ${selectedBranch === 'all' ? 'Todos' : selectedBranch}.`}
            {' '}Probá ajustar los filtros para volver a ver resultados.
          </p>
        </div>
      ) : null}

      {state.status === 'loading' && !hasItems ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>Estamos cargando tus carpetas.</strong>
          <p>En unos instantes vas a ver la información más reciente de tu cuenta.</p>
        </div>
      ) : null}

      {state.status === 'success' && !hasItems ? (
        <div className="backend-cases-empty" role="status">
          <strong>Todavía no vemos carpetas para mostrar.</strong>
          <p>Cuando haya casos asociados a tu cuenta, van a aparecer acá automáticamente.</p>
        </div>
      ) : null}
    </section>
  );
}

function AuthenticatedNotificationsPreview({ pendingIds, state, onMarkAsRead, onOpenCaseDetail, onRefresh }) {
  const hasItems = state.items.length > 0;
  const isLoading = state.status === 'loading';
  const statusTone = state.status === 'error'
    ? 'danger'
    : state.status === 'success'
      ? 'success'
      : 'info';
  const statusLabel = isLoading
    ? 'Actualizando'
    : state.status === 'success'
      ? 'Activas'
      : state.status === 'error'
        ? 'Revisar'
        : 'Pendiente';

  return (
    <section className="card backend-notifications-card simple-panel-section">
      <div className="section-head backend-cases-head">
        <div className="stack-tight">
          <p className="eyebrow">Avisos</p>
          <h2>Pendientes para revisar</h2>
          <p className="muted">
            Acá ves los avisos reales que siguen sin leer en tu cuenta para no perder contexto entre una entrada y la siguiente.
          </p>
        </div>

        <div className="backend-cases-actions">
          <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
          <button className="secondary-button" disabled={isLoading} onClick={() => { void onRefresh(); }} type="button">
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      <div className="backend-cases-metrics" role="list" aria-label="Resumen de avisos pendientes">
        <article className="backend-case-metric" role="listitem">
          <span>Sin leer</span>
          <strong>{state.unreadCount}</strong>
          <small>{state.unreadCount === 1 ? 'Hay un aviso esperando revisión.' : 'Mostramos los avisos pendientes de tu cuenta.'}</small>
        </article>
        <article className="backend-case-metric" role="listitem">
          <span>Última actualización</span>
          <strong>{state.checkedAt ? formatDateTime(state.checkedAt) : '-'}</strong>
          <small>{isLoading ? 'Estamos refrescando tus avisos.' : 'Podés volver a consultar cuando quieras.'}</small>
        </article>
      </div>

      {state.status === 'error' ? (
        <div className={`alert-banner ${state.tone}-banner backend-inline-banner`} role="status" aria-live="polite">
          <div className="api-connection-copy">
            <strong>{state.title}</strong>
            <small>{state.detail}</small>
          </div>
        </div>
      ) : null}

      {hasItems ? (
        <div className="notification-list" role="list" aria-label="Notificaciones pendientes">
          {state.items.map((notification) => {
            const isPending = pendingIds.includes(notification.id);

            return (
              <article className="notification-card" key={notification.id} role="listitem">
                <div className="notification-card-head">
                  <div className="stack-tight">
                    <span className="client-case-kicker">{formatNotificationType(notification.typeCode)}</span>
                    <h3>{notification.title || 'Aviso pendiente'}</h3>
                  </div>
                  <StatusBadge tone={getNotificationTone(notification.typeCode)}>{formatNotificationType(notification.typeCode)}</StatusBadge>
                </div>

                <p className="notification-card-message">{notification.message || 'Tenés un aviso pendiente para revisar.'}</p>

                <div className="notification-card-meta">
                  <small>{notification.createdAt ? formatDateTime(notification.createdAt) : 'Sin fecha informada'}</small>
                  {notification.caseId ? <small>Carpeta #{notification.caseId}</small> : null}
                </div>

                <div className="notification-card-actions">
                  {notification.caseId ? (
                    <button className="ghost-button" onClick={() => { void onOpenCaseDetail({ id: notification.caseId }); }} type="button">
                      Abrir carpeta
                    </button>
                  ) : null}
                  <button className="secondary-button" disabled={isPending} onClick={() => { void onMarkAsRead(notification); }} type="button">
                    {isPending ? 'Actualizando...' : 'Marcar leída'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {state.status === 'loading' && !hasItems ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>Estamos cargando tus avisos.</strong>
          <p>En unos instantes vas a ver las novedades pendientes de tu cuenta.</p>
        </div>
      ) : null}

      {state.status === 'success' && !hasItems ? (
        <div className="backend-cases-empty" role="status">
          <strong>No tenés avisos pendientes.</strong>
          <p>Cuando aparezca una novedad real para tu cuenta, la vas a ver acá.</p>
        </div>
      ) : null}
    </section>
  );
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

function createTodoRiskDocument(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    category: 'Personal',
    name: '',
    uploadedAt: '',
    notes: '',
    ...overrides,
  };
}

function createTodoRiskTask(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    scheduledAt: '',
    assignee: TODO_RIESGO_ASSIGNABLE_USERS[0],
    priority: 'media',
    status: 'pendiente',
    resolved: false,
    sourceArea: 'Gestión del trámite',
    sourceLabel: 'Gestión del trámite',
    relatedTab: 'tramite',
    relatedSubtab: '',
    linkedCaseId: '',
    linkedCaseCode: '',
    createdAt: todayIso(),
    resolvedAt: '',
    ...overrides,
  };
}

function createTodoRiskInvoice(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    invoiceNumber: '',
    amount: '',
    issuedAt: '',
    notes: '',
    ...overrides,
  };
}

function createRegistryOwner(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    firstName: '',
    lastName: '',
    phone: '',
    document: '',
    birthDate: '',
    locality: '',
    email: '',
    street: '',
    streetNumber: '',
    addressExtra: '',
    occupation: '',
    civilStatus: '',
    ...overrides,
  };
}

function createThirdPartyParticipant(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    driverName: '',
    driverDocument: '',
    driverPhone: '',
    plate: '',
    brand: '',
    model: '',
    address: '',
    isOwner: 'SI',
    ownershipPercentage: '100%',
    owners: overrides.owners ?? [createRegistryOwner(), createRegistryOwner()],
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

function createLawyerDefaults(overrides = {}) {
  return {
    repairVehicle: 'SI',
    tramita: 'Con Poder',
    reclama: 'Daño material',
    instance: 'Administrativa',
    entryDate: '',
    cuij: '',
    court: '',
    autos: '',
    opponentLawyer: '',
    opponentPhone: '',
    opponentEmail: '',
    observations: '',
    expedienteDocuments: overrides.expedienteDocuments ?? [createTodoRiskDocument({ category: 'Escrito' })],
    statusUpdates: overrides.statusUpdates ?? [createLawyerStatusUpdate()],
    agenda: overrides.agenda ?? [createTodoRiskTask()],
    injuredParties: overrides.injuredParties ?? [createLawyerInjured()],
    closure: {
      expenses: overrides.closure?.expenses ?? [createLawyerExpense()],
      closeBy: 'pendiente',
      closeDate: '',
      totalAmount: '',
      items: overrides.closure?.items ?? [createLawyerClosureItem()],
      notes: '',
      ...overrides.closure,
    },
    ...overrides,
  };
}

function getThirdPartyInventoryCode(folderCode, index) {
  return `${folderCode}-${String(index + 1).padStart(2, '0')}`;
}

function createThirdPartyDefaults(overrides = {}) {
  return {
    clientRegistry: {
      isOwner: 'SI',
      ownershipPercentage: '100%',
      owners: overrides.clientRegistry?.owners ?? [createRegistryOwner(), createRegistryOwner()],
      ...overrides.clientRegistry,
    },
    claim: {
      presentedDate: '',
      claimReference: '',
      thirdCompany: '',
      thirdParties: overrides.claim?.thirdParties ?? [createThirdPartyParticipant()],
      documentationStatus: 'Incompleta',
      documentationAccepted: false,
      documents: overrides.claim?.documents ?? [createTodoRiskDocument()],
      partsProviderMode: 'Provee Cía.',
      ...overrides.claim,
    },
    payments: {
      clientPayments: overrides.payments?.clientPayments ?? [],
      ...overrides.payments,
    },
    ...overrides,
  };
}

function createTodoRiskDefaults(overrides = {}) {
  return {
    insurance: {
      company: '',
      thirdCompany: '',
      cleasNumber: '',
      handlerName: '',
      handlerEmail: '',
      handlerPhone: '',
      inspectorName: '',
      inspectorEmail: '',
      inspectorPhone: '',
      coverageDetail: '',
      ...overrides.insurance,
    },
    incident: {
      date: '',
      location: '',
      time: '',
      dynamics: '',
      thirdPartyPlate: '',
      observations: '',
      ...overrides.incident,
    },
    franchise: {
      status: 'Pendiente',
      amount: '',
      recoveryType: '',
      associatedCase: '',
      dictamen: '',
      exceedsFranchise: 'SI',
      recoveryAmount: '',
      notes: '',
      ...overrides.franchise,
    },
    documentation: {
      items: overrides.documentation?.items ?? [],
    },
    processing: {
      presentedDate: '',
      derivedToInspectionDate: '',
      modality: 'Presencial',
      quoteStatus: 'Pendiente',
      quoteDate: '',
      agreedAmount: '',
      cleasScope: '',
      dictamen: 'Pendiente',
      franchiseAmount: '',
      clientChargeAmount: '',
      clientChargeStatus: 'Pendiente',
      clientChargeDate: '',
      companyFranchisePaymentAmount: '',
      companyFranchisePaymentStatus: 'Pendiente',
      companyFranchisePaymentDate: '',
      agenda: overrides.processing?.agenda ?? [],
      adminTurnOverride: false,
      noRepairNeeded: false,
      ...overrides.processing,
    },
    ...overrides,
  };
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

function initialCases() {
  return [
    {
      id: crypto.randomUUID(),
      code: '0001PZ',
      counter: 1,
      claimNumber: '833612',
      branch: 'Zapata',
      createdAt: '2026-03-12',
      folderCreated: true,
      customer: {
        firstName: 'Juan',
        lastName: 'Perez',
        phone: '3413505050',
        document: '16325547',
        birthDate: '1979-05-21',
        locality: 'Rosario',
        email: 'jperez@email.com',
        street: 'Bv. Oroño',
        streetNumber: '1054',
        addressExtra: 'P4 D B',
        occupation: 'Jubilado',
        civilStatus: 'Casado/a',
        referenced: 'NO',
        referencedName: '',
      },
      vehicle: {
        brand: 'Chevrolet',
        model: 'Astra',
        plate: 'AA365BE',
        type: 'Sedan',
        usage: 'Particular',
        paint: 'Bicapa',
        year: '2012',
        color: 'Negro',
        chassis: 'DJ541A451A55',
        engine: 'UD541AADD541',
        transmission: 'Manual',
        mileage: '120025',
        observations: 'Es un vehículo de colección, tiene modificada la suspensión.',
      },
      vehicleMedia: [
        createMediaItem({
          label: 'Daño frontal',
          description: 'Golpe principal sobre paragolpe y guardabarros.',
          url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1280&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=60',
        }),
        createMediaItem({
          label: 'Recorrido lateral',
          type: 'video',
          description: 'Video corto para mostrar alineación lateral derecha.',
          url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=400&q=60',
        }),
        createMediaItem({
          label: 'Detalle óptica',
          description: 'Fisura completa sobre óptica derecha.',
          url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1280&q=80&sat=-80',
          thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=60&sat=-80',
        }),
      ],
      budget: createBudgetDefaults({
        workshop: 'Taller Zapata',
        reportStatus: 'Informe cerrado',
        authorizer: 'PABLO ZAPATA',
        laborWithoutVat: 1200000,
        generated: true,
        lines: [
          createBudgetLine({ piece: 'Guardabarro delantero derecho', task: 'REEMPLAZAR Y PINTAR', damageLevel: 'Daño fuerte (+ 25%)', replacementDecision: 'Debe reemplazarse', action: 'Reemplazar', partPrice: '250000' }),
          createBudgetLine({ piece: 'Paragolpe delantero', task: 'REEMPLAZAR Y PINTAR', damageLevel: 'Daño fuerte (+ 25%)', replacementDecision: 'Puede repararse', action: 'Reemplazar', partPrice: '650000' }),
          createBudgetLine({ piece: 'Óptica delantera derecha', task: 'REEMPLAZAR', damageLevel: 'Daño medio (8 a 25%)', replacementDecision: 'A verificar', action: 'Reemplazar', partPrice: '450000' }),
        ],
        services: [
          createBudgetService('Estiraje en bancada', { status: 'SI', detail: 'parte delantera' }),
          createBudgetService('Alineación', { status: 'NO' }),
          createBudgetService('Balanceo', { status: 'NO' }),
          createBudgetService('Recambio cristales', { status: 'SI', detail: 'cristal de puerta delantera derecha' }),
          createBudgetService('Trabajos sobre sist. eléctrico', { status: 'NO' }),
          createBudgetService('Trabajos de mecánicas', { status: 'A/V' }),
        ],
        partsQuotedDate: '2026-03-12',
        partsProvider: 'Casa de Repuestos Fiat',
        estimatedWorkDays: '4',
        minimumLaborClose: '1000000',
      }),
      repair: {
        parts: [
          createRepairPart({ name: 'Guardabarro delantero derecho', provider: 'Casa Central', amount: '250000', state: 'Recibido', purchaseBy: 'Taller', paymentStatus: 'Cancelado', source: 'budget' }),
          createRepairPart({ name: 'Clip de fijacion frontal', provider: 'Autopartes Sur', amount: '28000', state: 'Recibido', purchaseBy: 'Taller', paymentStatus: 'Cancelado' }),
        ],
        turno: {
          date: '2026-03-15',
          estimatedDays: '4',
          state: 'Confirmado',
          notes: 'Cliente solicita aviso por WhatsApp antes del ingreso.',
        },
        ingreso: {
          realDate: '2026-03-15',
          hasObservation: 'SI',
          observation: 'Se detecta alineacion fina de capot.',
          items: [
            createIngresoItem({ type: 'Carrocería', detail: 'Abolladuras en capot y frente', media: 'Carpeta ingreso 01' }),
            createIngresoItem({ type: 'Accesorios', detail: 'Se recibe con moldura lateral floja', media: 'Video ingreso 02' }),
          ],
        },
        egreso: {
          date: '2026-03-20',
          notes: 'Entrega final sin novedades.',
          shouldReenter: 'NO',
          reentryDate: '',
          reentryEstimatedDays: '',
          reentryState: 'Pendiente',
          reentryNotes: '',
          definitiveExit: true,
          repairedPhotos: true,
          repairedMedia: [
            createMediaItem({
              label: 'Frente reparado',
              description: 'Vista final con paragolpe y guardabarro montados.',
              url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1280&q=80',
              thumbnail: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=400&q=60',
            }),
            createMediaItem({
              label: 'Detalle óptica reparada',
              description: 'Control visual posterior al pulido y alineación final.',
              url: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1280&q=80',
              thumbnail: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=400&q=60',
            }),
          ],
        },
      },
      payments: {
        comprobante: 'A',
        hasSena: 'SI',
        senaAmount: '120000',
        senaDate: '2026-03-13',
        senaMode: 'Transferencia',
        senaModeDetail: '',
        settlements: [
          createSettlement({ kind: 'Parcial', amount: '150000', date: '2026-03-19', mode: 'Debito', gainsRetention: '0', ivaRetention: '0', dreiRetention: '0', employerContributionRetention: '0', iibbRetention: '0' }),
          createSettlement({ kind: 'Total', amount: '2680000', date: '2026-03-20', mode: 'Transferencia', gainsRetention: '7800', ivaRetention: '63478', dreiRetention: '2971', employerContributionRetention: '4571', iibbRetention: '0' }),
        ],
        invoice: 'SI',
        businessName: 'Talleres Zapata SRL',
        invoiceNumber: '0002-0002541',
      },
    },
    {
      id: crypto.randomUUID(),
      code: '0002PC',
      counter: 2,
      claimNumber: '43285410',
      branch: 'Centro',
      createdAt: '2026-03-16',
      folderCreated: true,
      customer: {
        firstName: 'Laura',
        lastName: 'Costa',
        phone: '3414020088',
        document: '27111444',
        birthDate: '1985-11-02',
        locality: 'Rosario',
        email: 'lcosta@email.com',
        street: 'Mendoza',
        streetNumber: '3321',
        addressExtra: '',
        occupation: 'Diseñadora',
        civilStatus: 'Soltero/a',
        referenced: 'SI',
        referencedName: 'Marcelo Varela',
      },
      vehicle: {
        brand: 'Peugeot',
        model: '208',
        plate: 'AF514TR',
        type: 'Hatch',
        usage: 'Particular',
        paint: 'Perlado',
        year: '2020',
        color: 'Blanco nacarado',
        chassis: 'PEU208TR2020',
        engine: 'EB2FA99882',
        transmission: 'Manual',
        mileage: '45210',
        observations: 'Golpe lateral con roce sobre zócalo.',
      },
      vehicleMedia: [
        createMediaItem({
          label: 'Puerta izquierda',
          description: 'Puerta con hendidura y pérdida de pintura.',
          url: 'https://images.unsplash.com/photo-1507306305530-7d29b9d1ef10?auto=format&fit=crop&w=1280&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1507306305530-7d29b9d1ef10?auto=format&fit=crop&w=400&q=60',
        }),
        createMediaItem({
          label: 'Zócalo',
          description: 'Vista inferior del zócalo lateral.',
          url: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1280&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=400&q=60',
        }),
      ],
      budget: createBudgetDefaults({
        workshop: 'Taller Casablanca',
        reportStatus: 'Informe cerrado',
        authorizer: 'MELINA ZAPATA',
        laborWithoutVat: 410000,
        generated: true,
        lines: [
          createBudgetLine({ piece: 'Puerta delantera izquierda', task: 'REEMPLAZAR', damageLevel: 'Daño fuerte (+ 25%)', replacementDecision: 'Debe reemplazarse', action: 'Reemplazar', partPrice: '0' }),
          createBudgetLine({ piece: 'Zócalo lateral', task: 'REPARAR Y PINTAR', damageLevel: 'Daño medio (8 a 25%)', replacementDecision: 'Puede repararse', action: 'Reparar', partPrice: '96000' }),
        ],
        services: [
          createBudgetService('Estiraje en bancada', { status: 'NO' }),
          createBudgetService('Alineación', { status: 'SI', detail: 'control post armado' }),
          createBudgetService('Balanceo', { status: 'NO' }),
          createBudgetService('Recambio cristales', { status: 'NO' }),
          createBudgetService('Trabajos sobre sist. eléctrico', { status: 'NO' }),
          createBudgetService('Trabajos de mecánicas', { status: 'A/V', detail: 'revisar burletes de puerta' }),
        ],
        partsQuotedDate: '2026-03-16',
        partsProvider: 'Repuestos Centro',
        estimatedWorkDays: '5',
        minimumLaborClose: '300000',
      }),
      repair: {
        parts: [
          createRepairPart({ name: 'Puerta delantera izquierda', provider: 'Repuestos Centro', amount: '0', state: 'Pedido', purchaseBy: 'Taller', paymentStatus: 'Pendiente', source: 'budget' }),
        ],
        turno: {
          date: '',
          estimatedDays: '',
          state: 'Pendiente programar',
          notes: '',
        },
        ingreso: {
          realDate: '',
          hasObservation: 'NO',
          observation: '',
          items: [],
        },
        egreso: {
          date: '',
          notes: '',
          shouldReenter: 'SI',
          reentryDate: '',
          reentryEstimatedDays: '',
          reentryState: 'Pendiente',
          reentryNotes: '',
          definitiveExit: false,
          repairedPhotos: false,
          repairedMedia: [],
        },
      },
      payments: {
        comprobante: 'C',
        hasSena: 'SI',
        senaAmount: '80000',
        senaDate: '2026-03-16',
        senaMode: 'Otro',
        senaModeDetail: 'Link de pago enviado por caja',
        settlements: [createSettlement({ kind: 'Parcial', amount: '45000', date: '2026-03-17', mode: 'Transferencia', gainsRetention: '0', ivaRetention: '0', dreiRetention: '0', employerContributionRetention: '0', iibbRetention: '0' })],
        invoice: 'NO',
        businessName: '',
        invoiceNumber: '',
      },
    },
    {
      id: crypto.randomUUID(),
      code: '0003PZ',
      counter: 3,
      claimNumber: '0101024480',
      branch: 'Zapata',
      createdAt: '2026-03-18',
      folderCreated: true,
      customer: {
        firstName: 'Nicolas',
        lastName: 'Ruiz',
        phone: '3416203344',
        document: '30111888',
        birthDate: '1990-09-15',
        locality: 'Funes',
        email: 'nruiz@email.com',
        street: 'San José',
        streetNumber: '741',
        addressExtra: '',
        occupation: 'Contador',
        civilStatus: 'Casado/a',
        referenced: 'NO',
        referencedName: '',
      },
      vehicle: {
        brand: 'Volkswagen',
        model: 'Nivus',
        plate: 'AG012ZX',
        type: 'SUV',
        usage: 'Particular',
        paint: 'Tricapa',
        year: '2023',
        color: 'Gris grafito',
        chassis: '',
        engine: '',
        transmission: '',
        mileage: '',
        observations: '',
      },
      vehicleMedia: [],
      budget: createBudgetDefaults({
        workshop: 'Taller Zapata',
        reportStatus: 'Informe abierto',
        authorizer: 'ENRIQUE ZAPATA',
        laborWithoutVat: 0,
        generated: false,
        lines: [createBudgetLine({ piece: 'Paragolpe trasero', task: '', damageLevel: '', replacementDecision: '', action: '', partPrice: '' })],
        estimatedWorkDays: '',
        minimumLaborClose: '',
      }),
      repair: {
        parts: [],
        turno: {
          date: '',
          estimatedDays: '',
          state: 'Pendiente programar',
          notes: '',
        },
        ingreso: {
          realDate: '',
          hasObservation: 'NO',
          observation: '',
          items: [],
        },
        egreso: {
          date: '',
          notes: '',
          shouldReenter: 'SI',
          reentryDate: '',
          reentryEstimatedDays: '',
          reentryState: 'Pendiente',
          reentryNotes: '',
          definitiveExit: false,
          repairedPhotos: false,
          repairedMedia: [],
        },
      },
      payments: {
        comprobante: 'R',
        hasSena: 'NO',
        senaAmount: '',
        senaDate: '',
        senaMode: 'Transferencia',
        senaModeDetail: '',
        settlements: [],
        invoice: 'NO',
        businessName: '',
        invoiceNumber: '',
      },
    },
    {
      id: crypto.randomUUID(),
      code: '0004TZ',
      counter: 4,
      tramiteType: 'Todo Riesgo',
      claimNumber: '4-2541587',
      branch: 'Zapata',
      createdAt: '2026-03-21',
      folderCreated: true,
      customer: {
        firstName: 'Juan',
        lastName: 'Sánchez',
        phone: '3413505050',
        document: '16325547',
        birthDate: '1979-05-21',
        locality: 'Rosario',
        email: 'perezjuan@gmail.com',
        street: 'Bv. Oroño',
        streetNumber: '1054',
        addressExtra: 'P 4 D B',
        occupation: 'Jubilado',
        civilStatus: 'Casado/a',
        referenced: 'NO',
        referencedName: '',
      },
      vehicle: {
        brand: 'Volkswagen',
        model: 'Gol',
        plate: 'AB412DE',
        type: 'Sedan',
        usage: 'Particular',
        paint: 'Bicapa',
        year: '2019',
        color: 'Negro',
        chassis: 'VWGOLAB412DE99',
        engine: 'EA111AB412DE',
        transmission: 'Manual',
        mileage: '87500',
        observations: 'Unidad asegurada con daño trasero y reposición parcial de repuestos.',
      },
      vehicleMedia: [
        createMediaItem({
          label: 'Golpe lateral',
          description: 'Vista del lateral y zócalo comprometido.',
          url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1280&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=400&q=60',
        }),
      ],
      budget: createBudgetDefaults({
        workshop: 'Taller Zapata',
        reportStatus: 'Informe cerrado',
        authorizer: 'PABLO ZAPATA',
        laborWithoutVat: 980000,
        generated: true,
        lines: [
          createBudgetLine({ piece: 'Faro trasero derecho', task: 'REEMPLAZAR', damageLevel: 'Daño medio (8 a 25%)', replacementDecision: 'Debe reemplazarse', action: 'Reemplazar', partPrice: '50000' }),
          createBudgetLine({ piece: 'Luz de patente', task: 'REEMPLAZAR', damageLevel: 'Daño leve (0 a 8%)', replacementDecision: 'Debe reemplazarse', action: 'Reemplazar', partPrice: '20000' }),
          createBudgetLine({ piece: 'Paragolpe trasero', task: 'REEMPLAZAR Y PINTAR', damageLevel: 'Daño fuerte (+ 25%)', replacementDecision: 'Debe reemplazarse', action: 'Reemplazar', partPrice: '360000' }),
        ],
        partsQuotedDate: '2026-03-22',
        partsProvider: 'SEPRIO Automotores',
        estimatedWorkDays: '5',
        minimumLaborClose: '1250000',
      }),
      todoRisk: createTodoRiskDefaults({
        insurance: {
          company: 'La Segunda',
          handlerName: 'Vergallo, Osvaldo',
          handlerEmail: 'overgallo@lasegunda.com',
          handlerPhone: '3415205421',
          inspectorName: 'Caballero, Fernando',
          inspectorEmail: 'fcaballero@lasegunda.com',
          inspectorPhone: '3415401254',
          coverageDetail: 'Cobertura para luneta y equipo de GNC hasta $500 mil',
        },
        incident: {
          date: '2025-07-24',
          location: 'Mitre 400, Rosario',
          time: '15:30',
          dynamics: 'Impacto trasero en semáforo; el tercero reconoce responsabilidad y se activa recupero.',
        },
        franchise: {
          status: 'Pendiente',
          amount: '500000',
          recoveryType: 'Cía. del 3ero',
          associatedCase: '003FC',
          dictamen: '',
          exceedsFranchise: 'SI',
          recoveryAmount: '',
          notes: 'Esperando aceptación final del recupero por la aseguradora del tercero.',
        },
        documentation: {
          items: [
            createTodoRiskDocument({ category: 'Personal', name: 'Licencia conducir frente', uploadedAt: '2025-06-10', notes: 'Vencida el 09/05/25' }),
            createTodoRiskDocument({ category: 'Personal', name: 'Licencia conducir dorso', uploadedAt: '2025-06-10', notes: '' }),
            createTodoRiskDocument({ category: 'Seguro', name: 'Denuncia administrativa', uploadedAt: '2025-06-17', notes: '' }),
          ],
        },
        processing: {
          presentedDate: '2025-09-14',
          derivedToInspectionDate: '2025-09-20',
          modality: 'Presencial',
          quoteStatus: 'Acordada',
          quoteDate: '2025-10-15',
          agreedAmount: '1400000',
          agenda: [
            createTodoRiskTask({ title: 'El cliente debe definir si acepta repuestos alternativos.', scheduledAt: '2025-10-13', assignee: 'Melina Z', resolved: true }),
            createTodoRiskTask({ title: 'Último ofrecimiento de $1.300.000; definir si se acepta.', scheduledAt: '2025-10-14', assignee: 'Pablo Z', resolved: true }),
          ],
        },
      }),
      repair: {
        parts: [
          createRepairPart({ name: 'Faro trasero derecho', provider: 'La Casa del Repuesto', amount: '50000', state: 'Pendiente', purchaseBy: 'Taller', paymentStatus: 'Pendiente', source: 'budget', authorized: 'SI' }),
          createRepairPart({ name: 'Luz de patente', provider: 'Grillo', amount: '20000', state: 'Devuelto', purchaseBy: 'Taller', paymentStatus: 'Cancelado', source: 'budget', authorized: 'SI' }),
          createRepairPart({ name: 'Paragolpe trasero', provider: 'Marseille', amount: '360000', state: 'Recibido', purchaseBy: 'Cliente', paymentStatus: 'Cancelado', source: 'budget', authorized: 'NO' }),
        ],
        turno: {
          date: '',
          estimatedDays: '5',
          state: 'Pendiente programar',
          notes: '',
        },
        ingreso: {
          realDate: '',
          hasObservation: 'NO',
          observation: '',
          items: [],
        },
        egreso: {
          date: '',
          notes: '',
          shouldReenter: 'NO',
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
        invoice: 'SI',
        businessName: 'Talleres Zapata SRL',
        invoiceNumber: '0002-0002541',
        invoices: [createTodoRiskInvoice({ invoiceNumber: '0002-0002541', amount: '900000', issuedAt: '2025-11-20', notes: 'Factura principal aseguradora' })],
        signedAgreementDate: '2025-11-01',
        passedToPaymentsDate: '2025-11-20',
        estimatedPaymentDate: '2025-11-20',
        paymentDate: '2025-11-22',
        depositedAmount: '850000',
        hasRetentions: 'SI',
        retentions: {
          iva: '50000',
          gains: '30000',
          employerContribution: '20000',
          iibb: '25000',
          drei: '25000',
          other: '0',
        },
      },
    },
    {
      id: crypto.randomUUID(),
      code: '0005RZ',
      counter: 5,
      tramiteType: 'Reclamo de Tercero - Taller',
      claimNumber: '26-4512154',
      branch: 'Zapata',
      createdAt: '2026-03-24',
      folderCreated: true,
      customer: {
        firstName: 'María',
        lastName: 'Vargas',
        phone: '3413505050',
        document: '20254125',
        birthDate: '1979-05-21',
        locality: 'Rosario',
        email: 'mvargas@email.com',
        street: 'Bv. Oroño',
        streetNumber: '1054',
        addressExtra: 'P 4 D B',
        occupation: 'Jubilada',
        civilStatus: 'Casado/a',
        referenced: 'NO',
        referencedName: '',
      },
      vehicle: {
        brand: 'Toyota',
        model: 'Etios',
        plate: 'AD259HG',
        type: 'Sedan',
        usage: 'Particular',
        paint: 'Bicapa',
        year: '2021',
        color: 'Gris plata',
        chassis: 'TOYETIOSAD259HG',
        engine: '2NR1234567',
        transmission: 'Manual',
        mileage: '68210',
        observations: 'Cliente maneja la carpeta pero el titular registral es un familiar.',
      },
      vehicleMedia: [],
      budget: createBudgetDefaults({
        workshop: 'Taller Zapata',
        reportStatus: 'Informe cerrado',
        authorizer: 'PABLO ZAPATA',
        laborWithoutVat: 1100000,
        generated: true,
        lines: [
          createBudgetLine({ id: 'third-party-line-door', piece: 'Puerta delantera derecha', task: 'REEMPLAZAR Y PINTAR', damageLevel: 'Daño fuerte (+ 25%)', replacementDecision: 'Debe reemplazarse', action: 'Reemplazar', partPrice: '540000' }),
          createBudgetLine({ id: 'third-party-line-fender', piece: 'Guardabarro delantero derecho', task: 'REEMPLAZAR Y PINTAR', damageLevel: 'Daño medio (8 a 25%)', replacementDecision: 'Debe reemplazarse', action: 'Reemplazar', partPrice: '320000' }),
          createBudgetLine({ piece: 'Paragolpe delantero', task: 'REPARAR Y PINTAR', damageLevel: 'Daño fuerte (+ 25%)', replacementDecision: '', action: 'Reparar', partPrice: '' }),
        ],
        partsQuotedDate: '2026-03-24',
        partsProvider: 'Grillo',
        estimatedWorkDays: '4',
        minimumLaborClose: '900000',
        accessoryWorkEnabled: 'SI',
        accessoryWorks: [createAccessoryWork({ id: 'third-party-accessory-moulding', detail: 'Trabajo extra de moldura lateral', amount: '180000', includesReplacement: 'SI', replacementPiece: 'Moldura puerta delantera derecha', replacementAmount: '65000' })],
      }),
      thirdParty: createThirdPartyDefaults({
        clientRegistry: {
          isOwner: 'NO',
          ownershipPercentage: '50%',
          owners: [
            createRegistryOwner({ firstName: 'Ricardo', lastName: 'Perez', document: '20254254', birthDate: '1968-04-11', locality: 'Rosario', phone: '3415551020', street: 'Pje. 2154', streetNumber: '2354', occupation: 'Comerciante', civilStatus: 'Casado/a' }),
            createRegistryOwner({ firstName: 'Juan', lastName: 'Perez', document: '40215214', birthDate: '1988-06-10', locality: 'Rosario', phone: '3415551021', street: 'Pje. 2154', streetNumber: '2354', occupation: 'Empleado', civilStatus: 'Casado/a' }),
          ],
        },
        claim: {
          presentedDate: '2026-03-25',
          claimReference: 'AB2154JB',
          thirdCompany: 'San Cristóbal',
          documentationStatus: 'Incompleta',
          documents: [
            createTodoRiskDocument({ category: 'Personal', name: 'Licencia conducir frente', uploadedAt: '2026-03-24', notes: 'Falta cédula verde' }),
            createTodoRiskDocument({ category: 'Seguro', name: 'Denuncia administrativa', uploadedAt: '2026-03-25', notes: '' }),
          ],
          partsProviderMode: 'Provee Taller',
          thirdParties: [
            createThirdPartyParticipant({
              driverName: 'Patricia Acevedo',
              driverDocument: '25124215',
              driverPhone: '3415401254',
              plate: 'AD845AS',
              brand: 'Fiat',
              model: 'Punto 1.4 Active',
              address: 'Pje. 2154 N° 2354, Rosario',
              isOwner: 'NO',
              ownershipPercentage: '100%',
              owners: [createRegistryOwner({ firstName: 'Ricardo', lastName: 'Perez', document: '20254254', locality: 'Rosario', street: 'Pje. 2154', streetNumber: '2354' }), createRegistryOwner()],
            }),
          ],
        },
        payments: {
          clientPayments: [createSettlement({ kind: 'Parcial', amount: '90000', date: '2026-03-26', mode: 'Efectivo' })],
        },
      }),
      repair: {
        quoteRows: [
          createRepairQuoteRow({ piece: 'Puerta delantera derecha', provider1: '540000', provider2: '680000', provider3: '450000', provider4: '0', billing: 'A', paymentMethod: 'Tarjeta 1 pago', source: 'budget', sourceLineId: 'third-party-line-door' }),
          createRepairQuoteRow({ piece: 'Guardabarro delantero derecho', provider1: '300500', provider2: '400200', provider3: '290000', provider4: '0', billing: 'C', paymentMethod: 'Contado', source: 'budget', sourceLineId: 'third-party-line-fender' }),
          createRepairQuoteRow({ piece: 'Moldura puerta delantera derecha', provider1: '40000', provider2: '0', provider3: '75000', provider4: '67000', billing: 'Sin F', paymentMethod: 'Tarjetas cuotas', source: 'budget', sourceLineId: 'third-party-accessory-moulding' }),
        ],
        parts: [
          createRepairPart({ name: 'Puerta delantera derecha', provider: 'Grillo', amount: '540000', state: 'Pendiente', purchaseBy: 'Taller', paymentStatus: 'Pendiente', source: 'budget', sourceLineId: 'third-party-line-door', receivedDate: '', partCode: 'PTA-001' }),
          createRepairPart({ name: 'Guardabarro delantero derecho', provider: 'Rosario Renault', amount: '290000', state: 'Encargado', purchaseBy: 'Taller', paymentStatus: 'Pendiente', source: 'budget', sourceLineId: 'third-party-line-fender', receivedDate: '', partCode: 'GB-002' }),
          createRepairPart({ name: 'Moldura puerta delantera derecha', provider: 'Mercado Libre', amount: '67000', state: 'Recibido', purchaseBy: 'Taller', paymentStatus: 'Cancelado', source: 'manual', receivedDate: '2026-03-26', partCode: 'ML-003' }),
        ],
        turno: {
          date: '',
          estimatedDays: '4',
          state: 'Pendiente programar',
          notes: 'Espera completar documentación y confirmar pago de extras.',
        },
        ingreso: {
          realDate: '',
          hasObservation: 'NO',
          observation: '',
          items: [],
        },
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
        invoice: 'SI',
        businessName: 'Talleres Zapata SRL',
        invoiceNumber: '0002-0002788',
        invoices: [createTodoRiskInvoice({ invoiceNumber: '0002-0002788', amount: '3000000', issuedAt: '2026-03-25', notes: 'Factura principal a compañía' })],
        signedAgreementDate: '2026-03-25',
        passedToPaymentsDate: '2026-03-26',
        estimatedPaymentDate: '2026-04-01',
        paymentDate: '',
        depositedAmount: '',
        hasRetentions: 'NO',
        retentions: { iva: '', gains: '', employerContribution: '', iibb: '', drei: '', other: '' },
      },
    },
    {
      id: crypto.randomUUID(),
      code: '006RAZ',
      counter: 6,
      tramiteType: 'Reclamo de Tercero - Abogado',
      claimNumber: '26-4512154',
      branch: 'Zapata',
      createdAt: '2026-03-27',
      folderCreated: true,
      customer: {
        firstName: 'Mabel Rita',
        lastName: 'Rosas',
        phone: '3416102244',
        document: '20254876',
        birthDate: '1978-10-11',
        locality: 'Rosario',
        email: 'mabel.rosas@email.com',
        street: 'Bv. Oroño',
        streetNumber: '541',
        addressExtra: '',
        occupation: 'Comerciante',
        civilStatus: 'Casado/a',
        referenced: 'NO',
        referencedName: '',
      },
      vehicle: {
        brand: 'Chevrolet',
        model: 'Classic',
        plate: 'FRD587',
        type: 'Sedan',
        usage: 'Particular',
        paint: 'Bicapa',
        year: '2017',
        color: 'Gris oscuro',
        chassis: 'CHCLASFRD587',
        engine: 'CLA587MOTOR',
        transmission: 'Manual',
        mileage: '96420',
        observations: 'Caso seguido por abogado. La carpeta legal se abrió luego de fracasar la instancia administrativa.',
      },
      vehicleMedia: [],
      budget: createBudgetDefaults({
        workshop: 'Taller Zapata',
        reportStatus: 'Informe cerrado',
        authorizer: 'PABLO ZAPATA',
        laborWithoutVat: 980000,
        generated: true,
        lines: [
          createBudgetLine({ piece: 'Guardabarro delantero derecho', task: 'REEMPLAZAR Y PINTAR', damageLevel: 'Daño fuerte (+ 25%)', replacementDecision: 'Debe reemplazarse', action: 'Reemplazar', partPrice: '250000' }),
          createBudgetLine({ piece: 'Paragolpe delantero', task: 'REEMPLAZAR Y PINTAR', damageLevel: 'Daño fuerte (+ 25%)', replacementDecision: 'Debe reemplazarse', action: 'Reemplazar', partPrice: '650000' }),
          createBudgetLine({ piece: 'Óptica delantera derecha', task: 'REEMPLAZAR', damageLevel: 'Daño medio (8 a 25%)', replacementDecision: 'A verificar', action: 'Reemplazar', partPrice: '450000' }),
        ],
        services: [
          createBudgetService('Estiraje en bancada', { status: 'SI', detail: 'parte delantera' }),
          createBudgetService('Alineación', { status: 'NO' }),
          createBudgetService('Balanceo', { status: 'NO' }),
          createBudgetService('Recambio cristales', { status: 'NO' }),
          createBudgetService('Trabajos sobre sist. eléctrico', { status: 'NO' }),
          createBudgetService('Trabajos de mecánicas', { status: 'A/V' }),
        ],
        partsQuotedDate: '2026-03-27',
        partsProvider: 'Casa de Repuestos Fiat',
        estimatedWorkDays: '4',
        minimumLaborClose: '900000',
        accessoryWorkEnabled: 'SI',
        accessoryWorks: [createAccessoryWork({ detail: 'Trabajo extra de moldura lateral', amount: '180000', includesReplacement: 'SI', replacementPiece: 'Moldura puerta delantera derecha', replacementAmount: '65000' })],
      }),
      todoRisk: createTodoRiskDefaults({
        incident: {
          date: '2025-07-24',
          location: 'Mitre 400, Rosario',
          time: '15:30',
          dynamics: 'Impacto delantero con responsabilidad del tercero. En administrativa no se acordó el monto de reparación y se judicializó.',
          observations: 'Se conserva la base de daños del flujo taller.',
        },
        processing: {
          agenda: [],
        },
      }),
      thirdParty: createThirdPartyDefaults({
        clientRegistry: {
          isOwner: 'SI',
          ownershipPercentage: '100%',
        },
        claim: {
          presentedDate: '2025-09-14',
          claimReference: 'AB2154JB',
          thirdCompany: 'La Segunda',
          documentationStatus: 'Completa',
          documents: [
            createTodoRiskDocument({ category: 'Personal', name: 'Licencia conducir frente', uploadedAt: '2025-06-10', notes: 'Vencida al 09/05/25' }),
            createTodoRiskDocument({ category: 'Seguro', name: 'Denuncia administrativa', uploadedAt: '2025-06-17', notes: '' }),
          ],
          partsProviderMode: 'Provee Taller',
          thirdParties: [
            createThirdPartyParticipant({
              driverName: 'Patricia Acevedo',
              driverDocument: '25124215',
              driverPhone: '3415401254',
              plate: 'AD845AS',
              brand: 'Fiat',
              model: 'Punto 1.4 Active',
              address: 'Pje. 2154 N° 2354, Rosario',
              isOwner: 'NO',
              ownershipPercentage: '100%',
              owners: [createRegistryOwner({ firstName: 'Ricardo', lastName: 'Perez', document: '20254254', locality: 'Rosario', street: 'Pje. 2154', streetNumber: '2354' }), createRegistryOwner()],
            }),
          ],
        },
        payments: {
          clientPayments: [createSettlement({ kind: 'Parcial', amount: '90000', date: '2026-03-28', mode: 'Transferencia' })],
        },
      }),
      lawyer: createLawyerDefaults({
        repairVehicle: 'SI',
        tramita: 'Con Poder',
        reclama: 'Daño material y lesiones',
        instance: 'Judicial',
        entryDate: '2025-08-25',
        cuij: '21-25412541-5',
        court: 'Juzg. Unip. 6ta',
        autos: 'Rosas, Mabel y otros c/ Pérez, José',
        opponentLawyer: 'Dr. Juan Alberto Perillán',
        opponentPhone: '3415487516',
        opponentEmail: 'perillanlegaes@gmail.com',
        observations: 'El reclamo se había presentado en instancia administrativa, pero al no acordar el monto de reparación se avanzó a judicial.',
        expedienteDocuments: [
          createTodoRiskDocument({ category: 'Escrito', name: 'Demanda presentada', uploadedAt: '2025-08-25', notes: '' }),
          createTodoRiskDocument({ category: 'Prueba', name: 'Presupuesto reparaciones', uploadedAt: '2025-09-02', notes: 'Integra demanda y liquidación' }),
        ],
        statusUpdates: [
          createLawyerStatusUpdate({ detail: 'Documentación completa, pendiente de preparar demanda y presentar.', date: '2025-08-25', notifyClient: false }),
          createLawyerStatusUpdate({ detail: 'Demanda presentada, con juzgado asignado. Pendiente de aceptación.', date: '2025-08-25', notifyClient: true }),
          createLawyerStatusUpdate({ detail: 'Aseguradora del 3ero acata citación en garantía, pendiente de contestar demanda.', date: '2025-10-15', notifyClient: true }),
        ],
        agenda: [
          createTodoRiskTask({ title: 'El cliente debe definir si acepta repuestos alternativos.', scheduledAt: '2025-10-13', assignee: 'Melina Z', resolved: false }),
          createTodoRiskTask({ title: 'Último ofrecimiento $1.300.000. Definir si se acepta.', scheduledAt: '2025-10-14', assignee: 'Pablo Z', resolved: false }),
        ],
        injuredParties: [
          createLawyerInjured({ injuredRole: 'otro', firstName: 'Juan Carlos', lastName: 'Federson', document: '21548054', birthDate: '1981-05-21', address: 'Bv. Oroño 541', civilStatus: 'Casado/a', phone: '35405112544', email: 'jfhfhjf@gmail.com', profession: 'odontólogo', accreditsIncome: 'SI', notes: 'Trabaja en relación de dependencia.' }),
        ],
        closure: {
          expenses: [
            createLawyerExpense({ concept: 'Sellado por certificación de firma - DDJJ art. 333', amount: '10000', date: '2025-08-15', paidBy: 'CLIENTE' }),
            createLawyerExpense({ concept: 'BUIJ - iniciación de juicio', amount: '10000', date: '2025-08-20', paidBy: 'ABOGADO' }),
            createLawyerExpense({ concept: 'Honorarios perito médico', amount: '60000', date: '2025-10-28', paidBy: 'ABOGADO' }),
          ],
          closeBy: 'conciliación',
          closeDate: '2026-03-27',
          totalAmount: '12541215',
          items: [
            createLawyerClosureItem({ concept: 'Daño material', amount: '2450580', paymentDate: '2025-09-15', sumWorkshop: 'SI', paidDate: '2025-09-16' }),
            createLawyerClosureItem({ concept: 'Lesiones Pedrozo, José', amount: '6541058', paymentDate: '2025-09-15', sumWorkshop: 'NO', paidDate: '2025-09-16' }),
            createLawyerClosureItem({ concept: 'Costas varias', amount: '235005', paymentDate: '2025-09-20', sumWorkshop: 'SI', paidDate: '2025-09-20' }),
            createLawyerClosureItem({ concept: 'Honorarios abogado', amount: '100000', paymentDate: '2025-09-20', sumWorkshop: 'NO', paidDate: '2025-09-20' }),
          ],
          notes: 'Cierre demo judicial con separación entre sumas que ingresan al taller y rubros propios del expediente.',
        },
      }),
      repair: {
        quoteRows: [
          createRepairQuoteRow({ piece: 'Guardabarro delantero derecho', provider1: '250000', provider2: '280000', provider3: '265000', provider4: '0', billing: 'A', paymentMethod: 'Contado', source: 'budget', sourceLineId: 'lawyer-line-1' }),
        ],
        parts: [
          createRepairPart({ name: 'Guardabarro delantero derecho', provider: 'Casa Central', amount: '250000', state: 'Pedido', purchaseBy: 'Taller', paymentStatus: 'Pendiente', source: 'budget', receivedDate: '', partCode: 'AB-001' }),
        ],
        turno: {
          date: '2026-04-02',
          estimatedDays: '4',
          state: 'A confirmar cliente',
          notes: 'Esperando definición final del cliente y del abogado sobre la conciliación.',
        },
        ingreso: {
          realDate: '',
          hasObservation: 'NO',
          observation: '',
          items: [],
        },
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
        invoice: 'SI',
        businessName: 'Talleres Zapata SRL',
        invoiceNumber: '0002-0002991',
        invoices: [createTodoRiskInvoice({ invoiceNumber: '0002-0002991', amount: '12541215', issuedAt: '2026-03-27', notes: 'Convenio judicial demo' })],
        signedAgreementDate: '2026-03-27',
        passedToPaymentsDate: '2026-03-27',
        estimatedPaymentDate: '2026-04-03',
        paymentDate: '',
        depositedAmount: '',
        manualTotalAmount: '12541215',
        hasRetentions: 'SI',
        retentions: { iva: '0', gains: '0', employerContribution: '0', iibb: '0', drei: '0', other: '0' },
      },
    },
    {
      id: crypto.randomUUID(),
      code: '0008CZ',
      counter: 8,
      tramiteType: 'CLEAS / Terceros / Franquicia',
      claimNumber: '5-7845123',
      branch: 'Zapata',
      createdAt: '2026-03-29',
      folderCreated: true,
      customer: {
        firstName: 'Sofía',
        lastName: 'Benítez',
        phone: '3415127788',
        document: '28994411',
        birthDate: '1987-08-19',
        locality: 'Rosario',
        email: 'sbenitez@email.com',
        street: 'Italia',
        streetNumber: '1842',
        addressExtra: 'Dto. 3',
        occupation: 'Administrativa',
        civilStatus: 'Soltero/a',
        referenced: 'NO',
        referencedName: '',
      },
      vehicle: {
        brand: 'Ford',
        model: 'Ka SE',
        plate: 'AE472LM',
        type: 'Hatch',
        usage: 'Particular',
        paint: 'Bicapa',
        year: '2021',
        color: 'Azul eléctrico',
        chassis: 'FORDKAAE472LM21',
        engine: 'SIGMA472LM',
        transmission: 'Manual',
        mileage: '61240',
        observations: 'Caso CLEAS sobre franquicia con dictamen en contra y pago mixto entre compañía y cliente.',
      },
      vehicleMedia: [
        createMediaItem({
          label: 'Lateral derecho',
          description: 'Golpe sobre puerta trasera y guardabarro derecho.',
          url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1280&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=400&q=60',
        }),
        createMediaItem({
          label: 'Detalle guardabarro',
          description: 'Marca de roce y deformación leve en el borde del pasarueda.',
          url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1280&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=60',
        }),
      ],
      budget: createBudgetDefaults({
        workshop: 'Taller Zapata',
        reportStatus: 'Informe cerrado',
        authorizer: 'MELINA ZAPATA',
        laborWithoutVat: 840000,
        generated: true,
        lines: [
          createBudgetLine({ piece: 'Puerta trasera derecha', task: 'REPARAR Y PINTAR', damageLevel: 'Daño medio (8 a 25%)', replacementDecision: '', action: 'Reparar', partPrice: '0' }),
          createBudgetLine({ piece: 'Guardabarro trasero derecho', task: 'REEMPLAZAR Y PINTAR', damageLevel: 'Daño fuerte (+ 25%)', replacementDecision: 'Debe reemplazarse', action: 'Reemplazar', partPrice: '280000' }),
          createBudgetLine({ piece: 'Moldura lateral derecha', task: 'REEMPLAZAR', damageLevel: 'Daño leve (0 a 8%)', replacementDecision: 'Debe reemplazarse', action: 'Reemplazar', partPrice: '140000' }),
        ],
        services: [
          createBudgetService('Estiraje en bancada', { status: 'NO' }),
          createBudgetService('Alineación', { status: 'SI', detail: 'control final de tren trasero' }),
          createBudgetService('Balanceo', { status: 'NO' }),
          createBudgetService('Recambio cristales', { status: 'NO' }),
          createBudgetService('Trabajos sobre sist. eléctrico', { status: 'NO' }),
          createBudgetService('Trabajos de mecánicas', { status: 'A/V', detail: 'revisar sensor de rueda trasera' }),
        ],
        partsQuotedDate: '2026-02-10',
        partsProvider: 'Autopartes Rosario',
        estimatedWorkDays: '5',
        minimumLaborClose: '780000',
        observations: 'Caso demo CLEAS completo para ver franquicia, dictamen y pago mixto.',
      }),
      todoRisk: createTodoRiskDefaults({
        insurance: {
          company: 'Federación Patronal',
          thirdCompany: 'La Segunda',
          cleasNumber: 'CLEAS-260081',
          handlerName: 'Lorena Mansilla',
          handlerEmail: 'lmansilla@fedpat.com.ar',
          handlerPhone: '3415521188',
          inspectorName: 'Mariano Del Río',
          inspectorEmail: 'mdelrio@fedpat.com.ar',
          inspectorPhone: '3415214400',
          coverageDetail: 'Cobertura terceros completo con franquicia fija y canal CLEAS activo.',
        },
        incident: {
          date: '2026-02-03',
          location: 'Pellegrini y España, Rosario',
          time: '18:40',
          dynamics: 'Colisión lateral en cruce semaforizado; el tercero impacta sobre el lateral derecho del asegurado.',
          thirdPartyPlate: 'AG845PL',
          observations: 'Se deriva por CLEAS y la compañía define dictamen en contra sobre franquicia.',
        },
        franchise: {
          status: 'Liquidada',
          amount: '500000',
          recoveryType: 'CLEAS',
          associatedCase: '0004TZ',
          dictamen: 'En contra',
          exceedsFranchise: 'SI',
          recoveryAmount: '1040000',
          notes: 'Caso demo con tramo cliente cancelado y diferencia facturada a compañía.',
        },
        documentation: {
          items: [
            createTodoRiskDocument({ category: 'Personal', name: 'Licencia conducir frente', uploadedAt: '2026-02-04', notes: '' }),
            createTodoRiskDocument({ category: 'Vehículo', name: 'Cédula verde', uploadedAt: '2026-02-04', notes: '' }),
            createTodoRiskDocument({ category: 'Seguro', name: 'Denuncia administrativa', uploadedAt: '2026-02-05', notes: 'Ingresada por portal CLEAS' }),
            createTodoRiskDocument({ category: 'Seguro', name: 'Fotos del daño', uploadedAt: '2026-02-05', notes: 'Adjuntas a la presentación inicial' }),
          ],
        },
        processing: {
          presentedDate: '2026-02-05',
          derivedToInspectionDate: '2026-02-08',
          modality: 'Digital',
          quoteStatus: 'Acordada',
          quoteDate: '2026-02-12',
          agreedAmount: '1260000',
          cleasScope: 'Sobre franquicia',
          dictamen: 'En contra',
          franchiseAmount: '500000',
          clientChargeAmount: '220000',
          clientChargeStatus: 'Cancelado',
          clientChargeDate: '2026-02-20',
          companyFranchisePaymentAmount: '280000',
          companyFranchisePaymentStatus: 'Cancelado',
          companyFranchisePaymentDate: '2026-02-26',
          agenda: [
            createTodoRiskTask({ title: 'Confirmar monto a cargo del cliente por franquicia.', scheduledAt: '2026-02-13', assignee: 'Romina G', resolved: true, status: 'resuelta', relatedTab: 'tramite', resolvedAt: '2026-02-14' }),
            createTodoRiskTask({ title: 'Enviar factura final a Federación Patronal.', scheduledAt: '2026-02-24', assignee: 'Melina Z', resolved: true, status: 'resuelta', relatedTab: 'pagos', resolvedAt: '2026-02-24' }),
          ],
        },
      }),
      repair: {
        parts: [
          createRepairPart({ name: 'Guardabarro trasero derecho', provider: 'Autopartes Rosario', amount: '280000', state: 'Recibido', purchaseBy: 'Taller', paymentStatus: 'Cancelado', source: 'budget', authorized: 'SI', receivedDate: '2026-02-15', partCode: 'CL-001' }),
          createRepairPart({ name: 'Moldura lateral derecha', provider: 'Autopartes Rosario', amount: '140000', state: 'Recibido', purchaseBy: 'Taller', paymentStatus: 'Cancelado', source: 'budget', authorized: 'SI', receivedDate: '2026-02-15', partCode: 'CL-002' }),
        ],
        turno: {
          date: '2026-02-17',
          estimatedDays: '5',
          state: 'Confirmado',
          notes: 'Cliente entrega la unidad luego de acreditar el tramo propio de franquicia.',
        },
        ingreso: {
          realDate: '2026-02-17',
          hasObservation: 'SI',
          observation: 'Se deja asentado roce previo en llanta trasera derecha.',
          items: [
            createIngresoItem({ type: 'Carrocería', detail: 'Golpe lateral derecho con pliegue en guardabarro', media: 'Ingreso CLEAS 01' }),
            createIngresoItem({ type: 'Accesorios', detail: 'Moldura lateral quebrada', media: 'Ingreso CLEAS 02' }),
          ],
        },
        egreso: {
          date: '2026-02-24',
          notes: 'Entrega conforme y sin necesidad de reingreso.',
          shouldReenter: 'NO',
          reentryDate: '',
          reentryEstimatedDays: '',
          reentryState: 'Pendiente',
          reentryNotes: '',
          definitiveExit: true,
          repairedPhotos: true,
          repairedMedia: [
            createMediaItem({
              label: 'Egreso CLEAS lateral reparado',
              description: 'Vista general luego de pintura y montaje final.',
              url: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1280&q=80',
              thumbnail: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=400&q=60',
            }),
          ],
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
        invoice: 'SI',
        businessName: 'Talleres Zapata SRL',
        invoiceNumber: '0002-0003015',
        invoices: [createTodoRiskInvoice({ invoiceNumber: '0002-0003015', amount: '1040000', issuedAt: '2026-02-24', notes: 'Factura CLEAS sobre franquicia' })],
        signedAgreementDate: '2026-02-18',
        passedToPaymentsDate: '2026-02-24',
        estimatedPaymentDate: '2026-02-26',
        paymentDate: '2026-02-26',
        depositedAmount: '1040000',
        manualTotalAmount: '',
        hasRetentions: 'SI',
        retentions: { iva: '18000', gains: '12000', employerContribution: '0', iibb: '0', drei: '0', other: '0' },
      },
    },
    {
      id: crypto.randomUUID(),
      code: '0007FZ',
      counter: 7,
      tramiteType: FRANCHISE_RECOVERY_TRAMITE,
      claimNumber: '4-2541587',
      branch: 'Zapata',
      createdAt: '2026-03-28',
      folderCreated: true,
      customer: {
        firstName: 'Juan',
        lastName: 'Sánchez',
        phone: '3413505050',
        document: '16325547',
        birthDate: '1979-05-21',
        locality: 'Rosario',
        email: 'perezjuan@gmail.com',
        street: 'Bv. Oroño',
        streetNumber: '1054',
        addressExtra: 'P 4 D B',
        occupation: 'Jubilado',
        civilStatus: 'Casado/a',
        referenced: 'NO',
        referencedName: '',
      },
      vehicle: {
        brand: 'Volkswagen',
        model: 'Gol',
        plate: 'AB412DE',
        type: 'Sedan',
        usage: 'Particular',
        paint: 'Bicapa',
        year: '2019',
        color: 'Negro',
        chassis: 'VWGOLAB412DE99',
        engine: 'EA111AB412DE',
        transmission: 'Manual',
        mileage: '87500',
        observations: 'Recupero de franquicia asociado a Todo Riesgo ya liquidado, sin reparación activa y con saldo cliente documentado.',
      },
      vehicleMedia: [
        createMediaItem({
          label: 'Unidad asociada',
          description: 'Mismo vehículo vinculado al expediente de Todo Riesgo 0004TZ.',
          url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1280&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=400&q=60',
        }),
      ],
      franchiseRecovery: createFranchiseRecoveryDefaults({
        managerType: 'Taller',
        associatedCaseId: 'todo-risk-linked-demo',
        associatedFolderCode: '0004TZ',
        dictamen: 'A favor',
        agreementAmount: '500000',
        amountToRecover: '500000',
        enablesRepair: 'NO',
        recoverToClient: 'SI',
        clientResponsibilityAmount: '150000',
        clientRecoveryStatus: 'Cancelado',
        clientRecoveryDate: '2026-03-29',
        approvalNote: 'Se documenta diferencia a cargo del cliente por tramo no reconocido en la liquidación original.',
      }),
      budget: createBudgetDefaults({
        workshop: 'Taller Zapata',
        reportStatus: 'Informe cerrado',
        authorizer: 'PABLO ZAPATA',
        laborWithoutVat: 0,
        generated: true,
        lines: [createBudgetLine({ piece: 'Paragolpe trasero', task: '', damageLevel: '', replacementDecision: '', action: '', partPrice: '' })],
        estimatedWorkDays: '',
        minimumLaborClose: '900000',
        observations: 'Recupero sin reparación: se conserva presupuesto solo como referencia del expediente base.',
      }),
      repair: {
        parts: [],
        turno: {
          date: '',
          estimatedDays: '',
          state: 'Pendiente programar',
          notes: 'Sin turno: el recupero se tramita solo por liquidación económica.',
        },
        ingreso: {
          realDate: '',
          hasObservation: 'NO',
          observation: '',
          items: [],
        },
        egreso: {
          date: '',
          notes: '',
          shouldReenter: 'NO',
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
        invoice: 'SI',
        businessName: 'Talleres Zapata SRL',
        invoiceNumber: '0002-0003044',
        invoices: [createTodoRiskInvoice({ invoiceNumber: '0002-0003044', amount: '500000', issuedAt: '2026-03-28', notes: 'Recupero de franquicia asociado a carpeta 0004TZ' })],
        signedAgreementDate: '2026-03-27',
        passedToPaymentsDate: '2026-03-28',
        estimatedPaymentDate: '2026-03-31',
        paymentDate: '2026-03-31',
        depositedAmount: '500000',
        manualTotalAmount: '500000',
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
    },
  ];
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

function formatDate(date) {
  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('es-AR').format(new Date(`${date}T12:00:00`));
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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
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

function normalizeAgendaTask(task = {}, fallback = {}) {
  const rawStatus = String(task.status || '').toLowerCase();
  const resolved = rawStatus === 'resuelta' || Boolean(task.resolved);
  const status = resolved ? 'resuelta' : rawStatus === 'en curso' ? 'en curso' : 'pendiente';

  return {
    ...task,
    description: task.description || '',
    scheduledAt: task.scheduledAt || '',
    assignee: task.assignee || TODO_RIESGO_ASSIGNABLE_USERS[0],
    priority: TASK_PRIORITY_OPTIONS.includes(task.priority) ? task.priority : 'media',
    status,
    resolved,
    sourceArea: task.sourceArea || fallback.sourceArea || 'Gestión del trámite',
    sourceLabel: task.sourceLabel || fallback.sourceLabel || task.sourceArea || fallback.sourceArea || 'Gestión del trámite',
    relatedTab: task.relatedTab || fallback.relatedTab || 'tramite',
    relatedSubtab: task.relatedSubtab || fallback.relatedSubtab || '',
    linkedCaseId: task.linkedCaseId || fallback.linkedCaseId || '',
    linkedCaseCode: task.linkedCaseCode || fallback.linkedCaseCode || '',
    createdAt: task.createdAt || fallback.createdAt || '',
    resolvedAt: resolved ? task.resolvedAt || fallback.resolvedAt || '' : '',
  };
}

function isAgendaTaskResolved(task) {
  return normalizeAgendaTask(task).resolved;
}

function setAgendaTaskResolved(task, resolved) {
  const normalized = normalizeAgendaTask(task);
  task.description = normalized.description;
  task.priority = normalized.priority;
  task.sourceArea = normalized.sourceArea;
  task.sourceLabel = normalized.sourceLabel;
  task.relatedTab = normalized.relatedTab;
  task.relatedSubtab = normalized.relatedSubtab;
  task.linkedCaseId = normalized.linkedCaseId;
  task.linkedCaseCode = normalized.linkedCaseCode;
  task.createdAt = normalized.createdAt;
  task.resolved = resolved;
  task.status = resolved ? 'resuelta' : normalized.status === 'resuelta' ? 'pendiente' : normalized.status;
  task.resolvedAt = resolved ? todayIso() : '';
}

function setAgendaTaskStatus(task, status) {
  const normalizedStatus = TASK_STATUS_OPTIONS.includes(status) ? status : 'pendiente';
  task.status = normalizedStatus;
  task.resolved = normalizedStatus === 'resuelta';
  task.resolvedAt = normalizedStatus === 'resuelta' ? (task.resolvedAt || todayIso()) : '';
}

function getAgendaTaskDueMeta(date) {
  if (!date) {
    return { bucket: 'pending', label: 'Sin fecha límite', tone: 'info', sortValue: Number.POSITIVE_INFINITY };
  }

  const today = new Date(`${todayIso()}T12:00:00`);
  const due = new Date(`${date}T12:00:00`);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) {
    return { bucket: 'overdue', label: `Vencida hace ${Math.abs(diffDays)} día(s)`, tone: 'danger', sortValue: diffDays };
  }

  if (diffDays === 0) {
    return { bucket: 'upcoming', label: 'Vence hoy', tone: 'danger', sortValue: diffDays };
  }

  if (diffDays <= 2) {
    return { bucket: 'upcoming', label: `Vence en ${diffDays} día(s)`, tone: 'warning', sortValue: diffDays };
  }

  return { bucket: 'pending', label: `Vence en ${diffDays} día(s)`, tone: 'success', sortValue: diffDays };
}

function getAgendaCollectionDescriptors(item) {
  const collections = [];

  if (item.todoRisk?.processing?.agenda) {
    collections.push({
      key: 'tramite',
      label: 'Gestión del trámite',
      relatedTab: 'tramite',
      relatedSubtab: '',
      tasks: item.todoRisk.processing.agenda,
    });
  }

  if (item.lawyer?.agenda) {
    collections.push({
      key: 'abogado',
      label: 'Abogado',
      relatedTab: 'abogado',
      relatedSubtab: '',
      tasks: item.lawyer.agenda,
    });
  }

  return collections;
}

function getMutableAgendaCollection(item, collectionKey) {
  if (collectionKey === 'abogado') {
    return item.lawyer?.agenda || null;
  }

  if (collectionKey === 'tramite') {
    return item.todoRisk?.processing?.agenda || null;
  }

  return null;
}

function buildAgendaStore(items) {
  return items.flatMap((item) => getAgendaCollectionDescriptors(item).flatMap((collection) => collection.tasks.map((task) => {
    const normalizedTask = normalizeAgendaTask(task, {
      sourceArea: collection.label,
      sourceLabel: collection.label,
      relatedTab: collection.relatedTab,
      relatedSubtab: collection.relatedSubtab,
      linkedCaseId: item.id,
      linkedCaseCode: item.code,
      createdAt: item.createdAt,
    });
    const dueMeta = getAgendaTaskDueMeta(normalizedTask.scheduledAt);
    const resolved = isAgendaTaskResolved(normalizedTask);

    return {
      ...normalizedTask,
      collectionKey: collection.key,
      caseId: item.id,
      caseCode: item.code,
      caseLabel: `${item.code} - ${getFolderDisplayName(item)}`,
      customerName: getFolderDisplayName(item),
      vehicleLabel: `${item.vehicle.brand} ${item.vehicle.model}`,
      tramiteType: item.tramiteType ?? 'Particular',
      dueMeta,
      resolved,
      viewBucket: resolved ? 'resueltas' : dueMeta.bucket === 'overdue' ? 'vencidas' : 'pendientes',
    };
  })));
}

function getAgendaStatusLabel(status) {
  if (status === 'en curso') return 'En curso';
  if (status === 'resuelta') return 'Resuelta';
  return 'Pendiente';
}

function getAgendaPriorityLabel(priority) {
  if (priority === 'alta') return 'Alta';
  if (priority === 'baja') return 'Baja';
  return 'Media';
}

function getAgendaPriorityTone(priority) {
  if (priority === 'alta') return 'danger';
  if (priority === 'baja') return 'success';
  return 'info';
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

function isTodoRiesgoCase(item) {
  return (item.tramiteType ?? 'Particular') === 'Todo Riesgo';
}

function isCleasCase(item) {
  return (item.tramiteType ?? 'Particular') === 'CLEAS / Terceros / Franquicia';
}

function isThirdPartyWorkshopCase(item) {
  return (item.tramiteType ?? 'Particular') === 'Reclamo de Tercero - Taller';
}

function isThirdPartyLawyerCase(item) {
  return (item.tramiteType ?? 'Particular') === 'Reclamo de Tercero - Abogado';
}

function isFranchiseRecoveryCase(item) {
  return (item.tramiteType ?? 'Particular') === FRANCHISE_RECOVERY_TRAMITE;
}

function isThirdPartyClaimCase(item) {
  return isThirdPartyWorkshopCase(item) || isThirdPartyLawyerCase(item);
}

function isInsuranceWorkflowCase(item) {
  return isTodoRiesgoCase(item) || isCleasCase(item) || isThirdPartyClaimCase(item);
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

function hasRegistryOwnerIdentity(owner) {
  return Boolean(owner?.firstName || owner?.lastName || owner?.document);
}

function isThirdPartyDocumentationIncomplete(item) {
  return isThirdPartyClaimCase(item) && item.thirdParty?.claim?.documentationStatus === 'Incompleta';
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

function isJudicialInstance(instance) {
  return instance === 'Judicial';
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
      ? [createIngresoItem({ type: 'Otro', detail: item.repair.ingreso.observation, media: 'Migrado demo' })]
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
          adminAlerts: !amountMeetsMinimum && amountToInvoice > 0 ? [`Aviso demo admin: el importe total ${money(amountToInvoice)} quedó por debajo del mínimo ${money(applicableMinimum)}.`] : [],
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
      adminAlerts.push(`Aviso demo admin: la cotización acordada ${money(amountToInvoice)} quedó por debajo del mínimo ${money(applicableMinimum)}.`);
    }
    const blockers = [];
    if (!item.folderCreated) blockers.push('No hay carpeta generada para iniciar el reclamo de tercero.');
    if (!incidentDate) blockers.push('Falta fecha del siniestro para calcular la prescripción a 3 años.');
    if (!hasThirdParties) blockers.push('Cargá al menos un tercero en Datos del siniestro.');
    if (!hasPrimaryRegistryOwner) blockers.push('Si el cliente no es titular, falta cargar el titular registral principal.');
    if (!documentationComplete) blockers.push('La documentación sigue incompleta y dispara aviso bloqueante al entrar.');
    if (!presentedDate) blockers.push('Falta fecha de presentación básica del trámite.');
    if (!amountMeetsMinimum && amountToInvoice > 0) blockers.push('La cotización acordada quedó por debajo del mínimo correspondiente y requiere aviso al admin.');
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
    if (clientChargeActive && !clientResponsibilityAmount) blockers.push('Definí el tramo demo a cargo del cliente para reflejar el recupero.');
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
    blockers.push(reportClosed ? 'Presupuesto listo pero falta generar el documento final.' : 'Presupuesto incompleto o en rojo: Gestion reparacion permanece bloqueada.');
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

function StatusBadge({ tone, children }) {
  return <span className={`status-badge ${tone}`}>{children}</span>;
}

function TabButton({ active, state, children, onClick }) {
  return (
    <button className={`tab-button is-${state} ${active ? 'is-active' : ''}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function StatusStepper({ label, items, activeValue }) {
  return (
    <div className="status-stepper">
      <span>{label}</span>
      <div className="status-stepper-row">
        {items.map((entry) => (
          <button className={`status-step ${activeValue === entry ? 'is-active' : ''}`} disabled key={entry} type="button">
            {entry}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusActionBar({ label, actions, onSelect }) {
  return (
    <div className="status-stepper">
      <span>{label}</span>
      <div className="status-stepper-row">
        {actions.map((action) => (
          <button
            className={`status-step ${action.active ? 'is-active' : ''}`}
            disabled={action.disabled}
            key={action.label}
            onClick={() => onSelect(action)}
            type="button"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FieldLabel({ label, required = false }) {
  return (
    <span>
      {label}
      {required ? <em className="required-indicator" aria-hidden="true">*</em> : null}
    </span>
  );
}

function DataField({ label, value, onChange, type = 'text', placeholder = '', required = false, invalid = false, readOnly = false, disabled = false, inputMode, highlighted = false }) {
  return (
    <label className={`field ${invalid ? 'is-invalid' : ''} ${highlighted ? 'is-autofilled' : ''}`}>
      <FieldLabel label={label} required={required} />
      <input disabled={disabled} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} readOnly={readOnly} type={type} value={value} />
    </label>
  );
}

function SelectField({ label, value, onChange, options, required = false, invalid = false, highlighted = false, placeholder = '', disabled = false }) {
  const normalizedOptions = options
    .map((option) => (typeof option === 'string' ? { value: option, label: option || '—' } : option))
    .filter((option) => !(placeholder && (option.value ?? option.label) === ''));
  const resolvedValue = value ?? '';

  return (
    <label className={`field ${invalid ? 'is-invalid' : ''} ${highlighted ? 'is-autofilled' : ''}`}>
      <FieldLabel label={label} required={required} />
      <select disabled={disabled} onChange={(event) => onChange(event.target.value)} value={resolvedValue}>
        {placeholder ? (
          <option value="">
            {placeholder}
          </option>
        ) : null}
        {normalizedOptions.map((option) => {
          const optionValue = option.value ?? option.label;
          return (
            <option key={optionValue} value={optionValue}>
              {option.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function ToggleField(props) {
  return <SelectField {...props} options={['', 'SI', 'NO']} />;
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

function getCaseHash(id, target = {}) {
  const resolvedTab = CASE_TABS.includes(target.tab) ? target.tab : '';
  const resolvedRepairTab = resolvedTab === 'gestion' && REPAIR_TABS.includes(target.subtab) ? target.subtab : '';

  return `#/caso/${id}${resolvedTab ? `/${resolvedTab}` : ''}${resolvedRepairTab ? `/${resolvedRepairTab}` : ''}`;
}

function getCaseRouteFromHash(hash) {
  const match = hash.match(/^#\/caso\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?$/);

  return {
    id: match?.[1] ?? '',
    tab: CASE_TABS.includes(match?.[2]) ? match[2] : '',
    subtab: REPAIR_TABS.includes(match?.[3]) ? match[3] : '',
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

function PanelGeneral({
  backendSession,
  currentUserEndpoint,
  currentUserState,
  authenticatedCaseDetailState,
  authenticatedCasesState,
  authenticatedNotificationsState,
  onRefreshCurrentUser,
  onMarkNotificationAsRead,
  onOpenAuthenticatedCaseDetail,
  onRefreshAuthenticatedCases,
  onRefreshAuthenticatedNotifications,
  pendingNotificationIds,
}) {
  return (
    <div className="page-stack">
      <section className="hero-panel compact-hero panel-simple-hero client-overview-hero">
        <div className="stack-tight">
          <p className="eyebrow">Seguimiento</p>
          <h1>Tus carpetas, en un solo lugar</h1>
          <p className="muted client-overview-copy">
            Esta primera vista reúne la información principal de tus casos para que puedas entrar y entender el estado general de tu cuenta al instante.
          </p>
        </div>
      </section>

      <AuthenticatedUserSnapshot
        endpoint={currentUserEndpoint}
        formatDateTime={formatDateTime}
        onRefresh={onRefreshCurrentUser}
        session={backendSession}
        state={currentUserState}
        StatusBadge={StatusBadge}
      />

      <AuthenticatedCasesPreview
        detailState={authenticatedCaseDetailState}
        onOpenDetail={onOpenAuthenticatedCaseDetail}
        onRefresh={onRefreshAuthenticatedCases}
        state={authenticatedCasesState}
      />

      <AuthenticatedNotificationsPreview
        pendingIds={pendingNotificationIds}
        state={authenticatedNotificationsState}
        onMarkAsRead={onMarkNotificationAsRead}
        onOpenCaseDetail={onOpenAuthenticatedCaseDetail}
        onRefresh={onRefreshAuthenticatedNotifications}
      />
    </div>
  );
}

function NuevoCaso({
  form,
  onChange,
  onCreate,
  nextCode,
  missing,
  showValidation,
  customerLookupState,
  vehicleLookupState,
  onSearchDocument,
  onSearchPlate,
  autofilledFields,
}) {
  const fieldHasError = (field) => showValidation && missing.includes(field);
  const fieldWasAutofilled = (field) => autofilledFields.includes(field);
  const customerTone = customerLookupState.status === 'found' ? 'success' : customerLookupState.status === 'empty' ? 'danger' : 'info';
  const vehicleTone = vehicleLookupState.status === 'found' ? 'success' : vehicleLookupState.status === 'empty' ? 'danger' : 'info';

  return (
    <div className="page-stack">
      <section className="hero-panel compact-hero">
        <div className="stack-tight">
          <p className="eyebrow">Nuevo Caso</p>
          <h1>Alta de caso particular</h1>
          <p className="muted">Completá los datos mínimos y generá la carpeta.</p>
        </div>
        <div className="tag-row">
          <StatusBadge tone="info">Carpeta automática</StatusBadge>
          <StatusBadge tone={missing.length ? 'danger' : 'success'}>{nextCode}</StatusBadge>
        </div>
      </section>

      <section className="content-grid single-column">
        <article className="card nuevo-caso-card">
          <div className="section-head nuevo-caso-head">
            <div className="stack-tight nuevo-caso-title-group">
              <p className="eyebrow">Minimos obligatorios</p>
              <h2>Datos para generar carpeta</h2>
            </div>
            <StatusBadge tone={missing.length ? 'danger' : 'success'}>
              {missing.length ? 'Completar datos' : 'Listo para generar'}
            </StatusBadge>
          </div>

          <div className="lookup-grid nuevo-caso-lookups">
            <div className={`lookup-card ${customerLookupState.status === 'found' ? 'is-found' : ''}`}>
              <div className="lookup-head">
                <div className="stack-tight">
                  <p className="eyebrow">Cliente</p>
                  <h3>Buscar por DNI</h3>
                </div>
                {customerLookupState.message ? <StatusBadge tone={customerTone}>{customerLookupState.message}</StatusBadge> : null}
              </div>
              <div className="lookup-form">
                <DataField
                  highlighted={fieldWasAutofilled('document')}
                  label="DNI"
                  onChange={(value) => onChange('document', normalizeDocument(value))}
                  placeholder="Ej: 30111888"
                  value={form.document}
                  inputMode="numeric"
                />
                <button className="secondary-button" onClick={onSearchDocument} type="button">Buscar DNI</button>
              </div>
              {customerLookupState.detail ? <p className="lookup-detail">{customerLookupState.detail}</p> : null}
            </div>

            <div className={`lookup-card ${vehicleLookupState.status === 'found' ? 'is-found' : ''}`}>
              <div className="lookup-head">
                <div className="stack-tight">
                  <p className="eyebrow">Vehículo</p>
                  <h3>Buscar por patente</h3>
                </div>
                {vehicleLookupState.message ? <StatusBadge tone={vehicleTone}>{vehicleLookupState.message}</StatusBadge> : null}
              </div>
              <div className="lookup-form">
                <DataField
                  highlighted={fieldWasAutofilled('plate')}
                  label="Patente"
                  onChange={(value) => onChange('plate', normalizePlate(value))}
                  placeholder="Ej: AA365BE"
                  value={form.plate}
                  invalid={fieldHasError('dominio')}
                />
                <button className="secondary-button" onClick={onSearchPlate} type="button">Buscar patente</button>
              </div>
              {vehicleLookupState.detail ? <p className="lookup-detail">{vehicleLookupState.detail}</p> : null}
            </div>
          </div>

          <div className="auto-code-card nuevo-caso-code-card" role="status" aria-live="polite">
            <span>Identificador de carpeta</span>
            <strong>{nextCode}</strong>
          </div>

          <div className="form-grid three-columns nuevo-caso-form">
            <SelectField invalid={fieldHasError('tipo de tramite')} label="Tipo de tramite" onChange={(value) => onChange('type', value)} options={TRAMITE_TYPES} required value={form.type} />
            <SelectField label="Sucursal" onChange={(value) => onChange('branch', value)} options={BRANCHES.map((branch) => branch.label)} value={form.branch} />
            <DataField label="N° siniestro" onChange={(value) => onChange('claimNumber', value)} value={form.claimNumber} />
            <DataField highlighted={fieldWasAutofilled('firstName')} invalid={fieldHasError('nombre')} label="Nombre" onChange={(value) => onChange('firstName', value)} required value={form.firstName} />
            <DataField highlighted={fieldWasAutofilled('lastName')} invalid={fieldHasError('apellido')} label="Apellido" onChange={(value) => onChange('lastName', value)} required value={form.lastName} />
            <DataField highlighted={fieldWasAutofilled('phone')} label="Telefono" onChange={(value) => onChange('phone', value)} value={form.phone} />
            <DataField highlighted={fieldWasAutofilled('brand')} invalid={fieldHasError('marca')} label="Marca" onChange={(value) => onChange('brand', value)} required value={form.brand} />
            <DataField highlighted={fieldWasAutofilled('model')} invalid={fieldHasError('modelo')} label="Modelo" onChange={(value) => onChange('model', value)} required value={form.model} />
            <SelectField highlighted={fieldWasAutofilled('vehicleType')} label="Tipo vehiculo" onChange={(value) => onChange('vehicleType', value)} options={VEHICLE_TYPES} value={form.vehicleType} />
            <SelectField highlighted={fieldWasAutofilled('vehicleUse')} label="Uso" onChange={(value) => onChange('vehicleUse', value)} options={VEHICLE_USES} value={form.vehicleUse} />
            <SelectField highlighted={fieldWasAutofilled('paint')} label="Pintura" onChange={(value) => onChange('paint', value)} options={PAINT_TYPES} value={form.paint} />
            <ToggleField highlighted={fieldWasAutofilled('referenced')} invalid={fieldHasError('referenciado si/no')} label="Referenciado" onChange={(value) => onChange('referenced', value)} required value={form.referenced} />
            {form.referenced === 'SI' ? (
              <DataField highlighted={fieldWasAutofilled('referencedName')} invalid={fieldHasError('nombre del referenciado')} label="Nombre del referenciado" onChange={(value) => onChange('referencedName', value)} required value={form.referencedName} />
            ) : null}
          </div>

          <button className="primary-button" onClick={onCreate} type="button">
            Generar carpeta {form.type || 'Particular'}
          </button>
        </article>
      </section>
    </div>
  );
}

function FichaTecnicaTab({ item, updateCase }) {
  const isThirdParty = isThirdPartyClaimCase(item);
  const isFranchiseRecovery = isFranchiseRecoveryCase(item);
  const clientRegistry = isThirdParty ? item.thirdParty.clientRegistry : null;
  const franchiseSummary = isFranchiseRecovery ? item.computed.franchiseRecovery : null;
  const repairEnabled = franchiseSummary?.repairEnabled ?? true;
  const visibleOwners = isThirdParty && clientRegistry.isOwner === 'NO'
    ? clientRegistry.owners.slice(0, clientRegistry.ownershipPercentage === '50%' ? 2 : 1)
    : [];
  const laborSummary = item.payments.comprobante === 'A' ? item.computed.laborWithVat : item.computed.laborWithoutVat;
  const latestSettlement = isThirdParty
    ? maxDate(item.payments.paymentDate, (item.thirdParty.payments.clientPayments || []).reduce((latest, payment) => maxDate(latest, payment.date), ''))
    : item.payments.settlements.reduce((latest, settlement) => maxDate(latest, settlement.date), '');
  const ingresoSummary = item.repair.ingreso.realDate
    ? `${formatDate(item.repair.ingreso.realDate)}${item.repair.ingreso.hasObservation === 'SI' ? ' · con observaciones' : ''}`
    : 'Pendiente';
  const egresoSummary = item.repair.egreso.date
    ? `${formatDate(item.repair.egreso.date)}${item.repair.egreso.shouldReenter === 'SI' ? ' · requiere reingreso' : item.repair.egreso.definitiveExit ? ' · definitivo' : ''}`
    : 'Pendiente';

  return (
    <div className="tab-layout">
      <div className="form-grid two-columns">
        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Cliente</h3>
            <StatusBadge tone={item.customer.referenced === 'SI' ? 'info' : 'success'}>
              Referenciado {item.customer.referenced || 'NO'}
            </StatusBadge>
          </div>
          <div className="form-grid two-columns compact-grid">
            <DataField label="Nombre" onChange={(value) => updateCase((draft) => { draft.customer.firstName = value; })} value={item.customer.firstName} />
            <DataField label="Apellido" onChange={(value) => updateCase((draft) => { draft.customer.lastName = value; })} value={item.customer.lastName} />
            <DataField label="Documento" onChange={(value) => updateCase((draft) => { draft.customer.document = value; })} value={item.customer.document} />
            <DataField label="N° siniestro" onChange={(value) => updateCase((draft) => { draft.claimNumber = value; })} value={item.claimNumber || ''} />
            <DataField label="Fecha nacimiento" onChange={(value) => updateCase((draft) => { draft.customer.birthDate = value; })} type="date" value={item.customer.birthDate || ''} />
            <SelectField label="Estado civil" onChange={(value) => updateCase((draft) => { draft.customer.civilStatus = value; })} options={CIVIL_STATUS_OPTIONS} placeholder="Seleccioná" value={item.customer.civilStatus || ''} />
            <DataField label="Telefono" onChange={(value) => updateCase((draft) => { draft.customer.phone = value; })} value={item.customer.phone} />
            <DataField label="Localidad" onChange={(value) => updateCase((draft) => { draft.customer.locality = value; })} value={item.customer.locality} />
            <DataField label="Email" onChange={(value) => updateCase((draft) => { draft.customer.email = value; })} value={item.customer.email} />
            <DataField label="Ocupación" onChange={(value) => updateCase((draft) => { draft.customer.occupation = value; })} value={item.customer.occupation || ''} />
            <DataField label="Calle" onChange={(value) => updateCase((draft) => { draft.customer.street = value; })} value={item.customer.street || ''} />
            <DataField label="Número" onChange={(value) => updateCase((draft) => { draft.customer.streetNumber = value; })} value={item.customer.streetNumber || ''} />
            <DataField label="Piso / Depto" onChange={(value) => updateCase((draft) => { draft.customer.addressExtra = value; })} value={item.customer.addressExtra || ''} />
            <ToggleField label="Referenciado" onChange={(value) => updateCase((draft) => { draft.customer.referenced = value; if (value !== 'SI') draft.customer.referencedName = ''; })} value={item.customer.referenced} />
            {item.customer.referenced === 'SI' ? (
              <DataField label="Nombre referenciado" onChange={(value) => updateCase((draft) => { draft.customer.referencedName = value; })} value={item.customer.referencedName} />
            ) : null}
          </div>
          {isThirdParty ? (
            <>
              <div className="budget-ready-panel budget-ready-panel-compact">
                <StatusBadge tone={clientRegistry.isOwner === 'SI' ? 'success' : 'info'}>{clientRegistry.isOwner === 'SI' ? 'Cliente titular registral' : 'Titular registral externo'}</StatusBadge>
                <small>Si el cliente no es titular, la demo toma el primer titular registral para nombrar la carpeta.</small>
              </div>
              <div className="form-grid three-columns compact-grid">
                <ToggleField label="Titular registral" onChange={(value) => updateCase((draft) => {
                  draft.thirdParty.clientRegistry.isOwner = value;
                  if (value !== 'NO') {
                    draft.thirdParty.clientRegistry.ownershipPercentage = '100%';
       d label="Telefono" onChange={(value) => updateCase((draft) => { draft.customer.phone = value; })} value={item.customer.phone} />
            <DataField label="Localidad" onChange={(value) => updateCase((draft) => { draft.customer.locality = value; })} value={item.customer.locality} />
            <DataField label="Email" onChange={(value) => updateCase((draft) => { draft.customer.email = value; })} value={item.customer.email} />
            <DataField label="Ocupación" onChange={(value) => updateCase((draft) => { draft.customer.occupation = value; })} value={item.customer.occupation || ''} />
            <DataField label="Calle" onChange={(value) => updateCase((draft) => { draft.customer.street = value; })} value={item.customer.street || ''} />
            <DataField label="Número" onChange={(value) => updateCase((draft) => { draft.customer.streetNumber = value; })} value={item.customer.streetNumber || ''} />
            <DataField label="Piso / Depto" onChange={(value) => updateCase((draft) => { draft.customer.addressExtra = value; })} value={item.customer.addressExtra || ''} />
            <ToggleField label="Referenciado" onChange={(value) => updateCase((draft) => { draft.customer.referenced = value; if (value !== 'SI') draft.customer.referencedName = ''; })} value={item.customer.referenced} />
            {item.customer.referenced === 'SI' ? (
              <DataField label="Nombre referenciado" onChange={(value) => updateCase((draft) => { draft.customer.referencedName = value; })} value={item.customer.referencedName} />
            ) : null}
          </div>
          {isThirdParty ? (
            <>
              <div className="budget-ready-panel budget-ready-panel-compact">
                <StatusBadge tone={clientRegistry.isOwner === 'SI' ? 'success' : 'info'}>{clientRegistry.isOwner === 'SI' ? 'Cliente titular registral' : 'Titular registral externo'}</StatusBadge>
                <small>Si el cliente no es titular, la demo toma el primer titular registral para nombrar la carpeta.</small>
              </div>
              <div className="form-grid three-columns compact-grid">
                <ToggleField label="Titular registral" onChange={(value) => updateCase((draft) => {
                  draft.thirdParty.clientRegistry.isOwner = value;
                  if (value !== 'NO') {
                    draft.thirdParty.clientRegistry.ownershipPercentage = '100%';
                  }
                })} value={clientRegistry.isOwner} />
                <SelectField disabled={clientRegistry.isOwner !== 'NO'} label="Porcentaje titularidad" onChange={(value) => updateCase((draft) => {
                  draft.thirdParty.clientRegistry.ownershipPercentage = value;
                })} options={OWNERSHIP_PERCENTAGE_OPTIONS} value={clientRegistry.ownershipPercentage} />
                <DataField label="Identificación carpeta" onChange={() => {}} readOnly value={getFolderDisplayName(item)} />
              </div>
              {visibleOwners.map((owner, index) => (
                <div className="nested-card" key={owner.id}>
                  <div className="section-head small-gap">
                    <h4>{index === 0 ? 'Titular registral principal' : 'Otro titular registral'}</h4>
                    <StatusBadge tone={owner.firstName || owner.lastName ? 'info' : 'danger'}>{owner.firstName || owner.lastName ? 'Cargado' : 'Pendiente'}</StatusBadge>
                  </div>
                  <div className="form-grid two-columns compact-grid">
                    <DataField label="Nombre" onChange={(value) => updateCase((draft) => { draft.thirdParty.clientRegistry.owners[index].firstName = value; })} value={owner.firstName} />
                    <DataField label="Apellido" onChange={(value) => updateCase((draft) => { draft.thirdParty.clientRegistry.owners[index].lastName = value; })} value={owner.lastName} />
                    <DataField label="Documento" onChange={(value) => updateCase((draft) => { draft.thirdParty.clientRegistry.owners[index].document = value; })} value={owner.document} />
                    <DataField label="Fecha nacimiento" onChange={(value) => updateCase((draft) => { draft.thirdParty.clientRegistry.owners[index].birthDate = value; })} type="date" value={owner.birthDate || ''} />
                    <DataField label="Telefono" onChange={(value) => updateCase((draft) => { draft.thirdParty.clientRegistry.owners[index].phone = value; })} value={owner.phone || ''} />
                    <DataField label="Localidad" onChange={(value) => updateCase((draft) => { draft.thirdParty.clientRegistry.owners[index].locality = value; })} value={owner.locality || ''} />
                  </div>
                </div>
              ))}
            </>
          ) : null}
        </article>

        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Vehiculo</h3>
            <StatusBadge tone="info">{item.vehicle.plate}</StatusBadge>
          </div>
          <div className="form-grid two-columns compact-grid">
            <SelectField label="Marca" onChange={(value) => updateCase((draft) => { draft.vehicle.brand = value; })} options={VEHICLE_BRAND_OPTIONS} placeholder="Seleccioná" value={item.vehicle.brand} />
            <DataField label="Modelo" onChange={(value) => updateCase((draft) => { draft.vehicle.model = value; })} value={item.vehicle.model} />
            <DataField label="Dominio" onChange={(value) => updateCase((draft) => { draft.vehicle.plate = value.toUpperCase(); })} value={item.vehicle.plate} />
            <DataField label="Ano" onChange={(value) => updateCase((draft) => { draft.vehicle.year = value; })} value={item.vehicle.year} />
            <SelectField label="Tipo" onChange={(value) => updateCase((draft) => { draft.vehicle.type = value; })} options={VEHICLE_TYPES} value={item.vehicle.type} />
            <SelectField label="Uso" onChange={(value) => updateCase((draft) => { draft.vehicle.usage = value; })} options={VEHICLE_USES} value={item.vehicle.usage} />
            <SelectField label="Pintura" onChange={(value) => updateCase((draft) => { draft.vehicle.paint = value; })} options={PAINT_TYPES} value={item.vehicle.paint} />
            <DataField label="Color" onChange={(value) => updateCase((draft) => { draft.vehicle.color = value; })} value={item.vehicle.color} />
            <DataField label="Motor" onChange={(value) => updateCase((draft) => { draft.vehicle.engine = value; })} value={item.vehicle.engine || ''} />
            <DataField label="Chasis" onChange={(value) => updateCase((draft) => { draft.vehicle.chassis = value; })} value={item.vehicle.chassis || ''} />
            <SelectField label="Caja" onChange={(value) => updateCase((draft) => { draft.vehicle.transmission = value; })} options={TRANSMISSION_OPTIONS} placeholder="Seleccioná" value={item.vehicle.transmission || ''} />
            <DataField label="Kilometraje" onChange={(value) => updateCase((draft) => { draft.vehicle.mileage = value; })} inputMode="numeric" value={item.vehicle.mileage || ''} />
          </div>
          <label className="field">
            <span>Observaciones del vehículo</span>
            <textarea onChange={(event) => updateCase((draft) => { draft.vehicle.observations = event.target.value; })} value={item.vehicle.observations || ''} />
          </label>
        </article>
      </div>

      <div className="form-grid two-columns ficha-summary-grid">
        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Resumen Reparacion</h3>
            <StatusBadge tone={!repairEnabled ? 'info' : item.computed.partsStatus === 'Recibido' ? 'success' : 'danger'}>{!repairEnabled ? 'No aplica' : item.computed.partsStatus}</StatusBadge>
          </div>
          <div className="summary-stack">
            <div className="summary-row"><span>Taller</span><strong>{item.budget.workshop}</strong></div>
            <div className="summary-row"><span>Presupuestó</span><strong>{item.budget.authorizer || 'Pendiente'} · {item.budget.partsQuotedDate ? formatDate(item.budget.partsQuotedDate) : 'sin fecha'}</strong></div>
            <div className="summary-row"><span>Habilita reparación</span><strong>{repairEnabled ? 'SI' : 'NO'}</strong></div>
            <div className="summary-row"><span>Turno</span><strong>{repairEnabled ? (item.repair.turno.date ? `${formatDate(item.repair.turno.date)} · ${item.repair.turno.state}` : 'Sin agendar') : 'Oculto por trámite'}</strong></div>
            <div className="summary-row"><span>Anotaciones turno</span><strong>{repairEnabled ? (item.repair.turno.notes || 'Sin notas de turno') : 'Gestión reparación deshabilitada'}</strong></div>
            <div className="summary-row"><span>Mano de obra resumen</span><strong>{money(laborSummary)} · comprobante {item.payments.comprobante}</strong></div>
            <div className="summary-row"><span>Ingreso</span><strong>{repairEnabled ? ingresoSummary : 'No aplica'}</strong></div>
            <div className="summary-row"><span>Egreso</span><strong>{repairEnabled ? egresoSummary : 'No aplica'}</strong></div>
            <div className="summary-row"><span>Salida estimada</span><strong>{repairEnabled ? (item.computed.turnoEstimatedExit ? formatDate(item.computed.turnoEstimatedExit) : 'Pendiente') : 'No aplica'}</strong></div>
          </div>
        </article>

        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Resumen Pagos</h3>
            <StatusBadge tone={getStatusTone(item.computed.paymentState)}>{item.computed.paymentState}</StatusBadge>
          </div>
          <div className="summary-stack">
            <div className="summary-row"><span>Total cotizado</span><strong>{money(item.computed.totalQuoted)}</strong></div>
            <div className="summary-row"><span>{isThirdParty ? 'Cobro compañía' : 'Senia'}</span><strong>{isThirdParty ? money(item.computed.paidAmount) : item.payments.hasSena === 'SI' ? money(item.payments.senaAmount) : 'No'}</strong></div>
            <div className="summary-row"><span>{isThirdParty ? 'Cobro extras cliente' : 'Cobrado'}</span><strong>{isThirdParty ? money(item.computed.thirdParty.clientPaymentsTotal) : money(item.computed.paidAmount)}</strong></div>
            <div className="summary-row"><span>{isThirdParty ? 'Saldo extras cliente' : 'Saldo deudor'}</span><strong>{isThirdParty ? money(item.computed.thirdParty.clientExtrasBalance) : money(item.computed.balance)}</strong></div>
            <div className="summary-row"><span>Último cobro</span><strong>{latestSettlement ? formatDate(latestSettlement) : 'Sin cobros'}</strong></div>
            <div className="summary-row"><span>Factura</span><strong>{item.payments.invoice === 'SI' ? `${item.payments.businessName} · ${item.payments.invoiceNumber}` : 'No'}</strong></div>
          </div>
        </article>

        <article className="card inner-card summary-span-two">
          <div className="section-head small-gap">
            <h3>Lectura consolidada</h3>
            <StatusBadge tone={item.computed.closeReady ? 'success' : 'info'}>{item.computed.closeReady ? 'Caso cerrable' : 'Caso abierto'}</StatusBadge>
          </div>
          <div className="vehicle-meta-grid consolidated-meta-grid">
            <div>
              <span>Vehículo completo</span>
              <strong>{item.computed.hasVehicleData ? 'OK' : `Falta ${item.computed.vehicleMissingFields.join(', ')}`}</strong>
            </div>
            <div>
              <span>Estado repuestos</span>
              <strong>{repairEnabled ? item.computed.partsStatus : 'No aplica'}</strong>
            </div>
            <div>
              <span>Reingreso</span>
              <strong>{repairEnabled ? (item.repair.egreso.shouldReenter === 'SI' ? (item.repair.egreso.reentryDate ? formatDate(item.repair.egreso.reentryDate) : 'Pendiente agendar') : 'No') : 'No aplica'}</strong>
            </div>
            <div>
              <span>Fotos reparado</span>
              <strong>{repairEnabled ? (item.repair.egreso.repairedPhotos ? 'Cargadas' : 'Pendientes') : 'No aplica'}</strong>
            </div>
            {isFranchiseRecovery ? (
              <>
                <div>
                  <span>Carpeta asociada</span>
                  <strong>{item.franchiseRecovery?.associatedFolderCode || 'Pendiente'}</strong>
                </div>
                <div>
                  <span>Dictamen</span>
                  <strong>{item.franchiseRecovery?.dictamen || 'Pendiente'}</strong>
                </div>
                <div>
                  <span>Monto a recuperar</span>
                  <strong>{money(item.franchiseRecovery?.amountToRecover || 0)}</strong>
                </div>
                <div>
                  <span>Recupero a cliente</span>
                  <strong>{item.computed.franchiseRecovery?.dictamenShared ? 'Demo 50/50' : item.computed.franchiseRecovery?.canRecoverToClient ? item.franchiseRecovery?.recoverToClient || 'NO' : 'No aplica'}</strong>
                </div>
                <div>
                  <span>Gestión reparación</span>
                  <strong>{repairEnabled ? 'Habilitada' : 'Oculta'}</strong>
                </div>
                <div>
                  <span>Monto cliente</span>
                  <strong>{item.computed.franchiseRecovery?.clientChargeActive ? money(item.computed.franchiseRecovery?.clientResponsibilityAmount || 0) : 'No aplica'}</strong>
                </div>
              </>
            ) : null}
            {isThirdParty ? (
              <>
                <div>
                  <span>Pago compañía</span>
                  <strong>{item.computed.thirdParty.companyPaymentReady ? 'OK' : 'Pendiente'}</strong>
                </div>
                <div>
                  <span>Cierre extras cliente</span>
                  <strong>{item.computed.thirdParty.hasExtraWorks ? (item.computed.thirdParty.clientExtrasReady ? 'OK' : money(item.computed.thirdParty.clientExtrasBalance)) : 'No aplica'}</strong>
                </div>
              </>
            ) : null}
          </div>
        </article>
      </div>
    </div>
  );
}

function GestionTramiteTab({ item, updateCase, flash, allCases = [] }) {
  const todoRisk = item.todoRisk;
  const thirdParty = item.thirdParty;
  const lawyer = item.lawyer;
  const franchiseRecovery = item.franchiseRecovery;
  const isThirdParty = isThirdPartyWorkshopCase(item);
  const isThirdPartyLawyer = isThirdPartyLawyerCase(item);
  const isFranchiseRecovery = isFranchiseRecoveryCase(item);
  const isCleas = isCleasCase(item);
  const canProgressFromPresentation = item.computed.todoRisk?.canProgressFromPresentation ?? false;
  const canCompleteProcessingCore = item.computed.todoRisk?.canCompleteProcessingCore ?? false;
  const agendaPendingCount = todoRisk?.processing?.agenda?.filter((task) => !isAgendaTaskResolved(task)).length ?? 0;
  const processingLocked = isCleas
    ? !canProgressFromPresentation || item.computed.todoRisk?.noRepairNeeded
    : !canProgressFromPresentation;
  const isFranchiseFlow = todoRisk?.processing?.cleasScope === 'Sobre franquicia';
  const isDamageTotal = todoRisk?.processing?.cleasScope === 'Sobre daño total';
  const dictamen = todoRisk?.processing?.dictamen || 'Pendiente';

  const addDocument = () => {
    updateCase((draft) => {
      draft.todoRisk.documentation.items.push(createTodoRiskDocument());
    });
  };

  const addAgendaTask = () => {
    updateCase((draft) => {
      draft.todoRisk.processing.agenda.push(createTodoRiskTask({
        sourceArea: 'Gestión del trámite',
        sourceLabel: 'Gestión del trámite',
        relatedTab: 'tramite',
        linkedCaseId: draft.id,
        linkedCaseCode: draft.code,
      }));
    });
  };

  if (isFranchiseRecovery) {
    const compatibleFolders = allCases.filter(
      (entry) => entry.id !== item.id && isTodoRiesgoCase(entry) && entry.todoRisk?.franchise?.status !== 'Sin Franquicia',
    );
    const linkedCase = compatibleFolders.find((entry) => entry.code === franchiseRecovery.associatedFolderCode) || null;
    const repairEnabled = franchiseRecovery.enablesRepair !== 'NO';
    const franchiseComputed = item.computed.franchiseRecovery || {};
    const showClientRecoveryBlock = franchiseComputed.dictamenShared || (!repairEnabled && franchiseRecovery.recoverToClient === 'SI');

    const handleLinkedFolderChange = (folderCode) => {
      updateCase((draft) => {
        const linkedFolder = compatibleFolders.find((entry) => entry.code === folderCode);

        draft.franchiseRecovery.associatedFolderCode = folderCode;
        draft.franchiseRecovery.associatedCaseId = linkedFolder?.id || '';

        if (!linkedFolder) {
          return;
        }

        if (!draft.claimNumber) draft.claimNumber = linkedFolder.claimNumber || '';
        if (!draft.customer.phone) draft.customer.phone = linkedFolder.customer.phone || '';
        if (!draft.customer.email) draft.customer.email = linkedFolder.customer.email || '';
        if (!draft.vehicle.year) draft.vehicle.year = linkedFolder.vehicle.year || '';
        if (!draft.vehicle.color) draft.vehicle.color = linkedFolder.vehicle.color || '';
        if (!draft.vehicle.chassis) draft.vehicle.chassis = linkedFolder.vehicle.chassis || '';
        if (!draft.vehicle.engine) draft.vehicle.engine = linkedFolder.vehicle.engine || '';
        if (!draft.vehicle.transmission) draft.vehicle.transmission = linkedFolder.vehicle.transmission || '';
        if (!draft.vehicle.mileage) draft.vehicle.mileage = linkedFolder.vehicle.mileage || '';
        if (!draft.budget.workshop) draft.budget.workshop = linkedFolder.budget.workshop || '';
        draft.franchiseRecovery.agreementAmount = linkedFolder.todoRisk?.processing?.agreedAmount || draft.franchiseRecovery.agreementAmount || '';
        if (!draft.franchiseRecovery.amountToRecover) draft.franchiseRecovery.amountToRecover = linkedFolder.todoRisk?.franchise?.amount || '';
        if (draft.franchiseRecovery.dictamen === 'Culpa compartida' && !draft.franchiseRecovery.clientResponsibilityAmount) {
          const baseAmount = numberValue(linkedFolder.todoRisk?.processing?.agreedAmount || draft.franchiseRecovery.amountToRecover || 0);
          if (baseAmount > 0) {
            draft.franchiseRecovery.clientResponsibilityAmount = String(Math.round(baseAmount * 0.5));
          }
        }
      });

      if (folderCode) {
        const linkedFolder = compatibleFolders.find((entry) => entry.code === folderCode);
        flash(`Carpeta ${folderCode} vinculada${linkedFolder?.todoRisk?.insurance?.company ? ` con base ${linkedFolder.todoRisk.insurance.company}` : ''}.`);
      }
    };

    return (
      <div className="tab-layout todo-risk-layout">
        <article className="card inner-card franchise-management-card">
          <div className="section-head small-gap">
            <div>
              <p className="eyebrow">Gestión del trámite</p>
              <h3>Recupero de franquicia</h3>
            </div>
            <span className="tramite-identity-badge is-franchise">Franquicia</span>
          </div>

          <div className={`form-grid ${repairEnabled ? 'four-columns' : 'five-columns'} compact-grid`}>
            <SelectField
              label="Gestiona"
              onChange={(value) => updateCase((draft) => { draft.franchiseRecovery.managerType = value; })}
              options={FRANCHISE_MANAGER_OPTIONS}
              value={franchiseRecovery.managerType}
            />
            <SelectField
              label="Carpeta asociada"
              onChange={handleLinkedFolderChange}
              options={compatibleFolders.map((entry) => ({
                value: entry.code,
                label: `${entry.code} - ${getFolderDisplayName(entry)} · ${entry.vehicle.brand} ${entry.vehicle.model}`,
              }))}
              placeholder="Seleccioná Todo Riesgo"
              value={franchiseRecovery.associatedFolderCode}
            />
            <SelectField
              label="Dictamen"
              onChange={(value) => updateCase((draft) => {
                draft.franchiseRecovery.dictamen = value;

                if (value === 'Culpa compartida') {
                  const baseAmount = numberValue(draft.franchiseRecovery.agreementAmount || draft.franchiseRecovery.amountToRecover || 0);
                  if (!draft.franchiseRecovery.clientResponsibilityAmount && baseAmount > 0) {
                    draft.franchiseRecovery.clientResponsibilityAmount = String(Math.round(baseAmount * 0.5));
                  }
                  if (draft.franchiseRecovery.enablesRepair === 'NO') {
                    draft.franchiseRecovery.recoverToClient = 'SI';
                  }
                }
              })}
              options={FRANCHISE_RECOVERY_DICTAMEN_OPTIONS}
              value={franchiseRecovery.dictamen}
            />
            <DataField
              label="Monto a recuperar"
              onChange={(value) => updateCase((draft) => { draft.franchiseRecovery.amountToRecover = value; })}
              value={franchiseRecovery.amountToRecover}
            />
            <ToggleField
              label="Habilita reparación"
              onChange={(value) => updateCase((draft) => {
                draft.franchiseRecovery.enablesRepair = value;
                if (value === 'NO') {
                  draft.franchiseRecovery.recoverToClient = draft.franchiseRecovery.recoverToClient || 'NO';
                  draft.repair.parts = [];
                  draft.repair.turno = { date: '', estimatedDays: '', state: 'Pendiente programar', notes: '' };
                  draft.repair.ingreso = { realDate: '', hasObservation: 'NO', observation: '', items: [] };
                  draft.repair.egreso = {
                    date: '',
                    notes: '',
                    shouldReenter: 'NO',
                    reentryDate: '',
                    reentryEstimatedDays: '',
                    reentryState: 'Pendiente programar',
                    reentryNotes: '',
                    definitiveExit: false,
                    repairedPhotos: false,
                    repairedMedia: [],
                  };
                } else {
                  draft.franchiseRecovery.recoverToClient = 'NO';
                }
              })}
              value={franchiseRecovery.enablesRepair}
            />
            {!repairEnabled ? (
              <ToggleField
                label="Recupero a cliente"
                onChange={(value) => updateCase((draft) => {
                  draft.franchiseRecovery.recoverToClient = value;

                  if (value !== 'SI' && draft.franchiseRecovery.dictamen !== 'Culpa compartida') {
                    draft.franchiseRecovery.clientResponsibilityAmount = '';
                    draft.franchiseRecovery.clientRecoveryStatus = 'Pendiente';
                    draft.franchiseRecovery.clientRecoveryDate = '';
                  }
                })}
                value={franchiseRecovery.recoverToClient}
              />
            ) : null}
          </div>

          <div className={`inline-alert ${repairEnabled ? 'info-banner' : 'success-banner'} franchise-flow-banner`}>
            {repairEnabled
              ? 'Habilita reparación = SI: se activan Presupuesto y Gestión reparación con la base existente del taller.'
              : 'Habilita reparación = NO: se anulan las solapas operativas de reparación y queda disponible Recupero a cliente.'}
          </div>

          {franchiseComputed.hasEconomicAlert ? (
            <div className="inline-alert danger-banner franchise-flow-banner">
              Recupero económico en alerta: {money(franchiseComputed.amountToRecover || 0)} queda por debajo del monto acordado {money(franchiseComputed.agreementAmount || 0)}. Diferencia demo: {money(franchiseComputed.economicGapAmount || 0)}.
            </div>
          ) : null}

          {franchiseComputed.dictamenShared ? (
            <div className="inline-alert info-banner franchise-flow-banner">
              Dictamen compartido: se refleja demo 50/50 con {money(franchiseComputed.clientResponsibilityAmount || 0)} a cargo del cliente y {money(franchiseComputed.companyExpectedAmount || 0)} a cargo de la compañía.
            </div>
          ) : null}

          {showClientRecoveryBlock ? (
            <div className="franchise-client-recovery-block">
              <div className="section-head small-gap">
                <div>
                  <p className="eyebrow">Recupero a cliente</p>
                  <h3>Campos mínimos visibles</h3>
                </div>
                <StatusBadge tone={franchiseRecovery.clientRecoveryStatus === 'Cancelado' ? 'success' : 'info'}>
                  {franchiseRecovery.clientRecoveryStatus}
                </StatusBadge>
              </div>

              <div className="form-grid three-columns compact-grid">
                <DataField
                  label="Monto cliente"
                  onChange={(value) => updateCase((draft) => { draft.franchiseRecovery.clientResponsibilityAmount = value; })}
                  value={franchiseRecovery.clientResponsibilityAmount}
                />
                <SelectField
                  label="Estado cobro cliente"
                  onChange={(value) => updateCase((draft) => { draft.franchiseRecovery.clientRecoveryStatus = value; })}
                  options={FRANCHISE_CLIENT_PAYMENT_STATUS_OPTIONS}
                  value={franchiseRecovery.clientRecoveryStatus}
                />
                <DataField
                  label="Fecha cobro cliente"
                  onChange={(value) => updateCase((draft) => { draft.franchiseRecovery.clientRecoveryDate = value; })}
                  type="date"
                  value={franchiseRecovery.clientRecoveryDate}
                />
              </div>
            </div>
          ) : null}

          {franchiseRecovery.managerType === 'Abogado' ? (
            <div className="inline-alert info-banner franchise-flow-banner">
              Gestión por abogado visible en Fase 1: queda registrada la modalidad, pero la integración completa con la solapa Abogado se deja para Fase 2.
            </div>
          ) : null}
        </article>

        <article className="card inner-card franchise-link-card">
          <div className="section-head small-gap">
            <div>
              <h3>Carpeta vinculada</h3>
              <p className="muted">Solo se listan carpetas compatibles de Todo Riesgo con franquicia activa.</p>
            </div>
            <StatusBadge tone={linkedCase ? 'success' : 'danger'}>{linkedCase ? linkedCase.code : 'Sin vínculo'}</StatusBadge>
          </div>

          {linkedCase ? (
            <>
              <div className="form-grid four-columns compact-grid franchise-data-grid">
                <DataField label="Cliente base" onChange={() => {}} readOnly value={getFolderDisplayName(linkedCase)} />
                <DataField label="Vehículo base" onChange={() => {}} readOnly value={`${linkedCase.vehicle.brand} ${linkedCase.vehicle.model} - ${linkedCase.vehicle.plate}`} />
                <DataField label="Cía. aseguradora" onChange={() => {}} readOnly value={linkedCase.todoRisk.insurance.company || '-'} />
                <DataField label="N° siniestro" onChange={() => {}} readOnly value={linkedCase.claimNumber || '-'} />
                <DataField label="Fecha siniestro" onChange={() => {}} readOnly type="date" value={linkedCase.todoRisk.incident.date || ''} />
                <DataField label="Lugar" onChange={() => {}} readOnly value={linkedCase.todoRisk.incident.location || '-'} />
                <DataField label="Franquicia origen" onChange={() => {}} readOnly value={money(linkedCase.todoRisk.franchise.amount || 0)} />
                <DataField label="Recupero original" onChange={() => {}} readOnly value={linkedCase.todoRisk.franchise.recoveryType || 'Pendiente'} />
              </div>

              <label className="field">
                <span>Dinámica heredada</span>
                <textarea readOnly value={linkedCase.todoRisk.incident.dynamics || ''} />
              </label>
            </>
          ) : (
            <div className="tramite-type-empty" role="status">
              <strong>Todo Riesgo</strong>
              <p>Seleccioná una carpeta compatible para vincular franquicia, compañía y datos básicos del siniestro.</p>
            </div>
          )}
        </article>
      </div>
    );
  }

  if (isThirdPartyLawyer) {
    const participants = thirdParty.claim.thirdParties;

    const addParticipant = () => {
      updateCase((draft) => {
        draft.thirdParty.claim.thirdParties.push(createThirdPartyParticipant());
      });
    };

    const addGeneralDocument = () => {
      updateCase((draft) => {
        draft.thirdParty.claim.documents.push(createTodoRiskDocument());
      });
    };

    return (
      <div className="tab-layout todo-risk-layout">
        <article className="card inner-card todo-risk-summary-card">
          <div className="section-head small-gap">
            <div>
              <p className="eyebrow">Gestión del trámite</p>
              <h3>Base heredada de Taller + guard legal</h3>
            </div>
            <StatusBadge tone={item.computed.tabs.tramite === 'resolved' ? 'success' : 'info'}>
              {item.computed.tramiteStatus}
            </StatusBadge>
          </div>
          <div className="form-grid five-columns compact-grid">
            <DataField label="Fecha del siniestro" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.date = value; })} type="date" value={todoRisk.incident.date} />
            <DataField label="Prescripción del trámite" onChange={() => {}} readOnly type="date" value={item.computed.lawyer.prescriptionDate} />
            <DataField label="Fecha presentado" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.presentedDate = value; })} type="date" value={thirdParty.claim.presentedDate} />
            <DataField label="Referencia / reclamo" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.claimReference = value; })} value={thirdParty.claim.claimReference} />
            <ToggleField label="Repara vehículo" onChange={(value) => updateCase((draft) => {
              draft.lawyer.repairVehicle = value;
              if (value === 'NO') {
                draft.repair.turno.date = '';
                draft.repair.turno.estimatedDays = '';
                draft.repair.turno.state = 'Pendiente programar';
                draft.repair.egreso.date = '';
                draft.repair.egreso.definitiveExit = false;
              }
            })} value={lawyer.repairVehicle} />
          </div>
          {lawyer.repairVehicle === 'NO' ? <div className="inline-alert info-banner">Se anula la reparación normal: el estado superior pasa a <strong>No debe repararse</strong> y Gestión reparación queda resuelta en demo.</div> : null}
          {!todoRisk.incident.date ? <div className="inline-alert danger-banner">Sin fecha del siniestro no se calcula la prescripción.</div> : null}
        </article>

        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Datos del siniestro</h3>
            <StatusBadge tone={participants.length ? 'info' : 'danger'}>{participants.length} tercero(s)</StatusBadge>
          </div>
          <div className="form-grid three-columns compact-grid">
            <DataField label="Cía. del 3ero" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdCompany = value; })} value={thirdParty.claim.thirdCompany} />
            <DataField label="Lugar de ocurrencia" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.location = value; })} value={todoRisk.incident.location} />
            <DataField label="Hora" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.time = value; })} value={todoRisk.incident.time} />
          </div>
          <label className="field">
            <span>Dinámica del siniestro</span>
            <textarea onChange={(event) => updateCase((draft) => { draft.todoRisk.incident.dynamics = event.target.value; })} value={todoRisk.incident.dynamics} />
          </label>
          <div className="budget-lines">
            {participants.map((participant, index) => (
              <div className="budget-line budget-line-extended" key={participant.id}>
                <div className="budget-line-header">
                  <strong>{index === 0 ? 'Tercero principal' : `Tercero ${index + 1}`}</strong>
                  <small>Se reutiliza la misma estructura base que Taller.</small>
                </div>
                <DataField label="Conductor 3ero" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].driverName = value; })} value={participant.driverName} />
                <DataField label="DNI conductor" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].driverDocument = value; })} value={participant.driverDocument} />
                <DataField label="Dominio" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].plate = value.toUpperCase(); })} value={participant.plate} />
                <DataField label="Marca" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].brand = value; })} value={participant.brand} />
                <DataField label="Modelo" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].model = value; })} value={participant.model} />
                <DataField label="Domicilio" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].address = value; })} value={participant.address} />
              </div>
            ))}
          </div>
          <button className="secondary-button" onClick={addParticipant} type="button">+ Agregar otro 3ero</button>
        </article>

        <article className="card inner-card">
          <div className="section-head">
            <div>
              <h3>Documentación general</h3>
              <p className="muted">Separada del expediente judicial y visible en esta solapa.</p>
            </div>
            <div className="tag-row">
              <button className="secondary-button" onClick={addGeneralDocument} type="button">Agregar ítem</button>
              <button className="secondary-button" onClick={() => flash('Descargar todo demo: se agruparía la documentación general del reclamo.')} type="button">Descargar todo</button>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table compact-table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Tipo archivo / nombre</th>
                  <th>Fecha de carga</th>
                  <th>Observaciones</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {thirdParty.claim.documents.map((doc) => (
                  <tr key={doc.id}>
                    <td><SelectField label="Categoría" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.claim.documents.find((entry) => entry.id === doc.id); target.category = value; })} options={LAWYER_GENERAL_DOC_CATEGORY_OPTIONS} value={doc.category} /></td>
                    <td><DataField label="Nombre" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.claim.documents.find((entry) => entry.id === doc.id); target.name = value; })} value={doc.name} /></td>
                    <td><DataField label="Fecha" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.claim.documents.find((entry) => entry.id === doc.id); target.uploadedAt = value; })} type="date" value={doc.uploadedAt} /></td>
                    <td><DataField label="Notas" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.claim.documents.find((entry) => entry.id === doc.id); target.notes = value; })} value={doc.notes} /></td>
                    <td><button className="ghost-button" onClick={() => updateCase((draft) => { draft.thirdParty.claim.documents = draft.thirdParty.claim.documents.filter((entry) => entry.id !== doc.id); })} type="button">Quitar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    );
  }

  if (isThirdParty) {
    const participants = thirdParty.claim.thirdParties;
    const amountBelowMinimum = !item.computed.thirdParty.amountMeetsMinimum && item.computed.thirdParty.amountToInvoice > 0;

    const addParticipant = () => {
      updateCase((draft) => {
        draft.thirdParty.claim.thirdParties.push(createThirdPartyParticipant());
      });
    };

    return (
      <div className="tab-layout todo-risk-layout">
        <article className="card inner-card todo-risk-summary-card">
          <div className="section-head small-gap">
            <div>
              <p className="eyebrow">Gestión del trámite</p>
              <h3>Base operativa Fase 2</h3>
            </div>
            <StatusBadge tone={item.computed.todoRisk.managementAdvanced ? 'info' : 'danger'}>
              {item.computed.todoRisk.managementAdvanced ? 'Base completa' : 'Faltan datos base'}
            </StatusBadge>
          </div>
          <div className="form-grid five-columns compact-grid">
            <DataField label="Fecha del siniestro" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.date = value; })} type="date" value={todoRisk.incident.date} />
            <DataField label="Prescripción del trámite" onChange={() => {}} readOnly type="date" value={item.computed.todoRisk.prescriptionDate} />
            <DataField label="Fecha presentado" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.presentedDate = value; })} type="date" value={thirdParty.claim.presentedDate} />
            <DataField label="Días tramitando" onChange={() => {}} readOnly value={item.computed.todoRisk.daysProcessing} />
            <DataField label="Referencia / reclamo" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.claimReference = value; })} value={thirdParty.claim.claimReference} />
          </div>
          {!todoRisk.incident.date ? <div className="inline-alert danger-banner">Sin fecha del siniestro no se puede calcular la prescripción a 3 años.</div> : null}
          <div className="budget-ready-panel budget-ready-panel-compact">
            <StatusBadge tone={participants.length ? 'info' : 'danger'}>{participants.length} tercero(s) cargado(s)</StatusBadge>
            <small>Se mantiene la base de Fase 1 y ahora Tramitación toma mínimos, repuestos y saldo final desde Presupuesto y Gestión reparación.</small>
          </div>
        </article>

        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Datos del siniestro</h3>
            <StatusBadge tone={participants.length ? 'info' : 'danger'}>{participants.length} tercero(s)</StatusBadge>
          </div>
          <div className="form-grid three-columns compact-grid">
            <DataField label="Cía. del 3ero" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdCompany = value; })} value={thirdParty.claim.thirdCompany} />
            <DataField label="Lugar de ocurrencia" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.location = value; })} value={todoRisk.incident.location} />
            <DataField label="Hora" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.time = value; })} value={todoRisk.incident.time} />
          </div>
          <label className="field">
            <span>Dinámica del siniestro</span>
            <textarea onChange={(event) => updateCase((draft) => { draft.todoRisk.incident.dynamics = event.target.value; })} value={todoRisk.incident.dynamics} />
          </label>
          <div className="budget-lines">
            {participants.map((participant, index) => {
              const visibleOwners = participant.isOwner === 'NO'
                ? participant.owners.slice(0, participant.ownershipPercentage === '50%' ? 2 : 1)
                : [];

              return (
                <div className="budget-line budget-line-extended" key={participant.id}>
                  <div className="budget-line-header">
                    <strong>{index === 0 ? 'Tercero principal' : `Tercero ${index + 1}`}</strong>
                    <small>{participant.isOwner === 'SI' ? 'Conductor titular' : 'Conductor distinto del titular'}</small>
                  </div>
                  <DataField label="Conductor 3ero" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].driverName = value; })} value={participant.driverName} />
                  <DataField label="DNI conductor" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].driverDocument = value; })} value={participant.driverDocument} />
                  <DataField label="Dominio" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].plate = value.toUpperCase(); })} value={participant.plate} />
                  <DataField label="Marca" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].brand = value; })} value={participant.brand} />
                  <DataField label="Modelo" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].model = value; })} value={participant.model} />
                  <ToggleField label="Conductor es titular" onChange={(value) => updateCase((draft) => {
                    draft.thirdParty.claim.thirdParties[index].isOwner = value;
                    if (value !== 'NO') {
                      draft.thirdParty.claim.thirdParties[index].ownershipPercentage = '100%';
                    }
                  })} value={participant.isOwner} />
                  <SelectField disabled={participant.isOwner !== 'NO'} label="Porcentaje titularidad" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].ownershipPercentage = value; })} options={OWNERSHIP_PERCENTAGE_OPTIONS} value={participant.ownershipPercentage} />
                  <DataField label="Domicilio" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].address = value; })} value={participant.address} />
                  {visibleOwners.map((owner, ownerIndex) => (
                    <div className="nested-card summary-span-two" key={owner.id}>
                      <div className="section-head small-gap">
                        <h4>{ownerIndex === 0 ? 'Titular 3ero principal' : 'Otro titular 3ero'}</h4>
                      </div>
                      <div className="form-grid two-columns compact-grid">
                        <DataField label="Nombre" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].owners[ownerIndex].firstName = value; })} value={owner.firstName} />
                        <DataField label="Apellido" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].owners[ownerIndex].lastName = value; })} value={owner.lastName} />
                        <DataField label="Documento" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].owners[ownerIndex].document = value; })} value={owner.document} />
                        <DataField label="Localidad" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].owners[ownerIndex].locality = value; })} value={owner.locality || ''} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <button className="secondary-button" onClick={addParticipant} type="button">+ Agregar otro 3ero</button>
        </article>

        <article className="card inner-card">
          <div className="section-head small-gap">
            <div>
              <h3>Tramitación</h3>
              <p className="muted">Mínimos automáticos, proveedor de repuestos y saldo final del taller.</p>
            </div>
            <StatusBadge tone={amountBelowMinimum ? 'danger' : 'info'}>
              {amountBelowMinimum ? 'Aviso admin pendiente' : 'Automático desde Presupuesto'}
            </StatusBadge>
          </div>

          <div className="form-grid four-columns compact-grid">
            <DataField highlighted label="Mínimo MO" onChange={() => {}} readOnly value={item.computed.thirdParty.minimumLabor} />
            <DataField highlighted label="Lleva repuestos" onChange={() => {}} readOnly value={item.computed.hasReplacementParts ? 'SI' : 'NO'} />
            <DataField highlighted label="Mínimo repuestos" onChange={() => {}} readOnly value={item.computed.thirdParty.minimumParts} />
            <DataField highlighted label="Subtotal mejor cotización" onChange={() => {}} readOnly value={item.computed.thirdParty.subtotalBestQuote} />
            <SelectField
              label="Provee repuestos"
              onChange={(value) => updateCase((draft) => {
                draft.thirdParty.claim.partsProviderMode = value;
              })}
              options={THIRD_PARTY_PARTS_PROVIDER_OPTIONS}
              value={thirdParty.claim.partsProviderMode}
            />
            <DataField
              disabled={thirdParty.claim.partsProviderMode !== 'Provee Taller'}
              highlighted={thirdParty.claim.partsProviderMode === 'Provee Taller'}
              label="Total final repuestos"
              onChange={() => {}}
              readOnly
              value={item.computed.thirdParty.totalFinalParts}
            />
            <DataField highlighted invalid={amountBelowMinimum} label="A facturar Cía." onChange={() => {}} readOnly value={item.computed.thirdParty.amountToInvoice} />
            <DataField highlighted invalid={amountBelowMinimum || item.computed.thirdParty.finalInFavorTaller < 0} label="Final a favor Taller" onChange={() => {}} readOnly value={item.computed.thirdParty.finalInFavorTaller} />
          </div>

          {thirdParty.claim.partsProviderMode !== 'Provee Taller' ? (
            <div className="inline-alert info-banner">Total final repuestos queda solo de referencia: impacta en el saldo del taller únicamente cuando los repuestos los provee el taller.</div>
          ) : null}

          {amountBelowMinimum ? (
            <div className="inline-alert danger-banner third-party-admin-alert">
              <span>La cotización acordada / a facturar Cía. quedó por debajo del mínimo correspondiente ({money(item.computed.thirdParty.applicableMinimum)}). Se genera aviso demo al administrador.</span>
              <button className="secondary-button compact-button" onClick={() => flash(item.computed.thirdParty.adminAlerts[0] || 'Aviso demo al admin: revisar cotización acordada por debajo del mínimo.')} type="button">Avisar admin demo</button>
            </div>
          ) : null}
        </article>

      </div>
    );
  }

  return (
    <div className="tab-layout todo-risk-layout">
      <article className="card inner-card todo-risk-summary-card">
        <div className="section-head small-gap">
          <div>
            <p className="eyebrow">Gestión del trámite</p>
            <h3>{isCleas ? 'Secuencia CLEAS' : 'Secuencia Todo Riesgo'}</h3>
          </div>
          <StatusBadge tone={item.computed.todoRisk.managementAdvanced ? 'info' : 'danger'}>
            {item.computed.todoRisk.managementAdvanced ? 'Azul operativo' : 'Rojo con pendientes'}
          </StatusBadge>
        </div>

        <div className={`form-grid ${isCleas ? 'six-columns' : 'four-columns'} compact-grid`}>
          <DataField label="Fecha del siniestro" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.date = value; })} type="date" value={todoRisk.incident.date} />
          <DataField label="Prescripción del trámite" onChange={() => {}} readOnly type="date" value={item.computed.todoRisk.prescriptionDate} />
          <DataField disabled={!canCompleteProcessingCore} label="Fecha presentado" onChange={(value) => updateCase((draft) => {
            draft.todoRisk.processing.presentedDate = value;
            if (!value) {
              draft.todoRisk.processing.derivedToInspectionDate = '';
              draft.todoRisk.processing.modality = TODO_RIESGO_MODALITY_OPTIONS[0];
              draft.todoRisk.processing.quoteStatus = 'Pendiente';
              draft.todoRisk.processing.quoteDate = '';
              draft.todoRisk.processing.agreedAmount = '';
            }
          })} type="date" value={todoRisk.processing.presentedDate} />
          <DataField label="Días tramitando" onChange={() => {}} readOnly value={item.computed.todoRisk.daysProcessing} />
          {isCleas ? (
            <>
              <SelectField label="Cleas sobre" onChange={(value) => updateCase((draft) => {
                draft.todoRisk.processing.cleasScope = value;
                if (value !== 'Sobre franquicia') {
                  draft.todoRisk.processing.franchiseAmount = '';
                  draft.todoRisk.processing.clientChargeAmount = '';
                  draft.todoRisk.processing.clientChargeStatus = 'Pendiente';
                  draft.todoRisk.processing.clientChargeDate = '';
                  draft.todoRisk.processing.companyFranchisePaymentAmount = '';
                  draft.todoRisk.processing.companyFranchisePaymentStatus = 'Pendiente';
                  draft.todoRisk.processing.companyFranchisePaymentDate = '';
                }
              })} options={CLEAS_SCOPE_OPTIONS} placeholder="Seleccioná" value={todoRisk.processing.cleasScope} />
              <SelectField label="Dictamen" onChange={(value) => updateCase((draft) => {
                draft.todoRisk.processing.dictamen = value;
                if (value !== 'En contra') {
                  draft.todoRisk.processing.clientChargeStatus = 'Pendiente';
                  draft.todoRisk.processing.clientChargeDate = '';
                  draft.todoRisk.processing.companyFranchisePaymentStatus = 'Pendiente';
                  draft.todoRisk.processing.companyFranchisePaymentDate = '';
                }
              })} options={CLEAS_DICTAMEN_OPTIONS} value={dictamen} />
            </>
          ) : null}
        </div>

        {!todoRisk.incident.date ? <div className="inline-alert danger-banner">Sin fecha del siniestro no se habilita el avance operativo del trámite.</div> : null}
        {isCleas
          ? !todoRisk.processing.cleasScope
            ? <div className="inline-alert danger-banner">Primero definí si CLEAS va sobre franquicia o sobre daño total.</div>
            : null
          : !todoRisk.franchise.recoveryType
            ? <div className="inline-alert danger-banner">Primero definí Recupero en Franquicia; recién ahí se habilita la fecha de presentación.</div>
            : null}
        {isCleas && dictamen === 'Pendiente' ? <div className="inline-alert danger-banner">Con dictamen pendiente la demo muestra la carpeta, pero bloquea inspección, cotización y avance operativo.</div> : null}
        {isCleas && item.computed.todoRisk.noRepairNeeded ? <div className="inline-alert info-banner">CLEAS sobre daño total con dictamen en contra: el caso se corta acá y no sigue reparación normal.</div> : null}
      </article>

      <article className="card inner-card">
        <div className="section-head small-gap">
          <h3>Datos del seguro</h3>
          <StatusBadge tone={todoRisk.insurance.company ? 'info' : 'danger'}>{todoRisk.insurance.company || 'Base pendiente'}</StatusBadge>
        </div>
        <div className="form-grid three-columns compact-grid">
          <SelectField label="Compañía" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.company = value; })} options={TODO_RIESGO_INSURANCE_OPTIONS} placeholder="Seleccioná" value={todoRisk.insurance.company} />
          {isCleas ? <DataField label="Cía. del 3ero" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.thirdCompany = value; })} value={todoRisk.insurance.thirdCompany || ''} /> : null}
          {isCleas ? <DataField label="N° de CLEAS" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.cleasNumber = value; })} value={todoRisk.insurance.cleasNumber || ''} /> : null}
          <DataField label="Tramitador/a" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.handlerName = value; })} value={todoRisk.insurance.handlerName} />
          <DataField label="Mail tramitador/a" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.handlerEmail = value; })} value={todoRisk.insurance.handlerEmail} />
          <DataField label="Tel. tramitador/a" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.handlerPhone = value; })} value={todoRisk.insurance.handlerPhone} />
          <DataField label="Inspector/a" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.inspectorName = value; })} value={todoRisk.insurance.inspectorName} />
          <DataField label="Mail inspector/a" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.inspectorEmail = value; })} value={todoRisk.insurance.inspectorEmail} />
          <DataField label="Tel. inspector/a" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.inspectorPhone = value; })} value={todoRisk.insurance.inspectorPhone} />
          <DataField label="N° de siniestro" onChange={(value) => updateCase((draft) => { draft.claimNumber = value; })} value={item.claimNumber || ''} />
        </div>
        {!isCleas ? (
          <label className="field">
            <span>Detalle de cobertura</span>
            <textarea onChange={(event) => updateCase((draft) => { draft.todoRisk.insurance.coverageDetail = event.target.value; })} value={todoRisk.insurance.coverageDetail} />
          </label>
        ) : null}
      </article>

      <article className="card inner-card">
        <div className="section-head small-gap">
          <h3>Datos del siniestro</h3>
          <StatusBadge tone="info">No bloquea cierre total</StatusBadge>
        </div>
        <div className={`form-grid ${isCleas ? 'four-columns' : 'three-columns'} compact-grid`}>
          <DataField label="Lugar de ocurrencia" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.location = value; })} value={todoRisk.incident.location} />
          <DataField label="Hora" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.time = value; })} value={todoRisk.incident.time} />
          {isCleas ? <DataField label="Dominio del 3ero" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.thirdPartyPlate = value.toUpperCase(); })} value={todoRisk.incident.thirdPartyPlate || ''} /> : null}
        </div>
        <label className="field">
          <span>Dinámica del siniestro</span>
          <textarea onChange={(event) => updateCase((draft) => { draft.todoRisk.incident.dynamics = event.target.value; })} value={todoRisk.incident.dynamics} />
        </label>
        {isCleas ? (
          <label className="field">
            <span>Observaciones</span>
            <textarea onChange={(event) => updateCase((draft) => { draft.todoRisk.incident.observations = event.target.value; })} value={todoRisk.incident.observations || ''} />
          </label>
        ) : null}
      </article>

      {!isCleas ? (
        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Franquicia</h3>
            <StatusBadge tone={getStatusTone(todoRisk.franchise.status)}>{todoRisk.franchise.status}</StatusBadge>
          </div>
          <div className="form-grid four-columns compact-grid">
            <SelectField label="Estado" onChange={(value) => updateCase((draft) => { draft.todoRisk.franchise.status = value; })} options={TODO_RIESGO_FRANCHISE_STATUS_OPTIONS} value={todoRisk.franchise.status} />
            <DataField label="Monto" onChange={(value) => updateCase((draft) => { draft.todoRisk.franchise.amount = value; })} value={todoRisk.franchise.amount} />
            <SelectField label="Recupero" onChange={(value) => updateCase((draft) => {
              draft.todoRisk.franchise.recoveryType = value;
              if (value !== 'Cía. del 3ero') draft.todoRisk.franchise.associatedCase = '';
              if (value !== 'Propia Cía.') draft.todoRisk.franchise.dictamen = '';
              if (!value) {
                draft.todoRisk.processing.presentedDate = '';
                draft.todoRisk.processing.derivedToInspectionDate = '';
                draft.todoRisk.processing.quoteStatus = 'Pendiente';
                draft.todoRisk.processing.quoteDate = '';
                draft.todoRisk.processing.agreedAmount = '';
              }
            })} options={TODO_RIESGO_RECOVERY_OPTIONS} placeholder="Seleccioná" value={todoRisk.franchise.recoveryType} />
            <DataField disabled={todoRisk.franchise.recoveryType !== 'Cía. del 3ero'} label="Caso asociado" onChange={(value) => updateCase((draft) => { draft.todoRisk.franchise.associatedCase = value; })} value={todoRisk.franchise.associatedCase} />
            <SelectField disabled={todoRisk.franchise.recoveryType !== 'Propia Cía.'} label="Dictamen" onChange={(value) => updateCase((draft) => { draft.todoRisk.franchise.dictamen = value; })} options={TODO_RIESGO_DICTAMEN_OPTIONS} placeholder="Seleccioná" value={todoRisk.franchise.dictamen} />
            <ToggleField label="Cotización supera Franquicia" onChange={(value) => updateCase((draft) => {
              draft.todoRisk.franchise.exceedsFranchise = value;
              if (value !== 'NO') draft.todoRisk.franchise.recoveryAmount = '';
            })} value={todoRisk.franchise.exceedsFranchise} />
            <DataField disabled={todoRisk.franchise.exceedsFranchise !== 'NO'} label="Monto a recuperar" onChange={(value) => updateCase((draft) => { draft.todoRisk.franchise.recoveryAmount = value; })} value={todoRisk.franchise.recoveryAmount} />
          </div>
          <label className="field">
            <span>Anotaciones</span>
            <textarea onChange={(event) => updateCase((draft) => { draft.todoRisk.franchise.notes = event.target.value; })} value={todoRisk.franchise.notes} />
          </label>
        </article>
      ) : null}

      <article className="card inner-card">
        <div className="section-head">
          <div>
            <h3>Documentación</h3>
            <p className="muted">Categorías y carga demo del trámite.</p>
          </div>
          <div className="tag-row">
            <button className="secondary-button" onClick={addDocument} type="button">Agregar ítem</button>
            <button className="secondary-button" onClick={() => flash('Descargar todo demo: se agruparían los adjuntos del trámite en un zip.') } type="button">Descargar todo</button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Tipo archivo / nombre</th>
                <th>Fecha de carga</th>
                <th>Observaciones</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {todoRisk.documentation.items.map((doc) => (
                <tr key={doc.id}>
                  <td><SelectField label="Categoría" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.documentation.items.find((entry) => entry.id === doc.id); target.category = value; })} options={TODO_RIESGO_DOC_CATEGORY_OPTIONS} value={doc.category} /></td>
                  <td><DataField label="Nombre" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.documentation.items.find((entry) => entry.id === doc.id); target.name = value; })} value={doc.name} /></td>
                  <td><DataField label="Fecha" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.documentation.items.find((entry) => entry.id === doc.id); target.uploadedAt = value; })} type="date" value={doc.uploadedAt} /></td>
                  <td><DataField label="Notas" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.documentation.items.find((entry) => entry.id === doc.id); target.notes = value; })} value={doc.notes} /></td>
                  <td><button className="ghost-button" onClick={() => updateCase((draft) => { draft.todoRisk.documentation.items = draft.todoRisk.documentation.items.filter((entry) => entry.id !== doc.id); })} type="button">Quitar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="card inner-card">
        <div className="section-head small-gap">
          <div>
            <h3>Tramitación</h3>
            <p className="muted">Cotización, autorización de repuestos y agenda simple.</p>
          </div>
          <StatusBadge tone={getStatusTone(item.computed.tramiteStatus)}>{item.computed.tramiteStatus}</StatusBadge>
        </div>

        <div className={`form-grid ${isCleas ? 'five-columns' : 'four-columns'} compact-grid`}>
          <DataField disabled={!canCompleteProcessingCore} label="Fecha presentado" onChange={(value) => updateCase((draft) => {
            draft.todoRisk.processing.presentedDate = value;
            if (!value) {
              draft.todoRisk.processing.derivedToInspectionDate = '';
              draft.todoRisk.processing.modality = TODO_RIESGO_MODALITY_OPTIONS[0];
              draft.todoRisk.processing.quoteStatus = 'Pendiente';
              draft.todoRisk.processing.quoteDate = '';
              draft.todoRisk.processing.agreedAmount = '';
            }
          })} type="date" value={todoRisk.processing.presentedDate} />
          <DataField disabled={processingLocked} label="Derivado a inspección" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.derivedToInspectionDate = value; })} type="date" value={todoRisk.processing.derivedToInspectionDate} />
          <SelectField disabled={processingLocked} label="Modalidad" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.modality = value; })} options={TODO_RIESGO_MODALITY_OPTIONS} value={todoRisk.processing.modality} />
          <DataField label="Mínimo para cierre" onChange={() => {}} readOnly value={item.computed.todoRisk.minimumClosingAmount} />
          <DataField label="Lleva repuestos" onChange={() => {}} readOnly value={item.computed.hasReplacementParts ? 'SI' : 'NO'} />
          {isCleas ? <DataField label="Dictamen actual" onChange={() => {}} readOnly value={dictamen} /> : null}
          <SelectField disabled={processingLocked} label="Cotización" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.quoteStatus = value; })} options={TODO_RIESGO_QUOTE_STATUS_OPTIONS} value={todoRisk.processing.quoteStatus} />
          <DataField disabled={processingLocked} label="Fecha cotización" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.quoteDate = value; })} type="date" value={todoRisk.processing.quoteDate} />
          <DataField disabled={processingLocked} invalid={todoRisk.processing.quoteStatus === 'Acordada' && !item.computed.todoRisk.amountMeetsMinimum} label="Monto acordado" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.agreedAmount = value; })} value={todoRisk.processing.agreedAmount} />
          {!isCleas ? <DataField label="Repuestos" onChange={() => {}} readOnly value={item.computed.todoRisk.partsAuthorization} /> : null}
          {isCleas && isFranchiseFlow ? <DataField disabled={processingLocked && dictamen !== 'En contra'} label="Monto de franquicia" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.franchiseAmount = value; })} value={todoRisk.processing.franchiseAmount || ''} /> : null}
          {isCleas && isFranchiseFlow && dictamen === 'En contra' ? <DataField label="A cargo del cliente" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.clientChargeAmount = value; })} placeholder="Definí monto manual" value={todoRisk.processing.clientChargeAmount || ''} /> : null}
          {isCleas && isFranchiseFlow && dictamen === 'En contra' ? <DataField label="Pago franquicia Cía." onChange={() => {}} readOnly value={item.computed.todoRisk.companyFranchisePaymentAmount} /> : null}
          <DataField label="Provee repuestos" onChange={() => {}} readOnly value={item.budget.partsProvider || 'Sin proveedor'} />
          <DataField label="A facturar Cía." onChange={() => {}} readOnly value={item.computed.todoRisk.amountToInvoice} />
          {isCleas && isFranchiseFlow && dictamen === 'En contra' ? <SelectField label="Estado pago cliente" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.clientChargeStatus = value; })} options={CLEAS_PAYMENT_STATUS_OPTIONS} value={todoRisk.processing.clientChargeStatus} /> : null}
          {isCleas && isFranchiseFlow && dictamen === 'En contra' ? <DataField label="Fecha pago cliente" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.clientChargeDate = value; })} type="date" value={todoRisk.processing.clientChargeDate || ''} /> : null}
        </div>

        {!canProgressFromPresentation ? (
          <div className="inline-alert danger-banner">Hasta definir fecha de presentación y dictamen no se habilitan inspección, cotización ni acciones operativas ligadas al trámite.</div>
        ) : null}

        {todoRisk.processing.quoteStatus === 'Acordada' && !item.computed.todoRisk.amountMeetsMinimum ? (
          <div className="inline-alert danger-banner">El monto acordado debe ser igual o mayor al mínimo para cierre traído desde Presupuesto.</div>
        ) : null}
        {isCleas && isFranchiseFlow && dictamen === 'En contra' && !item.computed.todoRisk.clientChargeDefined ? (
          <div className="inline-alert danger-banner">El PDF de referencia muestra este monto cargado de forma explícita: hasta definir "A cargo del cliente" no se deriva cuánto factura la compañía ni cuánto queda en pagos.</div>
        ) : null}
        {isCleas && isDamageTotal && dictamen === 'En contra' ? <div className="inline-alert info-banner">Este camino se considera cierre directo: no genera reparación normal ni campos de franquicia.</div> : null}
      </article>

      <article className="card inner-card">
        <div className="section-head small-gap todo-risk-agenda-head">
          <div>
            <h3>Agenda de tareas</h3>
            <p className="muted">Pendientes internos que impactan la completitud de Gestión del trámite.</p>
          </div>
          <div className="tag-row">
            <StatusBadge tone={agendaPendingCount ? 'danger' : 'success'}>
              {agendaPendingCount ? `${agendaPendingCount} pendiente(s)` : 'Sin pendientes'}
            </StatusBadge>
            <button className="secondary-button" onClick={addAgendaTask} type="button">Agregar tarea</button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>Tarea</th>
                <th>Descripción</th>
                <th>Fecha límite</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Responsable</th>
                <th>Hecho</th>
              </tr>
            </thead>
            <tbody>
              {todoRisk.processing.agenda.map((task) => {
                const normalizedTask = normalizeAgendaTask(task, { sourceArea: 'Gestión del trámite', sourceLabel: 'Gestión del trámite', relatedTab: 'tramite' });
                const dueMeta = getAgendaTaskDueMeta(normalizedTask.scheduledAt);

                return (
                  <tr className={`agenda-row is-${dueMeta.tone}`} key={task.id}>
                    <td><DataField label="Tarea" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.processing.agenda.find((entry) => entry.id === task.id); target.title = value; })} value={normalizedTask.title} /></td>
                    <td><DataField label="Descripción" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.processing.agenda.find((entry) => entry.id === task.id); target.description = value; })} value={normalizedTask.description} /></td>
                    <td>
                      <DataField label="Fecha límite" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.processing.agenda.find((entry) => entry.id === task.id); target.scheduledAt = value; })} type="date" value={normalizedTask.scheduledAt} />
                      <small>{dueMeta.label}</small>
                    </td>
                    <td><SelectField label="Prioridad" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.processing.agenda.find((entry) => entry.id === task.id); target.priority = value; })} options={TASK_PRIORITY_OPTIONS.map((value) => ({ value, label: getAgendaPriorityLabel(value) }))} value={normalizedTask.priority} /></td>
                    <td><SelectField label="Estado" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.processing.agenda.find((entry) => entry.id === task.id); setAgendaTaskStatus(target, value); })} options={TASK_STATUS_OPTIONS.map((value) => ({ value, label: getAgendaStatusLabel(value) }))} value={normalizedTask.status} /></td>
                    <td><SelectField label="Responsable" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.processing.agenda.find((entry) => entry.id === task.id); target.assignee = value; })} options={TODO_RIESGO_ASSIGNABLE_USERS} value={normalizedTask.assignee} /></td>
                    <td><input checked={normalizedTask.resolved} onChange={(event) => updateCase((draft) => { const target = draft.todoRisk.processing.agenda.find((entry) => entry.id === task.id); setAgendaTaskResolved(target, event.target.checked); })} type="checkbox" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

function DocumentacionTab({ item, updateCase, flash }) {
  if (!isThirdPartyWorkshopCase(item)) {
    return null;
  }

  const thirdParty = item.thirdParty;

  const addDocumentItem = () => {
    updateCase((draft) => {
      draft.thirdParty.claim.documents.push(createTodoRiskDocument());
    });
  };

  return (
    <div className="tab-layout">
      <article className="card inner-card todo-risk-summary-card">
        <div className="section-head small-gap">
          <div>
            <p className="eyebrow">Documentación</p>
            <h3>Carpeta base del reclamo</h3>
          </div>
          <StatusBadge tone={thirdParty.claim.documentationStatus === 'Completa' ? 'success' : 'danger'}>
            {thirdParty.claim.documentationStatus}
          </StatusBadge>
        </div>
        <div className="form-grid three-columns compact-grid">
          <SelectField
            label="Estado manual"
            onChange={(value) => updateCase((draft) => {
              draft.thirdParty.claim.documentationStatus = value;
              draft.thirdParty.claim.documentationAccepted = value === 'Completa';
            })}
            options={['Completa', 'Incompleta']}
            value={thirdParty.claim.documentationStatus}
          />
          <DataField label="Items cargados" onChange={() => {}} readOnly value={thirdParty.claim.documents.length} />
          <DataField label="Última carga" onChange={() => {}} readOnly value={thirdParty.claim.documents.reduce((latest, doc) => maxDate(latest, doc.uploadedAt), '')} type="date" />
        </div>
        {thirdParty.claim.documentationStatus === 'Incompleta' ? (
          <div className="inline-alert danger-banner">Carpeta con documentación pendiente. Cada vez que entrás a la carpeta aparece el aviso bloqueante hasta aceptar.</div>
        ) : (
          <div className="inline-alert info-banner">La documentación queda marcada como completa y no dispara el bloqueo de ingreso.</div>
        )}
      </article>

      <article className="card inner-card">
        <div className="section-head">
          <div>
            <h3>Documentos cargados</h3>
            <p className="muted">Demo manual con descarga masiva y edición simple por fila.</p>
          </div>
          <div className="tag-row">
            <button className="secondary-button" onClick={addDocumentItem} type="button">Agregar ítem</button>
            <button className="secondary-button" onClick={() => flash('Descargar todo demo: se prepararía un paquete único con toda la documentación del reclamo.')} type="button">Descargar todo</button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Tipo archivo / nombre</th>
                <th>Fecha de carga</th>
                <th>Observaciones</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {thirdParty.claim.documents.map((doc) => (
                <tr key={doc.id}>
                  <td><SelectField label="Categoría" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.claim.documents.find((entry) => entry.id === doc.id); target.category = value; })} options={TODO_RIESGO_DOC_CATEGORY_OPTIONS} value={doc.category} /></td>
                  <td><DataField label="Nombre" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.claim.documents.find((entry) => entry.id === doc.id); target.name = value; })} value={doc.name} /></td>
                  <td><DataField label="Fecha" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.claim.documents.find((entry) => entry.id === doc.id); target.uploadedAt = value; })} type="date" value={doc.uploadedAt} /></td>
                  <td><DataField label="Notas" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.claim.documents.find((entry) => entry.id === doc.id); target.notes = value; })} value={doc.notes} /></td>
                  <td><button className="ghost-button" onClick={() => updateCase((draft) => { draft.thirdParty.claim.documents = draft.thirdParty.claim.documents.filter((entry) => entry.id !== doc.id); })} type="button">Quitar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

function PresupuestoTab({ item, updateCase, flash }) {
  const [previewMedia, setPreviewMedia] = useState(null);
  const [failedMediaIds, setFailedMediaIds] = useState([]);
  const [brokenPreviewIds, setBrokenPreviewIds] = useState([]);

  const updateBudget = (mutator, { syncParts = false } = {}) => {
    updateCase((draft) => {
      mutator(draft);
      if (syncParts) {
        syncRepairPartsWithBudget(draft);
      }
    });
  };

  const updateBudgetLine = (lineId, mutator, { syncParts = false } = {}) => {
    updateBudget((draft) => {
      const target = draft.budget.lines.find((entry) => entry.id === lineId);
      if (!target) return;
      mutator(target, draft);
    }, { syncParts });
  };

  const addLine = () => {
    const current = item.budget.lines.at(-1);

    if (current && !lineIsComplete(current)) {
      flash('No se permite nueva linea si la actual no tiene pieza afectada, tarea a ejecutar y nivel de dano.');
      return;
    }

    updateBudget((draft) => {
      draft.budget.lines.push(createBudgetLine());
    }, { syncParts: true });
  };

  const removeLine = (lineId) => {
    if (item.budget.lines.length === 1) {
      flash('Necesitas al menos una linea de presupuesto.');
      return;
    }

    updateBudget((draft) => {
      draft.budget.lines = draft.budget.lines.filter((line) => line.id !== lineId);
    }, { syncParts: true });
  };

  const generateBudget = () => {
    if (!item.computed.canGenerateBudget) {
      flash('No se puede generar presupuesto sin informe completo y marcado como cerrado.');
      return;
    }

    updateBudget((draft) => {
      draft.budget.generated = true;
    }, { syncParts: true });
  };

  const changeReportStatus = (value) => {
    if (value === 'Informe cerrado') {
      if (!item.budget.workshop) {
        flash('Definí el taller antes de cerrar el informe.');
        return;
      }
      if (!item.computed.hasVehicleData) {
        const missing = item.computed.vehicleMissingFields.join(', ');
        flash(`No se puede cerrar el informe: falta ${missing || 'completar la ficha tecnica del vehiculo'}.`);
        return;
      }
      if (item.computed.pendingReplacementDecision) {
        flash(`Defini la decision interna de repuesto para ${item.computed.pendingReplacementDecision.piece || 'las lineas con REEMPLAZAR'} antes de cerrar.`);
        return;
      }
    }

    updateBudget((draft) => {
      draft.budget.reportStatus = value;
      if (value !== 'Informe cerrado') {
        draft.budget.generated = false;
      }
    });
  };

  const highlightLineErrors = item.budget.reportStatus === 'Informe cerrado';
  const workshopInfo = getWorkshopInfo(item.budget.workshop);
  const mediaItems = item.vehicleMedia ?? [];
  const vehicleSummary = [
    { label: 'Dominio', value: item.vehicle.plate || 'Pendiente' },
    { label: 'Marca / modelo', value: `${item.vehicle.brand || 'Pendiente'} ${item.vehicle.model || ''}`.trim() },
    { label: 'Ano', value: item.vehicle.year || 'Pendiente' },
    { label: 'Tipo', value: item.vehicle.type || 'Pendiente' },
    { label: 'Uso', value: item.vehicle.usage || 'Pendiente' },
    { label: 'Pintura', value: item.vehicle.paint || 'Pendiente' },
    { label: 'Color', value: item.vehicle.color || 'Pendiente' },
    { label: 'Motor', value: item.vehicle.engine || 'Pendiente' },
    { label: 'Chasis', value: item.vehicle.chassis || 'Pendiente' },
    { label: 'Caja', value: item.vehicle.transmission || 'Pendiente' },
    { label: 'Kilometraje', value: item.vehicle.mileage || 'Pendiente' },
  ];
  const customerDisplayName = `${item.customer.firstName || ''} ${item.customer.lastName || ''}`.trim() || 'Pendiente';
  const budgetStatusTone = item.computed.budgetReady ? 'success' : item.computed.canGenerateBudget ? 'info' : 'danger';
  const budgetStatusLabel = item.computed.budgetReady
    ? 'Presupuesto emitido y listo para Gestion reparacion'
    : item.computed.canGenerateBudget
      ? 'Informe cerrado. Falta generar el presupuesto final'
      : 'Presupuesto en rojo';
  const budgetHelperCopy = item.computed.budgetReady
    ? 'Los reemplazos ya quedaron sincronizados en Repuestos.'
    : item.computed.canGenerateBudget
      ? 'Al generar, los reemplazos se sincronizan en Repuestos.'
      : 'Completá taller, vehiculo, lineas, decision de reemplazo y mano de obra.';

  const markMediaThumbFailed = (mediaId) => {
    setFailedMediaIds((current) => (current.includes(mediaId) ? current : [...current, mediaId]));
  };

  const markPreviewFailed = (mediaId) => {
    setBrokenPreviewIds((current) => (current.includes(mediaId) ? current : [...current, mediaId]));
  };

  const currentPreviewBroken = previewMedia ? brokenPreviewIds.includes(previewMedia.id) : false;
  const showAccessoryBlock = item.tramiteType !== 'Particular';
  const accessoryTotal = (item.budget.accessoryWorks || []).reduce((sum, entry) => sum + numberValue(entry.amount), 0);

  const addAccessoryWork = () => {
    updateBudget((draft) => {
      draft.budget.accessoryWorkEnabled = 'SI';
      draft.budget.accessoryWorks = [...(draft.budget.accessoryWorks || []), createAccessoryWork()];
    });
  };

  const removeAccessoryWork = (workId) => {
    updateBudget((draft) => {
      draft.budget.accessoryWorks = (draft.budget.accessoryWorks || []).filter((entry) => entry.id !== workId);
      if (!draft.budget.accessoryWorks.length) {
        draft.budget.accessoryWorks = [createAccessoryWork()];
        draft.budget.accessoryWorkEnabled = 'NO';
      }
    });
  };

  return (
    <div className="tab-layout budget-layout">
      <div className="budget-main-grid">
        <article className="card inner-card workshop-shell">
          <div className="section-head">
            <div>
              <p className="eyebrow">Presupuesto {item.tramiteType ?? 'Particular'}</p>
              <h3>{item.budget.workshop || 'Seleccioná el taller'}</h3>
            </div>
            <div className="form-grid three-columns compact-grid inline-fields">
              <SelectField
                invalid={!item.budget.workshop && item.budget.reportStatus === 'Informe cerrado'}
                label="Taller"
                onChange={(value) => updateBudget((draft) => { draft.budget.workshop = value; })}
                options={WORKSHOP_OPTIONS}
                placeholder="Seleccioná un taller"
                required
                value={item.budget.workshop}
              />
              <SelectField label="Autorizó" onChange={(value) => updateBudget((draft) => { draft.budget.authorizer = value; })} options={AUTHORIZER_OPTIONS} value={item.budget.authorizer} />
              <SelectField label="Informe" onChange={changeReportStatus} options={REPORT_STATUS_OPTIONS} value={item.budget.reportStatus} />
            </div>
          </div>

          <div className="workshop-banner">
            <div className="workshop-identity">
              <div className="workshop-logo-shell" aria-hidden="true">
                {workshopInfo?.logo ? <img alt="" src={workshopInfo.logo} /> : <span>DT</span>}
              </div>
              <div className="workshop-copy">
                <span className="workshop-kicker">Cabecera por taller</span>
                <strong>{workshopInfo?.legalName || 'Datos comerciales pendientes'}</strong>
                <small>{workshopInfo ? `${workshopInfo.taxId} · ${workshopInfo.taxCondition}` : 'Agregá el taller para ver CUIT y condición impositiva.'}</small>
                <small>{workshopInfo ? `${workshopInfo.address} · ${workshopInfo.phone}` : ''}</small>
                <small>{workshopInfo?.email}</small>
              </div>
            </div>
            <div className="budget-workshop-status">
              <StatusBadge tone={item.computed.reportClosed ? 'success' : 'danger'}>
                {item.budget.reportStatus}
              </StatusBadge>
              <StatusBadge tone={budgetStatusTone}>{budgetStatusLabel}</StatusBadge>
            </div>
          </div>

          <div className="vehicle-summary-card">
            <div className="vehicle-summary-head">
              <div>
                <span>Vehiculo desde Ficha Tecnica</span>
                <strong>{item.vehicle.brand || 'Pendiente'} {item.vehicle.model || ''}</strong>
                <small>Se espejan los datos del vehiculo; las observaciones quedan fuera de esta cabecera.</small>
              </div>
              <div className="vehicle-summary-owner">
                <span>Cliente</span>
                <strong>{customerDisplayName}</strong>
                <small>{item.customer.phone || 'Telefono pendiente'}</small>
              </div>
            </div>
            <div className="vehicle-meta-grid">
              {vehicleSummary.map((entry) => (
                <div key={entry.label}>
                  <span>{entry.label}</span>
                  <strong>{entry.value}</strong>
                </div>
              ))}
            </div>
            {!item.computed.hasVehicleData ? (
              <div className="inline-alert danger-banner">
                No podés cerrar el informe hasta completar en Ficha Tecnica: {item.computed.vehicleMissingFields.join(', ')}.
              </div>
            ) : null}
          </div>

          <div className="media-mock-grid budget-header-grid">
            <article>
              <span>Informe</span>
              <strong>{item.budget.reportStatus}</strong>
              <small>Datos espejo del Excel Particular</small>
            </article>
            <article>
              <span>Repuestos cotizados</span>
              <strong>{item.budget.partsProvider || 'Sin proveedor'}</strong>
              <small>{item.budget.partsQuotedDate ? `Fecha ${formatDate(item.budget.partsQuotedDate)}` : 'Falta fecha de cotización'}</small>
            </article>
            <article>
              <span>Días estimados</span>
              <strong>{item.budget.estimatedWorkDays || 'Pendiente'}</strong>
              <small>Mínimo cierre MO {item.budget.minimumLaborClose ? money(item.budget.minimumLaborClose) : 'sin dato'}</small>
            </article>
          </div>
        </article>

        <article className="card inner-card media-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Fotos y videos</p>
              <h3>Evidencia de daños</h3>
            </div>
            <StatusBadge tone={mediaItems.length ? 'info' : 'danger'}>
              {mediaItems.length ? `${mediaItems.length} adjunto(s)` : 'Sin archivos'}
            </StatusBadge>
          </div>

          {mediaItems.length ? (
            <div className="media-gallery">
              {mediaItems.map((media) => (
                <button
                  aria-label={`Abrir ${media.type === 'video' ? 'video' : 'foto'} ${media.label}`}
                  className="media-card"
                  key={media.id}
                  onClick={() => setPreviewMedia(media)}
                  type="button"
                >
                  {media.thumbnail && !failedMediaIds.includes(media.id) ? (
                    <img
                      alt=""
                      className="media-card-image"
                      onError={() => markMediaThumbFailed(media.id)}
                      src={media.thumbnail}
                    />
                  ) : (
                    <div className="media-card-fallback" aria-hidden="true">
                      <strong>{media.type === 'video' ? 'VIDEO' : 'ARCHIVO'}</strong>
                      <small>Preview no disponible</small>
                    </div>
                  )}
                  <span className="media-card-scrim" aria-hidden="true" />
                  <span>{media.label}</span>
                  <small>{media.description || (media.type === 'video' ? 'Video' : 'Foto')}</small>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-media" role="status">
              Cargá las fotos en Ficha Técnica &gt; Ingreso para verlas acá mientras presupuestás.
            </div>
          )}
        </article>
      </div>

      <article className="card inner-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Lineas del informe</p>
            <h3>Columnas del Excel</h3>
          </div>
          <button className="secondary-button" onClick={addLine} type="button">Agregar linea</button>
        </div>

        <div className="budget-lines">
          {item.budget.lines.map((line, index) => {
            const lineIssues = getBudgetLineIssues(line);
            const isReplacementLine = lineNeedsReplacementDecision(line);

            return (
            <div className="budget-line budget-line-extended" key={line.id}>
              <div className="budget-line-header">
                <strong>Linea {index + 1}</strong>
                <small>{line.action || 'Definí la tarea para derivar la accion'}</small>
              </div>
              <DataField label="Pieza afectada" onChange={(value) => updateBudgetLine(line.id, (target) => {
                target.piece = value;
              }, { syncParts: true })} required value={line.piece} invalid={!line.piece && highlightLineErrors} />
              <SelectField
                label="Tarea a ejecutar"
                onChange={(value) => updateBudgetLine(line.id, (target) => {
                  target.task = value;
                  target.action = getBudgetAction(value);
                  if (!lineNeedsReplacementDecision({ task: value })) {
                    target.replacementDecision = '';
                    target.partPrice = '';
                  }
                }, { syncParts: true })}
                options={BUDGET_TASK_OPTIONS}
                placeholder="Seleccioná una tarea"
                required
                value={line.task}
                invalid={!line.task && highlightLineErrors}
              />
              <SelectField
                label="Nivel de daño"
                onChange={(value) => updateBudgetLine(line.id, (target) => {
                  target.damageLevel = value;
                })}
                options={BUDGET_DAMAGE_OPTIONS}
                placeholder="Seleccioná el daño"
                required
                value={line.damageLevel}
                invalid={!line.damageLevel && highlightLineErrors}
              />
              <SelectField
                label="Decision interna"
                onChange={(value) => updateBudgetLine(line.id, (target) => {
                  target.replacementDecision = value;
                }, { syncParts: true })}
                options={BUDGET_PART_DECISION_OPTIONS}
                placeholder={isReplacementLine ? 'Definí si reemplaza o repara' : 'No aplica'}
                value={line.replacementDecision}
                invalid={isReplacementLine && !line.replacementDecision && highlightLineErrors}
              />
              <DataField
                label="$ repuesto"
                inputMode="numeric"
                onChange={(value) => updateBudgetLine(line.id, (target) => {
                  target.partPrice = value;
                }, { syncParts: true })}
                placeholder={isReplacementLine ? 'Opcional si reemplaza' : 'Sin repuesto'}
                readOnly={!isReplacementLine}
                value={line.partPrice}
              />
              {highlightLineErrors && lineIssues.length ? (
                <div className="inline-alert danger-banner budget-line-alert">
                  Falta completar: {lineIssues.join(', ')}.
                </div>
              ) : null}
              <div className="budget-line-footer">
                <div className="budget-line-meta">
                  <StatusBadge tone={lineIsComplete(line) ? 'success' : 'danger'}>
                    {lineIsComplete(line) ? 'Linea completa' : 'Falta completar'}
                  </StatusBadge>
                  {isReplacementLine ? (
                    <StatusBadge tone={line.replacementDecision ? 'info' : 'danger'}>
                      {line.replacementDecision || 'Sin decision'}
                    </StatusBadge>
                  ) : null}
                  <small>{line.action || 'Definí la tarea para derivar acción'}</small>
                </div>
                <button className="ghost-button" onClick={() => removeLine(line.id)} type="button">Eliminar linea</button>
              </div>
            </div>
            );
          })}
        </div>
      </article>

      <article className="card inner-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Servicios adicionales</p>
            <h3>Checklist del Excel con desplegables</h3>
          </div>
          <StatusBadge tone="info">SI / NO / A/V</StatusBadge>
        </div>

        <div className="budget-services-grid">
          {item.budget.services.map((service) => (
            <div className="nested-card budget-service-card" key={service.id}>
              <div className="section-head small-gap">
                <strong>{service.label}</strong>
                <StatusBadge tone={service.status === 'SI' ? 'success' : service.status === 'A/V' ? 'info' : 'danger'}>
                  {service.status || 'NO'}
                </StatusBadge>
              </div>
              <SelectField
                label="Aplica"
                onChange={(value) => updateBudget((draft) => {
                  const target = draft.budget.services.find((entry) => entry.id === service.id);
                  target.status = value;
                  if (value === 'NO') {
                    target.detail = '';
                  }
                })}
                options={YES_NO_AV_OPTIONS}
                value={service.status}
              />
              <DataField
                label="Detalle"
                onChange={(value) => updateBudget((draft) => {
                  const target = draft.budget.services.find((entry) => entry.id === service.id);
                  target.detail = value;
                })}
                placeholder="Detalle interno"
                value={service.detail}
              />
            </div>
          ))}
        </div>
      </article>

      {showAccessoryBlock ? (
        <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Trabajos accesorios</p>
              <h3>Bloque demo fuera del reclamo a la compañía</h3>
            </div>
            <div className="tag-row">
              <StatusBadge tone={item.budget.accessoryWorkEnabled === 'SI' ? 'info' : 'danger'}>
                {item.budget.accessoryWorkEnabled === 'SI' ? 'Activo' : 'Sin extras'}
              </StatusBadge>
              <button className="secondary-button" onClick={addAccessoryWork} type="button">Agregar trabajo accesorio</button>
            </div>
          </div>

          <div className="form-grid three-columns compact-grid">
            <ToggleField label="Hay trabajos accesorios" onChange={(value) => updateBudget((draft) => { draft.budget.accessoryWorkEnabled = value; })} value={item.budget.accessoryWorkEnabled || 'NO'} />
            <DataField label="Total accesorio demo" onChange={() => {}} readOnly value={accessoryTotal} />
            <DataField label="Impacta compañía" onChange={() => {}} readOnly value="No, queda separado" />
          </div>

          {item.budget.accessoryWorkEnabled === 'SI' ? (
            <div className="budget-lines">
              {(item.budget.accessoryWorks || []).map((work) => (
                <div className="budget-line" key={work.id}>
                  <DataField label="Detalle" onChange={(value) => updateBudget((draft) => { const target = draft.budget.accessoryWorks.find((entry) => entry.id === work.id); target.detail = value; })} value={work.detail} />
                  <DataField label="Monto" onChange={(value) => updateBudget((draft) => { const target = draft.budget.accessoryWorks.find((entry) => entry.id === work.id); target.amount = value; })} value={work.amount} />
                   {isThirdPartyClaimCase(item) ? <ToggleField label="Incluye reemplazo" onChange={(value) => updateBudget((draft) => { const target = draft.budget.accessoryWorks.find((entry) => entry.id === work.id); target.includesReplacement = value; if (value !== 'SI') { target.replacementPiece = ''; target.replacementAmount = ''; } })} value={work.includesReplacement || 'NO'} /> : <DataField label="Cobro" onChange={() => {}} readOnly value="Cliente / demo" />}
                   {isThirdPartyClaimCase(item) && work.includesReplacement === 'SI' ? <DataField label="Pieza reemplazo" onChange={(value) => updateBudget((draft) => { const target = draft.budget.accessoryWorks.find((entry) => entry.id === work.id); target.replacementPiece = value; })} value={work.replacementPiece || ''} /> : null}
                   {isThirdPartyClaimCase(item) && work.includesReplacement === 'SI' ? <DataField label="Monto reemplazo" onChange={(value) => updateBudget((draft) => { const target = draft.budget.accessoryWorks.find((entry) => entry.id === work.id); target.replacementAmount = value; })} value={work.replacementAmount || ''} /> : null}
                   {isThirdPartyClaimCase(item) ? <DataField label="Cobro" onChange={() => {}} readOnly value="Cliente / tramo particular" /> : null}
                  <button className="ghost-button" onClick={() => removeAccessoryWork(work.id)} type="button">Quitar</button>
                </div>
              ))}
            </div>
          ) : null}

          <label className="field">
            <span>Anotaciones accesorios</span>
            <textarea onChange={(event) => updateBudget((draft) => { draft.budget.accessoryNotes = event.target.value; })} value={item.budget.accessoryNotes || ''} />
          </label>
        </article>
      ) : null}

      <article className="card inner-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Cierre económico</p>
            <h3>Totales y condiciones para emitir</h3>
          </div>
        </div>

        <div className="form-grid three-columns compact-grid">
          <DataField label="Fecha cotización repuestos" onChange={(value) => updateBudget((draft) => { draft.budget.partsQuotedDate = value; })} type="date" value={item.budget.partsQuotedDate} />
          <DataField label="Proveedor repuestos" onChange={(value) => updateBudget((draft) => { draft.budget.partsProvider = value; })} value={item.budget.partsProvider} />
          <DataField label="Dias de trabajo estimados" onChange={(value) => updateBudget((draft) => { draft.budget.estimatedWorkDays = value; })} type="number" value={item.budget.estimatedWorkDays} />
          <DataField label="Monto minimo cierre MO" inputMode="numeric" onChange={(value) => updateBudget((draft) => { draft.budget.minimumLaborClose = value; })} value={item.budget.minimumLaborClose} />
          <DataField label="Mano de obra s/IVA" inputMode="numeric" onChange={(value) => updateBudget((draft) => { draft.budget.laborWithoutVat = value; })} value={item.budget.laborWithoutVat} />
          <DataField label="IVA 21% MO" onChange={() => {}} readOnly value={item.computed.laborVat} />
        </div>

        <label className="field">
          <span>Observaciones internas</span>
          <textarea onChange={(event) => updateBudget((draft) => { draft.budget.observations = event.target.value; })} value={item.budget.observations} />
        </label>

        <div className="budget-totals-stack">
          <div className="budget-subtotals-grid">
            <article className="summary-chip budget-total-card">
              <span>Repuestos</span>
              <strong>{money(item.computed.partsTotal)}</strong>
            </article>
            <article className="summary-chip budget-total-card">
              <span>MO s/IVA</span>
              <strong>{money(item.computed.laborWithoutVat)}</strong>
            </article>
            <article className="summary-chip budget-total-card">
              <span>IVA 21%</span>
              <strong>{money(item.computed.laborVat)}</strong>
            </article>
            <article className="summary-chip budget-total-card">
              <span>MO c/IVA</span>
              <strong>{money(item.computed.laborWithVat)}</strong>
            </article>
          </div>

          <article className="summary-chip budget-total-card budget-total-card-emphasis budget-total-summary">
            <span>Total presupuesto</span>
            <strong>{money(item.computed.budgetTotalWithVat)}</strong>
          </article>
        </div>

        <div className="budget-actions-row">
          <button className="primary-button" disabled={!item.computed.canGenerateBudget} onClick={generateBudget} type="button">Generar presupuesto</button>
        </div>

        <div className="budget-ready-panel budget-ready-panel-compact">
          <StatusBadge tone={budgetStatusTone}>{budgetStatusLabel}</StatusBadge>
          <small>{budgetHelperCopy}</small>
        </div>
      </article>

      {previewMedia ? (
        <div className="media-overlay" onClick={() => setPreviewMedia(null)} role="presentation">
          <div aria-label={`Vista ampliada de ${previewMedia.label}`} aria-modal="true" className="media-modal" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="media-modal-head">
              <div>
                <strong>{previewMedia.label}</strong>
                <p>{previewMedia.description || (previewMedia.type === 'video' ? 'Video adjunto desde Ficha Tecnica.' : 'Foto adjunta desde Ficha Tecnica.')}</p>
              </div>
              <button className="ghost-button" onClick={() => setPreviewMedia(null)} type="button">Cerrar</button>
            </div>

            {previewMedia.type === 'video' ? (
              currentPreviewBroken ? (
                <div className="empty-media" role="status">
                  El archivo no se pudo previsualizar. Abrilo en una pestaña nueva para revisar el adjunto original.
                </div>
              ) : (
                <video controls onError={() => markPreviewFailed(previewMedia.id)} src={previewMedia.url} />
              )
            ) : (
              currentPreviewBroken ? (
                <div className="empty-media" role="status">
                  La imagen no cargó en la previsualización. Usá "Abrir archivo" para validarla igual.
                </div>
              ) : (
                <img alt={previewMedia.label} onError={() => markPreviewFailed(previewMedia.id)} src={previewMedia.url} />
              )
            )}

            <div className="media-preview-actions">
              <a className="secondary-button button-link" href={previewMedia.url} rel="noreferrer" target="_blank">Abrir archivo</a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GestionReparacionTab({ item, updateCase, activeRepairTab, onChangeRepairTab, flash }) {
  const [previewMedia, setPreviewMedia] = useState(null);
  const [failedMediaIds, setFailedMediaIds] = useState([]);
  const [brokenPreviewIds, setBrokenPreviewIds] = useState([]);

  const addRepairFollowUpTask = () => {
    updateCase((draft) => {
      const targetAgenda = draft.lawyer?.agenda || draft.todoRisk?.processing?.agenda;

      if (!targetAgenda) {
        return;
      }

      targetAgenda.push(createTodoRiskTask({
        title: 'Seguimiento operativo de reparación',
        description: 'Controlar repuestos, turno o salida estimada desde la solapa de reparación.',
        scheduledAt: draft.repair.turno.date || todayIso(),
        assignee: TODO_RIESGO_ASSIGNABLE_USERS[0],
        priority: 'media',
        status: 'pendiente',
        sourceArea: 'Gestión reparación',
        sourceLabel: 'Gestión reparación',
        relatedTab: draft.lawyer?.agenda ? 'abogado' : 'tramite',
        relatedSubtab: activeRepairTab,
        linkedCaseId: draft.id,
        linkedCaseCode: draft.code,
      }));
    });
  };

  const syncBudgetParts = (resetRemoved = false) => {
    updateCase((draft) => {
      if (resetRemoved) {
        draft.repair.removedBudgetLineIds = [];
      }
      syncRepairPartsWithBudget(draft);
    });
  };

  const removeRepairPart = (partId) => {
    updateCase((draft) => {
      const target = draft.repair.parts.find((entry) => entry.id === partId);
      if (!isThirdPartyWorkshopCase(draft) && target?.source === 'budget' && target.sourceLineId) {
        draft.repair.removedBudgetLineIds = [...new Set([...(draft.repair.removedBudgetLineIds || []), target.sourceLineId])];
      }
      draft.repair.parts = draft.repair.parts.filter((entry) => entry.id !== partId);
    });
  };

  const assignTurn = () => {
    if (!item.computed.budgetReady) {
      flash('Gestion reparacion sigue bloqueada hasta que Presupuesto quede completo y generado.');
      return;
    }

    if (isInsuranceWorkflowCase(item) && !item.computed.todoRisk.quoteAgreed && !item.todoRisk.processing.adminTurnOverride) {
      flash('Bloqueado: para Todo Riesgo necesitás cotización acordada con fecha y monto. Solo admin mock puede forzar la excepción visual.');
      return;
    }

    if (!item.computed.turnoReady) {
      flash('No se puede agendar turno si faltan fecha, dias estimados, salida estimada y estado.');
      return;
    }

    if (isInsuranceWorkflowCase(item)) {
      const pendingParts = item.repair.parts.filter((part) => part.authorized === 'SI' && part.state !== 'Recibido');
      if (pendingParts.length) {
        const confirmed = window.confirm('Hay repuestos autorizados pendientes. ¿Querés agendar igual y registrar recordatorio en la agenda del trámite?');
        if (!confirmed) {
          return;
        }

        updateCase((draft) => {
          draft.todoRisk.processing.agenda.push(createTodoRiskTask({
            title: `Recordar seguimiento por ${pendingParts.length} repuesto(s) pendiente(s) antes del ingreso.`,
            description: 'Recordatorio automático disparado al agendar turno con repuestos autorizados todavía pendientes.',
            scheduledAt: draft.repair.turno.date || '',
            assignee: TODO_RIESGO_ASSIGNABLE_USERS[0],
            priority: 'alta',
            status: 'pendiente',
            resolved: false,
            sourceArea: 'Gestión reparación',
            sourceLabel: 'Gestión reparación',
            relatedTab: 'tramite',
            relatedSubtab: activeRepairTab,
            linkedCaseId: draft.id,
            linkedCaseCode: draft.code,
          }));
        });
      }
    }

    flash('Turno demo agendado. La salida estimada excluye fines de semana.');
  };

  const addRepairPart = () => {
    updateCase((draft) => {
      draft.repair.parts.push(createRepairPart());
    });
  };

  const addIngresoItem = () => {
    updateCase((draft) => {
      if (!draft.repair.ingreso.items) {
        draft.repair.ingreso.items = [];
      }
      draft.repair.ingreso.items.push(createIngresoItem());
    });
  };

  const markMediaThumbFailed = (mediaId) => {
    setFailedMediaIds((current) => (current.includes(mediaId) ? current : [...current, mediaId]));
  };

  const markPreviewFailed = (mediaId) => {
    setBrokenPreviewIds((current) => (current.includes(mediaId) ? current : [...current, mediaId]));
  };

  const repairTabs = [
    { id: 'repuestos', label: 'Repuestos' },
    { id: 'turno', label: 'Turno' },
    { id: 'ingreso', label: 'Ingreso' },
    { id: 'egreso', label: 'Egreso' },
  ];
  const autoPartCount = item.repair.parts.filter((part) => part.source === 'budget').length;
  const manualPartCount = item.repair.parts.filter((part) => part.source !== 'budget').length;
  const overriddenPartCount = item.repair.parts.filter((part) => part.source === 'budget' && part.amount !== part.budgetAmount).length;
  const removedBudgetLineIds = item.repair.removedBudgetLineIds || [];
  const expectedBudgetPartsSignature = item.computed.budgetParts
    .filter((part) => !removedBudgetLineIds.includes(part.lineId))
    .map((part) => `${part.lineId}:${part.name}:${part.amount}:${part.replacementDecision || ''}`)
    .join('|');
  const currentBudgetPartsSignature = item.repair.parts
    .filter((part) => part.source === 'budget')
    .map((part) => `${part.sourceLineId}:${part.name}:${part.budgetAmount || part.amount}`)
    .join('|');
  const expectedQuoteSignature = buildThirdPartyBudgetParts(item.budget.lines, item.budget.accessoryWorks)
    .map((part) => `${part.lineId}:${part.name}:${part.amount}`)
    .join('|');
  const currentQuoteSignature = (item.repair.quoteRows || [])
    .map((row) => `${row.sourceLineId}:${row.piece}`)
    .join('|');
  const repairedMediaItems = item.repair.egreso.repairedMedia || [];
  const currentPreviewBroken = previewMedia ? brokenPreviewIds.includes(previewMedia.id) : false;
  const thirdPartyRepairTab = ['repuestos', 'turno'].includes(activeRepairTab) ? activeRepairTab : 'repuestos';

  useEffect(() => {
    if (activeRepairTab !== 'repuestos') {
      return;
    }

    if (isThirdPartyClaimCase(item)) {
      if (expectedQuoteSignature !== currentQuoteSignature) {
        updateCase((draft) => {
          syncThirdPartyQuoteRowsWithBudget(draft);
        });
      }
      return;
    }

    if (expectedBudgetPartsSignature !== currentBudgetPartsSignature) {
      syncBudgetParts();
    }
  }, [activeRepairTab, currentBudgetPartsSignature, currentQuoteSignature, expectedBudgetPartsSignature, expectedQuoteSignature, item, updateCase]);

  if (isThirdPartyClaimCase(item)) {
    const bestQuoteSubtotal = item.computed.thirdParty.subtotalBestQuote;
    const receivedPartsCount = item.repair.parts.filter((part) => part.state === 'Recibido').length;
    const isLawyer = isThirdPartyLawyerCase(item);
    const noRepairNeeded = isLawyer && item.lawyer.repairVehicle === 'NO';

    return (
      <div className="tab-layout">
        <article className="card inner-card todo-risk-summary-card">
          <div className="section-head small-gap">
            <div>
              <h3>Gestión reparación - Reclamo de Tercero</h3>
              <p className="muted">Podés dejar seguimiento manual y también se crean recordatorios automáticos cuando el turno queda condicionado.</p>
            </div>
            <div className="tag-row">
              <StatusBadge tone={getStatusTone(item.computed.repairStatus)}>{item.computed.repairStatus}</StatusBadge>
              <button className="secondary-button" onClick={addRepairFollowUpTask} type="button">Crear tarea</button>
            </div>
          </div>
          <div className="form-grid five-columns compact-grid">
            <DataField label={isLawyer && item.lawyer.instance === 'Judicial' ? 'N° CUIJ' : 'N° de siniestro'} onChange={() => {}} readOnly value={isLawyer && item.lawyer.instance === 'Judicial' ? item.lawyer.cuij || '' : item.claimNumber || ''} />
            <DataField label="Taller" onChange={() => {}} readOnly value={item.budget.workshop || 'Pendiente'} />
            <DataField label="Piezas a cotizar" onChange={() => {}} readOnly value={item.repair.quoteRows?.length || 0} />
            <DataField label="Subtotal mejor cotización" onChange={() => {}} readOnly value={bestQuoteSubtotal} />
            <DataField label="Total final repuestos" onChange={() => {}} readOnly value={item.computed.thirdParty.totalFinalParts} />
          </div>
          {noRepairNeeded ? <div className="inline-alert info-banner">Repara vehículo = NO: no se exige reparación normal y esta solapa queda resuelta como trazabilidad operativa.</div> : null}
        </article>

        <div className="subtabs-row third-party-repair-tabs">
          {[
            { id: 'repuestos', label: 'Planilla de cotizaciones' },
            { id: 'turno', label: 'Gestión de pedidos' },
          ].map((tab) => (
            <button className={`subtab-button ${thirdPartyRepairTab === tab.id ? 'is-active' : ''}`} key={tab.id} onClick={() => onChangeRepairTab(tab.id)} type="button">
              {tab.label}
            </button>
          ))}
        </div>

        {thirdPartyRepairTab === 'repuestos' ? (
          <article className="card inner-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Planilla de cotizaciones</p>
                <h3>Piezas traídas desde Presupuesto</h3>
              </div>
              <div className="tag-row">
                <StatusBadge tone={item.repair.quoteRows?.length ? 'info' : 'danger'}>{item.repair.quoteRows?.length || 0} pieza(s)</StatusBadge>
                <button className="secondary-button" onClick={() => updateCase((draft) => { syncThirdPartyQuoteRowsWithBudget(draft); })} type="button">Actualizar desde Presupuesto</button>
              </div>
            </div>

            <div className="inline-alert info-banner">Se incluyen automáticamente las piezas a reemplazar del Presupuesto y también los trabajos extras que tengan repuestos asociados. La pieza se cotiza aunque internamente después se decida reparar.</div>

            <div className="parts-total-grid third-party-summary-grid">
              <article className="summary-chip">
                <span>Subtotal mejor cotización</span>
                <strong>{money(bestQuoteSubtotal)}</strong>
              </article>
              <article className="summary-chip">
                <span>Mínimo repuestos</span>
                <strong>{money(item.computed.thirdParty.minimumParts)}</strong>
              </article>
              <article className="summary-chip">
                <span>Piezas sincronizadas</span>
                <strong>{item.repair.quoteRows?.length || 0}</strong>
              </article>
            </div>

            <div className="table-wrap">
              <table className="data-table compact-table third-party-quote-table">
                <thead>
                  <tr>
                    <th>Pieza</th>
                    <th>Cotización 1</th>
                    <th>Cotización 2</th>
                    <th>Cotización 3</th>
                    <th>Cotización 4</th>
                    <th>Mejor</th>
                    <th>Facturación</th>
                    <th>Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {(item.repair.quoteRows || []).map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="table-piece-cell">
                          <strong>{row.piece}</strong>
                          <small>{row.source === 'budget' ? 'Sincronizado desde Presupuesto' : 'Carga manual'}</small>
                        </div>
                      </td>
                      <td><DataField label="Cotización 1" onChange={(value) => updateCase((draft) => { const target = draft.repair.quoteRows.find((entry) => entry.id === row.id); target.provider1 = value; })} value={row.provider1} /></td>
                      <td><DataField label="Cotización 2" onChange={(value) => updateCase((draft) => { const target = draft.repair.quoteRows.find((entry) => entry.id === row.id); target.provider2 = value; })} value={row.provider2} /></td>
                      <td><DataField label="Cotización 3" onChange={(value) => updateCase((draft) => { const target = draft.repair.quoteRows.find((entry) => entry.id === row.id); target.provider3 = value; })} value={row.provider3} /></td>
                      <td><DataField label="Cotización 4" onChange={(value) => updateCase((draft) => { const target = draft.repair.quoteRows.find((entry) => entry.id === row.id); target.provider4 = value; })} value={row.provider4} /></td>
                      <td><strong>{money(getBestQuoteValue(row))}</strong></td>
                      <td><SelectField label="Facturación" onChange={(value) => updateCase((draft) => { const target = draft.repair.quoteRows.find((entry) => entry.id === row.id); target.billing = value; })} options={THIRD_PARTY_BILLING_OPTIONS} value={row.billing} /></td>
                      <td><SelectField label="Pago" onChange={(value) => updateCase((draft) => { const target = draft.repair.quoteRows.find((entry) => entry.id === row.id); target.paymentMethod = value; })} options={THIRD_PARTY_PAYMENT_OPTIONS} value={row.paymentMethod} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ) : null}

        {thirdPartyRepairTab === 'turno' ? (
          <article className="card inner-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Gestión de pedidos</p>
                <h3>Carga manual y etiquetas demo</h3>
              </div>
              <div className="tag-row">
                <StatusBadge tone={item.repair.parts.length ? 'info' : 'danger'}>{item.repair.parts.length} repuesto(s)</StatusBadge>
                <button className="secondary-button" onClick={() => flash('Imprimir etiquetas demo: se generarían las etiquetas con carpeta, inventario y código de pieza.')} type="button">Imprimir etiquetas</button>
                <button className="secondary-button" onClick={addRepairPart} type="button">Agregar repuesto</button>
              </div>
            </div>

            <div className="parts-total-grid third-party-summary-grid">
              <article className="summary-chip">
                <span>Total final repuestos</span>
                <strong>{money(item.computed.thirdParty.totalFinalParts)}</strong>
              </article>
              <article className="summary-chip">
                <span>Recibidos</span>
                <strong>{receivedPartsCount}</strong>
              </article>
              <article className="summary-chip">
                <span>Pendientes / gestión</span>
                <strong>{Math.max(item.repair.parts.length - receivedPartsCount, 0)}</strong>
              </article>
            </div>

            <div className="budget-lines">
              {item.repair.parts.length ? (
                item.repair.parts.map((part, index) => (
                  <div className="budget-line repair-part-line third-party-order-line" key={part.id}>
                    <div className="budget-line-header">
                      <strong>{part.name || 'Nuevo repuesto'}</strong>
                      <small>N° inventario {getThirdPartyInventoryCode(item.code, index)}</small>
                    </div>
                    <DataField disabled={noRepairNeeded} label="Repuesto" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.name = value;
                    })} value={part.name} />
                    <DataField disabled={noRepairNeeded} label="Importe" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.amount = value;
                    })} value={part.amount} />
                    <DataField disabled={noRepairNeeded} label="Proveedor" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.provider = value;
                    })} value={part.provider} />
                    <SelectField disabled={noRepairNeeded} label="Estado" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.state = value;
                      if (value !== 'Recibido') {
                        target.receivedDate = '';
                      }
                    })} options={THIRD_PARTY_ORDER_STATE_OPTIONS} value={part.state} />
                    <DataField disabled={noRepairNeeded} label="Fecha recibido" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.receivedDate = value;
                      if (value) {
                        target.state = 'Recibido';
                      }
                    })} type="date" value={part.receivedDate} />
                    <DataField disabled={noRepairNeeded} label="Código pieza" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.partCode = value;
                    })} value={part.partCode} />
                    <DataField label="N° inventario" onChange={() => {}} readOnly value={getThirdPartyInventoryCode(item.code, index)} />
                    <div className="budget-line-footer">
                      <div className="budget-line-meta repair-line-meta">
                        <StatusBadge tone={part.state === 'Recibido' ? 'success' : 'info'}>{part.state}</StatusBadge>
                        {part.source === 'budget' ? <small>Originado en Presupuesto</small> : <small>Carga manual</small>}
                      </div>
                      <button className="ghost-button" onClick={() => removeRepairPart(part.id)} type="button">Eliminar</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-media" role="status">Todavía no cargaste repuestos para gestionar pedidos.</div>
              )}
            </div>
          </article>
        ) : null}
      </div>
    );
  }

  if (isInsuranceWorkflowCase(item)) {
    const todoRiskParts = item.repair.parts.filter((part) => part.source === 'budget');
    const authorizedParts = todoRiskParts.filter((part) => part.authorized === 'SI');
    const turnoBlockedForTodoRisk = !item.computed.todoRisk.quoteAgreed && !item.todoRisk.processing.adminTurnOverride;
    const authorizationBlocked = !item.computed.todoRisk.canProgressFromPresentation;

    return (
      <div className="tab-layout">
        {!item.computed.budgetReady ? <div className="alert-banner danger-banner">Presupuesto en rojo: completá y generá el informe para habilitar Gestión reparación.</div> : null}

        <article className="card inner-card todo-risk-summary-card">
          <div className="section-head small-gap">
            <div>
              <h3>Gestión reparación - Todo Riesgo</h3>
              <p className="muted">Sumá seguimiento puntual para repuestos, turno o egreso sin salir del caso.</p>
            </div>
            <div className="tag-row">
              <StatusBadge tone={getStatusTone(item.computed.repairStatus)}>{item.computed.repairStatus}</StatusBadge>
              <button className="secondary-button" onClick={addRepairFollowUpTask} type="button">Crear tarea</button>
            </div>
          </div>
          <div className="form-grid four-columns compact-grid">
            <DataField label="N° de siniestro" onChange={() => {}} readOnly value={item.claimNumber || ''} />
            <DataField label="Días tramitando" onChange={() => {}} readOnly value={item.computed.todoRisk.daysProcessing} />
            <DataField label="Repuestos autorizados" onChange={() => {}} readOnly value={authorizedParts.length} />
            <DataField label="Estado actual" onChange={() => {}} readOnly value={item.computed.repairStatus} />
          </div>
        </article>

        <div className="subtabs-row">
          {repairTabs.map((tab) => (
            <button className={`subtab-button ${activeRepairTab === tab.id ? 'is-active' : ''}`} key={tab.id} onClick={() => onChangeRepairTab(tab.id)} type="button">
              {tab.label}
            </button>
          ))}
        </div>

        {activeRepairTab === 'repuestos' ? (
          <article className="card inner-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Repuestos</p>
                <h3>Automáticos desde Presupuesto</h3>
              </div>
              <button className="secondary-button" onClick={() => flash('Imprimir etiqueta demo: se prepararía la etiqueta individual del repuesto.') } type="button">Imprimir etiqueta</button>
            </div>
            <div className="table-wrap">
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>Repuesto</th>
                    <th>Autorizado</th>
                    <th>Proveedor</th>
                    <th>Estado</th>
                    <th>Recibido</th>
                    <th>N° inventario</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {todoRiskParts.map((part, index) => {
                    const inventoryIndex = authorizedParts.findIndex((entry) => entry.id === part.id) + 1;
                    const inventoryCode = part.authorized === 'SI' ? `${item.code}-${String(inventoryIndex).padStart(2, '0')}` : 'Pendiente';
                    return (
                      <tr key={part.id}>
                        <td>{part.name}</td>
                        <td>
                          <div className="todo-risk-inline-actions">
                            <button className={`secondary-button compact-button ${part.authorized === 'SI' ? 'is-selected' : ''}`} disabled={authorizationBlocked} onClick={() => updateCase((draft) => { const target = draft.repair.parts.find((entry) => entry.id === part.id); target.authorized = 'SI'; })} type="button">Sí</button>
                            <button className={`secondary-button compact-button ${part.authorized === 'NO' ? 'is-selected' : ''}`} disabled={authorizationBlocked} onClick={() => updateCase((draft) => { const target = draft.repair.parts.find((entry) => entry.id === part.id); target.authorized = 'NO'; })} type="button">No</button>
                          </div>
                        </td>
                        <td><DataField label="Proveedor" onChange={(value) => updateCase((draft) => { const target = draft.repair.parts.find((entry) => entry.id === part.id); target.provider = value; })} value={part.provider} /></td>
                        <td><SelectField disabled={authorizationBlocked} label="Estado" onChange={(value) => updateCase((draft) => { const target = draft.repair.parts.find((entry) => entry.id === part.id); target.state = value; })} options={REPAIR_PART_STATE_OPTIONS} value={part.state} /></td>
                        <td>{part.state === 'Recibido' ? 'Sí' : 'No'}</td>
                        <td>{inventoryCode}</td>
                        <td><button className="ghost-button" onClick={() => flash(`Etiqueta demo para ${part.name}: ${inventoryCode}.`)} type="button">Etiqueta</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {authorizationBlocked ? <div className="inline-alert danger-banner">Sin fecha de presentación no se habilitan autorizaciones ni seguimiento operativo de repuestos.</div> : null}
          </article>
        ) : null}

        {activeRepairTab === 'turno' ? (
          <article className="card inner-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Turno</p>
                <h3>Guard con excepción admin mock</h3>
              </div>
              <button className="primary-button" onClick={assignTurn} type="button">Agendar turno</button>
            </div>
            {turnoBlockedForTodoRisk ? <div className="inline-alert danger-banner">Sin cotización acordada no se da turno, salvo la excepción visual de admin mock.</div> : null}
            <div className="form-grid four-columns compact-grid">
              <DataField label="Fecha" onChange={(value) => updateCase((draft) => { draft.repair.turno.date = value; })} type="date" value={item.repair.turno.date} />
              <DataField label="Días estimados" onChange={(value) => updateCase((draft) => { draft.repair.turno.estimatedDays = value; })} type="number" value={item.repair.turno.estimatedDays} />
              <DataField label="Salida estimada" onChange={() => {}} readOnly type="date" value={item.computed.turnoEstimatedExit} />
              <SelectField label="Estado" onChange={(value) => updateCase((draft) => { draft.repair.turno.state = value; })} options={TURNO_STATE_OPTIONS} value={item.repair.turno.state} />
            </div>
            <button className={`toggle-button ${item.todoRisk.processing.adminTurnOverride ? 'is-on' : ''}`} onClick={() => updateCase((draft) => { draft.todoRisk.processing.adminTurnOverride = !draft.todoRisk.processing.adminTurnOverride; })} type="button">Excepción visual admin mock</button>
            <label className="field">
              <span>Anotaciones de turno</span>
              <textarea onChange={(event) => updateCase((draft) => { draft.repair.turno.notes = event.target.value; })} value={item.repair.turno.notes} />
            </label>
          </article>
        ) : null}
      
        {activeRepairTab === 'ingreso' ? (
          <article className="card inner-card">
            <div className="section-head small-gap">
              <h3>Ingreso</h3>
              <StatusBadge tone={item.repair.ingreso.realDate ? 'success' : 'danger'}>{item.repair.ingreso.realDate ? 'Ingreso registrado' : 'Pendiente'}</StatusBadge>
            </div>
            <div className="form-grid three-columns compact-grid">
              <DataField label="Ingreso real" onChange={(value) => updateCase((draft) => { draft.repair.ingreso.realDate = value; })} type="date" value={item.repair.ingreso.realDate} />
              <DataField label="Salida estimada" onChange={() => {}} readOnly type="date" value={item.computed.turnoEstimatedExit} />
              <ToggleField label="Observación en ingreso" onChange={(value) => updateCase((draft) => { draft.repair.ingreso.hasObservation = value; })} value={item.repair.ingreso.hasObservation} />
            </div>
          </article>
        ) : null}

        {activeRepairTab === 'egreso' ? (
          <article className="card inner-card">
            <div className="section-head small-gap">
              <h3>Egreso</h3>
              <StatusBadge tone={item.computed.repairResolved || item.todoRisk.processing.noRepairNeeded ? 'success' : 'danger'}>{item.computed.repairStatus}</StatusBadge>
            </div>
            <div className="form-grid four-columns compact-grid">
              <DataField label="Fecha egreso" onChange={(value) => updateCase((draft) => { draft.repair.egreso.date = value; })} type="date" value={item.repair.egreso.date} />
              <ToggleField label="Debe reingresar" onChange={(value) => updateCase((draft) => { draft.repair.egreso.shouldReenter = value; })} value={item.repair.egreso.shouldReenter} />
              <button className={`toggle-button ${item.repair.egreso.definitiveExit ? 'is-on' : ''}`} onClick={() => updateCase((draft) => { draft.repair.egreso.definitiveExit = !draft.repair.egreso.definitiveExit; })} type="button">Cierre operativo</button>
              <button className={`toggle-button ${item.todoRisk.processing.noRepairNeeded ? 'is-on' : ''}`} disabled={!item.todoRisk.processing.adminTurnOverride && !item.todoRisk.processing.noRepairNeeded} onClick={() => updateCase((draft) => { draft.todoRisk.processing.noRepairNeeded = !draft.todoRisk.processing.noRepairNeeded; })} type="button">No debe repararse</button>
            </div>
            <label className="field">
              <span>Anotaciones de egreso</span>
              <textarea onChange={(event) => updateCase((draft) => { draft.repair.egreso.notes = event.target.value; })} value={item.repair.egreso.notes} />
            </label>
          </article>
        ) : null}
      </div>
    );
  }

  return (
    <div className="tab-layout">
      {!item.computed.budgetReady ? (
        <div className="alert-banner danger-banner">Presupuesto en rojo: completá y generá el informe para habilitar acciones operativas.</div>
      ) : null}

      <div className="subtabs-row">
        {repairTabs.map((tab) => (
          <button className={`subtab-button ${activeRepairTab === tab.id ? 'is-active' : ''}`} key={tab.id} onClick={() => onChangeRepairTab(tab.id)} type="button">
            {tab.label}
          </button>
        ))}
      </div>

      {activeRepairTab === 'repuestos' ? (
        <div className="repuestos-stack">
          <article className="card inner-card parts-forecast-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Repuestos presupuestados</p>
                <h3>Traídos desde REEMPLAZAR</h3>
              </div>
              <StatusBadge tone={item.computed.budgetParts.length ? 'info' : 'danger'}>
                {item.computed.budgetParts.length ? `${item.computed.budgetParts.length} piezas` : 'Sin líneas'}
              </StatusBadge>
            </div>

            <div className="inline-alert info-banner">
              Esta sub-solapa replica automáticamente las lineas con REEMPLAZAR. Podés sacar items acá sin tocar el origen del presupuesto.
            </div>

            {item.computed.budgetParts.length ? (
              <div className="parts-forecast-grid">
                {item.computed.budgetParts.map((part) => (
                  <div className="nested-card" key={part.lineId}>
                    <div className="section-head small-gap">
                      <div>
                        <strong>{part.name}</strong>
                        <small>{part.task}</small>
                      </div>
                      <span className="damage-pill">{part.damageLevel || 'Sin nivel'}</span>
                    </div>
                    <div className="summary-row">
                      <span>Monto referencial</span>
                      <strong>{money(part.amount)}</strong>
                    </div>
                    <div className="part-source-row">
                      <small>{part.replacementDecision || 'Sin decision interna'}</small>
                      {removedBudgetLineIds.includes(part.lineId) ? <StatusBadge tone="danger">Quitado en Repuestos</StatusBadge> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-media" role="status">
                Marca las líneas con REEMPLAZAR y completá la pieza para poblar este listado.
              </div>
            )}

            <div className="parts-total-row">
              <span>Total presupuestado</span>
              <strong>{money(item.computed.partsTotal)}</strong>
            </div>
          </article>

          <article className="card inner-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Gestión operativa</p>
                <h3>Pedidos y recepciones</h3>
              </div>
              <div className="tag-row">
                <StatusBadge tone={item.repair.parts.length ? 'info' : 'danger'}>{money(item.computed.repairPartsTotal)}</StatusBadge>
                <StatusBadge tone={autoPartCount ? 'success' : 'danger'}>{autoPartCount} automático(s)</StatusBadge>
                <StatusBadge tone={manualPartCount ? 'info' : 'danger'}>{manualPartCount} manual(es)</StatusBadge>
                <StatusBadge tone={overriddenPartCount ? 'info' : 'success'}>{overriddenPartCount} editado(s)</StatusBadge>
                <button className="secondary-button" onClick={() => syncBudgetParts(true)} type="button">Traer reemplazos</button>
                <button className="secondary-button" onClick={addRepairPart} type="button">Agregar repuesto</button>
              </div>
            </div>

            <div className="parts-total-grid">
              <article className="summary-chip">
                <span>Total presupuestado</span>
                <strong>{money(item.computed.partsTotal)}</strong>
              </article>
              <article className="summary-chip">
                <span>Total gestionado</span>
                <strong>{money(item.computed.repairPartsTotal)}</strong>
              </article>
              <article className="summary-chip">
                <span>Diferencia</span>
                <strong>{money(item.computed.repairPartsTotal - item.computed.partsTotal)}</strong>
              </article>
            </div>

            <div className="budget-lines">
              {item.repair.parts.length ? (
                item.repair.parts.map((part) => (
                  <div className="budget-line repair-part-line" key={part.id}>
                    <div className="budget-line-header">
                      <strong>{part.name || 'Nuevo repuesto'}</strong>
                      <small>{part.source === 'budget' ? 'Arrastrado desde Presupuesto' : 'Carga independiente en Repuestos'}</small>
                    </div>
                    <DataField label="Repuesto" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.name = value;
                    })} value={part.name} />
                    <DataField label="Proveedor" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.provider = value;
                    })} value={part.provider} />
                    <DataField label="Importe" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.amount = value;
                    })} value={part.amount} />
                    <SelectField label="Estado" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.state = value;
                    })} options={REPAIR_PART_STATE_OPTIONS} value={part.state} />
                    <SelectField label="Compra" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.purchaseBy = value;
                    })} options={REPAIR_PART_BUYER_OPTIONS} value={part.purchaseBy} />
                    <SelectField label="Pago" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.paymentStatus = value;
                    })} options={REPAIR_PART_PAYMENT_OPTIONS} value={part.paymentStatus} />
                    <div className="budget-line-footer">
                      <div className="budget-line-meta repair-line-meta">
                        <StatusBadge tone={part.source === 'budget' ? 'info' : 'success'}>
                          {part.source === 'budget' ? 'Desde presupuesto' : 'Carga manual'}
                        </StatusBadge>
                        {part.budgetAmount ? <small>Monto ref: {money(part.budgetAmount)}</small> : null}
                        {part.source === 'budget' && part.amount !== part.budgetAmount ? <small>Importe editado en Repuestos</small> : null}
                      </div>
                      <button className="ghost-button" onClick={() => removeRepairPart(part.id)} type="button">Eliminar</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-media" role="status">Todavía no cargaste repuestos gestionados.</div>
              )}
            </div>

            <div className="parts-total-row">
              <span>Total gestionado</span>
              <strong>{money(item.computed.repairPartsTotal)}</strong>
            </div>
          </article>
        </div>
      ) : null}

      {activeRepairTab === 'turno' ? (
        <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Subsolapa Turno</p>
              <h3>Agenda demo con salida estimada automatica</h3>
            </div>
            <button className="primary-button" onClick={assignTurn} type="button">Agendar turno</button>
          </div>

          <div className="budget-ready-panel budget-ready-panel-compact">
            <StatusBadge tone={item.computed.turnoReady ? 'success' : 'danger'}>{item.computed.turnoReady ? 'Turno consistente' : 'Turno incompleto'}</StatusBadge>
            <small>La salida estimada se calcula en días hábiles desde la fecha elegida.</small>
          </div>

          <div className="form-grid four-columns compact-grid">
            <DataField label="Fecha" onChange={(value) => updateCase((draft) => { draft.repair.turno.date = value; })} type="date" value={item.repair.turno.date} />
            <DataField label="Dias estimados" onChange={(value) => updateCase((draft) => { draft.repair.turno.estimatedDays = value; })} type="number" value={item.repair.turno.estimatedDays} />
            <DataField label="Salida estimada" onChange={() => {}} type="date" value={item.computed.turnoEstimatedExit} />
            <SelectField label="Estado" onChange={(value) => updateCase((draft) => { draft.repair.turno.state = value; })} options={TURNO_STATE_OPTIONS} value={item.repair.turno.state} />
          </div>
          <label className="field">
            <span>Anotaciones de turno</span>
            <textarea onChange={(event) => updateCase((draft) => { draft.repair.turno.notes = event.target.value; })} value={item.repair.turno.notes} />
          </label>
        </article>
      ) : null}

      {activeRepairTab === 'ingreso' ? (
        <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Subsolapa Ingreso</p>
              <h3>Fecha real + ítems del Excel</h3>
            </div>
            <StatusBadge tone={item.repair.ingreso.realDate ? 'success' : 'danger'}>{item.repair.ingreso.realDate ? 'Ingreso registrado' : 'Pendiente'}</StatusBadge>
          </div>

          <div className="budget-ready-panel budget-ready-panel-compact">
            <StatusBadge tone={item.repair.ingreso.hasObservation === 'SI' ? 'info' : 'success'}>{item.repair.ingreso.hasObservation === 'SI' ? 'Ingreso observado' : 'Sin observaciones'}</StatusBadge>
            <small>La fecha real de ingreso puede ser distinta al turno programado.</small>
          </div>

          <div className="form-grid three-columns compact-grid">
            <DataField label="Ingreso real" onChange={(value) => updateCase((draft) => { draft.repair.ingreso.realDate = value; })} type="date" value={item.repair.ingreso.realDate} />
            <DataField label="Salida estimada" onChange={() => {}} type="date" value={item.computed.turnoEstimatedExit} />
            <ToggleField label="Observacion en ingreso" onChange={(value) => updateCase((draft) => {
              draft.repair.ingreso.hasObservation = value;
              if (value !== 'SI') {
                draft.repair.ingreso.observation = '';
                draft.repair.ingreso.items = [];
              }
            })} value={item.repair.ingreso.hasObservation} />
          </div>

          {item.repair.ingreso.hasObservation === 'SI' ? (
            <>
              <div className="inline-alert info-banner">
                Fecha visible de la observación: {item.repair.ingreso.realDate ? formatDate(item.repair.ingreso.realDate) : 'pendiente de cargar en Ingreso real'}.
              </div>

              <label className="field">
                <span>Resumen general</span>
                <textarea onChange={(event) => updateCase((draft) => { draft.repair.ingreso.observation = event.target.value; })} value={item.repair.ingreso.observation} />
              </label>

              <div className="section-head small-gap">
                <h4>Ítems observados</h4>
                <button className="secondary-button" onClick={addIngresoItem} type="button">Agregar ítem</button>
              </div>

              <div className="budget-lines">
                {item.computed.ingresoItems.map((entry) => (
                  <div className="budget-line" key={entry.id}>
                    <SelectField label="Tipo" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.ingreso.items.find((itemEntry) => itemEntry.id === entry.id);
                      target.type = value;
                    })} options={INGRESO_TYPES} value={entry.type} />
                    <DataField label="Daño / observaciones" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.ingreso.items.find((itemEntry) => itemEntry.id === entry.id);
                      target.detail = value;
                    })} value={entry.detail} />
                    <DataField label="Fotos / videos" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.ingreso.items.find((itemEntry) => itemEntry.id === entry.id);
                      target.media = value;
                    })} value={entry.media} />
                    <button className="ghost-button" onClick={() => updateCase((draft) => {
                      draft.repair.ingreso.items = draft.repair.ingreso.items.filter((itemEntry) => itemEntry.id !== entry.id);
                    })} type="button">Eliminar</button>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </article>
      ) : null}

      {activeRepairTab === 'egreso' ? (
        <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Subsolapa Egreso</p>
              <h3>Cierre, reingreso y fotos reparado</h3>
            </div>
            <StatusBadge tone={item.computed.repairResolved ? 'success' : 'danger'}>{item.computed.repairStatus}</StatusBadge>
          </div>

          <div className="form-grid four-columns compact-grid">
            <DataField label="Fecha egreso" onChange={(value) => updateCase((draft) => { draft.repair.egreso.date = value; })} type="date" value={item.repair.egreso.date} />
            <ToggleField label="Debe reingresar" onChange={(value) => updateCase((draft) => {
              draft.repair.egreso.shouldReenter = value;
              if (value !== 'SI') {
                draft.repair.egreso.reentryDate = '';
                draft.repair.egreso.reentryEstimatedDays = '';
                draft.repair.egreso.reentryState = 'Pendiente programar';
                draft.repair.egreso.reentryNotes = '';
              }
            })} value={item.repair.egreso.shouldReenter} />
            <button className={`toggle-button ${item.repair.egreso.definitiveExit ? 'is-on' : ''}`} onClick={() => updateCase((draft) => { draft.repair.egreso.definitiveExit = !draft.repair.egreso.definitiveExit; })} type="button">
              Egreso definitivo
            </button>
            <button className={`toggle-button ${item.repair.egreso.repairedPhotos ? 'is-on' : ''}`} onClick={() => updateCase((draft) => { draft.repair.egreso.repairedPhotos = !draft.repair.egreso.repairedPhotos; })} type="button">
              Fotos vehiculo reparado
            </button>
          </div>

          <label className="field">
            <span>Anotaciones de egreso</span>
            <textarea onChange={(event) => updateCase((draft) => { draft.repair.egreso.notes = event.target.value; })} value={item.repair.egreso.notes} />
          </label>

          {item.repair.egreso.shouldReenter === 'SI' ? (
            <div className="nested-card">
              <h4>Turno reingreso</h4>
              <div className="form-grid three-columns compact-grid">
                <DataField label="Fecha reingreso" onChange={(value) => updateCase((draft) => { draft.repair.egreso.reentryDate = value; })} type="date" value={item.repair.egreso.reentryDate} />
                <DataField label="Dias estimados" onChange={(value) => updateCase((draft) => { draft.repair.egreso.reentryEstimatedDays = value; })} type="number" value={item.repair.egreso.reentryEstimatedDays} />
                <DataField label="Salida reingreso" onChange={() => {}} type="date" value={item.computed.reentryEstimatedExit} />
                <SelectField label="Estado reingreso" onChange={(value) => updateCase((draft) => { draft.repair.egreso.reentryState = value; })} options={TURNO_STATE_OPTIONS} value={item.repair.egreso.reentryState} />
              </div>
              <label className="field">
                <span>Notas reingreso</span>
                <textarea onChange={(event) => updateCase((draft) => { draft.repair.egreso.reentryNotes = event.target.value; })} value={item.repair.egreso.reentryNotes} />
              </label>
            </div>
          ) : null}

          <div className="budget-ready-panel budget-ready-panel-compact">
            <StatusBadge tone={item.repair.egreso.repairedPhotos ? 'success' : 'danger'}>{item.repair.egreso.repairedPhotos ? 'Fotos finales visibles' : 'Sin fotos finales'}</StatusBadge>
            <small>La solapa Gestión reparación recién cierra en verde cuando no reingresa o se marca egreso definitivo.</small>
          </div>

          {item.repair.egreso.repairedPhotos ? (
            repairedMediaItems.length ? (
              <div className="media-gallery compact-media-gallery">
                {repairedMediaItems.map((media) => (
                  <button
                    aria-label={`Abrir evidencia final ${media.label}`}
                    className="media-card"
                    key={media.id}
                    onClick={() => setPreviewMedia(media)}
                    type="button"
                  >
                    {media.thumbnail && !failedMediaIds.includes(media.id) ? (
                      <img alt="" className="media-card-image" onError={() => markMediaThumbFailed(media.id)} src={media.thumbnail} />
                    ) : (
                      <div className="media-card-fallback" aria-hidden="true">
                        <strong>EGRESO</strong>
                        <small>Preview no disponible</small>
                      </div>
                    )}
                    <span className="media-card-scrim" aria-hidden="true" />
                    <span>{media.label}</span>
                    <small>{media.description || 'Foto final de entrega'}</small>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-media" role="status">La bandera de fotos finales está activa, pero todavía no hay adjuntos de egreso para revisar.</div>
            )
          ) : null}
        </article>
      ) : null}

      {previewMedia ? (
        <div className="media-overlay" onClick={() => setPreviewMedia(null)} role="presentation">
          <div aria-label={`Vista ampliada de ${previewMedia.label}`} aria-modal="true" className="media-modal" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="media-modal-head">
              <div>
                <strong>{previewMedia.label}</strong>
                <p>{previewMedia.description || 'Adjunto operativo del caso.'}</p>
              </div>
              <button className="ghost-button" onClick={() => setPreviewMedia(null)} type="button">Cerrar</button>
            </div>

            {previewMedia.type === 'video' ? (
              currentPreviewBroken ? (
                <div className="empty-media" role="status">El video no pudo previsualizarse. Abrilo en una pestaña nueva para revisar el original.</div>
              ) : (
                <video controls onError={() => markPreviewFailed(previewMedia.id)} src={previewMedia.url} />
              )
            ) : currentPreviewBroken ? (
              <div className="empty-media" role="status">La imagen no cargó en la previsualización. Usá "Abrir archivo" para validarla igual.</div>
            ) : (
              <img alt={previewMedia.label} onError={() => markPreviewFailed(previewMedia.id)} src={previewMedia.url} />
            )}

            <div className="media-preview-actions">
              <a className="secondary-button button-link" href={previewMedia.url} rel="noreferrer" target="_blank">Abrir archivo</a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PagosTab({ item, updateCase, flash }) {
  const [activePaymentTab, setActivePaymentTab] = useState('facturacion');

  if (isFranchiseRecoveryCase(item)) {
    const franchiseComputed = item.computed.franchiseRecovery || {};
    const repairEnabled = item.franchiseRecovery?.enablesRepair !== 'NO';
    const showClientRecoveryFields = franchiseComputed.dictamenShared || (!repairEnabled && item.franchiseRecovery?.recoverToClient === 'SI');

    return (
      <div className="tab-layout todo-risk-layout">
        <article className="card inner-card franchise-management-card">
          <div className="section-head small-gap">
            <div>
              <p className="eyebrow">Pagos</p>
              <h3>Lectura mínima de franquicia</h3>
            </div>
            <StatusBadge tone={getStatusTone(item.computed.paymentState)}>{item.computed.paymentState}</StatusBadge>
          </div>

          <div className="form-grid four-columns compact-grid">
            <DataField label="Gestiona" onChange={() => {}} readOnly value={item.franchiseRecovery?.managerType || 'Taller'} />
            <DataField label="Carpeta asociada" onChange={() => {}} readOnly value={item.franchiseRecovery?.associatedFolderCode || '-'} />
            <DataField label="Dictamen" onChange={() => {}} readOnly value={item.franchiseRecovery?.dictamen || 'Pendiente'} />
            <DataField label="Habilita reparación" onChange={() => {}} readOnly value={repairEnabled ? 'SI' : 'NO'} />
            <DataField label="Monto a recuperar" onChange={() => {}} readOnly value={money(item.franchiseRecovery?.amountToRecover || 0)} />
            <DataField label="Recupero a cliente" onChange={() => {}} readOnly value={franchiseComputed.dictamenShared ? 'Demo 50/50' : item.computed.franchiseRecovery?.canRecoverToClient ? item.franchiseRecovery?.recoverToClient || 'NO' : 'No aplica'} />
            <DataField label="Saldo base" onChange={() => {}} readOnly value={money(item.computed.balance)} />
          </div>

          {franchiseComputed.hasEconomicAlert ? <div className="inline-alert danger-banner franchise-flow-banner">Recupero económico en alerta: {money(franchiseComputed.amountToRecover || 0)} vs acordado {money(franchiseComputed.agreementAmount || 0)}.</div> : null}
          {franchiseComputed.dictamenShared ? <div className="inline-alert info-banner franchise-flow-banner">Dictamen compartido: demo 50/50 con cliente {money(franchiseComputed.clientResponsibilityAmount || 0)} y compañía {money(franchiseComputed.companyExpectedAmount || 0)}.</div> : null}

          {repairEnabled && !franchiseComputed.dictamenShared ? (
            <div className="inline-alert info-banner franchise-flow-banner">
              Recupero a cliente solo aplica cuando <strong>Habilita reparación = NO</strong>.
            </div>
          ) : showClientRecoveryFields ? (
            <div className="franchise-client-recovery-block">
              <div className="section-head small-gap">
                <div>
                  <p className="eyebrow">Recupero a cliente</p>
                  <h3>Campos mínimos visibles</h3>
                </div>
                <StatusBadge tone={item.franchiseRecovery?.clientRecoveryStatus === 'Cancelado' ? 'success' : 'info'}>
                  {item.franchiseRecovery?.clientRecoveryStatus || 'Pendiente'}
                </StatusBadge>
              </div>

              <div className="form-grid three-columns compact-grid">
                <DataField label="Monto cliente" onChange={(value) => updateCase((draft) => { draft.franchiseRecovery.clientResponsibilityAmount = value; })} value={item.franchiseRecovery?.clientResponsibilityAmount || ''} />
                <SelectField label="Estado cobro cliente" onChange={(value) => updateCase((draft) => { draft.franchiseRecovery.clientRecoveryStatus = value; })} options={FRANCHISE_CLIENT_PAYMENT_STATUS_OPTIONS} value={item.franchiseRecovery?.clientRecoveryStatus || 'Pendiente'} />
                <DataField label="Fecha cobro cliente" onChange={(value) => updateCase((draft) => { draft.franchiseRecovery.clientRecoveryDate = value; })} type="date" value={item.franchiseRecovery?.clientRecoveryDate || ''} />
              </div>
            </div>
          ) : (
            <div className="inline-alert success-banner franchise-flow-banner">
              Marcá <strong>Recupero a cliente = SI</strong> para mostrar el bloque mínimo de recupero dentro de Franquicia.
            </div>
          )}
        </article>
      </div>
    );
  }

  if (isThirdPartyLawyerCase(item)) {
    const addInvoice = () => {
      updateCase((draft) => {
        draft.payments.invoice = 'SI';
        draft.payments.invoices = [
          ...(draft.payments.invoices || []),
          createTodoRiskInvoice({
            amount: String(draft.payments.manualTotalAmount || draft.lawyer.closure.totalAmount || ''),
            issuedAt: draft.payments.passedToPaymentsDate || draft.lawyer.entryDate || '',
            notes: 'Convenio / factura demo abogado',
          }),
        ];
      });
    };

    const addClientPayment = () => {
      updateCase((draft) => {
        draft.thirdParty.payments.clientPayments.push(createSettlement());
      });
    };

    const paymentReferenceLabel = item.lawyer.instance === 'Judicial' ? 'N° CUIJ' : 'N° de siniestro';
    const paymentReferenceValue = item.lawyer.instance === 'Judicial' ? item.lawyer.cuij || '' : item.claimNumber || '';

    return (
      <div className="tab-layout todo-risk-layout">
        <article className="card inner-card todo-risk-summary-card">
          <div className="section-head small-gap">
            <div>
              <p className="eyebrow">Pagos</p>
              <h3>Versión resumida para abogado</h3>
            </div>
            <StatusBadge tone={getStatusTone(item.computed.paymentState)}>{item.computed.paymentState}</StatusBadge>
          </div>
          <div className="parts-total-grid third-party-summary-grid">
            <article className="summary-chip">
              <span>{paymentReferenceLabel}</span>
              <strong>{paymentReferenceValue || 'Pendiente'}</strong>
            </article>
            <article className="summary-chip">
              <span>Importe total manual</span>
              <strong>{money(item.computed.thirdParty.amountToInvoice)}</strong>
            </article>
            <article className="summary-chip">
              <span>Tareas extras</span>
              <strong>{money(item.computed.thirdParty.extraWorksTotal)}</strong>
            </article>
            <article className="summary-chip">
              <span>Saldo extras</span>
              <strong>{money(item.computed.thirdParty.clientExtrasBalance)}</strong>
            </article>
          </div>
        </article>

        <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Facturación / convenio</p>
              <h3>Sin firma conforme cliente</h3>
            </div>
            <div className="tag-row">
              <StatusBadge tone={item.computed.thirdParty.companyPaymentReady ? 'success' : 'info'}>{item.computed.thirdParty.companyPaymentReady ? 'Pago principal registrado' : 'Pendiente pago principal'}</StatusBadge>
              <button className="secondary-button" onClick={addInvoice} type="button">Agregar factura</button>
            </div>
          </div>
          <div className="form-grid four-columns compact-grid">
            <DataField label={paymentReferenceLabel} onChange={() => {}} readOnly value={paymentReferenceValue} />
            <DataField label="Importe total manual" onChange={(value) => updateCase((draft) => { draft.payments.manualTotalAmount = value; })} value={item.payments.manualTotalAmount || ''} />
            <DataField label="Firma convenio abogado" onChange={(value) => updateCase((draft) => { draft.payments.signedAgreementDate = value; })} type="date" value={item.payments.signedAgreementDate || ''} />
            <DataField label="Pasado a pagos" onChange={(value) => updateCase((draft) => { draft.payments.passedToPaymentsDate = value; })} type="date" value={item.payments.passedToPaymentsDate || ''} />
            <DataField label="Fecha estimada pago" onChange={(value) => updateCase((draft) => { draft.payments.estimatedPaymentDate = value; })} type="date" value={item.payments.estimatedPaymentDate || ''} />
            <DataField label="Razón social" onChange={(value) => updateCase((draft) => { draft.payments.businessName = value; })} value={item.payments.businessName || ''} />
            <DataField label="Instancia" onChange={() => {}} readOnly value={item.lawyer.instance} />
            <DataField label="Cierre por" onChange={() => {}} readOnly value={item.lawyer.closure.closeBy} />
          </div>
          <div className="budget-lines">
            {(item.payments.invoices || []).map((invoice) => (
              <div className="budget-line" key={invoice.id}>
                <DataField label="N° factura" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.invoiceNumber = value; if (!draft.payments.invoiceNumber) draft.payments.invoiceNumber = value; })} value={invoice.invoiceNumber} />
                <DataField label="Importe total" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.amount = value; })} value={invoice.amount} />
                <DataField label="Fecha factura" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.issuedAt = value; })} type="date" value={invoice.issuedAt} />
                <DataField label="Notas" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.notes = value; })} value={invoice.notes} />
              </div>
            ))}
          </div>
        </article>

        <article className="card inner-card">
          <div className="section-head small-gap">
            <div>
              <p className="eyebrow">Pago principal</p>
              <h3>Fecha manual y validación mínima</h3>
            </div>
            <StatusBadge tone={item.computed.thirdParty.companyPaymentReady ? 'success' : 'danger'}>{item.computed.thirdParty.companyPaymentReady ? 'Completo' : 'Pendiente'}</StatusBadge>
          </div>
          <div className="form-grid four-columns compact-grid">
            <DataField label="Fecha de pago" onChange={(value) => updateCase((draft) => { draft.payments.paymentDate = value; })} type="date" value={item.payments.paymentDate || ''} />
            <DataField label="Monto depositado" onChange={(value) => updateCase((draft) => { draft.payments.depositedAmount = value; })} value={item.payments.depositedAmount || ''} />
            <ToggleField label="Retenciones" onChange={(value) => updateCase((draft) => { draft.payments.hasRetentions = value; })} value={item.payments.hasRetentions || 'NO'} />
            <DataField label="N° factura principal" onChange={(value) => updateCase((draft) => { draft.payments.invoiceNumber = value; })} value={item.payments.invoiceNumber || ''} />
          </div>
          {item.payments.hasRetentions === 'SI' ? (
            <div className="form-grid six-columns compact-grid retention-grid">
              <DataField label="IVA" onChange={(value) => updateCase((draft) => { draft.payments.retentions.iva = value; })} value={item.payments.retentions?.iva || ''} />
              <DataField label="Ganancias" onChange={(value) => updateCase((draft) => { draft.payments.retentions.gains = value; })} value={item.payments.retentions?.gains || ''} />
              <DataField label="Contr. Patr." onChange={(value) => updateCase((draft) => { draft.payments.retentions.employerContribution = value; })} value={item.payments.retentions?.employerContribution || ''} />
              <DataField label="IIBB" onChange={(value) => updateCase((draft) => { draft.payments.retentions.iibb = value; })} value={item.payments.retentions?.iibb || ''} />
              <DataField label="DREI" onChange={(value) => updateCase((draft) => { draft.payments.retentions.drei = value; })} value={item.payments.retentions?.drei || ''} />
              <DataField label="Otra" onChange={(value) => updateCase((draft) => { draft.payments.retentions.other = value; })} value={item.payments.retentions?.other || ''} />
            </div>
          ) : null}
        </article>

        <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Tareas extras</p>
              <h3>Tramo particular visible en demo</h3>
            </div>
            <div className="tag-row">
              <StatusBadge tone={item.computed.thirdParty.clientExtrasReady ? 'success' : item.computed.thirdParty.hasExtraWorks ? 'danger' : 'info'}>
                {item.computed.thirdParty.hasExtraWorks ? (item.computed.thirdParty.clientExtrasReady ? 'Extras cancelados' : 'Extras pendientes') : 'Sin tareas extras'}
              </StatusBadge>
              <button className="secondary-button" onClick={addClientPayment} type="button">+ Agregar pago</button>
            </div>
          </div>
          <div className="parts-total-grid third-party-summary-grid">
            <article className="summary-chip"><span>Total extras</span><strong>{money(item.computed.thirdParty.extraWorksTotal)}</strong></article>
            <article className="summary-chip"><span>Total cobrado cliente</span><strong>{money(item.computed.thirdParty.clientPaymentsTotal)}</strong></article>
            <article className="summary-chip"><span>Saldo cliente</span><strong>{money(item.computed.thirdParty.clientExtrasBalance)}</strong></article>
          </div>
          <div className="budget-lines">
            {(item.thirdParty.payments.clientPayments || []).map((payment) => (
              <div className="settlement-card" key={payment.id}>
                <div className="form-grid four-columns compact-grid">
                  <SelectField label="Cancela saldo" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id); target.kind = value; })} options={['Parcial', 'Total', 'Bonificacion']} value={payment.kind} />
                  <DataField label="Monto" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id); target.amount = value; })} value={payment.amount} />
                  <DataField label="Fecha" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id); target.date = value; })} type="date" value={payment.date} />
                  <SelectField label="Modo" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id); target.mode = value; })} options={PAYMENT_MODES} value={payment.mode} />
                </div>
              </div>
            ))}
          </div>
          <button className="secondary-button" onClick={() => flash('Documentación pagos demo: acá abrirías recibos, transferencias o respaldos del convenio y extras.')} type="button">Documentación pagos</button>
        </article>
      </div>
    );
  }

  if (isThirdPartyWorkshopCase(item)) {
    const addInvoice = () => {
      updateCase((draft) => {
        draft.payments.invoice = 'SI';
        draft.payments.invoices = [
          ...(draft.payments.invoices || []),
          createTodoRiskInvoice({
            amount: String(item.computed.thirdParty.amountToInvoice || ''),
            issuedAt: draft.payments.passedToPaymentsDate || draft.thirdParty.claim.presentedDate || '',
            notes: 'Factura principal a compañía',
          }),
        ];
      });
    };

    const addClientPayment = () => {
      updateCase((draft) => {
        draft.thirdParty.payments.clientPayments.push(createSettlement());
      });
    };

    return (
      <div className="tab-layout todo-risk-layout">
        <article className="card inner-card todo-risk-summary-card">
          <div className="section-head small-gap">
            <div>
              <p className="eyebrow">Pagos</p>
              <h3>Mixto compañía + particular</h3>
            </div>
            <StatusBadge tone={getStatusTone(item.computed.paymentState)}>{item.computed.paymentState}</StatusBadge>
          </div>

          <div className="parts-total-grid third-party-summary-grid">
            <article className="summary-chip">
              <span>Cía. del 3ero</span>
              <strong>{item.thirdParty.claim.thirdCompany || 'Pendiente'}</strong>
            </article>
            <article className="summary-chip">
              <span>A facturar Cía.</span>
              <strong>{money(item.computed.thirdParty.amountToInvoice)}</strong>
            </article>
            <article className="summary-chip">
              <span>Tareas extras cliente</span>
              <strong>{money(item.computed.thirdParty.extraWorksTotal)}</strong>
            </article>
            <article className="summary-chip">
              <span>Saldo extras cliente</span>
              <strong>{money(item.computed.thirdParty.clientExtrasBalance)}</strong>
            </article>
          </div>

          <div className="budget-ready-panel budget-ready-panel-compact">
            <StatusBadge tone={item.computed.todoRisk.paymentsReady ? 'success' : 'danger'}>{item.computed.todoRisk.paymentsReady ? 'Pagos en azul/verde operativo' : 'Pagos todavía no cierra'}</StatusBadge>
            <small>{item.computed.thirdParty.hasExtraWorks ? 'Condición: fecha + monto de pago de compañía y además cancelación total del cliente sobre tareas extras.' : 'Condición: fecha + monto de pago de compañía. Sin extras, no se exige cancelación cliente.'}</small>
          </div>

          {!item.computed.thirdParty.companyPaymentReady ? <div className="inline-alert danger-banner">Falta registrar fecha y monto del pago de la compañía.</div> : null}
          {item.computed.thirdParty.hasExtraWorks && !item.computed.thirdParty.clientExtrasReady ? <div className="inline-alert danger-banner">Hay tareas extras y el cliente todavía debe {money(item.computed.thirdParty.clientExtrasBalance)} para cerrar el tramo particular.</div> : null}
        </article>

        <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Facturación compañía</p>
              <h3>Datos traídos desde Tramitación</h3>
            </div>
            <div className="tag-row">
              <StatusBadge tone={item.computed.thirdParty.companyPaymentReady ? 'success' : 'info'}>{item.computed.thirdParty.companyPaymentReady ? 'Pago compañía registrado' : 'Pendiente pago compañía'}</StatusBadge>
              <button className="secondary-button" onClick={addInvoice} type="button">Agregar factura</button>
            </div>
          </div>

          <div className="form-grid four-columns compact-grid">
            <DataField label="Cía. del 3ero" onChange={() => {}} readOnly value={item.thirdParty.claim.thirdCompany || ''} />
            <DataField label="N° de siniestro" onChange={() => {}} readOnly value={item.claimNumber || ''} />
            <DataField label="A facturar Cía." onChange={() => {}} readOnly value={item.computed.thirdParty.amountToInvoice} />
            <DataField label="Fecha presentado" onChange={() => {}} readOnly type="date" value={item.thirdParty.claim.presentedDate || ''} />
            <DataField label="Cliente firma conforme" onChange={(value) => updateCase((draft) => { draft.payments.signedAgreementDate = value; })} type="date" value={item.payments.signedAgreementDate || ''} />
            <DataField label="Pasado a pagos" onChange={(value) => updateCase((draft) => { draft.payments.passedToPaymentsDate = value; })} type="date" value={item.payments.passedToPaymentsDate || ''} />
            <DataField label="Fecha estimada pago" onChange={(value) => updateCase((draft) => { draft.payments.estimatedPaymentDate = value; })} type="date" value={item.payments.estimatedPaymentDate || ''} />
            <DataField label="Razón social" onChange={(value) => updateCase((draft) => { draft.payments.businessName = value; })} value={item.payments.businessName || ''} />
          </div>

          <div className="budget-lines">
            {(item.payments.invoices || []).map((invoice) => (
              <div className="budget-line" key={invoice.id}>
                <DataField label="N° factura" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.invoiceNumber = value; if (!draft.payments.invoiceNumber) draft.payments.invoiceNumber = value; })} value={invoice.invoiceNumber} />
                <DataField label="Importe total" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.amount = value; })} value={invoice.amount} />
                <DataField label="Fecha factura" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.issuedAt = value; })} type="date" value={invoice.issuedAt} />
                <DataField label="Notas" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.notes = value; })} value={invoice.notes} />
              </div>
            ))}
          </div>
        </article>

        <article className="card inner-card">
          <div className="section-head small-gap">
            <div>
              <p className="eyebrow">Pago compañía</p>
              <h3>Fecha manual y validación mínima</h3>
            </div>
            <StatusBadge tone={item.computed.thirdParty.companyPaymentReady ? 'success' : 'danger'}>{item.computed.thirdParty.companyPaymentReady ? 'Completo' : 'Pendiente'}</StatusBadge>
          </div>

          <div className="form-grid four-columns compact-grid">
            <DataField label="Fecha de pago" onChange={(value) => updateCase((draft) => { draft.payments.paymentDate = value; })} type="date" value={item.payments.paymentDate || ''} />
            <DataField label="Monto depositado" onChange={(value) => updateCase((draft) => { draft.payments.depositedAmount = value; })} value={item.payments.depositedAmount || ''} />
            <ToggleField label="Retenciones" onChange={(value) => updateCase((draft) => { draft.payments.hasRetentions = value; })} value={item.payments.hasRetentions || 'NO'} />
            <DataField label="N° factura principal" onChange={(value) => updateCase((draft) => { draft.payments.invoiceNumber = value; })} value={item.payments.invoiceNumber || ''} />
          </div>

          {item.payments.hasRetentions === 'SI' ? (
            <div className="form-grid six-columns compact-grid retention-grid">
              <DataField label="IVA" onChange={(value) => updateCase((draft) => { draft.payments.retentions.iva = value; })} value={item.payments.retentions?.iva || ''} />
              <DataField label="Ganancias" onChange={(value) => updateCase((draft) => { draft.payments.retentions.gains = value; })} value={item.payments.retentions?.gains || ''} />
              <DataField label="Contr. Patr." onChange={(value) => updateCase((draft) => { draft.payments.retentions.employerContribution = value; })} value={item.payments.retentions?.employerContribution || ''} />
              <DataField label="IIBB" onChange={(value) => updateCase((draft) => { draft.payments.retentions.iibb = value; })} value={item.payments.retentions?.iibb || ''} />
              <DataField label="DREI" onChange={(value) => updateCase((draft) => { draft.payments.retentions.drei = value; })} value={item.payments.retentions?.drei || ''} />
              <DataField label="Otra" onChange={(value) => updateCase((draft) => { draft.payments.retentions.other = value; })} value={item.payments.retentions?.other || ''} />
            </div>
          ) : null}
        </article>

        <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Pagos cliente</p>
              <h3>Tareas extras / tramo particular</h3>
            </div>
            <div className="tag-row">
              <StatusBadge tone={item.computed.thirdParty.clientExtrasReady ? 'success' : item.computed.thirdParty.hasExtraWorks ? 'danger' : 'info'}>
                {item.computed.thirdParty.hasExtraWorks
                  ? item.computed.thirdParty.clientExtrasReady ? 'Extras cancelados' : 'Extras pendientes'
                  : 'Sin tareas extras'}
              </StatusBadge>
              <button className="secondary-button" onClick={addClientPayment} type="button">+ Agregar pago</button>
            </div>
          </div>

          <div className="parts-total-grid third-party-summary-grid">
            <article className="summary-chip">
              <span>Total extras</span>
              <strong>{money(item.computed.thirdParty.extraWorksTotal)}</strong>
            </article>
            <article className="summary-chip">
              <span>Total cobrado cliente</span>
              <strong>{money(item.computed.thirdParty.clientPaymentsTotal)}</strong>
            </article>
            <article className="summary-chip">
              <span>Saldo cliente</span>
              <strong>{money(item.computed.thirdParty.clientExtrasBalance)}</strong>
            </article>
          </div>

          {!item.computed.thirdParty.hasExtraWorks ? (
            <div className="inline-alert info-banner">No hay tareas extras activas. El cierre de Pagos depende solo del pago de la compañía.</div>
          ) : null}

          <div className="budget-lines">
            {(item.thirdParty.payments.clientPayments || []).map((payment) => (
              <div className="settlement-card" key={payment.id}>
                <div className={`form-grid compact-grid ${payment.kind === 'Bonificacion' ? 'three-columns' : 'four-columns'}`}>
                  <SelectField label="Cancela saldo" onChange={(value) => updateCase((draft) => {
                    const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id);
                    target.kind = value;
                    if (value === 'Bonificacion') {
                      target.mode = '';
                      target.modeDetail = '';
                      return;
                    }
                    target.reason = '';
                    if (!target.mode) {
                      target.mode = PAYMENT_MODES[0];
                    }
                  })} options={['Parcial', 'Total', 'Bonificacion']} value={payment.kind} />
                  <DataField label="Monto" onChange={(value) => updateCase((draft) => {
                    const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id);
                    target.amount = value;
                  })} value={payment.amount} />
                  <DataField label="Fecha" onChange={(value) => updateCase((draft) => {
                    const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id);
                    target.date = value;
                  })} type="date" value={payment.date} />
                  {payment.kind !== 'Bonificacion' ? (
                    <SelectField label="Modo" onChange={(value) => updateCase((draft) => {
                      const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id);
                      target.mode = value;
                      if (value !== 'Otro') target.modeDetail = '';
                    })} options={PAYMENT_MODES} value={payment.mode} />
                  ) : null}
                </div>

                {payment.kind !== 'Bonificacion' && payment.mode === 'Otro' ? (
                  <DataField label="Detalle modo otro" onChange={(value) => updateCase((draft) => {
                    const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id);
                    target.modeDetail = value;
                  })} value={payment.modeDetail} />
                ) : null}

                {payment.kind === 'Bonificacion' ? (
                  <DataField label="Motivo bonificación" onChange={(value) => updateCase((draft) => {
                    const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id);
                    target.reason = value;
                  })} value={payment.reason} />
                ) : null}

                <div className="actions-row compact-actions">
                  <StatusBadge tone={payment.kind === 'Bonificacion' ? 'info' : payment.kind === 'Total' ? 'success' : 'danger'}>
                    {payment.kind}
                  </StatusBadge>
                  <button className="ghost-button" onClick={() => updateCase((draft) => {
                    draft.thirdParty.payments.clientPayments = draft.thirdParty.payments.clientPayments.filter((entry) => entry.id !== payment.id);
                  })} type="button">Eliminar</button>
                </div>
              </div>
            ))}
          </div>

          {item.computed.thirdParty.hasExtraWorks && !item.thirdParty.payments.clientPayments.length ? (
            <div className="inline-alert danger-banner">Las tareas extras impactan en el cierre económico: registrá el cobro particular para llevar el saldo a cero.</div>
          ) : null}
          <button className="secondary-button" onClick={() => flash('Documentación de pagos demo: acá abrirías recibos, transferencias o respaldos contables del tramo mixto.')} type="button">Documentación pagos</button>
        </article>
      </div>
    );
  }

  if (isInsuranceWorkflowCase(item)) {
    const isCleas = isCleasCase(item);
    const cleasClientChargeFlow = isCleas && item.computed.todoRisk.cleasScope === 'Sobre franquicia' && item.computed.todoRisk.dictamen === 'En contra';

    const addInvoice = () => {
      updateCase((draft) => {
        draft.payments.invoice = 'SI';
        draft.payments.invoices = [
          ...(draft.payments.invoices || []),
          createTodoRiskInvoice({
            amount: String(item.computed.todoRisk.amountToInvoice || ''),
            issuedAt: draft.payments.passedToPaymentsDate || draft.todoRisk.processing.quoteDate || '',
          }),
        ];
      });
    };

    return (
      <div className="tab-layout todo-risk-layout">
        <div className="subtabs-row">
          {[
            { id: 'facturacion', label: 'Facturación' },
            { id: 'pagos', label: 'Pagos' },
          ].map((tab) => (
            <button className={`subtab-button ${activePaymentTab === tab.id ? 'is-active' : ''}`} key={tab.id} onClick={() => setActivePaymentTab(tab.id)} type="button">
              {tab.label}
            </button>
          ))}
        </div>

        {activePaymentTab === 'facturacion' ? <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Facturación</p>
              <h3>Datos traídos desde Tramitación</h3>
            </div>
            <div className="tag-row">
              <StatusBadge tone={item.computed.todoRisk.paymentsReady ? 'success' : 'info'}>{item.computed.todoRisk.paymentStatus}</StatusBadge>
              <button className="secondary-button" onClick={addInvoice} type="button">Agregar factura</button>
            </div>
          </div>

          <div className="form-grid four-columns compact-grid">
            <DataField label="Cía. aseguradora" onChange={() => {}} readOnly value={item.todoRisk.insurance.company} />
            <DataField label="N° de siniestro" onChange={() => {}} readOnly value={item.claimNumber || ''} />
            <DataField label="A facturar Cía." onChange={() => {}} readOnly value={item.computed.todoRisk.amountToInvoice} />
            <DataField label="Fecha de acuerdo" onChange={() => {}} readOnly type="date" value={item.todoRisk.processing.quoteDate} />
            {isCleas ? <DataField label="Monto franquicia" onChange={() => {}} readOnly value={item.computed.todoRisk.franchiseAmount || '0'} /> : null}
            {cleasClientChargeFlow ? <DataField label="Pago franquicia Cía." onChange={() => {}} readOnly value={item.computed.todoRisk.companyFranchisePaymentAmount} /> : null}
            {cleasClientChargeFlow ? <DataField label="A cargo del cliente" onChange={() => {}} readOnly value={item.computed.todoRisk.clientChargeAmount} /> : null}
            <DataField label="Cliente firma conforme" onChange={(value) => updateCase((draft) => { draft.payments.signedAgreementDate = value; })} type="date" value={item.payments.signedAgreementDate || ''} />
            <DataField label="Pasado a pagos" onChange={(value) => updateCase((draft) => { draft.payments.passedToPaymentsDate = value; })} type="date" value={item.payments.passedToPaymentsDate || ''} />
            <DataField label="Fecha estimada pago" onChange={(value) => updateCase((draft) => { draft.payments.estimatedPaymentDate = value; })} type="date" value={item.payments.estimatedPaymentDate || ''} />
            <DataField label="Razón social" onChange={(value) => updateCase((draft) => { draft.payments.businessName = value; })} value={item.payments.businessName || ''} />
          </div>

          <div className="budget-lines">
            {(item.payments.invoices || []).map((invoice) => (
              <div className="budget-line" key={invoice.id}>
                <DataField label="N° factura" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.invoiceNumber = value; if (!draft.payments.invoiceNumber) draft.payments.invoiceNumber = value; })} value={invoice.invoiceNumber} />
                <DataField label="Importe total" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.amount = value; })} value={invoice.amount} />
                <DataField label="Fecha factura" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.issuedAt = value; })} type="date" value={invoice.issuedAt} />
                <DataField label="Notas" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.notes = value; })} value={invoice.notes} />
              </div>
            ))}
          </div>
        </article> : null}

        {activePaymentTab === 'pagos' ? <article className="card inner-card">
          <div className="section-head small-gap">
            <div>
              <p className="eyebrow">Pagos</p>
              <h3>Fecha manual y estado automático</h3>
            </div>
            <StatusBadge tone={getStatusTone(item.computed.todoRisk.paymentStatus)}>{item.computed.todoRisk.paymentStatus}</StatusBadge>
          </div>

          <div className="form-grid four-columns compact-grid">
            <DataField label="Fecha de pago" onChange={(value) => updateCase((draft) => { draft.payments.paymentDate = value; })} type="date" value={item.payments.paymentDate || ''} />
            <DataField label="Monto depositado" onChange={(value) => updateCase((draft) => { draft.payments.depositedAmount = value; })} value={item.payments.depositedAmount || ''} />
            <ToggleField label="Retenciones" onChange={(value) => updateCase((draft) => { draft.payments.hasRetentions = value; })} value={item.payments.hasRetentions || 'NO'} />
            {isCleas ? <DataField label="CLEAS sobre" onChange={() => {}} readOnly value={item.computed.todoRisk.cleasScope || '-'} /> : <DataField label="Estado franquicia" onChange={() => {}} readOnly value={item.todoRisk.franchise.status} />}
            {isCleas ? <DataField label="Monto franquicia" onChange={() => {}} readOnly value={item.computed.todoRisk.franchiseAmount || '0'} /> : <DataField label="Monto franquicia" onChange={() => {}} readOnly value={item.todoRisk.franchise.amount || '0'} />}
            {isCleas ? <DataField label="Dictamen" onChange={() => {}} readOnly value={item.computed.todoRisk.dictamen} /> : <DataField label="Recupero" onChange={() => {}} readOnly value={item.todoRisk.franchise.recoveryType || 'Pendiente'} />}
            {isCleas ? <DataField label="N° de CLEAS" onChange={() => {}} readOnly value={item.todoRisk.insurance.cleasNumber || '-'} /> : <DataField label="Caso asociado" onChange={() => {}} readOnly value={item.todoRisk.franchise.associatedCase || '-'} />}
            {cleasClientChargeFlow ? <DataField label="Pago franquicia Cía." onChange={() => {}} readOnly value={item.computed.todoRisk.companyFranchisePaymentAmount} /> : null}
            {cleasClientChargeFlow ? <DataField label="A cargo del cliente" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.clientChargeAmount = value; })} value={item.todoRisk.processing.clientChargeAmount || ''} /> : null}
            {cleasClientChargeFlow ? <SelectField label="Estado pago cliente" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.clientChargeStatus = value; })} options={CLEAS_PAYMENT_STATUS_OPTIONS} value={item.todoRisk.processing.clientChargeStatus} /> : null}
            {cleasClientChargeFlow ? <DataField label="Fecha pago cliente" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.clientChargeDate = value; })} type="date" value={item.todoRisk.processing.clientChargeDate || ''} /> : null}
          </div>

          {item.payments.hasRetentions === 'SI' ? (
            <div className="form-grid six-columns compact-grid retention-grid">
              <DataField label="IVA" onChange={(value) => updateCase((draft) => { draft.payments.retentions.iva = value; })} value={item.payments.retentions?.iva || ''} />
              <DataField label="Ganancias" onChange={(value) => updateCase((draft) => { draft.payments.retentions.gains = value; })} value={item.payments.retentions?.gains || ''} />
              <DataField label="Contr. Patr." onChange={(value) => updateCase((draft) => { draft.payments.retentions.employerContribution = value; })} value={item.payments.retentions?.employerContribution || ''} />
              <DataField label="IIBB" onChange={(value) => updateCase((draft) => { draft.payments.retentions.iibb = value; })} value={item.payments.retentions?.iibb || ''} />
              <DataField label="DREI" onChange={(value) => updateCase((draft) => { draft.payments.retentions.drei = value; })} value={item.payments.retentions?.drei || ''} />
              <DataField label="Otra" onChange={(value) => updateCase((draft) => { draft.payments.retentions.other = value; })} value={item.payments.retentions?.other || ''} />
            </div>
          ) : null}

          <div className="budget-ready-panel budget-ready-panel-compact">
            <StatusBadge tone={item.computed.todoRisk.paymentsReady ? 'success' : 'danger'}>{item.computed.todoRisk.paymentsReady ? 'Pagos en azul/verde operativo' : 'Pagos todavía no cierra'}</StatusBadge>
            <small>{cleasClientChargeFlow ? 'Condición: fecha de pago + monto + retenciones definidas si corresponde + pago cliente cancelado cuando aplica CLEAS sobre franquicia.' : 'Condición: fecha de pago + monto + retenciones definidas si corresponde + franquicia no pendiente.'}</small>
          </div>
          <button className="secondary-button" onClick={() => flash('Documentación de pagos demo: acá abrirías la carpeta o adjuntos contables.') } type="button">Documentación pagos</button>
        </article> : null}
      </div>
    );
  }

  const addSettlement = () => {
    updateCase((draft) => {
      draft.payments.settlements.push(createSettlement());
    });
  };

  const paymentEvents = collectPaymentEvents([item]);

  const openReceiptDemo = () => {
    const printable = window.open('', '_blank', 'noopener,noreferrer,width=980,height=860');

    if (!printable) {
      return;
    }

    printable.document.write(`<!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Recibo demo ${escapeHtml(item.code)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 28px; color: #18252f; }
            h1, h2, p { margin: 0; }
            .stack { display: grid; gap: 12px; }
            .card { border: 1px solid #c9d5dc; border-radius: 12px; padding: 16px; margin-top: 16px; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
            .row { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid #eef2f4; padding: 8px 0; }
            small { color: #5f7481; }
          </style>
        </head>
        <body>
          <div class="stack">
            <div>
              <h1>Recibo demo Particular</h1>
              <p>${escapeHtml(item.code)} - ${escapeHtml(`${item.customer.lastName}, ${item.customer.firstName}`)}</p>
            </div>
            <div class="card grid">
              <div>
                <small>Vehículo</small>
                <p>${escapeHtml(`${item.vehicle.brand} ${item.vehicle.model} - ${item.vehicle.plate}`)}</p>
              </div>
              <div>
                <small>Comprobante</small>
                <p>${escapeHtml(item.payments.comprobante)}</p>
              </div>
              <div>
                <small>Total cotizado</small>
                <p>${escapeHtml(money(item.computed.totalQuoted))}</p>
              </div>
              <div>
                <small>Saldo deudor</small>
                <p>${escapeHtml(money(item.computed.balance))}</p>
              </div>
            </div>
            <div class="card">
              <h2>Movimientos</h2>
              ${paymentEvents.map((event) => `
                <div class="row">
                  <span>${escapeHtml(event.type)} - ${escapeHtml(formatDate(event.date))}</span>
                  <strong>${escapeHtml(money(event.amount))}</strong>
                </div>`).join('') || '<p>Sin movimientos registrados.</p>'}
            </div>
          </div>
        </body>
      </html>`);
    printable.document.close();
    printable.focus();
    printable.print();
  };

  return (
    <div className="tab-layout">
      <article className="card inner-card receipt-shell">
        <div className="section-head">
          <div>
            <p className="eyebrow">Pagos</p>
            <h3>Comprobante, saldo y lectura contable</h3>
          </div>
          <StatusBadge tone={item.computed.balance === 0 ? 'success' : 'danger'}>{money(item.computed.balance)}</StatusBadge>
        </div>

        <div className="receipt-grid">
          <div className="summary-stack">
            <div className="summary-row"><span>Cliente</span><strong>{getFolderDisplayName(item)}</strong></div>
            <div className="summary-row"><span>Vehiculo</span><strong>{item.vehicle.brand} {item.vehicle.model} - {item.vehicle.plate}</strong></div>
            <div className="summary-row"><span>Repuestos</span><strong>{money(item.computed.partsTotal)}</strong></div>
            <div className="summary-row"><span>Mano de obra</span><strong>{money(item.payments.comprobante === 'A' ? item.computed.laborWithVat : item.computed.laborWithoutVat)}</strong></div>
            <div className="summary-row"><span>Total cotizado</span><strong>{money(item.computed.totalQuoted)}</strong></div>
            <div className="summary-row"><span>Retenciones cargadas</span><strong>{money(item.computed.totalRetentions)}</strong></div>
          </div>

          <div className="form-grid two-columns compact-grid">
            <SelectField label="Comprobante" onChange={(value) => updateCase((draft) => { draft.payments.comprobante = value; })} options={COMPROBANTES} value={item.payments.comprobante} />
            <ToggleField label="Factura" onChange={(value) => updateCase((draft) => { draft.payments.invoice = value; if (value !== 'SI') { draft.payments.businessName = ''; draft.payments.invoiceNumber = ''; } })} value={item.payments.invoice} />
            <ToggleField label="Senia" onChange={(value) => updateCase((draft) => { draft.payments.hasSena = value; if (value !== 'SI') { draft.payments.senaAmount = ''; draft.payments.senaDate = ''; draft.payments.senaModeDetail = ''; } })} value={item.payments.hasSena} />
          </div>
        </div>

        {item.payments.hasSena === 'SI' ? (
          <div className="form-grid four-columns compact-grid">
            <DataField label="Monto senia" onChange={(value) => updateCase((draft) => { draft.payments.senaAmount = value; })} value={item.payments.senaAmount} />
            <DataField label="Fecha senia" onChange={(value) => updateCase((draft) => { draft.payments.senaDate = value; })} type="date" value={item.payments.senaDate} />
            <SelectField label="Modo" onChange={(value) => updateCase((draft) => { draft.payments.senaMode = value; if (value !== 'Otro') draft.payments.senaModeDetail = ''; })} options={PAYMENT_MODES} value={item.payments.senaMode} />
            {item.payments.senaMode === 'Otro' ? (
              <DataField label="Detalle modo otro" onChange={(value) => updateCase((draft) => { draft.payments.senaModeDetail = value; })} value={item.payments.senaModeDetail} />
            ) : null}
          </div>
        ) : null}

        {item.payments.invoice === 'SI' ? (
          <div className="form-grid two-columns compact-grid">
            <DataField label="Razon social" onChange={(value) => updateCase((draft) => { draft.payments.businessName = value; })} value={item.payments.businessName} />
            <DataField label="Numero factura" onChange={(value) => updateCase((draft) => { draft.payments.invoiceNumber = value; })} value={item.payments.invoiceNumber} />
          </div>
        ) : null}
      </article>

      <article className="card inner-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Cancelaciones</p>
            <h3>Parcial, total o bonificacion</h3>
          </div>
          <div className="tag-row">
            <button className="secondary-button" onClick={openReceiptDemo} type="button">Recibo / PDF demo</button>
            <button className="secondary-button" onClick={addSettlement} type="button">+ Agregar pago</button>
          </div>
        </div>

        <div className="budget-lines">
          {item.payments.settlements.map((settlement) => (
            <div className="settlement-card" key={settlement.id}>
              <div className={`form-grid compact-grid ${settlement.kind === 'Bonificacion' ? 'three-columns' : 'four-columns'}`}>
                <SelectField label="Cancela saldo" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.kind = value;
                  if (value === 'Bonificacion') {
                    target.mode = '';
                    target.modeDetail = '';
                    target.gainsRetention = '';
                    target.ivaRetention = '';
                    target.dreiRetention = '';
                    target.employerContributionRetention = '';
                    target.iibbRetention = '';
                    return;
                  }
                  target.reason = '';
                  if (!target.mode) {
                    target.mode = PAYMENT_MODES[0];
                  }
                })} options={['Parcial', 'Total', 'Bonificacion']} value={settlement.kind} />
                <DataField label="Monto" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.amount = value;
                })} value={settlement.amount} />
                <DataField label="Fecha" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.date = value;
                })} type="date" value={settlement.date} />
                {settlement.kind !== 'Bonificacion' ? (
                  <SelectField label="Modo" onChange={(value) => updateCase((draft) => {
                    const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                    target.mode = value;
                    if (value !== 'Otro') target.modeDetail = '';
                  })} options={PAYMENT_MODES} value={settlement.mode} />
                ) : null}
              </div>

              {settlement.kind !== 'Bonificacion' && settlement.mode === 'Otro' ? (
                <DataField label="Detalle modo otro" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.modeDetail = value;
                })} value={settlement.modeDetail} />
              ) : null}

              {settlement.kind === 'Bonificacion' ? (
                <DataField label="Motivo bonificacion" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.reason = value;
                })} value={settlement.reason} />
              ) : null}

              {settlement.kind !== 'Bonificacion' ? (
                <div className="form-grid five-columns compact-grid retention-grid">
                  <DataField label="Ganancias" onChange={(value) => updateCase((draft) => {
                    const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                    target.gainsRetention = value;
                  })} value={settlement.gainsRetention} />
                  <DataField label="IVA" onChange={(value) => updateCase((draft) => {
                    const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                    target.ivaRetention = value;
                  })} value={settlement.ivaRetention} />
                  <DataField label="DREI" onChange={(value) => updateCase((draft) => {
                    const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                    target.dreiRetention = value;
                  })} value={settlement.dreiRetention} />
                  <DataField label="Contr. Pat." onChange={(value) => updateCase((draft) => {
                    const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                    target.employerContributionRetention = value;
                  })} value={settlement.employerContributionRetention} />
                  <DataField label="IIBB" onChange={(value) => updateCase((draft) => {
                    const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                    target.iibbRetention = value;
                  })} value={settlement.iibbRetention} />
                </div>
              ) : null}

              <div className="actions-row compact-actions">
                <StatusBadge tone={settlement.kind === 'Bonificacion' ? 'info' : settlement.kind === 'Total' ? 'success' : 'danger'}>
                  {settlement.kind}
                </StatusBadge>
                <button className="ghost-button" onClick={() => updateCase((draft) => {
                  draft.payments.settlements = draft.payments.settlements.filter((entry) => entry.id !== settlement.id);
                })} type="button">Eliminar</button>
              </div>
            </div>
          ))}
        </div>

        <div className="receipt-demo">
          <div>
            <span>Recibo demo</span>
            <strong>{item.code}</strong>
          </div>
          <div>
            <span>Total cotizado segun comprobante {item.payments.comprobante}</span>
            <strong>{money(item.computed.totalQuoted)}</strong>
          </div>
          <div>
            <span>Saldo deudor</span>
            <strong>{money(item.computed.balance)}</strong>
          </div>
        </div>
      </article>

      <article className="card inner-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Vista contable</p>
            <h3>Ordenado por fecha de cobro</h3>
          </div>
          <StatusBadge tone="info">{paymentEvents.length} movimientos</StatusBadge>
        </div>

        <div className="table-wrap">
          <table className="data-table compact-table accounting-table">
            <thead>
              <tr>
                <th>Fecha efectivo pago</th>
                <th>Monto depositado</th>
                <th>Ganancias</th>
                <th>IVA</th>
                <th>DREI</th>
                <th>Contr. Pat.</th>
                <th>IIBB</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {paymentEvents.map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.date)}</td>
                  <td>{money(event.amount)}</td>
                  <td>{money(event.gainsRetention)}</td>
                  <td>{money(event.ivaRetention)}</td>
                  <td>{money(event.dreiRetention)}</td>
                  <td>{money(event.employerContributionRetention)}</td>
                  <td>{money(event.iibbRetention)}</td>
                  <td>
                    <strong>{event.type}</strong>
                    <small>{event.folderName}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

function AbogadoTab({ item, updateCase, flash }) {
  if (!isThirdPartyLawyerCase(item)) {
    return null;
  }

  const includesInjuries = item.computed.lawyer.includesInjuries;
  const isJudicial = item.computed.lawyer.isJudicial;
  const expensesTotal = item.computed.lawyer.expensesTotal;
  const agendaPendingCount = item.lawyer.agenda.filter((task) => !isAgendaTaskResolved(task)).length;
  const statusUpdateCount = item.lawyer.statusUpdates.length;
  const instanceLabel = isJudicial ? 'Instancia judicial' : 'Instancia administrativa';
  const instanceDescription = isJudicial
    ? 'Expone CUIJ, juzgado y autos y ayuda a leer el cierre separando rubros del taller y del expediente.'
    : 'Mantiene una lectura mas liviana, referenciada por siniestro, sin datos propios de juzgado.';

  const addExpedienteDocument = () => {
    updateCase((draft) => {
      draft.lawyer.expedienteDocuments.push(createTodoRiskDocument({ category: 'Escrito' }));
    });
  };

  const addStatusUpdate = () => {
    updateCase((draft) => {
      draft.lawyer.statusUpdates.push(createLawyerStatusUpdate());
    });
  };

  const addAgendaTask = () => {
    updateCase((draft) => {
      draft.lawyer.agenda.push(createTodoRiskTask({
        sourceArea: 'Abogado',
        sourceLabel: 'Abogado',
        relatedTab: 'abogado',
        linkedCaseId: draft.id,
        linkedCaseCode: draft.code,
      }));
    });
  };

  const addInjured = () => {
    updateCase((draft) => {
      draft.lawyer.injuredParties.push(createLawyerInjured());
    });
  };

  const addExpense = () => {
    updateCase((draft) => {
      draft.lawyer.closure.expenses.push(createLawyerExpense());
    });
  };

  const addClosureItem = () => {
    updateCase((draft) => {
      draft.lawyer.closure.items.push(createLawyerClosureItem());
    });
  };

  const downloadExpensesExcel = () => {
    const csv = [
      ['Concepto', 'Monto', 'Fecha', 'Abonó'].map(escapeCsvValue).join(','),
      ...item.lawyer.closure.expenses.map((expense) => [expense.concept, expense.amount, expense.date, expense.paidBy].map(escapeCsvValue).join(',')),
    ].join('\n');
    triggerDownload(`gastos-${item.code}.csv`, csv, 'text/csv;charset=utf-8;');
    flash('Descargar Excel demo: se exportó la planilla de gastos del expediente.');
  };

  return (
    <div className="tab-layout lawyer-layout">
      <article className="card inner-card lawyer-summary-card">
        <div className="section-head small-gap">
          <div>
            <p className="eyebrow">Abogado</p>
            <h3>Gestión legal y cierre</h3>
          </div>
          <StatusBadge tone={item.computed.tabs.abogado === 'resolved' ? 'success' : 'info'}>{item.computed.tabs.abogado === 'resolved' ? 'Cierre legal listo' : 'Seguimiento abierto'}</StatusBadge>
        </div>
        <div className="form-grid four-columns compact-grid">
          <SelectField label="Tramita" onChange={(value) => updateCase((draft) => { draft.lawyer.tramita = value; })} options={LAWYER_TRAMITA_OPTIONS} value={item.lawyer.tramita} />
          <SelectField label="Reclama" onChange={(value) => updateCase((draft) => { draft.lawyer.reclama = value; })} options={LAWYER_RECLAMA_OPTIONS} value={item.lawyer.reclama} />
          <SelectField label="Instancia" onChange={(value) => updateCase((draft) => { draft.lawyer.instance = value; if (value !== 'Judicial') { draft.lawyer.cuij = ''; draft.lawyer.court = ''; draft.lawyer.autos = ''; } })} options={LAWYER_INSTANCE_OPTIONS} value={item.lawyer.instance} />
          <DataField label="Días tramitando" onChange={() => {}} readOnly value={item.computed.lawyer.daysProcessing} />
          <DataField label="Fecha ingreso" onChange={(value) => updateCase((draft) => { draft.lawyer.entryDate = value; })} type="date" value={item.lawyer.entryDate} />
          {isJudicial ? <DataField label="N° CUIJ" onChange={(value) => updateCase((draft) => { draft.lawyer.cuij = value; })} value={item.lawyer.cuij} /> : null}
          {isJudicial ? <DataField label="Juzgado" onChange={(value) => updateCase((draft) => { draft.lawyer.court = value; })} value={item.lawyer.court} /> : null}
          {isJudicial ? <DataField label="Autos" onChange={(value) => updateCase((draft) => { draft.lawyer.autos = value; })} value={item.lawyer.autos} /> : null}
          <DataField label="Abg. contraparte" onChange={(value) => updateCase((draft) => { draft.lawyer.opponentLawyer = value; })} value={item.lawyer.opponentLawyer} />
          <DataField label="Tel." onChange={(value) => updateCase((draft) => { draft.lawyer.opponentPhone = value; })} value={item.lawyer.opponentPhone} />
          <DataField label="Correo" onChange={(value) => updateCase((draft) => { draft.lawyer.opponentEmail = value; })} value={item.lawyer.opponentEmail} />
        </div>
        <div className={`lawyer-instance-banner ${isJudicial ? 'is-judicial' : 'is-administrative'}`}>
          <div className="stack-tight">
            <p className="eyebrow">Lectura de instancia</p>
            <h4>{instanceLabel}</h4>
            <p className="muted">{instanceDescription}</p>
          </div>
          <div className="tag-row">
            <StatusBadge tone={isJudicial ? 'info' : 'success'}>{instanceLabel}</StatusBadge>
            <StatusBadge tone={includesInjuries ? 'danger' : 'success'}>{includesInjuries ? 'Con lesiones' : 'Sin lesiones'}</StatusBadge>
          </div>
        </div>
      </article>

      {includesInjuries ? (
        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Reclamante lesiones</h3>
            <div className="tag-row">
              <StatusBadge tone="info">{item.lawyer.injuredParties.length} lesionado(s)</StatusBadge>
              <button className="secondary-button" onClick={addInjured} type="button">Agregar lesionado</button>
            </div>
          </div>
          <div className="budget-lines">
            {item.lawyer.injuredParties.map((injured) => (
              <div className="budget-line budget-line-extended" key={injured.id}>
                <SelectField label="Lesionado es" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.injuredRole = value; })} options={LAWYER_INJURED_ROLE_OPTIONS} value={injured.injuredRole} />
                <DataField label="Apellido" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.lastName = value; })} value={injured.lastName} />
                <DataField label="Nombre" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.firstName = value; })} value={injured.firstName} />
                <DataField label="DNI" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.document = value; })} value={injured.document} />
                <DataField label="Fecha nac." onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.birthDate = value; })} type="date" value={injured.birthDate} />
                <DataField label="Domicilio" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.address = value; })} value={injured.address} />
                <DataField label="Estado civil" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.civilStatus = value; })} value={injured.civilStatus} />
                <DataField label="Tel." onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.phone = value; })} value={injured.phone} />
                <DataField label="Correo" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.email = value; })} value={injured.email} />
                <DataField label="Profesión" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.profession = value; })} value={injured.profession} />
                <ToggleField label="Acredita ingresos" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.accreditsIncome = value; })} value={injured.accreditsIncome} />
                <DataField label="Anotaciones" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.notes = value; })} value={injured.notes} />
              </div>
            ))}
          </div>
        </article>
      ) : null}

      <details className="card inner-card collapsible-card" open>
        <summary className="collapsible-summary">
          <div className="collapsible-summary-copy">
            <strong>Observaciones y antecedentes del caso</strong>
            <small>Contexto legal y narrativa breve para entender en que tramo esta el reclamo.</small>
          </div>
          <span className="collapsible-summary-meta">{item.lawyer.observations ? 'Completo' : 'Pendiente'}</span>
        </summary>
        <label className="field">
          <span>Detalle</span>
          <textarea onChange={(event) => updateCase((draft) => { draft.lawyer.observations = event.target.value; })} value={item.lawyer.observations} />
        </label>
      </details>

      <details className="card inner-card collapsible-card" open>
        <summary className="collapsible-summary">
          <div className="collapsible-summary-copy">
            <strong>Documentación Expediente</strong>
            <small>Archivos legales separados de la documentación general del trámite.</small>
          </div>
          <span className="collapsible-summary-meta">{item.lawyer.expedienteDocuments.length} adjunto(s)</span>
        </summary>
        <div className="section-head">
          <p className="muted">Separada de la documentación general del trámite.</p>
          <div className="tag-row">
            <button className="secondary-button" onClick={addExpedienteDocument} type="button">Agregar ítem</button>
            <button className="secondary-button" onClick={() => flash('Descargar todo demo: se agruparían los archivos del expediente.')} type="button">Descargar todo</button>
          </div>
        </div>
        <div className="table-wrap table-wrap-framed">
          <table className="data-table compact-table">
            <thead>
              <tr><th>Categoría</th><th>Tipo archivo / nombre</th><th>Fecha de carga</th><th>Observaciones</th><th /></tr>
            </thead>
            <tbody>
              {item.lawyer.expedienteDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td><SelectField label="Categoría" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.expedienteDocuments.find((entry) => entry.id === doc.id); target.category = value; })} options={LAWYER_EXPEDIENT_DOC_CATEGORY_OPTIONS} value={doc.category} /></td>
                  <td><DataField label="Nombre" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.expedienteDocuments.find((entry) => entry.id === doc.id); target.name = value; })} value={doc.name} /></td>
                  <td><DataField label="Fecha" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.expedienteDocuments.find((entry) => entry.id === doc.id); target.uploadedAt = value; })} type="date" value={doc.uploadedAt} /></td>
                  <td><DataField label="Notas" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.expedienteDocuments.find((entry) => entry.id === doc.id); target.notes = value; })} value={doc.notes} /></td>
                  <td><button className="ghost-button" onClick={() => updateCase((draft) => { draft.lawyer.expedienteDocuments = draft.lawyer.expedienteDocuments.filter((entry) => entry.id !== doc.id); })} type="button">Quitar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <details className="card inner-card collapsible-card lawyer-section-card" open>
        <summary className="collapsible-summary">
          <div className="collapsible-summary-copy">
            <strong>Estado del expediente</strong>
            <small>Novedades procesales y aviso al cliente en un mismo bloque.</small>
          </div>
          <span className="collapsible-summary-meta">{statusUpdateCount} novedad(es)</span>
        </summary>
        <div className="section-head small-gap">
          <p className="muted">Ordena seguimiento interno y confirma si cada novedad ya se comunicó.</p>
          <div className="tag-row">
            <StatusBadge tone="info">{statusUpdateCount} novedades</StatusBadge>
            <button className="secondary-button" onClick={addStatusUpdate} type="button">Agregar novedad</button>
          </div>
        </div>
        <div className="table-wrap table-wrap-framed">
          <table className="data-table compact-table">
            <thead>
              <tr><th>Actualización</th><th>Fecha novedad</th><th>Notifica a cliente</th><th /></tr>
            </thead>
            <tbody>
              {item.lawyer.statusUpdates.map((update) => (
                <tr key={update.id}>
                  <td><DataField label="Actualización" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.statusUpdates.find((entry) => entry.id === update.id); target.detail = value; })} value={update.detail} /></td>
                  <td><DataField label="Fecha" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.statusUpdates.find((entry) => entry.id === update.id); target.date = value; })} type="date" value={update.date} /></td>
                  <td><button className={`toggle-button ${update.notifyClient ? 'is-on' : ''}`} onClick={() => {
                    if (!update.notifyClient && !window.confirm('¿Confirmás que querés notificar al cliente esta novedad?')) {
                      return;
                    }
                    updateCase((draft) => { const target = draft.lawyer.statusUpdates.find((entry) => entry.id === update.id); target.notifyClient = !target.notifyClient; });
                  }} type="button">{update.notifyClient ? 'Sí' : 'No'}</button></td>
                  <td><button className="ghost-button" onClick={() => updateCase((draft) => { draft.lawyer.statusUpdates = draft.lawyer.statusUpdates.filter((entry) => entry.id !== update.id); })} type="button">Quitar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <details className="card inner-card collapsible-card lawyer-section-card" open>
        <summary className="collapsible-summary">
          <div className="collapsible-summary-copy">
            <strong>Agenda de tareas</strong>
            <small>Seguimiento corto para pendientes del abogado, cliente y taller.</small>
          </div>
          <span className="collapsible-summary-meta">{agendaPendingCount ? `${agendaPendingCount} pendiente(s)` : 'Sin pendientes'}</span>
        </summary>
        <div className="section-head small-gap">
          <p className="muted">Conviene usarlo para recordatorios operativos y no mezclarlo con novedades del expediente.</p>
          <div className="tag-row">
            <StatusBadge tone={agendaPendingCount ? 'danger' : 'success'}>{agendaPendingCount ? `${agendaPendingCount} pendiente(s)` : 'Sin pendientes'}</StatusBadge>
            <button className="secondary-button" onClick={addAgendaTask} type="button">Agregar tarea</button>
          </div>
        </div>
        <div className="table-wrap table-wrap-framed">
          <table className="data-table compact-table">
            <thead>
              <tr><th>Tarea</th><th>Descripción</th><th>Fecha límite</th><th>Prioridad</th><th>Estado</th><th>Responsable</th><th>Hecho</th></tr>
            </thead>
            <tbody>
              {item.lawyer.agenda.map((task) => {
                const normalizedTask = normalizeAgendaTask(task, { sourceArea: 'Abogado', sourceLabel: 'Abogado', relatedTab: 'abogado' });
                const dueMeta = getAgendaTaskDueMeta(normalizedTask.scheduledAt);

                return (
                  <tr className={`agenda-row is-${dueMeta.tone}`} key={task.id}>
                    <td><DataField label="Tarea" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.agenda.find((entry) => entry.id === task.id); target.title = value; })} value={normalizedTask.title} /></td>
                    <td><DataField label="Descripción" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.agenda.find((entry) => entry.id === task.id); target.description = value; })} value={normalizedTask.description} /></td>
                    <td>
                      <DataField label="Fecha límite" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.agenda.find((entry) => entry.id === task.id); target.scheduledAt = value; })} type="date" value={normalizedTask.scheduledAt} />
                      <small>{dueMeta.label}</small>
                    </td>
                    <td><SelectField label="Prioridad" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.agenda.find((entry) => entry.id === task.id); target.priority = value; })} options={TASK_PRIORITY_OPTIONS.map((value) => ({ value, label: getAgendaPriorityLabel(value) }))} value={normalizedTask.priority} /></td>
                    <td><SelectField label="Estado" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.agenda.find((entry) => entry.id === task.id); setAgendaTaskStatus(target, value); })} options={TASK_STATUS_OPTIONS.map((value) => ({ value, label: getAgendaStatusLabel(value) }))} value={normalizedTask.status} /></td>
                    <td><SelectField label="Responsable" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.agenda.find((entry) => entry.id === task.id); target.assignee = value; })} options={TODO_RIESGO_ASSIGNABLE_USERS} value={normalizedTask.assignee} /></td>
                    <td><input checked={normalizedTask.resolved} onChange={(event) => updateCase((draft) => { const target = draft.lawyer.agenda.find((entry) => entry.id === task.id); setAgendaTaskResolved(target, event.target.checked); })} type="checkbox" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>

      <details className="card inner-card collapsible-card lawyer-section-card" open>
        <summary className="collapsible-summary">
          <div className="collapsible-summary-copy">
            <strong>Cierre</strong>
            <small>Planilla de gastos, rubros y total manual del expediente.</small>
          </div>
          <span className="collapsible-summary-meta">{item.lawyer.closure.closeBy}</span>
        </summary>
        <div className="section-head small-gap">
          <div>
            <h3>Cierre</h3>
            <p className="muted">Planilla de gastos, rubros y total manual del expediente.</p>
          </div>
          <StatusBadge tone={item.lawyer.closure.closeBy === 'pendiente' ? 'danger' : 'success'}>{item.lawyer.closure.closeBy}</StatusBadge>
        </div>
        <div className="section-head small-gap">
          <h4>Planilla de gastos</h4>
          <div className="tag-row">
            <button className="secondary-button" onClick={addExpense} type="button">Agregar gasto</button>
            <button className="secondary-button" onClick={downloadExpensesExcel} type="button">Descargar Excel</button>
          </div>
        </div>
        <div className="table-wrap table-wrap-framed">
          <table className="data-table compact-table">
            <thead>
              <tr><th>Concepto</th><th>Monto</th><th>Fecha</th><th>Abonó</th><th /></tr>
            </thead>
            <tbody>
              {item.lawyer.closure.expenses.map((expense) => (
                <tr key={expense.id}>
                  <td><DataField label="Concepto" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.closure.expenses.find((entry) => entry.id === expense.id); target.concept = value; })} value={expense.concept} /></td>
                  <td><DataField label="Monto" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.closure.expenses.find((entry) => entry.id === expense.id); target.amount = value; })} value={expense.amount} /></td>
                  <td><DataField label="Fecha" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.closure.expenses.find((entry) => entry.id === expense.id); target.date = value; })} type="date" value={expense.date} /></td>
                  <td><SelectField label="Abonó" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.closure.expenses.find((entry) => entry.id === expense.id); target.paidBy = value; })} options={LAWYER_EXPENSE_PAID_BY_OPTIONS} value={expense.paidBy} /></td>
                  <td><button className="ghost-button" onClick={() => updateCase((draft) => { draft.lawyer.closure.expenses = draft.lawyer.closure.expenses.filter((entry) => entry.id !== expense.id); })} type="button">Quitar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="lawyer-total-row"><span>Total gastos</span><strong>{money(expensesTotal)}</strong></div>
        <div className="form-grid three-columns compact-grid">
          <SelectField label="Cierre por" onChange={(value) => updateCase((draft) => { draft.lawyer.closure.closeBy = value; })} options={LAWYER_CLOSE_BY_OPTIONS} value={item.lawyer.closure.closeBy} />
          <DataField label="Fecha" onChange={(value) => updateCase((draft) => { draft.lawyer.closure.closeDate = value; })} type="date" value={item.lawyer.closure.closeDate} />
          <DataField label="Importe total" onChange={(value) => updateCase((draft) => { draft.lawyer.closure.totalAmount = value; draft.payments.manualTotalAmount = value; })} value={item.lawyer.closure.totalAmount} />
        </div>
        <div className="section-head small-gap">
          <h4>Detalle de rubros</h4>
          <button className="secondary-button" onClick={addClosureItem} type="button">Agregar rubro</button>
        </div>
        <div className="table-wrap table-wrap-framed">
          <table className="data-table compact-table">
            <thead>
              <tr><th>Concepto</th><th>Monto</th><th>Fecha de pago</th><th>Suma Taller</th><th>Pagado</th><th /></tr>
            </thead>
            <tbody>
              {item.lawyer.closure.items.map((entry) => (
                <tr key={entry.id}>
                  <td><DataField label="Concepto" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.closure.items.find((itemEntry) => itemEntry.id === entry.id); target.concept = value; })} value={entry.concept} /></td>
                  <td><DataField label="Monto" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.closure.items.find((itemEntry) => itemEntry.id === entry.id); target.amount = value; })} value={entry.amount} /></td>
                  <td><DataField label="Fecha pago" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.closure.items.find((itemEntry) => itemEntry.id === entry.id); target.paymentDate = value; })} type="date" value={entry.paymentDate} /></td>
                  <td><SelectField label="Suma Taller" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.closure.items.find((itemEntry) => itemEntry.id === entry.id); target.sumWorkshop = value; })} options={['SI', 'NO']} value={entry.sumWorkshop} /></td>
                  <td><DataField label="Pagado" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.closure.items.find((itemEntry) => itemEntry.id === entry.id); target.paidDate = value; })} type="date" value={entry.paidDate} /></td>
                  <td><button className="ghost-button" onClick={() => updateCase((draft) => { draft.lawyer.closure.items = draft.lawyer.closure.items.filter((itemEntry) => itemEntry.id !== entry.id); })} type="button">Quitar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <label className="field">
          <span>Anotaciones</span>
          <textarea onChange={(event) => updateCase((draft) => { draft.lawyer.closure.notes = event.target.value; })} value={item.lawyer.closure.notes} />
        </label>
      </details>
    </div>
  );
}

function AgendaView({ items, onOpenCase, onUpdateTask }) {
  const [activeAgendaTab, setActiveAgendaTab] = useState('pendientes');
  const [assigneeFilter, setAssigneeFilter] = useState('Todos');
  const assigneeOptions = useMemo(() => ['Todos', ...new Set(items.map((task) => task.assignee).filter(Boolean))], [items]);

  const filteredItems = useMemo(
    () => items.filter((task) => assigneeFilter === 'Todos' || task.assignee === assigneeFilter),
    [assigneeFilter, items],
  );

  const counts = useMemo(() => ({
    pendientes: filteredItems.filter((task) => task.viewBucket === 'pendientes').length,
    resueltas: filteredItems.filter((task) => task.viewBucket === 'resueltas').length,
    vencidas: filteredItems.filter((task) => task.viewBucket === 'vencidas').length,
    proximas: filteredItems.filter((task) => !task.resolved && task.dueMeta.bucket === 'upcoming').length,
  }), [filteredItems]);

  const visibleItems = useMemo(() => filteredItems
    .filter((task) => task.viewBucket === activeAgendaTab)
    .sort((left, right) => {
      const leftDate = left.scheduledAt || '9999-12-31';
      const rightDate = right.scheduledAt || '9999-12-31';

      if (activeAgendaTab === 'resueltas') {
        return (right.resolvedAt || right.scheduledAt || '').localeCompare(left.resolvedAt || left.scheduledAt || '');
      }

      return leftDate.localeCompare(rightDate) || left.caseCode.localeCompare(right.caseCode);
    }), [activeAgendaTab, filteredItems]);

  const calendarCells = useMemo(() => {
    const today = new Date(`${todayIso()}T12:00:00`);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0);
    const startDay = (monthStart.getDay() + 6) % 7;
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - startDay);

    return Array.from({ length: 35 }, (_, index) => {
      const current = new Date(gridStart);
      current.setDate(gridStart.getDate() + index);
      const iso = current.toISOString().slice(0, 10);
      const dayItems = filteredItems.filter((task) => task.scheduledAt === iso);

      return {
        iso,
        date: current,
        inCurrentMonth: current.getMonth() === today.getMonth(),
        tasks: dayItems,
      };
    });
  }, [filteredItems]);

  return (
    <div className="agenda-layout">
      <section className="hero-panel compact-hero agenda-hero">
        <div>
          <p className="eyebrow">Agenda transversal</p>
          <h1>Tareas por usuario y por caso</h1>
          <p className="muted">Consolida recordatorios reales de Gestión del trámite, Reparación y Abogado sin tocar el flujo principal del caso.</p>
        </div>
        <div className="hero-actions agenda-hero-actions">
          <article className="metric-card">
            <span>Pendientes</span>
            <strong>{counts.pendientes}</strong>
            <small>Abiertas y no vencidas</small>
          </article>
          <article className="metric-card">
            <span>Vencidas</span>
            <strong>{counts.vencidas}</strong>
            <small>Requieren atención hoy</small>
          </article>
          <article className="metric-card">
            <span>Próximas</span>
            <strong>{counts.proximas}</strong>
            <small>Vencen en 48 hs</small>
          </article>
        </div>
      </section>

      <section className="card inner-card agenda-filter-card">
        <div className="section-head small-gap">
          <div>
            <h3>Vistas del panel</h3>
            <p className="muted">Filtrá por responsable y trabajá sobre la misma tarea desde Agenda o desde el caso.</p>
          </div>
          <div className="tag-row agenda-filter-select">
            <SelectField label="Usuario" onChange={setAssigneeFilter} options={assigneeOptions} value={assigneeFilter} />
          </div>
        </div>
        <div className="agenda-view-tabs" role="tablist" aria-label="Vistas de agenda">
          {[
            { id: 'pendientes', label: 'Pendientes', count: counts.pendientes },
            { id: 'resueltas', label: 'Resueltas', count: counts.resueltas },
            { id: 'vencidas', label: 'Vencidas', count: counts.vencidas },
          ].map((tab) => (
            <button
              className={`compact-button agenda-tab-button ${activeAgendaTab === tab.id ? 'is-selected' : ''}`}
              key={tab.id}
              onClick={() => setActiveAgendaTab(tab.id)}
              type="button"
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </section>

      <div className="agenda-content-grid">
        <article className="card inner-card">
          <div className="section-head small-gap">
            <div>
              <h3>{activeAgendaTab === 'pendientes' ? 'Pendientes por usuario' : activeAgendaTab === 'resueltas' ? 'Tareas resueltas' : 'Tareas vencidas'}</h3>
              <p className="muted">{visibleItems.length ? 'Cada fila mantiene vínculo directo con el caso y con la solapa de origen.' : 'No hay tareas para esta vista con el filtro actual.'}</p>
            </div>
            <StatusBadge tone={activeAgendaTab === 'resueltas' ? 'success' : activeAgendaTab === 'vencidas' ? 'danger' : 'info'}>{visibleItems.length} tarea(s)</StatusBadge>
          </div>

          {visibleItems.length ? (
            <div className="table-wrap agenda-table-wrap">
              <table className="data-table compact-table agenda-table">
                <thead>
                  <tr>
                    <th>Tarea</th>
                    <th>Vinculo</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Responsable</th>
                    <th>Fecha límite</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((task) => (
                    <tr className={`agenda-row is-${task.dueMeta.tone}`} key={`${task.caseId}-${task.collectionKey}-${task.id}`}>
                      <td>
                        <div className="agenda-task-copy">
                          <strong>{task.title || 'Tarea sin título'}</strong>
                          <small>{task.description || 'Sin descripción operativa.'}</small>
                        </div>
                      </td>
                      <td>
                        <div className="agenda-task-linkage">
                          <strong>{task.caseCode}</strong>
                          <small>{task.sourceLabel}</small>
                        </div>
                      </td>
                      <td><StatusBadge tone={getAgendaPriorityTone(task.priority)}>{getAgendaPriorityLabel(task.priority)}</StatusBadge></td>
                      <td>
                        <SelectField
                          label="Estado"
                          onChange={(value) => onUpdateTask(task, (draftTask) => setAgendaTaskStatus(draftTask, value))}
                          options={TASK_STATUS_OPTIONS.map((value) => ({ value, label: getAgendaStatusLabel(value) }))}
                          value={task.status}
                        />
                      </td>
                      <td>{task.assignee}</td>
                      <td>
                        <div className="agenda-task-due">
                          <strong>{formatDate(task.scheduledAt)}</strong>
                          <small>{task.dueMeta.label}</small>
                        </div>
                      </td>
                      <td>
                        <div className="agenda-action-group">
                          <button className="secondary-button" onClick={() => onOpenCase(task.caseId, { tab: task.relatedTab || 'tramite', subtab: task.relatedSubtab || '' })} type="button">Abrir caso</button>
                          <button className="ghost-button" onClick={() => onUpdateTask(task, (draftTask) => setAgendaTaskResolved(draftTask, !isAgendaTaskResolved(draftTask)))} type="button">{task.resolved ? 'Reabrir' : 'Resolver'}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-media agenda-empty-state">No hay tareas para mostrar en esta combinación de filtros.</div>
          )}
        </article>

        <article className="card inner-card agenda-calendar-card">
          <div className="section-head small-gap">
            <div>
              <h3>Calendario demo</h3>
              <p className="muted">Vista mensual simple con concentración de vencimientos por día.</p>
            </div>
            <StatusBadge tone="info">Demo simple</StatusBadge>
          </div>
          <div className="agenda-calendar-weekdays">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="agenda-calendar-grid">
            {calendarCells.map((cell) => {
              const dueTone = cell.tasks.some((task) => task.dueMeta.bucket === 'overdue')
                ? 'danger'
                : cell.tasks.some((task) => task.dueMeta.bucket === 'upcoming')
                  ? 'warning'
                  : 'info';

              return (
                <article className={`agenda-calendar-cell ${cell.inCurrentMonth ? '' : 'is-muted'} ${cell.iso === todayIso() ? 'is-today' : ''}`} key={cell.iso}>
                  <div className="agenda-calendar-head">
                    <strong>{cell.date.getDate()}</strong>
                    {cell.tasks.length ? <StatusBadge tone={dueTone}>{cell.tasks.length}</StatusBadge> : null}
                  </div>
                  <div className="agenda-calendar-items">
                    {cell.tasks.slice(0, 3).map((task) => (
                      <button className={`agenda-calendar-task is-${task.dueMeta.tone}`} key={task.id} onClick={() => onOpenCase(task.caseId, { tab: task.relatedTab || 'tramite', subtab: task.relatedSubtab || '' })} type="button">
                        {task.caseCode} · {task.title || 'Tarea'}
                      </button>
                    ))}
                    {cell.tasks.length > 3 ? <small>+{cell.tasks.length - 3} más</small> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </article>
      </div>
    </div>
  );
}

function GestionView({ item, activeTab, onChangeTab, activeRepairTab, onChangeRepairTab, updateCase, flash, allCases = [] }) {
  if (!item) {
    return (
      <div className="page-stack">
        <section className="card empty-state">
          <h2>No hay carpeta seleccionada.</h2>
          <p>Elegi un caso desde Panel General o generalo en Nuevo Caso.</p>
        </section>
      </div>
    );
  }

  const franchiseRecovery = isFranchiseRecoveryCase(item);
  const franchiseEnablesRepair = franchiseRecovery ? item.franchiseRecovery?.enablesRepair !== 'NO' : true;
  const supportsTramiteTab = isInsuranceWorkflowCase(item) || franchiseRecovery;
  const tabs = isThirdPartyLawyerCase(item)
    ? [
      { id: 'ficha', label: 'Ficha Tecnica' },
      { id: 'tramite', label: 'Gestion del trámite' },
      { id: 'presupuesto', label: 'Presupuesto' },
      { id: 'gestion', label: 'Gestion reparacion' },
      { id: 'pagos', label: 'Pagos' },
      { id: 'abogado', label: 'Abogado' },
    ]
    : isThirdPartyWorkshopCase(item)
    ? [
      { id: 'ficha', label: 'Ficha Tecnica' },
      { id: 'tramite', label: 'Gestion del trámite' },
      { id: 'presupuesto', label: 'Presupuesto' },
      { id: 'documentacion', label: 'Documentación' },
      { id: 'gestion', label: 'Gestion reparacion' },
      { id: 'pagos', label: 'Pagos' },
    ]
    : franchiseRecovery
    ? [
      { id: 'ficha', label: 'Ficha Tecnica' },
      { id: 'tramite', label: 'Gestion del trámite' },
      ...(franchiseEnablesRepair ? [{ id: 'presupuesto', label: 'Presupuesto' }, { id: 'gestion', label: 'Gestion reparacion' }] : []),
      { id: 'pagos', label: 'Pagos' },
    ]
    : isInsuranceWorkflowCase(item)
    ? [
      { id: 'ficha', label: 'Ficha Tecnica' },
      { id: 'tramite', label: 'Gestion del trámite' },
      { id: 'presupuesto', label: 'Presupuesto' },
      { id: 'gestion', label: 'Gestion reparacion' },
      { id: 'pagos', label: 'Pagos' },
    ]
    : [
      { id: 'ficha', label: 'Ficha Tecnica' },
      { id: 'presupuesto', label: 'Presupuesto' },
      { id: 'gestion', label: 'Gestion reparacion' },
      { id: 'pagos', label: 'Pagos' },
    ];

  const hasInteractiveInsuranceControls = isTodoRiesgoCase(item) || isCleasCase(item);
  const tramiteStepper = getTramiteStepperConfig(item);
  const repairStepper = getRepairStepperConfig(item);
  const tramiteActions = hasInteractiveInsuranceControls
    ? [
      { label: 'Sin presentar', active: item.computed.tramiteStatus === 'Sin presentar', disabled: false },
      {
        label: 'Presentado (PD) o En trámite',
        active: ['Presentado (PD)', 'En trámite'].includes(item.computed.tramiteStatus),
        disabled: !item.computed.todoRisk.canCompleteProcessingCore,
      },
      { label: 'Acordado', active: item.computed.tramiteStatus === 'Acordado', disabled: !item.todoRisk.processing.presentedDate },
      { label: 'Pasado a pagos', active: item.computed.tramiteStatus === 'Pasado a pagos', disabled: !item.computed.todoRisk.quoteAgreed },
      { label: 'Pagado', active: item.computed.tramiteStatus === 'Pagado', disabled: !item.payments.passedToPaymentsDate },
    ]
    : [];
  const repairActions = hasInteractiveInsuranceControls
    ? [
      { label: 'En trámite', active: item.computed.repairStatus === 'En trámite', disabled: false },
      {
        label: 'Faltan repuestos / Dar Turno',
        active: ['Faltan repuestos', 'Dar Turno'].includes(item.computed.repairStatus),
        disabled: !item.computed.todoRisk.quoteAgreed,
      },
      { label: 'Con Turno', active: item.computed.repairStatus === 'Con Turno', disabled: !item.computed.todoRisk.quoteAgreed },
      { label: 'Debe reingresar', active: item.computed.repairStatus === 'Debe reingresar', disabled: false },
      { label: 'Reparado', active: item.computed.repairStatus === 'Reparado', disabled: false },
      {
        label: 'No debe repararse',
        active: item.computed.repairStatus === 'No debe repararse',
        disabled: !item.todoRisk.processing.adminTurnOverride && item.computed.repairStatus !== 'No debe repararse',
      },
    ]
    : [];

  const handleTramiteAction = ({ label }) => {
    const today = todayIso();

    if (label === 'Sin presentar') {
      updateCase((draft) => {
        draft.todoRisk.processing.presentedDate = '';
        draft.todoRisk.processing.derivedToInspectionDate = '';
        draft.todoRisk.processing.quoteStatus = 'Pendiente';
        draft.todoRisk.processing.quoteDate = '';
        draft.todoRisk.processing.agreedAmount = '';
        draft.payments.passedToPaymentsDate = '';
        draft.payments.paymentDate = '';
        draft.payments.depositedAmount = '';
      });
      return;
    }

    if (!item.computed.todoRisk.canCompleteProcessingCore) {
      flash('Primero cargá fecha del siniestro y definí recupero en Franquicia.');
      return;
    }

    if (label === 'Presentado (PD) o En trámite') {
      updateCase((draft) => {
        draft.todoRisk.processing.presentedDate = draft.todoRisk.processing.presentedDate || today;
      });
      return;
    }

    if (!item.todoRisk.processing.presentedDate) {
      flash('No podés avanzar sin fecha de presentación.');
      return;
    }

    if (label === 'Acordado') {
      updateCase((draft) => {
        draft.todoRisk.processing.quoteStatus = 'Acordada';
        draft.todoRisk.processing.quoteDate = draft.todoRisk.processing.quoteDate || today;
        draft.todoRisk.processing.agreedAmount = draft.todoRisk.processing.agreedAmount || String(Math.max(numberValue(draft.budget.minimumLaborClose), numberValue(item.computed.totalQuoted)));
      });
      return;
    }

    if (!item.computed.todoRisk.quoteAgreed) {
      flash('Para pasar a pagos necesitás cotización acordada con fecha y monto.');
      return;
    }

    if (label === 'Pasado a pagos') {
      updateCase((draft) => {
        draft.payments.passedToPaymentsDate = draft.payments.passedToPaymentsDate || today;
      });
      return;
    }

    updateCase((draft) => {
      draft.payments.passedToPaymentsDate = draft.payments.passedToPaymentsDate || today;
      draft.payments.paymentDate = draft.payments.paymentDate || today;
      draft.payments.depositedAmount = draft.payments.depositedAmount || String(item.computed.todoRisk.amountToInvoice || 0);
      if (draft.payments.hasRetentions === 'SI') {
        draft.payments.retentions = {
          iva: draft.payments.retentions?.iva || '0',
          gains: draft.payments.retentions?.gains || '0',
          employerContribution: draft.payments.retentions?.employerContribution || '0',
          iibb: draft.payments.retentions?.iibb || '0',
          drei: draft.payments.retentions?.drei || '0',
          other: draft.payments.retentions?.other || '0',
        };
      }
    });
  };

  const handleRepairAction = ({ label }) => {
    const today = todayIso();

    if (label === 'En trámite') {
      updateCase((draft) => {
        draft.todoRisk.processing.noRepairNeeded = false;
        draft.repair.turno.date = '';
        draft.repair.egreso.date = '';
        draft.repair.egreso.definitiveExit = false;
      });
      return;
    }

    if (label === 'No debe repararse') {
      if (!item.todoRisk.processing.adminTurnOverride && item.computed.repairStatus !== 'No debe repararse') {
        flash('No debe repararse queda reservado como excepción demo controlada desde admin mock.');
        return;
      }

      updateCase((draft) => {
        draft.todoRisk.processing.noRepairNeeded = true;
      });
      return;
    }

    if (label === 'Reparado') {
      updateCase((draft) => {
        draft.todoRisk.processing.noRepairNeeded = false;
        draft.repair.egreso.date = draft.repair.egreso.date || today;
        draft.repair.egreso.shouldReenter = 'NO';
        draft.repair.egreso.definitiveExit = true;
      });
      return;
    }

    if (label === 'Debe reingresar') {
      updateCase((draft) => {
        draft.todoRisk.processing.noRepairNeeded = false;
        draft.repair.egreso.date = draft.repair.egreso.date || today;
        draft.repair.egreso.shouldReenter = 'SI';
        draft.repair.egreso.definitiveExit = false;
      });
      return;
    }

    if (!item.computed.todoRisk.quoteAgreed) {
      flash('Primero necesitás cotización acordada con fecha y monto.');
      return;
    }

    if (label === 'Faltan repuestos / Dar Turno') {
      updateCase((draft) => {
        draft.todoRisk.processing.noRepairNeeded = false;
        const hasPendingAuthorizedPart = draft.repair.parts.some(
          (part) => part.source === 'budget' && part.authorized === 'SI' && part.state !== 'Recibido',
        );

        draft.repair.parts.forEach((part) => {
          if (part.source !== 'budget') return;

          if (!part.authorized) {
            part.authorized = 'SI';
          }

          if (part.authorized === 'SI') {
            part.state = hasPendingAuthorizedPart ? (part.state === 'Recibido' ? 'Pendiente' : part.state) : 'Recibido';
          }
        });

        draft.repair.turno.date = '';
        draft.repair.turno.state = 'Pendiente programar';
      });
      return;
    }

    updateCase((draft) => {
      draft.todoRisk.processing.noRepairNeeded = false;
      draft.repair.parts.forEach((part) => {
        if (part.source === 'budget' && part.authorized === 'SI') {
          part.state = 'Recibido';
        }
      });
      draft.repair.turno.date = draft.repair.turno.date || today;
      draft.repair.turno.estimatedDays = draft.repair.turno.estimatedDays || draft.budget.estimatedWorkDays || '3';
      draft.repair.turno.state = 'Confirmado';
    });
  };

  return (
    <div className="page-stack">
      <section className={`hero-panel compact-hero detail-hero ${franchiseRecovery ? 'franchise-hero' : ''}`}>
        <div>
          <p className="eyebrow">Gestion</p>
          <div className="detail-heading-row">
            <h1>{item.code} - {getFolderDisplayName(item)}</h1>
            {franchiseRecovery ? <span className="tramite-identity-badge is-franchise">Trámite Franquicia</span> : null}
          </div>
          <p className="muted">{item.vehicle.brand} {item.vehicle.model} - {item.vehicle.plate} · cierre {item.computed.closeReady ? formatDate(item.computed.closeDate) : 'pendiente'}</p>
          <p className="muted">Siniestro {item.claimNumber || 'sin informar'}.</p>
        </div>

        <div className="status-toolbar status-toolbar-expanded">
          {hasInteractiveInsuranceControls ? (
            <>
              <StatusActionBar label="Trámite" actions={tramiteActions} onSelect={handleTramiteAction} />
              <StatusActionBar label="Reparación" actions={repairActions} onSelect={handleRepairAction} />
            </>
          ) : (
            <>
              <StatusStepper
                activeValue={tramiteStepper.activeValue}
                items={tramiteStepper.items}
                label="Trámite"
              />
              <StatusStepper
                activeValue={repairStepper.activeValue}
                items={repairStepper.items}
                label="Reparación"
              />
            </>
          )}
          <div className="status-group muted-restricted">
            <span>Admin mock</span>
              <button className="ghost-button" disabled type="button">Rechazado / Desistido</button>
              {item.computed.repairStatus === 'No debe repararse' ? <StatusBadge tone="info">No debe repararse</StatusBadge> : null}
            </div>
          </div>
      </section>

      <div className="tab-strip">
        {tabs.map((tab) => (
          <TabButton
            active={activeTab === tab.id}
            key={tab.id}
            onClick={() => {
              if (tab.id === 'tramite' && !supportsTramiteTab) {
                return;
              }
              if (tab.id === 'documentacion' && !isInsuranceWorkflowCase(item)) {
                return;
              }
              if (tab.id === 'documentacion' && !isThirdPartyWorkshopCase(item)) {
                return;
              }
              if (tab.id === 'gestion' && !item.computed.budgetReady) {
                flash('Bloqueado: Presupuesto sigue en rojo. Cerralo, completalo y generá el presupuesto para habilitar Gestión reparación.');
                return;
              }
              onChangeTab(tab.id);
            }}
            state={item.computed.tabs[tab.id]}
          >
            {tab.label}
          </TabButton>
        ))}
      </div>

      <div className="form-grid aside-layout">
        <div>
          {activeTab === 'ficha' ? <FichaTecnicaTab item={item} updateCase={updateCase} /> : null}
              {activeTab === 'tramite' ? <GestionTramiteTab allCases={allCases} flash={flash} item={item} updateCase={updateCase} /> : null}
              {activeTab === 'documentacion' ? <DocumentacionTab flash={flash} item={item} updateCase={updateCase} /> : null}
              {activeTab === 'presupuesto' ? <PresupuestoTab flash={flash} item={item} updateCase={updateCase} /> : null}
          {activeTab === 'gestion' ? (
            <GestionReparacionTab
              activeRepairTab={activeRepairTab}
              flash={flash}
              item={item}
              onChangeRepairTab={onChangeRepairTab}
              updateCase={updateCase}
            />
          ) : null}
              {activeTab === 'pagos' ? <PagosTab flash={flash} item={item} updateCase={updateCase} /> : null}
              {activeTab === 'abogado' ? <AbogadoTab flash={flash} item={item} updateCase={updateCase} /> : null}
        </div>

        <aside className="side-panel">
          <article className="card inner-card">
            <div className="section-head small-gap">
              <h3>Bloqueos activos</h3>
              <StatusBadge tone={item.computed.blockers.length ? 'danger' : 'success'}>{item.computed.blockers.length}</StatusBadge>
            </div>
            <ul className="compact-list">
              {item.computed.blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </article>

          <article className="card inner-card">
            <div className="section-head small-gap">
              <h3>Cierre del caso</h3>
              <StatusBadge tone={item.computed.closeReady ? 'success' : 'danger'}>
                {item.computed.closeReady ? 'Cerrable' : 'Pendiente'}
              </StatusBadge>
            </div>
            <div className="summary-stack">
              <div className="summary-row"><span>Salida definitiva / no reingreso</span><strong>{item.computed.repairResolved ? 'Cumplido' : 'Falta resolver'}</strong></div>
              {isThirdPartyWorkshopCase(item) ? (
                <>
                  <div className="summary-row"><span>Pago compañía</span><strong>{item.computed.thirdParty.companyPaymentReady ? 'Cumplido' : 'Falta registrar'}</strong></div>
                  <div className="summary-row"><span>Pago cliente extras</span><strong>{item.computed.thirdParty.hasExtraWorks ? (item.computed.thirdParty.clientExtrasReady ? 'Cumplido' : money(item.computed.thirdParty.clientExtrasBalance)) : 'No aplica'}</strong></div>
                  <div className="summary-row"><span>Cierre económico</span><strong>{item.computed.todoRisk.paymentsReady ? 'Completo' : 'Pendiente'}</strong></div>
                </>
              ) : (
                <div className="summary-row"><span>Pago total</span><strong>{item.computed.balance === 0 ? 'Cumplido' : money(item.computed.balance)}</strong></div>
              )}
              <div className="summary-row"><span>Fecha de cierre</span><strong>{item.computed.closeDate ? formatDate(item.computed.closeDate) : '-'}</strong></div>
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}

function App() {
  const probeEndpoint = getConnectivityProbeUrl();
  const loginEndpoint = getLoginUrl();
  const currentUserEndpoint = getCurrentUserUrl();
  const unreadNotificationsEndpoint = getUnreadNotificationsUrl();
  const storedSession = readBackendSession();
  const hasStoredSession = Boolean(storedSession?.accessToken);
  const [shouldBootstrapSession] = useState(hasStoredSession);
  const [cases, setCases] = useState(initialCases);
  const [activeView, setActiveView] = useState('panel');
  const [selectedCaseId, setSelectedCaseId] = useState('');
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
    detail: `Todavía no probé la conexión real hacia ${probeEndpoint}.`,
    endpoint: probeEndpoint,
    checkedAt: '',
    httpStatus: null,
  });
  const [loginForm, setLoginForm] = useState({
    email: storedSession?.user?.email || '',
    password: '',
  });
  const [backendSession, setBackendSession] = useState(storedSession);
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
    title: 'Lectura autenticada pendiente',
    detail: 'Después del login voy a pedir /auth/me para mostrar qué usuario devolvió el backend.',
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
    unreadCount: 0,
  });
  const [pendingNotificationIds, setPendingNotificationIds] = useState([]);

  const computedCases = useMemo(() => cases.map(getComputedCase), [cases]);
  const agendaItems = useMemo(() => buildAgendaStore(computedCases), [computedCases]);

  const selectedCase = computedCases.find((item) => item.id === selectedCaseId) || computedCases[0];
  const nextCounter = computedCases.reduce((max, item) => Math.max(max, item.counter), 0) + 1;
  const nextCode = buildCaseCode(nextCounter, newCaseForm.type, newCaseForm.branch);
  const folderMissing = getFolderMissing(newCaseForm);
  const customerMocks = useMemo(() => buildCustomerMockData(cases), [cases]);
  const vehicleMocks = useMemo(() => buildVehicleMockData(cases), [cases]);

  useEffect(() => {
    const syncCaseFromHash = () => {
      const route = getCaseRouteFromHash(window.location.hash);
      const caseId = route.id;

      if (!caseId) {
        return;
      }

      const caseExists = computedCases.some((item) => item.id === caseId);
      if (!caseExists) {
        return;
      }

      const selectedFromHash = computedCases.find((item) => item.id === caseId);
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
      title: 'Lectura autenticada pendiente',
      detail: 'Sin token guardado no puedo pedir /auth/me.',
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
      unreadCount: 0,
    });
    setPendingNotificationIds([]);
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
      const result = await readAuthenticatedCases(accessToken, { page: 0, size: 5, signal });
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
        detail: getFriendlyCasesMessage(error),
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
      const result = await readAuthenticatedUnreadNotifications(accessToken, { signal });
      const items = getUnreadNotificationItems(result.data);

      setAuthenticatedNotificationsState({
        status: 'success',
        tone: 'success',
        title: 'Avisos actualizados',
        detail: items.length === 0
          ? 'No hay avisos pendientes en este momento.'
          : `Trajimos ${items.length} aviso${items.length === 1 ? '' : 's'} pendiente${items.length === 1 ? '' : 's'} de tu cuenta.`,
        endpoint: result.endpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: result.httpStatus,
        items,
        unreadCount: items.length,
      });
    } catch (error) {
      setAuthenticatedNotificationsState({
        status: 'error',
        tone: 'danger',
        title: 'No pudimos cargar tus avisos',
        detail: getFriendlyNotificationsMessage(error),
        endpoint: unreadNotificationsEndpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: error.httpStatus || null,
        items: [],
        unreadCount: 0,
      });
    }
  };

  const openAuthenticatedCaseDetail = async (item) => {
    if (!backendSession?.accessToken || !item?.id) {
      return;
    }

    const endpoint = getCaseDetailUrl(item.id);
    const budgetEndpoint = getCaseBudgetUrl(item.id);
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
      const [detailResult, historyResult, actionsResult, budgetResult, appointmentsResult, documentsResult, financeSummaryResult, financialMovementsResult, receiptsResult, vehicleIntakesResult, vehicleOutcomesResult] = await Promise.allSettled([
        readAuthenticatedCaseDetail(backendSession.accessToken, item.id),
        readAuthenticatedCaseWorkflowHistory(backendSession.accessToken, item.id),
        readAuthenticatedCaseWorkflowActions(backendSession.accessToken, item.id),
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
              detail: getFriendlyCaseAppointmentsMessage(appointmentsResult.reason),
            };
      const documentsState = documentsResult.status === 'fulfilled'
        ? buildCaseDocumentsState(documentsResult.value.data)
        : {
            status: 'error',
            items: [],
            total: 0,
            visibleCount: 0,
            hiddenCount: 0,
            detail: getFriendlyCaseDocumentsMessage(documentsResult.reason),
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
        detail: getFriendlyCaseDetailMessage(error),
        endpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: error.httpStatus || null,
        item,
        data: null,
        workflowHistory: [],
        workflowActions: [],
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
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }

        resetSessionState({
          authTitle: 'Sesión vencida o inválida',
          authDetail: 'La sesión guardada no pasó la validación con /auth/me. Limpié localStorage para que vuelvas a entrar.',
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
    } catch (error) {
      setAuthState({
        status: 'error',
        tone: 'danger',
        title: 'No pudimos ingresar',
        detail: getFriendlyAuthMessage(error),
        endpoint: loginEndpoint,
        checkedAt: new Date().toISOString(),
        httpStatus: error.httpStatus || null,
      });
    }
  };

  const readWithStoredToken = async (reader) => {
    if (!backendSession?.accessToken) {
      flash({ tone: 'danger', title: 'Sin token', message: 'Primero necesitás hacer login real o recuperar una sesión guardada.' });
      return;
    }

    try {
      await reader(backendSession.accessToken);
    } catch {
      // El estado de error ya se informa dentro del reader.
    }
  };

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

      const draft = structuredClone(item);
      mutator(draft);
      return draft;
    }));
  };

  const updateSelectedCase = (mutator) => {
    if (!selectedCase) {
      return;
    }
    updateCase(selectedCase.id, mutator);
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

  const autofillCustomerByDocument = () => {
    const document = normalizeDocument(newCaseForm.document);

    if (!document) {
      setCustomerLookupState({ status: 'empty', message: 'Ingresá un DNI', detail: 'Cargá un DNI para buscar un cliente mock.' });
      return;
    }

    const customer = customerMocks.get(document);

    if (!customer) {
      setCustomerLookupState({ status: 'empty', message: 'Sin coincidencias', detail: 'No hay un cliente mock cargado para ese DNI.' });
      return;
    }

    setNewCaseForm((current) => ({
      ...current,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      document: customer.document,
      locality: customer.locality,
      email: customer.email,
      referenced: customer.referenced,
      referencedName: customer.referencedName,
    }));
    highlightAutofilledFields([
      'document',
      'firstName',
      'lastName',
      'phone',
      'referenced',
      customer.referenced === 'SI' ? 'referencedName' : '',
    ]);
    setCustomerLookupState({
      status: 'found',
      message: 'Cliente encontrado',
      detail: `${customer.firstName} ${customer.lastName} · DNI ${customer.document}`,
    });
  };

  const autofillVehicleByPlate = () => {
    const plate = normalizePlate(newCaseForm.plate);

    if (!plate) {
      setVehicleLookupState({ status: 'empty', message: 'Ingresá una patente', detail: 'Cargá una patente para buscar un vehículo mock.' });
      return;
    }

    const vehicle = vehicleMocks.get(plate);

    if (!vehicle) {
      setVehicleLookupState({ status: 'empty', message: 'Sin coincidencias', detail: 'No hay un vehículo mock cargado para esa patente.' });
      return;
    }

    setNewCaseForm((current) => ({
      ...current,
      brand: vehicle.brand,
      model: vehicle.model,
      plate: vehicle.plate,
      vehicleType: vehicle.vehicleType,
      vehicleUse: vehicle.vehicleUse,
      paint: vehicle.paint,
    }));
    highlightAutofilledFields(['plate', 'brand', 'model', 'vehicleType', 'vehicleUse', 'paint']);
    setVehicleLookupState({
      status: 'found',
      message: 'Vehículo encontrado',
      detail: `${vehicle.brand} ${vehicle.model} · ${vehicle.plate}`,
    });
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
    flash(`Exportación Excel demo generada con ${rows.length} carpetas visibles.`);
  };

  const exportPanelPdf = (items) => {
    const rows = buildPanelExportRows(items);
    const printable = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');

    if (!printable) {
      flash('No pude abrir la ventana de impresión para el PDF demo.');
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
          <p>Exportación demo imprimible con ${rows.length} carpetas visibles.</p>
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
    flash(`Exportación PDF demo preparada para impresión con ${rows.length} carpetas visibles.`);
  };

  const openCase = (id, target = {}) => {
    const targetCase = computedCases.find((item) => item.id === id);
    const resolvedTarget = resolveGestionAccess(targetCase, target);
    const nextTab = resolvedTarget.tab;
    const nextRepairTab = resolvedTarget.subtab || 'repuestos';

    setSelectedCaseId(id);
    setActiveView('gestion');
    setActiveTab(nextTab);
    setActiveRepairTab(nextRepairTab);
    window.location.hash = getCaseHash(id, { tab: nextTab, subtab: nextRepairTab });
  };

  const createCase = () => {
    setShowNewCaseValidation(true);

    if (folderMissing.length) {
      flash({ tone: 'danger', title: 'Validación', message: 'Faltan campos obligatorios' });
      return;
    }

    const code = buildCaseCode(nextCounter, newCaseForm.type, newCaseForm.branch);
    const isInsuranceCase = ['Todo Riesgo', 'CLEAS / Terceros / Franquicia', 'Reclamo de Tercero - Taller', 'Reclamo de Tercero - Abogado'].includes(newCaseForm.type);
    const isThirdPartyWorkshop = newCaseForm.type === 'Reclamo de Tercero - Taller';
    const isThirdPartyLawyer = newCaseForm.type === 'Reclamo de Tercero - Abogado';
    const isFranchiseRecovery = newCaseForm.type === FRANCHISE_RECOVERY_TRAMITE;
    const newCase = {
      id: crypto.randomUUID(),
      code,
      counter: nextCounter,
      tramiteType: newCaseForm.type,
      claimNumber: newCaseForm.claimNumber,
      branch: newCaseForm.branch,
      createdAt: new Date().toISOString().slice(0, 10),
      folderCreated: true,
      customer: {
        firstName: newCaseForm.firstName,
        lastName: newCaseForm.lastName,
        phone: newCaseForm.phone,
        document: newCaseForm.document,
        birthDate: '',
        locality: 'Rosario',
        email: '',
        street: '',
        streetNumber: '',
        addressExtra: '',
        occupation: '',
        civilStatus: '',
        referenced: newCaseForm.referenced,
        referencedName: newCaseForm.referencedName,
      },
      vehicle: {
        brand: newCaseForm.brand,
        model: newCaseForm.model,
        plate: newCaseForm.plate,
        type: newCaseForm.vehicleType,
        usage: newCaseForm.vehicleUse,
        paint: newCaseForm.paint,
        year: '',
        color: '',
        chassis: '',
        engine: '',
        transmission: '',
        mileage: '',
        observations: '',
      },
      vehicleMedia: [],
      franchiseRecovery: isFranchiseRecovery
        ? createFranchiseRecoveryDefaults()
        : undefined,
      budget: createBudgetDefaults({
        workshop: '',
        authorizer: AUTHORIZER_OPTIONS[0],
      }),
      todoRisk: isInsuranceCase
        ? createTodoRiskDefaults({
          insurance: { company: newCaseForm.type === 'Todo Riesgo' ? TODO_RIESGO_INSURANCE_OPTIONS[0] : '' },
          documentation: { items: newCaseForm.type === 'Todo Riesgo' ? [createTodoRiskDocument()] : [] },
          processing: { agenda: [] },
        })
        : undefined,
      thirdParty: (isThirdPartyWorkshop || isThirdPartyLawyer)
        ? createThirdPartyDefaults({
          claim: {
            documents: [createTodoRiskDocument()],
          },
        })
        : undefined,
      lawyer: isThirdPartyLawyer
        ? createLawyerDefaults({
          repairVehicle: 'SI',
          agenda: [createTodoRiskTask()],
          statusUpdates: [createLawyerStatusUpdate()],
          closure: {
            expenses: [createLawyerExpense()],
            items: [createLawyerClosureItem()],
          },
        })
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
        invoices: newCaseForm.type === 'Todo Riesgo' || isThirdPartyLawyer ? [createTodoRiskInvoice()] : [],
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
    };

    setCases((current) => [...current, newCase]);
    setNewCaseForm(createEmptyForm());
    setShowNewCaseValidation(false);
    setCustomerLookupState({ status: 'idle', message: '', detail: '' });
    setVehicleLookupState({ status: 'idle', message: '', detail: '' });
    setAutofilledFields([]);
    flash({ tone: 'success', title: 'Alta exitosa', message: `Carpeta ${code} creada con éxito` });
    setActiveView('nuevo');
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

    await readWithStoredToken(async (accessToken) => {
      try {
        await markAuthenticatedNotificationAsRead(accessToken, notification.id);
        setAuthenticatedNotificationsState((current) => {
          const nextItems = current.items.filter((item) => item.id !== notification.id);
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
            unreadCount: nextItems.length,
          };
        });
        flash({ tone: 'success', title: 'Aviso actualizado', message: 'La notificación se marcó como leída.' });
      } catch (error) {
        flash({ tone: 'danger', title: 'No pudimos actualizar el aviso', message: getFriendlyNotificationReadMessage(error) });
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
    <div className="app-shell">
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

        <div className="sidebar-card">
          <p className="eyebrow">Operación</p>
          <h2>Vista cliente</h2>
          <p className="muted">Accedé a tus carpetas y consultá el estado general de cada caso desde un solo lugar.</p>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Panel</p>
            <h2>{activeView === 'panel' ? 'Mis carpetas' : activeView === 'agenda' ? 'Agenda de tareas' : activeView === 'nuevo' ? 'Nuevo Caso' : 'Gestión de trámites'}</h2>
          </div>

          <div className="topbar-right">
            <div className="topbar-notification-pill" role="status" aria-live="polite">
              <span>Avisos pendientes</span>
              <strong>{authenticatedNotificationsState.unreadCount}</strong>
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

        {activeView === 'gestion' && selectedCase && isThirdPartyDocumentationIncomplete(selectedCase) && docGateAcceptedCaseId !== selectedCase.id ? (
          <div className="blocking-modal-overlay" role="presentation">
            <div aria-labelledby="doc-gate-title" aria-modal="true" className="blocking-modal" role="dialog">
              <p className="eyebrow">Aviso bloqueante</p>
              <h3 id="doc-gate-title">Carpeta con documentación pendiente</h3>
              <p className="muted">
                La carpeta sigue marcada como incompleta. Aceptá para seguir navegando esta demo y revisá la solapa
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
            flash={flash}
            items={computedCases}
            onMarkNotificationAsRead={markNotificationAsRead}
            onExportExcel={exportPanelExcel}
            onExportPdf={exportPanelPdf}
            onOpenCase={openCase}
            onOpenAuthenticatedCaseDetail={openAuthenticatedCaseDetail}
            onRefreshCurrentUser={refreshCurrentUserPreview}
            onRefreshAuthenticatedCases={refreshAuthenticatedCasesPreview}
            onRefreshAuthenticatedNotifications={refreshAuthenticatedNotificationsPreview}
            pendingNotificationIds={pendingNotificationIds}
          />
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
            onChangeRepairTab={setActiveRepairTab}
            onChangeTab={setActiveTab}
            updateCase={updateSelectedCase}
          />
        ) : null}
      </main>
    </div>
  );
}

export default App;
