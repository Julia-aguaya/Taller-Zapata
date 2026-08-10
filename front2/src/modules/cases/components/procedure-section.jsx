import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Save } from 'lucide-react';
import { toast } from 'sonner';
import { requestJson } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

const Field = ({ label, children, className = '' }) => (
  <div className={`min-w-0 ${className}`}>
    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
    {children}
  </div>
);

const formatCurrency = (v) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v || 0);
const toAmount = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

export const ProcedureSection = ({ caseId }) => {
  const queryClient = useQueryClient();

  const processingQuery = useQuery({ queryKey: ['cases', String(caseId), 'insurance-processing'], queryFn: () => requestJson(`/cases/${caseId}/insurance-processing`) });
  const catalogsQuery = useQuery({ queryKey: ['insurance', 'catalogs'], queryFn: () => requestJson('/insurance/catalogs') });

  const processing = processingQuery.data;
  const modalityCodes = catalogsQuery.data?.insuranceModalityCodes ?? [];
  const quotationStatuses = catalogsQuery.data?.insuranceQuotationStatusCodes ?? [];
  const partsAuthCodes = catalogsQuery.data?.insurancePartsAuthorizationCodes ?? [];
  const opinionCodes = catalogsQuery.data?.insuranceOpinionCodes ?? [];

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
      toast.success('Tramitación guardada.');
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
      minimumCloseAmount: toAmount(fd.get('minimumCloseAmount')) || null,
      includesParts: fd.get('includesParts') === 'SI',
      partsAuthorizationCode: fd.get('partsAuthorizationCode') || null,
      partsSupplierText: fd.get('partsSupplierText') || null,
      amountToBillCompany: toAmount(fd.get('amountToBillCompany')) || null,
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
          <h4 className="text-sm font-semibold">Tramitación</h4>
        </div>
        <Button size="sm" onClick={handleSave} disabled={mutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button>
      </div>

      <form id="procedure-form" className="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-4">
        <Field label="Fecha presentado">
          <Input type="date" name="presentedAt" defaultValue={processing?.presentedAt ?? ''} />
        </Field>
        <Field label="Derivado a inspección">
          <Input type="date" name="inspectionForwardedAt" defaultValue={processing?.inspectionForwardedAt ?? ''} />
        </Field>
        <Field label="Modalidad">
          <select name="modalityCode" defaultValue={processing?.modalityCode ?? ''} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">
            <option value="">—</option>
            {modalityCodes.map((m) => (<option key={m.code} value={m.code}>{m.name || m.code}</option>))}
          </select>
        </Field>
        <Field label="Dictamen">
          <select name="opinionCode" defaultValue={processing?.opinionCode ?? ''} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">
            <option value="">—</option>
            {opinionCodes.map((o) => (<option key={o.code} value={o.code}>{o.name || o.code}</option>))}
          </select>
        </Field>
        <Field label="Mínimo para cierre">
          <Input name="minimumCloseAmount" type="number" min="0" step="0.01" defaultValue={processing?.minimumCloseAmount ?? ''} placeholder="1250000" />
        </Field>
        <Field label="Lleva repuestos">
          <select name="includesParts" defaultValue={processing?.includesParts ? 'SI' : 'NO'} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">
            <option value="SI">SI</option>
            <option value="NO">NO</option>
          </select>
        </Field>
        <Field label="Cotización">
          <select name="quotationStatusCode" defaultValue={processing?.quotationStatusCode ?? ''} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">
            <option value="">—</option>
            {quotationStatuses.map((q) => (<option key={q.code} value={q.code}>{q.name || q.code}</option>))}
          </select>
        </Field>
        <Field label="Fecha cotización">
          <Input type="date" name="quotationDate" defaultValue={processing?.quotationDate ?? ''} />
        </Field>
        <Field label="Monto acordado">
          <Input name="agreedAmount" type="number" min="0" step="0.01" defaultValue={processing?.agreedAmount ?? ''} placeholder="1400000" />
        </Field>
        <Field label="A facturar Cía.">
          <Input name="amountToBillCompany" type="number" min="0" step="0.01" defaultValue={processing?.amountToBillCompany ?? ''} placeholder="900000" />
        </Field>
        <Field label="Provee repuestos">
          <select name="partsSupplierText" defaultValue={processing?.partsSupplierText ?? ''} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">
            <option value="">—</option>
            <option value="CIA">Provee Cía.</option>
            <option value="TALLER">Provee Taller</option>
            <option value="CLIENTE">Provee Cliente</option>
          </select>
        </Field>
        <Field label="Autorización repuestos">
          <select name="partsAuthorizationCode" defaultValue={processing?.partsAuthorizationCode ?? ''} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">
            <option value="">—</option>
            {partsAuthCodes.map((a) => (<option key={a.code} value={a.code}>{a.name || a.code}</option>))}
          </select>
        </Field>
        <Field label="Final a favor Taller">
          <Input name="finalAmountForWorkshop" type="number" min="0" step="0.01" defaultValue={processing?.finalAmountForWorkshop ?? ''} readOnly className="bg-muted/50" />
        </Field>
      </form>
    </div>
  );
};
