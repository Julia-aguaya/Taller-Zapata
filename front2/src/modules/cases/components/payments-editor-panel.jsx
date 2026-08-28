import { cloneElement, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Building2, CheckCircle, FileDown, Receipt, Save } from 'lucide-react';
import { toast } from 'sonner';
import { createFinancialMovement, createReceipt, getClientPaymentPdfUrl, getFinanceCatalogs, getReceiptPdfUrl, listFinancialMovements, listReceipts } from '@/modules/cases/api/finance-api';
import { annulCleasCompanyPayment, downloadCleasLiquidationPdf, getCleasCompanyPaymentSummary, getCleasFranchisePaymentSummary, registerCleasCompanyFranchisePayment, registerCleasCompanyPayment, registerCleasCustomerFranchisePayment } from '@/modules/cases/api/cleas-api';
import { extraBudgetQueryKey, registerExtraBudgetPayment } from '@/modules/cases/api/extra-budget-api';
import { requestJson } from '@/shared/api/http-client';
import { readStoredAuth } from '@/shared/auth/session-storage';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Dialog } from '@/shared/ui/dialog';
import { Card } from '@/shared/ui/card';

const toAmount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount || 0);

const COMPROBANTE_TYPES = [
  { value: 'A', label: 'A — Factura con IVA' },
  { value: 'C', label: 'C — Factura sin IVA (Consumidor Final / Monotributo)' },
  { value: 'R', label: 'R — Recibo sin IVA' },
];

const CANCELACION_TYPES = [
  { value: 'TOTAL', label: 'Total' },
  { value: 'PARCIAL', label: 'Parcial' },
  { value: 'BONIFICACION', label: 'Bonificación' },
];

const PAYMENT_METHODS = [
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'TARJETA', label: 'Tarjeta de crédito' },
  { value: 'OTRO', label: 'Otro' },
];

export const PaymentsEditorPanel = ({ caseId, caseDetail, budget, particularFinanceSummary, clientPaymentRequest, onClientPaymentRequestHandled, nroCleas, cleasAgreedAmount, cleasFranchiseDistribution, cleasPaymentsUi, onCleasPaymentsUiChange, cleasOver, cleasOpinion, cleasClosedAt, cleasWorkflowGuard, onSaved }) => {
  const queryClient = useQueryClient();

  const [comprobanteTipo, setComprobanteTipo] = useState('A');
  const [form, setForm] = useState({
    amount: '',
    movementAt: new Date().toISOString().slice(0, 16),
    advancePayment: 'NO',
    cancelacionTipo: 'TOTAL',
    bonificacionMonto: '',
    bonificacionFecha: new Date().toISOString().slice(0, 10),
    bonificacionMotivo: '',
    paymentMethodCode: 'EFECTIVO',
    paymentMethodDetail: '',
    factura: 'NO',
    razonSocial: '',
    facturaNumero: '',
    externalReference: '',
    reason: '',
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [localClientPaymentRequest, setLocalClientPaymentRequest] = useState(null);
  const [cancelMovement, setCancelMovement] = useState(null);
  const [franchiseCompanyPayment, setFranchiseCompanyPayment] = useState({ statusCode: 'COBRADO', paymentDate: new Date().toISOString().slice(0, 10) });
  const paymentDocumentInputRef = useRef(null);
  const companyPaymentSubmittingRef = useRef(false);
  const clientPaymentSubmittingRef = useRef(false);

  const financeCatalogsQuery = useQuery({ queryKey: ['finance', 'catalogs'], queryFn: getFinanceCatalogs });
  const movementsQuery = useQuery({ queryKey: ['cases', String(caseId), 'financial-movements'], queryFn: () => listFinancialMovements(caseId) });
  const receiptsQuery = useQuery({ queryKey: ['cases', String(caseId), 'receipts'], queryFn: () => listReceipts(caseId) });
  const insuranceProcessingQuery = useQuery({ queryKey: ['cases', String(caseId), 'insurance-processing'], queryFn: () => requestJson(`/cases/${caseId}/insurance-processing`), enabled: caseDetail?.caseTypeCode === 'TODO_RIESGO' || caseDetail?.caseTypeCode === 'GRANIZO' });
  const caseInsuranceQuery = useQuery({ queryKey: ['cases', String(caseId), 'insurance'], queryFn: () => requestJson(`/cases/${caseId}/insurance`), enabled: caseDetail?.caseTypeCode === 'TODO_RIESGO' || caseDetail?.caseTypeCode === 'GRANIZO' });
  const paymentBreakdownQuery = useQuery({ queryKey: ['cases', String(caseId), 'finance', 'payment-breakdown'], queryFn: () => requestJson(`/cases/${caseId}/finance/payment-breakdown`), enabled: caseDetail?.caseTypeCode !== 'GRANIZO' });
  const processing = insuranceProcessingQuery.data;

  const isInsurance = ['TODO_RIESGO', 'GRANIZO'].includes(caseDetail?.caseTypeCode);
  const isTodoRiesgo = caseDetail?.caseTypeCode === 'TODO_RIESGO';
  const isGranizo = caseDetail?.caseTypeCode === 'GRANIZO';
  const isCleas = caseDetail?.caseTypeCode === 'CLEAS';
  const isCleasAdverseTotal = isCleas && cleasOver === 'damage' && cleasOpinion === 'unfavorable';
  const isClosedCleas = isCleasAdverseTotal && Boolean(cleasClosedAt);
  const blockCleasPayments = Boolean(cleasWorkflowGuard) || isClosedCleas;
  const isUnfavorableFranchise = isCleas && cleasOver === 'franchise' && cleasOpinion === 'unfavorable';
  const franchiseSummaryQuery = useQuery({ queryKey: ['cases', String(caseId), 'cleas', 'franchise-summary'], queryFn: () => getCleasFranchisePaymentSummary(caseId), enabled: isUnfavorableFranchise });
  const franchiseCompanyPaymentMutation = useMutation({
    mutationFn: () => registerCleasCompanyFranchisePayment(caseId, franchiseCompanyPayment),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'cleas', 'franchise-summary'] }); toast.success('Pago del cliente a la compañía actualizado.'); },
    onError: (error) => toast.error(error.message || 'No pude actualizar el pago a la compañía.'),
  });
  const cleasNumberDisplay = nroCleas?.trim() ? nroCleas : 'Sin número de CLEAS cargado';
  const franchiseAmount = toAmount(cleasFranchiseDistribution?.franchiseAmount);
  const companyRequiredAmount = toAmount(cleasFranchiseDistribution?.companyRequiredAmount);
  const cleasAmountToBill = isUnfavorableFranchise
    ? toAmount(cleasAgreedAmount) - (franchiseAmount - companyRequiredAmount)
    : cleasAgreedAmount || '';
  const franchiseClientAmount = toAmount(franchiseSummaryQuery.data?.customerPendingAmount);
  const requestedClientPayment = clientPaymentRequest ?? localClientPaymentRequest;
  const activeClientPaymentRequest = isGranizo && requestedClientPayment?.concept === 'FRANQUICIA' ? null : requestedClientPayment;

  useEffect(() => {
    if (!activeClientPaymentRequest) return;
    setForm((current) => ({ ...current, amount: activeClientPaymentRequest.amount || '', cancelacionTipo: activeClientPaymentRequest.concept, movementAt: new Date().toISOString().slice(0, 16) }));
    setShowPaymentModal(true);
  }, [activeClientPaymentRequest]);

  // Derivar MO y repuestos del presupuesto
  const budgetItems = budget?.items ?? [];
  const totalMO = useMemo(() => budgetItems.reduce((sum, item) => sum + toAmount(item.laborAmount || 0), 0), [budgetItems]);
  const totalRepuestos = useMemo(() => budgetItems.reduce((sum, item) => sum + toAmount(item.partValue || 0), 0), [budgetItems]);

  // Total según comprobante
  const cotizadoConIva = useMemo(() => {
    const moConIva = comprobanteTipo === 'A' ? totalMO * 1.21 : totalMO;
    return moConIva + totalRepuestos;
  }, [comprobanteTipo, totalMO, totalRepuestos]);

  const pagado = toAmount(particularFinanceSummary?.customerPaid || 0);
  const pendiente = Math.max(0, cotizadoConIva - pagado);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const monto = toAmount(form.amount);
      if (monto <= 0) { toast.error('Ingresá un monto mayor a 0.'); throw new Error(); }
      if (activeClientPaymentRequest?.concept === 'FRANQUICIA' && monto > toAmount(activeClientPaymentRequest.amount)) {
        toast.error('El pago no puede superar la franquicia pendiente.');
        throw new Error();
      }
      // Si factura=SI, crear recibo primero
      let receiptId = null;
      if (form.factura === 'SI') {
        const totalConIva = comprobanteTipo === 'A' ? monto : monto;
        const neto = comprobanteTipo === 'A' ? monto / 1.21 : monto;
        const iva = comprobanteTipo === 'A' ? monto - neto : 0;
        const receipt = await createReceipt(caseId, {
          receiptTypeCode: 'FACTURA',
          receiptNumber: form.facturaNumero || 'S/N',
          receiverBusinessName: form.razonSocial || caseDetail.principalCustomerName || 'Consumidor Final',
          issuedDate: new Date().toISOString().slice(0, 10),
          taxableNet: Math.round(neto * 100) / 100,
          vatAmount: Math.round(iva * 100) / 100,
          total: monto,
          comprobanteFiscal: comprobanteTipo,
          notes: form.reason || null,
        });
        receiptId = receipt.id;
      }
      // Crear movimiento
      if (activeClientPaymentRequest?.concept === 'TRABAJOS_EXTRAS') {
        return registerExtraBudgetPayment(caseId, {
          expectedVersion: activeClientPaymentRequest.expectedVersion,
          amount: monto,
          movementAt: form.movementAt,
          paymentMethodCode: form.paymentMethodCode,
          paymentMethodDetail: form.paymentMethodDetail || null,
          receiptId,
          reason: form.reason || null,
          externalReference: form.externalReference || null,
        });
      }
      if (isUnfavorableFranchise && activeClientPaymentRequest?.concept === 'FRANQUICIA') return registerCleasCustomerFranchisePayment(caseId, { amount: monto, movementAt: form.movementAt, paymentMethodCode: form.paymentMethodCode, paymentMethodDetail: form.paymentMethodDetail || null, receiptId, externalReference: form.externalReference || null, reason: form.reason || null });
      return createFinancialMovement(caseId, {
        receiptId,
        movementTypeCode: 'INGRESO',
        flowOriginCode: 'CLIENTE',
        counterpartyTypeCode: 'PERSONA',
        counterpartyPersonId: caseDetail.principalCustomerPersonId,
        counterpartyCompanyId: null,
        movementAt: form.movementAt,
        grossAmount: monto,
        netAmount: monto,
        paymentMethodCode: form.paymentMethodCode,
        paymentMethodDetail: form.paymentMethodDetail || null,
        cancellationTypeCode: activeClientPaymentRequest?.concept ?? 'PRESUPUESTO',
        advancePayment: form.advancePayment === 'SI',
        bonification: form.cancelacionTipo === 'BONIFICACION',
        reason: form.reason || null,
        externalReference: form.externalReference || null,
        retentions: [],
        applications: [],
      });
    },
    onSuccess: async () => {
      clientPaymentSubmittingRef.current = false;
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] });
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'financial-movements'] });
       await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'receipts'] });
       await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'finance', 'payment-breakdown'] });
      await queryClient.invalidateQueries({ queryKey: extraBudgetQueryKey(caseId) });
      await onSaved?.();
      setShowPaymentModal(false);
      setLocalClientPaymentRequest(null);
      onClientPaymentRequestHandled?.();
      toast.success(form.factura === 'SI' ? 'Pago y factura registrados.' : 'Pago registrado.');
      setForm((c) => ({ ...c, amount: '', reason: '', externalReference: '', paymentMethodDetail: '', bonificacionMonto: '', bonificacionMotivo: '', razonSocial: '', facturaNumero: '' }));
    },
    onError: (error) => { clientPaymentSubmittingRef.current = false; toast.error(error.message || 'No pude registrar el pago.'); },
  });

  const [ciaPayment, setCiaPayment] = useState({ amount: '', movementAt: new Date().toISOString().slice(0, 16), paymentMethodCode: 'TRANSFERENCIA' });
  const ciaPaymentMutation = useMutation({
    mutationFn: (payload) => createFinancialMovement(caseId, payload),
    onSuccess: async () => { companyPaymentSubmittingRef.current = false; await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'financial-movements'] }); await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'finance', 'payment-breakdown'] }); await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] }); await onSaved?.(); toast.success('Pago de la Cía. registrado.'); setCiaPayment({ amount: '', movementAt: new Date().toISOString().slice(0, 16), paymentMethodCode: 'TRANSFERENCIA' }); },
    onError: (error) => { companyPaymentSubmittingRef.current = false; toast.error(error.message || 'No pude registrar el pago de la compañía.'); },
  });

  // ── Derived for insurance ──
  const ciaMovements = (movementsQuery.data ?? []).filter(m => m.flowOriginCode === 'ASEGURADORA' && m.counterpartyTypeCode === 'COMPANIA' && m.cancellationTypeCode === 'COMPANIA');
  const fallbackCiaPaid = ciaMovements.reduce((sum, m) => sum + toAmount(m.netAmount || 0), 0);
  const fallbackAmountToPay = toAmount(isGranizo ? processing?.agreedAmount : processing?.amountToBillCompany || processing?.agreedAmount || 0);
  const insurerBreakdown = paymentBreakdownQuery.data?.insurer;
  const amountToPay = toAmount(insurerBreakdown?.total ?? fallbackAmountToPay);
  const ciaTotalPaid = toAmount(insurerBreakdown?.paid ?? fallbackCiaPaid);
  const ciaPending = toAmount(insurerBreakdown?.pending ?? Math.max(0, fallbackAmountToPay - fallbackCiaPaid));

  const paymentStatus = useMemo(() => {
    const estimated = processing?.estimatedPaymentDate;
    if (!estimated) return ciaPending <= 0 ? 'Pagado' : 'Pendiente';
    const today = new Date().toISOString().slice(0, 10);
    const hasPayment = ciaTotalPaid >= amountToPay && amountToPay > 0;
    if (!hasPayment) return today > estimated ? 'Atrasado' : 'Pendiente';
    const payments = ciaMovements.filter(m => m.movementAt);
    const lastPaymentDate = payments.length > 0
      ? payments.reduce((latest, m) => (m.movementAt > latest ? m.movementAt : latest), '').slice(0, 10)
      : null;
    return lastPaymentDate && lastPaymentDate > estimated ? 'Pagado con mora' : 'Pagado a término';
  }, [processing?.estimatedPaymentDate, ciaPending, ciaTotalPaid, amountToPay, ciaMovements]);

  const paymentStatusColor = paymentStatus === 'Pagado a término' || paymentStatus === 'Pagado'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
    : paymentStatus === 'Atrasado' || paymentStatus === 'Pagado con mora'
    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400';

  return (
    <>
    <div className="mt-5 space-y-5">
      {/* Resumen */}
      <div className="rounded-3xl border border-border/70 bg-card p-5">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Receipt className="h-5 w-5" /></div>
        <h4 className="text-lg font-semibold">Pagos</h4>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
           <MiniCard label="Cliente" value={caseDetail.principalCustomerName || '—'} />
           <MiniCard label="Vehículo" value={caseDetail.principalVehiclePlate || '—'} />
           {isCleas ? <MiniCard label="N.º de CLEAS" value={cleasNumberDisplay} /> : null}
           <MiniCard label="Cotizado (según cpte.)" value={formatCurrency(cotizadoConIva)} highlight />
          <MiniCard label="Pendiente" value={formatCurrency(pendiente)} highlight={pendiente > 0} variant={pendiente <= 0 ? 'success' : 'warning'} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs">Pagado: {formatCurrency(pagado)}</span>
          {particularFinanceSummary?.hasAdvancePayment ? <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">Tiene seña</span> : null}
          {particularFinanceSummary?.paidInFull ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"><CheckCircle className="h-3.5 w-3.5" />Pago total</span> : null}
        </div>
      </div>

      {/* ── Pago de la Compañía (TODO_RIESGO) ── */}
       {isInsurance ? (
        <div className="rounded-3xl border border-border/70 bg-card p-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div>
          <h4 className="text-lg font-semibold">Facturación y Pago — Compañía</h4>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <MiniCard label="A facturar Cía." value={formatCurrency(amountToPay)} highlight />
            <MiniCard label="Pagado Cía." value={formatCurrency(ciaTotalPaid)} />
            <MiniCard label="Pendiente Cía." value={formatCurrency(ciaPending)} highlight={ciaPending > 0} />
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Estado</span>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${paymentStatusColor}`}>{paymentStatus}</span>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Field label="Fecha pasado a pagos">
              <Input type="date" value={processing?.passedToPaymentsAt ?? ''}
                onChange={async (e) => {
                  await requestJson(`/cases/${caseId}/insurance-processing`, { method: 'PATCH', body: JSON.stringify({ expectedVersion: processing?.version ?? 0, passedToPaymentsAt: e.target.value || null }) });
                  queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'insurance-processing'] });
                }} />
            </Field>
            <Field label="Fecha estimada de pago">
              <Input type="date" value={processing?.estimatedPaymentDate ?? ''}
                onChange={async (e) => {
                  await requestJson(`/cases/${caseId}/insurance-processing`, { method: 'PATCH', body: JSON.stringify({ expectedVersion: processing?.version ?? 0, estimatedPaymentDate: e.target.value || null }) });
                  queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'insurance-processing'] });
                }} />
            </Field>
          </div>
          <div className="mt-4 rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registrar pago de la Cía.</p>
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Monto"><Input type="number" min="0" max={ciaPending} step="0.01" value={ciaPayment.amount} onChange={(e) => setCiaPayment((c) => ({ ...c, amount: e.target.value }))} /></Field>
              <Field label="Fecha"><Input type="datetime-local" value={ciaPayment.movementAt} onChange={(e) => setCiaPayment((c) => ({ ...c, movementAt: e.target.value }))} /></Field>
              <div className="flex items-end"><Button className="w-full" onClick={() => { if (ciaPaymentMutation.isPending || companyPaymentSubmittingRef.current) return; const m = toAmount(ciaPayment.amount); const companyId = insurerBreakdown?.companyId ?? caseInsuranceQuery.data?.insuranceCompanyId; if (m <= 0) { toast.error('Ingresá un monto.'); return; } if (m > ciaPending) { toast.error('El pago no puede superar el saldo pendiente de la compañía.'); return; } if (!companyId) { toast.error('El caso no tiene compañía aseguradora configurada.'); return; } companyPaymentSubmittingRef.current = true; ciaPaymentMutation.mutate({ movementTypeCode: 'INGRESO', flowOriginCode: 'ASEGURADORA', counterpartyTypeCode: 'COMPANIA', counterpartyPersonId: null, counterpartyCompanyId: companyId, movementAt: ciaPayment.movementAt, grossAmount: m, netAmount: m, paymentMethodCode: ciaPayment.paymentMethodCode, paymentMethodDetail: null, cancellationTypeCode: 'COMPANIA', advancePayment: false, bonification: false, reason: 'Pago de compañía', externalReference: null, retentions: [], applications: [] }); }} disabled={ciaPaymentMutation.isPending}><Save className="mr-1.5 h-4 w-4" />Guardar pago de la compañía</Button></div>
            </div>
          </div>
          {ciaMovements.length > 0 ? <div className="mt-3"><p className="text-xs text-muted-foreground">{ciaMovements.length} pago(s) de la Cía.</p></div> : null}
        </div>
      ) : null}

      {isCleas && !blockCleasPayments ? <CleasInvoicePanel caseId={caseId} onSaved={onSaved} /> : null}

      {isCleas ? <CleasCompanyPaymentPanel caseId={caseId} receipts={receiptsQuery.data ?? []} onSaved={onSaved} /> : null}

      {/* Comprobante + Formulario */}
        {!blockCleasPayments && !isInsurance ? (
         <div className="rounded-3xl border border-border/70 bg-card p-5">
           <div className="flex items-center justify-between">
             <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Nuevo pago</h5>
             <Button size="sm" onClick={() => setShowPaymentModal(true)}>+ Registrar pago</Button>
           </div>
         </div>
       ) : null}

         {isTodoRiesgo && toAmount(paymentBreakdownQuery.data?.client?.franchisePending) > 0 ? <div className="rounded-3xl border border-border/70 bg-card p-5" aria-label="Pagos del cliente">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Cliente</p><h4 className="mt-1 text-lg font-semibold">Pagos del cliente</h4><p className="mt-1 text-sm text-muted-foreground">Franquicia canónica pendiente, sin afectar extras ni la liquidación de la compañía.</p></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2"><MiniCard label="Franquicia pendiente" value={formatCurrency(paymentBreakdownQuery.data.client.franchisePending)} highlight /><MiniCard label="Total pendiente cliente" value={formatCurrency(paymentBreakdownQuery.data.client.franchisePending)} highlight /></div>
         {Number(paymentBreakdownQuery.data.client.franchisePending) > 0 ? <div className="mt-4"><Button variant="outline" onClick={() => setLocalClientPaymentRequest({ concept: 'FRANQUICIA', amount: String(paymentBreakdownQuery.data.client.franchisePending) })}>Registrar pago de franquicia</Button></div> : null}
       </div> : null}

        {isUnfavorableFranchise && franchiseSummaryQuery.data ? (
          <Card className="rounded-3xl border-border/70 p-5">
            <h4 className="text-lg font-semibold">Pago de franquicia a cargo del cliente</h4>
           <p className="mt-1 text-sm text-muted-foreground">Liquidación canónica de franquicia adversa.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <MiniCard label="A facturar Cía." value={formatCurrency(franchiseSummaryQuery.data.amountToBillCompany)} highlight />
              <MiniCard label="Franquicia exigida por Cía." value={formatCurrency(franchiseSummaryQuery.data.companyRequiredAmount)} />
              <MiniCard label="Pendiente de franquicia" value={formatCurrency(franchiseClientAmount)} highlight />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {franchiseClientAmount > 0 ? <Button type="button" onClick={() => setLocalClientPaymentRequest({ concept: 'FRANQUICIA', amount: String(franchiseClientAmount) })}>+ Registrar pago al taller</Button> : null}
              <Select aria-label="Estado pago a compañía" value={franchiseCompanyPayment.statusCode} onChange={(event) => setFranchiseCompanyPayment((current) => ({ ...current, statusCode: event.target.value }))} options={[{ value: 'PENDIENTE', label: 'Pendiente' }, { value: 'COBRADO', label: 'Cobrado' }, { value: 'NO_APLICA', label: 'No aplica' }]} />
              <Input aria-label="Fecha pago a compañía" type="date" value={franchiseCompanyPayment.paymentDate} onChange={(event) => setFranchiseCompanyPayment((current) => ({ ...current, paymentDate: event.target.value }))} />
              <Button type="button" variant="outline" disabled={franchiseCompanyPaymentMutation.isPending} onClick={() => franchiseCompanyPaymentMutation.mutate()}>Guardar pago cliente → Cía.</Button>
            </div>
         </Card>
       ) : null}

      {/* Modal: Registrar pago */}
       <Dialog open={!blockCleasPayments && showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Registrar pago" description={<>{`Cliente: ${caseDetail?.principalCustomerName || ''} — ${caseDetail?.principalVehiclePlate || ''}`}{isCleas ? <><br /><span>N.º de CLEAS: {cleasNumberDisplay}</span></> : null}</>} scrollable={isCleas}>

         {/* Tipo de comprobante */}
        <div className="mb-5 rounded-2xl border border-border/60 bg-background/70 p-4">
          <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo de comprobante</Label>
          <div className="flex flex-wrap gap-2">
            {COMPROBANTE_TYPES.map((ct) => (
              <button key={ct.value} type="button" onClick={() => setComprobanteTipo(ct.value)}
                className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                  comprobanteTipo === ct.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border/60 bg-background text-foreground hover:border-primary/30'
                }`}>
                {ct.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {comprobanteTipo === 'A' ? `MO: ${formatCurrency(totalMO)} + IVA 21%: ${formatCurrency(totalMO * 0.21)} + Repuestos: ${formatCurrency(totalRepuestos)} = Total: ${formatCurrency(cotizadoConIva)}` : `MO: ${formatCurrency(totalMO)} + Repuestos: ${formatCurrency(totalRepuestos)} = Total: ${formatCurrency(cotizadoConIva)}`}
          </p>
        </div>

        {/* Formulario */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Monto"><Input type="number" min="0" max={activeClientPaymentRequest?.concept === 'FRANQUICIA' ? activeClientPaymentRequest.amount : undefined} step="0.01" value={form.amount} onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))} placeholder={cotizadoConIva > 0 ? `Ej: ${Math.round(cotizadoConIva)}` : '0'} /></Field>
          <Field label="Fecha y hora"><Input type="datetime-local" value={form.movementAt} onChange={(e) => setForm((c) => ({ ...c, movementAt: e.target.value }))} /></Field>
          <Field label="Seña"><Select value={form.advancePayment} onChange={(e) => setForm((c) => ({ ...c, advancePayment: e.target.value }))} options={[{ value: 'NO', label: 'No' }, { value: 'SI', label: 'Sí' }]} /></Field>
          <Field label="Cancela saldo"><Select value={form.cancelacionTipo} disabled={Boolean(activeClientPaymentRequest)} onChange={(e) => setForm((c) => ({ ...c, cancelacionTipo: e.target.value }))} options={activeClientPaymentRequest ? [{ value: activeClientPaymentRequest.concept, label: activeClientPaymentRequest.concept === 'TRABAJOS_EXTRAS' ? 'Trabajos extras' : 'Franquicia' }] : CANCELACION_TYPES} /></Field>
          <Field label="Modo"><Select value={form.paymentMethodCode} onChange={(e) => setForm((c) => ({ ...c, paymentMethodCode: e.target.value }))} options={PAYMENT_METHODS} /></Field>
          <Field label="Factura"><Select value={form.factura} onChange={(e) => setForm((c) => ({ ...c, factura: e.target.value }))} options={[{ value: 'NO', label: 'No' }, { value: 'SI', label: 'Sí' }]} /></Field>
        </div>

        {/* Condicional: Bonificación */}
        {form.cancelacionTipo === 'BONIFICACION' ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="Monto bonificación"><Input type="number" min="0" step="0.01" value={form.bonificacionMonto} onChange={(e) => setForm((c) => ({ ...c, bonificacionMonto: e.target.value }))} /></Field>
            <Field label="Fecha bonificación"><Input type="date" value={form.bonificacionFecha} onChange={(e) => setForm((c) => ({ ...c, bonificacionFecha: e.target.value }))} /></Field>
            <Field label="Motivo bonificación"><Input value={form.bonificacionMotivo} onChange={(e) => setForm((c) => ({ ...c, bonificacionMotivo: e.target.value }))} placeholder="¿Por qué se descontó?" /></Field>
          </div>
        ) : null}

        {/* Condicional: Otro medio de pago */}
        {form.paymentMethodCode === 'OTRO' ? (
          <div className="mt-4">
            <Field label="Detalle del medio de pago"><Input value={form.paymentMethodDetail} onChange={(e) => setForm((c) => ({ ...c, paymentMethodDetail: e.target.value }))} placeholder="Describí el medio de pago" /></Field>
          </div>
        ) : (
          <div className="mt-4">
            <Field label="Detalle medio de pago (opcional)"><Input value={form.paymentMethodDetail} onChange={(e) => setForm((c) => ({ ...c, paymentMethodDetail: e.target.value }))} placeholder="Ej: últimos 4 dígitos, n° de cheque" /></Field>
          </div>
        )}

        {/* Condicional: Factura */}
        {form.factura === 'SI' ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Razón social"><Input value={form.razonSocial} onChange={(e) => setForm((c) => ({ ...c, razonSocial: e.target.value }))} placeholder="Nombre o razón social" /></Field>
            <Field label="N° factura"><Input value={form.facturaNumero} onChange={(e) => setForm((c) => ({ ...c, facturaNumero: e.target.value }))} placeholder="Número de factura" /></Field>
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Referencia externa"><Input value={form.externalReference} onChange={(e) => setForm((c) => ({ ...c, externalReference: e.target.value }))} placeholder="N° de operación, cheque, etc." /></Field>
          <Field label="Motivo / notas"><Textarea rows={3} value={form.reason} onChange={(e) => setForm((c) => ({ ...c, reason: e.target.value }))} placeholder="Detalle del pago" /></Field>
        </div>

        {isCleas ? (
          <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">Datos CLEAS del pago</p>
            {/* Grupo visual CLEAS: datos principales del pago, responsive sin afectar el formulario persistente. */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Fecha de pago"><Input type="date" value={cleasPaymentsUi.paymentDraft.paidAt} onChange={(event) => onCleasPaymentsUiChange((current) => ({ ...current, paymentDraft: { ...current.paymentDraft, paidAt: event.target.value } }))} /></Field>
              <Field label="Estado del pago"><Select value={cleasPaymentsUi.paymentDraft.status} onChange={(event) => onCleasPaymentsUiChange((current) => ({ ...current, paymentDraft: { ...current.paymentDraft, status: event.target.value } }))} options={[{ value: 'PENDIENTE', label: 'Pendiente' }, { value: 'EN_TERMINO', label: 'En término' }, { value: 'ATRASADO', label: 'Atrasado' }]} /></Field>
              <Field label="Monto depositado"><Input type="number" min="0" step="0.01" value={cleasPaymentsUi.paymentDraft.depositedAmount} onChange={(event) => onCleasPaymentsUiChange((current) => ({ ...current, paymentDraft: { ...current.paymentDraft, depositedAmount: event.target.value } }))} /></Field>
              <Field label="Retenciones"><Select value={cleasPaymentsUi.paymentDraft.hasRetentions} onChange={(event) => onCleasPaymentsUiChange((current) => ({ ...current, paymentDraft: { ...current.paymentDraft, hasRetentions: event.target.value } }))} options={[{ value: 'NO', label: 'No' }, { value: 'SI', label: 'Sí' }]} /></Field>
              <div className="flex items-end">
                <input ref={paymentDocumentInputRef} type="file" className="hidden" onChange={(event) => { const file = event.target.files?.[0] ?? null; onCleasPaymentsUiChange((current) => ({ ...current, paymentDocument: { file, name: file?.name || '' } })); }} />
                <Button type="button" variant="outline" className="w-full" onClick={() => paymentDocumentInputRef.current?.click()}>Documentación de pago</Button>
              </div>
              {cleasPaymentsUi.paymentDocument.name ? <p className="self-end text-xs text-muted-foreground">{cleasPaymentsUi.paymentDocument.name}</p> : null}
            </div>
            {cleasPaymentsUi.paymentDraft.hasRetentions === 'SI' ? (
              <>
                {/* Grupo visual CLEAS: retenciones, visible solo cuando se informan. */}
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="IVA"><Input type="number" min="0" step="0.01" value={cleasPaymentsUi.paymentDraft.vatRetention} onChange={(event) => onCleasPaymentsUiChange((current) => ({ ...current, paymentDraft: { ...current.paymentDraft, vatRetention: event.target.value } }))} /></Field>
                  <Field label="Ganancias"><Input type="number" min="0" step="0.01" value={cleasPaymentsUi.paymentDraft.earningsRetention} onChange={(event) => onCleasPaymentsUiChange((current) => ({ ...current, paymentDraft: { ...current.paymentDraft, earningsRetention: event.target.value } }))} /></Field>
                  <Field label="Contribución patrimonial"><Input type="number" min="0" step="0.01" value={cleasPaymentsUi.paymentDraft.patrimonialContribution} onChange={(event) => onCleasPaymentsUiChange((current) => ({ ...current, paymentDraft: { ...current.paymentDraft, patrimonialContribution: event.target.value } }))} /></Field>
                  <Field label="IIBB"><Input type="number" min="0" step="0.01" value={cleasPaymentsUi.paymentDraft.iibbRetention} onChange={(event) => onCleasPaymentsUiChange((current) => ({ ...current, paymentDraft: { ...current.paymentDraft, iibbRetention: event.target.value } }))} /></Field>
                  <Field label="DReI"><Input type="number" min="0" step="0.01" value={cleasPaymentsUi.paymentDraft.dreiRetention} onChange={(event) => onCleasPaymentsUiChange((current) => ({ ...current, paymentDraft: { ...current.paymentDraft, dreiRetention: event.target.value } }))} /></Field>
                  <Field label="Otra"><Input type="number" min="0" step="0.01" value={cleasPaymentsUi.paymentDraft.otherRetention} onChange={(event) => onCleasPaymentsUiChange((current) => ({ ...current, paymentDraft: { ...current.paymentDraft, otherRetention: event.target.value } }))} /></Field>
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => { setShowPaymentModal(false); setLocalClientPaymentRequest(null); onClientPaymentRequestHandled?.(); }}>Cancelar</Button>
          <Button className="flex-1" onClick={() => { if (saveMutation.isPending || clientPaymentSubmittingRef.current) return; clientPaymentSubmittingRef.current = true; saveMutation.mutate(); }} disabled={saveMutation.isPending || !caseDetail.principalCustomerPersonId}><Save className="mr-1.5 h-4 w-4" />Registrar pago</Button>
        </div>
      </Dialog>

      {/* Historial */}
      <div className="rounded-3xl border border-border/70 bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Historial de movimientos</h5>
        </div>
        {(movementsQuery.data ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 py-6 text-center text-sm text-muted-foreground">Sin movimientos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/60 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                   <th className="px-3 py-3 text-left">Fecha</th>
                   <th className="px-3 py-3 text-left">Pagador</th>
                   <th className="px-3 py-3 text-left">Tipo</th>
                   <th className="px-3 py-3 text-left">Concepto</th>
                  <th className="px-3 py-3 text-right">Monto</th>
                  <th className="px-3 py-3 text-left">Medio</th>
                   <th className="px-3 py-3 text-left">Estado / anulación</th>
                   <th className="px-3 py-3 text-left">Comprobante / notas</th>
                  <th className="px-3 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {(movementsQuery.data ?? []).map((m) => (
                  <tr key={m.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3 font-medium">{m.movementAt?.slice(0, 16).replace('T', ' ')}</td>
                     <td className="px-3 py-3">{m.flowOriginCode === 'ASEGURADORA' ? 'Compañía' : 'Cliente'}</td>
                     <td className="px-3 py-3">
                       <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${m.movementTypeCode === 'INGRESO' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400'}`}>{m.movementTypeCode}</span>
                     </td>
                    <td className="px-3 py-3 text-right font-medium">{formatCurrency(m.netAmount)}</td>
                    <td className="px-3 py-3 text-muted-foreground">{m.paymentMethodCode || '—'}</td>
                     <td className="px-3 py-3">{m.cancellationTypeCode ? <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-xs font-medium">{m.cancellationTypeCode}</span> : '—'}</td>
                     <td className="px-3 py-3 text-xs text-muted-foreground max-w-[150px] truncate">{m.movementTypeCode === 'EGRESO' ? `Anulado: ${m.reason || 'sí'}` : 'Vigente'}</td>
                     <td className="px-3 py-3 text-xs text-muted-foreground max-w-[150px] truncate">{m.receiptId ? `Recibo #${m.receiptId}` : m.externalReference || m.reason || '—'}</td>
                    <td className="px-3 py-3">
                     {!blockCleasPayments ? (
                      <div className="flex items-center gap-1">
                        <button type="button" className="rounded-lg px-2 py-1 text-[11px] text-muted-foreground transition hover:bg-primary/10 hover:text-primary" title="Descargar comprobante" onClick={async () => {
                          const stored = readStoredAuth();
                          const url = getClientPaymentPdfUrl(caseId, caseDetail?.principalCustomerName || 'Cliente', caseDetail?.principalVehiclePlate || '', comprobanteTipo, m.netAmount || 0, m.reason || '', '', '');
                          const res = await fetch(url, { headers: { Authorization: `Bearer ${stored?.accessToken}` } });
                          if (!res.ok) { toast.error('No se pudo generar el PDF.'); return; }
                          const blob = await res.blob();
                          const a = document.createElement('a');
                          a.href = URL.createObjectURL(blob);
                          a.download = `comprobante-${m.id}.pdf`;
                          a.click();
                        }}><FileDown className="mr-1 h-3.5 w-3.5" />Descargar comprobante</button>
                        <button type="button" className="rounded-lg px-2 py-1 text-[11px] text-muted-foreground transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950" title="Anular pago"
                          onClick={() => setCancelMovement(m)}><Ban className="mr-1 h-3.5 w-3.5" />Anular</button>
                      </div>
                     ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recibos emitidos */}
      {(receiptsQuery.data ?? []).length > 0 ? (
        <div className="rounded-3xl border border-border/70 bg-card p-5">
          <h5 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recibos / Facturas emitidas</h5>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/60 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-3 py-3 text-left">Tipo</th>
                  <th className="px-3 py-3 text-left">Número</th>
                  <th className="px-3 py-3 text-left">Cliente</th>
                  <th className="px-3 py-3 text-left">Fecha</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-3 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {(receiptsQuery.data ?? []).map((r) => (
                  <tr key={r.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3"><span className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-xs font-medium">{r.comprobanteFiscal ? `Factura ${r.comprobanteFiscal}` : r.receiptTypeCode}</span></td>
                    <td className="px-3 py-3 font-medium">{r.receiptNumber}</td>
                    <td className="px-3 py-3 text-muted-foreground">{r.receiverBusinessName}</td>
                    <td className="px-3 py-3 text-muted-foreground">{r.issuedDate}</td>
                    <td className="px-3 py-3 text-right font-medium">{formatCurrency(r.total)}</td>
                    <td className="px-3 py-3">
                     {!blockCleasPayments ? (
                      <a href={getReceiptPdfUrl(r.id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary transition hover:bg-primary/10" title="Descargar PDF">
                        <FileDown className="h-4 w-4" />PDF
                      </a>
                     ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

    </div>

    {/* Confirmación anular pago */}
    <Dialog open={!!cancelMovement} onClose={() => setCancelMovement(null)} title="¿Anular este pago?" description="Se registrará un egreso por el mismo monto para revertir el movimiento.">
      <div className="mt-4 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => setCancelMovement(null)}>Cancelar</Button>
        <Button variant="destructive" className="flex-1" onClick={async () => {
          const m = cancelMovement;
          setCancelMovement(null);
          try {
            if (isCleas && m.flowOriginCode === 'ASEGURADORA' && m.cancellationTypeCode === 'COMPANIA') {
              await annulCleasCompanyPayment(caseId, m.id);
              await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'cleas', 'summary'] });
            } else {
              await createFinancialMovement(caseId, {
                movementTypeCode: 'EGRESO', flowOriginCode: m.flowOriginCode || 'CLIENTE',
                counterpartyTypeCode: m.counterpartyTypeCode || 'PERSONA',
                counterpartyPersonId: m.counterpartyPersonId || null, counterpartyCompanyId: m.counterpartyCompanyId || null,
                movementAt: new Date().toISOString(),
                grossAmount: m.netAmount, netAmount: m.netAmount,
                paymentMethodCode: m.paymentMethodCode || null,
                cancellationTypeCode: m.cancellationTypeCode || null, advancePayment: false, bonification: false,
                reason: `Anulación de pago #${m.id}`, externalReference: null, retentions: [], applications: [],
              });
            }
            await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'financial-movements'] });
             await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] });
             await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'finance', 'payment-breakdown'] });
            await onSaved?.();
            toast.success('Pago anulado.');
          } catch (e) { toast.error(e.message || 'No se pudo anular el pago.'); }
        }}>Anular pago</Button>
      </div>
    </Dialog>
    </>
  );
};

const MiniCard = ({ label, value, highlight, variant }) => (
  <div className={`rounded-2xl border px-4 py-3 ${variant === 'success' ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30' : variant === 'warning' ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30' : 'border-border/60 bg-background/70'}`}>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`mt-1 text-lg font-semibold ${highlight ? 'text-primary' : ''}`}>{value}</p>
  </div>
);

const CleasCompanyPaymentPanel = ({ caseId, receipts, onSaved }) => {
  const queryClient = useQueryClient();
  const summaryQuery = useQuery({
    queryKey: ['cases', String(caseId), 'cleas', 'summary'],
    queryFn: () => getCleasCompanyPaymentSummary(caseId),
  });
  const documentsQuery = useQuery({
    queryKey: ['cases', String(caseId), 'documents'],
    queryFn: () => requestJson(`/cases/${caseId}/documents`),
  });
  const documentCategoriesQuery = useQuery({
    queryKey: ['documents', 'catalogs'],
    queryFn: () => requestJson('/documents/catalogs'),
  });
  const financeCatalogsQuery = useQuery({ queryKey: ['finance', 'catalogs'], queryFn: getFinanceCatalogs });
  const [form, setForm] = useState({
    amount: '',
    movementAt: new Date().toISOString().slice(0, 16),
    paymentMethodCode: 'TRANSFERENCIA',
    receiptId: '',
    documentId: '',
    proofFile: null,
    retentions: [],
    externalReference: '',
    reason: '',
  });
  const paymentMutation = useMutation({
    mutationFn: async () => {
      let documentId = form.documentId ? Number(form.documentId) : null;
      if (form.proofFile) {
        const paymentProofCategory = (documentCategoriesQuery.data?.categories ?? []).find((category) => category.code === 'COMPROBANTE_PAGO_CLEAS');
        if (!paymentProofCategory) throw new Error('No está disponible la categoría Comprobante de pago CLEAS.');
        const upload = new FormData();
        upload.append('file', form.proofFile);
        upload.append('categoryId', String(paymentProofCategory.id));
        upload.append('originCode', 'CLEAS');
        const document = await requestJson('/documents', { method: 'POST', body: upload });
        documentId = document.id;
      }
      if (!documentId) throw new Error('Seleccioná o subí el comprobante de pago CLEAS.');
      return registerCleasCompanyPayment(caseId, {
        amount: toAmount(form.amount),
        movementAt: form.movementAt,
        paymentMethodCode: form.paymentMethodCode,
        paymentMethodDetail: null,
        receiptId: form.receiptId ? Number(form.receiptId) : null,
        documentId,
        retentions: form.retentions
          .filter((retention) => retention.retentionTypeCode && toAmount(retention.amount) > 0)
          .map((retention) => ({ retentionTypeCode: retention.retentionTypeCode, amount: toAmount(retention.amount), detail: retention.detail.trim() || null })),
        externalReference: form.externalReference || null,
        reason: form.reason || null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'cleas', 'summary'] });
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'financial-movements'] });
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'documents'] });
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] });
      await onSaved?.();
      setForm({ amount: '', movementAt: new Date().toISOString().slice(0, 16), paymentMethodCode: 'TRANSFERENCIA', receiptId: '', documentId: '', proofFile: null, retentions: [], externalReference: '', reason: '' });
      toast.success('Pago CLEAS de la compañía registrado.');
    },
    onError: (error) => toast.error(error.message || 'No pude registrar el pago de la compañía.'),
  });
  const pdfMutation = useMutation({
    mutationFn: async () => ({ blob: await downloadCleasLiquidationPdf(caseId) }),
    onSuccess: ({ blob }) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `liquidacion-cleas-${caseId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    },
    onError: (error) => toast.error(error.message || 'No pude generar el PDF de liquidación CLEAS.'),
  });

  if (summaryQuery.isLoading) return null;
  if (summaryQuery.isError) {
    return <div role="alert" className="rounded-3xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">{summaryQuery.error.message}</div>;
  }

  const summary = summaryQuery.data;
  if (!summary) return null;
  const pendingGrossAmount = toAmount(summary.pendingGrossAmount ?? summary.pendingAmount);
  const grossAmount = toAmount(form.amount);
  const retentionsAmount = form.retentions.reduce((total, retention) => total + toAmount(retention.amount), 0);
  const netAmount = Math.max(0, grossAmount - retentionsAmount);
  const paymentProofCategory = (documentCategoriesQuery.data?.categories ?? []).find((category) => category.code === 'COMPROBANTE_PAGO_CLEAS');
  const paymentProofs = (documentsQuery.data ?? []).filter((document) => String(document.categoryId) === String(paymentProofCategory?.id));
  const retentionTypes = financeCatalogsQuery.data?.retentionTypeCodes ?? [];
  const canSubmit = grossAmount > 0 && grossAmount <= pendingGrossAmount && retentionsAmount <= grossAmount && Boolean(form.documentId || form.proofFile) && !paymentMutation.isPending;

  const updateRetention = (index, field, value) => setForm((current) => ({
    ...current,
    retentions: current.retentions.map((retention, retentionIndex) => retentionIndex === index ? { ...retention, [field]: value } : retention),
  }));

  return (
    <Card className="rounded-3xl border-border/70 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div><h4 className="text-lg font-semibold">Pago de compañía CLEAS</h4></div>
        <Button variant="outline" size="sm" onClick={() => pdfMutation.mutate()} disabled={pdfMutation.isPending}><FileDown className="mr-1.5 h-4 w-4" />Liquidación PDF</Button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <MiniCard label="Acordado" value={formatCurrency(summary.agreedAmount)} highlight />
        <MiniCard label="Bruto cancelado" value={formatCurrency(summary.paidGrossAmount ?? summary.paidAmount)} />
        <MiniCard label="Saldo bruto" value={formatCurrency(pendingGrossAmount)} highlight={pendingGrossAmount > 0} />
        <MiniCard label="Retenciones de este pago" value={formatCurrency(retentionsAmount)} />
      </div>
      {pendingGrossAmount > 0 ? (
        <>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Bruto que cancela"><Input type="number" min="0" max={pendingGrossAmount} step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} /></Field>
          <Field label="Neto depositado"><Input value={formatCurrency(netAmount)} readOnly className="cursor-not-allowed bg-muted/60 text-muted-foreground" /></Field>
          <Field label="Fecha y hora del pago"><Input type="datetime-local" value={form.movementAt} onChange={(event) => setForm((current) => ({ ...current, movementAt: event.target.value }))} /></Field>
          <Field label="Medio de pago"><Select value={form.paymentMethodCode} onChange={(event) => setForm((current) => ({ ...current, paymentMethodCode: event.target.value }))} options={PAYMENT_METHODS} /></Field>
          <Field label="Factura asociada (opcional)"><Select value={form.receiptId} onChange={(event) => setForm((current) => ({ ...current, receiptId: event.target.value }))} options={[{ value: '', label: 'Sin factura asociada' }, ...receipts.filter((receipt) => receipt.receiptTypeCode === 'FACTURA').map((receipt) => ({ value: String(receipt.id), label: `${receipt.receiptNumber} - ${formatCurrency(receipt.total)}` }))]} /></Field>
          <Field label="Comprobante existente"><Select value={form.documentId} onChange={(event) => setForm((current) => ({ ...current, documentId: event.target.value, proofFile: null }))} options={[{ value: '', label: 'Seleccionar comprobante...' }, ...paymentProofs.map((document) => ({ value: String(document.documentId), label: document.fileName || `Documento #${document.documentId}` }))]} /></Field>
          <Field label="O subir comprobante CLEAS"><Input type="file" onChange={(event) => setForm((current) => ({ ...current, proofFile: event.target.files?.[0] ?? null, documentId: '' }))} /></Field>
          <Field label="Referencia externa"><Input value={form.externalReference} onChange={(event) => setForm((current) => ({ ...current, externalReference: event.target.value }))} /></Field>
          <Field label="Notas"><Textarea rows={3} value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} /></Field>
        </div>
        <div className="mt-4 rounded-2xl border border-border/60 p-4">
          <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">Retenciones</p><Button type="button" size="sm" variant="outline" onClick={() => setForm((current) => ({ ...current, retentions: [...current.retentions, { retentionTypeCode: retentionTypes[0]?.code ?? '', amount: '', detail: '' }] }))} disabled={!retentionTypes.length}>Agregar retención</Button></div>
          {form.retentions.map((retention, index) => <div key={index} className="mt-3 grid gap-3 md:grid-cols-[1fr_150px_1fr_auto]">
            <Select aria-label={`Tipo de retención ${index + 1}`} value={retention.retentionTypeCode} onChange={(event) => updateRetention(index, 'retentionTypeCode', event.target.value)} options={[{ value: '', label: 'Tipo de retención...' }, ...retentionTypes.map((type) => ({ value: type.code, label: type.name || type.code }))]} />
            <Input aria-label={`Monto retención ${index + 1}`} type="number" min="0" step="0.01" value={retention.amount} onChange={(event) => updateRetention(index, 'amount', event.target.value)} />
            <Input aria-label={`Detalle retención ${index + 1}`} value={retention.detail} onChange={(event) => updateRetention(index, 'detail', event.target.value)} placeholder="Detalle opcional" />
            <Button type="button" variant="ghost" onClick={() => setForm((current) => ({ ...current, retentions: current.retentions.filter((_, retentionIndex) => retentionIndex !== index) }))}>Quitar</Button>
          </div>)}
          {!retentionTypes.length ? <p className="mt-3 text-xs text-muted-foreground">No hay tipos de retención activos disponibles.</p> : null}
          {retentionsAmount > grossAmount ? <p role="alert" className="mt-3 text-xs text-destructive">Las retenciones no pueden superar el bruto que cancela.</p> : null}
        </div>
        <div className="mt-4 flex justify-end"><Button disabled={!canSubmit} onClick={() => paymentMutation.mutate()}><Save className="mr-1.5 h-4 w-4" />Registrar pago de compañía</Button></div>
        </>
      ) : <p className="mt-4 text-sm text-muted-foreground">La compañía no tiene saldo pendiente.</p>}
    </Card>
  );
};

const CleasInvoicePanel = ({ caseId, onSaved }) => {
  const queryClient = useQueryClient();
  const summaryQuery = useQuery({ queryKey: ['cases', String(caseId), 'cleas', 'summary'], queryFn: () => getCleasCompanyPaymentSummary(caseId) });
  const receiptsQuery = useQuery({ queryKey: ['cases', String(caseId), 'receipts'], queryFn: () => listReceipts(caseId) });
  const [form, setForm] = useState({ receiptNumber: '', receiverBusinessName: '', issuedDate: new Date().toISOString().slice(0, 10) });
  const invoiceMutation = useMutation({
    mutationFn: () => createReceipt(caseId, {
      receiptTypeCode: 'FACTURA', receiptNumber: form.receiptNumber.trim(), receiverBusinessName: form.receiverBusinessName.trim(), issuedDate: form.issuedDate,
      taxableNet: toAmount(summaryQuery.data.agreedAmount), vatAmount: 0, total: toAmount(summaryQuery.data.agreedAmount), comprobanteFiscal: null, notes: null,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'receipts'] });
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] });
      await onSaved?.();
      setForm({ receiptNumber: '', receiverBusinessName: '', issuedDate: new Date().toISOString().slice(0, 10) });
      toast.success('Factura CLEAS registrada.');
    },
    onError: (error) => toast.error(error.message || 'No pude registrar la factura CLEAS.'),
  });

  if (summaryQuery.isLoading || receiptsQuery.isLoading) return null;
  if (summaryQuery.isError) return null;
  if (!summaryQuery.data) return null;

  const agreedAmount = toAmount(summaryQuery.data.agreedAmount);
  const invoices = (receiptsQuery.data ?? []).filter((receipt) => receipt.receiptTypeCode === 'FACTURA');
  const canSubmit = agreedAmount > 0 && Boolean(form.receiptNumber.trim()) && Boolean(form.receiverBusinessName.trim()) && Boolean(form.issuedDate) && !invoiceMutation.isPending;

  return (
  <Card className="rounded-3xl border-border/70 p-5">
    <h4 className="text-lg font-semibold">Facturación</h4>
    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Monto acordado"><Input value={formatCurrency(agreedAmount)} readOnly className="cursor-not-allowed bg-muted/60 text-muted-foreground" /></Field>
      <Field label="N.º de factura"><Input value={form.receiptNumber} onChange={(event) => setForm((current) => ({ ...current, receiptNumber: event.target.value }))} /></Field>
      <Field label="Razón social"><Input value={form.receiverBusinessName} onChange={(event) => setForm((current) => ({ ...current, receiverBusinessName: event.target.value }))} /></Field>
      <Field label="Fecha de emisión"><Input type="date" value={form.issuedDate} onChange={(event) => setForm((current) => ({ ...current, issuedDate: event.target.value }))} /></Field>
    </div>
    <div className="mt-5"><Button type="button" disabled={!canSubmit} onClick={() => invoiceMutation.mutate()}>+ Registrar factura</Button></div>
    <div className="mt-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Facturas del caso</p>
      {invoices.length === 0 ? <p className="text-sm text-muted-foreground">Sin facturas registradas.</p> : <ul className="space-y-2">{invoices.map((invoice) => <li key={invoice.id} className="flex flex-wrap justify-between gap-2 rounded-2xl border border-border/60 px-4 py-3 text-sm"><span>{invoice.receiptNumber} - {invoice.receiverBusinessName}</span><strong>{formatCurrency(invoice.total)}</strong></li>)}</ul>}
    </div>
  </Card>
  );
};

const Field = ({ label, children }) => {
  const id = useId();

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      {cloneElement(children, { id })}
    </div>
  );
};

const Select = ({ options, ...props }) => (
  <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" {...props}>
    {options.map((option) => (
      <option key={option.value} value={option.value}>{option.label}</option>
    ))}
  </select>
);
