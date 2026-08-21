import { useState } from 'react';
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

const createCleasPaymentsUi = () => ({
  billing: { insuranceCompany: '', claimNumber: '', agreementDate: '', invoiceNumber: '', businessName: '', totalAmount: '', taxableNet: '', vat: '', customerSigned: 'NO', passedToPayments: 'NO', estimatedPaymentDate: '' },
  invoiceAcknowledged: false,
  paymentDraft: { paidAt: '', status: 'PENDIENTE', depositedAmount: '', hasRetentions: 'NO', vatRetention: '', earningsRetention: '', patrimonialContribution: '', iibbRetention: '', dreiRetention: '', otherRetention: '' },
  paymentDocument: { file: null, name: '' },
});

const CleasPaymentsHarness = (props) => {
  const [cleasPaymentsUi, setCleasPaymentsUi] = useState(createCleasPaymentsUi);
  return <PaymentsEditorPanel {...props} cleasPaymentsUi={cleasPaymentsUi} onCleasPaymentsUiChange={setCleasPaymentsUi} />;
};

const mount = (overrides = {}) => {
  useQueryData = {};
  mockCreateFinancialMovement.mockClear();
  mockCreateReceipt.mockClear();
  const props = { ...baseProps, ...overrides };
  return render(props.caseDetail.caseTypeCode === 'CLEAS' ? <CleasPaymentsHarness {...props} /> : <PaymentsEditorPanel {...props} />);
};

const openPaymentForm = () => {
  fireEvent.click(screen.getAllByRole('button', { name: /registrar pago/i })[0]);
};

describe('PaymentsEditorPanel', () => {
  it('shows cliente and vehiculo from case detail', () => {
    mount();
    expect(screen.getByText('Juan')).toBeTruthy();
    expect(screen.getByText('ABC123')).toBeTruthy();
  });

  it('shows the CLEAS number in the summary and payment modal', () => {
    mount({ caseDetail: { ...baseProps.caseDetail, caseTypeCode: 'CLEAS' }, nroCleas: 'CLEAS-123' });

    expect(screen.getAllByText('N.º de CLEAS').length).toBeGreaterThan(0);
    expect(screen.getByText('CLEAS-123')).toBeTruthy();
    openPaymentForm();
    expect(screen.getByText('N.º de CLEAS: CLEAS-123')).toBeTruthy();
  });

  it('shows the CLEAS fallback when the number is blank', () => {
    mount({ caseDetail: { ...baseProps.caseDetail, caseTypeCode: 'CLEAS' }, nroCleas: '   ' });

    expect(screen.getByText('Sin número de CLEAS cargado')).toBeTruthy();
    openPaymentForm();
    expect(screen.getByText('N.º de CLEAS: Sin número de CLEAS cargado')).toBeTruthy();
  });

  it('does not show CLEAS context for non-CLEAS cases', () => {
    mount({ nroCleas: 'CLEAS-123' });

    expect(screen.queryByText('N.º de CLEAS')).toBeNull();
    openPaymentForm();
    expect(screen.queryByText(/N.º de CLEAS:/)).toBeNull();
    expect(screen.queryByText('Facturación')).toBeNull();
    expect(screen.queryByText('Datos CLEAS del pago')).toBeNull();
  });

  it('renders the visual-only CLEAS billing card with shared calculated amount and fallback', () => {
    mount({ caseDetail: { ...baseProps.caseDetail, caseTypeCode: 'CLEAS' }, nroCleas: '', cleasAgreedAmount: '125000' });

    expect(screen.getByText('Facturación')).toBeTruthy();
    expect(screen.getByLabelText('N.º de CLEAS')).toHaveValue('Sin número de CLEAS cargado');
    expect(screen.getByLabelText('N.º de CLEAS')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('A facturar Cía.')).toHaveValue('125000');
    expect(screen.getByLabelText('A facturar Cía.')).toHaveAttribute('readonly');
    ['Cía. aseguradora', 'N.º de siniestro', 'Fecha de acuerdo', 'N.º de factura', 'Razón social', 'Importe total', 'Neto gravado', 'IVA', 'Cliente firma conforme', 'Pasado a pagos', 'Fecha estimada de pago'].forEach((label) => expect(screen.getByLabelText(label)).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /agregar factura/i }));
    expect(screen.getByText('Factura agregada visualmente.')).toBeTruthy();
  });

  it('hides CLEAS billing and payment registration only after exact adverse-total closure', () => {
    mount({ caseDetail: { ...baseProps.caseDetail, caseTypeCode: 'CLEAS' }, cleasOver: 'damage', cleasOpinion: 'unfavorable', cleasClosedAt: '2026-08-20T10:00:00.000Z' });

    expect(screen.queryByText('Facturación')).toBeNull();
    expect(screen.queryByRole('button', { name: /registrar pago/i })).toBeNull();
    expect(screen.queryByLabelText('Monto depositado')).toBeNull();
  });

  it('keeps billing and payment registration available for non-exact CLEAS with a closure timestamp', () => {
    mount({ caseDetail: { ...baseProps.caseDetail, caseTypeCode: 'CLEAS' }, cleasOver: 'liability', cleasOpinion: 'unfavorable', cleasClosedAt: '2026-08-20T10:00:00.000Z' });

    expect(screen.getByText('Facturación')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /registrar pago/i }).length).toBeGreaterThan(0);
  });

  it('shows CLEAS payment draft fields and only reveals retentions when selected', () => {
    mount({ caseDetail: { ...baseProps.caseDetail, caseTypeCode: 'CLEAS' } });
    openPaymentForm();

    expect(screen.getByLabelText('Fecha de pago')).toBeTruthy();
    expect(screen.getByLabelText('Estado del pago')).toBeTruthy();
    expect(screen.getByLabelText('Monto depositado')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Documentación de pago' })).toBeTruthy();
    expect(document.querySelector('input[type="file"]')).toBeTruthy();
    expect(screen.queryByLabelText('Ganancias')).toBeNull();

    fireEvent.change(screen.getByLabelText('Retenciones'), { target: { value: 'SI' } });
    expect(screen.getAllByLabelText('IVA').length).toBeGreaterThan(1);
    ['Ganancias', 'Contribución patrimonial', 'IIBB', 'DReI', 'Otra'].forEach((label) => expect(screen.getByLabelText(label)).toBeTruthy());
  });

  it('calculates total con IVA for comprobante A (default)', () => {
    mount();
    // MO=150000 + 21%=31500 + Rep=70000 = 251500
    const elements = screen.getAllByText(/\$ *251\.500/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders seña, cancela, modo, and factura selects', () => {
    mount();
    openPaymentForm();
    expect(screen.getByText('Seña')).toBeTruthy();
    expect(screen.getByText('Cancela saldo')).toBeTruthy();
    expect(screen.getByText('Modo')).toBeTruthy();
    expect(screen.getByText('Factura')).toBeTruthy();
  });

  it('renders Registrar pago button', () => {
    mount();
    openPaymentForm();
    expect(screen.getByRole('button', { name: /^registrar pago$/i })).toBeTruthy();
  });

  it('shows historial section', () => {
    mount();
    expect(screen.getByText('Historial de movimientos')).toBeTruthy();
  });

  it('calls createFinancialMovement on save', async () => {
    mount({ caseDetail: { ...baseProps.caseDetail, caseTypeCode: 'CLEAS' } });
    openPaymentForm();
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '100000' } });
    fireEvent.change(screen.getByLabelText('Monto depositado'), { target: { value: '90000' } });
    fireEvent.change(screen.getByLabelText('Retenciones'), { target: { value: 'SI' } });
    fireEvent.change(screen.getByLabelText('Ganancias'), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: /^registrar pago$/i }));
    await waitFor(() => expect(mockCreateFinancialMovement).toHaveBeenCalled());
    const payload = mockCreateFinancialMovement.mock.calls[0][1];
    expect(payload.grossAmount).toBe(100000);
    expect(payload).not.toHaveProperty('depositedAmount');
    expect(payload).not.toHaveProperty('hasRetentions');
    expect(payload.retentions).toEqual([]);
  });

  it('shows factura fields when Factura = SI', () => {
    mount();
    openPaymentForm();
    const selects = document.querySelectorAll('select');
    const facturaSelect = Array.from(selects).find(s => s.parentElement?.textContent?.includes('Factura'));
    if (facturaSelect) fireEvent.change(facturaSelect, { target: { value: 'SI' } });
    expect(screen.getByText('Razón social')).toBeTruthy();
    expect(screen.getByText('N° factura')).toBeTruthy();
  });
});
