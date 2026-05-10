import {
  AUTHORIZER_OPTIONS,
  TODO_RIESGO_ASSIGNABLE_USERS,
} from '../../gestion/constants/gestionOptions';
import { todayIso } from './caseAgendaHelpers';
import {
  createAccessoryWork,
  createBudgetLine,
  createBudgetService,
  createLawyerClosureItem,
  createLawyerExpense,
  createLawyerInjured,
  createLawyerStatusUpdate,
} from '../../gestion/lib/gestionShared';

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
    ...overrides,
  };
}

export function createTodoRiskDocument(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    category: 'Personal',
    name: '',
    uploadedAt: '',
    notes: '',
    ...overrides,
  };
}

export function createTodoRiskTask(overrides = {}) {
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

export function createRegistryOwner(overrides = {}) {
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

export function createThirdPartyParticipant(overrides = {}) {
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

// ══════════════════════════════════════════════════════════
// DEFAULT FACTORIES
// ══════════════════════════════════════════════════════════

export function createFranchiseRecoveryDefaults(overrides = {}) {
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

export function createBudgetDefaults(overrides = {}) {
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

export function createTodoRiskDefaults(overrides = {}) {
  return {
    insurance: {
      company: '',
      policyNumber: '',
      certificateNumber: '',
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

export function createThirdPartyDefaults(overrides = {}) {
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

export function createLawyerDefaults(overrides = {}) {
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
