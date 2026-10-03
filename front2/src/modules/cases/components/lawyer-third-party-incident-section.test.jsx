import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LawyerThirdPartyIncidentSection } from './lawyer-third-party-incident-section';

const mocks = vi.hoisted(() => ({
  addCasePerson: vi.fn(),
  createPerson: vi.fn(),
  requestJson: vi.fn(),
  searchPersons: vi.fn(),
}));
let people;
let candidates;
const incident = { incidentDate: '2026-09-15', location: 'Mitre 400', incidentTime: '09:30', dynamics: 'Alcance', observations: 'Sin heridos' };

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => {
    const key = queryKey.at(-1);
    if (key === 'incident') return { data: incident, isLoading: false };
    if (key === 'third-party-workshop') return { data: { thirdPartyVehicleId: 9 }, isLoading: false };
    if (key === 'persons') return { data: people, isLoading: false };
    if (queryKey.includes('lawyer-third-party-owner')) return { data: candidates, isLoading: false, isFetching: false };
    return { data: null, isLoading: false };
  },
  useMutation: ({ mutationFn, onSuccess, onError }) => ({ isPending: false, mutate: async () => { try { const result = await mutationFn(); await onSuccess?.(result); } catch (error) { onError?.(error); } } }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@/shared/api/http-client', () => ({ requestJson: (...args) => mocks.requestJson(...args) }));
vi.mock('@/modules/cases/api/third-party-api', () => ({ getLawyerThirdPartyIncident: vi.fn(), getThirdPartyWorkshop: vi.fn(), getCasePersons: vi.fn(), saveLawyerThirdPartyIncident: vi.fn().mockResolvedValue({}), saveThirdPartyWorkshop: vi.fn(), addCasePerson: (...args) => mocks.addCasePerson(...args) }));
vi.mock('@/modules/cases/api/new-case-api', () => ({ createPerson: (...args) => mocks.createPerson(...args), createVehicle: vi.fn(), searchPersons: (...args) => mocks.searchPersons(...args) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('LawyerThirdPartyIncidentSection', () => {
  beforeEach(() => {
    people = [{ id: 31, personId: 3, displayName: 'Ana Titular', caseRoleCode: 'TITULAR', vehicleId: 9, registryOwnershipPercentage: 25 }];
    candidates = [{ id: 7, nombreMostrar: 'Mario Titular' }];
    mocks.requestJson.mockReset(); mocks.requestJson.mockResolvedValue({});
    mocks.addCasePerson.mockReset(); mocks.addCasePerson.mockResolvedValue({});
    mocks.createPerson.mockReset(); mocks.createPerson.mockResolvedValue({ id: 8 });
    mocks.searchPersons.mockReset();
  });

  it('keeps all lawyer third-party facts in one persisted incident card', async () => {
    render(<LawyerThirdPartyIncidentSection caseId={42} />);
    expect(screen.getAllByText('Datos del siniestro')).toHaveLength(1);
    expect(screen.getByLabelText('Dominio tercero')).toBeInTheDocument();
    expect(screen.getByLabelText('Titular vehículo tercero')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Lugar de ocurrencia'), { target: { value: 'Córdoba 200' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(mocks.requestJson).toHaveBeenCalledWith('/cases/42/incident', expect.objectContaining({ method: 'PUT', body: expect.stringContaining('Córdoba 200') })));
  });

  it('renders current additional owners and links a selected existing person from the modal', async () => {
    render(<LawyerThirdPartyIncidentSection caseId={42} />);
    expect(screen.getByText('Ana Titular: 25%')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Agregar otro titular' }));
    fireEvent.change(screen.getByLabelText('Buscar persona existente'), { target: { value: 'Mar' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mario Titular' }));
    fireEvent.change(screen.getByLabelText('Porcentaje de titularidad'), { target: { value: '75' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar titular' }));
    await waitFor(() => expect(mocks.addCasePerson).toHaveBeenCalledWith(42, expect.objectContaining({ personId: 7, caseRoleCode: 'TITULAR', vehicleId: 9, porcentajeTitularidad: 75 })));
    expect(mocks.createPerson).not.toHaveBeenCalled();
  });

  it('creates a physical person with its address and links it as TITULAR', async () => {
    render(<LawyerThirdPartyIncidentSection caseId={42} />);
    fireEvent.click(screen.getByRole('button', { name: 'Agregar otro titular' }));
    fireEvent.change(screen.getByLabelText('Nombre nuevo titular'), { target: { value: 'Beto' } });
    fireEvent.change(screen.getByLabelText('Apellido nuevo titular'), { target: { value: 'Nuevo' } });
    fireEvent.change(screen.getByLabelText('DNI nuevo titular'), { target: { value: '30111222' } });
    fireEvent.change(screen.getByLabelText('Domicilio nuevo titular'), { target: { value: 'Rivadavia 100' } });
    fireEvent.change(screen.getByLabelText('Porcentaje de titularidad'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar titular' }));
    await waitFor(() => expect(mocks.createPerson).toHaveBeenCalledWith(expect.objectContaining({ tipoPersona: 'fisica', nombre: 'Beto', apellido: 'Nuevo', numeroDocumento: '30111222' })));
    await waitFor(() => expect(mocks.requestJson).toHaveBeenCalledWith('/persons/8/addresses', expect.objectContaining({ method: 'POST', body: expect.stringContaining('Rivadavia 100') })));
    await waitFor(() => expect(mocks.addCasePerson).toHaveBeenCalledWith(42, expect.objectContaining({ personId: 8, caseRoleCode: 'TITULAR', vehicleId: 9, porcentajeTitularidad: 50 })));
  });
});
