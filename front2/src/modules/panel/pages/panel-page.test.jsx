import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

let panelResponse;
let casesResponse;
let tasksResponse;
let caseCatalogsResponse;

const navigateMock = vi.fn();
const refetchMock = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => {
    const key = Array.isArray(queryKey) ? queryKey.join('/') : String(queryKey);

    if (key === 'panel/general') {
      return { data: panelResponse, isLoading: false, isError: false, isFetching: false, refetch: refetchMock };
    }

    if (key === 'panel/cases') {
      return { data: casesResponse, isLoading: false, isError: false, isFetching: false, refetch: refetchMock };
    }

    if (key === 'panel/tasks') {
      return { data: tasksResponse, isLoading: false, isError: false, isFetching: false, refetch: refetchMock };
    }

    if (key === 'cases/catalogs') {
      return { data: caseCatalogsResponse, isLoading: false, isError: false, isFetching: false, refetch: refetchMock };
    }

    return { data: null, isLoading: false, isError: false, isFetching: false, refetch: refetchMock };
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const { PanelPage } = await import('@/modules/panel/pages/panel-page');

describe('PanelPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    refetchMock.mockReset();

    panelResponse = {
      generatedAt: '2026-07-26T12:30:00Z',
      priorityBuckets: [
        {
          code: 'URGENT',
          label: 'Urgentes',
          items: [
            {
              caseId: 1,
              folderCode: 'CAR-001',
              title: 'Ana Uno',
              caseTypeCode: 'PARTICULAR',
              visibleTramiteState: { code: 'EN_TRAMITE', label: 'En tramite' },
              visibleRepairState: { code: 'DAR_TURNO', label: 'Dar turno' },
              priorityReasons: ['Pago pendiente', 'Pendiente de dar turno'],
              createdAt: '2026-02-10T08:00:00Z',
              closedAt: null,
            },
            {
              caseId: 3,
              folderCode: 'CAR-003',
              title: 'Clara Tres',
              caseTypeCode: 'TODO_RIESGO',
              visibleTramiteState: { code: 'EN_TRAMITE', label: 'En tramite' },
              visibleRepairState: { code: 'EN_REPARACION', label: 'En reparacion' },
              priorityReasons: ['Pendiente de turno', 'Caso proximo a prescribir'],
              createdAt: '2026-02-15T08:00:00Z',
              closedAt: null,
            },
            {
              caseId: 4,
              folderCode: 'CAR-004',
              title: 'Dora Cuatro',
              caseTypeCode: 'RECUPERO_FRANQUICIA',
              visibleTramiteState: { code: 'EN_TRAMITE', label: 'En tramite' },
              visibleRepairState: { code: 'EN_REPARACION', label: 'En reparacion' },
              priorityReasons: ['Pago pendiente', 'Tareas pendientes vencidas'],
              createdAt: '2026-02-18T08:00:00Z',
              closedAt: null,
            },
        ],
        },
        {
          code: 'ATTENTION',
          label: 'Para atender',
          items: [
            {
              caseId: 6,
              folderCode: 'CAR-006',
              title: 'Eva Seis',
              caseTypeCode: 'PARTICULAR',
              visibleTramiteState: { code: 'EN_TRAMITE', label: 'En tramite' },
              visibleRepairState: { code: 'DAR_TURNO', label: 'Dar turno' },
              priorityReasons: ['Pendiente de turno'],
              createdAt: '2026-02-19T08:00:00Z',
              closedAt: null,
            },
          ],
        },
      ],
    };

    casesResponse = {
      items: [
        {
          id: 1,
          folderCode: 'CAR-001',
          principalCustomerName: 'Ana Uno',
          principalVehiclePlate: 'AA111AA',
          caseTypeCode: 'PARTICULAR',
          currentCaseStateCode: 'EN_TRAMITE',
          currentRepairStateCode: 'DAR_TURNO',
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
          currentCaseStateCode: 'PAGADO',
          currentRepairStateCode: 'REPARADO',
          currentPaymentStateCode: 'PAGADO',
          visibleTramiteState: { code: 'PAGADO', label: 'Pagado' },
          visibleRepairState: { code: 'REPARADO', label: 'Reparado' },
          createdAt: '2026-03-05T08:00:00Z',
          closedAt: '2026-03-20T10:00:00Z',
          branchId: 2,
          branchCode: 'C',
        },
        {
          id: 3,
          folderCode: 'CAR-003',
          principalCustomerName: 'Clara Tres',
          principalVehiclePlate: 'CC333CC',
          caseTypeCode: 'TODO_RIESGO',
          currentCaseStateCode: 'EN_TRAMITE',
          currentRepairStateCode: 'EN_REPARACION',
          currentPaymentStateCode: 'PENDIENTE',
          visibleTramiteState: { code: 'EN_TRAMITE', label: 'En tramite' },
          visibleRepairState: { code: 'EN_REPARACION', label: 'En reparacion' },
          createdAt: '2026-02-15T08:00:00Z',
          closedAt: null,
          branchId: 1,
          branchCode: 'Z',
        },
        {
          id: 4,
          folderCode: 'CAR-004',
          principalCustomerName: 'Dora Cuatro',
          principalVehiclePlate: 'DD444DD',
          caseTypeCode: 'RECUPERO_FRANQUICIA',
          currentCaseStateCode: 'EN_TRAMITE',
          currentRepairStateCode: 'EN_REPARACION',
          currentPaymentStateCode: 'PENDIENTE',
          visibleTramiteState: { code: 'EN_TRAMITE', label: 'En tramite' },
          visibleRepairState: { code: 'EN_REPARACION', label: 'En reparacion' },
          createdAt: '2026-02-18T08:00:00Z',
          closedAt: null,
          branchId: 1,
          branchCode: 'Z',
        },
        {
          id: 6,
          folderCode: 'CAR-006',
          principalCustomerName: 'Eva Seis',
          principalVehiclePlate: 'EE666EE',
          caseTypeCode: 'PARTICULAR',
          currentCaseStateCode: 'EN_TRAMITE',
          currentRepairStateCode: 'DAR_TURNO',
          currentPaymentStateCode: 'PENDIENTE',
          visibleTramiteState: { code: 'EN_TRAMITE', label: 'En tramite' },
          visibleRepairState: { code: 'DAR_TURNO', label: 'Dar turno' },
          createdAt: '2026-02-19T08:00:00Z',
          closedAt: null,
          branchId: 1,
          branchCode: 'Z',
        },
        {
          id: 7,
          folderCode: 'CAR-007',
          principalCustomerName: 'Gala Siete',
          principalVehiclePlate: 'GG777GG',
          caseTypeCode: 'TODO_RIESGO',
          currentCaseStateCode: 'EN_TRAMITE',
          currentRepairStateCode: 'REPARADO',
          currentPaymentStateCode: 'PAGADO',
          visibleTramiteState: { code: 'PAGADO', label: 'Pagado' },
          visibleRepairState: { code: 'REPARADO', label: 'Reparado' },
          createdAt: '2026-02-20T08:00:00Z',
          closedAt: null,
          branchId: 1,
          branchCode: 'Z',
        },
      ],
    };

    tasksResponse = {
      items: [
        { id: 91, caseId: 3, statusCode: 'PENDIENTE', dueDate: '2026-07-25T09:00:00Z' },
        { id: 92, caseId: 4, statusCode: 'RESUELTA', dueDate: '2026-07-25T09:00:00Z' },
      ],
    };

    caseCatalogsResponse = {
      caseTypes: [
        { code: 'PARTICULAR', name: 'Particular' },
        { code: 'TODO_RIESGO', name: 'Todo Riesgo' },
      ],
    };
  });

  it('muestra prioridades, combina filtros y mantiene la navegacion al detalle', async () => {
    const user = userEvent.setup();

    render(<PanelPage />);

    expect(screen.getByRole('heading', { level: 2, name: 'Resumen del dia' })).toBeInTheDocument();
    expect(screen.getByText('Revisa prioridades, tareas pendientes y carpetas abiertas desde un unico tablero.')).toBeInTheDocument();
    expect(screen.getByText('Última actualización: 26/07/2026, 09:30')).toBeInTheDocument();
    expect(screen.queryByText('El backend ya ordena el trabajo.')).not.toBeInTheDocument();
    expect(screen.queryByText(/Generado/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Prioridades activas')).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Casos abiertos/ })).toHaveTextContent('5');
    expect(screen.getByRole('button', { name: /Pagos pendientes/ })).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: /Pendientes de turno/ })).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: /Próximos a prescribir/ })).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: /Próximos a prescribir/ })).toHaveTextContent('Prescripción cercana');
    expect(screen.getByRole('button', { name: /Con tareas pendientes/ })).toHaveTextContent('0');

    expect(screen.getAllByText('Pago pendiente').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pendiente de dar turno').length).toBeGreaterThan(0);
    expect(screen.getByText('Urgentes: 3')).toBeInTheDocument();
    expect(screen.getByText('Para atender: 1')).toBeInTheDocument();
    expect(screen.getByText('4 casos prioritarios')).toBeInTheDocument();
    expect(screen.getAllByText('Urgente').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Para atender').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Recupero Franquicia').length).toBeGreaterThan(0);
    expect(screen.queryByText('Gala Siete')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Pendientes de turno/ }));
    expect(screen.getByRole('tab', { name: 'Prioridades' })).toHaveAttribute('aria-selected', 'true');

    await user.type(screen.getByLabelText('Buscar por cliente, patente o carpeta'), 'Ana');
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(screen.getAllByText('CAR-001').length).toBeGreaterThan(0);
    expect(screen.queryByText('CAR-003')).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Abrir carpeta CAR-001' })[0]);
    expect(navigateMock).toHaveBeenCalledWith('/cases/1');

    await user.click(screen.getByRole('tab', { name: 'Todos los abiertos' }));
    expect(screen.getAllByText('Ana Uno').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(screen.getAllByText('Gala Siete').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('tab', { name: 'Cerrados' }));
    expect(screen.getAllByText('CAR-002').length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: 'Ver todas las carpetas' })[0]);
    expect(navigateMock).toHaveBeenCalledWith('/cases');
  });

  it('muestra el estado vacio sin urgencias pendientes', () => {
    panelResponse = {
      generatedAt: '2026-07-26T12:30:00Z',
      priorityBuckets: [],
    };

    casesResponse = {
      items: [
        {
          id: 8,
          folderCode: 'CAR-008',
          principalCustomerName: 'Diego Ocho',
          principalVehiclePlate: 'DD888DD',
          caseTypeCode: 'PARTICULAR',
          currentCaseStateCode: 'EN_TRAMITE',
          currentRepairStateCode: 'EN_REPARACION',
          currentPaymentStateCode: 'PAGADO',
          visibleTramiteState: { code: 'EN_TRAMITE', label: 'En tramite' },
          visibleRepairState: { code: 'EN_REPARACION', label: 'En reparacion' },
          createdAt: '2026-04-10T08:00:00Z',
          closedAt: null,
        },
      ],
    };

    render(<PanelPage />);

    expect(screen.getByText('No hay urgencias pendientes')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Ver todas las carpetas' }).length).toBeGreaterThan(0);
  });

  it('deriva el color de prioridad del codigo resuelto y etiqueta las acciones de carpeta', () => {
    panelResponse.priorityBuckets[0].code = 'ATTENTION';

    render(<PanelPage />);

    expect(screen.getAllByText('Urgente')[0]).toHaveClass('text-destructive');
    expect(screen.getAllByText('Para atender')[0]).toHaveClass('text-secondary-foreground');
    expect(screen.getAllByRole('button', { name: 'Abrir carpeta CAR-001' }).length).toBeGreaterThan(0);
  });

  it('usa singular correcto al informar una tarea pendiente', () => {
    tasksResponse.items[1].statusCode = 'PENDIENTE';

    render(<PanelPage />);

    expect(screen.getAllByText('1 tarea pendiente').length).toBeGreaterThan(0);
  });

  it('muestra el estado vacio por filtros y permite limpiar', async () => {
    const user = userEvent.setup();

    render(<PanelPage />);

    await user.type(screen.getByLabelText('Buscar por cliente, patente o carpeta'), 'ZZZ');
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(screen.getByText('No encontramos carpetas con estos filtros.')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Limpiar' }).at(-1));

    expect(screen.getAllByText('Ana Uno').length).toBeGreaterThan(0);
  });

  it('usa el catalogo base de tipos, aplica Particular al primer intento y no duplica Estado de reparación', async () => {
    const user = userEvent.setup();

    render(<PanelPage />);

    await user.click(screen.getByRole('button', { name: 'Filtros avanzados' }));

    expect(screen.getAllByLabelText('Estado de reparación')).toHaveLength(1);

    const typeSelect = screen.getByLabelText('Tipo de trámite');
    const typeOptions = Array.from(typeSelect.querySelectorAll('option')).map((option) => option.textContent);

    expect(typeOptions).toEqual(['Todos', 'Particular', 'Recupero Franquicia', 'Todo Riesgo']);

    await user.selectOptions(typeSelect, 'PARTICULAR');
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(screen.getAllByText('CAR-001').length).toBeGreaterThan(0);
    expect(screen.getAllByText('CAR-006').length).toBeGreaterThan(0);
    expect(screen.queryByText('CAR-003')).not.toBeInTheDocument();
    expect(screen.queryByText('CAR-004')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filtros avanzados · 1' }));
    expect(screen.getByLabelText('Tipo de trámite')).toHaveValue('PARTICULAR');
    expect(Array.from(screen.getByLabelText('Tipo de trámite').querySelectorAll('option')).map((option) => option.textContent)).toEqual(['Todos', 'Particular', 'Recupero Franquicia', 'Todo Riesgo']);

    await user.selectOptions(screen.getByLabelText('Estado del trámite'), 'EN_TRAMITE');
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(screen.getByRole('button', { name: 'Filtros avanzados · 1' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Quitar filtro Trámite: Particular' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quitar filtro Estado del trámite: En tramite' })).toBeInTheDocument();
  });
});
