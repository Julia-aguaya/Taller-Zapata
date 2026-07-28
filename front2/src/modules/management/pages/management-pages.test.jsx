import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockSearchPersons = vi.fn();
const mockGetPersonVehicles = vi.fn();
const mockSearchVehicles = vi.fn();
const mockGetVehicleCatalogs = vi.fn();
const mockGetInsuranceCatalogs = vi.fn();
const mockRequestJson = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/modules/cases/api/new-case-api', () => ({
  searchPersons: (...args) => mockSearchPersons(...args),
  getPersonVehicles: (...args) => mockGetPersonVehicles(...args),
  searchVehicles: (...args) => mockSearchVehicles(...args),
  getVehicleCatalogs: (...args) => mockGetVehicleCatalogs(...args),
  getInsuranceCatalogs: (...args) => mockGetInsuranceCatalogs(...args),
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
  mockGetInsuranceCatalogs.mockReset();
  mockRequestJson.mockReset();
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
    expect(screen.queryByText('PER-001')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Perez, Juan/i }));

    expect(await screen.findByText(/este cambio modifica el registro global del cliente/i)).toBeInTheDocument();
    expect(screen.getByText('Ford Focus')).toBeInTheDocument();
    expect(screen.queryByText('PER-001')).not.toBeInTheDocument();
  });

  it('vehículos usa datos reales, oculta ids técnicos y no inventa cliente asociado', async () => {
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
    expect(screen.queryByText('VEH-001')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Toyota Corolla/i }));

    expect(await screen.findByText(/no expone relación global vehículo-cliente/i)).toBeInTheDocument();
    expect(screen.queryByText('VEH-001')).not.toBeInTheDocument();
  });

  it('referenciadores sin backend no presenta formularios falsos', () => {
    renderWithQuery(<ManagementReferrersPage />);

    expect(screen.getByText(/sin CRUD real confirmado/i)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /guardar/i })).not.toBeInTheDocument();
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

    expect(await screen.findByText('Taller Zapata')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Taller Zapata SA')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Editar$/i }));
    expect(await screen.findByDisplayValue('Taller Zapata SA')).toBeInTheDocument();
  });

  it('seguros muestra solo lectura parcial sin CRUD falso', async () => {
    mockGetInsuranceCatalogs.mockResolvedValue({
      opinionCodes: [{ code: 'APROBADO', name: 'Aprobado' }],
      paymentStatusCodes: [{ code: 'PAGADO', name: 'Pagado' }],
    });

    renderWithQuery(<ManagementInsurancePage />);

    expect(await screen.findByText('Aprobado')).toBeInTheDocument();
    expect(screen.getByText(/CRUD de compañías pendiente/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /guardar/i })).not.toBeInTheDocument();
  });
});
