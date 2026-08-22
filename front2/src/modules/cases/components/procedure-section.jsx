import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ClipboardList, Save } from 'lucide-react';
import { toast } from 'sonner';
import { requestJson } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { ProviderSelector } from '@/modules/cases/components/provider-selector';

const Field = ({ label, children, className = '' }) => (
  <div className={`min-w-0 ${className}`}>
    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
    {children}
  </div>
);

const formatCurrency = (v) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v || 0);
const toAmount = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

export const ProcedureSection = ({ caseId, budget }) => {
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState({ providerId: null, snapshot: '' });

  const processingQuery = useQuery({ queryKey: ['cases', String(caseId), 'insurance-processing'], queryFn: () => requestJson(`/cases/${caseId}/insurance-processing`) });
  const franchiseQuery = useQuery({ queryKey: ['cases', String(caseId), 'franchise'], queryFn: () => requestJson(`/cases/${caseId}/franchise`) });
  const catalogsQuery = useQuery({ queryKey: ['insurance', 'catalogs'], queryFn: () => requestJson('/insurance/catalogs') });

  const processing = processingQuery.data;
  const franchise = franchiseQuery.data;
  const modalityCodes = catalogsQuery.data?.modalityCodes ?? [];
  const quotationStatuses = catalogsQuery.data?.quotationStatusCodes ?? [];
  const opinionCodes = catalogsQuery.data?.opinionCodes ?? [];

  useEffect(() => {
    setProvider({ providerId: processing?.providerId ?? null, snapshot: processing?.partsSupplierText ?? '' });
  }, [processing?.providerId, processing?.partsSupplierText]);

  // Cascading enablement
  const hasPresentedAt = !!processing?.presentedAt;
  const hasInspection = !!(processing?.presentedAt && processing?.inspectionForwardedAt);
  const hasQuotation = !!(processing?.quotationStatusCode && processing?.quotationDate && processing?.agreedAmount);

  // Auto desde presupuesto
  const minCloseAmount = budget?.minimumCloseAmount ?? processing?.minimumCloseAmount ?? '';
  const hasReplacementParts = budget?.items?.some(item => item.requiresReplacement || item.partDecisionCode === 'REEMPLAZAR') ?? processing?.includesParts;

  // Warning: monto acordado < minimo cierre
  const agreedAmount = toAmount(processing?.agreedAmount);
  const minimumClose = toAmount(minCloseAmount);
  const belowMinimum = agreedAmount > 0 && minimumClose > 0 && agreedAmount < minimumClose;

  // Auto-calc: A facturar Cia
  const computedAmountToBill = useMemo(() => {
    if (!agreedAmount) return null;
    const isPropiaCia = franchise?.recoveryTypeCode === 'PROPIA_CIA';
    if (isPropiaCia) return agreedAmount;
    const franchiseAmount = toAmount(franchise?.franchiseAmount);
    return Math.max(0, agreedAmount - franchiseAmount);
  }, [agreedAmount, franchise?.recoveryTypeCode, franchise?.franchiseAmount]);

  const mutation = useMutation({
    mutationFn: (payload) => requestJson(`/cases/${caseId}/insurance-processing`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cases'] }),
        queryClient.invalidateQueries({ queryKey: ['cases', String(caseId)] }),
        queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] }),
        queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'insurance-processing'] }),
        queryClient.invalidateQueries({ queryKey: ['panel'] }),
      ]);
      toast.success('Tramitacion guardada.');
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    const form = document.getElementById('procedure-form');
    const fd = new FormData(form);
    mutation.mutate({
      presentedAt: fd.get('presentedAt') || null,
      inspectionForwardedAt: fd.get('inspectionForwardedAt') || null,
      modalityCode: fd.get('modalityCode') || null,
      opinionCode: fd.get('opinionCode') || null,
      quotationStatusCode: fd.get('quotationStatusCode') || null,
      quotationDate: fd.get('quotationDate') || null,
      agreedAmount: toAmount(fd.get('agreedAmount')) || null,
      minimumCloseAmount: toAmount(minCloseAmount) || null,
      includesParts: hasReplacementParts,
      partsSupplierText: provider.snapshot || null,
      providerId: provider.providerId,
      amountToBillCompany: computedAmountToBill,
      finalAmountForWorkshop: toAmount(fd.get('finalAmountForWorkshop')) || null,
    });
  };

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardList className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-semibold">Tramitacion</h4>
        </div>
        <Button size="sm" onClick={handleSave} disabled={mutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button>
      </div>

      {/* Condicionante: sin fecha presentado */}
      {!hasPresentedAt ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Completa la fecha de presentacion para habilitar el resto de la tramitacion.
        </div>
      ) : null}

      {/* Warning: monto acordado < minimo cierre */}
      {belowMinimum ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Advertencia: el monto acordado ({formatCurrency(agreedAmount)}) es inferior al minimo para cierre ({formatCurrency(minimumClose)}).
        </div>
      ) : null}

      <form id="procedure-form" key={processing?.id ?? 'new'} className="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-4">
        <Field label="Fecha presentado">
          <Input type="date" name="presentedAt" defaultValue={processing?.presentedAt ?? ''} disabled={!franchise?.recoveryTypeCode} />
        </Field>
        <Field label="Derivado a inspeccion">
          <Input type="date" name="inspectionForwardedAt" defaultValue={processing?.inspectionForwardedAt ?? ''} disabled={!hasPresentedAt} />
        </Field>
        <Field label="Modalidad">
          <select name="modalityCode" defaultValue={processing?.modalityCode ?? ''} disabled={!hasPresentedAt}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50">
             <option value="">—</option>
            <option value="PRESENCIAL">Presencial</option>
            <option value="POR_FOTOS">Por fotos</option>
          </select>
        </Field>
        <Field label="Dictamen">
          <select name="opinionCode" defaultValue={processing?.opinionCode ?? ''} disabled={!hasPresentedAt}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50">
            <option value="">—</option>
            {opinionCodes.map((o) => (<option key={o.code} value={o.code}>{o.name || o.code}</option>))}
          </select>
        </Field>

        <Field label="Minimo para cierre">
          <Input name="minimumCloseAmount" type="number" min="0" step="0.01" value={minCloseAmount} readOnly className="bg-muted/50 cursor-not-allowed" />
        </Field>
        <Field label="Lleva repuestos">
          <select name="includesParts" value={hasReplacementParts ? 'SI' : 'NO'} readOnly disabled
            className="h-10 w-full rounded-xl border border-input bg-muted/50 px-3 text-sm outline-none cursor-not-allowed opacity-70">
            <option value="SI">SI</option>
            <option value="NO">NO</option>
          </select>
        </Field>

        <Field label="Cotizacion">
          <select name="quotationStatusCode" defaultValue={processing?.quotationStatusCode ?? ''} disabled={!hasPresentedAt}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50">
            <option value="">—</option>
            {quotationStatuses.map((q) => (<option key={q.code} value={q.code}>{q.name || q.code}</option>))}
          </select>
        </Field>
        <Field label="Fecha cotizacion">
          <Input type="date" name="quotationDate" defaultValue={processing?.quotationDate ?? ''} disabled={!hasPresentedAt} />
        </Field>
        <Field label="Monto acordado">
          <Input name="agreedAmount" type="number" min="0" step="0.01" defaultValue={processing?.agreedAmount ?? ''} placeholder="1400000" disabled={!hasPresentedAt} />
        </Field>

        <Field label="A facturar Cia.">
          <Input name="amountToBillCompany" type="number" min="0" step="0.01" value={computedAmountToBill ?? ''} readOnly
            className="bg-muted/50 cursor-not-allowed" />
        </Field>
        <Field label="Proveedor de repuestos"><ProviderSelector value={provider.snapshot} providerId={provider.providerId} onChange={setProvider} /></Field>
        <Field label="Autorizacion repuestos">
          <Input name="partsAuthorizationCode" value={processing?.partsAuthorizationCode ?? ''} readOnly placeholder="Auto segun repuestos" className="bg-muted/50 cursor-not-allowed" />
        </Field>
        <Field label="Final a favor Taller">
          <Input name="finalAmountForWorkshop" type="number" min="0" step="0.01" defaultValue={processing?.finalAmountForWorkshop ?? ''} readOnly className="bg-muted/50 cursor-not-allowed" />
        </Field>
      </form>
    </div>
  );
};
