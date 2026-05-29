import {
  AUTHORIZER_OPTIONS,
  TODO_RIESGO_ASSIGNABLE_USERS,
} from '../../gestion/constants/gestionOptions';
import { createUuid } from '../../../lib/utils/id';
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
    id: createUuid(),
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
    id: createUuid(),
    category: 'Personal',
    name: '',
    uploadedAt: '',
    notes: '',
    ...overrides,
  };
}

export function createTodoRiskTask(overrides = {}) {
  return {
    id: createUuid(),
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
    id: createUuid(),
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
    id: createUuid(),
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
    authorizedByName: '',
    interestedName: '',
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
  const claimOverrides = overrides.claim || {};
  const paymentOverrides = overrides.payments || {};
  const registryOverrides = overrides.clientRegistry || {};
  const { claim: _ignoredClaim, payments: _ignoredPayments, clientRegistry: _ignoredRegistry, ...rootOverrides } = overrides;
  const thirdParties = Array.isArray(claimOverrides.thirdParties)
    ? claimOverrides.thirdParties
    : [createThirdPartyParticipant()];
  const documents = Array.isArray(claimOverrides.documents)
    ? claimOverrides.documents
    : [createTodoRiskDocument()];
  const clientPayments = Array.isArray(paymentOverrides.clientPayments)
    ? paymentOverrides.clientPayments
    : [];

  return {
    clientRegistry: {
      isOwner: 'SI',
      ownershipPercentage: '100%',
      owners: registryOverrides.owners ?? [createRegistryOwner(), createRegistryOwner()],
      ...registryOverrides,
    },
    claim: {
      presentedDate: '',
      claimReference: '',
      thirdCompany: '',
      thirdParties,
      documentationStatus: 'Incompleta',
      documentationAccepted: false,
      documents,
      partsProviderMode: 'Provee Cía.',
      ...claimOverrides,
      thirdParties,
      documents,
    },
    payments: {
      clientPayments,
      ...paymentOverrides,
      clientPayments,
    },
    ...rootOverrides,
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
