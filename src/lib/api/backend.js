const DEFAULT_API_BASE_URL = 'http://localhost:8081/api/v1';
const CONNECTIVITY_PROBE_PATH = '/cases';
const LOGIN_PATH = '/auth/login';
const CURRENT_USER_PATH = '/auth/me';
const NOTIFICATIONS_PATH = '/notifications';
const UNREAD_NOTIFICATIONS_PATH = '/notifications/unread';
const UNREAD_NOTIFICATIONS_COUNT_PATH = '/notifications/count-unread';
const SYSTEM_PARAMETERS_PATH = '/system/parameters';
const OPERATION_CATALOGS_PATH = '/operation/catalogs';
const FINANCE_CATALOGS_PATH = '/finance/catalogs';
const INSURANCE_CATALOGS_PATH = '/insurance/catalogs';
const DOCUMENTS_CATALOGS_PATH = '/documents/catalogs';
const TASKS_PATH = '/tasks';
const INSURANCE_COMPANIES_PATH = '/insurance/companies';
const CASES_CATALOGS_PATH = '/cases/catalogs';
const PERSONS_PATH = '/persons';
const VEHICLES_PATH = '/vehicles';
const SESSION_STORAGE_KEY = 'tallerDemo.backendSession';

function buildCaseDetailPath(caseId) {
  return `/cases/${caseId}`;
}

function buildCaseRelationsPath(caseId) {
  return `/cases/${caseId}/relations`;
}

function buildCaseInsurancePath(caseId) {
  return `/cases/${caseId}/insurance`;
}

function buildCaseInsuranceProcessingPath(caseId) {
  return `/cases/${caseId}/insurance-processing`;
}

function buildCaseFranchisePath(caseId) {
  return `/cases/${caseId}/franchise`;
}

function buildCaseInsuranceProcessingDocumentsPath(caseId) {
  return `/cases/${caseId}/insurance-processing/documents`;
}

function buildCaseCleasPath(caseId) {
  return `/cases/${caseId}/cleas`;
}

function buildCaseThirdPartyPath(caseId) {
  return `/cases/${caseId}/third-party`;
}

function buildCaseLegalPath(caseId) {
  return `/cases/${caseId}/legal`;
}

function buildCaseLegalNewsPath(caseId) {
  return `/cases/${caseId}/legal-news`;
}

function buildCaseLegalExpensesPath(caseId) {
  return `/cases/${caseId}/legal-expenses`;
}

function buildCaseFranchiseRecoveryPath(caseId) {
  return `/cases/${caseId}/franchise-recovery`;
}

function buildInsuranceCompanyContactsPath(companyId) {
  return `/insurance/companies/${companyId}/contacts`;
}

function buildCaseWorkflowHistoryPath(caseId) {
  return `/cases/${caseId}/workflow/history`;
}

function buildCaseWorkflowActionsPath(caseId) {
  return `/cases/${caseId}/workflow/actions`;
}

function buildCaseWorkflowTransitionsPath(caseId) {
  return `/cases/${caseId}/workflow/transitions`;
}

function buildCaseAuditEventsPath(caseId) {
  return `/cases/${caseId}/audit/events`;
}

function buildCaseBudgetPath(caseId) {
  return `/cases/${caseId}/budget`;
}

function buildCaseDocumentsPath(caseId) {
  return `/cases/${caseId}/documents`;
}

function buildCaseDocumentDownloadPath(caseId, documentId) {
  return `/cases/${caseId}/documents/${documentId}/download`;
}

function buildCaseAppointmentsPath(caseId) {
  return `/cases/${caseId}/appointments`;
}

function buildCaseVehicleIntakesPath(caseId) {
  return `/cases/${caseId}/vehicle-intakes`;
}

function buildCaseVehicleOutcomesPath(caseId) {
  return `/cases/${caseId}/vehicle-outcomes`;
}

function buildCaseFinanceSummaryPath(caseId) {
  return `/cases/${caseId}/finance-summary`;
}

function buildCaseFinancialMovementsPath(caseId) {
  return `/cases/${caseId}/financial-movements`;
}

function buildCaseReceiptsPath(caseId) {
  return `/cases/${caseId}/receipts`;
}

function buildCaseIncidentPath(caseId) {
  return `/cases/${caseId}/incident`;
}

function buildCaseVisibleStatesPath(caseId) {
  return `/cases/${caseId}/visible-states`;
}

function buildDocumentsPath() {
  return '/documents';
}

function buildDocumentPath(documentId) {
  return `/documents/${documentId}`;
}

function buildDocumentReplacePath(documentId) {
  return `/documents/${documentId}/replace`;
}

function buildDocumentRelationsPath(documentId) {
  return `/documents/${documentId}/relations`;
}

function buildDocumentRelationPath(relationId) {
  return `/document-relations/${relationId}`;
}

function buildCaseBudgetItemsPath(caseId) {
  return `/cases/${caseId}/budget/items`;
}

function buildCaseBudgetItemPath(caseId, itemId) {
  return `/cases/${caseId}/budget/items/${itemId}`;
}

function buildCasePartsPath(caseId) {
  return `/cases/${caseId}/parts`;
}

function buildCasePartPath(caseId, partId) {
  return `/cases/${caseId}/parts/${partId}`;
}

function buildNotificationReadPath(notificationId) {
  return `/notifications/${notificationId}/read`;
}

function buildPersonsPath() {
  return PERSONS_PATH;
}

function buildVehiclesPath() {
  return VEHICLES_PATH;
}

function buildApiUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

async function readJson(response) {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    return null;
  }

  return response.json();
}

function buildHttpError(response, fallbackMessage, payload) {
  const detail = payload?.message || payload?.detail || payload?.error || fallbackMessage;
  const error = new Error(detail);
  error.httpStatus = response.status;
  error.payload = payload;
  return error;
}

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).trim();
}

export function getConnectivityProbeUrl() {
  return buildApiUrl(CONNECTIVITY_PROBE_PATH);
}

export function getLoginUrl() {
  return buildApiUrl(LOGIN_PATH);
}

export function getCurrentUserUrl() {
  return buildApiUrl(CURRENT_USER_PATH);
}

export function getUnreadNotificationsUrl() {
  return buildApiUrl(UNREAD_NOTIFICATIONS_PATH);
}

export function getNotificationsUrl() {
  return buildApiUrl(NOTIFICATIONS_PATH);
}

export function getSystemParametersUrl() {
  return buildApiUrl(SYSTEM_PARAMETERS_PATH);
}

export function getOperationCatalogsUrl() {
  return buildApiUrl(OPERATION_CATALOGS_PATH);
}

export function getFinanceCatalogsUrl() {
  return buildApiUrl(FINANCE_CATALOGS_PATH);
}

export function getInsuranceCatalogsUrl() {
  return buildApiUrl(INSURANCE_CATALOGS_PATH);
}

export function getDocumentsCatalogsUrl() {
  return buildApiUrl(DOCUMENTS_CATALOGS_PATH);
}

export function getTasksUrl() {
  return buildApiUrl(TASKS_PATH);
}

export function getInsuranceCompaniesUrl() {
  return buildApiUrl(INSURANCE_COMPANIES_PATH);
}

export function getCasesCatalogsUrl() {
  return buildApiUrl(CASES_CATALOGS_PATH);
}

export function getPersonsUrl() {
  return buildApiUrl(buildPersonsPath());
}

export function getVehiclesUrl() {
  return buildApiUrl(buildVehiclesPath());
}

export function getInsuranceCompanyContactsUrl(companyId) {
  return buildApiUrl(buildInsuranceCompanyContactsPath(companyId));
}

export function getUnreadNotificationsCountUrl() {
  return buildApiUrl(UNREAD_NOTIFICATIONS_COUNT_PATH);
}

export function getCaseDetailUrl(caseId) {
  return buildApiUrl(buildCaseDetailPath(caseId));
}

export function getCaseRelationsUrl(caseId) {
  return buildApiUrl(buildCaseRelationsPath(caseId));
}

export function getCaseInsuranceUrl(caseId) {
  return buildApiUrl(buildCaseInsurancePath(caseId));
}

export function getCaseInsuranceProcessingUrl(caseId) {
  return buildApiUrl(buildCaseInsuranceProcessingPath(caseId));
}

export function getCaseFranchiseUrl(caseId) {
  return buildApiUrl(buildCaseFranchisePath(caseId));
}

export function getCaseInsuranceProcessingDocumentsUrl(caseId) {
  return buildApiUrl(buildCaseInsuranceProcessingDocumentsPath(caseId));
}

export function getCaseCleasUrl(caseId) {
  return buildApiUrl(buildCaseCleasPath(caseId));
}

export function getCaseThirdPartyUrl(caseId) {
  return buildApiUrl(buildCaseThirdPartyPath(caseId));
}

export function getCaseLegalUrl(caseId) {
  return buildApiUrl(buildCaseLegalPath(caseId));
}

export function getCaseLegalNewsUrl(caseId) {
  return buildApiUrl(buildCaseLegalNewsPath(caseId));
}

export function getCaseLegalExpensesUrl(caseId) {
  return buildApiUrl(buildCaseLegalExpensesPath(caseId));
}

export function getCaseFranchiseRecoveryUrl(caseId) {
  return buildApiUrl(buildCaseFranchiseRecoveryPath(caseId));
}

export function getCaseWorkflowHistoryUrl(caseId) {
  return buildApiUrl(buildCaseWorkflowHistoryPath(caseId));
}

export function getCaseWorkflowActionsUrl(caseId) {
  return buildApiUrl(buildCaseWorkflowActionsPath(caseId));
}

export function getCaseAuditEventsUrl(caseId) {
  return buildApiUrl(buildCaseAuditEventsPath(caseId));
}

export function getCaseBudgetUrl(caseId) {
  return buildApiUrl(buildCaseBudgetPath(caseId));
}

export function getCaseDocumentsUrl(caseId) {
  return buildApiUrl(buildCaseDocumentsPath(caseId));
}

export function getCaseDocumentDownloadUrl(caseId, documentId) {
  return buildApiUrl(buildCaseDocumentDownloadPath(caseId, documentId));
}

export function getCaseAppointmentsUrl(caseId) {
  return buildApiUrl(buildCaseAppointmentsPath(caseId));
}

export function getCaseVehicleIntakesUrl(caseId) {
  return buildApiUrl(buildCaseVehicleIntakesPath(caseId));
}

export function getCaseVehicleOutcomesUrl(caseId) {
  return buildApiUrl(buildCaseVehicleOutcomesPath(caseId));
}

export function getCaseFinanceSummaryUrl(caseId) {
  return buildApiUrl(buildCaseFinanceSummaryPath(caseId));
}

export function getCaseFinancialMovementsUrl(caseId) {
  return buildApiUrl(buildCaseFinancialMovementsPath(caseId));
}

export function getCaseReceiptsUrl(caseId) {
  return buildApiUrl(buildCaseReceiptsPath(caseId));
}

export function getNotificationReadUrl(notificationId) {
  return buildApiUrl(buildNotificationReadPath(notificationId));
}

export function readBackendSession() {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(SESSION_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    storage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function storeBackendSession(session) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresInSeconds: session.expiresInSeconds,
    user: session.user,
    savedAt: new Date().toISOString(),
  }));
}

export function clearBackendSession() {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(SESSION_STORAGE_KEY);
}

export async function probeBackendConnection(options = {}) {
  const endpoint = getConnectivityProbeUrl();
  const startedAt = Date.now();

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: options.signal,
    });

    const elapsedMs = Date.now() - startedAt;
    const requiresAuth = response.status === 401 || response.status === 403;
    const reachable = response.ok || requiresAuth;

    return {
      ok: reachable,
      tone: reachable ? 'success' : 'danger',
      title: reachable ? 'Backend alcanzable' : 'Respuesta inesperada',
      detail: requiresAuth
        ? `La API respondió ${response.status} en ${elapsedMs} ms. Para esta ruta es esperable: falta login.`
        : `La API respondió ${response.status} en ${elapsedMs} ms.`,
      endpoint,
      httpStatus: response.status,
      elapsedMs,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }

    return {
      ok: false,
      tone: 'danger',
      title: 'Sin conexión al backend',
      detail: `No pude abrir una conexión real hacia ${endpoint}. Verificá que el backend esté levantado y accesible desde el navegador.`,
      endpoint,
      httpStatus: null,
      elapsedMs: Date.now() - startedAt,
    };
  }
}

export async function loginAgainstBackend(credentials, options = {}) {
  const endpoint = getLoginUrl();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: credentials.email.trim(),
      password: credentials.password,
    }),
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude iniciar sesión contra el backend.', payload);
  }

  return {
    ...payload,
    endpoint,
    httpStatus: response.status,
  };
}

export async function readCurrentUser(accessToken, options = {}) {
  const endpoint = getCurrentUserUrl();
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer el usuario autenticado.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCases(accessToken, options = {}) {
  const endpoint = new URL(getConnectivityProbeUrl());

  if (Number.isInteger(options.page)) {
    endpoint.searchParams.set('page', String(options.page));
  }

  if (Number.isInteger(options.size)) {
    endpoint.searchParams.set('size', String(options.size));
  }

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer casos autenticados.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseDetail(accessToken, caseId, options = {}) {
  const endpoint = getCaseDetailUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer el detalle de la carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseRelations(accessToken, caseId, options = {}) {
  const endpoint = getCaseRelationsUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer las relaciones de la carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseInsurance(accessToken, caseId, options = {}) {
  const endpoint = getCaseInsuranceUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer la cobertura de la carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseInsuranceProcessing(accessToken, caseId, options = {}) {
  const endpoint = getCaseInsuranceProcessingUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer el estado del tramite con la compañía.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseFranchise(accessToken, caseId, options = {}) {
  const endpoint = getCaseFranchiseUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los datos de franquicia de esta carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseInsuranceProcessingDocuments(accessToken, caseId, options = {}) {
  const endpoint = getCaseInsuranceProcessingDocumentsUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los documentos del trámite con la compañía.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseCleas(accessToken, caseId, options = {}) {
  const endpoint = getCaseCleasUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los datos CLEAS de esta carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseThirdParty(accessToken, caseId, options = {}) {
  const endpoint = getCaseThirdPartyUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los datos de terceros de esta carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseLegal(accessToken, caseId, options = {}) {
  const endpoint = getCaseLegalUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los datos legales de esta carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseLegalNews(accessToken, caseId, options = {}) {
  const endpoint = getCaseLegalNewsUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer las novedades legales de esta carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseLegalExpenses(accessToken, caseId, options = {}) {
  const endpoint = getCaseLegalExpensesUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los gastos legales de esta carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseFranchiseRecovery(accessToken, caseId, options = {}) {
  const endpoint = getCaseFranchiseRecoveryUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer el recupero de franquicia de esta carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseWorkflowHistory(accessToken, caseId, options = {}) {
  const endpoint = getCaseWorkflowHistoryUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer el seguimiento de la carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseWorkflowActions(accessToken, caseId, options = {}) {
  const endpoint = getCaseWorkflowActionsUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los próximos pasos de la carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseAuditEvents(accessToken, caseId, options = {}) {
  const endpoint = getCaseAuditEventsUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los eventos de la carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseBudget(accessToken, caseId, options = {}) {
  const endpoint = getCaseBudgetUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer el presupuesto de la carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseDocuments(accessToken, caseId, options = {}) {
  const endpoint = new URL(getCaseDocumentsUrl(caseId));

  if (typeof options.visibleToCustomer === 'boolean') {
    endpoint.searchParams.set('visibleToCustomer', String(options.visibleToCustomer));
  }

  if (options.moduleCode) {
    endpoint.searchParams.set('moduleCode', String(options.moduleCode).trim());
  }

  if (options.entityType) {
    endpoint.searchParams.set('entityType', String(options.entityType).trim());
  }

  if (Number.isInteger(options.entityId)) {
    endpoint.searchParams.set('entityId', String(options.entityId));
  }

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los documentos de la carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function downloadAuthenticatedCaseDocument(accessToken, caseId, documentId, options = {}) {
  const endpoint = getCaseDocumentDownloadUrl(caseId, documentId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: '*/*',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });

  if (!response.ok) {
    const payload = await readJson(response);
    throw buildHttpError(response, 'No pude descargar el documento.', payload);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get('content-disposition') || '';
  const fileNameMatch = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(contentDisposition);
  const fileName = decodeURIComponent(fileNameMatch?.[1] || fileNameMatch?.[2] || `documento-${documentId}`);

  return {
    blob,
    fileName,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseAppointments(accessToken, caseId, options = {}) {
  const endpoint = getCaseAppointmentsUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los turnos de la carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseVehicleIntakes(accessToken, caseId, options = {}) {
  const endpoint = getCaseVehicleIntakesUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los ingresos del vehículo de esta carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseVehicleOutcomes(accessToken, caseId, options = {}) {
  const endpoint = getCaseVehicleOutcomesUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los egresos del vehículo de esta carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseFinanceSummary(accessToken, caseId, options = {}) {
  const endpoint = getCaseFinanceSummaryUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer el resumen financiero de la carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseFinancialMovements(accessToken, caseId, options = {}) {
  const endpoint = getCaseFinancialMovementsUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los movimientos financieros de esta carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCaseReceipts(accessToken, caseId, options = {}) {
  const endpoint = getCaseReceiptsUrl(caseId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los comprobantes de esta carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedUnreadNotifications(accessToken, options = {}) {
  const endpoint = getUnreadNotificationsUrl();
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer las notificaciones pendientes.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedNotifications(accessToken, options = {}) {
  const endpoint = getNotificationsUrl();
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer el historial de notificaciones.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedSystemParameters(accessToken, options = {}) {
  const endpoint = getSystemParametersUrl();
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los parámetros del sistema.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedOperationCatalogs(accessToken, options = {}) {
  const endpoint = getOperationCatalogsUrl();
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los catálogos de operación.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedFinanceCatalogs(accessToken, options = {}) {
  const endpoint = getFinanceCatalogsUrl();
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los catálogos de finanzas.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedInsuranceCatalogs(accessToken, options = {}) {
  const endpoint = getInsuranceCatalogsUrl();
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los catálogos de seguros.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedDocumentsCatalogs(accessToken, options = {}) {
  const endpoint = getDocumentsCatalogsUrl();
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los catálogos de documentos.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedTasks(accessToken, options = {}) {
  const endpoint = getTasksUrl();
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer las tareas operativas.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedInsuranceCompanies(accessToken, options = {}) {
  const endpoint = getInsuranceCompaniesUrl();
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer las compañías de seguros.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedCasesCatalogs(accessToken, options = {}) {
  const endpoint = getCasesCatalogsUrl();
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los catálogos de casos.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function searchAuthenticatedPersons(accessToken, filters = {}, options = {}) {
  const endpoint = new URL(getPersonsUrl());

  if (filters.document) {
    endpoint.searchParams.set('document', String(filters.document));
  }

  if (filters.q) {
    endpoint.searchParams.set('q', String(filters.q));
  }

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude buscar personas.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function createAuthenticatedPerson(accessToken, body, options = {}) {
  const endpoint = getPersonsUrl();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude crear la persona.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function searchAuthenticatedVehicles(accessToken, filters = {}, options = {}) {
  const endpoint = new URL(getVehiclesUrl());

  if (filters.plate) {
    endpoint.searchParams.set('plate', String(filters.plate));
  }

  if (filters.q) {
    endpoint.searchParams.set('q', String(filters.q));
  }

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude buscar vehículos.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function createAuthenticatedVehicle(accessToken, body, options = {}) {
  const endpoint = getVehiclesUrl();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude crear el vehículo.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function createAuthenticatedCase(accessToken, body, options = {}) {
  const endpoint = getConnectivityProbeUrl();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude crear la carpeta.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedInsuranceCompanyContacts(accessToken, companyId, options = {}) {
  const endpoint = getInsuranceCompanyContactsUrl(companyId);
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer los contactos de la compañía.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function readAuthenticatedUnreadNotificationsCount(accessToken, options = {}) {
  const endpoint = getUnreadNotificationsCountUrl();
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude leer la cantidad de notificaciones pendientes.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function markAuthenticatedNotificationAsRead(accessToken, notificationId, options = {}) {
  const endpoint = getNotificationReadUrl(notificationId);
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, 'No pude marcar la notificación como leída.', payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

async function putAuthenticatedCaseResource(accessToken, endpoint, body, fallbackMessage, options = {}) {
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, fallbackMessage, payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

async function postAuthenticatedCaseResource(accessToken, endpoint, body, fallbackMessage, options = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, fallbackMessage, payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

async function postAuthenticatedMultipart(accessToken, endpoint, formData, fallbackMessage, options = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
    signal: options.signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw buildHttpError(response, fallbackMessage, payload);
  }

  return {
    data: payload,
    endpoint: endpoint.toString(),
    httpStatus: response.status,
  };
}

export async function updateAuthenticatedCaseIncident(accessToken, caseId, body, options = {}) {
  const endpoint = buildApiUrl(buildCaseIncidentPath(caseId));
  return putAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude actualizar el incidente del caso.', options);
}

export async function updateAuthenticatedCaseVisibleStates(accessToken, caseId, body, options = {}) {
  const endpoint = buildApiUrl(buildCaseVisibleStatesPath(caseId));
  return putAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude actualizar el estado visible de la carpeta.', options);
}

export async function updateAuthenticatedCaseInsuranceProcessing(accessToken, caseId, body, options = {}) {
  const endpoint = getCaseInsuranceProcessingUrl(caseId);
  return putAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude actualizar la gestión del trámite del caso.', options);
}

export async function updateAuthenticatedCaseInsurance(accessToken, caseId, body, options = {}) {
  const endpoint = getCaseInsuranceUrl(caseId);
  return putAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude actualizar el seguro del caso.', options);
}

export async function updateAuthenticatedCaseFranchise(accessToken, caseId, body, options = {}) {
  const endpoint = getCaseFranchiseUrl(caseId);
  return putAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude actualizar la franquicia del caso.', options);
}

export async function updateAuthenticatedCaseCleas(accessToken, caseId, body, options = {}) {
  const endpoint = getCaseCleasUrl(caseId);
  return putAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude actualizar CLEAS del caso.', options);
}

export async function updateAuthenticatedCaseThirdParty(accessToken, caseId, body, options = {}) {
  const endpoint = getCaseThirdPartyUrl(caseId);
  return putAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude actualizar el bloque de terceros del caso.', options);
}

export async function updateAuthenticatedCaseLegal(accessToken, caseId, body, options = {}) {
  const endpoint = getCaseLegalUrl(caseId);
  return putAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude actualizar el bloque legal del caso.', options);
}

export async function createAuthenticatedCaseLegalNews(accessToken, caseId, body, options = {}) {
  const endpoint = getCaseLegalNewsUrl(caseId);
  return postAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude crear la novedad legal del caso.', options);
}

export async function createAuthenticatedCaseLegalExpense(accessToken, caseId, body, options = {}) {
  const endpoint = getCaseLegalExpensesUrl(caseId);
  return postAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude crear el gasto legal del caso.', options);
}

export async function upsertAuthenticatedCaseBudget(accessToken, caseId, body, options = {}) {
  const endpoint = getCaseBudgetUrl(caseId);
  return putAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude guardar el presupuesto del caso.', options);
}

export async function createAuthenticatedCaseBudgetItem(accessToken, caseId, body, options = {}) {
  const endpoint = buildApiUrl(buildCaseBudgetItemsPath(caseId));
  return postAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude crear el item de presupuesto.', options);
}

export async function updateAuthenticatedCaseBudgetItem(accessToken, caseId, itemId, body, options = {}) {
  const endpoint = buildApiUrl(buildCaseBudgetItemPath(caseId, itemId));
  return putAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude actualizar el item de presupuesto.', options);
}

export async function createAuthenticatedCasePart(accessToken, caseId, body, options = {}) {
  const endpoint = buildApiUrl(buildCasePartsPath(caseId));
  return postAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude crear el repuesto del caso.', options);
}

export async function updateAuthenticatedCasePart(accessToken, caseId, partId, body, options = {}) {
  const endpoint = buildApiUrl(buildCasePartPath(caseId, partId));
  return putAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude actualizar el repuesto del caso.', options);
}

export async function createAuthenticatedCaseReceipt(accessToken, caseId, body, options = {}) {
  const endpoint = getCaseReceiptsUrl(caseId);
  return postAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude crear el recibo del caso.', options);
}

export async function createAuthenticatedCaseFinancialMovement(accessToken, caseId, body, options = {}) {
  const endpoint = getCaseFinancialMovementsUrl(caseId);
  return postAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude crear el movimiento financiero del caso.', options);
}

export async function createAuthenticatedCaseWorkflowTransition(accessToken, caseId, body, options = {}) {
  const endpoint = buildApiUrl(buildCaseWorkflowTransitionsPath(caseId));
  return postAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude transicionar el workflow del caso.', options);
}

export async function uploadAuthenticatedDocument(accessToken, formData, options = {}) {
  const endpoint = buildApiUrl(buildDocumentsPath());
  return postAuthenticatedMultipart(accessToken, endpoint, formData, 'No pude subir el documento.', options);
}

export async function updateAuthenticatedDocument(accessToken, documentId, body, options = {}) {
  const endpoint = buildApiUrl(buildDocumentPath(documentId));
  return putAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude actualizar el documento.', options);
}

export async function replaceAuthenticatedDocument(accessToken, documentId, formData, options = {}) {
  const endpoint = buildApiUrl(buildDocumentReplacePath(documentId));
  return postAuthenticatedMultipart(accessToken, endpoint, formData, 'No pude reemplazar el documento.', options);
}

export async function createAuthenticatedDocumentRelation(accessToken, documentId, body, options = {}) {
  const endpoint = buildApiUrl(buildDocumentRelationsPath(documentId));
  return postAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude crear la relación del documento.', options);
}

export async function updateAuthenticatedDocumentRelation(accessToken, relationId, body, options = {}) {
  const endpoint = buildApiUrl(buildDocumentRelationPath(relationId));
  return putAuthenticatedCaseResource(accessToken, endpoint, body, 'No pude actualizar la relación del documento.', options);
}
