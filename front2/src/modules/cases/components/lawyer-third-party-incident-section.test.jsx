import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LawyerThirdPartyIncidentSection } from './lawyer-third-party-incident-section';

const requestJson = vi.fn();
const saveLawyerThirdPartyIncident = vi.fn();
const incident = { location: 'Mitre 400', incidentTime: '09:30', dynamics: 'Alcance', observations: 'Sin heridos' };
const lawyerIncident = { thirdPartyPlate: 'AB123CD', thirdPartyMake: 'Ford', thirdPartyModel: 'Focus', driverName: 'Ana Conductora', driverDni: '30111222', driverAddress: 'Calle 1', driverIsOwner: false, ownerName: 'Beto Titular', ownerDni: '32111222', ownerAddress: 'Calle 2', ownershipPercentage: 50 };
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey.at(-1) === 'incident' ? incident : lawyerIncident, isLoading: false }),
  useMutation: ({ mutationFn, onSuccess }) => ({ isPending: false, mutate: async () => onSuccess(await mutationFn()) }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@/shared/api/http-client', () => ({ requestJson: (...args) => requestJson(...args) }));
vi.mock('@/modules/cases/api/third-party-api', () => ({ getLawyerThirdPartyIncident: vi.fn(), saveLawyerThirdPartyIncident: (...args) => saveLawyerThirdPartyIncident(...args) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('LawyerThirdPartyIncidentSection', () => {
  beforeEach(() => { requestJson.mockResolvedValue({}); saveLawyerThirdPartyIncident.mockResolvedValue({}); });

  it('renders lawyer-only incident data in the required order and persists generic plus lawyer fields', async () => {
    render(<LawyerThirdPartyIncidentSection caseId={42} />);
    const labels = Array.from(document.querySelectorAll('label > span')).map((item) => item.textContent);
    expect(labels).toEqual(['Lugar de ocurrencia', 'Hora', 'Dominio del tercero', 'Marca', 'Modelo', 'Conductor/a del vehículo tercero', 'DNI', 'Domicilio', 'Es titular', 'Titular del vehículo tercero', 'DNI', 'Domicilio', 'Porcentaje de titularidad', 'Dinámica', 'Observaciones']);
    expect(screen.getByLabelText('Lugar de ocurrencia')).toHaveValue('Mitre 400');
    expect(screen.getByLabelText('Es titular')).toHaveValue('NO');
    fireEvent.change(screen.getByLabelText('Dominio del tercero'), { target: { value: 'AE456FG' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(requestJson).toHaveBeenCalledWith('/cases/42/incident', expect.objectContaining({ method: 'PUT' })));
    expect(saveLawyerThirdPartyIncident).toHaveBeenCalledWith(42, expect.objectContaining({ thirdPartyPlate: 'AE456FG', driverIsOwner: false, ownershipPercentage: 50 }));
  });
});
