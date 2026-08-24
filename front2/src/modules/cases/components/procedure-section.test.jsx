import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProcedureSection, buildProcessingPatch, isBelowMinimumConfirmationRequired } from './procedure-section';

let mutationConfig;
const invalidateQueries = vi.fn().mockResolvedValue(undefined);
const requestJson = vi.fn();
const processing = { id: 1, version: 4, presentedAt: '2026-08-01', agreedAmount: 100, minimumCloseAmount: 120, includesParts: false };
const catalogs = { modalityCodes: [{ code: 'PRESENCIAL', name: 'Presencial' }, { code: 'POR_FOTOS', name: 'Por fotos' }], quotationStatusCodes: [], opinionCodes: [] };

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey[2] === 'insurance-processing' ? processing : catalogs }),
  useQueryClient: () => ({ invalidateQueries }),
  useMutation: (config) => {
    mutationConfig = config;
    return { isPending: false, mutate: async (payload) => {
      try { const result = await config.mutationFn(payload); await config.onSuccess?.(result); }
      catch (error) { await config.onError?.(error); }
    } };
  },
}));
vi.mock('@/shared/api/http-client', () => ({ requestJson: (...args) => requestJson(...args) }));
vi.mock('@/modules/cases/components/provider-selector', () => ({
  ProviderSelector: ({ onChange }) => <button type="button" onClick={() => onChange({ providerId: 702, snapshot: 'Proveedor Seguro' })}>Seleccionar proveedor</button>,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('ProcedureSection processing contract', () => {
  beforeEach(() => {
    requestJson.mockReset();
    invalidateQueries.mockClear();
    Object.assign(processing, { id: 1, version: 4, presentedAt: '2026-08-01', inspectionForwardedAt: null, inspectionDate: null, agreedAmount: 100, minimumCloseAmount: 120, includesParts: false, partsAuthorizationCode: null });
  });

  it('sends only edited operational fields plus the expected version', () => {
    const processing = { version: 4, presentedAt: '2026-08-01', agreedAmount: 100, minimumCloseAmount: 120, includesParts: true };
    const form = { presentedAt: '2026-08-01', agreedAmount: '90', inspectionForwardedAt: '', inspectionDate: '', modalityCode: '', opinionCode: '', quotationStatusCode: '', quotationDate: '', partsSupplierText: '', providerId: '', finalAmountForWorkshop: '' };
    expect(buildProcessingPatch(form, processing)).toEqual({ agreedAmount: 90 });
  });

  it('does not overwrite hidden processing fields', () => {
    const processing = { version: 4, presentedAt: '2026-08-01', opinionCode: 'APROBADO', finalAmountForWorkshop: 250 };
    const form = { presentedAt: '2026-08-01', inspectionForwardedAt: '', inspectionDate: '', modalityCode: '', quotationStatusCode: '', quotationDate: '', agreedAmount: '', partsSupplierText: '', providerId: '' };

    expect(buildProcessingPatch(form, processing)).toEqual({});
  });

  it('shows only the canonical modalities and hides dictamen and final workshop amount', () => {
    render(<ProcedureSection caseId="42" />);

    expect(Array.from(screen.getByLabelText('Modalidad').options).map((option) => option.textContent)).toEqual(['-', 'Presencial', 'Por fotos']);
    expect(screen.getByText('Fecha de presentación')).toBeInTheDocument();
    expect(screen.queryByLabelText('Dictamen')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Final a favor Taller')).not.toBeInTheDocument();
  });

  it('persists a selected catalog provider as its id and server-owned snapshot', async () => {
    requestJson.mockResolvedValue({ providerId: 702, partsSupplierText: 'Proveedor Seguro' });
    render(<ProcedureSection caseId="42" />);

    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar proveedor' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(requestJson).toHaveBeenCalledWith('/cases/42/insurance-processing', expect.objectContaining({ method: 'PATCH' })));
    expect(JSON.parse(requestJson.mock.calls[0][1].body)).toEqual({
      expectedVersion: 4,
      providerId: 702,
      partsSupplierText: 'Proveedor Seguro',
    });
  });

  it('only opens the low-minimum confirmation flow for the canonical code', () => {
    expect(isBelowMinimumConfirmationRequired({ payload: { code: 'PROCESSING_AMOUNT_BELOW_MINIMUM_CONFIRMATION_REQUIRED' } })).toBe(true);
    expect(isBelowMinimumConfirmationRequired({ payload: { code: 'AGREED_AMOUNT_BELOW_MINIMUM' } })).toBe(false);
  });

  it('opens an accessible confirmation dialog only for the canonical error and retries explicitly', async () => {
    const canonicalError = Object.assign(new Error('below minimum'), { payload: { code: 'PROCESSING_AMOUNT_BELOW_MINIMUM_CONFIRMATION_REQUIRED', data: { agreedAmount: 90, minimumCloseAmount: 120, difference: 30 } } });
    requestJson.mockRejectedValueOnce(canonicalError).mockResolvedValueOnce({});
    render(<ProcedureSection caseId="42" />);

    fireEvent.change(screen.getByLabelText('Monto acordado'), { target: { value: '90' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('dialog', { name: 'Monto acordado bajo el minimo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar y guardar' }));

    await waitFor(() => expect(requestJson).toHaveBeenLastCalledWith('/cases/42/insurance-processing', expect.objectContaining({ method: 'PATCH', body: expect.stringContaining('"allowBelowMinimum":true') })));
    expect(mutationConfig).toBeDefined();
  });

  it('keeps progressive fields disabled until their prerequisite dates are present', () => {
    processing.presentedAt = null;
    render(<ProcedureSection caseId="42" />);

    expect(screen.getByLabelText('Derivado a inspeccion')).toBeDisabled();
    expect(screen.getByLabelText('Fecha inspeccion')).toBeDisabled();
    expect(screen.getByLabelText('Modalidad')).toBeDisabled();
    expect(screen.getByLabelText('Cotizacion')).toBeDisabled();
    expect(screen.getByLabelText('Monto acordado')).toBeDisabled();
  });

  it('renders an editable insurer authorization only when the server reports parts', async () => {
    const { unmount } = render(<ProcedureSection caseId="42" />);
    expect(screen.queryByLabelText('Autorización de aseguradora - repuestos')).not.toBeInTheDocument();

    processing.includesParts = true;
    processing.partsAuthorizationCode = 'PARCIAL';
    unmount();
    render(<ProcedureSection caseId="42" />);
    expect(screen.getByLabelText('Autorización de aseguradora - repuestos')).toHaveValue('PARCIAL');
    expect(Array.from(screen.getByLabelText('Autorización de aseguradora - repuestos').options).map((option) => option.textContent)).toEqual(['Pendiente de respuesta', 'Aprobados', 'Aprobados parcial', 'Rechazados']);
    fireEvent.change(screen.getByLabelText('Autorización de aseguradora - repuestos'), { target: { value: 'TOTAL' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(requestJson).toHaveBeenLastCalledWith('/cases/42/insurance-processing', expect.objectContaining({ body: expect.stringContaining('"partsAuthorizationCode":"TOTAL"') })));
  });

  it('closes the low-minimum dialog without retrying on cancel, Escape, or close', async () => {
    const canonicalError = Object.assign(new Error('below minimum'), { payload: { code: 'PROCESSING_AMOUNT_BELOW_MINIMUM_CONFIRMATION_REQUIRED', data: { agreedAmount: 90, minimumCloseAmount: 120, difference: 30 } } });
    requestJson.mockRejectedValue(canonicalError);
    render(<ProcedureSection caseId="42" />);

    fireEvent.change(screen.getByLabelText('Monto acordado'), { target: { value: '90' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(requestJson).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await screen.findByRole('dialog');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(requestJson).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar diálogo' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(requestJson).toHaveBeenCalledTimes(3);
  });

  it('refreshes the projection when the server reports a version conflict', async () => {
    const versionConflict = Object.assign(new Error('conflict'), { payload: { code: 'PROCESSING_VERSION_CONFLICT' } });
    requestJson.mockRejectedValueOnce(versionConflict);
    render(<ProcedureSection caseId="42" />);

    fireEvent.change(screen.getByLabelText('Monto acordado'), { target: { value: '90' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42', 'insurance-processing'] }));
  });
});
