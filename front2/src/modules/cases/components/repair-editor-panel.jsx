import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus2, CarFront, CheckCheck, Clock, Flag, ImagePlus, Lock, PackagePlus, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { createRepairAppointment, createVehicleIntake, createVehicleOutcome, getOperationCatalogs, listRepairAppointments, listVehicleIntakes, listVehicleOutcomes, updateRepairAppointment } from '@/modules/cases/api/operations-api';
import { createCasePart, deleteCasePart, getPartsCatalogs, listCaseParts, syncPartsFromBudget, updateCasePart } from '@/modules/cases/api/parts-api';
import { requestJson } from '@/shared/api/http-client';
import { useSession } from '@/modules/auth/providers/session-provider';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { ProviderSelector } from '@/modules/cases/components/provider-selector';

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
  statusCode: 'PENDIENTE',
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

export const invalidateCaseProjection = async (queryClient, caseId) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['cases'] }),
    queryClient.invalidateQueries({ queryKey: ['cases', String(caseId)] }),
    queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] }),
    queryClient.invalidateQueries({ queryKey: ['panel'] }),
  ]);
};

export const RepairEditorPanel = ({ caseId, caseDetail, latestAppointment, latestIntake, latestOutcome, onSaved }) => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const userId = Number(session?.user?.id || 1);

  const operationCatalogsQuery = useQuery({ queryKey: ['operation', 'catalogs'], queryFn: getOperationCatalogs });
  const appointmentsQuery = useQuery({ queryKey: ['cases', String(caseId), 'appointments'], queryFn: () => listRepairAppointments(caseId) });
  const intakesQuery = useQuery({ queryKey: ['cases', String(caseId), 'intakes'], queryFn: () => listVehicleIntakes(caseId) });
  const outcomesQuery = useQuery({ queryKey: ['cases', String(caseId), 'outcomes'], queryFn: () => listVehicleOutcomes(caseId) });

  // Check if insurance company requires repair photos
  const insuranceQuery = useQuery({ queryKey: ['cases', String(caseId), 'insurance'], queryFn: () => requestJson(`/cases/${caseId}/insurance`), enabled: caseDetail?.caseTypeCode !== 'PARTICULAR' });
  const insuranceCompanyQuery = useQuery({
    queryKey: ['insurance', 'company', insuranceQuery.data?.insuranceCompanyId],
    queryFn: () => requestJson(`/insurance/companies/${insuranceQuery.data?.insuranceCompanyId}`),
    enabled: !!insuranceQuery.data?.insuranceCompanyId,
  });
  const requiresRepairPhotos = insuranceCompanyQuery.data?.requiresRepairPhotos;

  const [appointment, setAppointment] = useState(() => createAppointmentState(latestAppointment));

  useEffect(() => { setAppointment(createAppointmentState(latestAppointment)); }, [latestAppointment]);

  useEffect(() => {
    setAppointment((c) => ({
      ...c,
      estimatedExitDate: addBusinessDays(c.appointmentDate, Number(c.estimatedDays) || 0),
    }));
  }, [appointment.appointmentDate, appointment.estimatedDays]);

  const [intakeModal, setIntakeModal] = useState(null);
  const [intakeForm, setIntakeForm] = useState({ intakeAt: '', mileage: '0', hasObservations: 'NO', observationDetail: '' });
  const [egresoModal, setEgresoModal] = useState(null);
  const [egresoForm, setEgresoForm] = useState({ outcomeAt: '', definitive: 'SI', shouldReenter: 'NO', expectedReentryDate: '', estimatedReentryDays: '0', reentryStatusCode: '', repairedPhotosUploaded: 'NO', notes: '' });

  const refreshWorkspace = async (message) => {
    await invalidateCaseProjection(queryClient, caseId);
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
    mutationFn: ({ appointmentId, intakeAt, mileage, estimatedExitDate, hasObservations, observationDetail }) => createVehicleIntake(caseId, {
      appointmentId, vehicleId: Number(caseDetail.principalVehicleId), intakeAt,
      receivedByUserId: userId, deliveredByPersonId: null, mileage: Number.parseInt(mileage || '0', 10) || 0,
      fuelCode: null, estimatedExitDate: estimatedExitDate || null,
      hasObservations: hasObservations === 'SI', observationDetail: hasObservations === 'SI' ? observationDetail || null : null,
    }),
    onSuccess: async () => {
      const appt = intakeModal;
      setIntakeModal(null);
      if (appt) {
        await updateRepairAppointment(appt.id, {
          appointmentDate: appt.appointmentDate, appointmentTime: appt.appointmentTime,
          estimatedDays: appt.estimatedDays, estimatedExitDate: appt.estimatedExitDate,
          statusCode: 'CUMPLIDO', reentry: appt.reentry || false,
          notes: appt.notes || null, userId: Number(appt.userId || userId),
        });
        await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'appointments'] });
      }
      await refreshWorkspace('Ingreso registrado. Turno actualizado a Cumplido.');
    },
    onError: (error) => toast.error(error.message || 'No pude registrar el ingreso.'),
  });

  const outcomeMutation = useMutation({
    mutationFn: ({ intakeId, outcomeAt, definitive, shouldReenter, expectedReentryDate, estimatedReentryDays, reentryStatusCode, repairedPhotosUploaded, notes }) => createVehicleOutcome(caseId, {
      intakeId, outcomeAt, deliveredByUserId: userId, receivedByPersonId: null,
      definitive: definitive === 'SI', shouldReenter: shouldReenter === 'SI',
      expectedReentryDate: shouldReenter === 'SI' ? expectedReentryDate || null : null,
      estimatedReentryDays: shouldReenter === 'SI' ? Number.parseInt(estimatedReentryDays || '0', 10) || 0 : null,
      reentryStatusCode: shouldReenter === 'SI' ? reentryStatusCode || null : null,
      repairedPhotosUploaded: repairedPhotosUploaded === 'SI', notes: notes || null,
    }),
    onSuccess: async (data) => {
      const message = data?.shouldReenter ? 'Egreso registrado. Turno de reingreso creado automáticamente.' : 'Egreso registrado.';
      setEgresoModal(null);
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

  const authorizationCodeOptions = useMemo(
    () => (partsCatalogsQuery.data?.authorizationCodes ?? []).map((item) => ({ value: item.code, label: item.name || item.code })),
    [partsCatalogsQuery.data?.authorizationCodes],
  );
  const isTodoRiesgo = caseDetail?.caseTypeCode === 'TODO_RIESGO';
  const isNoRepair = caseDetail?.visibleRepairState?.code === 'NO_DEBE_REPARARSE';
  const [noRepairDialog, setNoRepairDialog] = useState(null);
  const [noRepairReason, setNoRepairReason] = useState('');

  const noRepairMutation = useMutation({
    mutationFn: ({ revert, reason }) => requestJson(`/cases/${caseId}/todo-riesgo/no-repair${revert ? '/revert' : ''}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
    onSuccess: async (_, { revert }) => {
      setNoRepairDialog(null);
      setNoRepairReason('');
      await refreshWorkspace(revert ? 'Reparación devuelta a seguimiento automático.' : 'Marcada como no debe repararse.');
    },
    onError: (error) => toast.error(error.message || 'No pude actualizar la excepción de reparación.'),
  });

  const [editMode, setEditMode] = useState(false);
  const [draftParts, setDraftParts] = useState([]);
  const [newPartForm, setNewPartForm] = useState({ description: '', finalSupplier: '', providerId: null, finalPrice: '0', budgetedPrice: '0', statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' });
  const [saving, setSaving] = useState(false);

  const updatePartMutation = useMutation({
    mutationFn: ({ partId, payload }) => updateCasePart(caseId, partId, payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'parts'] }); await refreshWorkspace('Repuesto actualizado.'); },
    onError: (error) => toast.error(error.message || 'No pude actualizar el repuesto.'),
  });

  const updatePartAuthorization = (part, authorizationCode) => updatePartMutation.mutate({
    partId: part.id,
    payload: {
      budgetItemId: part.budgetItemId || null,
      description: part.description,
      partCode: part.partCode || null,
      finalSupplier: part.finalSupplier || null,
      providerId: part.providerId || null,
      authorizationCode: authorizationCode || null,
      statusCode: part.statusCode || null,
      purchasedByCode: part.purchasedByCode || null,
      paymentStatusCode: part.paymentStatusCode || null,
      budgetedPrice: Number(part.budgetedPrice) || 0,
      finalPrice: Number(part.finalPrice) || 0,
      receivedDate: part.receivedDate || null,
      used: Boolean(part.used),
      returned: Boolean(part.returned),
    },
  });

  const [deletePartConfirm, setDeletePartConfirm] = useState(null);
  const deletePartMutation = useMutation({
    mutationFn: (partId) => deleteCasePart(caseId, partId),
    onSuccess: async () => { await refreshWorkspace('Repuesto eliminado.'); setDeletePartConfirm(null); },
    onError: (error) => toast.error(error.message || 'No pude eliminar el repuesto.'),
  });

  const syncPartsMutation = useMutation({
    mutationFn: () => syncPartsFromBudget(caseId),
    onSuccess: async (data) => { await refreshWorkspace(`${data.length} repuesto(s) sincronizado(s) desde el presupuesto.`); },
    onError: (error) => toast.error(error.message || 'No pude sincronizar.'),
  });

  const parts = partsQuery.data ?? [];
  const appointments = appointmentsQuery.data ?? [];
  const intakes = intakesQuery.data ?? [];
  const hasIntakeFor = (appointmentId) => intakes.some((i) => i.appointmentId === appointmentId);
  const outcomes = outcomesQuery.data ?? [];
  const hasOutcomeFor = (intakeId) => outcomes.some((o) => o.intakeId === intakeId);
  const appointmentById = useMemo(() => {
    const map = {};
    appointments.forEach((a) => { map[a.id] = a; });
    return map;
  }, [appointments]);

  const enterEditMode = () => {
    setDraftParts(parts.map(p => ({ ...p })));
    setEditMode(true);
  };

  const cancelEdit = () => {
    setDraftParts([]);
    setNewPartForm({ description: '', finalSupplier: '', providerId: null, finalPrice: '0', budgetedPrice: '0', statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' });
    setEditMode(false);
  };

  const updateDraftField = (tempId, field, value) => {
    setDraftParts(prev => prev.map(p => (p._tempId || p.id) === tempId ? { ...p, [field]: value } : p));
  };

  const addNewPartToDraft = () => {
    if (!newPartForm.description.trim()) { toast.error('Falta la descripción.'); return; }
    const tempId = -Date.now();
    setDraftParts(prev => [...prev, { ...newPartForm, _tempId: tempId, id: tempId, budgetedPrice: Number(newPartForm.budgetedPrice) || 0, finalPrice: Number(newPartForm.finalPrice) || 0 }]);
    setNewPartForm({ description: '', finalSupplier: '', providerId: null, finalPrice: '0', budgetedPrice: '0', statusCode: 'PENDIENTE', purchasedByCode: 'TALLER', paymentStatusCode: 'PENDIENTE' });
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
        if ((draft.providerId || null) !== (original.providerId || null)) changes.providerId = draft.providerId || null;
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
            providerId: draft.providerId || null,
            authorizationCode: draft.authorizationCode || null,
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
            providerId: draft.providerId || null,
            authorizationCode: draft.authorizationCode || null,
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
      await refreshWorkspace('Cambios guardados.');
      setEditMode(false);
      setDraftParts([]);
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
    turno: appointments.length > 0,
    ingreso: intakes.length > 0,
    egreso: outcomes.length > 0,
    historial: false,
  }), [parts.length, appointments.length, intakes.length, outcomes.length]);

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
    onSuccess: async () => { await refreshWorkspace('Foto de reparado subida.'); if (repairPhotoRef.current) repairPhotoRef.current.value = ''; },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="mt-5 space-y-5">
      {requiresRepairPhotos ? (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400">
          <ImagePlus className="h-4 w-4 shrink-0" />
          <span><strong>{insuranceCompanyQuery.data?.name || 'La compañía'}</strong> requiere fotos del vehículo reparado como condición para pasar a pagos. Asegurate de cargarlas en Documentación antes del egreso.</span>
        </div>
      ) : null}
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
          {isTodoRiesgo ? (
            <Button variant={isNoRepair ? 'outline' : 'destructive'} size="sm" onClick={() => setNoRepairDialog(isNoRepair ? 'revert' : 'apply')}>
              {isNoRepair ? 'Volver a automático' : 'No debe repararse'}
            </Button>
          ) : null}
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
              <div className="space-y-1"><Label className="text-xs">Proveedor</Label><ProviderSelector value={newPartForm.finalSupplier} providerId={newPartForm.providerId} onChange={({ providerId, snapshot }) => setNewPartForm((current) => ({ ...current, providerId, finalSupplier: snapshot || '' }))} /></div>
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
                  <th className="px-3 py-3 text-left">Inventario</th>
                  <th className="px-3 py-3 text-left">Proveedor</th>
                  <th className="px-3 py-3 text-right">Importe</th>
                  <th className="px-3 py-3 text-left">Estado</th>
                  <th className="px-3 py-3 text-left">Autorizado</th>
                  <th className="px-3 py-3 text-left">Compra</th>
                  <th className="px-3 py-3 text-left">Pago</th>
                  {isTodoRiesgo ? <th className="px-3 py-3 text-left">Autorización</th> : null}
                  <th className="px-3 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {displayParts.map((part) => (
                  <tr key={part._tempId || part.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3 font-medium max-w-[200px] truncate">{part.description || 'Sin descripción'}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground font-mono">{part.inventoryNumber || '—'}</td>
                    <td className="px-3 py-3">
                      {editMode ? (
                        <ProviderSelector value={part.finalSupplier || ''} providerId={part.providerId} onChange={({ providerId, snapshot }) => {
                          updateDraftField(part._tempId || part.id, 'providerId', providerId);
                          updateDraftField(part._tempId || part.id, 'finalSupplier', snapshot || '');
                        }} />
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
                      <div className="flex gap-1">
                        <button type="button"
                          className={`rounded-lg px-2 py-1 text-xs font-medium transition ${part.authorizedCode === 'AUTORIZADO' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-muted/50 text-muted-foreground hover:bg-emerald-100 hover:text-emerald-700'}`}
                          onClick={() => updatePartMutation.mutate({ partId: part.id, payload: { ...part, authorizedCode: part.authorizedCode === 'AUTORIZADO' ? null : 'AUTORIZADO' } })}
                          title="Autorizar repuesto">
                          <CheckCheck className="h-3.5 w-3.5" />
                        </button>
                        <button type="button"
                          className={`rounded-lg px-2 py-1 text-xs font-medium transition ${part.authorizedCode === 'RECHAZADO' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-muted/50 text-muted-foreground hover:bg-red-100 hover:text-red-700'}`}
                          onClick={() => updatePartMutation.mutate({ partId: part.id, payload: { ...part, authorizedCode: part.authorizedCode === 'RECHAZADO' ? null : 'RECHAZADO' } })}
                          title="Rechazar repuesto">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
                    {isTodoRiesgo ? (
                      <td className="px-3 py-3">
                        <select
                          aria-label={`Autorización ${part.description || part.id}`}
                          className="h-9 w-full min-w-[130px] rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                          value={part.authorizationCode || ''}
                          disabled={editMode || updatePartMutation.isPending}
                          onChange={(event) => updatePartAuthorization(part, event.target.value)}
                        >
                          <option value="">Pendiente</option>
                          {authorizationCodeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </td>
                    ) : null}
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
        {noRepairDialog ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setNoRepairDialog(null)}>
            <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-haze" onClick={(event) => event.stopPropagation()}>
              <h3 className="text-lg font-semibold">{noRepairDialog === 'revert' ? '¿Volver a seguimiento automático?' : '¿No debe repararse?'}</h3>
              <p className="mt-2 text-sm text-muted-foreground">El motivo queda registrado en el historial de la carpeta.</p>
              <div className="mt-4"><Field label="Motivo"><Textarea value={noRepairReason} rows={3} onChange={(event) => setNoRepairReason(event.target.value)} /></Field></div>
              <div className="mt-5 flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setNoRepairDialog(null)}>Cancelar</Button><Button variant={noRepairDialog === 'revert' ? 'outline' : 'destructive'} className="flex-1" disabled={noRepairMutation.isPending} onClick={() => { if (!noRepairReason.trim()) { toast.error('El motivo es obligatorio.'); return; } noRepairMutation.mutate({ revert: noRepairDialog === 'revert', reason: noRepairReason.trim() }); }}>{noRepairDialog === 'revert' ? 'Volver a automático' : 'Confirmar'}</Button></div>
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
            <div className="space-y-1"><Label className="text-xs">Notas</Label><Input className="h-9 rounded-xl text-sm" value={appointment.notes} onChange={(e) => setAppointment((c) => ({ ...c, notes: e.target.value }))} placeholder="Opcional" /></div>
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
        <div className="rounded-3xl border border-border/70 bg-card p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CarFront className="h-5 w-5" /></div>
            <h4 className="text-lg font-semibold">Ingreso</h4>
            <p className="mt-1 text-sm text-muted-foreground">Seleccioná un turno para registrar el ingreso del vehículo.</p>
          </div>
        </div>
        {appointments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 py-6 text-center text-sm text-muted-foreground">Sin turnos agendados. Creá uno en la solapa Turno.</p>
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
                  <th className="px-3 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => {
                  const alreadyIngested = hasIntakeFor(a.id);
                  const isCanceled = a.statusCode === 'CANCELADO';
                  return (
                    <tr key={a.id} className={`border-b border-border/40 transition-colors ${isCanceled ? 'opacity-50 hover:bg-muted/20' : 'hover:bg-muted/30'}`}>
                      <td className="px-3 py-3 font-medium">{a.appointmentDate}</td>
                      <td className="px-3 py-3 text-muted-foreground">{a.appointmentTime || '—'}</td>
                      <td className="px-3 py-3 text-center">{a.estimatedDays ?? '—'}</td>
                      <td className="px-3 py-3 text-muted-foreground">{a.estimatedExitDate || '—'}</td>
                      <td className="px-3 py-3"><span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${isCanceled ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400' : 'border-border/60 bg-muted/50'}`}>{appointmentStatusOptions.find(o => o.value === a.statusCode)?.label || a.statusCode || '—'}</span></td>
                      <td className="px-3 py-3 text-right">
                        {isCanceled ? (
                          <span className="text-xs text-red-500 dark:text-red-400 font-medium">Cancelado</span>
                        ) : alreadyIngested ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Ingresado</span>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => { setIntakeModal(a); setIntakeForm({ intakeAt: new Date().toISOString().slice(0, 16), mileage: '0', hasObservations: 'NO', observationDetail: '' }); }}>Ingresar</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {intakeModal ? (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm py-10" onClick={() => setIntakeModal(null)}>
            <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-haze my-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold">Registrar ingreso</h3>
              <p className="mt-1 text-sm text-muted-foreground">Turno del {intakeModal.appointmentDate} — {intakeModal.appointmentTime || ''}</p>
              <div className="mt-5 max-h-[60vh] overflow-y-auto space-y-4 pr-1">
                <Field label="Fecha y hora"><Input type="datetime-local" value={intakeForm.intakeAt} onChange={(e) => setIntakeForm((f) => ({ ...f, intakeAt: e.target.value }))} /></Field>
                <Field label="Salida estimada"><Input type="date" value={addBusinessDays(intakeForm.intakeAt?.slice(0, 10), Number(intakeModal.estimatedDays) || 0)} readOnly className="bg-muted/50 cursor-default" /></Field>
                <Field label="Kilometraje"><Input type="number" min="0" value={intakeForm.mileage} onChange={(e) => setIntakeForm((f) => ({ ...f, mileage: e.target.value }))} /></Field>
                <Field label="Observaciones"><Select value={intakeForm.hasObservations} onChange={(e) => setIntakeForm((f) => ({ ...f, hasObservations: e.target.value }))} options={[{ value: 'NO', label: 'No' }, { value: 'SI', label: 'Sí' }]} /></Field>
                {intakeForm.hasObservations === 'SI' ? <Field label="Detalle"><Textarea rows={3} value={intakeForm.observationDetail} onChange={(e) => setIntakeForm((f) => ({ ...f, observationDetail: e.target.value }))} /></Field> : null}
              </div>
              <div className="mt-5 flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setIntakeModal(null)}>Cancelar</Button><Button className="flex-1" onClick={() => intakeMutation.mutate({ appointmentId: intakeModal.id, intakeAt: intakeForm.intakeAt, mileage: intakeForm.mileage, estimatedExitDate: addBusinessDays(intakeForm.intakeAt?.slice(0, 10), Number(intakeModal.estimatedDays) || 0), hasObservations: intakeForm.hasObservations, observationDetail: intakeForm.observationDetail })} disabled={intakeMutation.isPending}><Save className="mr-1.5 h-4 w-4" />Guardar</Button></div>
            </div>
          </div>
        ) : null}
      </div>
      ) : null}

      {subTab === 'egreso' ? (
        <div className="rounded-3xl border border-border/70 bg-card p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Flag className="h-5 w-5" /></div>
            <h4 className="text-lg font-semibold">Egreso</h4>
            <p className="mt-1 text-sm text-muted-foreground">Seleccioná un ingreso para registrar la salida del vehículo.</p>
          </div>
        </div>
        {intakes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 py-6 text-center text-sm text-muted-foreground">Sin ingresos registrados. Registrá uno en la solapa Ingreso.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/60 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-3 py-3 text-left">Fecha ingreso</th>
                  <th className="px-3 py-3 text-left">Salida est.</th>
                  <th className="px-3 py-3 text-center">Km</th>
                  <th className="px-3 py-3 text-left">Observaciones</th>
                  <th className="px-3 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {intakes.map((i) => {
                  const alreadyOutcome = hasOutcomeFor(i.id);
                  const intakeAppointment = appointmentById[i.appointmentId];
                  const isCanceled = intakeAppointment?.statusCode === 'CANCELADO';
                  return (
                    <tr key={i.id} className={`border-b border-border/40 transition-colors ${isCanceled ? 'opacity-50 hover:bg-muted/20' : 'hover:bg-muted/30'}`}>
                      <td className="px-3 py-3 font-medium">{i.intakeAt?.slice(0, 16).replace('T', ' ')}</td>
                      <td className="px-3 py-3 text-muted-foreground">{i.estimatedExitDate || '—'}</td>
                      <td className="px-3 py-3 text-center">{i.mileage ?? '—'}</td>
                      <td className="px-3 py-3">{i.hasObservations ? <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">Sí</span> : <span className="text-muted-foreground text-xs">—</span>}</td>
                      <td className="px-3 py-3 text-right">
                        {isCanceled ? (
                          <span className="text-xs text-red-500 dark:text-red-400 font-medium">Cancelado</span>
                        ) : alreadyOutcome ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Egresado</span>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => { setEgresoModal(i); setEgresoForm({ outcomeAt: new Date().toISOString().slice(0, 16), definitive: 'SI', shouldReenter: 'NO', expectedReentryDate: '', estimatedReentryDays: '0', reentryStatusCode: '', repairedPhotosUploaded: 'NO', notes: '' }); }}>Egresar</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {egresoModal ? (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm py-10" onClick={() => setEgresoModal(null)}>
            <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-haze my-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold">Registrar egreso</h3>
              <p className="mt-1 text-sm text-muted-foreground">Ingreso del {egresoModal.intakeAt?.slice(0, 16).replace('T', ' ')}</p>
              <div className="mt-5 max-h-[60vh] overflow-y-auto space-y-4 pr-1">
                <Field label="Fecha y hora"><Input type="datetime-local" value={egresoForm.outcomeAt} onChange={(e) => setEgresoForm((f) => ({ ...f, outcomeAt: e.target.value }))} /></Field>
                <Field label="Definitivo"><Select value={egresoForm.definitive} onChange={(e) => setEgresoForm((f) => ({ ...f, definitive: e.target.value }))} options={[{ value: 'NO', label: 'No' }, { value: 'SI', label: 'Sí' }]} /></Field>
                <Field label="Debe reingresar"><Select value={egresoForm.shouldReenter} onChange={(e) => setEgresoForm((f) => ({ ...f, shouldReenter: e.target.value }))} options={[{ value: 'NO', label: 'No' }, { value: 'SI', label: 'Sí' }]} /></Field>
                {egresoForm.shouldReenter === 'SI' ? (<><Field label="Fecha reingreso"><Input type="date" value={egresoForm.expectedReentryDate} onChange={(e) => setEgresoForm((f) => ({ ...f, expectedReentryDate: e.target.value }))} /></Field><Field label="Días reingreso"><Input type="number" min="0" value={egresoForm.estimatedReentryDays} onChange={(e) => setEgresoForm((f) => ({ ...f, estimatedReentryDays: e.target.value }))} /></Field><Field label="Estado reingreso"><Select value={egresoForm.reentryStatusCode} onChange={(e) => setEgresoForm((f) => ({ ...f, reentryStatusCode: e.target.value }))} options={reentryStatusOptions.length > 0 ? reentryStatusOptions : [{ value: '', label: 'Sin definir' }]} /></Field></>) : null}
                <Field label="Fotos reparado"><Select value={egresoForm.repairedPhotosUploaded} onChange={(e) => setEgresoForm((f) => ({ ...f, repairedPhotosUploaded: e.target.value }))} options={[{ value: 'NO', label: 'No' }, { value: 'SI', label: 'Sí' }]} /></Field>
                <div className="space-y-1.5"><Label>Subir foto reparado</Label><input ref={repairPhotoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) repairPhotosUploadMutation.mutate(f); }} /><Button variant="outline" size="sm" onClick={() => repairPhotoRef.current?.click()}><ImagePlus className="mr-1.5 h-4 w-4" />Subir</Button></div>
                <Field label="Notas"><Textarea rows={3} value={egresoForm.notes} onChange={(e) => setEgresoForm((f) => ({ ...f, notes: e.target.value }))} /></Field>
              </div>
              <div className="mt-5 flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setEgresoModal(null)}>Cancelar</Button><Button className="flex-1" onClick={() => outcomeMutation.mutate({ intakeId: egresoModal.id, outcomeAt: egresoForm.outcomeAt, definitive: egresoForm.definitive, shouldReenter: egresoForm.shouldReenter, expectedReentryDate: egresoForm.expectedReentryDate, estimatedReentryDays: egresoForm.estimatedReentryDays, reentryStatusCode: egresoForm.reentryStatusCode, repairedPhotosUploaded: egresoForm.repairedPhotosUploaded, notes: egresoForm.notes })} disabled={outcomeMutation.isPending}><Save className="mr-1.5 h-4 w-4" />Guardar</Button></div>
            </div>
          </div>
        ) : null}
      </div>
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
