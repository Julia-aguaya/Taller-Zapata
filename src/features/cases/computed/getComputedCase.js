import { isAgendaTaskResolved } from '../lib/caseAgendaHelpers';
import {
  isTodoRiesgoCase,
  isCleasCase,
  isThirdPartyWorkshopCase,
  isThirdPartyLawyerCase,
  isFranchiseRecoveryCase,
  isThirdPartyClaimCase,
  isJudicialInstance,
  hasRegistryOwnerIdentity,
} from '../lib/caseDomainCheckers';
import {
  createBudgetDefaults,
  createTodoRiskDefaults,
  createThirdPartyDefaults,
  createLawyerDefaults,
  createFranchiseRecoveryDefaults,
} from '../lib/caseFactories';
import {
  createIngresoItem,
  lineIsComplete,
  lineNeedsReplacementDecision,
  buildBudgetParts,
  buildThirdPartyBudgetParts,
  getBestQuoteValue,
  getThirdPartyMinimumAmount,
} from '../../gestion/lib/gestionShared';
import { money, numberValue, maxDate } from '../../gestion/lib/gestionUtils';
import { addYears } from '../lib/caseComputedHelpers';

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

function claimIncludesInjuries(reclama) {
  return String(reclama || '').includes('lesiones');
}

export function getComputedCase(item) {
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
