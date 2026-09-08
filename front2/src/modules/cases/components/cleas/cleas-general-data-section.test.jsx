import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CleasGeneralDataSection } from './cleas-general-data-section';

const getCleasIncident = vi.fn();
const getCleasProcessing = vi.fn();
const saveCleasIncident = vi.fn();
const saveCleasProcessing = vi.fn();
const invalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey[3] === 'incident' ? getCleasIncident() : getCleasProcessing() }),
  useMutation: ({ mutationFn, onSuccess, onError }) => ({ isPending: false, mutate: async () => { try { await mutationFn(); await onSuccess?.(); } catch (error) { onError?.(error); } } }),
  useQueryClient: () => ({ invalidateQueries }),
}));
vi.mock('@/modules/cases/api/cleas-api', () => ({
  getCleasIncident: (...args) => getCleasIncident(...args), getCleasProcessing: (...args) => getCleasProcessing(...args),
  saveCleasIncident: (...args) => saveCleasIncident(...args), saveCleasProcessing: (...args) => saveCleasProcessing(...args),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const incident = { incident: { incidentDate: '2026-04-20', prescriptionDate: '2027-04-20', incidentTime: '10:30', location: 'Rosario', dynamics: 'Impacto lateral', observations: 'Con tercero', daysInProcess: 12 }, thirdPartyVehicleId: 77 };
const processing = { version: 5, presentedAt: '2026-04-21', inspectionDate: '2026-04-25' };

afterEach(() => vi.clearAllMocks());

describe('CleasGeneralDataSection', () => {
  it('projects CLEAS incident and processing data instead of workspace data', () => {
    getCleasIncident.mockReturnValue(incident); getCleasProcessing.mockReturnValue(processing);
    render(<CleasGeneralDataSection caseId="42" />);
    expect(screen.getByText('2026-04-20')).toBeTruthy();
    expect(screen.getByText('2027-04-20')).toBeTruthy();
    expect(screen.getByText('2026-04-21')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
  });

  it('edits only dates, cancels drafts, preserves the incident payload, and patches presentedAt with its version', async () => {
    getCleasIncident.mockReturnValue(incident); getCleasProcessing.mockReturnValue(processing);
    saveCleasIncident.mockResolvedValue({}); saveCleasProcessing.mockResolvedValue({});
    render(<CleasGeneralDataSection caseId="42" />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(screen.getByLabelText('Fecha del siniestro')).not.toHaveAttribute('readonly');
    expect(screen.getByLabelText('Prescripción del trámite')).not.toHaveAttribute('readonly');
    expect(screen.getByLabelText('Fecha presentado')).not.toHaveAttribute('readonly');
    expect(screen.queryByLabelText('Días tramitando')).toBeNull();
    fireEvent.change(screen.getByLabelText('Fecha del siniestro'), { target: { value: '2026-05-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByText('2026-04-20')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByLabelText('Fecha del siniestro'), { target: { value: '2026-05-01' } });
    fireEvent.change(screen.getByLabelText('Prescripción del trámite'), { target: { value: '2027-05-01' } });
    fireEvent.change(screen.getByLabelText('Fecha presentado'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(saveCleasIncident).toHaveBeenCalledWith('42', { incident: { ...incident.incident, incidentDate: '2026-05-01', prescriptionDate: '2027-05-01' }, thirdPartyVehicleId: 77 }));
    expect(saveCleasProcessing).toHaveBeenCalledWith('42', { expectedVersion: 5, presentedAt: null });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42', 'workspace'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases'] });
  });

  it('does not expose edit controls for a closed CLEAS case', () => {
    getCleasIncident.mockReturnValue(incident); getCleasProcessing.mockReturnValue(processing);
    render(<CleasGeneralDataSection caseId="42" closed />);
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull();
  });
});
