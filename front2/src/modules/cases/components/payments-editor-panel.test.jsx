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
  billing: { insuranceCompany: '', claimNumber: '', agreementDate: '', invoiceNumber: '', businessName: '', totalAmount: '', taxableNet: '', vat: '', customerSigned: 'NO', passedToPayments: 'NO', estimatedPaymentDate: '' },
  invoiceAcknowledged: false,
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
   useQueryData = { [JSON.stringify(['cases', '42', 'insurance'])]: { insuranceCompanyId: 7 } };
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

  it('uses the CLEAS summary and registers an eligible company payment through its dedicated endpoint', async () => {
    useQueryData = {
      [JSON.stringify(['cases', '42', 'cleas', 'summary'])]: { caseId: 42, companyId: 7, agreedAmount: 100000, paidAmount: 25000, pendingAmount: 75000 },
    };
    render(<CleasPaymentsHarness {...baseProps} caseDetail={{ ...baseProps.caseDetail, caseTypeCode: 'CLEAS' }} />);

    expect(screen.getByText('Pago de compañía CLEAS')).toBeInTheDocument();
    const companyPanel = screen.getByText('Pago de compañía CLEAS').closest('.border');
    expect(within(companyPanel).getByText('Acordado').parentElement).toHaveTextContent('100.000');
    expect(within(companyPanel).getByText('Pagado').parentElement).toHaveTextContent('25.000');
    expect(within(companyPanel).getByText('Pendiente').parentElement).toHaveTextContent('75.000');
    fireEvent.change(within(companyPanel).getByLabelText('Monto de compañía'), { target: { value: '75000' } });
    fireEvent.change(within(companyPanel).getByLabelText('Referencia externa'), { target: { value: 'CLEAS-OP-1' } });
    fireEvent.change(within(companyPanel).getByLabelText('Notas'), { target: { value: 'Transferencia recibida' } });
    fireEvent.click(within(companyPanel).getByRole('button', { name: /^Registrar pago de compañía$/i }));

    await waitFor(() => expect(mockRegisterCleasCompanyPayment).toHaveBeenCalledWith(42, expect.objectContaining({
      amount: 75000,
      paymentMethodCode: 'TRANSFERENCIA',
      externalReference: 'CLEAS-OP-1',
      reason: 'Transferencia recibida',
    })));
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42', 'cleas', 'summary'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42', 'financial-movements'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42', 'workspace'] });
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

  it('keeps billing and payment registration available for non-exact CLEAS with a closure timestamp', () => {
    mount({ caseDetail: { ...baseProps.caseDetail, caseTypeCode: 'CLEAS' }, cleasOver: 'liability', cleasOpinion: 'unfavorable', cleasClosedAt: '2026-08-20T10:00:00.000Z' });

    expect(screen.getByText('Facturación')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /registrar pago/i }).length).toBeGreaterThan(0);
  });

  it('keeps CLEAS billing and payment registration enabled for a favorable franchise', () => {
    mount({
      caseDetail: { ...baseProps.caseDetail, caseTypeCode: 'CLEAS' },
      cleasOver: 'franchise',
      cleasOpinion: 'favorable',
      cleasAgreedAmount: '125000',
    });

    expect(screen.getByText('Facturación')).toBeTruthy();
    expect(screen.getByLabelText('A facturar Cía.')).toHaveValue('125000');
    expect(screen.getByLabelText('A facturar Cía.')).toHaveAttribute('readonly');
    expect(screen.getAllByRole('button', { name: /registrar pago/i }).length).toBeGreaterThan(0);
    openPaymentForm();
    expect(screen.getByRole('button', { name: /^registrar pago$/i })).toBeEnabled();
  });

  it('uses the unfavorable franchise derived company amount and reuses the generic client payment modal', () => {
    mount({
      caseDetail: { ...baseProps.caseDetail, caseTypeCode: 'CLEAS' },
      cleasOver: 'franchise',
      cleasOpinion: 'unfavorable',
      cleasAgreedAmount: '2000000',
      cleasFranchiseDistribution: { franchiseAmount: '1000000', companyRequirement: 'PARCIAL', companyRequiredAmount: '500000', companyPaymentStatus: 'PENDIENTE', companyPaymentDate: '' },
    });

    expect(screen.getByLabelText('A facturar Cía.')).toHaveValue('1500000');
    expect(screen.getByText('Pago de franquicia a cargo del cliente')).toBeTruthy();
    expect(screen.getByLabelText('A cargo del cliente')).toHaveValue('500000');
    fireEvent.click(screen.getByRole('button', { name: '+ Registrar pago del cliente' }));
    expect(screen.getByRole('heading', { name: 'Registrar pago' })).toBeTruthy();
    expect(screen.getByLabelText('Monto')).toHaveValue(500000);
    expect(screen.getByLabelText('Cancela saldo')).toHaveValue('FRANQUICIA');
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
