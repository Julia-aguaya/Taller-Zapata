import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Clock, ClipboardList, Hammer, ReceiptText, Save, ShieldCheck, User, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { getCaseWorkspace } from '@/modules/cases/api/cases-api';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Dialog } from '@/shared/ui/dialog';
import { EmptyState } from '@/shared/ui/empty-state';
import { FullScreenLoader } from '@/shared/ui/full-screen-loader';
import { BudgetEditorPanel } from '@/modules/cases/components/budget-editor-panel';
import { RepairEditorPanel } from '@/modules/cases/components/repair-editor-panel';
import { PaymentsEditorPanel } from '@/modules/cases/components/payments-editor-panel';
import { requestJson } from '@/shared/api/http-client';

const iconByTab = {
  DETALLES: ShieldCheck,
  FICHA_TECNICA: ClipboardList,
  PRESUPUESTO: ReceiptText,
  GESTION_REPARACION: Wrench,
  PAGOS: ShieldCheck,
};

const labelByTab = {
  DETALLES: 'Detalles rápidos',
  FICHA_TECNICA: 'Ficha técnica',
  PRESUPUESTO: 'Presupuesto',
  GESTION_REPARACION: 'Gestión reparación',
  PAGOS: 'Pagos',
};

const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 });
const formatCurrency = (value) => (value == null ? '-' : currency.format(value));
const formatDateTime = (value) => (!value ? '-' : new Date(value).toLocaleString('es-AR'));

const updatePerson = (personId, payload) => requestJson(`/persons/${personId}`, { method: 'PUT', body: JSON.stringify(payload) });
const updateVehicle = (vehicleId, payload) => requestJson(`/vehicles/${vehicleId}`, { method: 'PUT', body: JSON.stringify(payload) });

export const CaseWorkspacePage = () => {
  const { caseId } = useParams();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('DETALLES');
  const [selectedReadinessTab, setSelectedReadinessTab] = useState(null);

  const workspaceQuery = useQuery({
    queryKey: ['cases', caseId, 'workspace'],
    queryFn: () => getCaseWorkspace(caseId),
    enabled: Boolean(caseId),
  });

  const tabs = workspaceQuery.data?.readiness?.tabs ?? [];
  const currentTab = useMemo(() => tabs.find((t) => t.tabCode === selectedTab) || tabs[0] || null, [selectedTab, tabs]);

  const tasksQuery = useQuery({
    queryKey: ['cases', caseId, 'tasks'],
    queryFn: () => fetchCaseTasks(caseId),
    enabled: Boolean(caseId),
  });
  const pendingTasks = (tasksQuery.data?.items ?? []).filter((t) => t.statusCode === 'PENDIENTE' || t.statusCode === 'EN_PROCESO').length;

  if (workspaceQuery.isLoading) return <FullScreenLoader label="Abriendo carpeta..." compact />;
  if (workspaceQuery.isError) return <EmptyState title="No pude abrir la carpeta" description={workspaceQuery.error.message} />;

  const { caseDetail, readiness, budget, financeSummary, particularFinanceSummary, latestAppointment, latestIntake, latestOutcome, widgets, workflowActions, workshopInfo } = workspaceQuery.data;

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="border-white/50 bg-card/90 p-6 shadow-haze">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Carpeta</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-semibold tracking-tight">{caseDetail.folderCode}</h2>
              <Badge variant="outline">{caseDetail.caseTypeCode}</Badge>
            </div>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              {caseDetail.principalCustomerName} - {caseDetail.principalVehiclePlate || 'Sin patente'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={caseDetail.visibleTramiteState.code === 'PAGADO' ? 'success' : 'secondary'}>
              Trámite: {caseDetail.visibleTramiteState.label}
            </Badge>
            <Badge variant={caseDetail.visibleRepairState.code === 'REPARADO' ? 'success' : 'outline'}>
              Reparación: {caseDetail.visibleRepairState.label}
            </Badge>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Creada" value={formatDateTime(caseDetail.createdAt)} />
          <MetricCard label="Creador" value={caseDetail.createdByDisplayName || '-'} />
          <MetricCard label="Cierre" value={formatDateTime(caseDetail.closedAt)} />
          <MetricCard label="Tareas pendientes" value={`${pendingTasks}`} />
          <MetricCard label="Estado" value={`${readiness.tabs.filter((t) => t.completed).length}/${readiness.tabs.length} completas`} />
        </div>
      </Card>

      {/* Procesos */}
      <Card className="border-white/50 bg-card/90 p-5 shadow-haze">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Hammer className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold tracking-tight">Procesos</h3>
            <p className="text-xs text-muted-foreground">Solapas operativas de la carpeta. El backend decide qué está bloqueado.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <DetallesTabButton selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
          {readiness.tabs.map((tab) => {
            const Icon = iconByTab[tab.tabCode] ?? ClipboardList;
            const active = selectedTab === tab.tabCode;
            const isBlocked = !tab.allowed;
            return (
              <button
                key={tab.tabCode}
                disabled={isBlocked}
                type="button"
                onClick={() => { if (!isBlocked) setSelectedTab(tab.tabCode); }}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                  isBlocked
                    ? 'cursor-not-allowed border border-destructive/30 bg-destructive/5 text-destructive/60'
                    : tab.completed
                      ? 'border border-primary bg-primary text-primary-foreground'
                      : active
                        ? 'border border-primary/40 bg-primary/10 text-primary'
                        : 'border border-transparent bg-background/70 text-foreground hover:border-border/60 hover:bg-accent/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>
                  <span className="block leading-tight">{labelByTab[tab.tabCode] || tab.tabCode}</span>
                  <span className={`text-[11px] ${tab.completed ? 'text-primary-foreground/80' : isBlocked ? 'text-destructive/70' : 'text-muted-foreground'}`}>
                    {tab.completed ? 'Completa' : isBlocked ? `${tab.blockingReasons.length} bloqueo(s)` : 'Pendiente'}
                  </span>
                </span>
                {isBlocked ? (
                  <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px]">⛔</Badge>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          {selectedTab === 'DETALLES' ? (
            <CaseDetailsPanel caseDetail={caseDetail} budget={budget} particularFinanceSummary={particularFinanceSummary} widgets={widgets} pendingTasks={pendingTasks} />
          ) : currentTab?.tabCode === 'FICHA_TECNICA' ? (
            <FichaTecnicaEditor caseId={caseId} caseDetail={caseDetail} onSaved={() => queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'workspace'] })} />
          ) : currentTab?.tabCode === 'PRESUPUESTO' ? (
            <BudgetEditorPanel caseId={caseId} budget={budget} caseDetail={caseDetail} workshopInfo={workshopInfo} onSaved={() => queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'workspace'] })} />
          ) : currentTab?.tabCode === 'GESTION_REPARACION' ? (
            <RepairEditorPanel caseId={caseId} caseDetail={caseDetail} latestAppointment={latestAppointment} latestIntake={latestIntake} latestOutcome={latestOutcome} onSaved={() => queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'workspace'] })} />
          ) : currentTab?.tabCode === 'PAGOS' ? (
            <PaymentsEditorPanel caseId={caseId} caseDetail={caseDetail} particularFinanceSummary={particularFinanceSummary} onSaved={() => queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'workspace'] })} />
          ) : null}
        </div>
      </Card>

      {/* Historial y más */}
      <CaseHistorySection caseId={caseId} />

      {/* Modal de bloqueos */}
      <Dialog
        open={Boolean(selectedReadinessTab)}
        onClose={() => setSelectedReadinessTab(null)}
        title={selectedReadinessTab ? `Detalle de ${labelByTab[selectedReadinessTab.tabCode] || selectedReadinessTab.tabCode}` : ''}
        description="Los bloqueos y advertencias ya vienen del backend."
      >
        {selectedReadinessTab ? (
          <div className="space-y-4">
            {selectedReadinessTab.blockingReasons.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-destructive">Bloqueos</p>
                <ul className="space-y-2">
                  {selectedReadinessTab.blockingReasons.map((r) => (
                    <li key={r} className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm">{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {selectedReadinessTab.warningReasons.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-warning-foreground">Advertencias</p>
                <ul className="space-y-2">
                  {selectedReadinessTab.warningReasons.map((r) => (
                    <li key={r} className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </Dialog>
    </div>
  );
};

const fetchAuditEvents = (caseId) => requestJson(`/cases/${caseId}/audit/events?size=100`);
const fetchCaseTasks = (caseId) => requestJson(`/tasks?caseId=${caseId}&size=200`);
const addCaseNote = (caseId, text) => requestJson(`/cases/${caseId}/notes`, { method: 'POST', body: JSON.stringify({ text }) });

const CaseHistorySection = ({ caseId }) => {
  const queryClient = useQueryClient();
  const [sectionTab, setSectionTab] = useState('history');
  const [noteText, setNoteText] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);

  const auditQuery = useQuery({
    queryKey: ['cases', caseId, 'audit'],
    queryFn: () => fetchAuditEvents(caseId),
  });

  const noteMutation = useMutation({
    mutationFn: () => addCaseNote(caseId, noteText),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'audit'] });
      setNoteText('');
      setShowNoteModal(false);
      toast.success('Nota agregada al historial.');
    },
    onError: (error) => toast.error(error.message || 'No pude guardar la nota.'),
  });

  const events = auditQuery.data ?? [];

  return (
    <Card className="border-white/50 bg-card/90 p-5 shadow-haze">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-semibold tracking-tight">Registro</h3>
          <p className="text-xs text-muted-foreground">Historial de auditoría y otras vistas complementarias.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSectionTab('history')}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${
              sectionTab === 'history' ? 'border border-primary/40 bg-primary/10 text-primary' : 'border border-transparent bg-background/70 text-foreground hover:border-border/60 hover:bg-accent/50'
            }`}
          >
            <Clock className="h-4 w-4" />
            Historial
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowNoteModal(true)}>
          + Agregar nota
        </Button>
      </div>

      {sectionTab === 'history' ? (
        auditQuery.isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Cargando historial...</p>
        ) : events.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hay eventos registrados para esta carpeta.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {events.map((event) => (
              <div key={event.id} className={`rounded-2xl border px-4 py-3 text-sm ${event.actionCode === 'nota_manual' ? 'border-amber-200 bg-amber-50/60' : 'border-border/50 bg-background/60'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{event.actorDisplayName || 'Sistema'}</span>
                    {event.actionCode === 'nota_manual' ? (
                      <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">📝 Nota</Badge>
                    ) : (
                      <>
                        <Badge variant="outline" className="text-[10px]">{event.domain}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{event.actionCode}</Badge>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</span>
                </div>
                {event.changeNote ? (
                  <p className="mt-1.5 leading-relaxed text-foreground">{event.changeNote}</p>
                ) : null}
              </div>
            ))}
          </div>
        )
      ) : null}

      <Dialog open={showNoteModal} onClose={() => setShowNoteModal(false)} title="Agregar nota" description="La nota queda registrada en el historial de la carpeta.">
        <div className="space-y-4">
          <textarea
            className="flex min-h-[120px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Escribí la nota o anotación para el taller..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowNoteModal(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={() => noteMutation.mutate()} disabled={noteMutation.isPending || !noteText.trim()}>
              Guardar nota
            </Button>
          </div>
        </div>
      </Dialog>
    </Card>
  );
};

const fetchPerson = (id) => requestJson(`/persons/${id}`);
const fetchVehicle = (id) => requestJson(`/vehicles/${id}`);
const fetchVehicleCatalogs = () => requestJson('/vehicles/catalogs');

const DOC_TYPE_OPTIONS = ['DNI', 'LE', 'LC', 'CI', 'PASAPORTE', 'CUIT'];
const CIVIL_STATUS_OPTIONS = ['SOLTERO', 'CASADO', 'VIUDO', 'DIVORCIADO', 'NO_INFORMA'];

const FichaTecnicaEditor = ({ caseId, caseDetail, onSaved }) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const personQuery = useQuery({
    queryKey: ['persons', caseDetail.principalCustomerPersonId],
    queryFn: () => fetchPerson(caseDetail.principalCustomerPersonId),
    enabled: Boolean(caseDetail.principalCustomerPersonId),
  });

  const vehicleQuery = useQuery({
    queryKey: ['vehicles', caseDetail.principalVehicleId],
    queryFn: () => fetchVehicle(caseDetail.principalVehicleId),
    enabled: Boolean(caseDetail.principalVehicleId),
  });

  const vehicleCatalogsQuery = useQuery({
    queryKey: ['vehicles', 'catalogs'],
    queryFn: fetchVehicleCatalogs,
  });

  const person = personQuery.data;
  const vehicle = vehicleQuery.data;
  const vCat = vehicleCatalogsQuery.data;

  const [form, setForm] = useState({});
  useEffect(() => {
    if (person || vehicle) {
      setForm({
        nombre: person?.nombre || '',
        apellido: person?.apellido || '',
        tipoDocumentoCodigo: person?.tipoDocumentoCodigo || 'DNI',
        numeroDocumento: person?.numeroDocumento || '',
        cuitCuil: person?.cuitCuil || '',
        telefonoPrincipal: person?.telefonoPrincipal || '',
        emailPrincipal: person?.emailPrincipal || '',
        ocupacion: person?.ocupacion || '',
        fechaNacimiento: person?.fechaNacimiento || '',
        estadoCivilCodigo: person?.estadoCivilCodigo || 'NO_INFORMA',
        observacionesPersona: person?.observaciones || '',
        brandText: vehicle?.brandText || '',
        modelText: vehicle?.modelText || '',
        plate: vehicle?.plate || '',
        year: vehicle?.year ? String(vehicle.year) : '',
        vehicleTypeCode: vehicle?.vehicleTypeCode || 'SEDAN',
        usageCode: vehicle?.usageCode || 'PARTICULAR',
        transmissionCode: vehicle?.transmissionCode || 'MANUAL',
        color: vehicle?.color || '',
        paintCode: vehicle?.paintCode || '',
        chasis: vehicle?.chasis || '',
        motor: vehicle?.motor || '',
        mileage: vehicle?.mileage ? String(vehicle.mileage) : '',
        observacionesVehiculo: vehicle?.observaciones || '',
      });
    }
  }, [person, vehicle]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (caseDetail.principalCustomerPersonId) {
        await updatePerson(caseDetail.principalCustomerPersonId, {
          tipoPersona: 'fisica',
          nombre: form.nombre,
          apellido: form.apellido,
          razonSocial: null,
          tipoDocumentoCodigo: form.tipoDocumentoCodigo || 'DNI',
          numeroDocumento: form.numeroDocumento || null,
          cuitCuil: form.cuitCuil || null,
          fechaNacimiento: form.fechaNacimiento || null,
          estadoCivilCodigo: form.estadoCivilCodigo || null,
          telefonoPrincipal: form.telefonoPrincipal || null,
          emailPrincipal: form.emailPrincipal || null,
          ocupacion: form.ocupacion || null,
          observaciones: form.observacionesPersona || null,
          activo: true,
        });
      }
      if (caseDetail.principalVehicleId) {
        await updateVehicle(caseDetail.principalVehicleId, {
          brandId: vehicle?.brandId ?? null,
          modelId: vehicle?.modelId ?? null,
          brandText: form.brandText || null,
          modelText: form.modelText || null,
          plate: form.plate || null,
          year: form.year ? Number(form.year) : null,
          vehicleTypeCode: form.vehicleTypeCode || null,
          usageCode: form.usageCode || null,
          color: form.color || null,
          paintCode: form.paintCode || null,
          chasis: form.chasis || null,
          motor: form.motor || null,
          transmissionCode: form.transmissionCode || null,
          mileage: form.mileage ? Number(form.mileage) : null,
          observaciones: form.observacionesVehiculo || null,
          activo: true,
        });
      }
    },
    onSuccess: async () => {
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'workspace'] });
      await queryClient.invalidateQueries({ queryKey: ['persons', caseDetail.principalCustomerPersonId] });
      await queryClient.invalidateQueries({ queryKey: ['vehicles', caseDetail.principalVehicleId] });
      await onSaved?.();
      toast.success('Ficha técnica actualizada.');
    },
    onError: (error) => toast.error(error.message || 'No pude actualizar la ficha.'),
  });

  if (personQuery.isLoading || vehicleQuery.isLoading) {
    return <Card className="border-white/50 bg-card/90 p-10 shadow-haze"><p className="text-center text-sm text-muted-foreground">Cargando datos del cliente y vehículo...</p></Card>;
  }

  return (
    <Card className="border-white/50 bg-card/90 p-6 shadow-haze">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight">Ficha técnica</h3>
          <p className="mt-1 text-sm text-muted-foreground">{editing ? 'Modificá los datos y guardá los cambios.' : 'Datos del cliente y del vehículo.'}</p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditing(false); }}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />Guardar cambios
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)}>Editar ficha</Button>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-background/70 p-5">
          <div className="mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h4 className="font-semibold">Cliente</h4>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nombre" value={form.nombre} editing={editing} onChange={(v) => setForm((c) => ({ ...c, nombre: v }))} />
            <Field label="Apellido" value={form.apellido} editing={editing} onChange={(v) => setForm((c) => ({ ...c, apellido: v }))} />
            <SelectField label="Tipo doc." value={form.tipoDocumentoCodigo} editing={editing} onChange={(v) => setForm((c) => ({ ...c, tipoDocumentoCodigo: v }))} options={DOC_TYPE_OPTIONS} />
            <Field label="Nro. documento" value={form.numeroDocumento} editing={editing} onChange={(v) => setForm((c) => ({ ...c, numeroDocumento: v }))} />
            <SelectField label="Estado civil" value={form.estadoCivilCodigo} editing={editing} onChange={(v) => setForm((c) => ({ ...c, estadoCivilCodigo: v }))} options={CIVIL_STATUS_OPTIONS} />
            <Field label="CUIT/CUIL" value={form.cuitCuil} editing={editing} onChange={(v) => setForm((c) => ({ ...c, cuitCuil: v }))} />
            <Field label="Teléfono" value={form.telefonoPrincipal} editing={editing} onChange={(v) => setForm((c) => ({ ...c, telefonoPrincipal: v }))} />
            <Field label="Email" value={form.emailPrincipal} editing={editing} onChange={(v) => setForm((c) => ({ ...c, emailPrincipal: v }))} type="email" />
            <Field label="Ocupación" value={form.ocupacion} editing={editing} onChange={(v) => setForm((c) => ({ ...c, ocupacion: v }))} />
            <Field label="Fecha nac." value={form.fechaNacimiento} editing={editing} onChange={(v) => setForm((c) => ({ ...c, fechaNacimiento: v }))} type="date" />
          </div>
          <div className="mt-3 space-y-1.5">
            <Label>Observaciones</Label>
            {editing ? (
              <textarea className="flex min-h-[80px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={form.observacionesPersona} onChange={(e) => setForm((c) => ({ ...c, observacionesPersona: e.target.value }))} />
            ) : (
              <p className="rounded-2xl border border-border/50 bg-background/50 px-4 py-3 text-sm text-muted-foreground">{form.observacionesPersona || '-'}</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/70 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            <h4 className="font-semibold">Vehículo</h4>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Marca" value={form.brandText} editing={editing} onChange={(v) => setForm((c) => ({ ...c, brandText: v }))} />
            <Field label="Modelo" value={form.modelText} editing={editing} onChange={(v) => setForm((c) => ({ ...c, modelText: v }))} />
            <Field label="Patente" value={form.plate} editing={editing} onChange={(v) => setForm((c) => ({ ...c, plate: v.toUpperCase() }))} upper />
            <Field label="Año" value={form.year} editing={editing} onChange={(v) => setForm((c) => ({ ...c, year: v }))} type="number" />
            <SelectField label="Tipo" value={form.vehicleTypeCode} editing={editing} onChange={(v) => setForm((c) => ({ ...c, vehicleTypeCode: v }))} options={(vCat?.vehicleTypeCodes ?? []).map((o) => o.code)} />
            <SelectField label="Uso" value={form.usageCode} editing={editing} onChange={(v) => setForm((c) => ({ ...c, usageCode: v }))} options={(vCat?.usageCodes ?? []).map((o) => o.code)} />
            <SelectField label="Caja" value={form.transmissionCode} editing={editing} onChange={(v) => setForm((c) => ({ ...c, transmissionCode: v }))} options={(vCat?.transmissionCodes ?? []).map((o) => o.code)} />
            <Field label="Color" value={form.color} editing={editing} onChange={(v) => setForm((c) => ({ ...c, color: v }))} />
            <Field label="Pintura" value={form.paintCode} editing={editing} onChange={(v) => setForm((c) => ({ ...c, paintCode: v }))} />
            <Field label="Chasis" value={form.chasis} editing={editing} onChange={(v) => setForm((c) => ({ ...c, chasis: v }))} />
            <Field label="Motor" value={form.motor} editing={editing} onChange={(v) => setForm((c) => ({ ...c, motor: v }))} />
            <Field label="Kilometraje" value={form.mileage} editing={editing} onChange={(v) => setForm((c) => ({ ...c, mileage: v }))} type="number" />
          </div>
          <div className="mt-3 space-y-1.5">
            <Label>Observaciones</Label>
            {editing ? (
              <textarea className="flex min-h-[80px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={form.observacionesVehiculo} onChange={(e) => setForm((c) => ({ ...c, observacionesVehiculo: e.target.value }))} />
            ) : (
              <p className="rounded-2xl border border-border/50 bg-background/50 px-4 py-3 text-sm text-muted-foreground">{form.observacionesVehiculo || '-'}</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const Field = ({ label, value, editing, onChange, type = 'text', upper }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    {editing ? (
      <Input type={type} value={value} onChange={(e) => onChange(upper ? e.target.value.toUpperCase() : e.target.value)} />
    ) : (
      <p className="rounded-2xl border border-border/50 bg-background/50 px-4 py-3 text-sm">{value || '-'}</p>
    )}
  </div>
);

const SelectField = ({ label, value, editing, onChange, options }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    {editing ? (
      <select
        className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : (
      <p className="rounded-2xl border border-border/50 bg-background/50 px-4 py-3 text-sm">{value || '-'}</p>
    )}
  </div>
);

const MetricCard = ({ label, value }) => (
  <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="mt-3 text-base font-semibold leading-snug">{value}</p>
  </div>
);

const WidgetRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-2 last:border-b-0 last:pb-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const DetallesTabButton = ({ selectedTab, setSelectedTab }) => {
  const active = selectedTab === 'DETALLES';
  return (
    <button
      type="button"
      onClick={() => setSelectedTab('DETALLES')}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition border border-primary ${
        active ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
      }`}
    >
      <ShieldCheck className="h-4 w-4" />
      <span>
        <span className="block leading-tight">Detalles rápidos</span>
        <span className={`text-[11px] ${active ? 'text-primary-foreground/80' : 'text-primary/60'}`}>Resumen</span>
      </span>
    </button>
  );
};

const CaseDetailsPanel = ({ caseDetail, budget, particularFinanceSummary, widgets, pendingTasks }) => (
  <div className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MiniCard label="Presupuesto" value={widgets.budget.exists ? (budget?.reportStatusCode || 'CARGADO') : 'Sin presupuesto'} color={widgets.budget.exists && budget?.reportStatusCode === 'CERRADO' ? 'emerald' : 'amber'} />
      <MiniCard label="Total cotizado" value={formatCurrency(widgets.budget.totalQuoted)} color="slate" />
      <MiniCard label="Reparación" value={widgets.repair.hasDefinitiveOutcome ? 'Egreso definitivo' : widgets.repair.hasIntake ? 'En taller' : widgets.repair.hasAppointment ? 'Con turno' : 'Sin turno'} color={widgets.repair.hasDefinitiveOutcome ? 'emerald' : 'amber'} />
      <MiniCard label="Tareas pendientes" value={`${pendingTasks}`} color={pendingTasks > 0 ? 'red' : 'emerald'} />
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Finanzas</p>
        <div className="mt-3 space-y-2 text-sm">
          <WidgetRow label="Pagado por cliente" value={formatCurrency(particularFinanceSummary?.customerPaid)} />
          <WidgetRow label="Saldo pendiente" value={formatCurrency(particularFinanceSummary?.pendingBalance)} />
          <WidgetRow label="Pago total" value={particularFinanceSummary?.paidInFull ? 'Sí' : 'No'} />
          {particularFinanceSummary?.hasAdvancePayment ? <WidgetRow label="Seña" value="Registrada" /> : null}
        </div>
      </div>
      <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Identidad</p>
        <div className="mt-3 space-y-2 text-sm">
          <WidgetRow label="Creada" value={formatDateTime(caseDetail.createdAt)} />
          <WidgetRow label="Creador" value={caseDetail.createdByDisplayName || '-'} />
          <WidgetRow label="Cierre" value={formatDateTime(caseDetail.closedAt)} />
          <WidgetRow label="Referenciado" value={caseDetail.referenced ? 'Sí' : 'No'} />
        </div>
      </div>
    </div>
  </div>
);

const MiniCard = ({ label, value, color = 'slate' }) => {
  const accentColor = {
    emerald: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
    red: 'border-l-red-500',
    slate: 'border-l-slate-300',
  };
  return (
    <div className={`rounded-2xl border border-border/70 bg-card shadow-sm p-4 border-l-4 ${accentColor[color] || accentColor.slate}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
};
