import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CaseWorkspacePage, countCompletedStages, formatDisplayValue, getFichaSummary, getNextStepDescriptor } from './case-workspace-page';

const mockGetCaseWorkspace = vi.fn();
const mockRequestJson = vi.fn();
const mockSearchReferenciadores = vi.fn();
const mockOverrideVisibleState = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockUseQuery = vi.fn();

let currentCaseId = '1';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ caseId: currentCaseId }),
}));

vi.mock('@/modules/cases/api/cases-api', () => ({
  getCaseWorkspace: (...args) => mockGetCaseWorkspace(...args),
  searchReferenciadores: (...args) => mockSearchReferenciadores(...args),
  overrideVisibleState: (...args) => mockOverrideVisibleState(...args),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
  useMutation: ({ mutationFn, onSuccess, onError }) => ({
    isPending: false,
    mutate: async (...args) => {
      try {
        const result = await mutationFn?.(...args);
        await onSuccess?.(result, ...args);
      } catch (error) {
        onError?.(error);
      }
    },
  }),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock('@/shared/api/http-client', () => ({
  requestJson: (...args) => mockRequestJson(...args),
}));

vi.mock('@/modules/cases/components/budget-editor-panel', () => ({
  BudgetEditorPanel: ({ accessoryUi, onAccessoryUiChange }) => (
    <div>
      <div>Budget panel</div>
      <output data-testid="accessory-ui-budget">{JSON.stringify(accessoryUi)}</output>
      <button type="button" onClick={() => onAccessoryUiChange((current) => ({ ...current, enabled: 'SI', works: [...current.works, { id: 'local-accessory', detail: 'Moldura', amount: '180000' }] }))}>Agregar trabajo accesorio</button>
    </div>
  ),
}));

vi.mock('@/modules/cases/components/repair-editor-panel', () => ({
  RepairEditorPanel: () => <div>Repair panel</div>,
}));

vi.mock('@/modules/cases/components/payments-editor-panel', () => ({
  PaymentsEditorPanel: ({ nroCleas, cleasInsurance, onCleasInsuranceChange, cleasAgreedAmount, cleasFranchiseDistribution, cleasPaymentsUi, onCleasPaymentsUiChange, accessoryUi, onAccessoryUiChange }) => cleasPaymentsUi ? (
    <div>
       <div>Payments panel {nroCleas} {cleasAgreedAmount}</div>
       <output data-testid="cleas-franchise-distribution">{JSON.stringify(cleasFranchiseDistribution)}</output>
       <label>Factura CLEAS<input value={cleasInsurance.clientCompany} onChange={(event) => onCleasInsuranceChange((current) => ({ ...current, clientCompany: event.target.value }))} /></label>
       <label>Siniestro CLEAS<input value={cleasInsurance.claimNumber} onChange={(event) => onCleasInsuranceChange((current) => ({ ...current, claimNumber: event.target.value }))} /></label>
      <label>Monto depositado CLEAS<input value={cleasPaymentsUi.paymentDraft.depositedAmount} onChange={(event) => onCleasPaymentsUiChange((current) => ({ ...current, paymentDraft: { ...current.paymentDraft, depositedAmount: event.target.value } }))} /></label>
      <button type="button" onClick={() => onCleasPaymentsUiChange((current) => ({ ...current, invoiceAcknowledged: true, paymentDraft: { ...current.paymentDraft, hasRetentions: 'SI' }, paymentDocument: { file: new File(['pago'], 'pago.pdf'), name: 'pago.pdf' } }))}>Completar UI CLEAS</button>
      <output data-testid="cleas-payments-ui">{JSON.stringify({ invoiceAcknowledged: cleasPaymentsUi.invoiceAcknowledged, hasRetentions: cleasPaymentsUi.paymentDraft.hasRetentions, paymentDocumentName: cleasPaymentsUi.paymentDocument.name })}</output>
    </div>
  ) : <div><div>Payments panel</div><output data-testid="accessory-ui-payments">{JSON.stringify(accessoryUi)}</output><button type="button" onClick={() => onAccessoryUiChange((current) => ({ ...current, notes: 'Cobro pendiente' }))}>Actualizar accesorios</button></div>,
}));

vi.mock('@/shared/ui/dialog', () => ({
  Dialog: ({ open, title, description, children }) => (open ? <div><h2>{title}</h2><p>{description}</p>{children}</div> : null),
}));

const baseWorkspace = {
  caseDetail: {
    id: 1,
    folderCode: 'ZP-2026-0001',
    caseTypeCode: 'PARTICULAR',
    principalCustomerPersonId: 11,
    principalVehicleId: 22,
    principalCustomerName: 'Juan Perez',
    principalVehiclePlate: 'ABC123',
    createdAt: '2026-06-23T10:00:00Z',
    createdByDisplayName: 'Demo Admin',
    closedAt: null,
    referenced: false,
    visibleTramiteState: { code: 'INGRESADO', label: 'Ingresado' },
    visibleRepairState: { code: 'DAR_TURNO', label: 'Dar turno' },
  },
  readiness: {
    caseId: 1,
    caseTypeCode: 'PARTICULAR',
    tabs: [
      { tabCode: 'FICHA_TECNICA', allowed: true, completed: false, blockingReasons: ['Falta marca del vehiculo', 'Falta modelo del vehiculo'], warningReasons: [] },
      { tabCode: 'PRESUPUESTO', allowed: true, completed: false, blockingReasons: ['Falta cargar el presupuesto'], warningReasons: [] },
      { tabCode: 'GESTION_REPARACION', allowed: false, completed: false, blockingReasons: ['Debe cerrar el presupuesto antes de avanzar a gestion reparacion'], warningReasons: [] },
      { tabCode: 'PAGOS', allowed: true, completed: false, blockingReasons: ['Falta presupuesto para calcular el total cotizado'], warningReasons: [] },
    ],
  },
  budget: null,
  financeSummary: { caseId: 1 },
  particularFinanceSummary: {
    caseId: 1,
    quotedTotal: 0,
    customerPaid: 0,
    pendingBalance: 0,
    hasAdvancePayment: false,
    paidInFull: false,
    paidInFullAt: null,
  },
  latestAppointment: null,
  latestIntake: null,
  latestOutcome: null,
  widgets: {
    budget: { exists: false, reportStatusCode: null, totalQuoted: null },
    repair: { hasAppointment: false, hasIntake: false, hasDefinitiveOutcome: false },
  },
  workflowActions: { actions: [] },
  workshopInfo: {},
};

const personResponse = {
  publicId: 'PER-001',
  tipoPersona: 'fisica',
  nombreMostrar: 'Perez, Juan',
  nombre: 'Juan',
  apellido: 'Perez',
  razonSocial: null,
  tipoDocumentoCodigo: 'DNI',
  numeroDocumento: '30111222',
  numeroDocumentoNormalizado: '30111222',
  cuitCuil: '',
  telefonoPrincipal: '3415551111',
  emailPrincipal: 'juan@test.com',
  ocupacion: '',
  fechaNacimiento: '1990-01-05',
  estadoCivilCodigo: 'NO_INFORMA',
  observaciones: '',
  activo: true,
};

const vehicleResponse = {
  publicId: 'VEH-001',
  brandId: null,
  modelId: null,
  brandText: '',
  modelText: '',
  plate: 'ABC123',
  normalizedPlate: 'ABC123',
  year: 2022,
  vehicleTypeCode: 'SEDAN',
  usageCode: 'PARTICULAR',
  transmissionCode: 'MANUAL',
  color: '',
  paintCode: '',
  chasis: '',
  motor: '',
  mileage: 12345,
  observaciones: '',
  activo: true,
};

const vehicleCatalogs = {
  vehicleTypeCodes: [{ code: 'SEDAN' }],
  usageCodes: [{ code: 'PARTICULAR' }],
  transmissionCodes: [{ code: 'MANUAL' }],
};

let referenciadorSearchResults = [];

const renderPage = async (workspace = baseWorkspace) => {
  mockGetCaseWorkspace.mockResolvedValue(workspace);
  mockUseQuery.mockImplementation(({ queryKey }) => {
    if (queryKey[2] === 'workspace') return { data: workspace, isLoading: false, isError: false };
    if (queryKey[2] === 'tasks') return { data: { items: [{ id: 1, statusCode: 'PENDIENTE', dueDate: '2026-06-30' }] }, isLoading: false, isError: false };
    if (queryKey[1] === 11 || queryKey[1] === '11') return { data: personResponse, isLoading: false, isError: false };
    if (queryKey[1] === 22 || queryKey[1] === '22') return { data: vehicleResponse, isLoading: false, isError: false };
    if (queryKey[0] === 'vehicles' && queryKey[1] === 'catalogs') return { data: vehicleCatalogs, isLoading: false, isError: false };
    if (queryKey[0] === 'referenciadores') return { data: referenciadorSearchResults, isLoading: false, isError: false, isFetching: false };
    if (queryKey[2] === 'audit') return { data: [], isLoading: false, isError: false };
    return { data: undefined, isLoading: false, isError: false };
  });
  mockRequestJson.mockResolvedValue({ ok: true });

  const result = render(
    <CaseWorkspacePage />
  );

  await screen.findByText('ZP-2026-0001');
  return result;
};

describe('case workspace helpers', () => {
  it('no cuenta Resumen como etapa', () => {
    expect(countCompletedStages(baseWorkspace.readiness.tabs)).toBe(0);
    expect(countCompletedStages([
      { tabCode: 'DETALLES', completed: true },
      { tabCode: 'FICHA_TECNICA', completed: true },
      { tabCode: 'PRESUPUESTO', completed: false },
      { tabCode: 'GESTION_REPARACION', completed: false },
      { tabCode: 'PAGOS', completed: false },
    ])).toBe(1);
  });

  it('resuelve el proximo paso segun estado real', () => {
    expect(getNextStepDescriptor({ tabs: baseWorkspace.readiness.tabs, budget: null, widgets: baseWorkspace.widgets, particularFinanceSummary: baseWorkspace.particularFinanceSummary }).label)
      .toBe('Completar datos de la ficha tecnica');

    const withFichaReady = {
      ...baseWorkspace,
      readiness: {
        ...baseWorkspace.readiness,
        tabs: baseWorkspace.readiness.tabs.map((tab) => (tab.tabCode === 'FICHA_TECNICA' ? { ...tab, completed: true, blockingReasons: [] } : tab)),
      },
    };
    expect(getNextStepDescriptor({ tabs: withFichaReady.readiness.tabs, budget: null, widgets: withFichaReady.widgets, particularFinanceSummary: withFichaReady.particularFinanceSummary }).label)
      .toBe('Cargar presupuesto');

    const withOpenBudget = {
      tabs: [
        { tabCode: 'FICHA_TECNICA', completed: true, allowed: true, blockingReasons: [] },
        { tabCode: 'PRESUPUESTO', completed: false, allowed: true, blockingReasons: ['El presupuesto todavia no fue cerrado'] },
        { tabCode: 'GESTION_REPARACION', completed: false, allowed: false, blockingReasons: ['Debe cerrar el presupuesto antes de avanzar a gestion reparacion'] },
        { tabCode: 'PAGOS', completed: false, allowed: true, blockingReasons: ['Todavia no se registraron pagos del cliente'] },
      ],
      budget: { reportStatusCode: 'BORRADOR' },
      widgets: { budget: { exists: true }, repair: { hasAppointment: false, hasIntake: false, hasDefinitiveOutcome: false } },
      particularFinanceSummary: { pendingBalance: 1210, customerPaid: 0 },
    };
    expect(getNextStepDescriptor(withOpenBudget).label).toBe('Completar y cerrar presupuesto');
  });

  it('no marca ficha como completa si faltan obligatorios', () => {
    expect(getFichaSummary(baseWorkspace.readiness.tabs[0]).label).toBe('Faltan 2 datos');
    expect(getFichaSummary({ completed: true, blockingReasons: [] }).label).toBe('Ficha completa');
  });

  it('normaliza valores de lectura', () => {
    expect(formatDisplayValue('NO_INFORMA')).toBe('No informa');
    expect(formatDisplayValue('MANUAL')).toBe('Manual');
    expect(formatDisplayValue(false)).toBe('No');
    expect(formatDisplayValue('')).toBe('Sin informar');
  });
});

describe('CaseWorkspacePage UI', () => {
  beforeEach(() => {
    mockGetCaseWorkspace.mockReset();
    mockRequestJson.mockReset();
    mockUseQuery.mockReset();
    mockInvalidateQueries.mockReset();
    mockSearchReferenciadores.mockReset();
    mockOverrideVisibleState.mockReset();
    currentCaseId = '1';
    referenciadorSearchResults = [];
  });

  it('mantiene solo una seccion activa y deja pagos accesible', async () => {
    await renderPage();

    const selectedTabs = screen.getAllByRole('tab').filter((tab) => tab.getAttribute('aria-selected') === 'true');
    expect(selectedTabs).toHaveLength(1);
    expect(screen.getByRole('tab', { name: /pagos/i })).toHaveAttribute('aria-disabled', 'false');
    expect(screen.getByRole('tab', { name: /gesti[oó]n reparaci[oó]n/i })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('0 de 4 etapas completas')).toBeInTheDocument();
  });

  it('abre Presupuesto para Todo Riesgo cuando readiness lo habilita sin franquicia', async () => {
    const user = userEvent.setup();
    await renderPage({
      ...baseWorkspace,
      caseDetail: { ...baseWorkspace.caseDetail, caseTypeCode: 'TODO_RIESGO' },
      readiness: {
        ...baseWorkspace.readiness,
        caseTypeCode: 'TODO_RIESGO',
        tabs: [
          { tabCode: 'FICHA_TECNICA', allowed: true, completed: true, blockingReasons: [], warningReasons: [] },
          { tabCode: 'GESTION_TRAMITE', allowed: true, completed: true, blockingReasons: [], warningReasons: [] },
          { tabCode: 'PRESUPUESTO', allowed: true, completed: false, blockingReasons: ['Falta cargar el presupuesto'], warningReasons: [] },
          { tabCode: 'GESTION_REPARACION', allowed: false, completed: false, blockingReasons: ['Debe cerrar el presupuesto antes de gestionar la reparacion'], warningReasons: [] },
          { tabCode: 'PAGOS', allowed: false, completed: false, blockingReasons: ['Falta acordar cotizacion con la Cia. antes de registrar pagos'], warningReasons: [] },
        ],
      },
    });

    const budgetTab = screen.getByRole('tab', { name: /presupuesto/i });
    expect(budgetTab).toHaveAttribute('aria-disabled', 'false');
    await user.click(budgetTab);
    expect(screen.getByText('Budget panel')).toBeInTheDocument();
  });

  it('muestra las cinco etapas canónicas para CLEAS aunque readiness no las incluya', async () => {
    await renderPage({
      ...baseWorkspace,
      caseDetail: { ...baseWorkspace.caseDetail, caseTypeCode: 'CLEAS' },
      readiness: { ...baseWorkspace.readiness, caseTypeCode: 'CLEAS', tabs: [{ tabCode: 'FICHA_TECNICA', allowed: true, completed: true, blockingReasons: [], warningReasons: [] }] },
    });

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(expect.arrayContaining([
      expect.stringContaining('Resumen'),
      expect.stringContaining('Ficha Técnica'),
      expect.stringContaining('Gestión del Trámite'),
      expect.stringContaining('Presupuesto'),
      expect.stringContaining('Gestión Reparación'),
      expect.stringContaining('Pagos'),
    ]));
    expect(screen.getByText('1 de 5 etapas completas')).toBeInTheDocument();
  });

  it('conserva el número CLEAS al recorrer Gestión del Trámite y Pagos', async () => {
    const user = userEvent.setup();
    const workspace = {
      ...baseWorkspace,
      caseDetail: { ...baseWorkspace.caseDetail, caseTypeCode: 'CLEAS' },
      readiness: {
        ...baseWorkspace.readiness,
        caseTypeCode: 'CLEAS',
        tabs: [
          { tabCode: 'GESTION_TRAMITE', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
          { tabCode: 'PAGOS', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
        ],
      },
    };
    await renderPage(workspace);

    await user.click(screen.getByRole('tab', { name: /gestión del trámite/i }));
    await user.type(screen.getByLabelText('N.º de CLEAS'), 'CLEAS-99');
    await user.type(screen.getByLabelText('Monto de cotización acordada'), '125000');
    await user.click(screen.getByRole('tab', { name: /pagos/i }));

    expect(screen.getByText('Payments panel CLEAS-99 125000')).toBeInTheDocument();
  });

  it('comparte aseguradora y número de siniestro entre Gestión del Trámite y Pagos', async () => {
    const user = userEvent.setup();
    const workspace = {
      ...baseWorkspace,
      caseDetail: { ...baseWorkspace.caseDetail, caseTypeCode: 'CLEAS' },
      readiness: { ...baseWorkspace.readiness, caseTypeCode: 'CLEAS', tabs: [
        { tabCode: 'GESTION_TRAMITE', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
        { tabCode: 'PAGOS', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
      ] },
    };
    await renderPage(workspace);

    await user.click(screen.getByRole('tab', { name: /gestión del trámite/i }));
    await user.type(screen.getByLabelText('Cía. aseguradora del cliente'), 'Aseguradora Uno');
    await user.type(screen.getByLabelText('N.º de siniestro'), 'SIN-99');
    await user.click(screen.getByRole('tab', { name: /pagos/i }));

    expect(screen.getByLabelText('Factura CLEAS')).toHaveValue('Aseguradora Uno');
    expect(screen.getByLabelText('Siniestro CLEAS')).toHaveValue('SIN-99');
  });

  it.each([
    ['pending', 'No se puede avanzar hasta recibir el dictamen.'],
    ['unfavorable', 'Esta etapa no está disponible porque el caso CLEAS fue cerrado por dictamen en contra.'],
  ])('bloquea inmediatamente las etapas posteriores para dictamen %s', async (opinion, message) => {
    const user = userEvent.setup();
    await renderPage({
      ...baseWorkspace,
      caseDetail: { ...baseWorkspace.caseDetail, caseTypeCode: 'CLEAS' },
      readiness: { ...baseWorkspace.readiness, caseTypeCode: 'CLEAS', tabs: [
        { tabCode: 'GESTION_TRAMITE', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
        { tabCode: 'PRESUPUESTO', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
        { tabCode: 'GESTION_REPARACION', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
        { tabCode: 'PAGOS', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
      ] },
    });

    await user.click(screen.getByRole('tab', { name: /gestión del trámite/i }));
    await user.selectOptions(screen.getAllByLabelText('Dictamen')[0], opinion);
    for (const name of [/presupuesto/i, /gestión reparación/i, /pagos/i]) {
      const tab = screen.getByRole('tab', { name });
      expect(tab).toHaveAttribute('aria-disabled', 'true');
      await user.click(tab);
      expect(screen.getByText(message)).toBeInTheDocument();
    }
  });

  it('conserva los extras entre Presupuesto y Pagos y los reinicia al cambiar de carpeta', async () => {
    const user = userEvent.setup();
    const workspace = {
      ...baseWorkspace,
      caseDetail: { ...baseWorkspace.caseDetail, caseTypeCode: 'TODO_RIESGO' },
      readiness: { ...baseWorkspace.readiness, caseTypeCode: 'TODO_RIESGO', tabs: [
        { tabCode: 'PRESUPUESTO', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
        { tabCode: 'PAGOS', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
      ] },
    };
    const rendered = await renderPage(workspace);

    await user.click(screen.getByRole('tab', { name: /presupuesto/i }));
    await user.click(screen.getByRole('button', { name: 'Agregar trabajo accesorio' }));
    await user.click(screen.getByRole('tab', { name: /pagos/i }));
    expect(screen.getByTestId('accessory-ui-payments')).toHaveTextContent('"detail":"Moldura"');
    await user.click(screen.getByRole('button', { name: 'Actualizar accesorios' }));
    await user.click(screen.getByRole('tab', { name: /presupuesto/i }));
    expect(screen.getByTestId('accessory-ui-budget')).toHaveTextContent('"notes":"Cobro pendiente"');

    currentCaseId = '2';
    rendered.rerender(<CaseWorkspacePage />);
    await waitFor(() => expect(screen.getByTestId('accessory-ui-budget')).toHaveTextContent('"works":[]'));
  });

  it('rehidrata los trabajos extras persistidos al recargar la carpeta', async () => {
    const user = userEvent.setup();
    await renderPage({
      ...baseWorkspace,
      caseDetail: { ...baseWorkspace.caseDetail, caseTypeCode: 'TODO_RIESGO' },
      budget: {
        id: 15,
        currentVersion: 2,
        accessoryWorks: [{ id: 90, affectedPiece: 'Moldura lateral', actionCode: 'REEMPLAZAR_Y_PINTAR', damageLevelCode: 'LEVE', replacementAmount: 30000 }],
      },
      readiness: { ...baseWorkspace.readiness, caseTypeCode: 'TODO_RIESGO', tabs: [
        { tabCode: 'PRESUPUESTO', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
      ] },
    });

    await user.click(screen.getByRole('tab', { name: /presupuesto/i }));
    await waitFor(() => expect(screen.getByTestId('accessory-ui-budget')).toHaveTextContent('"affectedPiece":"Moldura lateral"'));
    expect(screen.getByTestId('accessory-ui-budget')).toHaveTextContent('"replacementAmount":"30000"');
  });

  it('conserva la distribución de franquicia entre Tramitación y Pagos y la reinicia al cambiar de carpeta', async () => {
    const user = userEvent.setup();
    const workspace = {
      ...baseWorkspace,
      caseDetail: { ...baseWorkspace.caseDetail, caseTypeCode: 'CLEAS' },
      readiness: { ...baseWorkspace.readiness, caseTypeCode: 'CLEAS', tabs: [
        { tabCode: 'GESTION_TRAMITE', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
        { tabCode: 'PAGOS', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
      ] },
    };
    const rendered = await renderPage(workspace);

    await user.click(screen.getByRole('tab', { name: /gestión del trámite/i }));
    await user.selectOptions(screen.getByLabelText('CLEAS sobre'), 'franchise');
    await user.selectOptions(screen.getAllByLabelText('Dictamen')[0], 'unfavorable');
    await user.type(screen.getByLabelText('Monto de franquicia'), '1000000');
    await user.selectOptions(screen.getByLabelText('¿La Cía. exige pago de franquicia?'), 'PARCIAL');
    await user.type(screen.getByLabelText('Monto que la Cía. exige al cliente'), '500000');
    await user.click(screen.getByRole('tab', { name: /pagos/i }));

    expect(screen.getByTestId('cleas-franchise-distribution')).toHaveTextContent('"franchiseAmount":"1000000"');
    expect(screen.getByTestId('cleas-franchise-distribution')).toHaveTextContent('"companyRequiredAmount":"500000"');
    currentCaseId = '2';
    rendered.rerender(<CaseWorkspacePage />);
    await waitFor(() => expect(screen.getByTestId('cleas-franchise-distribution')).toHaveTextContent('"franchiseAmount":""'));
  });

  it('mantiene sincronizado el total exigido al editar la franquicia antes de ir a Pagos', async () => {
    const workspace = {
      ...baseWorkspace,
      caseDetail: { ...baseWorkspace.caseDetail, caseTypeCode: 'CLEAS' },
      readiness: { ...baseWorkspace.readiness, caseTypeCode: 'CLEAS', tabs: [
        { tabCode: 'GESTION_TRAMITE', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
        { tabCode: 'PAGOS', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
      ] },
    };
    await renderPage(workspace);

    fireEvent.click(screen.getByRole('tab', { name: /gestión del trámite/i }));
    fireEvent.change(screen.getByLabelText('CLEAS sobre'), { target: { value: 'franchise' } });
    fireEvent.change(screen.getAllByLabelText('Dictamen')[0], { target: { value: 'unfavorable' } });
    fireEvent.change(screen.getByLabelText('Monto de franquicia'), { target: { value: '1000000' } });
    fireEvent.change(screen.getByLabelText('¿La Cía. exige pago de franquicia?'), { target: { value: 'TOTAL' } });
    fireEvent.change(screen.getByLabelText('Monto de franquicia'), { target: { value: '1200000' } });
    fireEvent.click(screen.getByRole('tab', { name: /pagos/i }));

    expect(screen.getByTestId('cleas-franchise-distribution')).toHaveTextContent('"franchiseAmount":"1200000"');
    expect(screen.getByTestId('cleas-franchise-distribution')).toHaveTextContent('"companyRequiredAmount":"1200000"');
  }, 15_000);

  it('conserva los borradores CLEAS al desmontar y remontar la pestaña de pagos', async () => {
    const user = userEvent.setup();
    const workspace = {
      ...baseWorkspace,
      caseDetail: { ...baseWorkspace.caseDetail, caseTypeCode: 'CLEAS' },
      readiness: { ...baseWorkspace.readiness, caseTypeCode: 'CLEAS', tabs: [
        { tabCode: 'GESTION_TRAMITE', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
        { tabCode: 'PAGOS', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
      ] },
    };
    await renderPage(workspace);

    await user.click(screen.getByRole('tab', { name: /pagos/i }));
    await user.type(screen.getByLabelText('Factura CLEAS'), 'Aseguradora Uno');
    await user.type(screen.getByLabelText('Monto depositado CLEAS'), '90000');
    await user.click(screen.getByRole('tab', { name: /gestión del trámite/i }));
    await user.click(screen.getByRole('tab', { name: /pagos/i }));

    expect(screen.getByLabelText('Factura CLEAS')).toHaveValue('Aseguradora Uno');
    expect(screen.getByLabelText('Monto depositado CLEAS')).toHaveValue('90000');
  });

  it('resetea los borradores CLEAS al cambiar de carpeta', async () => {
    const user = userEvent.setup();
    const workspace = {
      ...baseWorkspace,
      caseDetail: { ...baseWorkspace.caseDetail, caseTypeCode: 'CLEAS' },
      readiness: { ...baseWorkspace.readiness, caseTypeCode: 'CLEAS', tabs: [{ tabCode: 'PAGOS', allowed: true, completed: false, blockingReasons: [], warningReasons: [] }] },
    };
    const rendered = await renderPage(workspace);
    await user.click(screen.getByRole('tab', { name: /pagos/i }));
    await user.type(screen.getByLabelText('Factura CLEAS'), 'Aseguradora Uno');
    await user.type(screen.getByLabelText('Monto depositado CLEAS'), '90000');
    await user.click(screen.getByRole('button', { name: 'Completar UI CLEAS' }));

    currentCaseId = '2';
    rendered.rerender(<CaseWorkspacePage />);

    await waitFor(() => expect(screen.getByLabelText('Factura CLEAS')).toHaveValue(''));
    expect(screen.getByLabelText('Monto depositado CLEAS')).toHaveValue('');
    expect(screen.getByTestId('cleas-payments-ui')).toHaveTextContent('{"invoiceAcknowledged":false,"hasRetentions":"NO","paymentDocumentName":""}');
  });

  it('confirma el cierre visual CLEAS, bloquea etapas posteriores y mantiene gestión de solo lectura', async () => {
    const user = userEvent.setup();
    const workspace = {
      ...baseWorkspace,
      caseDetail: { ...baseWorkspace.caseDetail, caseTypeCode: 'CLEAS' },
      readiness: { ...baseWorkspace.readiness, caseTypeCode: 'CLEAS', tabs: [
        { tabCode: 'FICHA_TECNICA', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
        { tabCode: 'GESTION_TRAMITE', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
      ] },
    };
    await renderPage(workspace);

    await user.click(screen.getByRole('tab', { name: /gestión del trámite/i }));
    await user.selectOptions(screen.getAllByLabelText('Dictamen')[0], 'unfavorable');
    expect(screen.getByRole('alert')).toHaveTextContent('Dictamen en contra');
    await user.click(screen.getByRole('button', { name: 'Cerrar caso' }));
    expect(screen.getByRole('heading', { name: '¿Cerrar caso CLEAS?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmar cierre' }));

    expect(screen.getAllByText('Caso cerrado').length).toBeGreaterThan(0);
    expect(screen.getByRole('alert')).toHaveTextContent('Cerrado por dictamen CLEAS en contra');
    expect(screen.getByLabelText('CLEAS sobre')).toBeDisabled();
    expect(screen.getByLabelText('Dictamen')).toBeDisabled();
    expect(screen.queryByLabelText('N.º de CLEAS')).toBeNull();
    const tramiteButton = screen.getByRole('button', { name: /trámite: ingresado/i });
    const repairButton = screen.getByRole('button', { name: /reparación: dar turno/i });
    expect(tramiteButton).toBeDisabled();
    expect(repairButton).toBeDisabled();
    await user.click(tramiteButton);
    await user.click(repairButton);
    expect(screen.queryByText('Cambiar estado de Trámite')).toBeNull();
    expect(mockOverrideVisibleState).not.toHaveBeenCalled();

    await user.click(screen.getByRole('tab', { name: /pagos/i }));
    expect(screen.getByText('Esta etapa no está disponible porque el caso CLEAS fue cerrado por dictamen en contra.')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /pagos/i })).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not offer closure or block tabs for the exact unfavorable franchise branch', async () => {
    const user = userEvent.setup();
    await renderPage({
      ...baseWorkspace,
      caseDetail: { ...baseWorkspace.caseDetail, caseTypeCode: 'CLEAS' },
      readiness: { ...baseWorkspace.readiness, caseTypeCode: 'CLEAS', tabs: [
        { tabCode: 'GESTION_TRAMITE', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
        { tabCode: 'PAGOS', allowed: true, completed: false, blockingReasons: [], warningReasons: [] },
      ] },
    });

    await user.click(screen.getByRole('tab', { name: /gestión del trámite/i }));
    await user.selectOptions(screen.getByLabelText('CLEAS sobre'), 'franchise');
    await user.selectOptions(screen.getAllByLabelText('Dictamen')[0], 'unfavorable');
    expect(screen.queryByRole('button', { name: 'Cerrar caso' })).toBeNull();
    await user.click(screen.getByRole('tab', { name: /pagos/i }));
    expect(screen.getByRole('tab', { name: /pagos/i })).toHaveAttribute('aria-disabled', 'false');
    expect(screen.queryByText('Esta etapa no está disponible porque el caso CLEAS fue cerrado por dictamen en contra.')).toBeNull();
  });

  it('does not close a CLEAS case when the closure confirmation is cancelled and resets closure on case change', async () => {
    const user = userEvent.setup();
    const workspace = {
      ...baseWorkspace,
      caseDetail: { ...baseWorkspace.caseDetail, caseTypeCode: 'CLEAS' },
      readiness: { ...baseWorkspace.readiness, caseTypeCode: 'CLEAS', tabs: [{ tabCode: 'GESTION_TRAMITE', allowed: true, completed: false, blockingReasons: [], warningReasons: [] }] },
    };
    const rendered = await renderPage(workspace);
    await user.click(screen.getByRole('tab', { name: /gestión del trámite/i }));
    await user.selectOptions(screen.getAllByLabelText('Dictamen')[0], 'unfavorable');
    await user.click(screen.getByRole('button', { name: 'Cerrar caso' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText('Caso cerrado')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Cerrar caso' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar cierre' }));
    expect(screen.getByText('Cerrado por dictamen CLEAS en contra', { exact: false })).toBeInTheDocument();
    currentCaseId = '2';
    rendered.rerender(<CaseWorkspacePage />);
    await waitFor(() => expect(screen.queryByText('Caso cerrado')).toBeNull());
  });

  it('muestra saldo pendiente de presupuesto y no saldo $0 como pago completo', async () => {
    await renderPage();

    const pagosCard = screen.getByText('Pagos', { selector: 'p' }).closest('div');
    expect(within(pagosCard).getAllByText('Pendiente de presupuesto').length).toBeGreaterThan(0);
    expect(screen.queryByText('Pagado')).not.toBeInTheDocument();
  });

  it('oculta ids y normalizados en ficha tecnica sin perder los datos visibles', async () => {
    await renderPage();

    await userEvent.click(screen.getByRole('tab', { name: /ficha t[eé]cnica/i }));
    await screen.findByRole('heading', { name: 'Ficha tecnica' });

    expect(screen.getAllByText('Sin informar').length).toBeGreaterThan(0);
    expect(screen.queryByText('PER-001')).not.toBeInTheDocument();
    expect(screen.queryByText('VEH-001')).not.toBeInTheDocument();
    expect(screen.getByText('Nombre visible')).toBeInTheDocument();
    expect(screen.getByText('30111222')).toBeInTheDocument();
    expect(screen.queryByText('Documento normalizado')).not.toBeInTheDocument();
    expect(screen.queryByText('Patente normalizada')).not.toBeInTheDocument();
    expect(screen.getByText('No informa')).toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument();
    expect(screen.getAllByText('Si').length).toBeGreaterThan(0);
  });

  it('conserva los campos de edicion existentes', async () => {
    await renderPage();

    await userEvent.click(screen.getByRole('tab', { name: /ficha t[eé]cnica/i }));
    await userEvent.click(screen.getByRole('button', { name: /editar ficha/i }));

    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Apellido')).toBeInTheDocument();
    expect(screen.getByLabelText('Marca')).toBeInTheDocument();
    expect(screen.getByLabelText('Modelo')).toBeInTheDocument();
    expect(screen.getByLabelText('Patente')).toBeInTheDocument();
    expect(screen.getByLabelText('Kilometraje')).toBeInTheDocument();
  });

  it('persiste el referenciador seleccionado al guardar la ficha tecnica', async () => {
    const user = userEvent.setup();
    const referenciador = { id: 77, displayName: 'Ana Referidora', telefono: '3415552222' };
    referenciadorSearchResults = [referenciador];
    await renderPage();

    await user.click(screen.getByRole('tab', { name: /ficha t[eé]cnica/i }));
    await user.click(screen.getByRole('button', { name: /editar ficha/i }));
    await user.selectOptions(screen.getByLabelText('Referenciado'), 'SI');
    await user.type(screen.getByPlaceholderText('Buscar por nombre...'), 'An');
    await user.click(await screen.findByRole('button', { name: /ana referidora/i }));
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(mockRequestJson).toHaveBeenLastCalledWith('/cases/1', {
      method: 'PUT',
      body: JSON.stringify({
        referenced: true,
        referredByPersonId: null,
        referenciadorId: 77,
        referredByText: null,
        priorityCode: null,
        generalObservations: null,
        closedAt: null,
        archivedAt: null,
      }),
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '1', 'workspace'] });
  });

  it('limpia el referenciador al desmarcar una carpeta referenciada', async () => {
    const user = userEvent.setup();
    await renderPage({
      ...baseWorkspace,
      caseDetail: { ...baseWorkspace.caseDetail, referenced: true, referenciadorId: 77 },
    });

    await user.click(screen.getByRole('tab', { name: /ficha t[eé]cnica/i }));
    await user.click(screen.getByRole('button', { name: /editar ficha/i }));
    await user.selectOptions(screen.getByLabelText('Referenciado'), 'NO');
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(JSON.parse(mockRequestJson.mock.calls.at(-1)[1].body)).toMatchObject({
      referenced: false,
      referenciadorId: null,
    });
  });

  it('usa scroll horizontal controlado para tabs responsive', async () => {
    await renderPage();

    expect(screen.getByTestId('workspace-tabs-scroll')).toHaveClass('overflow-x-auto');
  });

  it('limita los overrides de PARTICULAR y permite volver a automático', async () => {
    const user = userEvent.setup();
    mockOverrideVisibleState.mockResolvedValue(undefined);
    await renderPage({
      ...baseWorkspace,
      caseDetail: {
        ...baseWorkspace.caseDetail,
        visibleTramiteState: { code: 'RECHAZADO', label: 'Rechazado', manualOverride: true },
      },
    });

    await user.click(screen.getByRole('button', { name: /trámite: rechazado/i }));

    expect(screen.queryByRole('option', { name: 'Sin presentar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Acordado' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /volver a automático/i }));

    expect(mockOverrideVisibleState).toHaveBeenCalledWith('1', 'tramite', null, '');
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases'] });
  });

  it('no ofrece overrides manuales para TODO_RIESGO', async () => {
    const user = userEvent.setup();
    await renderPage({
      ...baseWorkspace,
      caseDetail: {
        ...baseWorkspace.caseDetail,
        caseTypeCode: 'TODO_RIESGO',
        visibleTramiteState: { code: 'PAGADO', label: 'Pagado' },
        visibleRepairState: { code: 'NO_DEBE_REPARARSE', label: 'No debe repararse' },
      },
    });

    const tramiteButton = screen.getByRole('button', { name: /trámite: pagado/i });
    const repairButton = screen.getByRole('button', { name: /reparación: no debe repararse/i });
    expect(tramiteButton).toBeDisabled();
    expect(repairButton).toBeDisabled();
    await user.click(tramiteButton);
    expect(screen.queryByText('Cambiar estado de Trámite')).not.toBeInTheDocument();
  });

  it('muestra el proximo paso operativo en resumen', async () => {
    await renderPage();

    expect(screen.getByText('Proximo paso')).toBeInTheDocument();
    expect(screen.getByText('Completar datos de la ficha tecnica')).toBeInTheDocument();
  });

  it('muestra ayuda util en navegacion cuando gestion esta bloqueada', async () => {
    await renderPage();

    expect(screen.getByText('Completa el presupuesto para habilitar Gestion de reparacion.')).toBeInTheDocument();
  });
});
