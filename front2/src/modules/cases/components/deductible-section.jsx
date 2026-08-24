import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, FolderOpen, ReceiptText, Save } from 'lucide-react';
import { toast } from 'sonner';
import { requestJson } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

const Field = ({ label, children, className = '' }) => (
  <div className={`min-w-0 ${className}`}>
    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
    {children}
  </div>
);

const toAmount = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

export const DeductibleSection = ({ caseId, caseDetail }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const franchiseQuery = useQuery({ queryKey: ['cases', String(caseId), 'franchise'], queryFn: () => requestJson(`/cases/${caseId}/franchise`) });
  const catalogsQuery = useQuery({ queryKey: ['insurance', 'catalogs'], queryFn: () => requestJson('/insurance/catalogs') });

  const franchise = franchiseQuery.data;
  const franchiseStatuses = catalogsQuery.data?.franchiseStatusCodes ?? [];
  const recoveryTypes = catalogsQuery.data?.franchiseRecoveryTypeCodes ?? [];
  const opinionCodes = catalogsQuery.data?.franchiseOpinionCodes ?? [];

  const mutation = useMutation({
    mutationFn: (payload) => requestJson(`/cases/${caseId}/franchise`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'franchise'] }); queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'insurance-processing'] }); toast.success('Franquicia guardada.'); },
    onError: (e) => toast.error(e.message),
  });

  const [recupero, setRecupero] = useState(franchise?.recoveryTypeCode ?? '');
  const [exceedsFranchise, setExceedsFranchise] = useState(franchise?.exceedsFranchise ? 'SI' : 'NO');
  useEffect(() => { setRecupero(franchise?.recoveryTypeCode ?? ''); }, [franchise?.recoveryTypeCode]);
  useEffect(() => { setExceedsFranchise(franchise?.exceedsFranchise ? 'SI' : 'NO'); }, [franchise?.exceedsFranchise]);
  const showRelatedCase = recupero === 'CIA_TERCERO';
  const showDictamen = recupero === 'PROPIA_CIA';

  const handleSave = () => {
    const form = document.getElementById('franchise-form');
    const fd = new FormData(form);
    mutation.mutate({
      franchiseStatusCode: fd.get('franchiseStatusCode') || null,
      franchiseAmount: toAmount(fd.get('franchiseAmount')) || null,
      recoveryTypeCode: fd.get('recoveryTypeCode') || null,
      franchiseOpinionCode: showDictamen ? (fd.get('franchiseOpinionCode') || null) : null,
      exceedsFranchise: fd.get('exceedsFranchise') === 'SI',
      recoveryAmount: fd.get('exceedsFranchise') === 'NO' ? toAmount(fd.get('recoveryAmount')) || null : null,
      notes: fd.get('notes') || null,
    });
  };

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ReceiptText className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-semibold">Franquicia</h4>
        </div>
        <Button size="sm" onClick={handleSave} disabled={mutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button>
      </div>

      {/* La franquicia es opcional y no condiciona el presupuesto. */}
      {!recupero ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          La franquicia es opcional. Podés definir el recupero más adelante.
        </div>
      ) : null}

      <form id="franchise-form" key={franchise?.id ?? 'new'} className="mt-4 space-y-3">
        <div className="grid gap-x-6 gap-y-3 md:grid-cols-4">
          <Field label="Estado">
            <select name="franchiseStatusCode" defaultValue={franchise?.franchiseStatusCode ?? ''} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">
              <option value="">—</option>
              {franchiseStatuses.filter(s => s.active !== false).map((s) => (<option key={s.code} value={s.code}>{s.name || s.code}</option>))}
            </select>
          </Field>
          <Field label="Monto">
            <Input name="franchiseAmount" type="number" min="0" step="0.01" defaultValue={franchise?.franchiseAmount ?? ''} placeholder="500000" />
          </Field>
          <Field label="Recupero">
            <select name="recoveryTypeCode" defaultValue={franchise?.recoveryTypeCode ?? ''} onChange={(e) => setRecupero(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">
              <option value="">Seleccionar...</option>
              {recoveryTypes.filter(r => r.active !== false).map((r) => (<option key={r.code} value={r.code}>{r.name || r.code}</option>))}
            </select>
          </Field>

          {/* CIA_TERCERO → carpeta de recupero creada automáticamente */}
          {showRelatedCase ? (
            <Field label="Carpeta de recupero">
              {franchise?.relatedCaseId ? (
                <Button type="button" variant="outline" size="sm" className="h-10 w-full justify-start" onClick={() => navigate(`/cases/${franchise.relatedCaseId}`)}>
                  <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                  Abrir carpeta de recupero
                </Button>
              ) : (
                <p className="text-xs leading-5 text-muted-foreground">Se creará automáticamente al guardar la franquicia.</p>
              )}
            </Field>
          ) : null}

          {/* PROPIA_CIA → Dictamen */}
          {showDictamen ? (
            <Field label="Dictamen">
              <select name="franchiseOpinionCode" defaultValue={franchise?.franchiseOpinionCode ?? ''} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">
                <option value="">—</option>
                {opinionCodes.map((o) => (<option key={o.code} value={o.code}>{o.name || o.code}</option>))}
              </select>
            </Field>
          ) : null}

          <Field label="Cotización supera Franquicia">
            <select name="exceedsFranchise" value={exceedsFranchise} onChange={(e) => setExceedsFranchise(e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">
              <option value="SI">SI</option>
              <option value="NO">NO</option>
            </select>
          </Field>

          {/* Solo si NO supera → Monto a recuperar */}
          <Field label="Monto a recuperar">
            <Input name="recoveryAmount" type="number" min="0" step="0.01" defaultValue={franchise?.recoveryAmount ?? ''} placeholder="500000"
              disabled={exceedsFranchise !== 'NO'} />
          </Field>
        </div>
        <Field label="Anotaciones">
          <Textarea name="notes" defaultValue={franchise?.notes ?? ''} placeholder="Observaciones sobre la franquicia..." className="min-h-[60px] resize-y" />
        </Field>
      </form>
    </div>
  );
};
