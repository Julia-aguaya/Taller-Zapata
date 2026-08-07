import { createContext, useContext, useMemo, useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/app/theme/theme-provider';

const sessionResponse = {
  unreadNotifications: 2,
  user: {
    displayName: 'Admin Taller',
    role: 'ADMIN',
  },
  navigation: {
    defaultRoute: '/panel',
    items: [
      { code: 'PANEL', label: 'Panel general', path: '/panel', enabled: true },
      { code: 'CASES', label: 'Carpetas', path: '/cases', enabled: true },
      { code: 'NEW_CASE', label: 'Nuevo caso', path: '/cases/new', enabled: true },
      { code: 'AGENDA', label: 'Agenda y tareas', path: '/agenda', enabled: true },
      { code: 'MANAGEMENT', label: 'Gestión', path: '/management', enabled: true },
    ],
  },
  scopes: [],
};

let panelResponse = {
  generatedAt: '2026-07-26T12:30:00Z',
  summary: {
    openCases: 2,
    pendingPayments: 1,
    casesWithoutAppointment: 1,
    casesNearPrescription: 1,
    pendingTasks: 1,
  },
  priorityBuckets: [
    {
      code: 'URGENT',
      label: 'Urgentes',
      items: [
        {
          caseId: 1,
          folderCode: 'CAR-001',
          title: 'Ana Uno · AA111AA',
          caseTypeCode: 'PARTICULAR',
          visibleTramiteState: { code: 'EN_TRAMITE', label: 'En tramite' },
          visibleRepairState: { code: 'DAR_TURNO', label: 'Dar turno' },
          priorityReasons: ['Pago pendiente'],
          closedAt: null,
          createdAt: '2026-02-10T08:00:00Z',
        },
      ],
    },
  ],
};

let casesResponse = {
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
  ],
  totalElements: 2,
};

const SessionContext = createContext(null);

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => {
    const key = Array.isArray(queryKey) ? queryKey.join('/') : String(queryKey);

    if (key === 'panel/general') {
      return { data: panelResponse, isLoading: false, isError: false, isFetching: false, refetch: vi.fn() };
    }

    if (key === 'panel/cases') {
      return { data: casesResponse, isLoading: false, isError: false, isFetching: false, refetch: vi.fn() };
    }

    if (key === 'panel/tasks') {
      return { data: { items: [] }, isLoading: false, isError: false, isFetching: false, refetch: vi.fn() };
    }

    if (key === 'cases/catalogs') {
      return { data: { caseTypes: [{ code: 'PARTICULAR', name: 'Particular' }, { code: 'TODO_RIESGO', name: 'Todo Riesgo' }] }, isLoading: false, isError: false, isFetching: false, refetch: vi.fn() };
    }

    return { data: null, isLoading: false, isError: false, isFetching: false, refetch: vi.fn() };
  },
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
    removeQueries: vi.fn(),
  }),
  useMutation: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/modules/auth/providers/session-provider', () => ({
  SessionProvider: ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const value = useMemo(() => ({
      session: isAuthenticated ? sessionResponse : null,
      isAuthenticated,
      isLoading: false,
      hasStoredTokens: false,
      authError: false,
      login: async () => {
        setIsAuthenticated(true);
      },
      logout: async () => {
        setIsAuthenticated(false);
      },
      refreshSession: async () => undefined,
    }), [isAuthenticated]);

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
  },
  useSession: () => {
    const context = useContext(SessionContext);
    if (!context) {
      throw new Error('useSession debe usarse dentro de SessionProvider');
    }

    return context;
  },
}));

const { AppRouter } = await import('@/app/router');
const { SessionProvider } = await import('@/modules/auth/providers/session-provider');

describe('AppRouter integration', () => {
  it('muestra el panel general como inicio con el menu principal acotado tras login', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/login']}>
        <SessionProvider>
          <ThemeProvider>
            <AppRouter />
          </ThemeProvider>
        </SessionProvider>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Correo electrónico'), 'admin@tallerzapata.local');
    await user.type(screen.getByLabelText('Contraseña'), 'password');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: 'Menu principal' })).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { name: 'Panel general' }).length).toBeGreaterThan(0);
    });

    const mainMenu = screen.getByRole('navigation', { name: 'Menu principal' });
    expect(within(mainMenu).getByRole('button', { name: 'Panel general' })).toBeInTheDocument();
    expect(within(mainMenu).getByRole('button', { name: 'Nuevo caso' })).toBeInTheDocument();
    expect(within(mainMenu).getByRole('button', { name: 'Carpetas' })).toBeInTheDocument();
    expect(within(mainMenu).getByRole('button', { name: 'Agenda' })).toBeInTheDocument();
    expect(within(mainMenu).getByRole('button', { name: 'Gestión' })).toBeInTheDocument();
    expect(within(mainMenu).queryByText('2')).not.toBeInTheDocument();

    expect(screen.getByLabelText('Buscar por cliente, patente o carpeta')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Prioridades' })).toBeInTheDocument();
    expect(screen.queryByText('El backend ya ordena el trabajo.')).not.toBeInTheDocument();
    expect(screen.queryByText(/Generado/i)).not.toBeInTheDocument();
  });

  it('usa Gestión como toggle y muestra sólo los accesos secundarios vigentes', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/login']}>
        <SessionProvider>
          <ThemeProvider>
            <AppRouter />
          </ThemeProvider>
        </SessionProvider>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Correo electrónico'), 'admin@tallerzapata.local');
    await user.type(screen.getByLabelText('Contraseña'), 'password');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await user.click(screen.getByRole('button', { name: 'Gestión' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Subsecciones de gestión')).toBeInTheDocument();
    });

    expect(screen.queryByText('Gestión del taller')).not.toBeInTheDocument();

    const managementLinks = screen.getByLabelText('Subsecciones de gestión');
    expect(within(managementLinks).getByRole('button', { name: 'Clientes' })).toBeInTheDocument();
    expect(within(managementLinks).getByRole('button', { name: 'Vehículos' })).toBeInTheDocument();
    expect(within(managementLinks).getByRole('button', { name: 'Referenciadores' })).toBeInTheDocument();
    expect(within(managementLinks).getByRole('button', { name: 'Compañías de seguros' })).toBeInTheDocument();
    expect(within(managementLinks).getByRole('button', { name: 'Proveedores' })).toBeDisabled();
    expect(within(managementLinks).getByRole('button', { name: 'Taller y sucursales' })).toBeInTheDocument();
    expect(within(managementLinks).queryByRole('button', { name: 'Carpetas' })).not.toBeInTheDocument();
    expect(within(managementLinks).queryByRole('button', { name: 'Agenda' })).not.toBeInTheDocument();

    await user.click(within(managementLinks).getByRole('button', { name: 'Taller y sucursales' }));
    expect(screen.getByRole('button', { name: 'Gestión' })).not.toHaveAttribute('aria-current');
    expect(within(managementLinks).getByRole('button', { name: 'Taller y sucursales' })).toHaveAttribute('aria-current', 'page');
    await waitFor(() => expect(screen.getAllByRole('heading', { name: 'Taller y sucursales' }).length).toBeGreaterThan(0));
  });
});
