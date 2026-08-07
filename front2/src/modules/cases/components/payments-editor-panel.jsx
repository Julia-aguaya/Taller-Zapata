import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Building2, CheckCircle, FileDown, Receipt, Save } from 'lucide-react';
import { toast } from 'sonner';
import { createFinancialMovement, createReceipt, getClientPaymentPdfUrl, getFinanceCatalogs, getReceiptPdfUrl, listFinancialMovements, listReceipts } from '@/modules/cases/api/finance-api';
import { useSession } from '@/modules/auth/providers/session-provider';
import { requestJson } from '@/shared/api/http-client';
import { readStoredAuth } from '@/shared/auth/session-storage';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

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

export const PaymentsEditorPanel = ({ caseId, caseDetail, budget, particularFinanceSummary, onSaved }) => {
  const queryClient = useQueryClient();
  const { session } = useSession();

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

  const financeCatalogsQuery = useQuery({ queryKey: ['finance', 'catalogs'], queryFn: getFinanceCatalogs });
  const movementsQuery = useQuery({ queryKey: ['cases', String(caseId), 'financial-movements'], queryFn: () => listFinancialMovements(caseId) });
  const receiptsQuery = useQuery({ queryKey: ['cases', String(caseId), 'receipts'], queryFn: () => listReceipts(caseId) });
  const insuranceProcessingQuery = useQuery({ queryKey: ['cases', String(caseId), 'insurance-processing'], queryFn: () => requestJson(`/cases/${caseId}/insurance-processing`), enabled: caseDetail?.caseTypeCode === 'TODO_RIESGO' });
  const processing = insuranceProcessingQuery.data;

  const isInsurance = caseDetail?.caseTypeCode === 'TODO_RIESGO';

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
        cancellationTypeCode: form.cancelacionTipo === 'BONIFICACION' ? 'PRESUPUESTO' : 'PRESUPUESTO',
        advancePayment: form.advancePayment === 'SI',
        bonification: form.cancelacionTipo === 'BONIFICACION',
        reason: form.reason || null,
        externalReference: form.externalReference || null,
        retentions: [],
        applications: [],
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] });
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'financial-movements'] });
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'receipts'] });
      await onSaved?.();
      toast.success(form.factura === 'SI' ? 'Pago y factura registrados.' : 'Pago registrado.');
      setForm((c) => ({ ...c, amount: '', reason: '', externalReference: '', paymentMethodDetail: '', bonificacionMonto: '', bonificacionMotivo: '', razonSocial: '', facturaNumero: '' }));
    },
    onError: (error) => toast.error(error.message || 'No pude registrar el pago.'),
  });

  const [ciaPayment, setCiaPayment] = useState({ amount: '', movementAt: new Date().toISOString().slice(0, 16), paymentMethodCode: 'TRANSFERENCIA' });
  const ciaPaymentMutation = useMutation({
    mutationFn: (payload) => createFinancialMovement(caseId, payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'financial-movements'] }); await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] }); await onSaved?.(); toast.success('Pago de la Cía. registrado.'); setCiaPayment({ amount: '', movementAt: new Date().toISOString().slice(0, 16), paymentMethodCode: 'TRANSFERENCIA' }); },
    onError: (error) => toast.error(error.message),
  });

  // ── Derived for insurance ──
  const ciaMovements = (movementsQuery.data ?? []).filter(m => m.flowOriginCode === 'CIA' || m.counterpartyTypeCode === 'COMPANY');
  const ciaTotalPaid = ciaMovements.reduce((sum, m) => sum + toAmount(m.netAmount || 0), 0);
  const amountToPay = toAmount(processing?.amountToBillCompany || processing?.agreedAmount || 0);
  const ciaPending = Math.max(0, amountToPay - ciaTotalPaid);

  return (
    <div className="mt-5 space-y-5">
      {/* Resumen */}
      <div className="rounded-3xl border border-border/70 bg-card p-5">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Receipt className="h-5 w-5" /></div>
        <h4 className="text-lg font-semibold">Pagos</h4>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MiniCard label="Cliente" value={caseDetail.principalCustomerName || '—'} />
          <MiniCard label="Vehículo" value={caseDetail.principalVehiclePlate || '—'} />
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
            <MiniCard label="Pendiente Cía." value={formatCurrency(ciaPending)} highlight={ciaPending > 0} variant={ciaPending <= 0 ? 'success' : 'warning'} />
            <MiniCard label="Estado" value={ciaPending <= 0 ? 'Pagado' : 'Pendiente'} variant={ciaPending <= 0 ? 'success' : 'warning'} />
          </div>
          <div className="mt-4 rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registrar pago de la Cía.</p>
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Monto"><Input type="number" min="0" step="0.01" value={ciaPayment.amount} onChange={(e) => setCiaPayment((c) => ({ ...c, amount: e.target.value }))} /></Field>
              <Field label="Fecha"><Input type="datetime-local" value={ciaPayment.movementAt} onChange={(e) => setCiaPayment((c) => ({ ...c, movementAt: e.target.value }))} /></Field>
              <div className="flex items-end"><Button className="w-full" onClick={() => { const m = toAmount(ciaPayment.amount); if (m <= 0) { toast.error('Ingresá un monto.'); return; } ciaPaymentMutation.mutate({ movementTypeCode: 'INGRESO', flowOriginCode: 'CIA', counterpartyTypeCode: 'COMPANY', counterpartyPersonId: null, counterpartyCompanyId: null, movementAt: ciaPayment.movementAt, grossAmount: m, netAmount: m, paymentMethodCode: ciaPayment.paymentMethodCode, paymentMethodDetail: null, cancellationTypeCode: 'PRESUPUESTO', advancePayment: false, bonification: false, reason: null, externalReference: null, retentions: [], applications: [] }); }} disabled={ciaPaymentMutation.isPending}><Save className="mr-1.5 h-4 w-4" />Registrar</Button></div>
            </div>
          </div>
          {ciaMovements.length > 0 ? <div className="mt-3"><p className="text-xs text-muted-foreground">{ciaMovements.length} pago(s) de la Cía.</p></div> : null}
        </div>
      ) : null}

      {/* Comprobante + Formulario */}
      <div className="rounded-3xl border border-border/70 bg-card p-5">
        <h5 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Nuevo pago</h5>

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
          <Field label="Monto"><Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))} placeholder={cotizadoConIva > 0 ? `Ej: ${Math.round(cotizadoConIva)}` : '0'} /></Field>
          <Field label="Fecha y hora"><Input type="datetime-local" value={form.movementAt} onChange={(e) => setForm((c) => ({ ...c, movementAt: e.target.value }))} /></Field>
          <Field label="Seña"><Select value={form.advancePayment} onChange={(e) => setForm((c) => ({ ...c, advancePayment: e.target.value }))} options={[{ value: 'NO', label: 'No' }, { value: 'SI', label: 'Sí' }]} /></Field>
          <Field label="Cancela saldo"><Select value={form.cancelacionTipo} onChange={(e) => setForm((c) => ({ ...c, cancelacionTipo: e.target.value }))} options={CANCELACION_TYPES} /></Field>
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

        <div className="mt-5 flex gap-3">
          <Button className="flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !caseDetail.principalCustomerPersonId}><Save className="mr-1.5 h-4 w-4" />Registrar pago</Button>
        </div>
      </div>

      {/* Historial */}
      <div className="rounded-3xl border border-border/70 bg-card p-5">
        <h5 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Historial de movimientos</h5>
        {(movementsQuery.data ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 py-6 text-center text-sm text-muted-foreground">Sin movimientos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/60 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-3 py-3 text-left">Fecha</th>
                  <th className="px-3 py-3 text-left">Tipo</th>
                  <th className="px-3 py-3 text-right">Monto</th>
                  <th className="px-3 py-3 text-left">Medio</th>
                  <th className="px-3 py-3 text-left">Cancela</th>
                  <th className="px-3 py-3 text-left">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {(movementsQuery.data ?? []).map((m) => (
                  <tr key={m.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3 font-medium">{m.movementAt?.slice(0, 16).replace('T', ' ')}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${m.movementTypeCode === 'INGRESO' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400'}`}>{m.movementTypeCode}</span>
                    </td>
                    <td className="px-3 py-3 text-right font-medium">{formatCurrency(m.netAmount)}</td>
                    <td className="px-3 py-3 text-muted-foreground">{m.paymentMethodCode || '—'}</td>
                    <td className="px-3 py-3">{m.cancellationTypeCode ? <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-xs font-medium">{m.cancellationTypeCode}</span> : '—'}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground max-w-[150px] truncate">{m.reason || '—'}</td>
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
                      <a href={getReceiptPdfUrl(r.id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary transition hover:bg-primary/10" title="Descargar PDF">
                        <FileDown className="h-4 w-4" />PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex justify-end">
        <Button variant="outline" size="sm" onClick={async () => {
          const url = getClientPaymentPdfUrl(caseId, caseDetail?.principalCustomerName || 'Cliente', caseDetail?.principalVehiclePlate || '', comprobanteTipo, cotizadoConIva, form.reason, form.razonSocial, form.facturaNumero);
          const stored = readStoredAuth();
          const token = stored?.accessToken;
          if (!token) { toast.error('No hay sesión activa.'); return; }
          const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) { toast.error('No se pudo generar el PDF.'); return; }
          const blob = await res.blob();
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `comprobante-pago-${caseId}.pdf`;
          a.click();
        }}><FileDown className="mr-1.5 h-4 w-4" />Generar PDF</Button>
      </div>
    </div>
  );
};

const MiniCard = ({ label, value, highlight, variant }) => (
  <div className={`rounded-2xl border px-4 py-3 ${variant === 'success' ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30' : variant === 'warning' ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30' : 'border-border/60 bg-background/70'}`}>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`mt-1 text-lg font-semibold ${highlight ? 'text-primary' : ''}`}>{value}</p>
  </div>
);

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);

const Select = ({ options, ...props }) => (
  <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" {...props}>
    {options.map((option) => (
      <option key={option.value} value={option.value}>{option.label}</option>
    ))}
  </select>
);
