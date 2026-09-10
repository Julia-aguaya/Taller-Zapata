import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildCleasProcessingPatch, CleasProcedureSection } from './cleas-procedure-section';

let processing;
const saveCleasProcessing = vi.fn();
const invalidateQueries = vi.fn().mockResolvedValue(undefined);

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey[3] === 'processing' ? processing : queryKey[3] === 'orders' ? [] : queryKey[1] === 'insurance' ? { modalityCodes: [], quotationStatusCodes: [], partsAuthorizationCodes: [] } : null }),
  useQueryClient: () => ({ invalidateQueries }),
  useMutation: ({ mutationFn, onSuccess, onError }) => ({ isPending: false, mutate: async () => { try { await mutationFn(); await onSuccess?.(); } catch (error) { onError?.(error); } } }),
}));
vi.mock('@/modules/cases/api/cleas-api', () => ({
  getCleasProcessing: vi.fn(), saveCleasProcessing: (...args) => saveCleasProcessing(...args), createCleasOrder: vi.fn(), deleteCleasOrder: vi.fn(), listCleasOrders: vi.fn(), saveCleasDefinition: vi.fn(),
}));
vi.mock('@/shared/api/http-client', () => ({ requestJson: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('CleasProcedureSection manual operational fields', () => {
  beforeEach(() => {
    processing = { version: 7, presentedAt: '2026-08-02', agreedAmount: 1000, minimumCloseAmount: 850, includesParts: true };
    saveCleasProcessing.mockReset().mockResolvedValue({});
  });

  it('hydrates the persisted manual minimum and yes value', () => {
    render(<CleasProcedureSection caseId="42" />);

    expect(screen.getByLabelText('Mínimo para cierre')).toHaveValue(850);
    expect(screen.getByLabelText('Lleva repuestos')).toHaveValue('SI');
  });

  it('saves changed manual minimum and explicit no values', async () => {
    render(<CleasProcedureSection caseId="42" />);
    fireEvent.change(screen.getByLabelText('Mínimo para cierre'), { target: { value: '900' } });
    fireEvent.change(screen.getByLabelText('Lleva repuestos'), { target: { value: 'NO' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(saveCleasProcessing).toHaveBeenCalledWith('42', { expectedVersion: 7, minimumCloseAmount: 900, includesParts: false }));
  });

  it('represents both persisted no and explicit yes values', () => {
    processing.includesParts = false;
    const { rerender } = render(<CleasProcedureSection caseId="42" />);
    expect(screen.getByLabelText('Lleva repuestos')).toHaveValue('NO');

    expect(buildCleasProcessingPatch({ includesParts: 'SI' }, { version: 7, includesParts: false })).toEqual({ expectedVersion: 7, includesParts: true });
    rerender(<CleasProcedureSection caseId="42" />);
    expect(screen.getByLabelText('Lleva repuestos')).toHaveValue('NO');
  });

  it('rejects a negative manual minimum before sending a patch', () => {
    expect(() => buildCleasProcessingPatch({ minimumCloseAmount: '-1' }, { version: 7, minimumCloseAmount: null })).toThrow('El mínimo para cierre no puede ser negativo.');
  });

  it('hides company billing for an unfavorable franchise CLEAS', () => {
    render(<CleasProcedureSection caseId="42" cleasOver="franchise" opinion="unfavorable" />);

    expect(screen.queryByLabelText('A facturar Cía.')).not.toBeInTheDocument();
  });

  it('shows the agreed quotation amount for a favorable franchise CLEAS', () => {
    render(<CleasProcedureSection caseId="42" cleasOver="franchise" opinion="favorable" cleasAgreedAmount="1250" />);

    expect(screen.getByLabelText('A facturar Cía.')).toHaveValue('1250');
  });

  it('keeps company billing visible for a total-damage CLEAS', () => {
    render(<CleasProcedureSection caseId="42" cleasOver="damage" opinion="unfavorable" cleasAgreedAmount="1250" />);

    expect(screen.getByLabelText('A facturar Cía.')).toHaveValue('1250');
  });
});
