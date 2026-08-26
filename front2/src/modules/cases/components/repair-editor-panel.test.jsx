import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { invalidateCaseProjection } from './repair-editor-panel';

const partsApi = { list: vi.fn(), sync: vi.fn(), resolveWarning: vi.fn(), catalogs: vi.fn() };
vi.mock('@/modules/cases/api/parts-api', () => ({
  createCasePart: vi.fn(), deleteCasePart: vi.fn(), updateCasePart: vi.fn(),
  listCaseParts: (...args) => partsApi.list(...args), syncPartsFromBudget: (...args) => partsApi.sync(...args), resolvePartReconciliationWarning: (...args) => partsApi.resolveWarning(...args), getPartsCatalogs: (...args) => partsApi.catalogs(...args),
}));
vi.mock('@/modules/cases/api/operations-api', () => ({ createRepairAppointment: vi.fn(), createVehicleIntake: vi.fn(), createVehicleOutcome: vi.fn(), getOperationCatalogs: vi.fn().mockResolvedValue({}), listRepairAppointments: vi.fn().mockResolvedValue([]), listVehicleIntakes: vi.fn().mockResolvedValue([]), listVehicleOutcomes: vi.fn().mockResolvedValue([]), updateRepairAppointment: vi.fn() }));
vi.mock('@/modules/auth/providers/session-provider', () => ({ useSession: () => ({ session: { user: { id: 1 } } }) }));
vi.mock('@/shared/api/http-client', () => ({ requestJson: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('invalidateCaseProjection', () => {
  it('invalidates workspace, detail, list, and panel queries after state-affecting mutations', async () => {
    const queryClient = { invalidateQueries: vi.fn().mockResolvedValue(undefined) };

    await invalidateCaseProjection(queryClient, 42);

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42', 'workspace'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42', 'insurance-processing'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['panel'] });
  });

  it('keeps PARTICULAR repair actions without comparison import or automatic sync', async () => {
    partsApi.list.mockResolvedValue([{ id: 7, description: 'Paragolpes', statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' }]);
    partsApi.catalogs.mockResolvedValue({});
    partsApi.sync.mockResolvedValue([]);
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    expect(screen.queryByRole('button', { name: 'Sincronizar repuestos' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Traer repuestos desde comparación' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'No debe repararse' })).toBeNull();
    expect(screen.queryByRole('columnheader', { name: 'Inventario' })).toBeNull();
    expect(screen.queryByRole('columnheader', { name: 'Autorizado' })).toBeNull();
    expect(screen.queryByLabelText('Autorización Paragolpes')).toBeNull();
    expect(partsApi.sync).not.toHaveBeenCalled();
  });

  it('does not expose comparison import or a draft sync command', async () => {
    partsApi.list.mockResolvedValue([]);
    partsApi.catalogs.mockResolvedValue({});
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    expect(screen.queryByRole('button', { name: 'Sincronizar repuestos' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Traer repuestos desde comparación' })).toBeNull();
    expect(partsApi.sync).not.toHaveBeenCalled();
  });

  it('adds manual parts through an accessible modal instead of an inline form', async () => {
    const user = userEvent.setup();
    partsApi.list.mockResolvedValue([]);
    partsApi.catalogs.mockResolvedValue({});
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    expect(screen.queryByPlaceholderText('Repuesto a agregar')).toBeNull();
    const trigger = screen.getByRole('button', { name: 'Agregar repuesto extra' });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Agregar repuesto extra' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Descripción'), 'Espejo extra');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(screen.getByText('Espejo extra')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Agregar repuesto extra' })).toBeNull();

    await user.click(trigger);
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Agregar repuesto extra' })).toBeNull());
    expect(trigger).toHaveFocus();
  });

  it('opens supplier search in a separate modal while editing a part', async () => {
    const user = userEvent.setup();
    partsApi.list.mockResolvedValue([{ id: 7, description: 'Paragolpes', statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' }]);
    partsApi.catalogs.mockResolvedValue({});
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    expect(screen.queryByPlaceholderText('Buscar proveedor...')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Asignar proveedor' }));
    const providerDialog = screen.getByRole('dialog', { name: 'Asignar proveedor' });
    expect(providerDialog).toBeInTheDocument();
    expect(within(providerDialog).getByPlaceholderText('Buscar proveedor...')).toBeInTheDocument();
    await user.type(within(providerDialog).getByPlaceholderText('O ingresá el proveedor manualmente'), 'Casa Norte');
    await user.click(within(providerDialog).getByRole('button', { name: 'Asignar' }));
    expect(screen.queryByRole('dialog', { name: 'Asignar proveedor' })).toBeNull();
    expect(screen.getByRole('button', { name: /Casa\s*Norte/ })).toBeInTheDocument();
  });

  it.each(['TODO_RIESGO', 'GRANIZO'])('shows the authorization selector for insured repair parts: %s', async (caseTypeCode) => {
    partsApi.list.mockResolvedValue([{ id: 7, description: 'Paragolpes', statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' }]);
    partsApi.catalogs.mockResolvedValue({ authorizationCodes: [{ code: 'AUTORIZADO', name: 'Autorizado' }] });
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode, visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    expect(await screen.findByLabelText('Autorización Paragolpes')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Inventario' })).toBeNull();
    expect(screen.queryByRole('columnheader', { name: 'Autorizado' })).toBeNull();
    expect(screen.queryByTitle('Autorizar repuesto')).toBeNull();
    expect(screen.queryByTitle('Rechazar repuesto')).toBeNull();
  });

  it.each(['TODO_RIESGO', 'GRANIZO'])('runs the canonical entry sync for insured repair cases: %s', async (caseTypeCode) => {
    partsApi.list.mockResolvedValue([]);
    partsApi.catalogs.mockResolvedValue({});
    partsApi.sync.mockResolvedValue([]);
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode, visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    await waitFor(() => expect(partsApi.sync).toHaveBeenCalledWith('42'));
  });

  it.each(['TODO_RIESGO', 'GRANIZO'])('offers no-repair and revert actions for insured repair cases: %s', async (caseTypeCode) => {
    partsApi.list.mockResolvedValue([]);
    partsApi.catalogs.mockResolvedValue({});
    partsApi.sync.mockResolvedValue([]);
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    const { rerender } = render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode, visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    expect(await screen.findByRole('button', { name: 'No debe repararse' })).toBeInTheDocument();

    rerender(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode, visibleRepairState: { code: 'NO_DEBE_REPARARSE' } }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);
    expect(await screen.findByRole('button', { name: 'Volver a automático' })).toBeInTheDocument();
  });

  it('requires and submits an audited manual resolution for an active canonical warning', async () => {
    const user = userEvent.setup();
    partsApi.list.mockResolvedValue([{ id: 7, description: 'Óptica', statusCode: 'RECIBIDO', purchasedByCode: 'TALLER', paymentStatusCode: 'PAGADO', reconciliationWarnings: [{ id: 11, partId: 7, reason: 'La fuente canónica fue removida o dejó de ser REEMPLAZAR y el repuesto tiene actividad', state: 'OPEN' }] }]);
    partsApi.catalogs.mockResolvedValue({});
    partsApi.sync.mockResolvedValue([]);
    partsApi.resolveWarning.mockResolvedValue({});
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'TODO_RIESGO', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    await user.click(await screen.findByRole('button', { name: 'Resolver manualmente' }));
    expect(screen.getByRole('dialog', { name: 'Resolver advertencia manualmente' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Resolución'), 'Se conserva hasta completar devolución.');
    await user.click(screen.getByRole('button', { name: 'Registrar resolución' }));
    await waitFor(() => expect(partsApi.resolveWarning).toHaveBeenCalledWith('42', 7, 11, 'Se conserva hasta completar devolución.'));
  });
});
