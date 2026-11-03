import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { invalidateCaseProjection, updateWorkspaceLatestAppointment } from './repair-editor-panel';

const partsApi = { list: vi.fn(), sync: vi.fn(), resolveWarning: vi.fn(), catalogs: vi.fn(), update: vi.fn(), createReceipt: vi.fn(), updateReceipt: vi.fn(), deleteReceipt: vi.fn(), downloadLabel: vi.fn() };
const requestJson = vi.fn().mockResolvedValue([]);
const getThirdParty = vi.fn().mockResolvedValue({ partsProvisionModeCode: 'TALLER' });
const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const { sessionState } = vi.hoisted(() => ({ sessionState: { current: { user: { id: 1 }, scopes: [{ organizationId: null, branchId: null }] } } }));
vi.mock('@/modules/cases/api/third-party-api', () => ({ getThirdParty: (...args) => getThirdParty(...args) }));
vi.mock('@/modules/cases/api/parts-api', () => ({
  createCasePart: vi.fn(), deleteCasePart: vi.fn(), updateCasePart: (...args) => partsApi.update(...args),
  listCaseParts: (...args) => partsApi.list(...args), syncPartsFromBudget: (...args) => partsApi.sync(...args), resolvePartReconciliationWarning: (...args) => partsApi.resolveWarning(...args), getPartsCatalogs: (...args) => partsApi.catalogs(...args),
  listRepairParts: (...args) => partsApi.list(...args), updateRepairPart: (...args) => partsApi.update(...args),
  createRepairPartReceipt: (...args) => partsApi.createReceipt(...args), updateRepairPartReceipt: (...args) => partsApi.updateReceipt(...args), deleteRepairPartReceipt: (...args) => partsApi.deleteReceipt(...args), downloadRepairPartLabel: (...args) => partsApi.downloadLabel(...args),
}));
const operationsApi = { create: vi.fn(), remove: vi.fn(), update: vi.fn(), list: vi.fn().mockResolvedValue([]), intakes: vi.fn().mockResolvedValue([]), updateIntake: vi.fn() };
vi.mock('@/modules/cases/api/operations-api', () => ({ createRepairAppointment: (...args) => operationsApi.create(...args), deleteRepairAppointment: (...args) => operationsApi.remove(...args), createVehicleIntake: vi.fn(), createVehicleOutcome: vi.fn(), getOperationCatalogs: vi.fn().mockResolvedValue({}), listRepairAppointments: (...args) => operationsApi.list(...args), listVehicleIntakes: (...args) => operationsApi.intakes(...args), listVehicleOutcomes: vi.fn().mockResolvedValue([]), updateRepairAppointment: (...args) => operationsApi.update(...args), updateVehicleIntake: (...args) => operationsApi.updateIntake(...args) }));
vi.mock('@/modules/auth/providers/session-provider', () => ({ useSession: () => ({ session: sessionState.current }) }));
vi.mock('@/shared/api/http-client', () => ({ requestJson: (...args) => requestJson(...args) }));
vi.mock('sonner', () => ({ toast }));

describe('invalidateCaseProjection', () => {
  it('shows Gestión de pedidos for Taller and explains when the company provides parts', async () => {
    partsApi.list.mockResolvedValue([{ id: 7, description: 'Óptica', finalPrice: 120, statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' }]); partsApi.catalogs.mockResolvedValue({}); partsApi.sync.mockResolvedValue([]);
    getThirdParty.mockResolvedValueOnce({ partsProvisionModeCode: 'COMPANIA' });
    const { RepairEditorPanel } = await import('./repair-editor-panel');
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'RECLAMO_TERCEROS', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);
    expect(await screen.findByRole('button', { name: /gestión de pedidos/i })).toBeInTheDocument();
    expect(await screen.findByText(/los repuestos los provee la compañía/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
  });

  it('actualiza el resumen con el turno recién guardado sin esperar el refetch', () => {
    const workspace = {
      latestAppointment: { id: 8, appointmentDate: '2026-09-27', appointmentTime: '08:00' },
      widgets: { repair: { hasAppointment: true, hasIntake: false, hasDefinitiveOutcome: false } },
    };

    const updated = updateWorkspaceLatestAppointment(workspace, { id: 9, appointmentDate: '2026-09-28', appointmentTime: '08:00' });

    expect(updated.latestAppointment).toMatchObject({ id: 9, appointmentDate: '2026-09-28', appointmentTime: '08:00' });
  });

  it('no reemplaza el resumen con un turno anterior distinto', () => {
    const latest = { id: 9, appointmentDate: '2026-09-28', appointmentTime: '08:00' };
    const workspace = { latestAppointment: latest, widgets: { repair: { hasAppointment: true } } };

    expect(updateWorkspaceLatestAppointment(workspace, { id: 8, appointmentDate: '2026-09-27', appointmentTime: '08:00' })).toBe(workspace);
  });
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

  it('keeps PARTICULAR repair actions separate from commercial budget synchronization', async () => {
    partsApi.list.mockResolvedValue([{ id: 7, description: 'Paragolpes', statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' }]);
    partsApi.catalogs.mockResolvedValue({});
    partsApi.sync.mockResolvedValue([]);
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    expect(screen.queryByRole('button', { name: 'Sincronizar repuestos' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Traer repuestos desde comparación' })).toBeNull();
    expect(await screen.findByRole('button', { name: 'No debe repararse' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Inventario' })).toBeNull();
    expect(screen.queryByRole('columnheader', { name: 'Autorizado' })).toBeNull();
    expect(screen.queryByLabelText('Autorización Paragolpes')).toBeNull();
    expect(partsApi.sync).not.toHaveBeenCalled();
  });

  it('does not invoke commercial synchronization from PARTICULAR repair management', async () => {
    partsApi.list.mockResolvedValue([]);
    partsApi.catalogs.mockResolvedValue({});
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    expect(screen.queryByRole('button', { name: 'Sincronizar repuestos' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Traer repuestos desde comparación' })).toBeNull();
    expect(partsApi.sync).not.toHaveBeenCalled();
  });

  it('does not invoke commercial synchronization for Taller third-party claims', async () => {
    partsApi.sync.mockClear();
    partsApi.list.mockResolvedValue([]);
    partsApi.catalogs.mockResolvedValue({});
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'RECLAMO_TERCEROS', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    expect(partsApi.sync).not.toHaveBeenCalled();
  });

  it('does not offer commercial part creation from repair management', async () => {
    partsApi.list.mockResolvedValue([]);
    partsApi.catalogs.mockResolvedValue({});
    const { RepairEditorPanel } = await import('./repair-editor-panel');
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);
    await screen.findByRole('button', { name: 'Editar' });
    expect(screen.queryByRole('button', { name: 'Agregar repuesto extra' })).toBeNull();
  });

  it('keeps the displayed part data when label generation fails', async () => {
    const user = userEvent.setup();
    partsApi.list.mockResolvedValue([{ id: 7, description: 'Paragolpes', statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' }]);
    partsApi.catalogs.mockResolvedValue({});
    partsApi.downloadLabel.mockRejectedValue(new Error('Servicio PDF no disponible'));
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    await user.click(await screen.findByRole('button', { name: 'Descargar etiqueta Paragolpes' }));

    await waitFor(() => expect(partsApi.downloadLabel).toHaveBeenCalledWith('42', 7));
    expect(screen.getByText('Paragolpes')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Los datos del repuesto no se modificaron'));
  });

  it('shows the part identifier and prevents receipt registration when authorization is rejected', async () => {
    partsApi.list.mockResolvedValue([{ id: 7, description: 'Paragolpes', authorizationCode: 'RECHAZADO', statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' }]);
    partsApi.catalogs.mockResolvedValue({ authorizationCodes: [{ code: 'RECHAZADO', name: 'Rechazado' }] });
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'TODO_RIESGO', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    expect(await screen.findByText('REP-7')).toBeInTheDocument();
    expect(screen.getByText('No se puede registrar recepción: autorización rechazada.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Agregar recepción Paragolpes' })).toBeNull();
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

  it.each(['PARTICULAR', 'TODO_RIESGO', 'GRANIZO'])('does not run a commercial sync for repair cases: %s', async (caseTypeCode) => {
    partsApi.list.mockResolvedValue([]);
    partsApi.catalogs.mockResolvedValue({});
    partsApi.sync.mockResolvedValue([]);
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode, visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    await screen.findByText(/Sin repuestos operativos para gestionar/i);
    expect(partsApi.sync).not.toHaveBeenCalled();
  });

  it.each(['PARTICULAR', 'TODO_RIESGO', 'GRANIZO', 'CLEAS', 'RECLAMO_TERCEROS', 'RECLAMO_TERCEROS_ABOGADO', 'RECUPERO_FRANQUICIA'])('offers no-repair and revert actions for every case type: %s', async (caseTypeCode) => {
    partsApi.list.mockResolvedValue([]);
    partsApi.catalogs.mockResolvedValue({});
    partsApi.sync.mockResolvedValue([]);
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    const { rerender } = render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode, visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    expect(await screen.findByRole('button', { name: 'No debe repararse' })).toBeInTheDocument();

    rerender(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode, visibleRepairState: { code: 'NO_DEBE_REPARARSE' } }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);
    expect(await screen.findByRole('button', { name: 'Volver a automático' })).toBeInTheDocument();
  });

  it('submits the mandatory reason through the universal endpoint', async () => {
    const user = userEvent.setup();
    requestJson.mockClear();
    partsApi.list.mockResolvedValue([]);
    partsApi.catalogs.mockResolvedValue({});
    const { RepairEditorPanel } = await import('./repair-editor-panel');
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    await screen.findByRole('button', { name: 'No debe repararse' });
    requestJson.mockClear();
    await user.click(screen.getByRole('button', { name: 'No debe repararse' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(toast.error).toHaveBeenCalledWith('El motivo es obligatorio.');
    expect(requestJson).not.toHaveBeenCalled();

    await user.type(screen.getByRole('textbox'), 'Daño estructural');
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(requestJson).toHaveBeenCalledWith('/cases/42/repair/no-repair', expect.objectContaining({ method: 'POST', body: JSON.stringify({ reason: 'Daño estructural' }) })));
  });

  it('does not expose the action to a non-global administrator', async () => {
    sessionState.current = { user: { id: 1 }, scopes: [{ organizationId: 1, branchId: 1 }] };
    partsApi.list.mockResolvedValue([]);
    partsApi.catalogs.mockResolvedValue({});
    const { RepairEditorPanel } = await import('./repair-editor-panel');
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);
    expect(screen.queryByRole('button', { name: 'No debe repararse' })).toBeNull();
    sessionState.current = { user: { id: 1 }, scopes: [{ organizationId: null, branchId: null }] };
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

  it('keeps all part lifecycle changes in repair and does not offer deletion', async () => {
    partsApi.list.mockResolvedValue([
      { id: 7, description: 'Óptica presupuestada', sourceType: 'BUDGET_ITEM', statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' },
      { id: 8, description: 'Tornillo extra', sourceType: 'MANUAL', statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' },
    ]);
    const { RepairEditorPanel } = await import('./repair-editor-panel');

    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    await screen.findByText('Óptica presupuestada');
    expect(screen.queryByTitle('Eliminar repuesto')).toBeNull();
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

  it.each(['PROBABLE_A_CONFIRMAR', 'A_CONFIRMAR_CLIENTE', 'CONFIRMADO', 'REPROGRAMAR'])('creates an appointment with optional follow-up %s', async (followUpStatusCode) => {
    const user = userEvent.setup();
    operationsApi.create.mockResolvedValueOnce({ id: 9 });
    const { RepairEditorPanel } = await import('./repair-editor-panel');
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    await user.click(screen.getByRole('button', { name: /^Turno/ }));
    await user.selectOptions(screen.getByLabelText('Seguimiento inicial del turno'), followUpStatusCode);
    await user.click(screen.getByRole('button', { name: 'Agendar' }));

    await waitFor(() => expect(operationsApi.create).toHaveBeenLastCalledWith('42', expect.objectContaining({ followUpStatusCode })));
  });

  it('marks reprogramming, saves a new date, and preserves terminal appointments as accessible', async () => {
    const user = userEvent.setup();
    const reprogrammingAppointment = { id: 9, appointmentDate: '2026-09-15', appointmentTime: '09:00', estimatedDays: 3, estimatedExitDate: '2026-09-18', statusCode: 'PENDIENTE', followUpStatusCode: 'REPROGRAMAR', reentry: false, userId: 1 };
    operationsApi.list.mockReset().mockResolvedValue([
      { id: 9, appointmentDate: '2026-09-15', appointmentTime: '09:00', estimatedDays: 3, estimatedExitDate: '2026-09-18', statusCode: 'PENDIENTE', followUpStatusCode: null, reentry: false, userId: 1 },
      { id: 10, appointmentDate: '2026-09-16', appointmentTime: '09:00', estimatedDays: 3, estimatedExitDate: '2026-09-19', statusCode: 'CUMPLIDO', followUpStatusCode: null, reentry: false, userId: 1 },
      { id: 11, appointmentDate: '2026-09-17', appointmentTime: '09:00', estimatedDays: 3, estimatedExitDate: '2026-09-20', statusCode: 'CANCELADO', followUpStatusCode: null, reentry: false, userId: 1 },
    ]);
    operationsApi.update.mockReset().mockImplementation(() => {
      operationsApi.list.mockResolvedValue([reprogrammingAppointment]);
      return Promise.resolve({ ...reprogrammingAppointment });
    });
    const { RepairEditorPanel } = await import('./repair-editor-panel');
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RepairEditorPanel caseId="42" caseDetail={{ caseTypeCode: 'PARTICULAR', visibleRepairState: {} }} latestAppointment={null} latestIntake={null} latestOutcome={null} onSaved={vi.fn()} /></QueryClientProvider>);

    await user.click(screen.getByRole('button', { name: /^Turno/ }));
    expect(screen.getByLabelText('Seguimiento de confirmación del turno 10')).toBeDisabled();
    expect(screen.getByLabelText('Seguimiento de confirmación del turno 11')).toBeDisabled();
    await user.selectOptions(screen.getByLabelText('Seguimiento de confirmación del turno 9'), 'REPROGRAMAR');
    await waitFor(() => expect(operationsApi.update).toHaveBeenCalledWith(9, expect.objectContaining({ followUpStatusCode: 'REPROGRAMAR' })));

    await user.click(await screen.findByRole('button', { name: 'Reprogramar fecha' }));
    fireEvent.change(screen.getByLabelText('Nueva fecha'), { target: { value: '2026-09-20' } });
    await user.click(screen.getByRole('button', { name: 'Guardar reprogramación' }));
    await waitFor(() => expect(operationsApi.update).toHaveBeenLastCalledWith(9, expect.objectContaining({ appointmentDate: '2026-09-20', followUpStatusCode: 'REPROGRAMAR' })));
  });
});
