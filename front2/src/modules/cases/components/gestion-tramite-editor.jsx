import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, ClipboardList, FileSearch, FileText, ReceiptText, Save, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { requestJson } from '@/shared/api/http-client';
import { DocumentacionEditor } from '@/modules/cases/components/documentacion-editor';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

const fetchJson = (url) => requestJson(url);

const toAmount = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const formatCurrency = (v) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v || 0);

const SUB_TABS = [
  ['seguro',    'Datos del Seguro',   Building2],
  ['siniestro', 'Datos del Siniestro', ShieldAlert],
  ['franquicia','Franquicia',          ReceiptText],
  ['documentacion','Documentación',    FileSearch],
  ['tramitacion','Tramitación',        ClipboardList],
];

export const GestionTramiteEditor = ({ caseId, caseDetail, budget, onSaved }) => {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState('seguro');
  const [docStatus, setDocStatus] = useState('INCOMPLETA');

  // ── Queries ──
  const insuranceQuery = useQuery({ queryKey: ['cases', String(caseId), 'insurance'], queryFn: () => fetchJson(`/cases/${caseId}/insurance`) });
  const processingQuery = useQuery({ queryKey: ['cases', String(caseId), 'insurance-processing'], queryFn: () => fetchJson(`/cases/${caseId}/insurance-processing`) });
  const franchiseQuery = useQuery({ queryKey: ['cases', String(caseId), 'franchise'], queryFn: () => fetchJson(`/cases/${caseId}/franchise`) });
  const catalogsQuery = useQuery({ queryKey: ['insurance', 'catalogs'], queryFn: () => fetchJson('/insurance/catalogs') });
  const companiesQuery = useQuery({ queryKey: ['insurance', 'companies'], queryFn: () => fetchJson('/insurance/companies') });

  const insurance = insuranceQuery.data;
  const processing = processingQuery.data;
  const franchise = franchiseQuery.data;
  const companies = companiesQuery.data ?? [];
  const franchiseStatuses = catalogsQuery.data?.franchiseStatusCodes ?? [];
  const recoveryTypes = catalogsQuery.data?.franchiseRecoveryTypeCodes ?? [];
  const opinionCodes = catalogsQuery.data?.insuranceOpinionCodes ?? [];
  const quotationStatuses = catalogsQuery.data?.insuranceQuotationStatusCodes ?? [];
  const partsAuthCodes = catalogsQuery.data?.insurancePartsAuthorizationCodes ?? [];

  // ── Derived from budget ──
  const budgetItems = budget?.items ?? [];
  const totalMO = useMemo(() => budgetItems.reduce((sum, i) => sum + toAmount(i.laborAmount), 0), [budgetItems]);
  const totalRepuestos = useMemo(() => budgetItems.reduce((sum, i) => sum + toAmount(i.partValue), 0), [budgetItems]);
  const llevaRepuestos = totalRepuestos > 0;

  // ── Form state ──
  const [seguro, setSeguro] = useState(() => ({ insuranceCompanyId: insurance?.insuranceCompanyId ?? '', policyNumber: insurance?.policyNumber ?? '', certificateNumber: insurance?.certificateNumber ?? '', coverageDetail: insurance?.coverageDetail ?? '' }));
  const [proc, setProc] = useState(() => ({
    presentedAt: processing?.presentedAt ?? '', inspectionForwardedAt: processing?.inspectionForwardedAt ?? '',
    modalityCode: processing?.modalityCode ?? '', opinionCode: processing?.opinionCode ?? '',
    quotationStatusCode: processing?.quotationStatusCode ?? '', quotationDate: processing?.quotationDate ?? '',
      agreedAmount: processing?.agreedAmount ?? '', minimumCloseAmount: (processing?.minimumCloseAmount ?? totalMO) || '',
    includesParts: processing?.includesParts ? 'SI' : 'NO', partsAuthorizationCode: processing?.partsAuthorizationCode ?? '',
    partsSupplierText: processing?.partsSupplierText ?? '', amountToBillCompany: processing?.amountToBillCompany ?? '',
    finalAmountForWorkshop: processing?.finalAmountForWorkshop ?? '',
  }));
  const [franq, setFranq] = useState(() => ({
    franchiseStatusCode: franchise?.franchiseStatusCode ?? '', franchiseAmount: franchise?.franchiseAmount ?? '',
    recoveryTypeCode: franchise?.recoveryTypeCode ?? '', franchiseOpinionCode: franchise?.franchiseOpinionCode ?? '',
    exceedsFranchise: franchise?.exceedsFranchise ? 'SI' : 'NO', recoveryAmount: franchise?.recoveryAmount ?? '', notes: franchise?.notes ?? '',
  }));

  // ── Auto-calc finalAmountForWorkshop ──
  const computedFinalTaller = useMemo(() => {
    const facturar = toAmount(proc.amountToBillCompany);
    const finalRepuestos = proc.partsSupplierText === 'TALLER' || proc.includesParts === 'SI' ? totalRepuestos : 0;
    return Math.max(0, facturar - finalRepuestos);
  }, [proc.amountToBillCompany, proc.partsSupplierText, proc.includesParts, totalRepuestos]);

  // ── Mutations ──
  const seguroMutation = useMutation({
    mutationFn: (payload) => requestJson(`/cases/${caseId}/insurance`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'insurance'] }); await onSaved?.(); toast.success('Datos del seguro guardados.'); },
    onError: (e) => toast.error(e.message),
  });

  const processingMutation = useMutation({
    mutationFn: (payload) => requestJson(`/cases/${caseId}/insurance-processing`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'insurance-processing'] }); await onSaved?.(); toast.success('Tramitación guardada.'); },
    onError: (e) => toast.error(e.message),
  });

  const franchiseMutation = useMutation({
    mutationFn: (payload) => requestJson(`/cases/${caseId}/franchise`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'franchise'] }); await onSaved?.(); toast.success('Franquicia guardada.'); },
    onError: (e) => toast.error(e.message),
  });

  const buildProcessingPayload = () => ({
    presentedAt: proc.presentedAt || null, inspectionForwardedAt: proc.inspectionForwardedAt || null,
    modalityCode: proc.modalityCode || null, opinionCode: proc.opinionCode || null,
    quotationStatusCode: proc.quotationStatusCode || null, quotationDate: proc.quotationDate || null,
    agreedAmount: toAmount(proc.agreedAmount) || null, minimumCloseAmount: toAmount(proc.minimumCloseAmount) || null,
    includesParts: llevaRepuestos, partsAuthorizationCode: proc.partsAuthorizationCode || null,
    partsSupplierText: proc.partsSupplierText || null,
    amountToBillCompany: toAmount(proc.amountToBillCompany) || null, finalAmountForWorkshop: computedFinalTaller || null,
  });

  return (
    <div className="mt-5 space-y-4">
      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2">
        {SUB_TABS.map(([key, label, Icon]) => {
          const active = subTab === key;
          return (
            <button key={key} type="button" onClick={() => setSubTab(key)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition border ${
                active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-transparent bg-background/70 text-foreground hover:border-border/60 hover:bg-accent/50'
              }`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          );
        })}
      </div>

      {/* ── Datos del Seguro ── */}
      {subTab === 'seguro' ? (
        <div className="rounded-3xl border border-border/70 bg-card p-5">
          <SectionHeader icon={Building2} title="Datos del Seguro" subtitle="Compañía, póliza, cobertura y contactos de la cía.">
            <Button onClick={() => seguroMutation.mutate({ insuranceCompanyId: Number(seguro.insuranceCompanyId) || null, policyNumber: seguro.policyNumber || null, certificateNumber: seguro.certificateNumber || null, coverageDetail: seguro.coverageDetail || null })} disabled={seguroMutation.isPending}><Save className="mr-1.5 h-4 w-4" />Guardar</Button>
          </SectionHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Compañía de seguro">
              <select className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={seguro.insuranceCompanyId} onChange={(e) => setSeguro((s) => ({ ...s, insuranceCompanyId: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {companies.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </Field>
            <Field label="N° de póliza"><Input value={seguro.policyNumber} onChange={(e) => setSeguro((s) => ({ ...s, policyNumber: e.target.value }))} placeholder="Número de póliza" /></Field>
            <Field label="N° de certificado"><Input value={seguro.certificateNumber} onChange={(e) => setSeguro((s) => ({ ...s, certificateNumber: e.target.value }))} placeholder="Número de certificado" /></Field>
            <Field label="Detalle de cobertura"><Input value={seguro.coverageDetail} onChange={(e) => setSeguro((s) => ({ ...s, coverageDetail: e.target.value }))} placeholder="Ej: Todo Riesgo con franquicia" /></Field>
          </div>
        </div>
      ) : null}

      {/* ── Datos del Siniestro ── */}
      {subTab === 'siniestro' ? (
        <div className="rounded-3xl border border-border/70 bg-card p-5">
          <SectionHeader icon={ShieldAlert} title="Datos del Siniestro" subtitle="Fecha de presentación, inspección, modalidad y dictamen.">
            <Button onClick={() => processingMutation.mutate(buildProcessingPayload())} disabled={processingMutation.isPending}><Save className="mr-1.5 h-4 w-4" />Guardar</Button>
          </SectionHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Fecha presentación"><Input type="date" value={proc.presentedAt} onChange={(e) => setProc((p) => ({ ...p, presentedAt: e.target.value }))} /></Field>
            <Field label="Derivado a inspección"><Input type="date" value={proc.inspectionForwardedAt} onChange={(e) => setProc((p) => ({ ...p, inspectionForwardedAt: e.target.value }))} /></Field>
            <Field label="Modalidad">
              <select className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={proc.modalityCode} onChange={(e) => setProc((p) => ({ ...p, modalityCode: e.target.value }))}>
                <option value="">—</option>
                {(catalogsQuery.data?.insuranceModalityCodes ?? []).map((c) => (<option key={c.code} value={c.code}>{c.name}</option>))}
              </select>
            </Field>
            <Field label="Dictamen">
              <select className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={proc.opinionCode} onChange={(e) => setProc((p) => ({ ...p, opinionCode: e.target.value }))}>
                <option value="">—</option>
                {opinionCodes.map((c) => (<option key={c.code} value={c.code}>{c.name}</option>))}
              </select>
            </Field>
          </div>
        </div>
      ) : null}

      {/* ── Franquicia ── */}
      {subTab === 'franquicia' ? (
        <div className="rounded-3xl border border-border/70 bg-card p-5">
          <SectionHeader icon={ReceiptText} title="Franquicia" subtitle="Estado, monto, recupero y dictamen.">
            <Button onClick={() => franchiseMutation.mutate({ franchiseStatusCode: franq.franchiseStatusCode || null, franchiseAmount: franq.franchiseAmount ? Number(franq.franchiseAmount) : null, recoveryTypeCode: franq.recoveryTypeCode || null, franchiseOpinionCode: franq.franchiseOpinionCode || null, exceedsFranchise: franq.exceedsFranchise === 'SI', recoveryAmount: franq.recoveryAmount ? Number(franq.recoveryAmount) : null, notes: franq.notes || null })} disabled={franchiseMutation.isPending}><Save className="mr-1.5 h-4 w-4" />Guardar</Button>
          </SectionHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Estado"><CatSelect value={franq.franchiseStatusCode} onChange={(v) => setFranq((f) => ({ ...f, franchiseStatusCode: v }))} options={franchiseStatuses} /></Field>
            <Field label="Monto"><Input type="number" min="0" step="0.01" value={franq.franchiseAmount} onChange={(e) => setFranq((f) => ({ ...f, franchiseAmount: e.target.value }))} /></Field>
            <Field label="Modo de recupero"><CatSelect value={franq.recoveryTypeCode} onChange={(v) => setFranq((f) => ({ ...f, recoveryTypeCode: v }))} options={recoveryTypes} /></Field>
            <Field label="Dictamen"><CatSelect value={franq.franchiseOpinionCode} onChange={(v) => setFranq((f) => ({ ...f, franchiseOpinionCode: v }))} options={catalogsQuery.data?.franchiseOpinionCodes ?? []} /></Field>
            <Field label="Supera franquicia"><SinoSelect value={franq.exceedsFranchise} onChange={(v) => setFranq((f) => ({ ...f, exceedsFranchise: v }))} /></Field>
            <Field label="Monto a recuperar"><Input type="number" min="0" step="0.01" value={franq.recoveryAmount} onChange={(e) => setFranq((f) => ({ ...f, recoveryAmount: e.target.value }))} /></Field>
          </div>
        </div>
      ) : null}

      {/* ── Documentación ── */}
      {subTab === 'documentacion' ? (
        <DocumentacionEditor caseId={caseId} docStatus={docStatus} onDocStatusChange={setDocStatus} onSaved={onSaved} />
      ) : null}

      {/* ── Tramitación ── */}
      {subTab === 'tramitacion' ? (
        <div className="rounded-3xl border border-border/70 bg-card p-5">
          <SectionHeader icon={ClipboardList} title="Tramitación" subtitle="Cotización acordada, repuestos y montos a facturar.">
            <Button onClick={() => processingMutation.mutate(buildProcessingPayload())} disabled={processingMutation.isPending}><Save className="mr-1.5 h-4 w-4" />Guardar</Button>
          </SectionHeader>

          {/* Cotización */}
          <div className="mb-5 rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cotización</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Estado cotización"><CatSelect value={proc.quotationStatusCode} onChange={(v) => setProc((p) => ({ ...p, quotationStatusCode: v }))} options={quotationStatuses} /></Field>
              <Field label="Fecha cotización"><Input type="date" value={proc.quotationDate} onChange={(e) => setProc((p) => ({ ...p, quotationDate: e.target.value }))} /></Field>
              <Field label="Monto acordado"><Input type="number" min="0" step="0.01" value={proc.agreedAmount} onChange={(e) => setProc((p) => ({ ...p, agreedAmount: e.target.value }))} /></Field>
              <Field label="Monto mínimo cierre">
                <Input type="number" min="0" step="0.01" value={proc.minimumCloseAmount} onChange={(e) => setProc((p) => ({ ...p, minimumCloseAmount: e.target.value }))} />
                <p className="mt-1 text-[11px] text-muted-foreground">MO presupuesto: {formatCurrency(totalMO)}</p>
              </Field>
            </div>
            {toAmount(proc.agreedAmount) > 0 && toAmount(proc.agreedAmount) < toAmount(proc.minimumCloseAmount) ? (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">⚠️ El monto acordado es inferior al mínimo para cierre ({formatCurrency(proc.minimumCloseAmount)}). Se notificará al administrador.</p>
            ) : null}
          </div>

          {/* Repuestos */}
          <div className="mb-5 rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Repuestos</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Lleva repuestos">
                <div className="flex h-10 items-center rounded-xl border border-input bg-muted/50 px-3 text-sm">{llevaRepuestos ? `Sí — ${formatCurrency(totalRepuestos)}` : 'No'}</div>
              </Field>
              <Field label="Autorización">
                <CatSelect value={proc.partsAuthorizationCode} onChange={(v) => setProc((p) => ({ ...p, partsAuthorizationCode: v }))} options={partsAuthCodes} />
              </Field>
              <Field label="Provee repuestos">
                <select className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={proc.partsSupplierText || ''} onChange={(e) => setProc((p) => ({ ...p, partsSupplierText: e.target.value }))}>
                  <option value="">—</option>
                  <option value="CIA">Provee Cía.</option>
                  <option value="TALLER">Provee Taller</option>
                  <option value="CLIENTE">Provee Cliente</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Montos */}
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Montos</p>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="A facturar Cía.">
                <Input type="number" min="0" step="0.01" value={proc.amountToBillCompany} onChange={(e) => setProc((p) => ({ ...p, amountToBillCompany: e.target.value }))} />
              </Field>
              <Field label="Total final repuestos">
                <div className="flex h-10 items-center rounded-xl border border-input bg-muted/50 px-3 text-sm">{proc.partsSupplierText === 'TALLER' ? formatCurrency(totalRepuestos) : '—'}</div>
              </Field>
              <Field label="Final a favor Taller">
                <div className="flex h-10 items-center rounded-xl border border-input bg-muted/50 px-3 text-sm font-semibold">{formatCurrency(computedFinalTaller)}</div>
                <p className="mt-1 text-[11px] text-muted-foreground">A facturar − Total repuestos (si provee Taller)</p>
              </Field>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title, subtitle, children }) => (
  <div className="mb-4 flex items-start justify-between gap-3">
    <div>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
      <h4 className="text-lg font-semibold">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);

const CatSelect = ({ value, onChange, options }) => (
  <select className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={value} onChange={(e) => onChange(e.target.value)}>
    <option value="">—</option>
    {options.map((c) => (<option key={c.code} value={c.code}>{c.name}</option>))}
  </select>
);

const SinoSelect = ({ value, onChange }) => (
  <select className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={value} onChange={(e) => onChange(e.target.value)}>
    <option value="NO">No</option>
    <option value="SI">Sí</option>
  </select>
);
