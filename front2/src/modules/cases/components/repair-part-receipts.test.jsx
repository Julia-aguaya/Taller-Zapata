import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RepairEditorPanel } from './repair-editor-panel';

const partsApi = {
  createReceipt: vi.fn(),
  deleteReceipt: vi.fn(),
  list: vi.fn(),
  updatePart: vi.fn(),
  updateReceipt: vi.fn(),
};

vi.mock('@/modules/cases/api/parts-api', () => ({
  createRepairPartReceipt: (...args) => partsApi.createReceipt(...args),
  deleteRepairPartReceipt: (...args) => partsApi.deleteReceipt(...args),
  getPartsCatalogs: vi.fn().mockResolvedValue({ authorizationCodes: [{ code: 'AUTORIZADO', name: 'Autorizado' }] }),
  listRepairParts: (...args) => partsApi.list(...args),
  resolvePartReconciliationWarning: vi.fn(),
  updateRepairPart: (...args) => partsApi.updatePart(...args),
  updateRepairPartReceipt: (...args) => partsApi.updateReceipt(...args),
}));
vi.mock('@/modules/cases/api/operations-api', () => ({
  createRepairAppointment: vi.fn(), createVehicleIntake: vi.fn(), createVehicleOutcome: vi.fn(), deleteRepairAppointment: vi.fn(),
  getOperationCatalogs: vi.fn().mockResolvedValue({}), listRepairAppointments: vi.fn().mockResolvedValue([]), listVehicleIntakes: vi.fn().mockResolvedValue([]), listVehicleOutcomes: vi.fn().mockResolvedValue([]), updateRepairAppointment: vi.fn(), updateVehicleIntake: vi.fn(),
}));
vi.mock('@/modules/auth/providers/session-provider', () => ({ useSession: () => ({ session: { user: { id: 1 }, scopes: [] } }) }));
vi.mock('@/modules/cases/api/third-party-api', () => ({ getThirdParty: vi.fn() }));
vi.mock('@/shared/api/http-client', () => ({ requestJson: vi.fn().mockResolvedValue([]) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const renderPanel = () => {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'TODO_RIESGO', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);
};

describe('repair part receipt ledger', () => {
  it('renders API-persisted receipts after reload and keeps physical receipt status separate from operational and insurance statuses', async () => {
    partsApi.list.mockResolvedValue([{ id: 7, description: 'Óptica', statusCode: 'ENCARGADO', authorizationCode: 'AUTORIZADO', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE', orderedQuantity: 5, receivedQuantity: 3, receiptStatus: 'PARCIAL', receipts: [{ id: 11, quantity: 1, receiptDate: '2026-10-02' }, { id: 12, quantity: 2, receiptDate: '2026-10-08' }] }]);

    const firstRender = renderPanel();
    expect(await screen.findByText('Recepción parcial')).toBeInTheDocument();
    expect(screen.getByText('Encargado')).toBeInTheDocument();
    expect(screen.getByText('Autorizado')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Estado operativo' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Recepción física' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Autorización' })).toBeInTheDocument();
    expect(screen.getByText('/ 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Historial de recepciones de Óptica')).toHaveTextContent('1 u. · 2026-10-02');
    expect(screen.getByLabelText('Historial de recepciones de Óptica')).toHaveTextContent('2 u. · 2026-10-08');

    firstRender.unmount();
    renderPanel();
    expect(await screen.findByText('Recepción parcial')).toBeInTheDocument();
    expect(screen.getByLabelText('Historial de recepciones de Óptica')).toHaveTextContent('2 u. · 2026-10-08');
  });

  it('corrects and deletes one receipt without removing the other', async () => {
    const user = userEvent.setup();
    let receipts = [{ id: 11, quantity: 1, receiptDate: '2026-10-02' }, { id: 12, quantity: 2, receiptDate: '2026-10-08' }];
    partsApi.list.mockImplementation(() => Promise.resolve([{ id: 7, description: 'Óptica', statusCode: 'ENCARGADO', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE', orderedQuantity: 5, receivedQuantity: receipts.reduce((total, receipt) => total + receipt.quantity, 0), receiptStatus: 'PARCIAL', receipts }]));
    partsApi.updateReceipt.mockImplementation((_caseId, _partId, receiptId, payload) => { receipts = receipts.map((receipt) => receipt.id === receiptId ? { ...receipt, ...payload } : receipt); return Promise.resolve({}); });
    partsApi.deleteReceipt.mockImplementation((_caseId, _partId, receiptId) => { receipts = receipts.filter((receipt) => receipt.id !== receiptId); return Promise.resolve(); });

    renderPanel();
    await user.click(await screen.findByRole('button', { name: 'Editar recepción 2026-10-02' }));
    await user.clear(screen.getByLabelText('Cantidad recibida'));
    await user.type(screen.getByLabelText('Cantidad recibida'), '3');
    await user.click(screen.getByRole('button', { name: 'Guardar recepción' }));
    await waitFor(() => expect(partsApi.updateReceipt).toHaveBeenCalledWith('42', 7, 11, { quantity: 3, receiptDate: '2026-10-02' }));
    await waitFor(() => expect(screen.getByLabelText('Historial de recepciones de Óptica')).toHaveTextContent('3 u. · 2026-10-02'));

    await user.click(screen.getByRole('button', { name: 'Eliminar recepción 2026-10-02' }));
    await waitFor(() => expect(partsApi.deleteReceipt).toHaveBeenCalledWith('42', 7, 11));
    await waitFor(() => expect(screen.getByLabelText('Historial de recepciones de Óptica')).toHaveTextContent('2 u. · 2026-10-08'));
    expect(screen.getByLabelText('Historial de recepciones de Óptica')).not.toHaveTextContent('2026-10-02');
  });

  it('saves ordered quantity through consolidated editing without replacing receipt history', async () => {
    const user = userEvent.setup();
    partsApi.list.mockResolvedValue([{ id: 7, description: 'Óptica', statusCode: 'ENCARGADO', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE', orderedQuantity: 3, receivedQuantity: 2, receiptStatus: 'PARCIAL', receipts: [{ id: 12, quantity: 2, receiptDate: '2026-10-08' }] }]);
    partsApi.updatePart.mockResolvedValue({});

    renderPanel();
    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    await user.clear(screen.getByLabelText('Cantidad pedida Óptica'));
    await user.type(screen.getByLabelText('Cantidad pedida Óptica'), '5');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(partsApi.updatePart).toHaveBeenCalledWith('42', 7, expect.objectContaining({ orderedQuantity: 5 })));
    expect(screen.getByLabelText('Historial de recepciones de Óptica')).toHaveTextContent('2 u. · 2026-10-08');
  });
});
