import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NewCasePage, hasReferenciadorName, requiresReferenciador } from './new-case-page';

const { createCase, createCaseWithReferenciador, createPerson, createVehicle, createVehicleBrand, createVehicleTypeCategory, listBranches, searchReferenciadores } = vi.hoisted(() => ({
  createCase: vi.fn(),
  createCaseWithReferenciador: vi.fn(),
  createPerson: vi.fn(),
  createVehicle: vi.fn(),
  createVehicleBrand: vi.fn(),
  createVehicleTypeCategory: vi.fn(),
  listBranches: vi.fn(),
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
  createVehicleBrand,
  createVehicleTypeCategory,
  getCaseCatalogs: vi.fn().mockResolvedValue({ caseTypes: [{ id: 1, name: 'Particular', code: 'PARTICULAR' }, { id: 2, name: 'Todo riesgo', code: 'TODO_RIESGO' }, { id: 3, name: 'Granizo', code: 'GRANIZO' }] }),
  getPersonVehicles: vi.fn().mockResolvedValue([]),
  getVehicleCatalogs: vi.fn().mockResolvedValue({ vehicleTypeCodes: [{ code: 'SEDAN', name: 'Sedán' }, { code: 'OTRO', name: 'Otro' }], usageCodes: [{ code: 'PARTICULAR', name: 'Particular' }], transmissionCodes: [{ code: 'MANUAL', name: 'Manual' }] }),
  listBranches,
  listOrganizations: vi.fn().mockResolvedValue([]),
  listVehicleBrands: vi.fn().mockResolvedValue([{ id: 1, codigo: 'FORD', nombre: 'Ford', activo: true }]),
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

const getVehicleTypeSelect = async () => {
  const field = within(screen.getByText('Tipo de vehiculo').parentElement);
  await field.findByRole('option', { name: 'Otro' });
  return field.getByRole('combobox');
};

const getVehicleBrandSelect = async () => {
  const field = within(screen.getByText('Marca').parentElement);
  await field.findByRole('option', { name: 'Agregar marca' });
  return field.getByRole('combobox');
};

describe('NewCasePage canonical referenciador validation', () => {
  beforeEach(() => {
    session.scopes = [{ organizationId: 1, branchId: 2, branchCode: 'Z', branchName: 'Centro' }];
    createPerson.mockReset();
    createVehicle.mockReset();
    createVehicleBrand.mockReset();
    createVehicleTypeCategory.mockReset();
    createCase.mockReset();
    createCaseWithReferenciador.mockReset();
    searchReferenciadores.mockReset();
    listBranches.mockReset();
    createPerson.mockResolvedValue({ id: 31 });
    createVehicle.mockResolvedValue({ id: 41 });
    createVehicleBrand.mockResolvedValue({ id: 77, codigo: 'CUSTOM_ALFA_ROMEO', nombre: 'Alfa Romeo', activo: true });
    createVehicleTypeCategory.mockResolvedValue({ code: 'CUSTOM_CASA_RODANTE', name: 'Casa rodante' });
    createCase.mockResolvedValue({ id: 51, folderCode: 'Z-001', caseTypeCode: 'PARTICULAR' });
    createCaseWithReferenciador.mockResolvedValue({ id: 52, folderCode: 'Z-002', caseTypeCode: 'TODO_RIESGO', referenciadorId: 91 });
    searchReferenciadores.mockResolvedValue([]);
    listBranches.mockResolvedValue([]);
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

  it('renders Sucursal options for a global admin and submits the selected branch scope', async () => {
    session.scopes = [{ organizationId: null, branchId: null, branchCode: null, branchName: null }];
    listBranches.mockResolvedValue([
      { id: 1, organizationId: 10, code: 'Z', name: 'Zapata' },
      { id: 2, organizationId: 20, code: 'C', name: 'Centro' },
    ]);
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText('Sucursal')).toBeInTheDocument();
    const branchSelect = await screen.findByRole('combobox', { name: 'Sucursal' });
    expect(await within(branchSelect).findByRole('option', { name: 'Z - Zapata' })).toBeInTheDocument();
    expect(within(branchSelect).getByRole('option', { name: 'C - Centro' })).toBeInTheDocument();
    await user.selectOptions(branchSelect, '2');
    await user.type(within(screen.getByText('Nombre').parentElement).getByRole('textbox'), 'Cliente');
    await user.type(within(screen.getByText('Apellido').parentElement).getByRole('textbox'), 'Prueba');
    await user.selectOptions(await getVehicleBrandSelect(), '1');
    await user.type(within(screen.getByText('Modelo').parentElement).getByRole('combobox'), 'Fiesta');
    await user.type(within(screen.getByText('Dominio').parentElement).getByRole('textbox'), 'AA123BB');

    await user.click(screen.getByRole('button', { name: /crear carpeta particular/i }));

    expect(createCase).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 20, branchId: 2 }), expect.any(String));
  });

  it('creates an unmatched referenciador atomically with the folder', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(within(screen.getByText('Referenciado').parentElement).getByRole('combobox'), 'SI');
    await user.type(screen.getByPlaceholderText('Buscar por nombre...'), 'Ana Nueva');
    await user.type(within(screen.getByText('Nombre').parentElement).getByRole('textbox'), 'Cliente');
    await user.type(within(screen.getByText('Apellido').parentElement).getByRole('textbox'), 'Prueba');
    await user.selectOptions(await getVehicleBrandSelect(), '1');
    await user.type(within(screen.getByText('Modelo').parentElement).getByRole('combobox'), 'Fiesta');
    await user.type(within(screen.getByText('Dominio').parentElement).getByRole('textbox'), 'AA123BB');

    await user.click(screen.getByRole('button', { name: /crear carpeta particular/i }));

    expect(createCaseWithReferenciador).toHaveBeenCalledWith(expect.objectContaining({
      caseRequest: expect.objectContaining({ referenced: true, referenciadorId: null }),
      referenciador: { nombre: 'Ana', apellido: 'Nueva', telefono: '' },
    }), expect.any(String));
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
    await user.selectOptions(await getVehicleBrandSelect(), '1');
    await user.type(within(screen.getByText('Modelo').parentElement).getByRole('combobox'), 'Fiesta');
    await user.type(within(screen.getByText('Dominio').parentElement).getByRole('textbox'), 'AA123BB');

    await user.click(screen.getByRole('button', { name: /crear carpeta particular/i }));

    expect(createCase).toHaveBeenCalledWith(expect.objectContaining({ referenced: true, referenciadorId: 91 }), expect.any(String));
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
    await user.selectOptions(await getVehicleBrandSelect(), '1');
    await user.type(within(screen.getByText('Modelo').parentElement).getByRole('combobox'), 'Fiesta');
    await user.type(within(screen.getByText('Dominio').parentElement).getByRole('textbox'), 'AA123BB');

    await user.click(screen.getByRole('button', { name: /crear carpeta granizo/i }));

    expect(createCase).toHaveBeenCalledWith(expect.objectContaining({ referenced: false, prescriptionDate: null }), expect.any(String));
    expect(createCase.mock.calls[0][0]).not.toHaveProperty('incidentDate');
    expect(createCaseWithReferenciador).not.toHaveBeenCalled();
  });

  it('only submits one folder creation while the first request is pending', async () => {
    let resolveCaseCreation;
    createCase.mockImplementation(() => new Promise((resolve) => {
      resolveCaseCreation = resolve;
    }));
    const user = userEvent.setup();
    renderPage();

    await user.type(within(screen.getByText('Nombre').parentElement).getByRole('textbox'), 'Cliente');
    await user.type(within(screen.getByText('Apellido').parentElement).getByRole('textbox'), 'Prueba');
    await user.selectOptions(await getVehicleBrandSelect(), '1');
    await user.type(within(screen.getByText('Modelo').parentElement).getByRole('combobox'), 'Fiesta');
    await user.type(within(screen.getByText('Dominio').parentElement).getByRole('textbox'), 'AA123BB');

    const submitButton = screen.getByRole('button', { name: /crear carpeta particular/i });
    await user.click(submitButton);
    await user.click(submitButton);

    expect(createCase).toHaveBeenCalledTimes(1);
    expect(submitButton).toBeDisabled();

    resolveCaseCreation({ id: 51, folderCode: 'Z-001', caseTypeCode: 'PARTICULAR' });
    await screen.findByText('Z-001');
  });

  it('adds a vehicle category from Otro and uses it when creating the new vehicle', async () => {
    const user = userEvent.setup();
    renderPage();

    const vehicleType = await getVehicleTypeSelect();
    await user.selectOptions(vehicleType, 'OTRO');
    await user.type(screen.getByRole('textbox', { name: 'Nombre de la nueva categoría' }), 'Casa rodante');
    await user.click(screen.getByRole('button', { name: 'Agregar categoría' }));

    await waitFor(() => expect(createVehicleTypeCategory).toHaveBeenCalledWith('Casa rodante'));
    await waitFor(() => expect(vehicleType).toHaveValue('CUSTOM_CASA_RODANTE'));

    await user.type(within(screen.getByText('Nombre').parentElement).getByRole('textbox'), 'Cliente');
    await user.type(within(screen.getByText('Apellido').parentElement).getByRole('textbox'), 'Prueba');
    await user.selectOptions(await getVehicleBrandSelect(), '1');
    await user.type(within(screen.getByText('Modelo').parentElement).getByRole('combobox'), 'Fiesta');
    await user.type(within(screen.getByText('Dominio').parentElement).getByRole('textbox'), 'AA123BB');
    await user.click(screen.getByRole('button', { name: /crear carpeta particular/i }));

    await waitFor(() => expect(createVehicle).toHaveBeenCalledWith(expect.objectContaining({ vehicleTypeCode: 'CUSTOM_CASA_RODANTE' })));
  });

  it('keeps the folder data and lets the user retry when creating a category fails', async () => {
    createVehicleTypeCategory.mockRejectedValue(new Error('No se pudo guardar la categoría'));
    const user = userEvent.setup();
    renderPage();

    const vehicleType = await getVehicleTypeSelect();
    await user.selectOptions(await getVehicleBrandSelect(), '1');
    await user.selectOptions(vehicleType, 'OTRO');
    const categoryName = screen.getByRole('textbox', { name: 'Nombre de la nueva categoría' });
    await user.type(categoryName, 'Casa rodante');
    await user.click(screen.getByRole('button', { name: 'Agregar categoría' }));

    await waitFor(() => expect(createVehicleTypeCategory).toHaveBeenCalled());
    expect(await getVehicleBrandSelect()).toHaveValue('1');
    expect(vehicleType).toHaveValue('OTRO');
    expect(categoryName).toHaveValue('Casa rodante');
  });

  it('does not submit an empty category name', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(await getVehicleTypeSelect(), 'OTRO');
    expect(screen.getByRole('button', { name: 'Agregar categoría' })).toBeDisabled();
    expect(createVehicleTypeCategory).not.toHaveBeenCalled();
  });

  it('selects the existing category returned for a duplicate name', async () => {
    const duplicateError = new Error('Ya existe una categoría de vehículo con ese nombre');
    duplicateError.payload = { data: { vehicleType: { code: 'SEDAN', name: 'Sedán' } } };
    createVehicleTypeCategory.mockRejectedValue(duplicateError);
    const user = userEvent.setup();
    renderPage();

    const vehicleType = await getVehicleTypeSelect();
    await user.selectOptions(vehicleType, 'OTRO');
    await user.type(screen.getByRole('textbox', { name: 'Nombre de la nueva categoría' }), 'Sedán');
    await user.click(screen.getByRole('button', { name: 'Agregar categoría' }));

    await waitFor(() => expect(vehicleType).toHaveValue('SEDAN'));
  });

  it('adds a vehicle brand and uses its canonical id in the new vehicle', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(await getVehicleBrandSelect(), 'ADD_NEW_BRAND');
    await user.type(screen.getByRole('textbox', { name: 'Nombre de la nueva marca' }), 'Alfa Romeo');
    await user.click(screen.getByRole('button', { name: 'Guardar marca' }));

    await waitFor(() => expect(createVehicleBrand).toHaveBeenCalledWith('Alfa Romeo'));
    expect(await getVehicleBrandSelect()).toHaveValue('77');

    await user.type(within(screen.getByText('Nombre').parentElement).getByRole('textbox'), 'Cliente');
    await user.type(within(screen.getByText('Apellido').parentElement).getByRole('textbox'), 'Prueba');
    await user.type(within(screen.getByText('Modelo').parentElement).getByRole('combobox'), 'Giulia');
    await user.type(within(screen.getByText('Dominio').parentElement).getByRole('textbox'), 'AA123BB');
    await user.click(screen.getByRole('button', { name: /crear carpeta particular/i }));

    await waitFor(() => expect(createVehicle).toHaveBeenCalledWith(expect.objectContaining({ brandId: 77, brandText: 'Alfa Romeo' })));
  });

  it('keeps the folder data when creating a vehicle brand fails', async () => {
    createVehicleBrand.mockRejectedValue(new Error('No se pudo guardar la marca'));
    const user = userEvent.setup();
    renderPage();

    await user.type(within(screen.getByText('Modelo').parentElement).getByRole('combobox'), 'Focus');
    await user.selectOptions(await getVehicleBrandSelect(), 'ADD_NEW_BRAND');
    const brandName = screen.getByRole('textbox', { name: 'Nombre de la nueva marca' });
    await user.type(brandName, 'Alfa Romeo');
    await user.click(screen.getByRole('button', { name: 'Guardar marca' }));

    await waitFor(() => expect(createVehicleBrand).toHaveBeenCalled());
    expect(within(screen.getByText('Modelo').parentElement).getByRole('combobox')).toHaveValue('Focus');
    expect(brandName).toHaveValue('Alfa Romeo');
  });

  it('does not submit an empty vehicle brand name', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(await getVehicleBrandSelect(), 'ADD_NEW_BRAND');
    expect(screen.getByRole('button', { name: 'Guardar marca' })).toBeDisabled();
    expect(createVehicleBrand).not.toHaveBeenCalled();
  });

  it('selects the existing brand returned for a duplicate name', async () => {
    const duplicateError = new Error('Ya existe una marca de vehículo con ese nombre');
    duplicateError.payload = { data: { vehicleBrand: { id: 1, codigo: 'FORD', nombre: 'Ford', activo: true } } };
    createVehicleBrand.mockRejectedValue(duplicateError);
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(await getVehicleBrandSelect(), 'ADD_NEW_BRAND');
    await user.type(screen.getByRole('textbox', { name: 'Nombre de la nueva marca' }), ' ford ');
    await user.click(screen.getByRole('button', { name: 'Guardar marca' }));

    await waitFor(async () => expect(await getVehicleBrandSelect()).toHaveValue('1'));
  });
});
