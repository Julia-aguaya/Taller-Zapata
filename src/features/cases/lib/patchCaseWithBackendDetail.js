import { normalizeLookupText } from './caseNormalizers';
import { formatDocumentAudience } from '../../panel/lib/panelPreviewHelpers';
import { createTodoRiskDefaults, createLawyerDefaults, createThirdPartyDefaults } from './caseFactories';
import {
  createBudgetLine,
  createRepairPart,
  createRepairQuoteRow,
  createTodoRiskInvoice,
  createSettlement,
} from '../../gestion/lib/gestionShared';

export function pickFirstNonEmpty(...values) {
  for (const value of values) {
    if (value != null && String(value).trim() !== '') {
      return value;
    }
  }
  return '';
}

function mapBackendBudgetReportStatus(value) {
  const normalized = normalizeLookupText(value);

  if (!normalized) {
    return '';
  }

  if (normalized.includes('cerrad') || normalized === 'closed') {
    return 'Informe cerrado';
  }

  return 'Informe abierto';
}

function isCustomerPlaceholder(value) {
  const normalized = String(value || '').trim().toUpperCase();
  return normalized === 'CLIENTE' || normalized === 'CLIENTE NO INFORMADO' || normalized === 'SIN TITULAR';
}

function pickCustomerNameValue(...values) {
  for (const value of values) {
    if (value == null) {
      continue;
    }

    const normalized = String(value).trim();
    if (!normalized || isCustomerPlaceholder(normalized)) {
      continue;
    }

    return value;
  }

  return '';
}

export function ensureCaseStructure(caseItem) {
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
      benchStraighteningApplies: 'NO',
      benchStraighteningDetail: '',
      alignmentApplies: 'NO',
      balancingApplies: 'NO',
      glassReplacementApplies: 'NO',
      glassReplacementDetail: '',
      electricalWorkApplies: 'NO',
      mechanicalWorkCode: '',
      quotedPartsDate: '',
      quotedPartsSupplier: '',
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
  if (!draft.repair.benchStraighteningApplies) draft.repair.benchStraighteningApplies = 'NO';
  if (!draft.repair.benchStraighteningDetail) draft.repair.benchStraighteningDetail = '';
  if (!draft.repair.alignmentApplies) draft.repair.alignmentApplies = 'NO';
  if (!draft.repair.balancingApplies) draft.repair.balancingApplies = 'NO';
  if (!draft.repair.glassReplacementApplies) draft.repair.glassReplacementApplies = 'NO';
  if (!draft.repair.glassReplacementDetail) draft.repair.glassReplacementDetail = '';
  if (!draft.repair.electricalWorkApplies) draft.repair.electricalWorkApplies = 'NO';
  if (!draft.repair.mechanicalWorkCode) draft.repair.mechanicalWorkCode = '';
  if (!draft.repair.quotedPartsDate) draft.repair.quotedPartsDate = '';
  if (!draft.repair.quotedPartsSupplier) draft.repair.quotedPartsSupplier = '';

  if (!draft.meta) {
    draft.meta = { dirtyTabs: {}, lastSavedByTab: {}, syncErrorsByTab: {}, removedBudgetItemIds: [], removedPartIds: [] };
  }

  return draft;
}

export function patchCaseWithBackendDetail(localCase, detailState) {
  const normalized = ensureCaseStructure(localCase);
  Object.assign(localCase, normalized);

  const detail = detailState?.data || {};
  const detailClient = detail.client || detail.customer || {};
  const detailVehicle = detail.vehicle || {};
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
  const mapOptionalBooleanToYesNo = (backendValue, currentValue) => {
    if (backendValue == null) {
      return pickFirstNonEmpty(currentValue, 'NO');
    }
    return mapYesNo(Boolean(backendValue));
  };
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
  localCase.customer.firstName = pickCustomerNameValue(localCase.customer.firstName, detail.firstName, detail.customerFirstName, detail.holderFirstName, detailClient.firstName);
  localCase.customer.lastName = pickCustomerNameValue(localCase.customer.lastName, detail.lastName, detail.customerLastName, detail.holderLastName, detail.holderName, detailClient.lastName, detailClient.fullName);
  localCase.customer.phone = pickFirstNonEmpty(localCase.customer.phone, detail.phone, detail.customerPhone, detail.holderPhone, detailClient.phone, detailClient.telephone);
  localCase.customer.document = pickFirstNonEmpty(localCase.customer.document, detail.dni, detail.document, detail.customerDocument, detail.holderDocument, detailClient.document, detailClient.numeroDocumento);
  localCase.customer.email = pickFirstNonEmpty(localCase.customer.email, detail.email, detail.customerEmail, detail.holderEmail, detailClient.email);

  localCase.vehicle.brand = pickFirstNonEmpty(localCase.vehicle.brand, detail.brand, detail.brandText, detail.vehicleBrand, detailVehicle.brand, detailVehicle.marca);
  localCase.vehicle.model = pickFirstNonEmpty(localCase.vehicle.model, detail.model, detail.modelText, detail.vehicleModel, detailVehicle.model, detailVehicle.modelo);
  localCase.vehicle.plate = pickFirstNonEmpty(localCase.vehicle.plate, detail.plate, detail.licensePlate, detail.patent, detail.domain, detailVehicle.plate, detailVehicle.licensePlate, detailVehicle.patent, detailVehicle.domain);
  localCase.vehicle.year = pickFirstNonEmpty(localCase.vehicle.year, detail.vehicleYear, detailVehicle.year, detailVehicle.anio);
  localCase.vehicle.type = pickFirstNonEmpty(localCase.vehicle.type, detail.vehicleTypeCode, detail.vehicleType, detailVehicle.type, detailVehicle.vehicleTypeCode, detailVehicle.tipoVehiculoCodigo);
  localCase.vehicle.usage = pickFirstNonEmpty(localCase.vehicle.usage, detail.usageCode, detail.vehicleUsageCode, detail.vehicleUse, detailVehicle.usage, detailVehicle.usageCode, detailVehicle.usoCodigo);
  localCase.vehicle.color = pickFirstNonEmpty(localCase.vehicle.color, detail.vehicleColor, detailVehicle.color);
  localCase.vehicle.chassis = pickFirstNonEmpty(localCase.vehicle.chassis, detail.vehicleChassis, detailVehicle.chassis, detailVehicle.chasis);
  localCase.vehicle.engine = pickFirstNonEmpty(localCase.vehicle.engine, detail.vehicleEngine, detailVehicle.engine, detailVehicle.motor);
  localCase.vehicle.transmission = pickFirstNonEmpty(localCase.vehicle.transmission, detail.vehicleTransmission, detailVehicle.transmission);

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
  localCase.todoRisk.processing.adminTurnOverride = Boolean(insuranceProcessing.adminOverrideAppointment);
  localCase.todoRisk.processing.agreementDate = pickFirstNonEmpty(localCase.todoRisk.processing.agreementDate, insuranceProcessing.agreementDate).slice(0, 10);
  localCase.payments.passedToPaymentsDate = pickFirstNonEmpty(localCase.payments.passedToPaymentsDate, insuranceProcessing.passedToPaymentsDate).slice(0, 10);

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

  const mappedReportStatus = mapBackendBudgetReportStatus(budget.reportStatusCode);
  if (mappedReportStatus) {
    localCase.budget.reportStatus = mappedReportStatus;
    localCase.budget.generated = mappedReportStatus === 'Informe cerrado';
  }

  if (budget.laborWithoutVat != null) {
    localCase.budget.laborWithoutVat = budget.laborWithoutVat;
  }

  if (budget.estimatedDays != null) {
    localCase.budget.estimatedWorkDays = budget.estimatedDays;
  }

  if (budget.minimumCloseAmount != null) {
    localCase.budget.minimumLaborClose = budget.minimumCloseAmount;
  }

  localCase.budget.observations = pickFirstNonEmpty(localCase.budget.observations, budget.observations);

  localCase.budget.authorizedByName = pickFirstNonEmpty(localCase.budget.authorizedByName, budget.authorizedByName);
  localCase.budget.interestedName = pickFirstNonEmpty(localCase.budget.interestedName, budget.interestedName);

  localCase.repair.benchStraighteningApplies = mapOptionalBooleanToYesNo(budget.benchStraighteningApplies, localCase.repair.benchStraighteningApplies);
  localCase.repair.benchStraighteningDetail = pickFirstNonEmpty(localCase.repair.benchStraighteningDetail, budget.benchStraighteningDetail);
  localCase.repair.alignmentApplies = mapOptionalBooleanToYesNo(budget.alignmentApplies, localCase.repair.alignmentApplies);
  localCase.repair.balancingApplies = mapOptionalBooleanToYesNo(budget.balancingApplies, localCase.repair.balancingApplies);
  localCase.repair.glassReplacementApplies = mapOptionalBooleanToYesNo(budget.glassReplacementApplies, localCase.repair.glassReplacementApplies);
  localCase.repair.glassReplacementDetail = pickFirstNonEmpty(localCase.repair.glassReplacementDetail, budget.glassReplacementDetail);
  localCase.repair.electricalWorkApplies = mapOptionalBooleanToYesNo(budget.electricalWorkApplies, localCase.repair.electricalWorkApplies);
  localCase.repair.mechanicalWorkCode = pickFirstNonEmpty(localCase.repair.mechanicalWorkCode, budget.mechanicalWorkCode);
  localCase.repair.quotedPartsDate = pickFirstNonEmpty(localCase.repair.quotedPartsDate, budget.quotedPartsDate).slice(0, 10);
  localCase.repair.quotedPartsSupplier = pickFirstNonEmpty(localCase.repair.quotedPartsSupplier, budget.quotedPartsSupplier);

  localCase.budget.partsQuotedDate = pickFirstNonEmpty(localCase.budget.partsQuotedDate, localCase.repair.quotedPartsDate);
  localCase.budget.partsProvider = pickFirstNonEmpty(localCase.budget.partsProvider, localCase.repair.quotedPartsSupplier);

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
      detail: entry.notes || entry.observations || '',
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

  if (Array.isArray(detailState?.partQuotesState?.items)) {
    localCase.repair.quoteRows = detailState.partQuotesState.items.map((entry, index) => createRepairQuoteRow({
      id: entry.id || `${localCase.id}-part-quote-${index}`,
      piece: entry.piece || '',
      provider1: pickFirstNonEmpty(entry.provider1, ''),
      provider2: pickFirstNonEmpty(entry.provider2, ''),
      provider3: pickFirstNonEmpty(entry.provider3, ''),
      provider4: pickFirstNonEmpty(entry.provider4, ''),
      billing: pickFirstNonEmpty(entry.billing, 'A'),
      paymentMethod: pickFirstNonEmpty(entry.paymentMethod, 'Contado'),
      source: pickFirstNonEmpty(entry.source, 'budget'),
      sourceLineId: entry.sourceLineId ? String(entry.sourceLineId) : '',
    }));
  }

  localCase.backendWorkflow = {
    history: workflowHistory,
    actions: workflowActions,
    updatedAt: new Date().toISOString(),
  };

  localCase.backendVisibleStates = {
    tramite: detail.visibleTramiteState || null,
    reparacion: detail.visibleRepairState || null,
  };
}

function createPaymentDefaults(overrides = {}) {
  return {
    manualTotalAmount: '',
    depositedAmount: '',
    hasRetentions: 'NO',
    retentions: { other: '' },
    settlements: [],
    invoices: [],
    invoice: 'NO',
    invoiceNumber: '',
    businessName: '',
    paymentDate: '',
    ...overrides,
  };
}
