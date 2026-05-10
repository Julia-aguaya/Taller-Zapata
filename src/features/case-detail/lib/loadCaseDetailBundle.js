/**
 * loadCaseDetailBundle.js
 * Loads all case detail data in parallel and handles partial failures
 */
import {
  readAuthenticatedCaseDetail,
  readAuthenticatedCaseWorkflowHistory,
  readAuthenticatedCaseWorkflowActions,
  readAuthenticatedCaseAuditEvents,
  readAuthenticatedCaseRelations,
  readAuthenticatedCaseInsurance,
  readAuthenticatedCaseInsuranceProcessing,
  readAuthenticatedCaseInsuranceProcessingDocuments,
  readAuthenticatedCaseCleas,
  readAuthenticatedCaseThirdParty,
  readAuthenticatedCaseLegal,
  readAuthenticatedCaseLegalNews,
  readAuthenticatedCaseLegalExpenses,
  readAuthenticatedCaseFranchiseRecovery,
  readAuthenticatedCaseFranchise,
  readAuthenticatedCaseBudget,
  readAuthenticatedCaseAppointments,
  readAuthenticatedCaseDocuments,
  readAuthenticatedCaseFinanceSummary,
  readAuthenticatedCaseFinancialMovements,
  readAuthenticatedCaseReceipts,
  readAuthenticatedCaseVehicleIntakes,
  readAuthenticatedCaseVehicleOutcomes,
} from '../../../lib/api/backend';

/**
 * Load all case detail data in parallel
 * Returns individual results so UI can handle partial failures gracefully
 */
export async function loadCaseDetailBundle(accessToken, caseId, signal) {
  const requests = {
    detail: readAuthenticatedCaseDetail(accessToken, caseId, signal),
    workflowHistory: readAuthenticatedCaseWorkflowHistory(accessToken, caseId, signal),
    workflowActions: readAuthenticatedCaseWorkflowActions(accessToken, caseId, signal),
    auditEvents: readAuthenticatedCaseAuditEvents(accessToken, caseId, signal),
    relations: readAuthenticatedCaseRelations(accessToken, caseId, signal),
    insurance: readAuthenticatedCaseInsurance(accessToken, caseId, signal),
    insuranceProcessing: readAuthenticatedCaseInsuranceProcessing(accessToken, caseId, signal),
    insuranceProcessingDocuments: readAuthenticatedCaseInsuranceProcessingDocuments(accessToken, caseId, signal),
    cleas: readAuthenticatedCaseCleas(accessToken, caseId, signal),
    thirdParty: readAuthenticatedCaseThirdParty(accessToken, caseId, signal),
    legal: readAuthenticatedCaseLegal(accessToken, caseId, signal),
    legalNews: readAuthenticatedCaseLegalNews(accessToken, caseId, signal),
    legalExpenses: readAuthenticatedCaseLegalExpenses(accessToken, caseId, signal),
    franchiseRecovery: readAuthenticatedCaseFranchiseRecovery(accessToken, caseId, signal),
    franchise: readAuthenticatedCaseFranchise(accessToken, caseId, signal),
    budget: readAuthenticatedCaseBudget(accessToken, caseId, signal),
    appointments: readAuthenticatedCaseAppointments(accessToken, caseId, signal),
    documents: readAuthenticatedCaseDocuments(accessToken, caseId, signal),
    financeSummary: readAuthenticatedCaseFinanceSummary(accessToken, caseId, signal),
    financialMovements: readAuthenticatedCaseFinancialMovements(accessToken, caseId, signal),
    receipts: readAuthenticatedCaseReceipts(accessToken, caseId, signal),
    vehicleIntakes: readAuthenticatedCaseVehicleIntakes(accessToken, caseId, signal),
    vehicleOutcomes: readAuthenticatedCaseVehicleOutcomes(accessToken, caseId, signal),
  };

  // Execute all requests in parallel
  const results = await Promise.allSettled(
    Object.entries(requests).map(([key, promise]) =>
      promise.then((data) => ({ key, data })).catch((err) => ({ key, error: err }))
    )
  );

  // Convert array back to object
  const bundled = {};
  const errors = {};
  
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      bundled[result.value.key] = result.value.data;
      if (result.value.error) {
        errors[result.value.key] = result.value.error;
      }
    } else {
      errors[result.value.key] = result.reason;
    }
  });

  return { bundled, errors, hasErrors: Object.keys(errors).length > 0 };
}

/**
 * Check if a specific subresource failed
 */
export function hasSubresourceFailed(bundle, key) {
  return !bundle[key] || (bundle[key] && bundle[key].status === 'error');
}

/**
 * Get successful subresources count
 */
export function getSuccessfulSubresourcesCount(bundle) {
  return Object.keys(bundle).filter((key) => bundle[key] && bundle[key].status !== 'error').length;
}