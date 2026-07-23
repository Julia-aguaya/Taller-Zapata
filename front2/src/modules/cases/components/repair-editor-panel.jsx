import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus2, CarFront, Clock, Flag, ImagePlus, Lock, PackagePlus, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createRepairAppointment, createVehicleIntake, createVehicleOutcome, getOperationCatalogs, listRepairAppointments, listVehicleIntakes, listVehicleOutcomes, updateRepairAppointment } from '@/modules/cases/api/operations-api';
import { createCasePart, deleteCasePart, getPartsCatalogs, listCaseParts, syncPartsFromBudget, updateCasePart } from '@/modules/cases/api/parts-api';
import { requestJson } from '@/shared/api/http-client';
import { useSession } from '@/modules/auth/providers/session-provider';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

const addBusinessDays = (startDateStr, days) => {
  if (!startDateStr || !days || days <= 0) return startDateStr || '';
  const d = new Date(startDateStr + 'T12:00:00');
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d.toISOString().slice(0, 10);
};

const createAppointmentState = (appointment) => ({
  appointmentDate: appointment?.appointmentDate || new Date().toISOString().slice(0, 10),
  appointmentTime: appointment?.appointmentTime || '09:00',
  estimatedDays: appointment?.estimatedDays?.toString?.() || '3',
  estimatedExitDate: appointment?.estimatedExitDate || addBusinessDays(appointment?.appointmentDate, appointment?.estimatedDays),
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
  observationCreatedAt: intake?.observationCreatedAt || null,
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

  useEffect(() => {
    setAppointment((c) => ({
      ...c,
      estimatedExitDate: addBusinessDays(c.appointmentDate, Number(c.estimatedDays) || 0),
    }));
  }, [appointment.appointmentDate, appointment.estimatedDays]);

  useEffect(() => {
    const intakeDate = intake.intakeAt ? intake.intakeAt.slice(0, 10) : null;
    const days = Number(appointment.estimatedDays) || 0;
    setIntake((c) => ({
      ...c,
      estimatedExitDate: addBusinessDays(intakeDate, days),
    }));
  }, [intake.intakeAt, appointment.estimatedDays]);

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
        estimatedDays: Number.parseInt(appointment.estimatedDays || '0', 10) || 0,
        estimatedExitDate: appointment.estimatedExitDate || null, statusCode: appointment.statusCode, reentry: appointment.reentry === 'SI', notes: appointment.notes || null, userId,
      });
    },
    onSuccess: async () => refreshWorkspace('Turno creado y workspace actualizado.'),
    onError: (error) => toast.error(error.message || 'No pude crear el turno.'),
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: ({ appointmentId, payload }) => updateRepairAppointment(appointmentId, payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'appointments'] }); await refreshWorkspace('Estado del turno actualizado.'); },
    onError: (error) => toast.error(error.message || 'No pude actualizar el turno.'),
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
    onSuccess: async (data) => {
      const message = data?.shouldReenter
        ? 'Egreso registrado. Turno de reingreso creado automáticamente.'
        : 'Egreso registrado y estados recalculados.';
      await refreshWorkspace(message);
    },
    onError: (error) => toast.error(error.message || 'No pude registrar el egreso.'),
  });

  // Parts
  const partsQuery = useQuery({ queryKey: ['cases', String(caseId), 'parts'], queryFn: () => listCaseParts(caseId) });
  const partsCatalogsQuery = useQuery({ queryKey: ['parts', 'catalogs'], queryFn: getPartsCatalogs });

  const statusCodeOptions = useMemo(
    () => (partsCatalogsQuery.data?.statusCodes ?? [
      { code: 'PENDIENTE', name: 'Pendiente' },
      { code: 'ENCARGADO', name: 'Encargado' },
      { code: 'RECIBIDO', name: 'Recibido' },
      { code: 'DEVOLVER', name: 'Devolver' },
    ]).map((item) => ({ value: item.code, label: item.name })),
    [partsCatalogsQuery.data?.statusCodes],
  );

  const purchasedByCodeOptions = useMemo(
    () => (partsCatalogsQuery.data?.purchasedByCodes ?? [
      { code: 'TALLER', name: 'Taller' },
      { code: 'CIA', name: 'Cía.' },
      { code: 'CLIENTE', name: 'Cliente' },
    ]).map((item) => ({ value: item.code, label: item.name })),
    [partsCatalogsQuery.data?.purchasedByCodes],
  );

  const paymentStatusCodeOptions = useMemo(
    () => (partsCatalogsQuery.data?.paymentStatusCodes ?? [
      { code: 'PENDIENTE', name: 'Pendiente' },
      { code: 'CANCELADO', name: 'Cancelado' },
      { code: 'PAGADO', name: 'Pagado' },
    ]).map((item) => ({ value: item.code, label: item.name })),
    [partsCatalogsQuery.data?.paymentStatusCodes],
  );

  const [editMode, setEditMode] = useState(false);
  const [draftParts, setDraftParts] = useState([]);
  const [newPartForm, setNewPartForm] = useState({ description: '', finalSupplier: '', finalPrice: '0', budgetedPrice: '0', statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' });
  const [saving, setSaving] = useState(false);

  const updatePartMutation = useMutation({
    mutationFn: ({ partId, payload }) => updateCasePart(caseId, partId, payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'parts'] }); await refreshWorkspace('Repuesto actualizado.'); },
    onError: (error) => toast.error(error.message || 'No pude actualizar el repuesto.'),
  });

  const [deletePartConfirm, setDeletePartConfirm] = useState(null);
  const deletePartMutation = useMutation({
    mutationFn: (partId) => deleteCasePart(caseId, partId),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'parts'] }); toast.success('Repuesto eliminado.'); setDeletePartConfirm(null); },
    onError: (error) => toast.error(error.message || 'No pude eliminar el repuesto.'),
  });

  const syncPartsMutation = useMutation({
    mutationFn: () => syncPartsFromBudget(caseId),
    onSuccess: async (data) => { await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'parts'] }); await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] }); toast.success(`${data.length} repuesto(s) sincronizado(s) desde el presupuesto.`); },
    onError: (error) => toast.error(error.message || 'No pude sincronizar.'),
  });

  const parts = partsQuery.data ?? [];
  const appointments = appointmentsQuery.data ?? [];

  const enterEditMode = () => {
    setDraftParts(parts.map(p => ({ ...p })));
    setEditMode(true);
  };

  const cancelEdit = () => {
    setDraftParts([]);
    setNewPartForm({ description: '', finalSupplier: '', finalPrice: '0', budgetedPrice: '0', statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' });
    setEditMode(false);
  };

  const updateDraftField = (tempId, field, value) => {
    setDraftParts(prev => prev.map(p => (p._tempId || p.id) === tempId ? { ...p, [field]: value } : p));
  };

  const addNewPartToDraft = () => {
    if (!newPartForm.description.trim()) { toast.error('Falta la descripción.'); return; }
    const tempId = -Date.now();
    setDraftParts(prev => [...prev, { ...newPartForm, _tempId: tempId, id: tempId, budgetedPrice: Number(newPartForm.budgetedPrice) || 0, finalPrice: Number(newPartForm.finalPrice) || 0 }]);
    setNewPartForm({ description: '', finalSupplier: '', finalPrice: '0', budgetedPrice: '0', statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' });
  };

  const removeFromDraft = (tempId) => {
    setDraftParts(prev => prev.filter(p => (p._tempId || p.id) !== tempId));
  };

  const saveAllChanges = async () => {
    setSaving(true);
    try {
      const promises = [];
      for (const draft of draftParts) {
        if (draft._tempId && draft._tempId < 0) continue;
        const original = parts.find(p => p.id === draft.id);
        if (!original) continue;
        const changes = {};
        if ((draft.finalSupplier || '') !== (original.finalSupplier || '')) changes.finalSupplier = draft.finalSupplier || null;
        if (Number(draft.finalPrice || 0) !== Number(original.finalPrice || 0)) changes.finalPrice = Number(draft.finalPrice) || 0;
        if (draft.statusCode !== original.statusCode) changes.statusCode = draft.statusCode;
        if (draft.purchasedByCode !== original.purchasedByCode) changes.purchasedByCode = draft.purchasedByCode;
        if (draft.paymentStatusCode !== original.paymentStatusCode) changes.paymentStatusCode = draft.paymentStatusCode || null;
        if (Object.keys(changes).length > 0) {
          promises.push(updateCasePart(caseId, draft.id, {
            budgetItemId: null,
            description: draft.description,
            partCode: null,
            finalSupplier: draft.finalSupplier || null,
            authorizationCode: null,
            statusCode: draft.statusCode || original.statusCode,
            purchasedByCode: draft.purchasedByCode || original.purchasedByCode,
            paymentStatusCode: draft.paymentStatusCode || original.paymentStatusCode || null,
            budgetedPrice: Number(draft.budgetedPrice || original.budgetedPrice) || 0,
            finalPrice: Number(draft.finalPrice || original.finalPrice) || 0,
            receivedDate: null,
            used: false,
            returned: false,
          }));
        }
      }
      for (const draft of draftParts) {
        if (draft._tempId && draft._tempId < 0) {
          promises.push(createCasePart(caseId, {
            budgetItemId: null,
            description: draft.description,
            partCode: null,
            finalSupplier: draft.finalSupplier || null,
            authorizationCode: null,
            statusCode: draft.statusCode,
            purchasedByCode: draft.purchasedByCode,
            paymentStatusCode: draft.paymentStatusCode || null,
            budgetedPrice: Number(draft.budgetedPrice) || 0,
            finalPrice: Number(draft.finalPrice) || 0,
            receivedDate: null,
            used: false,
            returned: false,
          }));
        }
      }
      await Promise.all(promises);
      await queryClient.refetchQueries({ queryKey: ['cases', String(caseId), 'parts'] });
      setEditMode(false);
      setDraftParts([]);
      toast.success('Cambios guardados.');
    } catch (err) {
      toast.error('Error al guardar: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const displayParts = editMode ? draftParts : parts;
  const partsTotal = displayParts.reduce((sum, part) => sum + (Number(part.finalPrice) || Number(part.budgetedPrice) || 0), 0);

  const [subTab, setSubTab] = useState('repuestos');

  const subTabAvailability = useMemo(() => ({
    repuestos: { enabled: true, reason: null },
    turno: { enabled: parts.length > 0, reason: 'Primero cargá los repuestos' },
    ingreso: { enabled: !!latestAppointment?.id, reason: 'Primero creá un turno' },
    egreso: { enabled: !!latestIntake?.id, reason: 'Primero registrá un ingreso' },
    historial: { enabled: true, reason: null },
  }), [latestAppointment?.id, latestIntake?.id, parts.length]);

  useEffect(() => {
    if (!subTabAvailability[subTab]?.enabled) {
      const firstAvailable = ['repuestos', 'turno', 'ingreso', 'egreso', 'historial']
        .find((k) => subTabAvailability[k]?.enabled);
      if (firstAvailable) setSubTab(firstAvailable);
    }
  }, [subTab, subTabAvailability]);

  const subTabBadges = useMemo(() => ({
    repuestos: parts.length > 0 ? 'Cargado' : null,
    turno: latestAppointment?.statusCode ? (appointmentStatusOptions.find(o => o.value === latestAppointment.statusCode)?.label || latestAppointment.statusCode) : null,
    ingreso: latestIntake ? 'Registrado' : null,
    egreso: latestOutcome ? (latestOutcome.definitive ? 'Definitivo' : 'Parcial') : null,
    historial: null,
  }), [parts.length, latestAppointment?.statusCode, latestIntake, latestOutcome, appointmentStatusOptions]);

  const subTabCompleted = useMemo(() => ({
    repuestos: parts.length > 0,
    turno: !!latestAppointment,
    ingreso: !!latestIntake,
    egreso: !!latestOutcome,
    historial: false,
  }), [parts.length, latestAppointment, latestIntake, latestOutcome]);

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
    <div className="mt-5 space-y-5">
      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          ['repuestos', 'Repuestos', PackagePlus],
          ['turno', 'Turno', CalendarPlus2],
          ['ingreso', 'Ingreso', CarFront],
          ['egreso', 'Egreso', Flag],
          ['historial', 'Historial de Movimiento', Clock],
        ].map(([key, label, Icon]) => {
          const avail = subTabAvailability[key];
          const isLocked = !avail?.enabled;
          const isActive = subTab === key;
          const isCompleted = subTabCompleted[key];
          const badge = subTabBadges[key];
          return (
            <button key={key} type="button" onClick={() => !isLocked && setSubTab(key)} disabled={isLocked}
              title={isLocked ? avail.reason : label}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition border ${
                isLocked
                  ? 'border-transparent bg-background/40 text-muted-foreground/40 cursor-not-allowed'
                  : isCompleted
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isActive
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-transparent bg-background/70 text-foreground hover:border-border/60 hover:bg-accent/50'
              }`}>
              <Icon className="h-4 w-4 shrink-0" />
              <span>
                <span className="block leading-tight">{label}</span>
                {isLocked ? (
                  <span className="text-[11px] text-muted-foreground/60">{avail.reason}</span>
                ) : badge ? (
                  <span className={`text-[11px] ${isCompleted ? 'text-primary-foreground/80' : isActive ? 'text-primary/60' : 'text-muted-foreground'}`}>{badge}</span>
                ) : (
                  <span className={`text-[11px] ${isActive ? 'text-primary/60' : 'text-muted-foreground'}`}>Pendiente</span>
                )}
              </span>
              {isLocked ? <Lock className="h-3.5 w-3.5 shrink-0" /> : null}
            </button>
          );
        })}
      </div>

      {subTab === 'repuestos' ? (
        <div className="rounded-3xl border border-border/70 bg-card p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><PackagePlus className="h-5 w-5" /></div>
            <h4 className="text-lg font-semibold">Repuestos</h4>
            <p className="mt-1 text-sm text-muted-foreground">Total: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(partsTotal)}</p>
          </div>
          {editMode ? (
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={cancelEdit}>Cancelar</Button>
              <Button size="sm" onClick={saveAllChanges} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
            </div>
          ) : (
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => syncPartsMutation.mutate()} disabled={syncPartsMutation.isPending}><RefreshCw className="mr-1.5 h-4 w-4" />Sincronizar con presupuesto</Button>
              <Button variant="outline" size="sm" onClick={enterEditMode}>Editar</Button>
            </div>
          )}
        </div>
        {editMode ? (
          <div className="mb-4 rounded-2xl border border-dashed border-border/60 bg-background/70 p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-1"><Label className="text-xs">Descripción</Label><Input className="h-9 rounded-xl text-sm" value={newPartForm.description} onChange={(e) => setNewPartForm(f => ({...f, description: e.target.value}))} placeholder="Repuesto a agregar" /></div>
              <div className="space-y-1"><Label className="text-xs">Proveedor</Label><Input className="h-9 rounded-xl text-sm" value={newPartForm.finalSupplier} onChange={(e) => setNewPartForm(f => ({...f, finalSupplier: e.target.value}))} placeholder="Proveedor" /></div>
              <div className="space-y-1"><Label className="text-xs">Importe</Label><Input className="h-9 rounded-xl text-sm" type="number" min="0" step="0.01" value={newPartForm.finalPrice} onChange={(e) => setNewPartForm(f => ({...f, finalPrice: e.target.value}))} /></div>
              <div className="space-y-1"><Label className="text-xs">Estado</Label><select className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={newPartForm.statusCode} onChange={(e) => setNewPartForm(f => ({...f, statusCode: e.target.value}))}><option value="">—</option>{statusCodeOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select></div>
              <div className="space-y-1"><Label className="text-xs">Compra</Label><select className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={newPartForm.purchasedByCode} onChange={(e) => setNewPartForm(f => ({...f, purchasedByCode: e.target.value}))}><option value="">—</option>{purchasedByCodeOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select></div>
              <div className="space-y-1"><Label className="text-xs">Pago</Label><select className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={newPartForm.paymentStatusCode} onChange={(e) => setNewPartForm(f => ({...f, paymentStatusCode: e.target.value}))}><option value="">—</option>{paymentStatusCodeOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select></div>
              <div className="flex items-end"><Button className="w-full" size="sm" onClick={addNewPartToDraft}><Plus className="mr-1.5 h-4 w-4" />Agregar</Button></div>
            </div>
          </div>
        ) : null}
        {displayParts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 py-6 text-center text-sm text-muted-foreground">
            {syncPartsMutation.isPending ? 'Sincronizando repuestos desde el presupuesto...' : 'Sin repuestos. Usá el botón "Sincronizar con presupuesto" para traerlos.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/60 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-3 py-3 text-left">Repuesto</th>
                  <th className="px-3 py-3 text-left">Proveedor</th>
                  <th className="px-3 py-3 text-right">Importe</th>
                  <th className="px-3 py-3 text-left">Estado</th>
                  <th className="px-3 py-3 text-left">Compra</th>
                  <th className="px-3 py-3 text-left">Pago</th>
                  <th className="px-3 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {displayParts.map((part) => (
                  <tr key={part._tempId || part.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3 font-medium max-w-[200px] truncate">{part.description || 'Sin descripción'}</td>
                    <td className="px-3 py-3">
                      {editMode ? (
                        <Input className="h-9 rounded-xl text-sm" value={part.finalSupplier || ''} onChange={(e) => updateDraftField(part._tempId || part.id, 'finalSupplier', e.target.value)} placeholder="Proveedor" />
                      ) : (
                        <span className="text-sm">{part.finalSupplier || '—'}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {editMode ? (
                        <Input type="number" min="0" step="0.01" className="h-9 rounded-xl text-sm text-right" value={part.finalPrice || part.budgetedPrice || 0} onChange={(e) => updateDraftField(part._tempId || part.id, 'finalPrice', e.target.value)} />
                      ) : (
                        <span className="text-sm">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(part.finalPrice || part.budgetedPrice || 0)}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {editMode ? (
                        <select className="h-9 w-full min-w-[110px] rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={part.statusCode || ''} onChange={(e) => updateDraftField(part._tempId || part.id, 'statusCode', e.target.value)}>
                          <option value="">—</option>
                          {statusCodeOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-xs font-medium">{statusCodeOptions.find(o => o.value === part.statusCode)?.label || part.statusCode || '—'}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {editMode ? (
                        <select className="h-9 w-full min-w-[100px] rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={part.purchasedByCode || ''} onChange={(e) => updateDraftField(part._tempId || part.id, 'purchasedByCode', e.target.value)}>
                          <option value="">—</option>
                          {purchasedByCodeOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-xs font-medium">{purchasedByCodeOptions.find(o => o.value === part.purchasedByCode)?.label || part.purchasedByCode || '—'}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {editMode ? (
                        <select className="h-9 w-full min-w-[110px] rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={part.paymentStatusCode || ''} onChange={(e) => updateDraftField(part._tempId || part.id, 'paymentStatusCode', e.target.value)}>
                          <option value="">—</option>
                          {paymentStatusCodeOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-xs font-medium">{paymentStatusCodeOptions.find(o => o.value === part.paymentStatusCode)?.label || part.paymentStatusCode || '—'}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <button type="button" className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950"
                        onClick={() => editMode ? removeFromDraft(part._tempId || part.id) : setDeletePartConfirm(part)}
                        title={editMode ? 'Quitar de la lista' : 'Eliminar repuesto'}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {deletePartConfirm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeletePartConfirm(null)}>
            <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-haze" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold">¿Eliminar repuesto?</h3>
              <p className="mt-2 text-sm text-muted-foreground">Se va a borrar <strong>{deletePartConfirm.description}</strong>. Esta acción no modifica el presupuesto.</p>
              <div className="mt-5 flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setDeletePartConfirm(null)}>Cancelar</Button><Button variant="destructive" className="flex-1" onClick={() => deletePartMutation.mutate(deletePartConfirm.id)} disabled={deletePartMutation.isPending}><Trash2 className="mr-1.5 h-4 w-4" />Eliminar</Button></div>
            </div>
          </div>
        ) : null}
      </div>
      ) : null}

      {subTab === 'turno' ? (
        <div className="rounded-3xl border border-border/70 bg-card p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CalendarPlus2 className="h-5 w-5" /></div>
            <h4 className="text-lg font-semibold">Turnos</h4>
            <p className="mt-1 text-sm text-muted-foreground">Agendá y gestioná los turnos de reparación.</p>
          </div>
        </div>
        <div className="mb-5 rounded-2xl border border-dashed border-border/60 bg-background/70 p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="space-y-1"><Label className="text-xs">Fecha</Label><Input className="h-9 rounded-xl text-sm" type="date" value={appointment.appointmentDate} onChange={(e) => setAppointment((c) => ({ ...c, appointmentDate: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs">Hora</Label><Input className="h-9 rounded-xl text-sm" type="time" value={appointment.appointmentTime} onChange={(e) => setAppointment((c) => ({ ...c, appointmentTime: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs">Días est.</Label><Input className="h-9 rounded-xl text-sm" type="number" min="0" value={appointment.estimatedDays} onChange={(e) => setAppointment((c) => ({ ...c, estimatedDays: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs">Salida est.</Label><Input className="h-9 rounded-xl text-sm bg-muted/50 cursor-default" type="date" value={appointment.estimatedExitDate || ''} readOnly /></div>
            <div className="space-y-1"><Label className="text-xs">Estado</Label><Select className="h-9 rounded-xl text-sm" value={appointment.statusCode} onChange={(e) => setAppointment((c) => ({ ...c, statusCode: e.target.value }))} options={appointmentStatusOptions.length > 0 ? appointmentStatusOptions : [{ value: 'PENDIENTE', label: 'Pendiente' }]} /></div>
            <div className="flex items-end"><Button className="w-full" size="sm" onClick={() => appointmentMutation.mutate()} disabled={appointmentMutation.isPending}><Save className="mr-1.5 h-4 w-4" />Agendar</Button></div>
          </div>
        </div>
        {appointments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 py-6 text-center text-sm text-muted-foreground">Sin turnos agendados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/60 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-3 py-3 text-left">Fecha</th>
                  <th className="px-3 py-3 text-left">Hora</th>
                  <th className="px-3 py-3 text-center">Días</th>
                  <th className="px-3 py-3 text-left">Salida est.</th>
                  <th className="px-3 py-3 text-left">Estado</th>
                  <th className="px-3 py-3 text-left">Notas</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3 font-medium">{a.appointmentDate}</td>
                    <td className="px-3 py-3 text-muted-foreground">{a.appointmentTime || '—'}</td>
                    <td className="px-3 py-3 text-center">{a.estimatedDays ?? '—'}</td>
                    <td className="px-3 py-3 text-muted-foreground">{a.estimatedExitDate || '—'}</td>
                    <td className="px-3 py-3">
                      <select
                        className="h-9 w-full min-w-[120px] rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        value={a.statusCode || ''}
                        onChange={(e) => updateAppointmentMutation.mutate({ appointmentId: a.id, payload: { appointmentDate: a.appointmentDate, appointmentTime: a.appointmentTime, estimatedDays: a.estimatedDays, estimatedExitDate: a.estimatedExitDate, statusCode: e.target.value, reentry: a.reentry || false, notes: a.notes || null, userId: Number(a.userId) } })}
                      >
                        {appointmentStatusOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{a.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      ) : null}

      {subTab === 'ingreso' ? (
        <EditorCard icon={<CarFront className="h-5 w-5" />} title="Ingreso" subtitle="Registrá el ingreso del vehículo." action={<Button variant="outline" onClick={() => intakeMutation.mutate()} disabled={intakeMutation.isPending || !latestAppointment?.id}><Save className="mr-2 h-4 w-4" />Guardar ingreso</Button>}>
        <Field label="Fecha y hora"><Input type="datetime-local" value={intake.intakeAt} onChange={(e) => setIntake((c) => ({ ...c, intakeAt: e.target.value }))} /></Field>
        <Field label="Vehicle ID"><Input type="number" value={intake.vehicleId} onChange={(e) => setIntake((c) => ({ ...c, vehicleId: e.target.value }))} /></Field>
        <Field label="Kilometraje"><Input type="number" min="0" value={intake.mileage} onChange={(e) => setIntake((c) => ({ ...c, mileage: e.target.value }))} /></Field>
        <Field label="Salida estimada"><Input type="date" value={intake.estimatedExitDate || ''} readOnly className="bg-muted/50 cursor-default" /></Field>
        <Field label="Observaciones"><Select value={intake.hasObservations} onChange={(e) => setIntake((c) => ({ ...c, hasObservations: e.target.value }))} options={[{ value: 'NO', label: 'No' }, { value: 'SI', label: 'Sí' }]} /></Field>
        {intake.hasObservations === 'SI' ? <Field label="Detalle"><Textarea rows={3} value={intake.observationDetail} onChange={(e) => setIntake((c) => ({ ...c, observationDetail: e.target.value }))} />{intake.observationCreatedAt ? <p className="mt-1 text-xs text-muted-foreground">Registrado: {new Date(intake.observationCreatedAt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p> : null}</Field> : null}
      </EditorCard>
      ) : null}

      {subTab === 'egreso' ? (
        <EditorCard icon={<Flag className="h-5 w-5" />} title="Egreso" subtitle="Registrá la salida del vehículo." action={<Button variant="secondary" onClick={() => outcomeMutation.mutate()} disabled={outcomeMutation.isPending || !latestIntake?.id}><Save className="mr-2 h-4 w-4" />Guardar egreso</Button>}>
        <Field label="Fecha y hora"><Input type="datetime-local" value={outcome.outcomeAt} onChange={(e) => setOutcome((c) => ({ ...c, outcomeAt: e.target.value }))} /></Field>
        <Field label="Definitivo"><Select value={outcome.definitive} onChange={(e) => setOutcome((c) => ({ ...c, definitive: e.target.value }))} options={[{ value: 'NO', label: 'No' }, { value: 'SI', label: 'Sí' }]} /></Field>
        <Field label="Debe reingresar"><Select value={outcome.shouldReenter} onChange={(e) => setOutcome((c) => ({ ...c, shouldReenter: e.target.value }))} options={[{ value: 'NO', label: 'No' }, { value: 'SI', label: 'Sí' }]} /></Field>
        {outcome.shouldReenter === 'SI' ? (<><Field label="Fecha reingreso"><Input type="date" value={outcome.expectedReentryDate} onChange={(e) => setOutcome((c) => ({ ...c, expectedReentryDate: e.target.value }))} /></Field><Field label="Días reingreso"><Input type="number" min="0" value={outcome.estimatedReentryDays} onChange={(e) => setOutcome((c) => ({ ...c, estimatedReentryDays: e.target.value }))} /></Field><Field label="Estado reingreso"><Select value={outcome.reentryStatusCode} onChange={(e) => setOutcome((c) => ({ ...c, reentryStatusCode: e.target.value }))} options={reentryStatusOptions.length > 0 ? reentryStatusOptions : [{ value: '', label: 'Sin definir' }]} /></Field></>) : null}
        <Field label="Fotos reparado"><Select value={outcome.repairedPhotosUploaded} onChange={(e) => setOutcome((c) => ({ ...c, repairedPhotosUploaded: e.target.value }))} options={[{ value: 'NO', label: 'No' }, { value: 'SI', label: 'Sí' }]} /></Field>
        <div className="space-y-1.5"><Label>Subir foto reparado</Label><input ref={repairPhotoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) repairPhotosUploadMutation.mutate(f); }} /><Button variant="outline" size="sm" onClick={() => repairPhotoRef.current?.click()}><ImagePlus className="mr-1.5 h-4 w-4" />Subir</Button></div>
        <Field label="Notas"><Textarea rows={3} value={outcome.notes} onChange={(e) => setOutcome((c) => ({ ...c, notes: e.target.value }))} /></Field>
      </EditorCard>
      ) : null}

      {subTab === 'historial' ? (
        <div className="rounded-3xl border border-border/70 bg-card p-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Clock className="h-5 w-5" /></div>
          <h4 className="text-lg font-semibold">Historial de Movimiento</h4>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">Registro cronológico de turnos, ingresos y egresos.</p>
          <div className="grid gap-4 xl:grid-cols-3">
            <HistoryCard title="Historial de turnos" items={appointmentsQuery.data ?? []} renderItem={(item) => `${item.appointmentDate} ${item.appointmentTime || ''} → ${item.estimatedExitDate || '—'} (${item.estimatedDays || 0}d) — ${item.statusCode || 'SIN ESTADO'}`} />
            <HistoryCard title="Historial de ingresos" items={intakesQuery.data ?? []} renderItem={(item) => `${item.intakeAt} → salida est. ${item.estimatedExitDate || '—'} — km ${item.mileage ?? 0}`} />
            <HistoryCard title="Historial de egresos" items={outcomesQuery.data ?? []} renderItem={(item) => `${item.outcomeAt} - ${item.definitive ? 'Definitivo' : 'Parcial'}${item.shouldReenter ? ' / Reingresa' : ''}`} />
          </div>
        </div>
      ) : null}
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
