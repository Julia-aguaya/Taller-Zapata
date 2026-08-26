import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
let catalogsReady = true;

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey[0] === 'budget' && catalogsReady ? budgetCatalogs : [], isLoading: false }),
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

afterEach(() => {
  catalogsReady = true;
  mockInvalidateQueries.mockClear();
});

describe('BudgetEditorPanel comparison tabs', () => {
  it('keeps hydration stable while catalog queries have no data and updates for a new budget', () => {
    catalogsReady = false;
    const view = render(<BudgetEditorPanel caseId="42" budget={validBudget} caseDetail={particularCaseDetail} workshopInfo={{}} />);

    expect(screen.getByPlaceholderText('Ej: Guardabarros del. der.')).toHaveValue('Puerta');
    view.rerender(<BudgetEditorPanel caseId="42" budget={{ ...validBudget, items: [{ ...validBudget.items[0], affectedPiece: 'Capot' }] }} caseDetail={particularCaseDetail} workshopInfo={{}} />);

    expect(screen.getByPlaceholderText('Ej: Guardabarros del. der.')).toHaveValue('Capot');
    expect(mockInvalidateQueries).not.toHaveBeenCalled();
  });

  it('moves keyboard focus between semantic subtabs and announces the generated comparison', async () => {
    const { BudgetEditorPanel } = await import('./budget-editor-panel');
    render(<BudgetEditorPanel caseId="42" budget={validBudget} caseDetail={particularCaseDetail} workshopInfo={{}} />);
    const contentTab = screen.getByRole('tab', { name: 'Contenido actual' });
    contentTab.focus(); fireEvent.keyDown(contentTab, { key: 'ArrowRight' });
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Comparación' })).toHaveFocus());
    expect(screen.getByRole('tabpanel', { name: 'Comparación' })).not.toHaveAttribute('hidden');
    fireEvent.click(screen.getByRole('button', { name: /generar presupuesto/i }));
    await waitFor(() => expect(screen.getByText(/se importaron 1 piezas/i)).toBeInTheDocument());
  });

  it('does not expose comparison data or actions without presupuesto.ver', () => {
    session.authorities = [];
    render(<BudgetEditorPanel caseId="42" budget={validBudget} caseDetail={particularCaseDetail} workshopInfo={{}} />);
    expect(screen.queryByRole('tab', { name: 'Comparación' })).toBeNull();
    expect(screen.queryByRole('tabpanel', { name: 'Comparación' })).toBeNull();
    session.authorities = ['presupuesto.ver', 'proveedor.ver'];
  });
});
