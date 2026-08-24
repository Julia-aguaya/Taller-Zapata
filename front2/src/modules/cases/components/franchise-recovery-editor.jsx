import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, FolderOpen, ReceiptText, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { requestJson } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

const selectClass = 'h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

const Field = ({ label, children }) => (
  <div className="min-w-0">
    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
    {children}
  </div>
);

const toAmount = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

export const FranchiseRecoveryEditor = ({ caseId, caseDetail, onSaved }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const recoveryQuery = useQuery({ queryKey: ['cases', String(caseId), 'franchise-recovery'], queryFn: () => requestJson(`/cases/${caseId}/franchise-recovery`) });
  const catalogsQuery = useQuery({ queryKey: ['recovery', 'catalogs'], queryFn: () => requestJson('/recovery/catalogs') });

  const recovery = recoveryQuery.data;
  const managerCodes = catalogsQuery.data?.managerCodes ?? [];
  const opinionCodes = catalogsQuery.data?.opinionCodes ?? [];
  const paymentStatusCodes = catalogsQuery.data?.paymentStatusCodes ?? [];

  const mutation = useMutation({
    mutationFn: (payload) => requestJson(`/cases/${caseId}/franchise-recovery`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'franchise-recovery'] });
      queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] });
      toast.success('Recupero guardado.');
    },
    onError: (e) => toast.error(e.message),
  });

  const [enablesRepair, setEnablesRepair] = useState(recovery?.enablesRepair ? 'SI' : 'NO');
  const [recoversClient, setRecoversClient] = useState(recovery?.recoversClient ? 'SI' : 'NO');
  const [dictamen, setDictamen] = useState(recovery?.opinionCode ?? '');
  const [agreedAmount, setAgreedAmount] = useState(recovery?.agreedAmount ?? '');
  const [recoveryAmount, setRecoveryAmount] = useState(recovery?.recoveryAmount ?? '');

  useEffect(() => {
    setEnablesRepair(recovery?.enablesRepair ? 'SI' : 'NO');
    setRecoversClient(recovery?.recoversClient ? 'SI' : 'NO');
    setDictamen(recovery?.opinionCode ?? '');
    setAgreedAmount(recovery?.agreedAmount ?? '');
    setRecoveryAmount(recovery?.recoveryAmount ?? '');
  }, [recovery]);

  const agreed = toAmount(agreedAmount);
  const toRecover = toAmount(recoveryAmount);
  const culpaCompartida = dictamen === 'CULPA_COMPARTIDA';
  const showLowerAgreementWarning = agreed > 0 && toRecover > 0 && toRecover < agreed && !culpaCompartida;

  const handleSave = () => {
    const form = document.getElementById('franchise-recovery-form');
    const fd = new FormData(form);
    const habilitado = fd.get('enablesRepair') === 'SI';
    const recuperaCliente = culpaCompartida || (!habilitado && fd.get('recoversClient') === 'SI');

    mutation.mutate({
      managerCode: fd.get('managerCode') || null,
      baseCaseId: recovery?.baseCaseId ?? null,
      baseFolderCode: recovery?.baseFolderCode ?? null,
      opinionCode: fd.get('opinionCode') || null,
      agreedAmount: toAmount(fd.get('agreedAmount')) || null,
      recoveryAmount: toAmount(fd.get('recoveryAmount')) || null,
      enablesRepair: habilitado,
      recoversClient: recuperaCliente,
      clientAmount: recuperaCliente ? (toAmount(fd.get('clientAmount')) || null) : null,
      clientPaymentStatusCode: recuperaCliente ? (fd.get('clientPaymentStatusCode') || null) : null,
      clientPaymentDate: recuperaCliente ? (fd.get('clientPaymentDate') || null) : null,
      approvedLowerAgreement: showLowerAgreementWarning && fd.get('approvedLowerAgreement') === 'SI',
      approvalNote: fd.get('approvalNote') || null,
      reusesBaseData: true,
    });
  };

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ReceiptText className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-semibold">Recupero de franquicia</h4>
        </div>
        <Button size="sm" onClick={handleSave} disabled={mutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button>
      </div>

      {recovery?.baseCaseId && recovery?.baseFolderCode ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          <span>Recupero de la carpeta {recovery.baseFolderCode}</span>
          <Button type="button" size="sm" variant="outline" className="ml-auto" aria-label={`Abrir carpeta asociada ${recovery.baseFolderCode}`} onClick={() => navigate(`/cases/${recovery.baseCaseId}`)}>
            Abrir carpeta
          </Button>
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground">Sin carpeta asociada.</p>
      )}

      <form id="franchise-recovery-form" key={recovery?.id ?? 'new'} className="mt-4 space-y-3">
        <div className="grid gap-x-6 gap-y-3 md:grid-cols-3">
          <Field label="Gestiona">
            <select name="managerCode" defaultValue={recovery?.managerCode ?? ''} className={selectClass}>
              <option value="">—</option>
              {managerCodes.map((m) => (<option key={m.code} value={m.code}>{m.name || m.code}</option>))}
            </select>
          </Field>
          <Field label="Dictamen">
            <select name="opinionCode" value={dictamen} onChange={(e) => setDictamen(e.target.value)} className={selectClass}>
              <option value="">—</option>
              {opinionCodes.map((o) => (<option key={o.code} value={o.code}>{o.name || o.code}</option>))}
            </select>
          </Field>
          <Field label="Habilita reparación">
            <select name="enablesRepair" value={enablesRepair} onChange={(e) => setEnablesRepair(e.target.value)} className={selectClass}>
              <option value="NO">NO</option>
              <option value="SI">SI</option>
            </select>
          </Field>

          <Field label="Monto acordado">
            <Input name="agreedAmount" type="number" min="0" step="0.01" value={agreedAmount} onChange={(e) => setAgreedAmount(e.target.value)} placeholder="500000" />
          </Field>
          <Field label="Monto a recuperar">
            <Input name="recoveryAmount" type="number" min="0" step="0.01" value={recoveryAmount} onChange={(e) => setRecoveryAmount(e.target.value)} placeholder="500000" />
          </Field>
        </div>

        {enablesRepair !== 'SI' || culpaCompartida ? (
          <div className="grid gap-x-6 gap-y-3 md:grid-cols-4">
            <Field label="Recupera a favor del cliente">
              <select name="recoversClient" value={culpaCompartida ? 'SI' : recoversClient} disabled={culpaCompartida} onChange={(e) => setRecoversClient(e.target.value)} className={selectClass}>
                <option value="NO">NO</option>
                <option value="SI">SI</option>
              </select>
            </Field>
            {culpaCompartida || recoversClient === 'SI' ? (
              <>
                <Field label="Monto cliente">
                  <Input name="clientAmount" type="number" min="0" step="0.01" defaultValue={recovery?.clientAmount ?? ''} placeholder={culpaCompartida ? '50% del recupero' : '0'} />
                </Field>
                <Field label="Estado cobro cliente">
                  <select name="clientPaymentStatusCode" defaultValue={recovery?.clientPaymentStatusCode ?? ''} className={selectClass}>
                    <option value="">—</option>
                    {paymentStatusCodes.map((p) => (<option key={p.code} value={p.code}>{p.name || p.code}</option>))}
                  </select>
                </Field>
                <Field label="Fecha cobro">
                  <Input name="clientPaymentDate" type="date" defaultValue={recovery?.clientPaymentDate ?? ''} />
                </Field>
              </>
            ) : null}
          </div>
        ) : null}

        {showLowerAgreementWarning ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            El monto a recuperar es inferior al acordado. Requiere autorización del administrador.
          </div>
        ) : null}

        {showLowerAgreementWarning ? (
          <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
            <Field label="Aprobado por administrador">
              <select name="approvedLowerAgreement" defaultValue={recovery?.approvedLowerAgreement ? 'SI' : 'NO'} className={selectClass}>
                <option value="NO">NO</option>
                <option value="SI">SI</option>
              </select>
            </Field>
          </div>
        ) : null}

        <Field label="Nota de aprobación">
          <Textarea name="approvalNote" defaultValue={recovery?.approvalNote ?? ''} placeholder="Motivo de la autorización u observaciones..." className="min-h-[60px] resize-y" />
        </Field>
      </form>
    </div>
  );
};
