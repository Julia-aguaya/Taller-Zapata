import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NewCasePage, hasReferenciadorName, requiresReferenciador } from './new-case-page';

const { createCase, createCaseWithReferenciador, createPerson, createVehicle, searchReferenciadores } = vi.hoisted(() => ({
  createCase: vi.fn(),
  createCaseWithReferenciador: vi.fn(),
  createPerson: vi.fn(),
  createVehicle: vi.fn(),
  searchReferenciadores: vi.fn(),
}));

const session = { scopes: [{ organizationId: 1, branchId: 2, branchCode: 'Z', branchName: 'Centro' }] };

vi.mock('@/modules/auth/providers/session-provider', () => ({
  useSession: () => ({ session }),
}));

vi.mock('@/modules/cases/api/new-case-api', () => ({
  createCase,
  createCaseWithReferenciador,
  createPerson,
  createVehicle,
  getCaseCatalogs: vi.fn().mockResolvedValue({ caseTypes: [{ id: 1, name: 'Particular', code: 'PARTICULAR' }, { id: 2, name: 'Todo riesgo', code: 'TODO_RIESGO' }, { id: 3, name: 'Granizo', code: 'GRANIZO' }] }),
  getPersonVehicles: vi.fn().mockResolvedValue([]),
  getVehicleCatalogs: vi.fn().mockResolvedValue({ vehicleTypeCodes: [{ code: 'SEDAN', name: 'Sedán' }], usageCodes: [{ code: 'PARTICULAR', name: 'Particular' }], transmissionCodes: [{ code: 'MANUAL', name: 'Manual' }] }),
  listBranches: vi.fn().mockResolvedValue([]),
  listOrganizations: vi.fn().mockResolvedValue([]),
  listVehicleBrands: vi.fn().mockResolvedValue([]),
  listVehicleModels: vi.fn().mockResolvedValue([]),
  searchPersons: vi.fn().mockResolvedValue([]),
  searchVehicles: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/modules/cases/api/cases-api', () => ({
  searchReferenciadores,
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

let queryClient;

const renderPage = () => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
  <QueryClientProvider client={queryClient}>
    <NewCasePage />
  </QueryClientProvider>,
  );
};

describe('NewCasePage canonical referenciador validation', () => {
  beforeEach(() => {
    createPerson.mockReset();
    createVehicle.mockReset();
    createCase.mockReset();
    createCaseWithReferenciador.mockReset();
    searchReferenciadores.mockReset();
    createPerson.mockResolvedValue({ id: 31 });
    createVehicle.mockResolvedValue({ id: 41 });
    createCase.mockResolvedValue({ id: 51, folderCode: 'Z-001', caseTypeCode: 'PARTICULAR' });
    createCaseWithReferenciador.mockResolvedValue({ id: 52, folderCode: 'Z-002', caseTypeCode: 'TODO_RIESGO', referenciadorId: 91 });
    searchReferenciadores.mockResolvedValue([]);
  });

  afterEach(() => queryClient?.clear());

  it('requires a canonical referenciador only for referred cases', () => {
    expect(requiresReferenciador('SI', null)).toBe(true);
    expect(requiresReferenciador('SI', 77)).toBe(false);
    expect(requiresReferenciador('NO', null)).toBe(false);
  });

  it('accepts a name so a new referenciador can be created on submission', () => {
    expect(hasReferenciadorName('Ana Referidora')).toBe(true);
    expect(hasReferenciadorName('Ana')).toBe(true);
    expect(hasReferenciadorName('   ')).toBe(false);
  });

  it('creates an unmatched referenciador atomically with the folder', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(within(screen.getByText('Referenciado').parentElement).getByRole('combobox'), 'SI');
    await user.type(screen.getByPlaceholderText('Buscar por nombre...'), 'Ana Nueva');
    await user.type(within(screen.getByText('Nombre').parentElement).getByRole('textbox'), 'Cliente');
    await user.type(within(screen.getByText('Apellido').parentElement).getByRole('textbox'), 'Prueba');
    await user.type(within(screen.getByText('Marca').parentElement).getByRole('combobox'), 'Ford');
    await user.type(within(screen.getByText('Modelo').parentElement).getByRole('combobox'), 'Fiesta');
    await user.type(within(screen.getByText('Dominio').parentElement).getByRole('textbox'), 'AA123BB');

    await user.click(screen.getByRole('button', { name: /crear carpeta particular/i }));

    expect(createCaseWithReferenciador).toHaveBeenCalledWith(expect.objectContaining({
      caseRequest: expect.objectContaining({ referenced: true, referenciadorId: null }),
      referenciador: { nombre: 'Ana', apellido: 'Nueva', telefono: '' },
    }));
    expect(createCase).not.toHaveBeenCalled();
  });

  it('uses an existing referenciador directly and preserves its association', async () => {
    searchReferenciadores.mockResolvedValue([{ id: 91, displayName: 'Ana Nueva', telefono: '341' }]);
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(within(screen.getByText('Referenciado').parentElement).getByRole('combobox'), 'SI');
    const referenciadorInput = screen.getByPlaceholderText('Buscar por nombre...');
    await user.type(referenciadorInput, 'Ana Nueva');
    await user.click(await screen.findByRole('button', { name: /ana nueva/i }));
    await user.type(within(screen.getByText('Nombre').parentElement).getByRole('textbox'), 'Cliente');
    await user.type(within(screen.getByText('Apellido').parentElement).getByRole('textbox'), 'Prueba');
    await user.type(within(screen.getByText('Marca').parentElement).getByRole('combobox'), 'Ford');
    await user.type(within(screen.getByText('Modelo').parentElement).getByRole('combobox'), 'Fiesta');
    await user.type(within(screen.getByText('Dominio').parentElement).getByRole('textbox'), 'AA123BB');

    await user.click(screen.getByRole('button', { name: /crear carpeta particular/i }));

    expect(createCase).toHaveBeenCalledWith(expect.objectContaining({ referenced: true, referenciadorId: 91 }));
    expect(createCaseWithReferenciador).not.toHaveBeenCalled();
  });

  it('creates a GRANIZO folder without incident data', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole('option', { name: 'Granizo' });
    await user.selectOptions(within(screen.getByText('Tipo de trámite').parentElement).getByRole('combobox'), '3');
    expect(screen.queryByText('Cía. aseguradora')).not.toBeInTheDocument();
    expect(screen.queryByText('Tramitador/a')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Fecha del hecho')).not.toBeInTheDocument();
    await user.type(within(screen.getByText('Nombre').parentElement).getByRole('textbox'), 'Cliente');
    await user.type(within(screen.getByText('Apellido').parentElement).getByRole('textbox'), 'Prueba');
    await user.type(within(screen.getByText('Marca').parentElement).getByRole('combobox'), 'Ford');
    await user.type(within(screen.getByText('Modelo').parentElement).getByRole('combobox'), 'Fiesta');
    await user.type(within(screen.getByText('Dominio').parentElement).getByRole('textbox'), 'AA123BB');

    await user.click(screen.getByRole('button', { name: /crear carpeta granizo/i }));

    expect(createCase).toHaveBeenCalledWith(expect.objectContaining({ referenced: false, prescriptionDate: null }));
    expect(createCase.mock.calls[0][0]).not.toHaveProperty('incidentDate');
    expect(createCaseWithReferenciador).not.toHaveBeenCalled();
  });
});
