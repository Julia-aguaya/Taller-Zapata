import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PaymentsEditorPanel } from './payments-editor-panel';

const mockCreateFinancialMovement = vi.fn().mockResolvedValue({ id: 1 });
const mockCreateReceipt = vi.fn().mockResolvedValue({ id: 10 });
const mockGetFinanceCatalogs = vi.fn().mockResolvedValue({ paymentMethodCodes: [], cancellationTypeCodes: [] });
const mockListFinancialMovements = vi.fn().mockResolvedValue([]);
const mockListReceipts = vi.fn().mockResolvedValue([]);
const mockInvalidateQueries = vi.fn();
const mockRefetchQueries = vi.fn().mockResolvedValue(undefined);
let useQueryData = {};

vi.mock('@/modules/cases/api/finance-api', () => ({
  createFinancialMovement: (...a) => mockCreateFinancialMovement(...a),
  createReceipt: (...a) => mockCreateReceipt(...a),
  getFinanceCatalogs: (...a) => mockGetFinanceCatalogs(...a),
  listFinancialMovements: (...a) => mockListFinancialMovements(...a),
  listReceipts: (...a) => mockListReceipts(...a),
  getReceiptPdfUrl: (id) => `/api/v1/receipts/${id}/pdf`,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: useQueryData[JSON.stringify(queryKey)], isLoading: false }),
  useMutation: ({ mutationFn, onSuccess, onError }) => {
    const fn = vi.fn();
    fn.isPending = false;
    fn.mutate = async (...args) => {
      fn.isPending = true;
      try { const r = await mutationFn(...args); await onSuccess?.(r); } catch (e) { onError?.(e); }
      fn.isPending = false;
    };
    return fn;
  },
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries, refetchQueries: mockRefetchQueries }),
}));

vi.mock('@/modules/auth/providers/session-provider', () => ({
  useSession: () => ({ session: { user: { id: 1 } } }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const baseProps = {
  caseId: 42,
  caseDetail: { principalCustomerPersonId: 1, principalCustomerName: 'Juan', principalVehiclePlate: 'ABC123' },
  budget: { items: [{ laborAmount: 100000, partValue: 50000 }, { laborAmount: 50000, partValue: 20000 }] },
  particularFinanceSummary: { customerPaid: 0, pendingBalance: 220000, quotedTotal: 220000, hasAdvancePayment: false, paidInFull: false },
  onSaved: vi.fn(),
};

const mount = () => {
  useQueryData = {};
  return render(<PaymentsEditorPanel {...baseProps} />);
};

describe('PaymentsEditorPanel', () => {
  it('shows cliente and vehiculo from case detail', () => {
    mount();
    expect(screen.getByText('Juan')).toBeTruthy();
    expect(screen.getByText('ABC123')).toBeTruthy();
  });

  it('calculates total con IVA for comprobante A (default)', () => {
    mount();
    // MO=150000 + 21%=31500 + Rep=70000 = 251500
    const elements = screen.getAllByText(/\$ *251\.500/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders seña, cancela, modo, and factura selects', () => {
    mount();
    expect(screen.getByText('Seña')).toBeTruthy();
    expect(screen.getByText('Cancela saldo')).toBeTruthy();
    expect(screen.getByText('Modo')).toBeTruthy();
    expect(screen.getByText('Factura')).toBeTruthy();
  });

  it('renders Registrar pago button', () => {
    mount();
    expect(screen.getByText('Registrar pago')).toBeTruthy();
  });

  it('shows historial section', () => {
    mount();
    expect(screen.getByText('Historial de movimientos')).toBeTruthy();
  });

  it('calls createFinancialMovement on save', async () => {
    mount();
    const montoInput = document.querySelector('input[type="number"]');
    if (montoInput) fireEvent.change(montoInput, { target: { value: '100000' } });
    fireEvent.click(screen.getByText('Registrar pago'));
    await waitFor(() => expect(mockCreateFinancialMovement).toHaveBeenCalled());
  });

  it('shows factura fields when Factura = SI', () => {
    mount();
    const selects = document.querySelectorAll('select');
    const facturaSelect = Array.from(selects).find(s => s.parentElement?.textContent?.includes('Factura'));
    if (facturaSelect) fireEvent.change(facturaSelect, { target: { value: 'SI' } });
    expect(screen.getByText('Razón social')).toBeTruthy();
    expect(screen.getByText('N° factura')).toBeTruthy();
  });
});
