import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { invalidateCaseProjection } from './repair-editor-panel';

const partsApi = { list: vi.fn(), sync: vi.fn(), resolveWarning: vi.fn(), catalogs: vi.fn(), update: vi.fn() };
const requestJson = vi.fn().mockResolvedValue([]);
vi.mock('@/modules/cases/api/parts-api', () => ({
  createCasePart: vi.fn(), deleteCasePart: vi.fn(), updateCasePart: (...args) => partsApi.update(...args),
  listCaseParts: (...args) => partsApi.list(...args), syncPartsFromBudget: (...args) => partsApi.sync(...args), resolvePartReconciliationWarning: (...args) => partsApi.resolveWarning(...args), getPartsCatalogs: (...args) => partsApi.catalogs(...args),
}));
const operationsApi = { create: vi.fn(), remove: vi.fn(), list: vi.fn().mockResolvedValue([]), intakes: vi.fn().mockResolvedValue([]), updateIntake: vi.fn() };
vi.mock('@/modules/cases/api/operations-api', () => ({ createRepairAppointment: (...args) => operationsApi.create(...args), deleteRepairAppointment: (...args) => operationsApi.remove(...args), createVehicleIntake: vi.fn(), createVehicleOutcome: vi.fn(), getOperationCatalogs: vi.fn().mockResolvedValue({}), listRepairAppointments: (...args) => operationsApi.list(...args), listVehicleIntakes: (...args) => operationsApi.intakes(...args), listVehicleOutcomes: vi.fn().mockResolvedValue([]), updateRepairAppointment: vi.fn(), updateVehicleIntake: (...args) => operationsApi.updateIntake(...args) }));
vi.mock('@/modules/auth/providers/session-provider', () => ({ useSession: () => ({ session: { user: { id: 1 }, scopes: [{ organizationId: null, branchId: null }] } }) }));
vi.mock('@/shared/api/http-client', () => ({ requestJson: (...args) => requestJson(...args) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('invalidateCaseProjection', () => {
  it('invalidates workspace, detail, list, and panel queries after state-affecting mutations', async () => {
    const queryClient = { invalidateQueries: vi.fn().mockResolvedValue(undefined) };

    await invalidateCaseProjection(queryClient, 42);

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42', 'workspace'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42', 'parts'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42', 'appointments'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42', 'intakes'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42', 'outcomes'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42', 'insurance-processing'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['panel'] });
  });

  it('keeps PARTICULAR repair actions without comparison import and synchronizes canonical parts', async () => {
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
    await waitFor(() => expect(partsApi.sync).toHaveBeenCalledWith('42'));
  });

  it('synchronizes PARTICULAR canonical parts without exposing comparison import or a draft sync command', async () => {
    partsApi.list.mockResolvedValue([]);
    partsApi.catalogs.mockResolvedValue({});
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    expect(screen.queryByRole('button', { name: 'Sincronizar repuestos' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Traer repuestos desde comparación' })).toBeNull();
    await waitFor(() => expect(partsApi.sync).toHaveBeenCalledWith('42'));
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

  it.each(['TODO_RIESGO', 'GRANIZO'])('shows authorization as read-only text for insured repair parts until editing: %s', async (caseTypeCode) => {
    partsApi.list.mockResolvedValue([{ id: 7, description: 'Paragolpes', authorizationCode: 'AUTORIZADO', statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' }]);
    partsApi.catalogs.mockResolvedValue({ authorizationCodes: [{ code: 'AUTORIZADO', name: 'Autorizado' }] });
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode, visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    expect(await screen.findByText('Autorizado')).toBeInTheDocument();
    expect(screen.queryByLabelText('Autorización Paragolpes')).toBeNull();
    expect(screen.queryByRole('columnheader', { name: 'Inventario' })).toBeNull();
    expect(screen.queryByRole('columnheader', { name: 'Autorizado' })).toBeNull();
    expect(screen.queryByTitle('Autorizar repuesto')).toBeNull();
    expect(screen.queryByTitle('Rechazar repuesto')).toBeNull();
  });

  it('keeps authorization changes in the draft and saves them in the consolidated part update', async () => {
    const user = userEvent.setup();
    partsApi.update.mockClear();
    partsApi.list.mockResolvedValue([{ id: 7, description: 'Paragolpes', authorizationCode: null, statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' }]);
    partsApi.catalogs.mockResolvedValue({ authorizationCodes: [{ code: 'AUTORIZADO', name: 'Autorizado' }] });
    partsApi.update.mockResolvedValue({});
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'TODO_RIESGO', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    expect(await screen.findByText('Paragolpes')).toBeInTheDocument();
    expect(screen.queryByLabelText('Autorización Paragolpes')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    await user.selectOptions(screen.getByLabelText('Autorización Paragolpes'), 'AUTORIZADO');
    expect(partsApi.update).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(partsApi.update).toHaveBeenCalledWith('42', 7, expect.objectContaining({ authorizationCode: 'AUTORIZADO' })));
  });

  it('discards draft authorization changes when editing is cancelled', async () => {
    const user = userEvent.setup();
    partsApi.update.mockClear();
    partsApi.list.mockResolvedValue([{ id: 7, description: 'Paragolpes', authorizationCode: null, statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' }]);
    partsApi.catalogs.mockResolvedValue({ authorizationCodes: [{ code: 'AUTORIZADO', name: 'Autorizado' }] });
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'TODO_RIESGO', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    await user.selectOptions(screen.getByLabelText('Autorización Paragolpes'), 'AUTORIZADO');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByLabelText('Autorización Paragolpes')).toBeNull();
    expect(partsApi.update).not.toHaveBeenCalled();
  });

  it.each(['PARTICULAR', 'TODO_RIESGO', 'GRANIZO'])('runs the canonical entry sync for supported repair cases: %s', async (caseTypeCode) => {
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

  it('confirms scheduling despite pending parts and sends the override', async () => {
    const user = userEvent.setup();
    operationsApi.list.mockResolvedValue([]);
    operationsApi.create.mockRejectedValueOnce(Object.assign(new Error('Se requiere confirmacion para agendar: REPUESTOS_PENDIENTES'), { httpStatus: 409 })).mockResolvedValueOnce({ id: 9 });
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    await user.click(screen.getByRole('button', { name: /^Turno/ }));
    await user.click(screen.getByRole('button', { name: 'Agendar' }));
    await user.click(await screen.findByRole('button', { name: 'Confirmar y agendar' }));
    await waitFor(() => expect(operationsApi.create).toHaveBeenLastCalledWith('42', expect.objectContaining({ overridePendingParts: true })));
  });

  it('deletes an unstarted appointment before scheduling another one', async () => {
    const user = userEvent.setup();
    operationsApi.list.mockResolvedValue([{ id: 9, appointmentDate: '2026-09-15', appointmentTime: '09:00', estimatedDays: 3, estimatedExitDate: '2026-09-18', statusCode: 'PENDIENTE', reentry: false, userId: 1 }]);
    operationsApi.remove.mockResolvedValueOnce(null);
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    await user.click(screen.getByRole('button', { name: /^Turno/ }));
    await user.click(await screen.findByRole('button', { name: 'Eliminar turno' }));
    await user.click(within(screen.getByRole('dialog', { name: '¿Eliminar turno?' })).getByRole('button', { name: 'Eliminar turno' }));
    await waitFor(() => expect(operationsApi.remove.mock.calls[0][0]).toBe(9));
  });

  it('does not offer physical deletion for an automatic reentry appointment', async () => {
    operationsApi.list.mockResolvedValue([{ id: 9, appointmentDate: '2026-09-15', appointmentTime: '09:00', estimatedDays: 3, estimatedExitDate: '2026-09-18', statusCode: 'PENDIENTE', reentry: true, userId: 1 }]);
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    await userEvent.setup().click(screen.getByRole('button', { name: /^Turno/ }));
    await screen.findByText('Reingreso automático');
    expect(screen.queryByRole('button', { name: 'Eliminar turno' })).toBeNull();
  });

  it('keeps canonical parts in the budget while allowing manual parts to be deleted', async () => {
    partsApi.list.mockResolvedValue([
      { id: 7, description: 'Óptica presupuestada', sourceType: 'BUDGET_ITEM', statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' },
      { id: 8, description: 'Tornillo extra', sourceType: 'MANUAL', statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' },
    ]);
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    expect(await screen.findByText('Gestionar en presupuesto')).toBeInTheDocument();
    expect(screen.getAllByTitle('Eliminar repuesto')).toHaveLength(1);
  });

  it('shows deleted appointments from the audit trail in repair history', async () => {
    requestJson.mockResolvedValueOnce([{ id: 45, entityType: 'turno_reparacion', actionCode: 'eliminar_turno', actorDisplayName: 'Taller', createdAt: '2026-09-22T10:30:00', beforeJson: JSON.stringify({ appointmentDate: '2026-09-20', appointmentTime: '09:00' }) }]);
    const { RepairEditorPanel } = await import('./repair-editor-panel');
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    await userEvent.setup().click(screen.getByRole('button', { name: /Historial de Movimiento/ }));
    expect(await screen.findByText('Turnos eliminados')).toBeInTheDocument();
    expect(await screen.findByText(/2026-09-20 09:00/)).toBeInTheDocument();
  });

  it('updates an existing intake and shows its observation detail', async () => {
    const user = userEvent.setup();
    operationsApi.list.mockResolvedValue([{ id: 9, appointmentDate: '2026-09-15', appointmentTime: '09:00', estimatedDays: 3, estimatedExitDate: '2026-09-17', statusCode: 'CUMPLIDO', reentry: false, userId: 1 }]);
    operationsApi.intakes.mockResolvedValue([{ id: 14, appointmentId: 9, intakeAt: '2026-09-15T09:00:00', vehicleId: 4, mileage: 10, estimatedExitDate: '2026-09-17', hasObservations: false, observationDetail: 'Rayón previo en paragolpes' }]);
    operationsApi.updateIntake.mockResolvedValue({});
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', principalVehicleId: 4, visibleRepairState: {} }} latestAppointment={{ id: 9 }} latestIntake={{ id: 14 }} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    await user.click(screen.getByRole('button', { name: /^Ingreso/ }));
    expect(await screen.findByRole('columnheader', { name: 'Km' })).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Rayón previo en paragolpes')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Modificar' }));
    const mileageInput = screen.getByDisplayValue('10');
    await user.clear(mileageInput);
    await user.type(mileageInput, '250');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(operationsApi.updateIntake).toHaveBeenCalledWith(14, expect.objectContaining({ mileage: 250, hasObservations: true, observationDetail: 'Rayón previo en paragolpes' })));

    await user.click(screen.getByRole('button', { name: /^Egreso/ }));
    expect(await screen.findByText('Rayón previo en paragolpes')).toBeInTheDocument();
  });
});
