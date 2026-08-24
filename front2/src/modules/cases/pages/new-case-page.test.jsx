import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NewCasePage, hasReferenciadorName, requiresReferenciador } from './new-case-page';

const { createCase, createPerson, createReferenciador, createVehicle } = vi.hoisted(() => ({
  createCase: vi.fn(),
  createPerson: vi.fn(),
  createReferenciador: vi.fn(),
  createVehicle: vi.fn(),
}));

const session = { scopes: [{ organizationId: 1, branchId: 2, branchCode: 'Z', branchName: 'Centro' }] };

vi.mock('@/modules/auth/providers/session-provider', () => ({
  useSession: () => ({ session }),
}));

vi.mock('@/modules/cases/api/new-case-api', () => ({
  createCase,
  createPerson,
  createVehicle,
  getCaseCatalogs: vi.fn().mockResolvedValue({ caseTypes: [{ id: 1, name: 'Particular' }] }),
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
  createReferenciador,
  searchReferenciadores: vi.fn().mockResolvedValue([]),
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
    createReferenciador.mockReset();
    createPerson.mockReset();
    createVehicle.mockReset();
    createCase.mockReset();
    createReferenciador.mockResolvedValue({ id: 91, nombre: 'Ana', apellido: 'Nueva' });
    createPerson.mockResolvedValue({ id: 31 });
    createVehicle.mockResolvedValue({ id: 41 });
    createCase.mockResolvedValue({ id: 51, folderCode: 'Z-001', caseTypeCode: 'PARTICULAR' });
  });

  afterEach(() => queryClient?.clear());

  it('requires a canonical referenciador only for referred cases', () => {
    expect(requiresReferenciador('SI', null)).toBe(true);
    expect(requiresReferenciador('SI', 77)).toBe(false);
    expect(requiresReferenciador('NO', null)).toBe(false);
  });

  it('accepts a full name so a new referenciador can be created on submission', () => {
    expect(hasReferenciadorName('Ana Referidora')).toBe(true);
    expect(hasReferenciadorName('Ana')).toBe(false);
    expect(hasReferenciadorName('   ')).toBe(false);
  });

  it('creates an unmatched referenciador, retains its id, and sends it when creating the folder', async () => {
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

    expect(createReferenciador).toHaveBeenCalledWith({ nombre: 'Ana', apellido: 'Nueva', telefono: '' });
    expect(createCase).toHaveBeenCalledWith(expect.objectContaining({ referenced: true, referenciadorId: 91 }));
    expect(await screen.findByText('#91')).toBeInTheDocument();
  });

  it('keeps focus on the referenciador input when its automatic creation fails', async () => {
    createReferenciador.mockRejectedValue(new Error('No pude crear el referenciador.'));
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(within(screen.getByText('Referenciado').parentElement).getByRole('combobox'), 'SI');
    const referenciadorInput = screen.getByPlaceholderText('Buscar por nombre...');
    await user.type(referenciadorInput, 'Ana Nueva');
    await user.type(within(screen.getByText('Nombre').parentElement).getByRole('textbox'), 'Cliente');
    await user.type(within(screen.getByText('Apellido').parentElement).getByRole('textbox'), 'Prueba');
    await user.type(within(screen.getByText('Marca').parentElement).getByRole('combobox'), 'Ford');
    await user.type(within(screen.getByText('Modelo').parentElement).getByRole('combobox'), 'Fiesta');
    await user.type(within(screen.getByText('Dominio').parentElement).getByRole('textbox'), 'AA123BB');

    await user.click(screen.getByRole('button', { name: /crear carpeta particular/i }));

    expect(await screen.findByText('No pude crear el referenciador.')).toBeInTheDocument();
    expect(referenciadorInput).toHaveFocus();
    expect(createCase).not.toHaveBeenCalled();
  });
});
