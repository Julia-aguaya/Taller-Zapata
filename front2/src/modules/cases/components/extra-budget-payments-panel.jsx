import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { annulExtraBudgetPayment, extraBudgetQueryKey, getExtraBudget } from '@/modules/cases/api/extra-budget-api';
import { Button } from '@/shared/ui/button';

const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 });
export const ExtraBudgetPaymentsPanel = ({ caseId, caseTypeCode, onSaved, onRegisterClientPayment }) => {
  const queryClient = useQueryClient();
  const supportsExtraBudget = ['TODO_RIESGO', 'GRANIZO'].includes(caseTypeCode);
  const extraQuery = useQuery({ queryKey: extraBudgetQueryKey(caseId), queryFn: () => getExtraBudget(caseId), retry: false, enabled: supportsExtraBudget });
  const extra = extraQuery.data;
  const canPay = extra?.customerConfirmation === 'SI' && extra?.currentStatus === 'ACEPTADO' && Number(extra.balance) > 0;
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: extraBudgetQueryKey(caseId) }),
      queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] }),
    ]);
    await onSaved?.();
  };
  const annulmentMutation = useMutation({
    mutationFn: (movementId) => annulExtraBudgetPayment(caseId, { expectedVersion: extra.versionLock, movementId }),
    onSuccess: async () => { await refresh(); toast.success('Pago de trabajos extras anulado.'); },
    onError: (error) => toast.error(error.message || 'No pude anular el pago de trabajos extras.'),
  });

  if (!supportsExtraBudget || extraQuery.isLoading || extraQuery.isError || !extra) return null;
  const accepted = (Array.isArray(extra.versions) ? extra.versions : []).find((version) => version.id === extra.acceptedVersionId);
  const payments = Array.isArray(extra.payments) ? extra.payments : [];
  const reversedOriginalIds = new Set(payments.map((payment) => payment.reversedApplicationId).filter(Boolean));
  return <section className="rounded-3xl border border-border/70 bg-card p-5" aria-labelledby="extra-payment-heading">
    <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Pagos cliente</p><h4 id="extra-payment-heading" className="mt-1 text-lg font-semibold">Pagos adicionales del cliente</h4><p className="mt-1 text-sm text-muted-foreground">Presupuesto extra {extra.issuedNumber ? `N.º ${extra.issuedNumber}` : `V${extra.currentVersion}`}. Los importes son los informados por el servidor.</p></div>
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5"><Summary label="MO extras c/IVA" value={accepted?.laborWithVat ?? 0} /><Summary label="Repuestos extras" value={accepted?.partsTotal ?? 0} /><Summary label="Cotizado / aceptado" value={accepted?.total ?? 0} /><Summary label="Total abonado" value={extra.paidAmount} /><Summary label="Saldo pendiente" value={extra.balance} highlight /></div>
    {canPay && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 p-4"><p className="text-sm text-muted-foreground">El cobro se registra desde el formulario único de pagos del cliente y admite importes parciales.</p><Button onClick={() => onRegisterClientPayment?.({ concept: 'TRABAJOS_EXTRAS', amount: String(extra.balance), expectedVersion: extra.versionLock })}>Registrar pago del cliente</Button></div>}
    {payments.length > 0 && <div className="mt-4 space-y-2" aria-label="Historial de pagos extra">{payments.map((payment) => <div key={payment.id ?? payment.movementId} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2 text-sm"><span>{Number(payment.amount) < 0 ? 'Reversión de pago' : `Pago ${currency.format(payment.amount)}`}</span>{Number(payment.amount) > 0 && !reversedOriginalIds.has(payment.id) && <Button variant="outline" size="sm" disabled={annulmentMutation.isPending} onClick={() => annulmentMutation.mutate(payment.movementId)}>Anular pago</Button>}</div>)}</div>}
  </section>;
};

const Summary = ({ label, value, highlight }) => <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold tabular-nums ${highlight ? 'text-primary' : ''}`}>{currency.format(value ?? 0)}</p></div>;
