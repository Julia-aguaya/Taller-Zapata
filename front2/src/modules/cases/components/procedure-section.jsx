import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ClipboardList, Save } from 'lucide-react';
import { toast } from 'sonner';
import { requestJson } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { ProviderSelector } from '@/modules/cases/components/provider-selector';

const BELOW_MINIMUM_CODE = 'PROCESSING_AMOUNT_BELOW_MINIMUM_CONFIRMATION_REQUIRED';
const editableFields = ['presentedAt', 'inspectionForwardedAt', 'inspectionDate', 'modalityCode', 'quotationStatusCode', 'quotationDate', 'agreedAmount', 'partsAuthorizationCode', 'partsSupplierText', 'providerId'];
const partsAuthorizationOptions = [
  { value: 'TOTAL', label: 'Aprobados' },
  { value: 'PARCIAL', label: 'Aprobados parcial' },
  { value: 'RECHAZADO', label: 'Rechazados' },
];

const Field = ({ label, children, className = '' }) => (
  <div className={`min-w-0 ${className}`}>
    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
    {children}
  </div>
);

const formatCurrency = (value) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(value) || 0);
const toNumberOrNull = (value) => value === '' || value == null ? null : Number(value);
const processingForm = (processing) => Object.fromEntries(editableFields.map((field) => [field, processing?.[field] ?? '']));

export const isBelowMinimumConfirmationRequired = (error) => error?.payload?.code === BELOW_MINIMUM_CODE;

export const buildProcessingPatch = (form, processing) => {
  const patch = {};
  for (const field of editableFields) {
    const value = ['agreedAmount', 'finalAmountForWorkshop'].includes(field) ? toNumberOrNull(form[field]) : (form[field] === '' ? null : form[field]);
    const previous = processing?.[field] ?? null;
    if (value !== previous) patch[field] = value;
  }
  return patch;
};

export const ProcedureSection = ({ caseId }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => processingForm(null));
  const [belowMinimum, setBelowMinimum] = useState(null);
  const processingQuery = useQuery({ queryKey: ['cases', String(caseId), 'insurance-processing'], queryFn: () => requestJson(`/cases/${caseId}/insurance-processing`) });
  const catalogsQuery = useQuery({ queryKey: ['insurance', 'catalogs'], queryFn: () => requestJson('/insurance/catalogs') });
  const processing = processingQuery.data;
  const modalityCodes = catalogsQuery.data?.modalityCodes ?? [];
  const quotationStatuses = catalogsQuery.data?.quotationStatusCodes ?? [];

  useEffect(() => setForm(processingForm(processing)), [processing]);

  const invalidateProcessing = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['cases'] }),
      queryClient.invalidateQueries({ queryKey: ['cases', String(caseId)] }),
      queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] }),
      queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'insurance-processing'] }),
      queryClient.invalidateQueries({ queryKey: ['panel'] }),
    ]);
  };

  const mutation = useMutation({
    mutationFn: (payload) => requestJson(`/cases/${caseId}/insurance-processing`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: async () => {
      setBelowMinimum(null);
      await invalidateProcessing();
      toast.success('Tramitacion guardada.');
    },
    onError: async (error) => {
      if (isBelowMinimumConfirmationRequired(error)) {
        setBelowMinimum(error.payload.data);
        return;
      }
      if (error?.payload?.code === 'PROCESSING_VERSION_CONFLICT') await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'insurance-processing'] });
      toast.error(error.message || 'No pude guardar la tramitacion.');
    },
  });

  const save = (allowBelowMinimum = false) => {
    const patch = buildProcessingPatch(form, processing);
    if (!Object.keys(patch).length) return;
    mutation.mutate({ expectedVersion: processing?.version ?? 0, ...patch, ...(allowBelowMinimum ? { allowBelowMinimum: true } : {}) });
  };

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const hasPresentedAt = Boolean(form.presentedAt);
  const hasInspectionForwarded = hasPresentedAt && Boolean(form.inspectionForwardedAt);
  const derived = processing ?? {};

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ClipboardList className="h-5 w-5" /></div><h4 className="text-sm font-semibold">Tramitacion</h4></div>
        <Button size="sm" onClick={() => save()} disabled={mutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button>
      </div>
      {!hasPresentedAt ? <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />Registra la fecha de presentacion ante la compania para habilitar el resto de la tramitacion.</div> : null}
      <div className="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-4">
        <Field label="Fecha de presentación"><Input aria-label="Fecha presentado" type="date" value={form.presentedAt} onChange={(event) => setField('presentedAt', event.target.value)} /></Field>
        <Field label="Derivado a inspeccion"><Input aria-label="Derivado a inspeccion" type="date" value={form.inspectionForwardedAt} disabled={!hasPresentedAt} onChange={(event) => setField('inspectionForwardedAt', event.target.value)} /></Field>
        <Field label="Fecha inspeccion"><Input aria-label="Fecha inspeccion" type="date" value={form.inspectionDate} disabled={!hasInspectionForwarded} onChange={(event) => setField('inspectionDate', event.target.value)} /></Field>
        <Field label="Modalidad"><select aria-label="Modalidad" value={form.modalityCode} disabled={!hasInspectionForwarded} onChange={(event) => setField('modalityCode', event.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm disabled:opacity-50"><option value="">-</option>{modalityCodes.map((item) => <option key={item.code} value={item.code}>{item.name || item.code}</option>)}</select></Field>
        <Field label="Minimo para cierre"><Input aria-label="Minimo para cierre" value={derived.minimumCloseAmount ?? ''} readOnly className="bg-muted/50 cursor-not-allowed" /></Field>
        <Field label="Lleva repuestos"><Input aria-label="Lleva repuestos" value={derived.includesParts ? 'SI' : 'NO'} readOnly className="bg-muted/50 cursor-not-allowed" /></Field>
        <Field label="Cotizacion"><select aria-label="Cotizacion" value={form.quotationStatusCode} disabled={!hasPresentedAt} onChange={(event) => setField('quotationStatusCode', event.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm disabled:opacity-50"><option value="">-</option>{quotationStatuses.map((item) => <option key={item.code} value={item.code}>{item.name || item.code}</option>)}</select></Field>
        <Field label="Fecha cotizacion"><Input aria-label="Fecha cotizacion" type="date" value={form.quotationDate} disabled={!hasPresentedAt} onChange={(event) => setField('quotationDate', event.target.value)} /></Field>
        <Field label="Monto acordado"><Input aria-label="Monto acordado" type="number" min="0" step="0.01" value={form.agreedAmount} disabled={!hasPresentedAt} onChange={(event) => setField('agreedAmount', event.target.value)} /></Field>
        <Field label="A facturar Cia."><Input aria-label="A facturar Cia." value={derived.amountToBillCompany ?? ''} readOnly className="bg-muted/50 cursor-not-allowed" /></Field>
        <Field label="Proveedor de repuestos"><ProviderSelector value={form.partsSupplierText} providerId={form.providerId || null} disabled={!hasPresentedAt} onChange={({ providerId, snapshot }) => setForm((current) => ({ ...current, providerId: providerId ?? '', partsSupplierText: snapshot ?? '' }))} /></Field>
        {derived.includesParts ? <Field label="Autorización de aseguradora - repuestos"><select aria-label="Autorización de aseguradora - repuestos" value={form.partsAuthorizationCode} disabled={!hasPresentedAt} onChange={(event) => setField('partsAuthorizationCode', event.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm disabled:opacity-50"><option value="">Pendiente de respuesta</option>{partsAuthorizationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field> : null}
      </div>
      <Dialog open={Boolean(belowMinimum)} onClose={() => setBelowMinimum(null)} title="Monto acordado bajo el minimo" description="Confirmá explícitamente si querés guardar esta excepción.">
        <dl className="grid gap-2 text-sm"><div className="flex justify-between gap-4"><dt>Monto acordado</dt><dd>{formatCurrency(belowMinimum?.agreedAmount)}</dd></div><div className="flex justify-between gap-4"><dt>Minimo de cierre</dt><dd>{formatCurrency(belowMinimum?.minimumCloseAmount)}</dd></div><div className="flex justify-between gap-4 font-semibold"><dt>Diferencia</dt><dd>{formatCurrency(belowMinimum?.difference)}</dd></div></dl>
        <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" data-dialog-initial-focus onClick={() => setBelowMinimum(null)}>Cancelar</Button><Button type="button" onClick={() => save(true)} disabled={mutation.isPending}>Confirmar y guardar</Button></div>
      </Dialog>
    </div>
  );
};
