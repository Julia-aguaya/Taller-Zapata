import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TramiteSummarySection } from './tramite-summary-section';

const requestJson = vi.fn();
const invalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({
    data: queryKey[2] === 'incident'
      ? { incidentDate: '2026-04-20', prescriptionDate: '2027-04-20' }
      : { version: 5, presentedAt: '2026-04-21' },
  }),
  useMutation: ({ mutationFn, onSuccess }) => ({
    isPending: false,
    mutate: async () => onSuccess?.(await mutationFn()),
  }),
  useQueryClient: () => ({ invalidateQueries }),
}));

vi.mock('@/shared/api/http-client', () => ({ requestJson: (...args) => requestJson(...args) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

afterEach(() => vi.clearAllMocks());

describe('TramiteSummarySection TODO_RIESGO', () => {
  it('preserves and submits the client prescription date with the incident payload', async () => {
    requestJson.mockResolvedValue({});
    render(<TramiteSummarySection caseId="42" caseTypeCode="TODO_RIESGO" />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByDisplayValue('2026-04-20'), { target: { value: '2026-05-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(requestJson).toHaveBeenCalledWith('/cases/42/incident', {
      method: 'PUT',
      body: JSON.stringify({
        incidentDate: '2026-05-01',
        incidentTime: null,
        location: null,
        dynamics: null,
        observations: null,
        prescriptionDate: '2027-05-01',
      }),
    }));
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42', 'workspace'] });
  });
});

describe('TramiteSummarySection GRANIZO', () => {
  it('sends only the changed incident data and preserves the server-owned one-year prescription', async () => {
    requestJson.mockResolvedValue({});
    render(<TramiteSummarySection caseId="42" caseTypeCode="GRANIZO" />);

    expect(screen.getByLabelText('Fecha del hecho')).toBeRequired();
    expect(screen.getByLabelText('Prescripción')).toHaveValue('2027-04-20');
    expect(screen.getByLabelText('Prescripción')).toHaveAttribute('readonly');
    expect(screen.queryByText('Datos del siniestro')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Editar fecha' }));
    fireEvent.change(screen.getByLabelText('Fecha del hecho'), { target: { value: '2026-05-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar fecha' }));

    await waitFor(() => expect(requestJson).toHaveBeenCalledWith('/cases/42/incident', {
      method: 'PUT',
      body: JSON.stringify({
        incidentDate: '2026-05-01',
        incidentTime: null,
        location: null,
        dynamics: null,
        observations: null,
      }),
    }));
    expect(requestJson.mock.calls[0][1].body).not.toContain('prescriptionDate');
  });
});
