import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.fn();
const useQueryMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => useQueryMock(...args),
}));

vi.mock('@/modules/cases/api/cases-api', () => ({
  listCases: vi.fn(),
}));

vi.mock('@/modules/cases/api/new-case-api', () => ({
  getCaseCatalogs: vi.fn(),
  getInsuranceCatalogs: vi.fn(),
}));

vi.mock('@/modules/agenda/api/agenda-api', () => ({
  listOperationalTasks: vi.fn(),
}));

import { CasesPage } from '@/modules/cases/pages/cases-page';
import { listCases } from '@/modules/cases/api/cases-api';
import { getCaseCatalogs, getInsuranceCatalogs } from '@/modules/cases/api/new-case-api';
import { listOperationalTasks } from '@/modules/agenda/api/agenda-api';

const baseItems = [
  {
    id: 1,
    folderCode: 'CAR-001',
    principalCustomerName: 'Ana Uno',
    principalVehiclePlate: 'AA111AA',
    caseTypeCode: 'PARTICULAR',
    currentCaseStateCode: 'EN_TRAMITE',
    currentRepairStateCode: 'SIN_TURNO',
    currentPaymentStateCode: 'PENDIENTE',
    visibleTramiteState: { code: 'EN_TRAMITE', label: 'En tramite' },
    visibleRepairState: { code: 'DAR_TURNO', label: 'Dar turno' },
    createdAt: '2026-02-10T08:00:00Z',
    closedAt: null,
    branchId: 1,
    branchCode: 'Z',
  },
  {
    id: 2,
    folderCode: 'CAR-002',
    principalCustomerName: 'Beto Dos',
    principalVehiclePlate: 'BB222BB',
    caseTypeCode: 'TODO_RIESGO',
    currentCaseStateCode: 'CERRADO',
    currentRepairStateCode: 'REPARADO',
    currentPaymentStateCode: 'PAGADO',
    visibleTramiteState: { code: 'PAGADO', label: 'Pagado' },
    visibleRepairState: { code: 'REPARADO', label: 'Reparado' },
    createdAt: '2026-03-05T08:00:00Z',
    closedAt: '2026-03-20T10:00:00Z',
    branchId: 2,
    branchCode: 'C',
  },
];

const caseTypes = [
  { code: 'PARTICULAR', name: 'Particular' },
  { code: 'TODO_RIESGO', name: 'Todo Riesgo' },
];

const paymentStatusCodes = [
  { code: 'PENDIENTE', name: 'Pendiente' },
  { code: 'PAGADO', name: 'Pagado' },
];

const defaultCasesResponse = {
  items: baseItems,
  totalElements: baseItems.length,
};

const defaultCatalogsState = {
  isLoading: false,
  isError: false,
  data: { caseTypes },
};

const defaultInsuranceState = {
  isSuccess: true,
  isError: false,
  data: { opinionCodes: [], paymentStatusCodes },
};

const defaultPendingTasksState = {
  isError: false,
  data: { items: [] },
};

let mainCasesStates;
let filterSourceState;
let executedQueryKeys;

function filtersKey(filters = {}) {
  return JSON.stringify(filters);
}

function setMainCasesState(filters, state) {
  mainCasesStates.set(filtersKey(filters), state);
}

function buildMainCasesState(filters = {}) {
  return mainCasesStates.get(filtersKey(filters)) || {
    isLoading: false,
    isFetching: false,
    isError: false,
    isSuccess: false,
    data: undefined,
  };
}

function runQueryOnce(queryKey, queryFn) {
  if (executedQueryKeys.has(queryKey)) {
    return;
  }

  executedQueryKeys.add(queryKey);
  void queryFn();
}

function configureUseQueryMock() {
  useQueryMock.mockImplementation((options) => {
    const queryKey = options.queryKey;

    if (queryKey[0] === 'cases' && queryKey[1] === 'catalogs') {
      return defaultCatalogsState;
    }

    if (queryKey[0] === 'cases' && queryKey[1] === 'insurance-catalogs') {
      return defaultInsuranceState;
    }

    if (queryKey[0] === 'cases' && queryKey[1] === 'pending-tasks-options') {
      return defaultPendingTasksState;
    }

    if (queryKey[0] === 'cases' && queryKey[1] === 'list' && queryKey[2] === 'filter-options-source') {
      runQueryOnce('filter-options-source', options.queryFn);
      return filterSourceState;
    }

    if (queryKey[0] === 'cases' && queryKey[1] === 'list') {
      const currentFilters = queryKey[2] || {};
      runQueryOnce(`main:${filtersKey(currentFilters)}`, options.queryFn);
      return buildMainCasesState(currentFilters);
    }

    throw new Error(`Unhandled query key: ${JSON.stringify(queryKey)}`);
  });
}

function renderPage() {
  return {
    user: userEvent.setup(),
    ...render(<CasesPage />),
  };
}

async function openMoreFilters(user, expectedName = 'Filtros avanzados') {
  await user.click(screen.getByRole('button', { name: expectedName }));
}

beforeEach(() => {
  navigateMock.mockReset();
  useQueryMock.mockReset();
  executedQueryKeys = new Set();
  mainCasesStates = new Map();
  filterSourceState = {
    isLoading: false,
    isError: false,
    isSuccess: true,
    data: defaultCasesResponse,
  };

  setMainCasesState({}, {
    isLoading: false,
    isFetching: false,
    isError: false,
    isSuccess: true,
    data: defaultCasesResponse,
  });

  getCaseCatalogs.mockReset();
  getInsuranceCatalogs.mockReset();
  listOperationalTasks.mockReset();
  listCases.mockReset();

  getCaseCatalogs.mockResolvedValue({ caseTypes });
  getInsuranceCatalogs.mockResolvedValue({ opinionCodes: [], paymentStatusCodes });
  listOperationalTasks.mockResolvedValue([]);
  listCases.mockResolvedValue(defaultCasesResponse);

  configureUseQueryMock();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('CasesPage integration', () => {
  it('cambia Sucursal C -> Z con un solo click y conserva el filtro aplicado', async () => {
    setMainCasesState({ branchId: 2 }, {
      isLoading: true,
      isFetching: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    });
    setMainCasesState({ branchId: 1 }, {
      isLoading: true,
      isFetching: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    });

    const { user, rerender } = renderPage();

    await screen.findByText('CAR-001');
    await openMoreFilters(user);
    await user.selectOptions(screen.getByLabelText('Sucursal'), '2');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    expect(listCases).toHaveBeenLastCalledWith({ size: 200, branchId: 2 });
    expect(screen.queryByText('Cargando carpetas...')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtros avanzados · 1' })).toBeInTheDocument();

    setMainCasesState({ branchId: 2 }, {
      isLoading: false,
      isFetching: false,
      isError: false,
      isSuccess: true,
      data: { items: [baseItems[1]], totalElements: 2 },
    });
    rerender(<CasesPage />);

    await screen.findByText('CAR-002');
    await waitFor(() => expect(screen.queryByText('CAR-001')).not.toBeInTheDocument());

    await openMoreFilters(user, 'Filtros avanzados · 1');
    expect(screen.getByLabelText('Sucursal')).toHaveValue('2');

    await user.selectOptions(screen.getByLabelText('Sucursal'), '1');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    expect(listCases).toHaveBeenLastCalledWith({ size: 200, branchId: 1 });

    setMainCasesState({ branchId: 1 }, {
      isLoading: false,
      isFetching: false,
      isError: false,
      isSuccess: true,
      data: { items: [baseItems[0]], totalElements: 2 },
    });
    rerender(<CasesPage />);

    await screen.findByText('CAR-001');
    await waitFor(() => expect(screen.queryByText('CAR-002')).not.toBeInTheDocument());

    await openMoreFilters(user, 'Filtros avanzados · 1');
    expect(screen.getByLabelText('Sucursal')).toHaveValue('1');
    expect(screen.getByRole('button', { name: 'Quitar filtro Sucursal: Z' })).toBeInTheDocument();
  });

  it('aplica varios filtros juntos en una sola consulta', async () => {
    setMainCasesState({ branchId: 1, paymentStateCode: 'PENDIENTE' }, {
      isLoading: false,
      isFetching: false,
      isError: false,
      isSuccess: true,
      data: { items: [baseItems[0]], totalElements: 2 },
    });

    const { user } = renderPage();

    await screen.findByText('CAR-001');
    await openMoreFilters(user);
    await user.selectOptions(screen.getByLabelText('Sucursal'), '1');
    await user.selectOptions(screen.getByLabelText('Estado de pago'), 'PENDIENTE');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    await waitFor(() => expect(listCases).toHaveBeenLastCalledWith({ size: 200, branchId: 1, paymentStateCode: 'PENDIENTE' }));
    await waitFor(() => expect(screen.queryByText('CAR-002')).not.toBeInTheDocument());
  });

  it('ignora respuestas viejas cuando la consulta mas nueva llega primero', async () => {
    setMainCasesState({ branchId: 2 }, {
      isLoading: true,
      isFetching: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    });
    setMainCasesState({ branchId: 1 }, {
      isLoading: true,
      isFetching: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    });

    const { user, rerender } = renderPage();

    await screen.findByText('CAR-001');
    await openMoreFilters(user);
    await user.selectOptions(screen.getByLabelText('Sucursal'), '2');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    expect(screen.queryByText('Cargando carpetas...')).not.toBeInTheDocument();

    await openMoreFilters(user, 'Filtros avanzados · 1');
    await user.selectOptions(screen.getByLabelText('Sucursal'), '1');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    setMainCasesState({ branchId: 1 }, {
      isLoading: false,
      isFetching: false,
      isError: false,
      isSuccess: true,
      data: { items: [baseItems[0]], totalElements: 2 },
    });
    rerender(<CasesPage />);

    await screen.findByText('CAR-001');
    await waitFor(() => expect(screen.queryByText('CAR-002')).not.toBeInTheDocument());

    setMainCasesState({ branchId: 2 }, {
      isLoading: false,
      isFetching: false,
      isError: false,
      isSuccess: true,
      data: { items: [baseItems[1]], totalElements: 2 },
    });
    rerender(<CasesPage />);

    await waitFor(() => {
      expect(screen.getByText('CAR-001')).toBeInTheDocument();
      expect(screen.queryByText('CAR-002')).not.toBeInTheDocument();
    });
  });

  it('no reinicializa draft ni applied durante rerenderes con error', async () => {
    setMainCasesState({ branchId: 2 }, {
      isLoading: false,
      isFetching: false,
      isError: false,
      isSuccess: true,
      data: { items: [baseItems[1]], totalElements: 2 },
    });
    setMainCasesState({ branchId: 1 }, {
      isLoading: false,
      isFetching: false,
      isError: true,
      isSuccess: false,
      error: new Error('Timeout Z'),
      data: undefined,
    });

    const { user, rerender } = renderPage();

    await screen.findByText('CAR-001');
    await openMoreFilters(user);
    await user.selectOptions(screen.getByLabelText('Sucursal'), '2');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    rerender(<CasesPage />);

    await screen.findByText('CAR-002');
    await waitFor(() => expect(screen.queryByText('CAR-001')).not.toBeInTheDocument());

    await openMoreFilters(user, 'Filtros avanzados · 1');
    expect(screen.getByLabelText('Sucursal')).toHaveValue('2');

    await user.selectOptions(screen.getByLabelText('Sucursal'), '1');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    rerender(<CasesPage />);

    await screen.findByText(/No pude actualizar las carpetas/);
    expect(screen.getByText('No hay carpetas para esos filtros')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quitar filtro Sucursal: Z' })).toBeInTheDocument();

    await openMoreFilters(user, 'Filtros avanzados · 1');
    expect(screen.getByLabelText('Sucursal')).toHaveValue('1');
  });
});
