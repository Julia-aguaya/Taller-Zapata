import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LawyerThirdPartyIncidentSection } from './lawyer-third-party-incident-section';

const requestJson = vi.fn();
const incident = { incidentDate: '2026-09-15', location: 'Mitre 400', incidentTime: '09:30', dynamics: 'Alcance', observations: 'Sin heridos' };
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey.at(-1) === 'incident' ? incident : queryKey.at(-1) === 'third-party-workshop' ? { thirdPartyVehicleId: 9 } : queryKey.at(-1) === 'persons' ? [] : null, isLoading: false }),
  useMutation: ({ mutationFn, onSuccess }) => ({ isPending: false, mutate: async () => onSuccess(await mutationFn()) }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@/shared/api/http-client', () => ({ requestJson: (...args) => requestJson(...args) }));
vi.mock('@/modules/cases/api/third-party-api', () => ({ getLawyerThirdPartyIncident: vi.fn(), getThirdPartyWorkshop: vi.fn(), getCasePersons: vi.fn(), saveLawyerThirdPartyIncident: vi.fn().mockResolvedValue({}), saveThirdPartyWorkshop: vi.fn(), addCasePerson: vi.fn() }));
vi.mock('@/modules/cases/api/new-case-api', () => ({ createPerson: vi.fn(), createVehicle: vi.fn(), searchPersons: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('LawyerThirdPartyIncidentSection', () => {
  beforeEach(() => { requestJson.mockReset(); requestJson.mockResolvedValue({}); });

  it('keeps all lawyer third-party facts in one persisted incident card', async () => {
    render(<LawyerThirdPartyIncidentSection caseId={42} />);
    expect(screen.getAllByText('Datos del siniestro')).toHaveLength(1);
    expect(screen.getByLabelText('Dominio tercero')).toBeInTheDocument();
    expect(screen.getByLabelText('Titular vehículo tercero')).toBeInTheDocument();
    expect(screen.getByLabelText('Porcentaje titularidad')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Lugar de ocurrencia'), { target: { value: 'Córdoba 200' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(requestJson).toHaveBeenCalledWith('/cases/42/incident', expect.objectContaining({ method: 'PUT', body: expect.stringContaining('Córdoba 200') })));
  });
});
