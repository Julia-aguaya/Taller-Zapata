import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegistryOwnershipSection } from './case-workspace-page';

const addCasePerson = vi.fn(); const updateCasePerson = vi.fn(); const deleteCasePerson = vi.fn(); const createPerson = vi.fn();
let owners = []; let candidates = [];

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey[2] === 'persons' ? owners : queryKey[0] === 'persons' ? candidates : [], isLoading: false }),
  useMutation: ({ mutationFn, onSuccess }) => ({ isPending: false, mutate: async (...args) => { const result = await mutationFn(...args); await onSuccess?.(result, ...args); } }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@/modules/cases/api/third-party-api', () => ({ addCasePerson: (...args) => addCasePerson(...args), updateCasePerson: (...args) => updateCasePerson(...args), deleteCasePerson: (...args) => deleteCasePerson(...args), getCasePersons: vi.fn() }));
vi.mock('@/modules/cases/api/new-case-api', () => ({ createPerson: (...args) => createPerson(...args), searchPersons: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const detail = { principalVehicleId: 22, principalCustomerPersonId: 1, principalCustomerName: 'Cliente Principal' };
const renderSection = () => render(<RegistryOwnershipSection caseId="1" caseDetail={detail} editable />);

describe('RegistryOwnershipSection', () => {
  beforeEach(() => { owners = [{ id: 10, personId: 4, displayName: 'Ana Titular', caseRoleCode: 'TITULAR', vehicleId: 22, notes: 'Titular registral', registryOwnershipPercentage: 60 }]; candidates = [{ id: 7, nombreMostrar: 'Mario Titular' }]; addCasePerson.mockReset(); updateCasePerson.mockReset(); deleteCasePerson.mockReset(); createPerson.mockReset(); });

  it('muestra total, restante y permite abrir el alta de un titular adicional', () => { renderSection(); expect(screen.getByText('Total: 60% · Restante: 40%.')).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: 'Agregar titular' })); expect(screen.getByText('Podés asignar hasta 40% de titularidad.')).toBeInTheDocument(); });
  it('bloquea agregar cuando el porcentaje supera el restante', () => { renderSection(); fireEvent.click(screen.getByRole('button', { name: 'Agregar titular' })); fireEvent.change(screen.getByLabelText('Porcentaje nuevo titular'), { target: { value: '41' } }); expect(screen.getByText('Supera el 100% acumulado.')).toBeInTheDocument(); expect(screen.getAllByRole('button', { name: 'Agregar titular' })[1]).toBeDisabled(); });
  it('agrega una persona existente como titular adicional', async () => { addCasePerson.mockResolvedValue({}); renderSection(); fireEvent.click(screen.getByRole('button', { name: 'Agregar titular' })); fireEvent.change(screen.getByPlaceholderText('Buscar titular por nombre o documento'), { target: { value: 'Mar' } }); fireEvent.click(screen.getByRole('button', { name: 'Mario Titular' })); fireEvent.change(screen.getByLabelText('Porcentaje nuevo titular'), { target: { value: '40' } }); fireEvent.click(screen.getAllByRole('button', { name: 'Agregar titular' })[1]); await waitFor(() => expect(addCasePerson).toHaveBeenCalledWith('1', expect.objectContaining({ personId: 7, porcentajeTitularidad: 40 }))); });
  it('crea una persona y la agrega como titular', async () => { createPerson.mockResolvedValue({ id: 8 }); addCasePerson.mockResolvedValue({}); renderSection(); fireEvent.click(screen.getByRole('button', { name: 'Agregar titular' })); fireEvent.click(screen.getByRole('button', { name: 'Crear nueva persona' })); fireEvent.change(screen.getByLabelText('Nombre nueva persona'), { target: { value: 'Beto Nuevo' } }); fireEvent.click(screen.getByRole('button', { name: 'Crear persona' })); await waitFor(() => expect(createPerson).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Beto Nuevo' }))); fireEvent.change(screen.getByLabelText('Porcentaje nuevo titular'), { target: { value: '40' } }); fireEvent.click(screen.getAllByRole('button', { name: 'Agregar titular' })[1]); await waitFor(() => expect(addCasePerson).toHaveBeenCalledWith('1', expect.objectContaining({ personId: 8, vehicleId: 22, porcentajeTitularidad: 40 }))); });
  it('edita el porcentaje y elimina un titular', async () => { updateCasePerson.mockResolvedValue({}); deleteCasePerson.mockResolvedValue({}); renderSection(); fireEvent.blur(screen.getByLabelText('Porcentaje de Ana Titular'), { target: { value: '40' } }); await waitFor(() => expect(updateCasePerson).toHaveBeenCalledWith('1', 10, expect.objectContaining({ porcentajeTitularidad: 40 }))); fireEvent.click(screen.getByRole('button', { name: 'Quitar' })); await waitFor(() => expect(deleteCasePerson).toHaveBeenCalledWith('1', 10)); });
  it('preselecciona al cliente principal como primer titular', () => { owners = []; renderSection(); expect(screen.getByPlaceholderText('Titular seleccionado')).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Guardar titularidad' })).toBeEnabled(); });
});
