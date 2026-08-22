import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Receipt, Save } from 'lucide-react';
import { toast } from 'sonner';
import { createFinancialMovement, listFinancialMovements } from '@/modules/cases/api/finance-api';
import { requestJson } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

const toAmount = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const formatCurrency = (a) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(a || 0);

const selectClass = 'h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs">{label}</label>
    {children}
  </div>
);

export const FranchiseRecoveryPaymentsEditor = ({ caseId, caseDetail, onSaved }) => {
  const queryClient = useQueryClient();

  const recoveryQuery = useQuery({ queryKey: ['cases', String(caseId), 'franchise-recovery'], queryFn: () => requestJson(`/cases/${caseId}/franchise-recovery`) });
  const movementsQuery = useQuery({ queryKey: ['cases', String(caseId), 'financial-movements'], queryFn: () => listFinancialMovements(caseId) });

  const recovery = recoveryQuery.data;
  const movements = movementsQuery.data ?? [];

  const [form, setForm] = useState({ amount: '', movementAt: new Date().toISOString().slice(0, 16), flowOriginCode: 'TERCERO' });

  const amountToRecover = toAmount(recovery?.recoveryAmount || 0);
  const recovered = movements
    .filter((m) => m.movementTypeCode === 'INGRESO')
    .reduce((sum, m) => sum + toAmount(m.netAmount || 0), 0);
  const pending = Math.max(0, amountToRecover - recovered);

  const mutation = useMutation({
    mutationFn: (payload) => createFinancialMovement(caseId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'financial-movements'] });
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] });
      await onSaved?.();
      setForm({ amount: '', movementAt: new Date().toISOString().slice(0, 16), flowOriginCode: 'TERCERO' });
      toast.success('Cobro del recupero registrado.');
    },
    onError: (e) => toast.error(e.message),
  });

  const handleRegister = () => {
    const m = toAmount(form.amount);
    if (m <= 0) { toast.error('Ingresá un monto.'); return; }
    const fromThirdParty = form.flowOriginCode === 'TERCERO';
    mutation.mutate({
      movementTypeCode: 'INGRESO',
      flowOriginCode: form.flowOriginCode,
      counterpartyTypeCode: fromThirdParty ? 'COMPANY' : 'PERSONA',
      counterpartyPersonId: fromThirdParty ? null : caseDetail.principalCustomerPersonId,
      counterpartyCompanyId: null,
      movementAt: form.movementAt,
      grossAmount: m,
      netAmount: m,
      paymentMethodCode: 'TRANSFERENCIA',
      paymentMethodDetail: null,
      cancellationTypeCode: 'PRESUPUESTO',
      advancePayment: false,
      bonification: false,
      reason: 'Cobro de recupero de franquicia',
      externalReference: null,
      retentions: [],
      applications: [],
    });
  };

  return (
    <div className="mt-5 space-y-5">
      <div className="rounded-3xl border border-border/70 bg-card p-5">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Receipt className="h-5 w-5" /></div>
        <h4 className="text-lg font-semibold">Pagos del recupero</h4>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <MiniCard label="Monto a recuperar" value={formatCurrency(amountToRecover)} highlight />
          <MiniCard label="Cobrado" value={formatCurrency(recovered)} />
          <MiniCard label="Pendiente" value={formatCurrency(pending)} highlight={pending > 0} variant={pending <= 0 ? 'success' : 'warning'} />
        </div>

        <div className="mt-4 rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registrar cobro del recupero</p>
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="Origen">
              <select value={form.flowOriginCode} onChange={(e) => setForm((c) => ({ ...c, flowOriginCode: e.target.value }))} className={selectClass}>
                <option value="TERCERO">Tercero (Cía. / particular)</option>
                <option value="CLIENTE">Cliente</option>
              </select>
            </Field>
            <Field label="Monto"><Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))} /></Field>
            <Field label="Fecha"><Input type="datetime-local" value={form.movementAt} onChange={(e) => setForm((c) => ({ ...c, movementAt: e.target.value }))} /></Field>
            <div className="flex items-end"><Button className="w-full" onClick={handleRegister} disabled={mutation.isPending}><Save className="mr-1.5 h-4 w-4" />Registrar</Button></div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border/70 bg-card p-5">
        <h5 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Historial de movimientos</h5>
        {movements.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 py-6 text-center text-sm text-muted-foreground">Sin movimientos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/60 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-3 py-3 text-left">Fecha</th>
                  <th className="px-3 py-3 text-left">Tipo</th>
                  <th className="px-3 py-3 text-left">Origen</th>
                  <th className="px-3 py-3 text-right">Monto</th>
                  <th className="px-3 py-3 text-left">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3 font-medium">{m.movementAt?.slice(0, 16).replace('T', ' ')}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${m.movementTypeCode === 'INGRESO' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400'}`}>{m.movementTypeCode}</span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{m.flowOriginCode || '—'}</td>
                    <td className="px-3 py-3 text-right font-medium">{formatCurrency(m.netAmount)}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{m.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
