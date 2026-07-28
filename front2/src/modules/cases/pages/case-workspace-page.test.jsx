import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CaseWorkspacePage, countCompletedStages, formatDisplayValue, getFichaSummary, getNextStepDescriptor } from './case-workspace-page';

const mockGetCaseWorkspace = vi.fn();
const mockRequestJson = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockUseQuery = vi.fn();

vi.mock('react-router-dom', () => ({
  useParams: () => ({ caseId: '1' }),
}));

vi.mock('@/modules/cases/api/cases-api', () => ({
  getCaseWorkspace: (...args) => mockGetCaseWorkspace(...args),
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
  BudgetEditorPanel: () => <div>Budget panel</div>,
}));

vi.mock('@/modules/cases/components/repair-editor-panel', () => ({
  RepairEditorPanel: () => <div>Repair panel</div>,
}));

vi.mock('@/modules/cases/components/payments-editor-panel', () => ({
  PaymentsEditorPanel: () => <div>Payments panel</div>,
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

const renderPage = async (workspace = baseWorkspace) => {
  mockGetCaseWorkspace.mockResolvedValue(workspace);
  mockUseQuery.mockImplementation(({ queryKey }) => {
    if (queryKey[2] === 'workspace') return { data: workspace, isLoading: false, isError: false };
    if (queryKey[2] === 'tasks') return { data: { items: [{ id: 1, statusCode: 'PENDIENTE', dueDate: '2026-06-30' }] }, isLoading: false, isError: false };
    if (queryKey[1] === 11 || queryKey[1] === '11') return { data: personResponse, isLoading: false, isError: false };
    if (queryKey[1] === 22 || queryKey[1] === '22') return { data: vehicleResponse, isLoading: false, isError: false };
    if (queryKey[0] === 'vehicles' && queryKey[1] === 'catalogs') return { data: vehicleCatalogs, isLoading: false, isError: false };
    if (queryKey[2] === 'audit') return { data: [], isLoading: false, isError: false };
    return { data: undefined, isLoading: false, isError: false };
  });
  mockRequestJson.mockResolvedValue({ ok: true });

  render(
    <CaseWorkspacePage />
  );

  await screen.findByText('ZP-2026-0001');
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
  });

  it('mantiene solo una seccion activa y deja pagos accesible', async () => {
    await renderPage();

    const selectedTabs = screen.getAllByRole('tab').filter((tab) => tab.getAttribute('aria-selected') === 'true');
    expect(selectedTabs).toHaveLength(1);
    expect(screen.getByRole('tab', { name: /pagos/i })).toHaveAttribute('aria-disabled', 'false');
    expect(screen.getByRole('tab', { name: /gestion de reparacion/i })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('0 de 4 etapas completas')).toBeInTheDocument();
  });

  it('muestra saldo pendiente de presupuesto y no saldo $0 como pago completo', async () => {
    await renderPage();

    const pagosCard = screen.getByText('Pagos', { selector: 'p' }).closest('div');
    expect(within(pagosCard).getAllByText('Pendiente de presupuesto').length).toBeGreaterThan(0);
    expect(screen.queryByText('Pagado')).not.toBeInTheDocument();
  });

  it('oculta ids y normalizados en ficha tecnica sin perder los datos visibles', async () => {
    await renderPage();

    await userEvent.click(screen.getByRole('tab', { name: /ficha tecnica/i }));
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

    await userEvent.click(screen.getByRole('tab', { name: /ficha tecnica/i }));
    await userEvent.click(screen.getByRole('button', { name: /editar ficha/i }));

    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Apellido')).toBeInTheDocument();
    expect(screen.getByLabelText('Marca')).toBeInTheDocument();
    expect(screen.getByLabelText('Modelo')).toBeInTheDocument();
    expect(screen.getByLabelText('Patente')).toBeInTheDocument();
    expect(screen.getByLabelText('Kilometraje')).toBeInTheDocument();
  });

  it('usa scroll horizontal controlado para tabs responsive', async () => {
    await renderPage();

    expect(screen.getByTestId('workspace-tabs-scroll')).toHaveClass('overflow-x-auto');
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
