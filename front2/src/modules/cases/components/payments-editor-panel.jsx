import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Receipt, Save } from 'lucide-react';
import { toast } from 'sonner';
import { createFinancialMovement, getFinanceCatalogs, listFinancialMovements } from '@/modules/cases/api/finance-api';
import { useSession } from '@/modules/auth/providers/session-provider';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

const toAmount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const PaymentsEditorPanel = ({ caseId, caseDetail, particularFinanceSummary, onSaved }) => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const [form, setForm] = useState({
    amount: particularFinanceSummary?.pendingBalance?.toString?.() || '0',
    movementAt: new Date().toISOString().slice(0, 16),
    paymentMethodCode: 'TRANSFERENCIA',
    cancellationTypeCode: 'PRESUPUESTO',
    advancePayment: 'NO',
    bonification: 'NO',
    reason: '',
    externalReference: '',
    paymentMethodDetail: '',
  });

  const financeCatalogsQuery = useQuery({
    queryKey: ['finance', 'catalogs'],
    queryFn: getFinanceCatalogs,
  });

  const movementsQuery = useQuery({
    queryKey: ['cases', String(caseId), 'financial-movements'],
    queryFn: () => listFinancialMovements(caseId),
  });

  const paymentMethods = useMemo(
    () => financeCatalogsQuery.data?.paymentMethodCodes ?? [],
    [financeCatalogsQuery.data],
  );

  const cancellationTypes = useMemo(
    () => financeCatalogsQuery.data?.cancellationTypeCodes ?? [],
    [financeCatalogsQuery.data],
  );

  const saveMutation = useMutation({
    mutationFn: () => createFinancialMovement(caseId, {
      receiptId: null,
      movementTypeCode: 'INGRESO',
      flowOriginCode: 'CLIENTE',
      counterpartyTypeCode: 'PERSONA',
      counterpartyPersonId: caseDetail.principalCustomerPersonId,
      counterpartyCompanyId: null,
      movementAt: form.movementAt,
      grossAmount: toAmount(form.amount),
      netAmount: toAmount(form.amount),
      paymentMethodCode: form.paymentMethodCode,
      paymentMethodDetail: form.paymentMethodDetail || null,
      cancellationTypeCode: form.cancellationTypeCode,
      advancePayment: form.advancePayment === 'SI',
      bonification: form.bonification === 'SI',
      reason: form.reason || null,
      externalReference: form.externalReference || null,
      retentions: [],
      applications: [],
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] });
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'financial-movements'] });
      await onSaved?.();
      toast.success('Pago registrado y carpeta recompuesta.');
      setForm((current) => ({
        ...current,
        amount: '0',
        reason: '',
        externalReference: '',
        paymentMethodDetail: '',
      }));
    },
    onError: (error) => {
      toast.error(error.message || 'No pude registrar el pago.');
    },
  });

  return (
    <div className="mt-5 rounded-3xl border border-border/70 bg-background/80 p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold">Registrar pago del cliente</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Esta carga pega a finanzas reales. Después el backend recalcula readiness, estado visible y cierre automático del particular.
          </p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !caseDetail.principalCustomerPersonId}>
          <Save className="mr-2 h-4 w-4" />
          Guardar pago
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Monto">
          <Input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
        </Field>
        <Field label="Fecha y hora">
          <Input type="datetime-local" value={form.movementAt} onChange={(event) => setForm((current) => ({ ...current, movementAt: event.target.value }))} />
        </Field>
        <Field label="Medio de pago">
          <Select
            value={form.paymentMethodCode}
            onChange={(event) => setForm((current) => ({ ...current, paymentMethodCode: event.target.value }))}
            options={paymentMethods.map((item) => ({ value: item.code, label: item.label }))}
          />
        </Field>
        <Field label="Cancela">
          <Select
            value={form.cancellationTypeCode}
            onChange={(event) => setForm((current) => ({ ...current, cancellationTypeCode: event.target.value }))}
            options={cancellationTypes.map((item) => ({ value: item.code, label: item.label }))}
          />
        </Field>
        <Field label="Es seña">
          <Select value={form.advancePayment} onChange={(event) => setForm((current) => ({ ...current, advancePayment: event.target.value }))} options={[{ value: 'NO', label: 'No' }, { value: 'SI', label: 'Si' }]} />
        </Field>
        <Field label="Bonificación">
          <Select value={form.bonification} onChange={(event) => setForm((current) => ({ ...current, bonification: event.target.value }))} options={[{ value: 'NO', label: 'No' }, { value: 'SI', label: 'Si' }]} />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Referencia externa">
          <Input value={form.externalReference} onChange={(event) => setForm((current) => ({ ...current, externalReference: event.target.value }))} />
        </Field>
        <Field label="Detalle medio de pago">
          <Input value={form.paymentMethodDetail} onChange={(event) => setForm((current) => ({ ...current, paymentMethodDetail: event.target.value }))} />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Motivo / notas">
          <Textarea rows={4} value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} />
        </Field>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Metric label="Pendiente actual" value={particularFinanceSummary?.pendingBalance?.toString?.() || '0'} />
        <Metric label="Pagado por cliente" value={particularFinanceSummary?.customerPaid?.toString?.() || '0'} />
        <Metric label="Pago total" value={particularFinanceSummary?.paidInFull ? 'Si' : 'No'} icon={<Receipt className="h-4 w-4" />} />
      </div>

      <div className="mt-5 rounded-3xl border border-border/70 bg-card p-5">
        <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Historial de movimientos</h5>
        <div className="mt-4 space-y-2 text-sm">
          {(movementsQuery.data ?? []).length === 0 ? <p className="text-muted-foreground">Todavía no hay movimientos cargados.</p> : null}
          {(movementsQuery.data ?? []).map((movement) => (
            <div key={movement.id} className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-medium">{movement.movementTypeCode} - {movement.paymentMethodCode}</span>
                <span>{movement.netAmount}</span>
              </div>
              <p className="mt-1 text-muted-foreground">{movement.movementAt} - {movement.reason || 'Sin motivo'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {children}
  </div>
);

const Select = ({ options, ...props }) => (
  <select className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" {...props}>
    {options.map((option) => (
      <option key={option.value} value={option.value}>{option.label}</option>
    ))}
  </select>
);

const Metric = ({ label, value, icon }) => (
  <div className="rounded-2xl border border-border/70 bg-card p-4">
    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>{label}</span>
      {icon}
    </div>
    <p className="mt-3 text-lg font-semibold">{value}</p>
  </div>
);
