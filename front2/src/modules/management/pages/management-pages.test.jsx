import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockSearchPersons = vi.fn();
const mockGetPersonVehicles = vi.fn();
const mockSearchVehicles = vi.fn();
const mockGetVehicleCatalogs = vi.fn();
const mockGetVehiclePersons = vi.fn();
const mockCatalogList = vi.fn();
const mockCatalogGet = vi.fn();
const mockCatalogCreate = vi.fn();
const mockCatalogUpdate = vi.fn();
const mockCatalogDeactivate = vi.fn();
const mockRequestJson = vi.fn();
const mockToastError = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: (...args) => mockToastError(...args),
  },
}));

vi.mock('@/modules/cases/api/new-case-api', () => ({
  searchPersons: (...args) => mockSearchPersons(...args),
  getPersonVehicles: (...args) => mockGetPersonVehicles(...args),
  searchVehicles: (...args) => mockSearchVehicles(...args),
  getVehicleCatalogs: (...args) => mockGetVehicleCatalogs(...args),
  getVehiclePersons: (...args) => mockGetVehiclePersons(...args),
}));

vi.mock('@/modules/management/api/catalogs-api', () => ({
  referrersApi: { list: (...args) => mockCatalogList(...args), get: (...args) => mockCatalogGet(...args), create: (...args) => mockCatalogCreate(...args), update: (...args) => mockCatalogUpdate(...args), deactivate: (...args) => mockCatalogDeactivate(...args) },
  providersApi: { list: (...args) => mockCatalogList(...args), get: (...args) => mockCatalogGet(...args), create: (...args) => mockCatalogCreate(...args), update: (...args) => mockCatalogUpdate(...args), deactivate: (...args) => mockCatalogDeactivate(...args) },
  insuranceCompaniesApi: { list: (...args) => mockCatalogList(...args), get: (...args) => mockCatalogGet(...args), create: (...args) => mockCatalogCreate(...args), update: (...args) => mockCatalogUpdate(...args), deactivate: (...args) => mockCatalogDeactivate(...args) },
  listInsuranceCompanyContacts: vi.fn(() => Promise.resolve([])),
  createInsuranceCompanyContact: vi.fn(),
  deleteInsuranceCompanyContact: vi.fn(),
}));

vi.mock('@/shared/api/http-client', () => ({
  requestJson: (...args) => mockRequestJson(...args),
}));

vi.mock('@/modules/auth/providers/session-provider', () => ({
  useSession: () => ({
    session: {
      scopes: [{ organizationId: 1, branchId: 10, branchCode: 'Z', branchName: 'Casa central' }],
    },
  }),
}));

const { ManagementClientsPage } = await import('./management-clients-page');
const { ManagementVehiclesPage } = await import('./management-vehicles-page');
const { ManagementReferrersPage } = await import('./management-referrers-page');
const { ManagementInsurancePage } = await import('./management-insurance-page');
const { ManagementProvidersPage } = await import('./management-providers-page');
const { ManagementPage } = await import('./management-page');

function renderWithQuery(ui) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  mockSearchPersons.mockReset();
  mockGetPersonVehicles.mockReset();
  mockSearchVehicles.mockReset();
  mockGetVehicleCatalogs.mockReset();
  mockGetVehiclePersons.mockReset();
  mockCatalogList.mockReset();
  mockCatalogGet.mockReset();
  mockCatalogCreate.mockReset();
  mockCatalogUpdate.mockReset();
  mockCatalogDeactivate.mockReset();
  mockRequestJson.mockReset();
  mockToastError.mockReset();
});

afterEach(() => {
  window.localStorage.clear();
});

describe('management pages', () => {
  it('clientes usa datos reales, oculta ids técnicos y advierte edición global', async () => {
    const user = userEvent.setup();

    mockSearchPersons.mockResolvedValue([
      {
        id: 77,
        nombreMostrar: 'Perez, Juan',
        nombre: 'Juan',
        apellido: 'Perez',
        tipoDocumentoCodigo: 'DNI',
        numeroDocumento: '30111222',
        telefonoPrincipal: '3415551111',
        activo: true,
      },
    ]);
    mockRequestJson.mockImplementation((path) => {
      if (path === '/persons/77') {
        return Promise.resolve({
          id: 77,
          publicId: 'PER-001',
          tipoPersona: 'fisica',
          nombreMostrar: 'Perez, Juan',
          nombre: 'Juan',
          apellido: 'Perez',
          tipoDocumentoCodigo: 'DNI',
          numeroDocumento: '30111222',
          telefonoPrincipal: '3415551111',
          emailPrincipal: 'juan@test.com',
          estadoCivilCodigo: 'NO_INFORMA',
          activo: true,
        });
      }
      throw new Error(`unexpected path ${path}`);
    });
    mockGetPersonVehicles.mockResolvedValue([{ id: 5, brandText: 'Ford', modelText: 'Focus', plate: 'AA111AA', year: 2020 }]);

    renderWithQuery(<ManagementClientsPage />);

    await user.type(screen.getByPlaceholderText('Buscar por nombre, apellido o documento'), 'Juan');

    expect(await screen.findByText('Perez, Juan')).toBeInTheDocument();
    await waitFor(() => expect(mockSearchPersons).toHaveBeenLastCalledWith({ q: 'Juan' }));
    expect(mockSearchPersons.mock.calls.every(([params]) => Object.keys(params).length === 1 && 'q' in params)).toBe(true);
    expect(screen.queryByText('PER-001')).not.toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: /Perez, Juan/i }));

    expect(await screen.findByText(/este cambio modifica el registro global del cliente/i)).toBeInTheDocument();
    expect(screen.getByText('Ford Focus')).toBeInTheDocument();
    expect(screen.queryByText('PER-001')).not.toBeInTheDocument();
  });

  it('vehículos usa datos reales, oculta ids técnicos y muestra relaciones reales', async () => {
    const user = userEvent.setup();

    mockSearchVehicles.mockResolvedValue([
      {
        id: 22,
        brandText: 'Toyota',
        modelText: 'Corolla',
        plate: 'AB123CD',
        year: 2022,
        vehicleTypeCode: 'SEDAN',
        activo: true,
      },
    ]);
    mockGetVehicleCatalogs.mockResolvedValue({
      vehicleTypeCodes: [{ code: 'SEDAN' }],
      usageCodes: [{ code: 'PARTICULAR' }],
      transmissionCodes: [{ code: 'MANUAL' }],
    });
    mockGetVehiclePersons.mockResolvedValue([{ id: 5, rolVehiculoCodigo: 'TITULAR', esActual: true }]);
    mockRequestJson.mockImplementation((path) => {
      if (path === '/vehicles/22') {
        return Promise.resolve({
          id: 22,
          publicId: 'VEH-001',
          brandId: null,
          modelId: null,
          brandText: 'Toyota',
          modelText: 'Corolla',
          plate: 'AB123CD',
          year: 2022,
          vehicleTypeCode: 'SEDAN',
          usageCode: 'PARTICULAR',
          transmissionCode: 'MANUAL',
          activo: true,
        });
      }
      throw new Error(`unexpected path ${path}`);
    });

    renderWithQuery(<ManagementVehiclesPage />);

    await user.type(screen.getByPlaceholderText('Buscar por patente, marca o modelo'), 'AB123CD');
    expect(await screen.findByText('Toyota Corolla')).toBeInTheDocument();
    await waitFor(() => expect(mockSearchVehicles).toHaveBeenLastCalledWith({ q: 'AB123CD' }));
    expect(mockSearchVehicles.mock.calls.every(([params]) => Object.keys(params).length === 1 && 'q' in params)).toBe(true);
    expect(screen.queryByText('VEH-001')).not.toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: /Toyota Corolla/i }));

    expect(await screen.findByText('Personas vinculadas')).toBeInTheDocument();
    expect(screen.getByText('TITULAR')).toBeInTheDocument();
    expect(screen.queryByText('VEH-001')).not.toBeInTheDocument();
  });

  it('referenciadores busca, edita y desactiva usando el shell compartido', async () => {
    const user = userEvent.setup();
    mockCatalogList.mockResolvedValue([{ id: 1, nombre: 'Ana', apellido: 'Ruiz', displayName: 'Ana Ruiz', activo: true }]);
    mockCatalogGet.mockResolvedValue({ id: 1, nombre: 'Ana', apellido: 'Ruiz', telefono: '341', activo: true });
    mockCatalogUpdate.mockResolvedValue({ id: 1, nombre: 'Ana', apellido: 'Rios', displayName: 'Ana Rios', activo: true });
    mockCatalogDeactivate.mockResolvedValue({ id: 1, activo: false });
    renderWithQuery(<ManagementReferrersPage />);
    expect(await screen.findByRole('button', { name: /Ana Ruiz/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Ana Ruiz/i }));
    expect(await screen.findByRole('heading', { name: 'Ana Ruiz' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    await user.clear(screen.getByLabelText('Apellido'));
    await user.type(screen.getByLabelText('Apellido'), 'Rios');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(mockCatalogUpdate).toHaveBeenCalledWith(1, expect.objectContaining({ apellido: 'Rios' })));
    await user.click(screen.getByRole('button', { name: 'Desactivar' }));
    await user.click(screen.getAllByRole('button', { name: 'Desactivar' })[1]);
    await waitFor(() => expect(mockCatalogDeactivate).toHaveBeenCalledWith(1));
  });

  it('taller y sucursales entra en edición solo al presionar editar', async () => {
    const user = userEvent.setup();

    mockRequestJson.mockImplementation((path) => {
      if (path === '/organizations') {
        return Promise.resolve([{ id: 1, name: 'Taller Zapata', razonSocial: 'Taller Zapata SA', cuit: '30-12345678-9', condicionIva: 'RI', phone: '3415550000', email: 'admin@taller.com', logoDocumentId: null }]);
      }
      if (path === '/branches?organizationId=1') {
        return Promise.resolve([{ id: 10, code: 'Z', name: 'Casa central', addressLine1: 'San Martín 100', city: 'Rosario', province: 'Santa Fe', phone: '3415551111', email: 'central@taller.com' }]);
      }
      throw new Error(`unexpected path ${path}`);
    });

    renderWithQuery(<ManagementPage />);

    expect((await screen.findAllByRole('heading', { name: 'Taller Zapata' })).length).toBeGreaterThan(0);
    expect(screen.queryByDisplayValue('Taller Zapata SA')).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /^Editar$/i })[0]);
    expect(await screen.findByDisplayValue('Taller Zapata SA')).toBeInTheDocument();
  });

  it('seguros y proveedores exponen sus catálogos operativos', async () => {
    mockCatalogList.mockResolvedValue([{ id: 3, code: 'SURA', name: 'Sura', active: true }]);
    renderWithQuery(<ManagementInsurancePage />);
    expect(await screen.findByRole('button', { name: /Sura/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nuevo/i })).toBeInTheDocument();
    renderWithQuery(<ManagementProvidersPage />);
    expect(await screen.findByText('Proveedores')).toBeInTheDocument();
  });

  it('crea aseguradoras únicamente con nombre y conserva los campos de edición', async () => {
    const user = userEvent.setup();
    mockCatalogList.mockResolvedValue([]);
    mockCatalogCreate.mockResolvedValue({ id: 4, code: 'AUTO-4', name: 'Seguros Delta', active: true });

    renderWithQuery(<ManagementInsurancePage />);

    await user.click(await screen.findByRole('button', { name: /nuevo/i }));
    expect(screen.getByLabelText('Nombre *')).toBeInTheDocument();
    expect(screen.queryByLabelText('Código *')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Nombre *'), 'Seguros Delta');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(mockCatalogCreate).toHaveBeenCalledWith({ name: 'Seguros Delta' }));
  });

  it('muestra el detalle de validación del nombre al crear una aseguradora', async () => {
    const user = userEvent.setup();
    mockCatalogList.mockResolvedValue([]);
    mockCatalogCreate.mockRejectedValue(Object.assign(new Error('Validation error'), {
      httpStatus: 400,
      payload: { details: ['name: must not be blank'] },
    }));

    renderWithQuery(<ManagementInsurancePage />);

    await user.click(await screen.findByRole('button', { name: /nuevo/i }));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('El nombre es obligatorio'));
  });

  it('advierte al salir con cambios sin guardar y conserva un layout responsive', async () => {
    const user = userEvent.setup();
    mockCatalogList.mockResolvedValue([{ id: 1, nombre: 'Ana', apellido: 'Ruiz', displayName: 'Ana Ruiz', activo: true }]);
    mockCatalogGet.mockResolvedValue({ id: 1, nombre: 'Ana', apellido: 'Ruiz', telefono: '341', activo: true });
    renderWithQuery(<ManagementReferrersPage />);

    await user.click(await screen.findByRole('button', { name: /Ana Ruiz/i }));
    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    await user.clear(screen.getByLabelText('Apellido'));
    await user.type(screen.getByLabelText('Apellido'), 'Rios');

    const unload = new Event('beforeunload', { cancelable: true });
    fireEvent(window, unload);

    expect(unload.defaultPrevented).toBe(true);
    expect(document.querySelector('[class*="xl:grid-cols"]')).toBeInTheDocument();
  });
});
