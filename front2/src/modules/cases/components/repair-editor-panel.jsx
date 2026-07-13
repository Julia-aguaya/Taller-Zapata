import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus2, CarFront, Flag, ImagePlus, PackagePlus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createRepairAppointment, createVehicleIntake, createVehicleOutcome, getOperationCatalogs, listRepairAppointments, listVehicleIntakes, listVehicleOutcomes } from '@/modules/cases/api/operations-api';
import { createCasePart, listCaseParts, syncPartsFromBudget, updateCasePart } from '@/modules/cases/api/parts-api';
import { requestJson } from '@/shared/api/http-client';
import { useSession } from '@/modules/auth/providers/session-provider';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

const createAppointmentState = (appointment) => ({
  appointmentDate: appointment?.appointmentDate || new Date().toISOString().slice(0, 10),
  appointmentTime: appointment?.appointmentTime || '09:00',
  estimatedDays: appointment?.estimatedDays?.toString?.() || '3',
  statusCode: appointment?.statusCode || 'PENDIENTE',
  reentry: appointment?.reentry ? 'SI' : 'NO',
  notes: appointment?.notes || '',
});

const createIntakeState = (intake, fallbackVehicleId) => ({
  intakeAt: intake?.intakeAt ? intake.intakeAt.slice(0, 16) : `${new Date().toISOString().slice(0, 10)}T09:00`,
  vehicleId: intake?.vehicleId || fallbackVehicleId || '',
  mileage: intake?.mileage?.toString?.() || '0',
  estimatedExitDate: intake?.estimatedExitDate || '',
  hasObservations: intake?.hasObservations ? 'SI' : 'NO',
  observationDetail: intake?.observationDetail || '',
});

const createOutcomeState = (outcome) => ({
  outcomeAt: outcome?.outcomeAt ? outcome.outcomeAt.slice(0, 16) : `${new Date().toISOString().slice(0, 10)}T18:00`,
  definitive: outcome?.definitive ? 'SI' : 'NO',
  shouldReenter: outcome?.shouldReenter ? 'SI' : 'NO',
  expectedReentryDate: outcome?.expectedReentryDate || '',
  estimatedReentryDays: outcome?.estimatedReentryDays?.toString?.() || '0',
  reentryStatusCode: outcome?.reentryStatusCode || '',
  repairedPhotosUploaded: outcome?.repairedPhotosUploaded ? 'SI' : 'NO',
  notes: outcome?.notes || '',
});

export const RepairEditorPanel = ({ caseId, caseDetail, latestAppointment, latestIntake, latestOutcome, onSaved }) => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const userId = Number(session?.user?.id || 1);

  const operationCatalogsQuery = useQuery({ queryKey: ['operation', 'catalogs'], queryFn: getOperationCatalogs });
  const appointmentsQuery = useQuery({ queryKey: ['cases', String(caseId), 'appointments'], queryFn: () => listRepairAppointments(caseId) });
  const intakesQuery = useQuery({ queryKey: ['cases', String(caseId), 'intakes'], queryFn: () => listVehicleIntakes(caseId) });
  const outcomesQuery = useQuery({ queryKey: ['cases', String(caseId), 'outcomes'], queryFn: () => listVehicleOutcomes(caseId) });

  const [appointment, setAppointment] = useState(() => createAppointmentState(latestAppointment));
  const [intake, setIntake] = useState(() => createIntakeState(latestIntake, caseDetail.principalVehicleId));
  const [outcome, setOutcome] = useState(() => createOutcomeState(latestOutcome));

  useEffect(() => { setAppointment(createAppointmentState(latestAppointment)); }, [latestAppointment]);
  useEffect(() => { setIntake(createIntakeState(latestIntake, caseDetail.principalVehicleId)); }, [caseDetail.principalVehicleId, latestIntake]);
  useEffect(() => { setOutcome(createOutcomeState(latestOutcome)); }, [latestOutcome]);

  const refreshWorkspace = async (message) => {
    await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] });
    await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'appointments'] });
    await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'intakes'] });
    await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'outcomes'] });
    await onSaved?.();
    toast.success(message);
  };

  const appointmentStatusOptions = (operationCatalogsQuery.data?.appointmentStatusCodes ?? []).map((item) => ({ value: item.code, label: item.name }));
  const reentryStatusOptions = (operationCatalogsQuery.data?.reentryStatusCodes ?? []).map((item) => ({ value: item.code, label: item.name }));

  const appointmentMutation = useMutation({
    mutationFn: () => {
      if (!appointment.appointmentDate) { toast.error('Falta la fecha del turno.'); throw new Error(); }
      if (!appointment.estimatedDays || Number(appointment.estimatedDays) <= 0) { toast.error('Faltan los días estimados.'); throw new Error(); }
      if (!appointment.statusCode) { toast.error('Falta el estado del turno.'); throw new Error(); }
      return createRepairAppointment(caseId, {
        appointmentDate: appointment.appointmentDate, appointmentTime: appointment.appointmentTime,
        estimatedDays: Number.parseInt(appointment.estimatedDays || '0', 10) || 0, estimatedExitDate: null,
        statusCode: appointment.statusCode, reentry: appointment.reentry === 'SI', notes: appointment.notes || null, userId,
      });
    },
    onSuccess: async () => refreshWorkspace('Turno creado y workspace actualizado.'),
    onError: (error) => toast.error(error.message || 'No pude crear el turno.'),
  });

  const intakeMutation = useMutation({
    mutationFn: () => createVehicleIntake(caseId, {
      appointmentId: latestAppointment?.id || null, vehicleId: Number(intake.vehicleId), intakeAt: intake.intakeAt,
      receivedByUserId: userId, deliveredByPersonId: null, mileage: Number.parseInt(intake.mileage || '0', 10) || 0,
      fuelCode: null, estimatedExitDate: intake.estimatedExitDate || null,
      hasObservations: intake.hasObservations === 'SI', observationDetail: intake.hasObservations === 'SI' ? intake.observationDetail || null : null,
    }),
    onSuccess: async () => refreshWorkspace('Ingreso registrado.'),
    onError: (error) => toast.error(error.message || 'No pude registrar el ingreso.'),
  });

  const outcomeMutation = useMutation({
    mutationFn: () => createVehicleOutcome(caseId, {
      intakeId: latestIntake?.id, outcomeAt: outcome.outcomeAt, deliveredByUserId: userId, receivedByPersonId: null,
      definitive: outcome.definitive === 'SI', shouldReenter: outcome.shouldReenter === 'SI',
      expectedReentryDate: outcome.shouldReenter === 'SI' ? outcome.expectedReentryDate || null : null,
      estimatedReentryDays: outcome.shouldReenter === 'SI' ? Number.parseInt(outcome.estimatedReentryDays || '0', 10) || 0 : null,
      reentryStatusCode: outcome.shouldReenter === 'SI' ? outcome.reentryStatusCode || null : null,
      repairedPhotosUploaded: outcome.repairedPhotosUploaded === 'SI', notes: outcome.notes || null,
    }),
    onSuccess: async () => refreshWorkspace('Egreso registrado y estados recalculados.'),
    onError: (error) => toast.error(error.message || 'No pude registrar el egreso.'),
  });

  // Parts
  const partsQuery = useQuery({ queryKey: ['cases', String(caseId), 'parts'], queryFn: () => listCaseParts(caseId) });
  const [newPart, setNewPart] = useState({ description: '', statusCode: 'PENDIENTE', budgetedPrice: '0', finalPrice: '0', purchasedByCode: 'TALLER' });

  const createPartMutation = useMutation({
    mutationFn: () => createCasePart(caseId, { budgetItemId: null, description: newPart.description, partCode: null, finalSupplier: null, authorizationCode: null, statusCode: newPart.statusCode, purchasedByCode: newPart.purchasedByCode, paymentStatusCode: null, budgetedPrice: Number(newPart.budgetedPrice) || 0, finalPrice: Number(newPart.finalPrice) || 0, receivedDate: null, used: false, returned: false }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'parts'] }); await refreshWorkspace('Repuesto agregado.'); setNewPart({ description: '', statusCode: 'PENDIENTE', budgetedPrice: '0', finalPrice: '0', purchasedByCode: 'TALLER' }); },
    onError: (error) => toast.error(error.message || 'No pude agregar el repuesto.'),
  });

  const updatePartMutation = useMutation({
    mutationFn: ({ partId, payload }) => updateCasePart(caseId, partId, payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'parts'] }); await refreshWorkspace('Repuesto actualizado.'); },
    onError: (error) => toast.error(error.message || 'No pude actualizar el repuesto.'),
  });

  const syncPartsMutation = useMutation({
    mutationFn: () => syncPartsFromBudget(caseId),
    onSuccess: async (data) => { await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'parts'] }); await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] }); toast.success(`${data.length} repuesto(s) sincronizado(s) desde el presupuesto.`); },
    onError: (error) => toast.error(error.message || 'No pude sincronizar.'),
  });

  const parts = partsQuery.data ?? [];
  const partsTotal = parts.reduce((sum, part) => sum + (part.finalPrice || part.budgetedPrice || 0), 0);

  // Photos repaired
  const repairPhotoRef = useRef(null);
  const repairPhotosUploadMutation = useMutation({
    mutationFn: async (file) => {
      const stored = JSON.parse(window.localStorage.getItem('front2.session.v1') || '{}');
      const form = new FormData(); form.append('file', file); form.append('categoryId', '2'); form.append('originCode', 'TALLER');
      const r = await fetch('/api/v1/documents', { method: 'POST', headers: { Authorization: `Bearer ${stored.accessToken}` }, body: form });
      if (!r.ok) throw new Error('Error al subir');
      const doc = await r.json();
      await requestJson(`/documents/${doc.id}/relations`, { method: 'POST', body: JSON.stringify({ caseId: Number(caseId), entityType: 'CASO', entityId: Number(caseId), moduleCode: 'OPERACION', principal: false, visibleToCustomer: false, visualOrder: 0 }) });
      return doc;
    },
    onSuccess: async () => { toast.success('Foto de reparado subida.'); if (repairPhotoRef.current) repairPhotoRef.current.value = ''; },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-3">
      <EditorCard icon={<CalendarPlus2 className="h-5 w-5" />} title="Turno" subtitle="La reparación no se ordena sola. Acá arrancás el flujo operativo real." action={<Button onClick={() => appointmentMutation.mutate()} disabled={appointmentMutation.isPending}><Save className="mr-2 h-4 w-4" />Guardar turno</Button>}>
        <Field label="Fecha"><Input type="date" value={appointment.appointmentDate} onChange={(e) => setAppointment((c) => ({ ...c, appointmentDate: e.target.value }))} /></Field>
        <Field label="Hora"><Input type="time" value={appointment.appointmentTime} onChange={(e) => setAppointment((c) => ({ ...c, appointmentTime: e.target.value }))} /></Field>
        <Field label="Días estimados"><Input type="number" min="0" value={appointment.estimatedDays} onChange={(e) => setAppointment((c) => ({ ...c, estimatedDays: e.target.value }))} /></Field>
        <Field label="Estado"><Select value={appointment.statusCode} onChange={(e) => setAppointment((c) => ({ ...c, statusCode: e.target.value }))} options={appointmentStatusOptions.length > 0 ? appointmentStatusOptions : [{ value: 'PENDIENTE', label: 'Pendiente' }]} /></Field>
        <Field label="Notas"><Textarea rows={3} value={appointment.notes} onChange={(e) => setAppointment((c) => ({ ...c, notes: e.target.value }))} /></Field>
      </EditorCard>

      <EditorCard icon={<CarFront className="h-5 w-5" />} title="Ingreso" subtitle="Registrar el ingreso ya alinea readiness y estado visible." action={<Button variant="outline" onClick={() => intakeMutation.mutate()} disabled={intakeMutation.isPending || !latestAppointment?.id}><Save className="mr-2 h-4 w-4" />Guardar ingreso</Button>}>
        <Field label="Fecha y hora"><Input type="datetime-local" value={intake.intakeAt} onChange={(e) => setIntake((c) => ({ ...c, intakeAt: e.target.value }))} /></Field>
        <Field label="Vehicle ID"><Input type="number" value={intake.vehicleId} onChange={(e) => setIntake((c) => ({ ...c, vehicleId: e.target.value }))} /></Field>
        <Field label="Kilometraje"><Input type="number" min="0" value={intake.mileage} onChange={(e) => setIntake((c) => ({ ...c, mileage: e.target.value }))} /></Field>
        <Field label="Salida estimada"><Input type="date" value={intake.estimatedExitDate} onChange={(e) => setIntake((c) => ({ ...c, estimatedExitDate: e.target.value }))} /></Field>
        <Field label="Observaciones"><Select value={intake.hasObservations} onChange={(e) => setIntake((c) => ({ ...c, hasObservations: e.target.value }))} options={[{ value: 'NO', label: 'No' }, { value: 'SI', label: 'Sí' }]} /></Field>
        {intake.hasObservations === 'SI' ? <Field label="Detalle"><Textarea rows={3} value={intake.observationDetail} onChange={(e) => setIntake((c) => ({ ...c, observationDetail: e.target.value }))} /></Field> : null}
      </EditorCard>

      <EditorCard icon={<Flag className="h-5 w-5" />} title="Egreso" subtitle="El egreso definitivo y el pago total son los que cierran la carpeta." action={<Button variant="secondary" onClick={() => outcomeMutation.mutate()} disabled={outcomeMutation.isPending || !latestIntake?.id}><Save className="mr-2 h-4 w-4" />Guardar egreso</Button>}>
        <Field label="Fecha y hora"><Input type="datetime-local" value={outcome.outcomeAt} onChange={(e) => setOutcome((c) => ({ ...c, outcomeAt: e.target.value }))} /></Field>
        <Field label="Definitivo"><Select value={outcome.definitive} onChange={(e) => setOutcome((c) => ({ ...c, definitive: e.target.value }))} options={[{ value: 'NO', label: 'No' }, { value: 'SI', label: 'Sí' }]} /></Field>
        <Field label="Debe reingresar"><Select value={outcome.shouldReenter} onChange={(e) => setOutcome((c) => ({ ...c, shouldReenter: e.target.value }))} options={[{ value: 'NO', label: 'No' }, { value: 'SI', label: 'Sí' }]} /></Field>
        {outcome.shouldReenter === 'SI' ? (<><Field label="Fecha reingreso"><Input type="date" value={outcome.expectedReentryDate} onChange={(e) => setOutcome((c) => ({ ...c, expectedReentryDate: e.target.value }))} /></Field><Field label="Días reingreso"><Input type="number" min="0" value={outcome.estimatedReentryDays} onChange={(e) => setOutcome((c) => ({ ...c, estimatedReentryDays: e.target.value }))} /></Field><Field label="Estado reingreso"><Select value={outcome.reentryStatusCode} onChange={(e) => setOutcome((c) => ({ ...c, reentryStatusCode: e.target.value }))} options={reentryStatusOptions.length > 0 ? reentryStatusOptions : [{ value: '', label: 'Sin definir' }]} /></Field></>) : null}
        <Field label="Fotos reparado"><Select value={outcome.repairedPhotosUploaded} onChange={(e) => setOutcome((c) => ({ ...c, repairedPhotosUploaded: e.target.value }))} options={[{ value: 'NO', label: 'No' }, { value: 'SI', label: 'Sí' }]} /></Field>
        <div className="space-y-1.5"><Label>Subir foto reparado</Label><input ref={repairPhotoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) repairPhotosUploadMutation.mutate(f); }} /><Button variant="outline" size="sm" onClick={() => repairPhotoRef.current?.click()}><ImagePlus className="mr-1.5 h-4 w-4" />Subir</Button></div>
        <Field label="Notas"><Textarea rows={3} value={outcome.notes} onChange={(e) => setOutcome((c) => ({ ...c, notes: e.target.value }))} /></Field>
      </EditorCard>

      {/* Parts section */}
      <div className="xl:col-span-3 rounded-3xl border border-border/70 bg-card p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><PackagePlus className="h-5 w-5" /></div>
            <h4 className="text-lg font-semibold">Repuestos</h4>
            <p className="mt-1 text-sm text-muted-foreground">Total: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(partsTotal)}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => syncPartsMutation.mutate()} disabled={syncPartsMutation.isPending}>Sincronizar con presupuesto</Button>
        </div>
        <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2"><Label>Descripción</Label><Input value={newPart.description} onChange={(e) => setNewPart((c) => ({ ...c, description: e.target.value }))} placeholder="Ej: Puerta delantera derecha" /></div>
          <div className="space-y-2"><Label>Estado</Label><Select value={newPart.statusCode} onChange={(e) => setNewPart((c) => ({ ...c, statusCode: e.target.value }))} options={[{ value: 'PENDIENTE', label: 'Pendiente' }, { value: 'ENCARGADO', label: 'Encargado' }, { value: 'RECIBIDO', label: 'Recibido' }, { value: 'DEVOLVER', label: 'Devolver' }]} /></div>
          <div className="space-y-2"><Label>Provisto por</Label><Select value={newPart.purchasedByCode} onChange={(e) => setNewPart((c) => ({ ...c, purchasedByCode: e.target.value }))} options={[{ value: 'TALLER', label: 'Taller' }, { value: 'CIA', label: 'Cía.' }, { value: 'CLIENTE', label: 'Cliente' }]} /></div>
          <div className="space-y-2"><Label>$ cotizado</Label><Input type="number" min="0" step="0.01" value={newPart.budgetedPrice} onChange={(e) => setNewPart((c) => ({ ...c, budgetedPrice: e.target.value }))} /></div>
          <div className="flex items-end"><Button className="w-full" onClick={() => createPartMutation.mutate()} disabled={createPartMutation.isPending || !newPart.description.trim()}><PackagePlus className="mr-2 h-4 w-4" />Agregar</Button></div>
        </div>
        <div className="space-y-2">
          {parts.length === 0 ? (<p className="rounded-2xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">Todavía no hay repuestos. Usá "Sincronizar con presupuesto" o agregá manualmente.</p>) : (parts.map((part) => (
            <div key={part.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
              <div className="flex flex-wrap items-center gap-3"><span className="font-medium">{part.description || 'Sin descripción'}</span><Select className="h-9 w-auto min-w-[120px] text-xs" value={part.statusCode || ''} onChange={(e) => updatePartMutation.mutate({ partId: part.id, payload: { statusCode: e.target.value } })} options={[{ value: 'PENDIENTE', label: 'Pendiente' }, { value: 'ENCARGADO', label: 'Encargado' }, { value: 'RECIBIDO', label: 'Recibido' }, { value: 'DEVOLVER', label: 'Devolver' }]} /></div>
              <div className="flex items-center gap-3 text-sm"><span className="text-muted-foreground">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(part.finalPrice || part.budgetedPrice || 0)}</span><span className="text-xs text-muted-foreground">{part.purchasedByCode || 'TALLER'}</span></div>
            </div>
          )))}
        </div>
      </div>

      {/* History */}
      <div className="xl:col-span-3 grid gap-4 xl:grid-cols-3">
        <HistoryCard title="Historial de turnos" items={appointmentsQuery.data ?? []} renderItem={(item) => `${item.appointmentDate} ${item.appointmentTime || ''} → ${item.estimatedExitDate || '—'} (${item.estimatedDays || 0}d) — ${item.statusCode || 'SIN ESTADO'}`} />
        <HistoryCard title="Historial de ingresos" items={intakesQuery.data ?? []} renderItem={(item) => `${item.intakeAt} → salida est. ${item.estimatedExitDate || '—'} — km ${item.mileage ?? 0}`} />
        <HistoryCard title="Historial de egresos" items={outcomesQuery.data ?? []} renderItem={(item) => `${item.outcomeAt} - ${item.definitive ? 'Definitivo' : 'Parcial'}${item.shouldReenter ? ' / Reingresa' : ''}`} />
      </div>
    </div>
  );
};

const EditorCard = ({ icon, title, subtitle, action, children }) => (
  <div className="rounded-3xl border border-border/70 bg-card p-5">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</div><h4 className="text-lg font-semibold">{title}</h4><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div>
      <div>{action}</div>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const Field = ({ label, children }) => (<div className="space-y-2"><Label>{label}</Label>{children}</div>);

const Select = ({ options, ...props }) => (
  <select className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" {...props}>
    {options.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
  </select>
);

const HistoryCard = ({ title, items, renderItem }) => (
  <div className="rounded-3xl border border-border/70 bg-card p-5">
    <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</h5>
    <div className="mt-4 space-y-2 text-sm">
      {items.length === 0 ? <p className="text-muted-foreground">Sin registros.</p> : items.map((item) => (<div key={item.id} className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">{renderItem(item)}</div>))}
    </div>
  </div>
);
