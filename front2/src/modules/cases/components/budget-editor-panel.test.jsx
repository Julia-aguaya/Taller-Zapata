import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BudgetEditorPanel } from './budget-editor-panel';

const mockUpsertCaseBudget = vi.fn().mockResolvedValue({});
const mockCreateCaseBudgetItem = vi.fn().mockResolvedValue({});
const mockInvalidateQueries = vi.fn().mockResolvedValue({});
const session = { user: { displayName: 'Taller' } };
const budgetCatalogs = {
  taskCodes: [{ code: 'CHAPA', name: 'Chapa' }],
  damageLevelCodes: [{ code: 'LEVE', name: 'Leve' }],
  partDecisionCodes: [{ code: 'REPARAR', name: 'Reparar' }],
  actionCodes: [{ code: 'REPARAR', name: 'Reparar' }],
};

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey[0] === 'budget' ? budgetCatalogs : [], isLoading: false }),
  useMutation: ({ mutationFn, onSuccess }) => ({ isPending: false, mutate: async (variables) => { await mutationFn(variables); await onSuccess?.({}, variables); } }),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock('@/modules/cases/api/budget-api', () => ({
  upsertCaseBudget: (...args) => mockUpsertCaseBudget(...args),
  createCaseBudgetItem: (...args) => mockCreateCaseBudgetItem(...args),
  updateCaseBudgetItem: vi.fn(),
  closeCaseBudget: vi.fn(),
}));
vi.mock('@/modules/cases/api/budget-catalogs-api', () => ({ getBudgetCatalogs: vi.fn() }));
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
  return <BudgetEditorPanel caseId="42" budget={validBudget} caseDetail={caseTypeCode === 'PARTICULAR' ? particularCaseDetail : insuranceCaseDetail} workshopInfo={{}} accessoryUi={accessoryUi} onAccessoryUiChange={setAccessoryUi} onAddAccessoryWork={() => setAccessoryUi((current) => ({ ...current, works: [...current.works, { id: 'extra-1', detail: '', amount: '', includesReplacement: 'NO', replacementPiece: '', replacementAmount: '' }] }))} />;
};

describe('BudgetEditorPanel accessory work', () => {
  it('shows extras for non-PARTICULAR cases, calculates labor plus replacement, and keeps them out of the budget save', async () => {
    mockUpsertCaseBudget.mockClear();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<AccessoryHarness caseTypeCode="TODO_RIESGO" />);

    expect(screen.getByRole('heading', { name: 'Trabajos extras' })).toBeInTheDocument();
    expect(screen.getByLabelText('Trabajos extras')).toHaveValue('NO');
    expect(screen.getByLabelText('Trabajos extras')).toHaveTextContent('No');
    expect(screen.getByLabelText('Trabajos extras')).toHaveTextContent('Sí');
    expect(screen.getByLabelText('IVA')).toHaveValue('21');
    expect(screen.getByLabelText('IVA')).toHaveTextContent('21%');
    expect(screen.getByText(/no hay trabajos extras incluidos/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Trabajos extras'), { target: { value: 'SI' } });
    fireEvent.click(screen.getByRole('button', { name: /agregar trabajo extra/i }));
    expect(screen.getByLabelText('Pieza afectada')).toBeInTheDocument();
    fireEvent.change(controlFor('Total MO'), { target: { value: '120000' } });
    fireEvent.change(controlFor('Incluye repuesto'), { target: { value: 'SI' } });
    fireEvent.change(controlFor('Monto repuesto'), { target: { value: '30000' } });

    expect(screen.getByLabelText('Cotizado')).toHaveValue('$ 150.000,00');
    fireEvent.change(screen.getByLabelText('IVA'), { target: { value: '10.5' } });
    expect(screen.getByLabelText('IVA')).toHaveValue('10.5');
    expect(screen.getByLabelText('Cotizado')).toHaveValue('$ 150.000,00');
    const replacementSelect = controlFor('Incluye repuesto');
    fireEvent.change(replacementSelect, { target: { value: 'NO' } });
    expect(screen.getByLabelText('Cotizado')).toHaveValue('$ 120.000,00');
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    await waitFor(() => expect(mockUpsertCaseBudget).toHaveBeenCalled());
    expect(JSON.stringify(mockUpsertCaseBudget.mock.calls[0][1])).not.toContain('accessory');
    expect(mockUpsertCaseBudget.mock.calls[0][1]).toMatchObject({ laborWithoutVat: 0, partsTotal: 0 });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('hides extras for PARTICULAR cases', () => {
    render(<AccessoryHarness caseTypeCode="PARTICULAR" />);
    expect(screen.queryByLabelText('Trabajos extras')).toBeNull();
  });
});
