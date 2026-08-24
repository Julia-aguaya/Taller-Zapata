import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BudgetEditorPanel } from './budget-editor-panel';

const mockUpsertCaseBudget = vi.fn().mockResolvedValue({});
const mockCreateCaseBudgetItem = vi.fn().mockResolvedValue({});
const mockGenerateCaseBudget = vi.fn().mockResolvedValue({ comparisonSnapshot: { importedPieceCount: 1 } });
const mockSyncPartsFromBudget = vi.fn().mockResolvedValue([]);
const mockInvalidateQueries = vi.fn().mockResolvedValue({});
const session = { user: { displayName: 'Taller' }, authorities: ['presupuesto.ver', 'proveedor.ver'] };
const budgetCatalogs = {
  taskCodes: [{ code: 'CHAPA', name: 'Chapa' }],
  damageLevelCodes: [{ code: 'LEVE', name: 'Leve' }],
  partDecisionCodes: [{ code: 'REPARAR', name: 'Reparar' }],
  actionCodes: [{ code: 'REPARAR', name: 'Reparar' }, { code: 'REEMPLAZAR_Y_PINTAR', name: 'Reemplazar y pintar' }],
};

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey[0] === 'budget' ? budgetCatalogs : [], isLoading: false }),
  useMutation: ({ mutationFn, onSuccess }) => ({ isPending: false, mutate: async (variables) => { const response = await mutationFn(variables); await onSuccess?.(response, variables); } }),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock('@/modules/cases/api/budget-api', () => ({
  upsertCaseBudget: (...args) => mockUpsertCaseBudget(...args),
  createCaseBudgetItem: (...args) => mockCreateCaseBudgetItem(...args),
  updateCaseBudgetItem: vi.fn(),
  closeCaseBudget: vi.fn(),
  generateCaseBudget: (...args) => mockGenerateCaseBudget(...args),
}));
vi.mock('@/modules/cases/api/budget-catalogs-api', () => ({ getBudgetCatalogs: vi.fn() }));
vi.mock('@/modules/cases/api/parts-api', () => ({ syncPartsFromBudget: (...args) => mockSyncPartsFromBudget(...args) }));
vi.mock('@/modules/cases/components/provider-selector', () => ({ ProviderSelector: () => <input />, providerPayload: vi.fn() }));
vi.mock('@/modules/auth/providers/session-provider', () => ({ useSession: () => ({ session }) }));
vi.mock('@/shared/api/http-client', () => ({ requestJson: vi.fn().mockResolvedValue([]) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const validBudget = { items: [{ id: 1, visualOrder: 1, affectedPiece: 'Puerta', taskCode: 'CHAPA', damageLevelCode: 'LEVE', partDecisionCode: 'REPARAR', actionCode: 'REPARAR', partValue: 0, laborAmount: 0, estimatedHours: 0, active: true }] };
const controlFor = (label) => screen.getByText(label).parentElement.querySelector('input, select');
const particularCaseDetail = { caseTypeCode: 'PARTICULAR', principalCustomerName: 'Juan', principalVehiclePlate: 'ABC123' };
const insuranceCaseDetail = { caseTypeCode: 'TODO_RIESGO', principalCustomerName: 'Juan', principalVehiclePlate: 'ABC123' };

const AccessoryHarness = ({ caseTypeCode }) => {
  const [accessoryUi, setAccessoryUi] = useState({ enabled: 'NO', works: [], notes: '', payments: [], paymentDraft: {} });
  return <BudgetEditorPanel caseId="42" budget={validBudget} caseDetail={caseTypeCode === 'PARTICULAR' ? particularCaseDetail : insuranceCaseDetail} workshopInfo={{}} accessoryUi={accessoryUi} onAccessoryUiChange={setAccessoryUi} onAddAccessoryWork={() => setAccessoryUi((current) => ({ ...current, works: [...current.works, { id: 'extra-1', affectedPiece: '', actionCode: '', damageLevelCode: '', replacementAmount: '' }] }))} />;
};

describe('BudgetEditorPanel accessory work', () => {
  it('reconciles only after all TODO_RIESGO budget lines persist and explains the automatic flow', async () => {
    mockUpsertCaseBudget.mockClear();
    mockCreateCaseBudgetItem.mockClear();
    mockSyncPartsFromBudget.mockClear();
    render(<AccessoryHarness caseTypeCode="TODO_RIESGO" />);

    expect(screen.getByText(/al guardar o generar.*se sincronizan automáticamente/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    await waitFor(() => expect(mockUpsertCaseBudget).toHaveBeenCalled());
    await waitFor(() => expect(mockSyncPartsFromBudget).toHaveBeenCalledWith('42'));
  });

  it('saves and reloads the permitted extra-work fields without affecting technical totals', async () => {
    mockUpsertCaseBudget.mockClear();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<AccessoryHarness caseTypeCode="TODO_RIESGO" />);

    expect(screen.getByRole('heading', { name: 'Trabajos extras' })).toBeInTheDocument();
    expect(screen.getByLabelText('Trabajos extras')).toHaveValue('NO');
    expect(screen.getByLabelText('Trabajos extras')).toHaveTextContent('No');
    expect(screen.getByLabelText('Trabajos extras')).toHaveTextContent('Sí');
    expect(screen.getByText(/no hay trabajos extras incluidos/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Trabajos extras'), { target: { value: 'SI' } });
    fireEvent.click(screen.getByRole('button', { name: /agregar trabajo extra/i }));
    expect(screen.getByLabelText('Pieza afectada')).toBeInTheDocument();
    expect(screen.getByLabelText('Tarea a ejecutar')).toHaveTextContent('Reemplazar y pintar');
    fireEvent.change(screen.getByLabelText('Tarea a ejecutar'), { target: { value: 'REEMPLAZAR_Y_PINTAR' } });
    fireEvent.change(screen.getByLabelText('Nivel de daño'), { target: { value: 'LEVE' } });
    fireEvent.change(screen.getByLabelText('$ Repuestos'), { target: { value: '30000' } });

    expect(screen.getByLabelText('Cotizado')).toHaveValue('$ 30.000,00');
    expect(screen.queryByLabelText('Total MO')).toBeNull();
    expect(screen.queryByLabelText('Incluye repuesto')).toBeNull();
    expect(screen.queryByLabelText('Cliente confirma')).toBeNull();
    expect(screen.queryByLabelText('IVA')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    await waitFor(() => expect(mockUpsertCaseBudget).toHaveBeenCalled());
    expect(mockUpsertCaseBudget.mock.calls[0][1].accessoryWorks).toEqual([{ id: null, affectedPiece: null, actionCode: 'REEMPLAZAR_Y_PINTAR', damageLevelCode: 'LEVE', replacementAmount: 30000 }]);
    expect(mockUpsertCaseBudget.mock.calls[0][1]).toMatchObject({ laborWithoutVat: 0, partsTotal: 0 });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('shows persisted extra work after the budget is reloaded', () => {
    render(<BudgetEditorPanel caseId="42" budget={{ ...validBudget, accessoryWorks: [{ id: 77, affectedPiece: 'Moldura lateral', actionCode: 'REEMPLAZAR_Y_PINTAR', damageLevelCode: 'LEVE', replacementAmount: 30000 }] }} caseDetail={insuranceCaseDetail} workshopInfo={{}} accessoryUi={{ enabled: 'SI', works: [{ id: 77, affectedPiece: 'Moldura lateral', actionCode: 'REEMPLAZAR_Y_PINTAR', damageLevelCode: 'LEVE', replacementAmount: '30000' }] }} onAccessoryUiChange={vi.fn()} onAddAccessoryWork={vi.fn()} />);
    expect(screen.getByLabelText('Pieza afectada')).toHaveValue('Moldura lateral');
    expect(screen.getByLabelText('Tarea a ejecutar')).toHaveValue('REEMPLAZAR_Y_PINTAR');
    expect(screen.getByLabelText('Nivel de daño')).toHaveValue('LEVE');
    expect(screen.getByLabelText('$ Repuestos')).toHaveValue(30000);
  });

  it('hides extras for PARTICULAR cases', () => {
    render(<AccessoryHarness caseTypeCode="PARTICULAR" />);
    expect(screen.queryByLabelText('Trabajos extras')).toBeNull();
  });
});

describe('BudgetEditorPanel comparison tabs', () => {
  it('moves keyboard focus between semantic subtabs and announces the generated comparison', async () => {
    const { BudgetEditorPanel } = await import('./budget-editor-panel');
    render(<BudgetEditorPanel caseId="42" budget={validBudget} caseDetail={particularCaseDetail} workshopInfo={{}} accessoryUi={{ enabled: 'NO' }} onAccessoryUiChange={vi.fn()} />);
    const contentTab = screen.getByRole('tab', { name: 'Contenido actual' });
    contentTab.focus(); fireEvent.keyDown(contentTab, { key: 'ArrowRight' });
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Comparación' })).toHaveFocus());
    expect(screen.getByRole('tabpanel', { name: 'Comparación' })).not.toHaveAttribute('hidden');
    fireEvent.click(screen.getByRole('button', { name: /generar presupuesto/i }));
    await waitFor(() => expect(screen.getByText(/se importaron 1 piezas/i)).toBeInTheDocument());
  });

  it('does not expose comparison data or actions without presupuesto.ver', () => {
    session.authorities = [];
    render(<BudgetEditorPanel caseId="42" budget={validBudget} caseDetail={particularCaseDetail} workshopInfo={{}} accessoryUi={{ enabled: 'NO' }} onAccessoryUiChange={vi.fn()} />);
    expect(screen.queryByRole('tab', { name: 'Comparación' })).toBeNull();
    expect(screen.queryByRole('tabpanel', { name: 'Comparación' })).toBeNull();
    session.authorities = ['presupuesto.ver', 'proveedor.ver'];
  });
});
