import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LawyerProcessingSection, daysSincePresentation, prescriptionFromIncident } from './lawyer-processing-section';

let incident; let processing;
const requestJson = vi.fn();
const queryClient = { invalidateQueries: vi.fn() };

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey[2] === 'incident' ? incident : processing }),
  useMutation: (config) => ({ isPending: false, mutate: async () => { try { const saved = await config.mutationFn(); await config.onSuccess?.(saved); } catch (error) { await config.onError?.(error); } } }),
  useQueryClient: () => queryClient,
}));
vi.mock('@/shared/api/http-client', () => ({ requestJson: (...args) => requestJson(...args) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('LawyerProcessingSection', () => {
  beforeEach(() => {
    incident = { incidentDate: '2024-02-29', incidentTime: '10:30', location: 'Mitre 400', dynamics: 'Alcance', observations: 'Sin heridos' };
    processing = { version: 7, presentedAt: '2026-03-01', opinionCode: 'APROBADO' };
    requestJson.mockReset();
    requestJson.mockResolvedValue({});
    queryClient.invalidateQueries.mockReset();
  });

  it('calculates prescription from the incident date, including leap-day anniversaries', () => {
    expect(prescriptionFromIncident('2024-02-29')).toBe('2027-02-28');
    expect(prescriptionFromIncident('2025-02-28')).toBe('2028-02-28');
    expect(daysSincePresentation('2026-03-01', new Date(2026, 2, 4))).toBe(3);
  });

  it('persists incident and processing data while preserving the other incident values and versioning', async () => {
    render(<LawyerProcessingSection caseId="42" />);

    expect(screen.getByLabelText('Prescripción del trámite')).toHaveValue('2027-02-28');
    expect(screen.getByLabelText('Días tramitando')).toHaveAttribute('readonly');
    fireEvent.change(screen.getByLabelText('Fecha del siniestro'), { target: { value: '2026-04-10' } });
    fireEvent.change(screen.getByLabelText('Fecha presentado'), { target: { value: '2026-04-12' } });
    fireEvent.change(screen.getByLabelText('Dictamen'), { target: { value: 'RECHAZADO' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(requestJson).toHaveBeenNthCalledWith(1, '/cases/42/incident', {
      method: 'PUT',
      body: JSON.stringify({ incidentDate: '2026-04-10', incidentTime: '10:30', location: 'Mitre 400', dynamics: 'Alcance', observations: 'Sin heridos' }),
    }));
    expect(requestJson).toHaveBeenNthCalledWith(2, '/cases/42/insurance-processing', {
      method: 'PATCH',
      body: JSON.stringify({ expectedVersion: 7, presentedAt: '2026-04-12', opinionCode: 'RECHAZADO' }),
    });
  });
});
