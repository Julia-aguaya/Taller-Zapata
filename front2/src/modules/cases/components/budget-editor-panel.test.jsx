import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BudgetEditorPanel } from './budget-editor-panel';

const mockUpsertCaseBudget = vi.fn().mockResolvedValue({});
const mockCreateCaseBudgetItem = vi.fn().mockResolvedValue({});
const mockGenerateCaseBudget = vi.fn().mockResolvedValue({ comparisonSnapshot: { importedPieceCount: 1 } });
const mockSyncPartsFromBudget = vi.fn().mockResolvedValue([]);
const mockInvalidateQueries = vi.fn().mockResolvedValue({});
const requestJson = vi.fn().mockResolvedValue([]);
const session = { user: { displayName: 'Taller' }, authorities: ['presupuesto.ver', 'proveedor.ver', 'documento.subir', 'documento.relacionar'] };
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
vi.mock('@/shared/api/http-client', () => ({ requestJson: (...args) => requestJson(...args) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const validBudget = { items: [{ id: 1, visualOrder: 1, affectedPiece: 'Puerta', taskCode: 'CHAPA', damageLevelCode: 'LEVE', partDecisionCode: 'REPARAR', actionCode: 'REPARAR', partValue: 0, laborAmount: 0, estimatedHours: 0, active: true }] };
const threeItemBudget = { items: ['Puerta', 'Capot', 'Guardabarros'].map((affectedPiece, index) => ({ ...validBudget.items[0], id: index + 1, visualOrder: index + 1, affectedPiece })) };
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const controlFor = (label) => screen.getByText(label).parentElement.querySelector('input, select');
const particularCaseDetail = { caseTypeCode: 'PARTICULAR', principalCustomerName: 'Juan', principalVehiclePlate: 'ABC123' };
const insuranceCaseDetail = { caseTypeCode: 'TODO_RIESGO', principalCustomerName: 'Juan', principalVehiclePlate: 'ABC123' };

afterEach(() => {
  catalogsReady = true;
  mockInvalidateQueries.mockClear();
  requestJson.mockReset();
  requestJson.mockResolvedValue([]);
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
    // Regresión: la Idempotency-Key debe ser un UUID v4 válido incluso en
    // contextos inseguros (HTTP), donde crypto.randomUUID no existe.
    expect(mockGenerateCaseBudget).toHaveBeenCalledWith('42', expect.anything(), expect.stringMatching(UUID_V4));
  });

  it('does not expose comparison data or actions without presupuesto.ver', () => {
    session.authorities = [];
    render(<BudgetEditorPanel caseId="42" budget={validBudget} caseDetail={particularCaseDetail} workshopInfo={{}} />);
    expect(screen.queryByRole('tab', { name: 'Comparación' })).toBeNull();
    expect(screen.queryByRole('tabpanel', { name: 'Comparación' })).toBeNull();
    session.authorities = ['presupuesto.ver', 'proveedor.ver', 'documento.subir', 'documento.relacionar'];
  });

  it('persists the deletion of a middle row without requiring a separate save', async () => {
    render(<BudgetEditorPanel caseId="42" budget={threeItemBudget} caseDetail={particularCaseDetail} workshopInfo={{}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar tarea 2' }));

    await waitFor(() => expect(mockUpsertCaseBudget).toHaveBeenCalledWith('42', expect.objectContaining({
      items: expect.arrayContaining([
        expect.objectContaining({ affectedPiece: 'Puerta', visualOrder: 1 }),
        expect.objectContaining({ affectedPiece: 'Guardabarros', visualOrder: 3 }),
      ]),
    })));
    expect(mockUpsertCaseBudget.mock.calls.at(-1)[1].items).toHaveLength(2);
  });

  it('does not restore inactive budget rows after refreshing the budget data', () => {
    render(<BudgetEditorPanel caseId="42" budget={{ items: [{ ...validBudget.items[0], active: false }] }} caseDetail={particularCaseDetail} workshopInfo={{}} />);

    expect(screen.queryByDisplayValue('Puerta')).not.toBeInTheDocument();
  });

  it('uploads each selected budget attachment with the case id and budget relation', async () => {
    const uploadIds = [91, 92];
    const uploadSessionIds = ['00000000-0000-4000-8000-000000000091', '00000000-0000-4000-8000-000000000092'];
    requestJson.mockImplementation((url) => {
      if (url === '/documents/catalogs') return Promise.resolve({ categories: [{ id: 8, code: 'OTRO' }] });
      if (url === '/document-uploads') return Promise.resolve({ uploadId: uploadSessionIds.shift(), nextChunk: 0, chunkCount: 1 });
      if (url.endsWith('/complete')) return Promise.resolve({ id: uploadIds.shift() });
      return Promise.resolve({});
    });
    const { container } = render(<BudgetEditorPanel caseId="42" budget={validBudget} caseDetail={particularCaseDetail} workshopInfo={{}} />);

    fireEvent.click(screen.getByRole('button', { name: /agregar archivos/i }));
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [new File(['a'], 'uno.pdf', { type: 'application/pdf' }), new File(['b'], 'dos.pdf', { type: 'application/pdf' })] } });

    await waitFor(() => expect(requestJson).toHaveBeenCalledWith('/document-uploads', expect.objectContaining({ method: 'POST' })));
    const firstUploadRequest = requestJson.mock.calls.find(([url]) => url === '/document-uploads')[1];
    expect(JSON.parse(firstUploadRequest.body)).toMatchObject({ caseId: 42, categoryId: 8, chunkCount: 1 });
    await waitFor(() => expect(requestJson).toHaveBeenCalledWith('/documents/91/relations', expect.objectContaining({ method: 'POST' })));
  });
});
