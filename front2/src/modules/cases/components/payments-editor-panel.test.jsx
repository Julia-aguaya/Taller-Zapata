import { useState } from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PaymentsEditorPanel } from './payments-editor-panel';
import { ExtraBudgetPaymentsPanel } from './extra-budget-payments-panel';

const mockCreateFinancialMovement = vi.fn().mockResolvedValue({ id: 1 });
const mockCreateReceipt = vi.fn().mockResolvedValue({ id: 10 });
const mockGetFinanceCatalogs = vi.fn().mockResolvedValue({ paymentMethodCodes: [], cancellationTypeCodes: [] });
const mockListFinancialMovements = vi.fn().mockResolvedValue([]);
const mockListReceipts = vi.fn().mockResolvedValue([]);
const mockRequestJson = vi.fn().mockResolvedValue({});
const mockInvalidateQueries = vi.fn();
const mockRefetchQueries = vi.fn().mockResolvedValue(undefined);
const mockGetExtraBudget = vi.fn();
const mockAnnulExtraBudgetPayment = vi.fn();
const mockRegisterExtraBudgetPayment = vi.fn().mockResolvedValue({});
const mockGetCleasCompanyPaymentSummary = vi.fn();
const mockRegisterCleasCompanyPayment = vi.fn().mockResolvedValue({ id: 12 });
const mockAnnulCleasCompanyPayment = vi.fn().mockResolvedValue({});
const mockDownloadCleasLiquidationPdf = vi.fn().mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
const mockGetCleasFranchisePaymentSummary = vi.fn();
const mockRegisterCleasCustomerFranchisePayment = vi.fn();
const mockRegisterCleasCompanyFranchisePayment = vi.fn();
let useQueryData = {};

vi.mock('@/modules/cases/api/finance-api', () => ({
  createFinancialMovement: (...a) => mockCreateFinancialMovement(...a),
  createReceipt: (...a) => mockCreateReceipt(...a),
  getFinanceCatalogs: (...a) => mockGetFinanceCatalogs(...a),
  listFinancialMovements: (...a) => mockListFinancialMovements(...a),
  listReceipts: (...a) => mockListReceipts(...a),
  getReceiptPdfUrl: (id) => `/api/v1/receipts/${id}/pdf`,
}));

vi.mock('@/modules/cases/api/cleas-api', () => ({
  getCleasCompanyPaymentSummary: (...a) => mockGetCleasCompanyPaymentSummary(...a),
  registerCleasCompanyPayment: (...a) => mockRegisterCleasCompanyPayment(...a),
  annulCleasCompanyPayment: (...a) => mockAnnulCleasCompanyPayment(...a),
  downloadCleasLiquidationPdf: (...a) => mockDownloadCleasLiquidationPdf(...a),
  getCleasFranchisePaymentSummary: (...a) => mockGetCleasFranchisePaymentSummary(...a),
  registerCleasCustomerFranchisePayment: (...a) => mockRegisterCleasCustomerFranchisePayment(...a),
  registerCleasCompanyFranchisePayment: (...a) => mockRegisterCleasCompanyFranchisePayment(...a),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => useQueryData[JSON.stringify(queryKey)]?.__queryResult ?? ({ data: useQueryData[JSON.stringify(queryKey)], isLoading: false, isError: false }),
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

vi.mock('@/shared/api/http-client', () => ({
  requestJson: (...args) => mockRequestJson(...args),
}));

vi.mock('@/modules/cases/api/extra-budget-api', () => ({
  extraBudgetQueryKey: (caseId) => ['cases', String(caseId), 'extra-budget'],
  getExtraBudget: (...args) => mockGetExtraBudget(...args),
  registerExtraBudgetPayment: (...args) => mockRegisterExtraBudgetPayment(...args),
  annulExtraBudgetPayment: (...args) => mockAnnulExtraBudgetPayment(...args),
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
  paymentDraft: { paidAt: '', status: 'PENDIENTE', depositedAmount: '', hasRetentions: 'NO', vatRetention: '', earningsRetention: '', patrimonialContribution: '', iibbRetention: '', dreiRetention: '', otherRetention: '' },
  paymentDocument: { file: null, name: '' },
  franchiseClientPayment: { status: 'PENDIENTE', paidAt: '', amount: '', paymentMethod: 'TRANSFERENCIA', externalReference: '', notes: '', document: { file: null, name: '' }, registered: false },
});

const CleasPaymentsHarness = (props) => {
  const [cleasPaymentsUi, setCleasPaymentsUi] = useState(createCleasPaymentsUi);
  const [cleasFranchiseDistribution] = useState(props.cleasFranchiseDistribution ?? { franchiseAmount: '', companyRequirement: 'NO', companyRequiredAmount: '', companyPaymentStatus: 'PENDIENTE', companyPaymentDate: '' });
  return <PaymentsEditorPanel {...props} cleasFranchiseDistribution={cleasFranchiseDistribution} cleasPaymentsUi={cleasPaymentsUi} onCleasPaymentsUiChange={setCleasPaymentsUi} />;
};

  const mount = (overrides = {}) => {
   useQueryData = { [JSON.stringify(['cases', '42', 'insurance'])]: { insuranceCompanyId: 7 }, ...useQueryData };
  mockCreateFinancialMovement.mockClear();
  mockCreateReceipt.mockClear();
  mockRequestJson.mockClear();
  mockRegisterCleasCompanyPayment.mockClear();
  mockInvalidateQueries.mockClear();
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
    expect(screen.queryByLabelText('A facturar Cía.')).toBeNull();
  });

  it('updates insurance payment dates through the partial processing contract', async () => {
    mount({ caseDetail: { ...baseProps.caseDetail, caseTypeCode: 'TODO_RIESGO' } });

    fireEvent.change(screen.getByLabelText('Fecha pasado a pagos'), { target: { value: '2026-08-23' } });

    await waitFor(() => expect(mockRequestJson).toHaveBeenCalledWith('/cases/42/insurance-processing', {
      method: 'PATCH',
      body: JSON.stringify({ expectedVersion: 0, passedToPaymentsAt: '2026-08-23' }),
    }));
  });

  it('uses the full insurer agreement and suppresses franchise payment UI for GRANIZO', () => {
    useQueryData = {
      [JSON.stringify(['cases', '42', 'insurance'])]: { insuranceCompanyId: 7 },
      [JSON.stringify(['cases', '42', 'insurance-processing'])]: { agreedAmount: 300000, amountToBillCompany: 200000 },
      [JSON.stringify(['cases', '42', 'finance', 'payment-breakdown'])]: { client: { franchisePending: 100000, acceptedExtras: 0, extrasPending: 0, pending: 100000 } },
    };

    render(<PaymentsEditorPanel {...baseProps} caseDetail={{ ...baseProps.caseDetail, caseTypeCode: 'GRANIZO' }} clientPaymentRequest={{ concept: 'FRANQUICIA', amount: '100000' }} />);

    expect(screen.getByText('A facturar Cía.').parentElement).toHaveTextContent('300.000');
    expect(screen.queryByLabelText('Desglose de pagos del cliente')).toBeNull();
    expect(screen.queryByRole('button', { name: /franquicia/i })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Registrar pago' })).toBeNull();
  });

  it('exposes exactly the insurer and extra-client saving actions, never one in movement history', () => {
    useQueryData = {
      [JSON.stringify(['cases', '42', 'financial-movements'])]: [{ id: 1, movementAt: '2026-08-24T10:00', movementTypeCode: 'INGRESO', netAmount: 100, paymentMethodCode: 'TRANSFERENCIA', cancellationTypeCode: 'PRESUPUESTO' }],
      [JSON.stringify(['cases', '42', 'extra-budget'])]: {
        issuedNumber: 77, currentVersion: 2, versionLock: 9, currentStatus: 'ACEPTADO', acceptedVersionId: 202, paidAmount: 30, balance: 91, payments: [],
        versions: [{ id: 202, laborWithVat: 121, partsTotal: 50, total: 171 }],
      },
      [JSON.stringify(['cases', '42', 'finance', 'payment-breakdown'])]: { client: { franchisePending: 100, acceptedExtras: 0, extrasPending: 91, pending: 191 } },
    };

    render(<><PaymentsEditorPanel {...baseProps} caseDetail={{ ...baseProps.caseDetail, caseTypeCode: 'TODO_RIESGO' }} /><ExtraBudgetPaymentsPanel caseId="42" /></>);

    expect(screen.getAllByRole('button', { name: /^Guardar pago de la compañía$/i })).toHaveLength(1);
    expect(screen.getByRole('button', { name: /^Registrar pago de franquicia$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^(Registrar|Guardar) pago$/i })).toBeNull();
    const history = screen.getByText('Historial de movimientos').closest('.rounded-3xl');
    expect(within(history).getByRole('button', { name: 'Descargar comprobante' })).toBeInTheDocument();
    expect(within(history).getByRole('button', { name: 'Anular' })).toBeInTheDocument();
    expect(within(history).queryByRole('button', { name: /^(Registrar|Guardar) pago/i })).toBeNull();
  });

  it('uses the authoritative insurer balance and selected company for a valid company payment', async () => {
    mockCreateFinancialMovement.mockClear();
    useQueryData = {
      [JSON.stringify(['cases', '42', 'insurance'])]: { insuranceCompanyId: 7 },
      [JSON.stringify(['cases', '42', 'finance', 'payment-breakdown'])]: { insurer: { companyId: 7, total: 10, paid: 0, pending: 10 } },
    };
    render(<PaymentsEditorPanel {...baseProps} caseDetail={{ ...baseProps.caseDetail, caseTypeCode: 'TODO_RIESGO' }} />);

    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: /^Guardar pago de la compañía$/i }));

    await waitFor(() => expect(mockCreateFinancialMovement).toHaveBeenCalledWith(42, expect.objectContaining({
      flowOriginCode: 'ASEGURADORA',
      counterpartyTypeCode: 'COMPANIA',
      counterpartyCompanyId: 7,
      cancellationTypeCode: 'COMPANIA',
      netAmount: 10,
    })));
  });

  it('does not submit a company payment over the authoritative pending balance', () => {
    mockCreateFinancialMovement.mockClear();
    useQueryData = {
      [JSON.stringify(['cases', '42', 'insurance'])]: { insuranceCompanyId: 7 },
      [JSON.stringify(['cases', '42', 'finance', 'payment-breakdown'])]: { insurer: { companyId: 7, total: 10, paid: 0, pending: 10 } },
    };
    render(<PaymentsEditorPanel {...baseProps} caseDetail={{ ...baseProps.caseDetail, caseTypeCode: 'TODO_RIESGO' }} />);

    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '11' } });
    fireEvent.click(screen.getByRole('button', { name: /^Guardar pago de la compañía$/i }));

    expect(mockCreateFinancialMovement).not.toHaveBeenCalled();
  });

  it('guards the company save against a second click while its request is pending', () => {
    useQueryData = {
      [JSON.stringify(['cases', '42', 'insurance'])]: { insuranceCompanyId: 7 },
      [JSON.stringify(['cases', '42', 'finance', 'payment-breakdown'])]: { insurer: { companyId: 7, total: 100000, paid: 0, pending: 100000 } },
    };
    mockCreateFinancialMovement.mockClear();
    let resolvePayment;
    mockCreateFinancialMovement.mockImplementationOnce(() => new Promise((resolve) => { resolvePayment = resolve; }));
    render(<PaymentsEditorPanel {...baseProps} caseDetail={{ ...baseProps.caseDetail, caseTypeCode: 'TODO_RIESGO' }} />);

    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '100000' } });
    const saveButton = screen.getByRole('button', { name: /^Guardar pago de la compañía$/i });
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    expect(mockCreateFinancialMovement).toHaveBeenCalledTimes(1);
    resolvePayment({ id: 1 });
  });

  it('reuses the complete modal for extras with a fixed concept, suggested balance, and isolated partial-payment request', async () => {
    mockRegisterExtraBudgetPayment.mockClear();
    mockCreateFinancialMovement.mockClear();
    let resolvePayment;
    mockRegisterExtraBudgetPayment.mockImplementationOnce(() => new Promise((resolve) => { resolvePayment = resolve; }));
    mount({ clientPaymentRequest: { concept: 'TRABAJOS_EXTRAS', amount: '91', expectedVersion: 9 } });

    expect(screen.getByRole('heading', { name: 'Registrar pago' })).toBeInTheDocument();
    expect(screen.getByLabelText('Monto')).toHaveValue(91);
    expect(screen.getByLabelText('Cancela saldo')).toHaveValue('TRABAJOS_EXTRAS');
    ['Fecha y hora', 'Modo', 'Detalle medio de pago (opcional)', 'Factura', 'Referencia externa', 'Motivo / notas'].forEach((label) => expect(screen.getByLabelText(label)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '40' } });
    fireEvent.change(screen.getByLabelText('Referencia externa'), { target: { value: 'OP-40' } });
    const submit = screen.getByRole('button', { name: /^Registrar pago$/i });
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => expect(mockRegisterExtraBudgetPayment).toHaveBeenCalledWith(42, expect.objectContaining({ expectedVersion: 9, amount: 40, externalReference: 'OP-40' })));
    expect(mockRegisterExtraBudgetPayment).toHaveBeenCalledTimes(1);
    expect(mockCreateFinancialMovement).not.toHaveBeenCalled();
    resolvePayment({});
  });

  it('uses the shared modal for a TODO_RIESGO franchise with the canonical payload and partial cap', async () => {
    useQueryData = {
      [JSON.stringify(['cases', '42', 'insurance'])]: { insuranceCompanyId: 7 },
      [JSON.stringify(['cases', '42', 'finance', 'payment-breakdown'])]: { client: { franchisePending: 91, acceptedExtras: 30, extrasPending: 61, pending: 152 } },
    };
    render(<PaymentsEditorPanel {...baseProps} caseDetail={{ ...baseProps.caseDetail, caseTypeCode: 'TODO_RIESGO' }} />);

    expect(screen.getByLabelText('Pagos del cliente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrar pago de franquicia/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /registrar pago de franquicia/i }));
    const franchiseAmountInput = screen.getAllByLabelText('Monto').at(-1);
    expect(franchiseAmountInput).toHaveValue(91);
    expect(franchiseAmountInput).toHaveAttribute('max', '91');
    fireEvent.change(franchiseAmountInput, { target: { value: '40' } });
    fireEvent.click(screen.getByRole('button', { name: /^Registrar pago$/i }));

    await waitFor(() => expect(mockCreateFinancialMovement).toHaveBeenCalledWith(42, expect.objectContaining({
      flowOriginCode: 'CLIENTE',
      counterpartyTypeCode: 'PERSONA',
      counterpartyPersonId: 1,
      cancellationTypeCode: 'FRANQUICIA',
      netAmount: 40,
    })));
  });

  it.each(['PARTICULAR', 'GRANIZO'])('does not render the TODO_RIESGO franchise section for %s', (caseTypeCode) => {
    useQueryData = { [JSON.stringify(['cases', '42', 'finance', 'payment-breakdown'])]: { client: { franchisePending: 91 } } };
    render(<PaymentsEditorPanel {...baseProps} caseDetail={{ ...baseProps.caseDetail, caseTypeCode }} />);

    expect(screen.queryByLabelText('Pagos del cliente')).toBeNull();
    expect(screen.queryByRole('button', { name: /registrar pago de franquicia/i })).toBeNull();
  });

  it('persists a CLEAS invoice using the agreed amount and lists invoices from the case', async () => {
    useQueryData = {
      [JSON.stringify(['cases', '42', 'cleas', 'summary'])]: { caseId: 42, companyId: 7, agreedAmount: 125000, paidAmount: 0, pendingAmount: 125000 },
      [JSON.stringify(['cases', '42', 'receipts'])]: [{ id: 9, receiptTypeCode: 'FACTURA', receiptNumber: '0001-9', receiverBusinessName: 'Aseguradora SA', total: 125000 }],
    };
    render(<CleasPaymentsHarness {...baseProps} caseDetail={{ ...baseProps.caseDetail, caseTypeCode: 'CLEAS' }} />);

    expect(screen.getByLabelText('Monto acordado')).toHaveValue('$ 125.000');
    expect(screen.getByText('0001-9 - Aseguradora SA')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Número fiscal'), { target: { value: '00000010' } });
    fireEvent.change(screen.getByLabelText('Razón social'), { target: { value: 'Aseguradora SA' } });
    fireEvent.click(screen.getByRole('button', { name: /registrar factura/i }));

    await waitFor(() => expect(mockCreateReceipt).toHaveBeenCalledWith(42, expect.objectContaining({
      receiptTypeCode: 'FACTURA', receiptNumber: '0001-00000010', receiverBusinessName: 'Aseguradora SA', taxableNet: 125000, vatAmount: 0, total: 125000,
      fiscalTypeCode: 'A', salePoint: '0001', fiscalNumber: '00000010',
    })));
  });

  it('hides CLEAS billing and payment registration only after exact adverse-total closure', () => {
    useQueryData = {};
    mount({ caseDetail: { ...baseProps.caseDetail, caseTypeCode: 'CLEAS' }, cleasOver: 'damage', cleasOpinion: 'unfavorable', cleasClosedAt: '2026-08-20T10:00:00.000Z' });

    expect(screen.queryByText('Facturación')).toBeNull();
    expect(screen.queryByRole('button', { name: /registrar pago/i })).toBeNull();
    expect(screen.queryByLabelText('Monto depositado')).toBeNull();
  });

  it('registers a favorable CLEAS company payment with proof and catalog retentions', async () => {
    useQueryData = {
      [JSON.stringify(['cases', '42', 'cleas', 'summary'])]: { caseId: 42, companyId: 7, agreedAmount: 100000, paidAmount: 25000, pendingAmount: 75000, paidGrossAmount: 25000, pendingGrossAmount: 75000 },
      [JSON.stringify(['cases', '42', 'receipts'])]: [{ id: 44, receiptTypeCode: 'FACTURA', receiptNumber: '0001-44', receiverBusinessName: 'Aseguradora SA', total: 100000 }],
      [JSON.stringify(['cases', '42', 'documents'])]: [{ documentId: 88, categoryId: 9, fileName: 'transferencia.pdf' }],
      [JSON.stringify(['documents', 'catalogs'])]: { categories: [{ id: 9, code: 'COMPROBANTE_PAGO_CLEAS', name: 'Comprobante de pago CLEAS' }] },
      [JSON.stringify(['finance', 'catalogs'])]: { retentionTypeCodes: [{ code: 'IVA', name: 'IVA' }, { code: 'IIBB', name: 'Ingresos Brutos' }] },
    };
    render(<CleasPaymentsHarness {...baseProps} caseDetail={{ ...baseProps.caseDetail, caseTypeCode: 'CLEAS' }} />);

    expect(screen.getByText('Pago de compañía CLEAS')).toBeInTheDocument();
    const companyPanel = screen.getByText('Pago de compañía CLEAS').closest('.border');
    expect(within(companyPanel).getByText('Acordado').parentElement).toHaveTextContent('100.000');
    expect(within(companyPanel).getByText('Bruto cancelado').parentElement).toHaveTextContent('25.000');
    expect(within(companyPanel).getByText('Saldo bruto').parentElement).toHaveTextContent('75.000');
    fireEvent.change(within(companyPanel).getByLabelText('Bruto que cancela'), { target: { value: '75000' } });
    fireEvent.change(within(companyPanel).getByLabelText('Factura asociada (opcional)'), { target: { value: '44' } });
    fireEvent.change(within(companyPanel).getByLabelText('Comprobante existente'), { target: { value: '88' } });
    fireEvent.click(within(companyPanel).getByRole('button', { name: 'Agregar retención' }));
    fireEvent.change(within(companyPanel).getByLabelText('Monto retención 1'), { target: { value: '1000' } });
    expect(within(companyPanel).getByLabelText('Neto depositado')).toHaveValue('$ 74.000');
    fireEvent.change(within(companyPanel).getByLabelText('Referencia externa'), { target: { value: 'CLEAS-OP-1' } });
    fireEvent.change(within(companyPanel).getByLabelText('Notas'), { target: { value: 'Transferencia recibida' } });
    fireEvent.click(within(companyPanel).getByRole('button', { name: /^Registrar pago de compañía$/i }));

    await waitFor(() => expect(mockRegisterCleasCompanyPayment).toHaveBeenCalledWith(42, expect.objectContaining({
      amount: 75000,
      paymentMethodCode: 'TRANSFERENCIA',
      receiptId: 44,
      documentId: 88,
      retentions: [{ retentionTypeCode: 'IVA', amount: 1000, detail: null }],
      externalReference: 'CLEAS-OP-1',
      reason: 'Transferencia recibida',
    })));
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42', 'cleas', 'summary'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42', 'financial-movements'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42', 'documents'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42', 'workspace'] });
  });

  it('uploads the payment proof before posting the CLEAS payment', async () => {
    mockRequestJson.mockResolvedValueOnce({ id: 99 });
    useQueryData = {
      [JSON.stringify(['cases', '42', 'cleas', 'summary'])]: { caseId: 42, companyId: 7, agreedAmount: 100000, paidAmount: 0, pendingAmount: 100000 },
      [JSON.stringify(['documents', 'catalogs'])]: { categories: [{ id: 9, code: 'COMPROBANTE_PAGO_CLEAS', name: 'Comprobante de pago CLEAS' }] },
      [JSON.stringify(['finance', 'catalogs'])]: { retentionTypeCodes: [{ code: 'IVA', name: 'IVA' }] },
    };
    render(<CleasPaymentsHarness {...baseProps} caseDetail={{ ...baseProps.caseDetail, caseTypeCode: 'CLEAS' }} />);

    const companyPanel = screen.getByText('Pago de compañía CLEAS').closest('.border');
    fireEvent.change(within(companyPanel).getByLabelText('Bruto que cancela'), { target: { value: '100000' } });
    fireEvent.change(within(companyPanel).getByLabelText('O subir comprobante CLEAS'), { target: { files: [new File(['proof'], 'pago.pdf', { type: 'application/pdf' })] } });
    fireEvent.click(within(companyPanel).getByRole('button', { name: /^Registrar pago de compañía$/i }));

    await waitFor(() => expect(mockRequestJson).toHaveBeenCalledWith('/documents', expect.objectContaining({ method: 'POST', body: expect.any(FormData) })));
    await waitFor(() => expect(mockRegisterCleasCompanyPayment).toHaveBeenCalledWith(42, expect.objectContaining({ documentId: 99, amount: 100000, retentions: [] })));
    expect(mockRequestJson.mock.invocationCallOrder.at(-1)).toBeLessThan(mockRegisterCleasCompanyPayment.mock.invocationCallOrder.at(-1));
  });

  it('shows the backend eligibility block and does not render the CLEAS company payment form', () => {
    useQueryData = {
      [JSON.stringify(['cases', '42', 'cleas', 'summary'])]: {
        __queryResult: { data: undefined, isLoading: false, isError: true, error: new Error('El pago de compania solo aplica a CLEAS DANIO_TOTAL con dictamen A_FAVOR') },
      },
    };
    render(<CleasPaymentsHarness {...baseProps} caseDetail={{ ...baseProps.caseDetail, caseTypeCode: 'CLEAS' }} />);

    expect(screen.getByRole('alert')).toHaveTextContent('El pago de compania solo aplica a CLEAS DANIO_TOTAL con dictamen A_FAVOR');
    expect(screen.queryByLabelText('Monto de compañía')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Registrar pago de compañía$/i })).toBeNull();
  });

  it('keeps payment registration available for non-exact CLEAS with a closure timestamp', () => {
    mount({ caseDetail: { ...baseProps.caseDetail, caseTypeCode: 'CLEAS' }, cleasOver: 'liability', cleasOpinion: 'unfavorable', cleasClosedAt: '2026-08-20T10:00:00.000Z' });

    expect(screen.queryByText('Facturación')).toBeNull();
    expect(screen.getAllByRole('button', { name: /registrar pago/i }).length).toBeGreaterThan(0);
  });

  it('does not expose CLEAS billing for a favorable franchise', () => {
    mount({
      caseDetail: { ...baseProps.caseDetail, caseTypeCode: 'CLEAS' },
      cleasOver: 'franchise',
      cleasOpinion: 'favorable',
      cleasAgreedAmount: '125000',
    });

    expect(screen.queryByText('Facturación')).toBeNull();
    expect(screen.getAllByRole('button', { name: /registrar pago/i }).length).toBeGreaterThan(0);
    openPaymentForm();
    expect(screen.getByRole('button', { name: /^registrar pago$/i })).toBeEnabled();
  });

  it('uses the canonical unfavorable franchise summary and payment modal', () => {
    useQueryData = { [JSON.stringify(['cases', '42', 'cleas', 'franchise-summary'])]: { amountToBillCompany: 1500000, companyRequiredAmount: 500000, customerPendingAmount: 500000 } };
    mount({
      caseDetail: { ...baseProps.caseDetail, caseTypeCode: 'CLEAS' },
      cleasOver: 'franchise',
      cleasOpinion: 'unfavorable',
      cleasAgreedAmount: '2000000',
      cleasFranchiseDistribution: { franchiseAmount: '1000000', companyRequirement: 'PARCIAL', companyRequiredAmount: '500000', companyPaymentStatus: 'PENDIENTE', companyPaymentDate: '' },
    });

    expect(screen.queryByText('Facturación')).toBeNull();
    expect(screen.getByText('Pago de franquicia a cargo del cliente')).toBeTruthy();
    expect(screen.getByText('A facturar Cía.').parentElement).toHaveTextContent('1.500.000');
    fireEvent.click(screen.getByRole('button', { name: '+ Registrar pago al taller' }));
    expect(screen.getByRole('heading', { name: 'Registrar pago' })).toBeTruthy();
    expect(screen.getByLabelText('Monto')).toHaveValue(500000);
    expect(screen.getByLabelText('Cancela saldo')).toHaveValue('FRANQUICIA');
    expect(screen.getByLabelText('Estado pago a compañía')).toHaveValue('COBRADO');
    expect(screen.getByLabelText('Fecha pago a compañía')).toHaveValue(new Date().toISOString().slice(0, 10));
    expect(screen.getByLabelText('Comprobante pago cliente a compañía')).toHaveValue('');
    expect(screen.getByLabelText('Subir comprobante pago cliente a compañía')).toBeInTheDocument();
  });

  it('keeps company billing available for shared-fault total damage without changing the agreed amount', () => {
    useQueryData = {
      [JSON.stringify(['cases', '42', 'cleas', 'summary'])]: { caseId: 42, companyId: 7, agreedAmount: 100000, paidAmount: 0, pendingAmount: 100000, paidGrossAmount: 0, pendingGrossAmount: 100000 },
      [JSON.stringify(['documents', 'catalogs'])]: { categories: [{ id: 9, code: 'COMPROBANTE_PAGO_CLEAS', name: 'Comprobante de pago CLEAS' }] },
      [JSON.stringify(['finance', 'catalogs'])]: { retentionTypeCodes: [] },
    };
    mount({ caseDetail: { ...baseProps.caseDetail, caseTypeCode: 'CLEAS' }, cleasOver: 'damage', cleasOpinion: 'shared' });

    const companyPanel = screen.getByText('Pago de compañía CLEAS').closest('.border');
    expect(within(companyPanel).getByText('Acordado').parentElement).toHaveTextContent('100.000');
    expect(within(companyPanel).getByText('Saldo bruto').parentElement).toHaveTextContent('100.000');
  });

  it('creates a partial credit note linked to its original CLEAS invoice and shows its outstanding balance', async () => {
    useQueryData = {
      [JSON.stringify(['cases', '42', 'cleas', 'summary'])]: { caseId: 42, companyId: 7, agreedAmount: 125000, paidAmount: 0, pendingAmount: 125000 },
      [JSON.stringify(['cases', '42', 'receipts'])]: [
        { id: 9, receiptTypeCode: 'FACTURA', receiptNumber: '0001-9', receiverBusinessName: 'Aseguradora SA', total: 125000 },
        { id: 10, receiptTypeCode: 'NOTA_CREDITO', receiptNumber: 'NC-0001', receiverBusinessName: 'Aseguradora SA', total: 25000, originalReceiptId: 9 },
      ],
    };
    render(<CleasPaymentsHarness {...baseProps} caseDetail={{ ...baseProps.caseDetail, caseTypeCode: 'CLEAS' }} />);

    expect(screen.getByText('Total acreditado: $ 25.000')).toBeInTheDocument();
    expect(screen.getByText('Saldo vigente: $ 100.000')).toBeInTheDocument();
    expect(screen.getByText('NC asociadas: NC-0001')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Factura a acreditar'), { target: { value: '9' } });
    fireEvent.change(screen.getByLabelText('Número fiscal nota de crédito'), { target: { value: '00000002' } });
    fireEvent.change(screen.getByLabelText('Monto nota de crédito'), { target: { value: '10000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar nota de crédito' }));

    await waitFor(() => expect(mockCreateReceipt).toHaveBeenCalledWith(42, expect.objectContaining({
      receiptTypeCode: 'NOTA_CREDITO', receiptNumber: '0001-00000002', originalReceiptId: 9, total: 10000,
      fiscalTypeCode: 'A', salePoint: '0001', fiscalNumber: '00000002',
    })));
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
    expect(screen.getAllByLabelText('IVA')).toHaveLength(1);
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
    expect(payload).not.toHaveProperty('franchiseAmount');
    expect(payload).not.toHaveProperty('companyRequiredAmount');
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
