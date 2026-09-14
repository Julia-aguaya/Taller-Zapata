import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CleasClaimDataSection } from './cleas-claim-data-section';

const saveCleasIncident = vi.fn().mockResolvedValue({});
const invalidateQueries = vi.fn().mockResolvedValue(undefined);
const incidentResponse = { incident: { incidentDate: '2026-04-20', incidentTime: '10:30', location: 'Rosario', dynamics: 'Impacto lateral', observations: 'Con tercero' }, thirdPartyPlate: 'AC123DE' };

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: incidentResponse }),
  useQueryClient: () => ({ invalidateQueries }),
  useMutation: ({ mutationFn, onSuccess }) => ({ isPending: false, mutate: async () => { await mutationFn(); await onSuccess(); } }),
}));
vi.mock('@/modules/cases/api/cleas-api', () => ({ getCleasIncident: vi.fn(), saveCleasIncident: (...args) => saveCleasIncident(...args) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('CleasClaimDataSection', () => {
  it('hydrates and saves the editable third-party plate without vehicle requests', async () => {
    render(<CleasClaimDataSection caseId="42" />);

    expect(screen.getByLabelText('Dominio del 3ro')).toHaveValue('AC123DE');
    fireEvent.change(screen.getByLabelText('Dominio del 3ro'), { target: { value: 'ab-123-cd' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(saveCleasIncident).toHaveBeenCalledWith('42', {
      incident: { incidentDate: '2026-04-20', incidentTime: '10:30', location: 'Rosario', dynamics: 'Impacto lateral', observations: 'Con tercero', prescriptionDate: null },
      thirdPartyPlate: 'ab-123-cd',
    }));
  });
});
