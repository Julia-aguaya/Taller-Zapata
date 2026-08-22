import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Hammer, Lock, ReceiptText, Save, ShieldCheck, User, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { getCaseWorkspace, overrideVisibleState, searchReferenciadores, createReferenciador } from '@/modules/cases/api/cases-api';
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
import { GestionTramiteEditor } from '@/modules/cases/components/gestion-tramite-editor';
import { requestJson } from '@/shared/api/http-client';
import { getCleasTabs, getOperationalTabs, getTabIcon, getTabLabel } from '@/modules/cases/lib/tab-registry';

const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 });
const formatCurrency = (value) => (value == null ? '-' : currency.format(value));
const formatDate = (value) => (!value ? '-' : new Date(value).toLocaleDateString('es-AR'));
const formatDateTime = (value) => (!value ? '-' : new Date(value).toLocaleString('es-AR'));

const updatePerson = (personId, payload) => requestJson(`/persons/${personId}`, { method: 'PUT', body: JSON.stringify(payload) });
const updateVehicle = (vehicleId, payload) => requestJson(`/vehicles/${vehicleId}`, { method: 'PUT', body: JSON.stringify(payload) });
const updateCase = (caseId, payload) => requestJson(`/cases/${caseId}`, { method: 'PUT', body: JSON.stringify(payload) });

const toSentenceCase = (value) => value
  .toLowerCase()
  .split('_')
  .filter(Boolean)
  .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
  .join(' ');

const pluralize = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`;

const PARTICULAR_OVERRIDE_OPTIONS = {
  tramite: ['INGRESADO', 'PASADO_A_PAGOS', 'PAGADO', 'RECHAZADO', 'DESISTIDO'],
  reparacion: ['EN_TRAMITE', 'DAR_TURNO', 'FALTAN_REPUESTOS', 'CON_TURNO', 'DEBE_REINGRESAR', 'REPARADO', 'RECHAZADO', 'DESISTIDO'],
};

const DEFAULT_OVERRIDE_OPTIONS = {
  tramite: ['INGRESADO', 'SIN_PRESENTAR', 'PRESENTADO', 'EN_TRAMITE', 'ACORDADO', 'PASADO_A_PAGOS', 'PAGADO', 'RECHAZADO', 'DESISTIDO'],
  reparacion: ['EN_TRAMITE', 'FALTAN_REPUESTOS', 'DAR_TURNO', 'CON_TURNO', 'DEBE_REINGRESAR', 'REPARADO', 'NO_DEBE_REPARARSE', 'RECHAZADO', 'DESISTIDO'],
};

const TODO_RIESGO_OVERRIDE_OPTIONS = {
  tramite: [],
  reparacion: [],
};

const createCleasPaymentsUi = () => ({
  billing: { insuranceCompany: '', claimNumber: '', agreementDate: '', invoiceNumber: '', businessName: '', totalAmount: '', taxableNet: '', vat: '', customerSigned: 'NO', passedToPayments: 'NO', estimatedPaymentDate: '' },
  invoiceAcknowledged: false,
  paymentDraft: { paidAt: '', status: 'PENDIENTE', depositedAmount: '', hasRetentions: 'NO', vatRetention: '', earningsRetention: '', patrimonialContribution: '', iibbRetention: '', dreiRetention: '', otherRetention: '' },
  paymentDocument: { file: null, name: '' },
  franchiseClientPayment: { status: 'PENDIENTE', paidAt: '', amount: '', paymentMethod: 'TRANSFERENCIA', externalReference: '', notes: '', document: { file: null, name: '' }, registered: false },
});

const createCleasFranchiseDistribution = () => ({
  franchiseAmount: '',
  companyRequirement: 'NO',
  companyRequiredAmount: '',
  companyPaymentStatus: 'PENDIENTE',
  companyPaymentDate: '',
});

let accessorySequence = 0;
const createAccessoryId = () => `accessory-${Date.now()}-${++accessorySequence}`;
const createAccessoryWork = () => ({ id: createAccessoryId(), detail: '', amount: '', includesReplacement: 'NO', replacementPiece: '', replacementAmount: '' });
const createAccessoryPayment = () => ({ id: createAccessoryId(), kind: 'Parcial', amount: '', date: '', mode: 'Efectivo', modeDetail: '', reason: '', document: { file: null, name: '' } });
const createAccessoryUi = () => ({ enabled: 'NO', works: [], notes: '', payments: [], paymentDraft: createAccessoryPayment() });

export const formatDisplayValue = (value) => {
  if (value == null || value === '') return 'Sin informar';
  if (typeof value === 'boolean') return value ? 'Si' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 'Sin informar';
    if (trimmed === 'NO_INFORMA') return 'No informa';
    if (trimmed === 'MANUAL') return 'Manual';
    if (/^[A-Z0-9_]+$/.test(trimmed)) return toSentenceCase(trimmed);
    return trimmed;
  }
  return String(value);
};

export const countCompletedStages = (tabs = []) => getOperationalTabs(tabs).filter((tab) => tab.completed).length;

export const getFichaSummary = (readinessTab) => {
  if (!readinessTab) return { label: 'Datos cargados', variant: 'outline' };
  if (readinessTab.completed) return { label: 'Ficha completa', variant: 'success' };
  const missingCount = readinessTab.blockingReasons?.length ?? 0;
  return {
    label: missingCount > 0 ? `Faltan ${pluralize(missingCount, 'dato', 'datos')}` : 'Datos basicos cargados',
    variant: 'secondary',
  };
};

const getHelpfulBlockingMessage = (message) => {
  if (!message) return null;
  if (message === 'Debe cerrar el presupuesto antes de avanzar a gestion reparacion') {
    return 'Completa el presupuesto para habilitar Gestion de reparacion.';
  }
  return message;
};

const getTaskSnapshot = (tasks = []) => {
  const pending = tasks.filter((task) => task.statusCode === 'PENDIENTE' || task.statusCode === 'EN_PROCESO');
  const nextDueTask = pending
    .filter((task) => task.dueDate)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))[0] ?? null;

  return {
    pendingCount: pending.length,
    nextDueTask,
  };
};

export const getNextStepDescriptor = ({ tabs = [], budget, widgets, particularFinanceSummary }) => {
  const operationalTabs = getOperationalTabs(tabs);
  const fichaTab = operationalTabs.find((tab) => tab.tabCode === 'FICHA_TECNICA');
  const budgetTab = operationalTabs.find((tab) => tab.tabCode === 'PRESUPUESTO');
  const repairTab = operationalTabs.find((tab) => tab.tabCode === 'GESTION_REPARACION');
  const paymentsTab = operationalTabs.find((tab) => tab.tabCode === 'PAGOS');

  if (fichaTab && !fichaTab.completed) {
    return { label: 'Completar datos de la ficha tecnica', targetTab: 'FICHA_TECNICA', actionable: true };
  }
  if (!widgets?.budget?.exists) {
    return { label: 'Cargar presupuesto', targetTab: 'PRESUPUESTO', actionable: true };
  }
  if (budget?.reportStatusCode !== 'CERRADO') {
    return { label: 'Completar y cerrar presupuesto', targetTab: 'PRESUPUESTO', actionable: Boolean(budgetTab?.allowed) };
  }
  if (repairTab?.allowed && !repairTab.completed) {
    return { label: 'Gestionar la reparacion', targetTab: 'GESTION_REPARACION', actionable: true };
  }
  if (widgets?.budget?.exists && paymentsTab && !paymentsTab.completed) {
    if ((particularFinanceSummary?.pendingBalance ?? 0) > 0 || (particularFinanceSummary?.customerPaid ?? 0) > 0 || paymentsTab.blockingReasons?.length) {
      return { label: 'Registrar o completar el pago', targetTab: 'PAGOS', actionable: Boolean(paymentsTab.allowed) };
    }
  }
  if (operationalTabs.length > 0 && operationalTabs.every((tab) => tab.completed)) {
    return { label: 'Carpeta completada', targetTab: null, actionable: false };
  }
  return { label: 'Continuar con la carpeta', targetTab: null, actionable: false };
};

export const CaseWorkspacePage = () => {
  const { caseId } = useParams();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('DETALLES');
  const [selectedReadinessTab, setSelectedReadinessTab] = useState(null);
  const [overrideModal, setOverrideModal] = useState(null); // { domain, currentCode }
  const [overrideReason, setOverrideReason] = useState('');
  const [nroCleas, setNroCleas] = useState('');
  const [cleasAgreedAmount, setCleasAgreedAmount] = useState('');
  const [cleasPaymentsUi, setCleasPaymentsUi] = useState(createCleasPaymentsUi);
  const [cleasFranchiseDistribution, setCleasFranchiseDistribution] = useState(createCleasFranchiseDistribution);
  const [accessoryUi, setAccessoryUi] = useState(createAccessoryUi);
  const [cleasOver, setCleasOver] = useState('damage');
  const [cleasOpinion, setCleasOpinion] = useState('favorable');
  const [cleasClosedAt, setCleasClosedAt] = useState(null);
  const [showCleasClosureDialog, setShowCleasClosureDialog] = useState(false);

  useEffect(() => {
    setNroCleas('');
    setCleasAgreedAmount('');
    setCleasPaymentsUi(createCleasPaymentsUi());
    setCleasFranchiseDistribution(createCleasFranchiseDistribution());
    setAccessoryUi(createAccessoryUi());
    setCleasOver('damage');
    setCleasOpinion('favorable');
    setCleasClosedAt(null);
    setShowCleasClosureDialog(false);
  }, [caseId]);

  const refreshCaseProjection = async () => {
    await queryClient.invalidateQueries({ queryKey: ['cases'] });
    await queryClient.invalidateQueries({ queryKey: ['panel'] });
  };

  const overrideMutation = useMutation({
    mutationFn: ({ domain, stateCode }) => overrideVisibleState(caseId, domain, stateCode, overrideReason),
    onSuccess: async (_, { stateCode }) => { await refreshCaseProjection(); setOverrideModal(null); setOverrideReason(''); toast.success(stateCode ? 'Estado actualizado.' : 'Seguimiento automático restablecido.'); },
    onError: (e) => toast.error(e.message || 'No se pudo cambiar el estado.'),
  });

  const workspaceQuery = useQuery({
    queryKey: ['cases', caseId, 'workspace'],
    queryFn: () => getCaseWorkspace(caseId),
    enabled: Boolean(caseId),
  });

  const effectiveTabs = useMemo(() => {
    const readinessTabs = workspaceQuery.data?.readiness?.tabs ?? [];
    return workspaceQuery.data?.caseDetail?.caseTypeCode === 'CLEAS' ? getCleasTabs(readinessTabs) : readinessTabs;
  }, [workspaceQuery.data]);
  const currentTab = useMemo(() => effectiveTabs.find((tab) => tab.tabCode === selectedTab) || effectiveTabs[0] || null, [effectiveTabs, selectedTab]);

  const tasksQuery = useQuery({
    queryKey: ['cases', caseId, 'tasks'],
    queryFn: () => fetchCaseTasks(caseId),
    enabled: Boolean(caseId),
  });

  if (workspaceQuery.isLoading) return <FullScreenLoader label="Abriendo carpeta..." compact />;
  if (workspaceQuery.isError) return <EmptyState title="No pude abrir la carpeta" description={workspaceQuery.error.message} />;

  const { caseDetail, budget, particularFinanceSummary, latestAppointment, latestIntake, latestOutcome, widgets, workshopInfo } = workspaceQuery.data;
  const handleCleasFranchiseDistributionChange = (updater) => {
    setCleasFranchiseDistribution((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      return next.companyRequirement === 'TOTAL'
        ? { ...next, companyRequiredAmount: next.franchiseAmount }
        : next;
    });
  };
  const addAccessoryWork = () => {
    setAccessoryUi((current) => ({ ...current, enabled: 'SI', works: [...current.works, createAccessoryWork()] }));
  };
  const registerAccessoryPayment = () => {
    setAccessoryUi((current) => ({
      ...current,
      payments: [...current.payments, current.paymentDraft],
      paymentDraft: createAccessoryPayment(),
    }));
  };
  const isCleasAdverseTotal = caseDetail.caseTypeCode === 'CLEAS' && cleasOver === 'damage' && cleasOpinion === 'unfavorable';
  const isCleasClosed = isCleasAdverseTotal && Boolean(cleasClosedAt);
  const canOverrideVisibleState = caseDetail.caseTypeCode !== 'TODO_RIESGO' && !isCleasClosed;
  const isCleasClosureBlockedTab = (tabCode) => isCleasClosed && ['PRESUPUESTO', 'GESTION_REPARACION', 'PAGOS'].includes(tabCode);
  const handleCleasOverChange = (value) => {
    setCleasOver(value);
    if (value !== 'damage' || cleasOpinion !== 'unfavorable') setCleasClosedAt(null);
  };
  const handleCleasOpinionChange = (value) => {
    setCleasOpinion(value);
    if (cleasOver !== 'damage' || value !== 'unfavorable') setCleasClosedAt(null);
  };
  const overrideOptions = caseDetail.caseTypeCode === 'PARTICULAR'
    ? PARTICULAR_OVERRIDE_OPTIONS
    : caseDetail.caseTypeCode === 'TODO_RIESGO' ? TODO_RIESGO_OVERRIDE_OPTIONS : DEFAULT_OVERRIDE_OPTIONS;
  const stageTabs = getOperationalTabs(effectiveTabs);
  const completedStages = countCompletedStages(effectiveTabs);
  const taskSnapshot = getTaskSnapshot(tasksQuery.data?.items ?? []);
  const navigationHint = getHelpfulBlockingMessage(stageTabs.find((tab) => !tab.allowed && tab.blockingReasons?.length)?.blockingReasons?.[0]);
  const nextStep = getNextStepDescriptor({ tabs: effectiveTabs, budget, widgets, particularFinanceSummary });

  return (
    <div className="space-y-5">
      <Card className="border-white/50 bg-card/90 p-5 shadow-haze">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Carpeta</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-semibold tracking-tight">{caseDetail.folderCode}</h2>
               <Badge variant="outline">{caseDetail.caseTypeCode}</Badge>
               {isCleasClosed ? <Badge variant="destructive">Caso cerrado</Badge> : null}
            </div>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              {caseDetail.principalCustomerName} - {caseDetail.principalVehiclePlate || 'Sin patente'}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {`Creada el ${formatDate(caseDetail.createdAt)} · ${caseDetail.createdByDisplayName || 'Sin informar'} · ${caseDetail.closedAt ? `Cerrada el ${formatDate(caseDetail.closedAt)}` : 'Carpeta abierta'}`}
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 lg:items-end">
            <div className="flex flex-wrap gap-2">
              {/* Trámite state — clickeable para override */}
              <div className="relative">
                <button type="button" disabled={!canOverrideVisibleState} onClick={() => { if (canOverrideVisibleState) setOverrideModal({ domain: 'tramite', currentCode: caseDetail.visibleTramiteState.code }); }}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition hover:ring-2 hover:ring-primary/30 ${
                    caseDetail.visibleTramiteState.code === 'PAGADO' ? 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' :
                    caseDetail.visibleTramiteState.code === 'RECHAZADO' || caseDetail.visibleTramiteState.code === 'DESISTIDO' ? 'border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-400' :
                    'border-border bg-muted/50 text-foreground'
                  }`}>
                  Trámite: {caseDetail.visibleTramiteState.label}
                </button>
              </div>

              {/* Reparación state — clickeable para override */}
              <div className="relative">
                <button type="button" disabled={!canOverrideVisibleState} onClick={() => { if (canOverrideVisibleState) setOverrideModal({ domain: 'reparacion', currentCode: caseDetail.visibleRepairState.code }); }}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition hover:ring-2 hover:ring-primary/30 ${
                    caseDetail.visibleRepairState.code === 'REPARADO' ? 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' :
                    caseDetail.visibleRepairState.code === 'NO_DEBE_REPARARSE' ? 'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400' :
                    caseDetail.visibleRepairState.code === 'RECHAZADO' || caseDetail.visibleRepairState.code === 'DESISTIDO' ? 'border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-400' :
                    'border-border bg-muted/50 text-foreground'
                  }`}>
                  Reparación: {caseDetail.visibleRepairState.label}
                </button>
              </div>
            </div>
             <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
               {`${completedStages} de ${stageTabs.length || 4} etapas completas`}
             </Badge>
             {isCleasClosed ? <Badge variant="destructive">Caso cerrado</Badge> : null}
          </div>
        </div>
      </Card>

      <Card className="border-white/50 bg-card/90 p-5 shadow-haze">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Hammer className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold tracking-tight">Procesos</h3>
            <p className="text-xs text-muted-foreground">Resumen general y etapas operativas de la carpeta.</p>
          </div>
        </div>

        <div className="overflow-x-auto pb-1" data-testid="workspace-tabs-scroll">
          <div className="flex min-w-max gap-2" role="tablist" aria-label="Secciones de la carpeta">
            <DetallesTabButton selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
            {effectiveTabs.map((tab) => {
              const Icon = getTabIcon(tab.tabCode);
              const active = selectedTab === tab.tabCode;
               const isBlocked = !tab.allowed || isCleasClosureBlockedTab(tab.tabCode);
              return (
                <button
                  key={tab.tabCode}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-disabled={isBlocked}
                   onClick={() => {
                     if (isCleasClosureBlockedTab(tab.tabCode)) {
                       setSelectedTab(tab.tabCode);
                       return;
                     }
                     if (isBlocked) {
                      setSelectedReadinessTab(tab);
                      return;
                    }
                    setSelectedTab(tab.tabCode);
                  }}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-left text-sm font-medium transition ${
                    isBlocked
                      ? 'cursor-not-allowed border-destructive/30 bg-destructive/5 text-destructive/70'
                      : (tab.completed || active)
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border/60 bg-background/80 text-foreground hover:border-primary/30 hover:bg-accent/40'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex flex-col gap-1">
                    <span className="leading-tight">{getTabLabel(tab.tabCode)}</span>
                    <span className="flex items-center gap-1.5 text-[11px]">
                      {tab.completed ? (
                        <Badge variant="success" className="px-2 py-0.5 text-[10px]">Completa</Badge>
                      ) : isBlocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">
                          <Lock className="h-3 w-3" />Bloqueada
                        </span>
                      ) : (
                        <span className={active ? 'text-primary-foreground/80' : 'text-muted-foreground'}>Pendiente</span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {navigationHint ? (
          <div className="mt-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-primary">
            {navigationHint}
          </div>
        ) : null}

        <div className="mt-5">
          {isCleasClosureBlockedTab(selectedTab) ? (
            <EmptyState description="Esta etapa no está disponible porque el caso CLEAS fue cerrado por dictamen en contra." />
          ) : selectedTab === 'DETALLES' ? (
            <CaseDetailsPanel
              caseDetail={caseDetail}
              budget={budget}
              particularFinanceSummary={particularFinanceSummary}
              widgets={widgets}
              latestAppointment={latestAppointment}
              latestIntake={latestIntake}
              latestOutcome={latestOutcome}
              taskSnapshot={taskSnapshot}
              nextStep={nextStep}
              overrideModal={overrideModal}
              setOverrideModal={setOverrideModal}
              overrideReason={overrideReason}
              setOverrideReason={setOverrideReason}
              overrideMutation={overrideMutation}
              onOpenTab={setSelectedTab}
            />
          ) : currentTab?.tabCode === 'FICHA_TECNICA' ? (
            <FichaTecnicaEditor
              caseId={caseId}
              caseDetail={caseDetail}
              readinessTab={stageTabs.find((tab) => tab.tabCode === 'FICHA_TECNICA')}
              budget={budget}
              latestAppointment={latestAppointment}
              latestIntake={latestIntake}
              latestOutcome={latestOutcome}
              particularFinanceSummary={particularFinanceSummary}
              onSaved={() => queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'workspace'] })}
            />
          ) : currentTab?.tabCode === 'PRESUPUESTO' ? (
            <BudgetEditorPanel caseId={caseId} budget={budget} caseDetail={caseDetail} workshopInfo={workshopInfo} accessoryUi={accessoryUi} onAccessoryUiChange={setAccessoryUi} onAddAccessoryWork={addAccessoryWork} onSaved={() => queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'workspace'] })} />
          ) : currentTab?.tabCode === 'GESTION_TRAMITE' ? (
            <GestionTramiteEditor caseId={caseId} caseDetail={caseDetail} budget={budget} {...(caseDetail.caseTypeCode === 'CLEAS' ? { nroCleas, setNroCleas, cleasAgreedAmount, setCleasAgreedAmount, cleasFranchiseDistribution, onCleasFranchiseDistributionChange: handleCleasFranchiseDistributionChange, cleasOver, cleasOpinion, onCleasOverChange: handleCleasOverChange, onCleasOpinionChange: handleCleasOpinionChange, cleasClosedAt, onRequestCleasClosure: () => setShowCleasClosureDialog(true) } : {})} onSaved={() => queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'workspace'] })} />
          ) : currentTab?.tabCode === 'GESTION_REPARACION' ? (
            <RepairEditorPanel caseId={caseId} caseDetail={caseDetail} latestAppointment={latestAppointment} latestIntake={latestIntake} latestOutcome={latestOutcome} onSaved={() => queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'workspace'] })} />
          ) : currentTab?.tabCode === 'PAGOS' ? (
            <PaymentsEditorPanel caseId={caseId} caseDetail={caseDetail} budget={budget} particularFinanceSummary={particularFinanceSummary} accessoryUi={accessoryUi} onAccessoryUiChange={setAccessoryUi} onRegisterAccessoryPayment={registerAccessoryPayment} {...(caseDetail.caseTypeCode === 'CLEAS' ? { nroCleas, cleasAgreedAmount, cleasFranchiseDistribution, cleasPaymentsUi, onCleasPaymentsUiChange: setCleasPaymentsUi, cleasOver, cleasOpinion, cleasClosedAt } : {})} onSaved={() => queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'workspace'] })} />
          ) : null}
        </div>
      </Card>

      <CaseHistorySection caseId={caseId} />

      <Dialog
        open={Boolean(selectedReadinessTab)}
        onClose={() => setSelectedReadinessTab(null)}
        title={selectedReadinessTab ? `Detalle de ${getTabLabel(selectedReadinessTab.tabCode)}` : ''}
        description="Bloqueos y advertencias informados por la carpeta."
      >
        {selectedReadinessTab ? (
          <div className="space-y-4">
            {selectedReadinessTab.blockingReasons.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-destructive">Bloqueos</p>
                <ul className="space-y-2">
                  {selectedReadinessTab.blockingReasons.map((reason) => (
                    <li key={reason} className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm">{reason}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {selectedReadinessTab.warningReasons.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-warning-foreground">Advertencias</p>
                <ul className="space-y-2">
                  {selectedReadinessTab.warningReasons.map((reason) => (
                    <li key={reason} className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">{reason}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={showCleasClosureDialog}
        onClose={() => setShowCleasClosureDialog(false)}
        title="¿Cerrar caso CLEAS?"
        description="Esta acción indica que el dictamen fue en contra y que el trámite no continuará. Por ahora es solo una simulación visual y no modificará datos reales."
      >
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setShowCleasClosureDialog(false)}>Cancelar</Button>
          <Button variant="destructive" className="flex-1" onClick={() => { if (isCleasAdverseTotal) setCleasClosedAt(new Date().toISOString()); setShowCleasClosureDialog(false); }}>Confirmar cierre</Button>
        </div>
      </Dialog>

      {overrideModal && !isCleasClosed ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOverrideModal(null)}>
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-haze" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Cambiar estado de {overrideModal.domain === 'tramite' ? 'Trámite' : 'Reparación'}</h3>
            <p className="mt-1 text-sm text-muted-foreground">Actual: <strong>{overrideModal.domain === 'tramite' ? caseDetail.visibleTramiteState.label : caseDetail.visibleRepairState.label}</strong></p>
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nuevo estado</Label>
                <select className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" value={overrideModal.currentCode} onChange={(e) => setOverrideModal((m) => ({ ...m, currentCode: e.target.value }))}>
                  {overrideOptions[overrideModal.domain].map((code) => {
                    const labels = {INGRESADO:'Ingresado',SIN_PRESENTAR:'Sin presentar',PRESENTADO:'Presentado',EN_TRAMITE:'En trámite',ACORDADO:'Acordado',PASADO_A_PAGOS:'Pasado a pagos',PAGADO:'Pagado',RECHAZADO:'Rechazado',DESISTIDO:'Desistido',FALTAN_REPUESTOS:'Faltan repuestos',DAR_TURNO:'Dar turno',CON_TURNO:'Con turno',DEBE_REINGRESAR:'Debe reingresar',REPARADO:'Reparado',NO_DEBE_REPARARSE:'No debe repararse'};
                    return <option key={code} value={code}>{labels[code] || code}</option>;
                  })}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Motivo (obligatorio)</Label>
                <Input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="¿Por qué se cambia manualmente?" />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setOverrideModal(null)}>Cancelar</Button>
              {(overrideModal.domain === 'tramite' ? caseDetail.visibleTramiteState : caseDetail.visibleRepairState)?.manualOverride ? (
                <Button variant="outline" className="flex-1" onClick={() => overrideMutation.mutate({ domain: overrideModal.domain, stateCode: null })} disabled={overrideMutation.isPending}>Volver a automático</Button>
              ) : null}
              <Button className="flex-1" onClick={() => { if (!overrideReason.trim()) { toast.error('El motivo es obligatorio.'); return; } overrideMutation.mutate({ domain: overrideModal.domain, stateCode: overrideModal.currentCode }); }} disabled={overrideMutation.isPending}>Confirmar</Button>
            </div>
          </div>
        </div>
      ) : null}
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
  const [auditFilter, setAuditFilter] = useState('');

  const ACTION_LABELS = {
    nota_manual: 'Nota manual',
    crear_caso: 'Creación de carpeta',
    cerrar_caso: 'Cierre de carpeta',
    crear_presupuesto: 'Creación de presupuesto',
    cerrar_presupuesto: 'Cierre de presupuesto',
    actualizar_presupuesto: 'Actualización de presupuesto',
    crear_movimiento_financiero: 'Se realizó movimiento financiero',
    actualizar_movimiento_financiero: 'Se actualizó movimiento financiero',
    eliminar_movimiento_financiero: 'Se eliminó movimiento financiero',
    crear_recibo: 'Se emitió recibo',
    crear_repuesto_caso: 'Se agregó repuesto',
    actualizar_repuesto_caso: 'Se actualizó repuesto',
    eliminar_repuesto_caso: 'Se eliminó repuesto',
    agendar_turno: 'Se agendó turno',
    cancelar_turno: 'Se canceló turno',
    registrar_ingreso: 'Se registró ingreso del vehículo',
    registrar_egreso: 'Se registró egreso del vehículo',
    actualizar_ficha_tecnica: 'Se actualizó ficha técnica',
    override_estado_visible: 'Cambio manual de estado',
    crear_cotizacion: 'Se creó cotización',
    acordar_cotizacion: 'Se acordó cotización con la Cía.',
  };
  const DOMAIN_LABELS = {
    presupuestos: 'Presupuesto',
    finanzas: 'Finanzas',
    reparacion: 'Reparación',
    repuestos_caso: 'Repuestos',
    tramite: 'Trámite',
    ficha_tecnica: 'Ficha Técnica',
    caso: 'Caso',
  };
  const labelFor = (code) => ACTION_LABELS[code] || code?.replace(/_/g, ' ') || '';
  const domainLabel = (d) => DOMAIN_LABELS[d] || d || '';
  const filteredEvents = auditFilter ? events.filter(e => e.domain === auditFilter) : events;
  const uniqueDomains = [...new Set(events.map(e => e.domain).filter(Boolean))];

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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
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
          {uniqueDomains.length > 0 ? (
            <select className="h-9 rounded-2xl border border-border/60 bg-background/70 px-3 text-xs" value={auditFilter} onChange={(e) => setAuditFilter(e.target.value)}>
              <option value="">Todos los eventos</option>
              {uniqueDomains.map((d) => (<option key={d} value={d}>{domainLabel(d)}</option>))}
            </select>
          ) : null}
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
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {filteredEvents.map((event) => (
              <div key={event.id} className={`rounded-2xl border px-4 py-3 text-sm ${event.actionCode === 'nota_manual' ? 'border-amber-200 bg-amber-50/60' : 'border-border/50 bg-background/60'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{event.actorDisplayName || 'Sistema'}</span>
                    {event.actionCode === 'nota_manual' ? (
                      <Badge variant="outline" className="border-amber-300 text-[10px] text-amber-700">Nota</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">{domainLabel(event.domain)}</Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground">{labelFor(event.actionCode)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</span>
                </div>
                {event.changeNote ? <p className="mt-1.5 leading-relaxed text-foreground">{event.changeNote}</p> : null}
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

const FichaTecnicaEditor = ({ caseId, caseDetail, readinessTab, budget, latestAppointment, latestIntake, latestOutcome, particularFinanceSummary, onSaved }) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [fichaSubTab, setFichaSubTab] = useState('ficha');

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
  const fichaSummary = getFichaSummary(readinessTab);

  const [form, setForm] = useState({});
  const [referenciadorSearch, setReferenciadorSearch] = useState('');
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
        referenced: Boolean(caseDetail.referenced),
        referenciadorId: caseDetail.referenciadorId || null,
      });
    }
  }, [person, vehicle]);

  const referenciadoresQuery = useQuery({
    queryKey: ['referenciadores', 'ficha', referenciadorSearch],
    queryFn: () => searchReferenciadores(referenciadorSearch),
    enabled: editing && form.referenced && referenciadorSearch.length >= 2 && !form.referenciadorId,
  });

  // Load associated referenciador name in read-only mode OR when editing with referenciador selected
  const selectedReferenciadorQuery = useQuery({
    queryKey: ['referenciadores', 'selected', caseDetail.referenciadorId || form.referenciadorId],
    queryFn: () => searchReferenciadores(''),
    enabled: !!caseDetail.referenciadorId || (editing && !!form.referenciadorId),
    select: (data) => data?.find(r => r.id === (form.referenciadorId || caseDetail.referenciadorId)),
  });

  const createReferenciadorMutation = useMutation({
    mutationFn: (data) => createReferenciador(data),
    onSuccess: (newRef) => {
      setForm((current) => ({ ...current, referenciadorId: newRef.id }));
      setReferenciadorSearch('');
      queryClient.invalidateQueries({ queryKey: ['referenciadores'] });
      toast.success('Referenciador creado.');
    },
    onError: (e) => toast.error(e.message),
  });

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
      await updateCase(caseId, {
        referenced: form.referenced,
        referredByPersonId: null,
        referenciadorId: form.referenced ? form.referenciadorId : null,
        referredByText: null,
        priorityCode: caseDetail.priorityCode || null,
        generalObservations: caseDetail.generalObservations || null,
        closedAt: null,
        archivedAt: caseDetail.archivedAt || null,
      });
    },
    onSuccess: async () => {
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'workspace'] });
      await queryClient.invalidateQueries({ queryKey: ['persons', caseDetail.principalCustomerPersonId] });
      await queryClient.invalidateQueries({ queryKey: ['vehicles', caseDetail.principalVehicleId] });
      await onSaved?.();
      toast.success('Ficha tecnica actualizada.');
    },
    onError: (error) => toast.error(error.message || 'No pude actualizar la ficha.'),
  });

  if (personQuery.isLoading || vehicleQuery.isLoading) {
    return <Card className="border-white/50 bg-card/90 p-10 shadow-haze"><p className="text-center text-sm text-muted-foreground">Cargando datos del cliente y vehículo...</p></Card>;
  }

  return (
    <Card className="border-white/50 bg-card/90 p-5 shadow-haze">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-2xl font-semibold tracking-tight">Ficha tecnica</h3>
            <Badge variant={fichaSummary.variant}>{fichaSummary.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{editing ? 'Modificá los datos y guardá los cambios.' : 'Datos del cliente y del vehiculo para operar la carpeta.'}</p>
        </div>
        {fichaSubTab === 'ficha' ? (editing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />Guardar cambios
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)}>Editar ficha</Button>
        )) : null}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {[['ficha','Ficha']].map(([k,l]) => (
          <button key={k} type="button" onClick={() => setFichaSubTab(k)}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition border ${fichaSubTab===k?'border-primary/40 bg-primary/10 text-primary':'border-transparent bg-background/70 text-foreground hover:border-border/60 hover:bg-accent/50'}`}>{l}</button>
        ))}
      </div>

      {fichaSubTab === 'ficha' ? (
      <div className="space-y-5">
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Datos generales de la carpeta</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <ReadOnlyField label="Tipo de tramite" value={caseDetail.caseTypeCode || '—'} />
            {editing ? (
              <SelectField label="Referenciado" value={form.referenced ? 'SI' : 'NO'} editing onChange={(value) => setForm((current) => ({ ...current, referenced: value === 'SI', referenciadorId: value === 'SI' ? current.referenciadorId : null }))} options={['NO', 'SI']} />
            ) : (
              <ReadOnlyField label="Referenciado" value={caseDetail.referenced ? 'SI' : 'NO'} />
            )}
            {!editing && caseDetail.referenciadorId ? (
              <ReadOnlyField label="Referenciador" value={selectedReferenciadorQuery.data?.displayName || `#${caseDetail.referenciadorId}`} />
            ) : null}
          </div>
          {editing && form.referenced ? (
            <div className="mt-3">
              <div className="space-y-1.5">
                <Label>Referenciador</Label>
                {form.referenciadorId ? (
                  <div className="flex h-12 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm dark:border-emerald-800 dark:bg-emerald-950">
                    <span className="font-medium text-emerald-800 dark:text-emerald-200">{selectedReferenciadorQuery.data?.displayName || `#${form.referenciadorId}`}</span>
                    <button type="button" className="ml-auto text-xs text-muted-foreground hover:text-destructive" onClick={() => { setForm((current) => ({ ...current, referenciadorId: null })); setReferenciadorSearch(''); }}>✕</button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input value={referenciadorSearch} onChange={(event) => setReferenciadorSearch(event.target.value)} placeholder="Buscar por nombre..." />
                    {(referenciadoresQuery.data ?? []).length > 0 ? (
                      <div className="absolute z-10 mt-1 w-full rounded-2xl border border-border bg-card p-2 shadow-haze">
                        {referenciadoresQuery.data.map((referenciador) => (
                          <button key={referenciador.id} type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => { setForm((current) => ({ ...current, referenciadorId: referenciador.id })); setReferenciadorSearch(''); }}>
                            <span className="font-medium">{referenciador.displayName}</span>
                            {referenciador.telefono ? <span className="ml-2 text-xs text-muted-foreground">{referenciador.telefono}</span> : null}
                          </button>
                        ))}
                      </div>
                    ) : referenciadorSearch.length >= 2 && !referenciadoresQuery.isFetching ? (
                      <div className="absolute z-10 mt-1 w-full rounded-2xl border border-border bg-card p-3 shadow-haze">
                        <p className="text-xs text-muted-foreground mb-2">Sin resultados para "{referenciadorSearch}"</p>
                        <Button size="sm" variant="outline" className="w-full" onClick={() => {
                          const parts = referenciadorSearch.trim().split(' ');
                          const nombre = parts[0] || referenciadorSearch;
                          const apellido = parts.slice(1).join(' ') || '';
                          createReferenciadorMutation.mutate({ nombre, apellido, telefono: '' });
                        }} disabled={createReferenciadorMutation.isPending}>
                          + Crear "{referenciadorSearch}"
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-5">
            <div className="mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <h4 className="font-semibold">Cliente</h4>
            </div>

            {editing ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Nombre" value={form.nombre} editing={editing} onChange={(value) => setForm((current) => ({ ...current, nombre: value }))} />
                  <Field label="Apellido" value={form.apellido} editing={editing} onChange={(value) => setForm((current) => ({ ...current, apellido: value }))} />
                  <SelectField label="Tipo doc." value={form.tipoDocumentoCodigo} editing={editing} onChange={(value) => setForm((current) => ({ ...current, tipoDocumentoCodigo: value }))} options={DOC_TYPE_OPTIONS} />
                  <Field label="Nro. documento" value={form.numeroDocumento} editing={editing} onChange={(value) => setForm((current) => ({ ...current, numeroDocumento: value }))} />
                  <SelectField label="Estado civil" value={form.estadoCivilCodigo} editing={editing} onChange={(value) => setForm((current) => ({ ...current, estadoCivilCodigo: value }))} options={CIVIL_STATUS_OPTIONS} />
                  <Field label="CUIT/CUIL" value={form.cuitCuil} editing={editing} onChange={(value) => setForm((current) => ({ ...current, cuitCuil: value }))} />
                  <Field label="Teléfono" value={form.telefonoPrincipal} editing={editing} onChange={(value) => setForm((current) => ({ ...current, telefonoPrincipal: value }))} />
                  <Field label="Email" value={form.emailPrincipal} editing={editing} onChange={(value) => setForm((current) => ({ ...current, emailPrincipal: value }))} type="email" />
                  <Field label="Ocupación" value={form.ocupacion} editing={editing} onChange={(value) => setForm((current) => ({ ...current, ocupacion: value }))} />
                  <Field label="Fecha nac." value={form.fechaNacimiento} editing={editing} onChange={(value) => setForm((current) => ({ ...current, fechaNacimiento: value }))} type="date" />
                </div>
                <div className="mt-3 space-y-1.5">
                  <Label>Observaciones</Label>
                  <textarea className="flex min-h-[80px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={form.observacionesPersona} onChange={(event) => setForm((current) => ({ ...current, observacionesPersona: event.target.value }))} />
                </div>
              </>
            ) : (
              <div className="grid gap-x-4 md:grid-cols-2">
                <ReadOnlyField label="Tipo de persona" value={person?.tipoPersona} />
                <ReadOnlyField label="Nombre visible" value={person?.nombreMostrar} />
                <ReadOnlyField label="Nombre" value={form.nombre} />
                <ReadOnlyField label="Apellido" value={form.apellido} />
                <ReadOnlyField label="Razón social" value={person?.razonSocial} />
                <ReadOnlyField label="Tipo doc." value={form.tipoDocumentoCodigo} />
                <ReadOnlyField label="Nro. documento" value={form.numeroDocumento} />
                <ReadOnlyField label="CUIT/CUIL" value={form.cuitCuil} />
                <ReadOnlyField label="Estado civil" value={form.estadoCivilCodigo} />
                <ReadOnlyField label="Teléfono" value={form.telefonoPrincipal} />
                <ReadOnlyField label="Email" value={form.emailPrincipal} />
                <ReadOnlyField label="Ocupación" value={form.ocupacion} />
                <ReadOnlyField label="Fecha nac." value={form.fechaNacimiento ? formatDate(form.fechaNacimiento) : null} />
                <ReadOnlyField label="Activo" value={person?.activo} />
                <ReadOnlyField label="Observaciones" value={form.observacionesPersona} />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/70 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              <h4 className="font-semibold">Vehiculo</h4>
            </div>

            {editing ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Marca" value={form.brandText} editing={editing} onChange={(value) => setForm((current) => ({ ...current, brandText: value }))} />
                  <Field label="Modelo" value={form.modelText} editing={editing} onChange={(value) => setForm((current) => ({ ...current, modelText: value }))} />
                  <Field label="Patente" value={form.plate} editing={editing} onChange={(value) => setForm((current) => ({ ...current, plate: value.toUpperCase() }))} upper />
                  <Field label="Año" value={form.year} editing={editing} onChange={(value) => setForm((current) => ({ ...current, year: value }))} type="number" />
                  <SelectField label="Tipo" value={form.vehicleTypeCode} editing={editing} onChange={(value) => setForm((current) => ({ ...current, vehicleTypeCode: value }))} options={(vCat?.vehicleTypeCodes ?? []).map((option) => option.code)} />
                  <SelectField label="Uso" value={form.usageCode} editing={editing} onChange={(value) => setForm((current) => ({ ...current, usageCode: value }))} options={(vCat?.usageCodes ?? []).map((option) => option.code)} />
                  <SelectField label="Caja" value={form.transmissionCode} editing={editing} onChange={(value) => setForm((current) => ({ ...current, transmissionCode: value }))} options={(vCat?.transmissionCodes ?? []).map((option) => option.code)} />
                  <Field label="Color" value={form.color} editing={editing} onChange={(value) => setForm((current) => ({ ...current, color: value }))} />
                  <Field label="Pintura" value={form.paintCode} editing={editing} onChange={(value) => setForm((current) => ({ ...current, paintCode: value }))} />
                  <Field label="Chasis" value={form.chasis} editing={editing} onChange={(value) => setForm((current) => ({ ...current, chasis: value }))} />
                  <Field label="Motor" value={form.motor} editing={editing} onChange={(value) => setForm((current) => ({ ...current, motor: value }))} />
                  <Field label="Kilometraje" value={form.mileage} editing={editing} onChange={(value) => setForm((current) => ({ ...current, mileage: value }))} type="number" />
                </div>
                <div className="mt-3 space-y-1.5">
                  <Label>Observaciones</Label>
                  <textarea className="flex min-h-[80px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={form.observacionesVehiculo} onChange={(event) => setForm((current) => ({ ...current, observacionesVehiculo: event.target.value }))} />
                </div>
              </>
            ) : (
              <div className="grid gap-x-4 md:grid-cols-2">
                <ReadOnlyField label="Marca" value={form.brandText} />
                <ReadOnlyField label="Modelo" value={form.modelText} />
                <ReadOnlyField label="Patente" value={form.plate} />
                <ReadOnlyField label="Año" value={form.year} />
                <ReadOnlyField label="Tipo" value={form.vehicleTypeCode} />
                <ReadOnlyField label="Uso" value={form.usageCode} />
                <ReadOnlyField label="Caja" value={form.transmissionCode} />
                <ReadOnlyField label="Color" value={form.color} />
                <ReadOnlyField label="Pintura" value={form.paintCode} />
                <ReadOnlyField label="Chasis" value={form.chasis} />
                <ReadOnlyField label="Motor" value={form.motor} />
                <ReadOnlyField label="Kilometraje" value={form.mileage} />
                <ReadOnlyField label="Activo" value={vehicle?.activo} />
                <ReadOnlyField label="Observaciones" value={form.observacionesVehiculo} />
              </div>
            )}
          </div>
        </div>
      </div>
      ) : null}
    </Card>
  );
};

// ── Ficha Técnica: Sub-tab Reparación ──
const FichaReparacionSubTab = ({ budget, latestAppointment, latestIntake, latestOutcome }) => {
  const budgetItems = budget?.items ?? [];
  const totalMO = budgetItems.reduce((sum, i) => sum + (Number(i.laborAmount) || 0), 0);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Datos de la reparacion</p>
        <div className="mt-3 grid gap-x-4 md:grid-cols-2">
          <ReadOnlyField label="Mano de Obra" value={`$ ${totalMO.toLocaleString('es-AR')}`} />
          <ReadOnlyField label="Turno" value={latestAppointment ? `${latestAppointment.appointmentDate} ${latestAppointment.appointmentTime || ''}` : 'Pendiente'} />
          {latestAppointment?.notes ? <ReadOnlyField label="Notas del turno" value={latestAppointment.notes} /> : null}
          <ReadOnlyField label="Ingreso" value={latestIntake?.intakeAt ? latestIntake.intakeAt.slice(0, 16).replace('T', ' ') : 'Pendiente'} />
          <ReadOnlyField label="Kilometraje ingreso" value={latestIntake?.mileage ? String(latestIntake.mileage) : '—'} />
          <ReadOnlyField label="Egreso" value={latestOutcome?.outcomeAt ? latestOutcome.outcomeAt.slice(0, 16).replace('T', ' ') : 'Pendiente'} />
          <ReadOnlyField label="Definitivo" value={latestOutcome?.definitive ? 'Sí' : latestOutcome ? 'No' : '—'} />
          <ReadOnlyField label="Debe reingresar" value={latestOutcome?.shouldReenter ? 'Sí' : latestOutcome ? 'No' : '—'} />
        </div>
      </div>
    </div>
  );
};

// ── Ficha Técnica: Sub-tab Pagos ──
const FichaPagosSubTab = ({ caseDetail, particularFinanceSummary, caseId }) => {
  const caseTypeCode = caseDetail?.caseTypeCode;
  const movementsQuery = useQuery({ queryKey: ['cases', String(caseId), 'financial-movements'], queryFn: () => requestJson(`/cases/${caseId}/financial-movements`) });
  const insuranceProcessingQuery = useQuery({ queryKey: ['cases', String(caseId), 'insurance-processing'], queryFn: () => requestJson(`/cases/${caseId}/insurance-processing`), enabled: caseTypeCode === 'TODO_RIESGO' || caseTypeCode === 'GRANIZO' });
  const movements = movementsQuery.data ?? [];
  const processing = insuranceProcessingQuery.data;
  const formatCurrency = (v) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v || 0);

  if (caseTypeCode === 'TODO_RIESGO' || caseTypeCode === 'GRANIZO') {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Cotización con la Cía.</p>
          <div className="mt-3 grid gap-x-4 md:grid-cols-2">
            <ReadOnlyField label="Monto acordado" value={processing?.agreedAmount ? formatCurrency(processing.agreedAmount) : 'Pendiente'} />
            <ReadOnlyField label="Fecha cotización" value={processing?.quotationDate || 'Pendiente'} />
            <ReadOnlyField label="A facturar Cía." value={processing?.amountToBillCompany ? formatCurrency(processing.amountToBillCompany) : 'Pendiente'} />
            <ReadOnlyField label="Final a favor Taller" value={processing?.finalAmountForWorkshop ? formatCurrency(processing.finalAmountForWorkshop) : 'Pendiente'} />
          </div>
        </div>
        {movements.length > 0 ? (
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Historial de movimientos</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead><tr className="border-b border-border/50 text-muted-foreground"><th className="px-2 py-2 text-left">Fecha</th><th className="px-2 py-2 text-right">Monto</th><th className="px-2 py-2 text-left">Medio</th></tr></thead>
                <tbody>{movements.map(m => (
                  <tr key={m.id} className="border-b border-border/30"><td className="px-2 py-2">{m.movementAt?.slice(0,16).replace('T',' ')}</td><td className="px-2 py-2 text-right font-medium">{formatCurrency(m.netAmount)}</td><td className="px-2 py-2 text-muted-foreground">{m.paymentMethodCode || '—'}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // PARTICULAR (default)
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Estado de pagos</p>
        <div className="mt-3 grid gap-x-4 md:grid-cols-2">
          <ReadOnlyField label="Total cotizado" value={formatCurrency(particularFinanceSummary?.quotedTotal)} />
          <ReadOnlyField label="Pagado" value={formatCurrency(particularFinanceSummary?.customerPaid)} />
          <ReadOnlyField label="Saldo pendiente" value={formatCurrency(particularFinanceSummary?.pendingBalance)} />
          <ReadOnlyField label="Pago total" value={particularFinanceSummary?.paidInFull ? 'Sí' : 'No'} />
        </div>
      </div>
      {movements.length > 0 ? (
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Historial de movimientos</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead><tr className="border-b border-border/50 text-muted-foreground"><th className="px-2 py-2 text-left">Fecha</th><th className="px-2 py-2 text-right">Monto</th><th className="px-2 py-2 text-left">Medio</th></tr></thead>
              <tbody>{movements.map(m => (
                <tr key={m.id} className="border-b border-border/30"><td className="px-2 py-2">{m.movementAt?.slice(0,16).replace('T',' ')}</td><td className="px-2 py-2 text-right font-medium">{formatCurrency(m.netAmount)}</td><td className="px-2 py-2 text-muted-foreground">{m.paymentMethodCode || '—'}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );

  // Otros trámites (sin readiness específico)
  return (
    <div className="rounded-2xl border border-dashed border-border/70 py-8 text-center">
      <p className="text-sm text-muted-foreground">Información de pagos no disponible para este tipo de trámite.</p>
    </div>
  );
};

const Field = ({ label, value, editing, onChange, type = 'text', upper }) => (
  <div className="space-y-1.5">
    <Label htmlFor={`field-${label}`}>{label}</Label>
    {editing ? (
      <Input id={`field-${label}`} type={type} value={value} onChange={(event) => onChange(upper ? event.target.value.toUpperCase() : event.target.value)} />
    ) : (
      <p className="rounded-2xl border border-border/50 bg-background/50 px-4 py-3 text-sm">{formatDisplayValue(value)}</p>
    )}
  </div>
);

const SelectField = ({ label, value, editing, onChange, options }) => (
  <div className="space-y-1.5">
    <Label htmlFor={`field-${label}`}>{label}</Label>
    {editing ? (
      <select
        id={`field-${label}`}
        className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    ) : (
      <p className="rounded-2xl border border-border/50 bg-background/50 px-4 py-3 text-sm">{formatDisplayValue(value)}</p>
    )}
  </div>
);

const ReadOnlyField = ({ label, value }) => (
  <div className="border-b border-border/50 py-3 last:border-b-0">
    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    <p className="mt-1 text-sm leading-relaxed text-foreground">{formatDisplayValue(value)}</p>
  </div>
);

const WidgetRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-2 last:border-b-0 last:pb-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-right">{value}</span>
  </div>
);

const DetallesTabButton = ({ selectedTab, setSelectedTab }) => {
  const active = selectedTab === 'DETALLES';
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => setSelectedTab('DETALLES')}
      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition border-primary bg-primary text-primary-foreground shadow-sm ${
        !active ? 'opacity-90 hover:opacity-100' : ''
      }`}
    >
      <ShieldCheck className="h-4 w-4" />
      <span className="block leading-tight">Resumen</span>
    </button>
  );
};

const CaseDetailsPanel = ({ caseDetail, budget, particularFinanceSummary, widgets, latestAppointment, latestIntake, latestOutcome, taskSnapshot, nextStep, onOpenTab, overrideModal, setOverrideModal, overrideReason, setOverrideReason, overrideMutation }) => {
  const paymentsState = !widgets?.budget?.exists
    ? 'Pendiente de presupuesto'
    : particularFinanceSummary?.paidInFull
      ? 'Pagado'
      : (particularFinanceSummary?.customerPaid ?? 0) > 0
        ? 'Parcial'
        : 'Sin pagos';

  const repairStatus = widgets?.repair?.hasDefinitiveOutcome
    ? 'Reparacion finalizada'
    : widgets?.repair?.hasIntake
      ? 'Vehiculo ingresado'
      : widgets?.repair?.hasAppointment
        ? 'Turno programado'
        : 'Pendiente de turno';

  const appointmentLabel = latestAppointment?.appointmentDate
    ? `${formatDate(latestAppointment.appointmentDate)}${latestAppointment.appointmentTime ? ` · ${String(latestAppointment.appointmentTime).slice(0, 5)}` : ''}`
    : 'Sin turno asignado';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">Proximo paso</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{nextStep.label}</p>
          </div>
          {nextStep.targetTab === 'PRESUPUESTO' && nextStep.actionable ? (
            <Button type="button" onClick={() => onOpenTab('PRESUPUESTO')}>Ir a Presupuesto</Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <MiniCard label="Presupuesto" value={widgets?.budget?.exists ? (budget?.reportStatusCode || 'CARGADO') : 'Sin presupuesto'} color={widgets?.budget?.exists && budget?.reportStatusCode === 'CERRADO' ? 'emerald' : 'amber'}>
          <WidgetRow label="Estado" value={widgets?.budget?.exists ? (budget?.reportStatusCode || 'CARGADO') : 'Todavia no se cargo'} />
          <WidgetRow label="Total cotizado" value={widgets?.budget?.exists ? formatCurrency(widgets?.budget?.totalQuoted) : 'Todavia no se cargo'} />
        </MiniCard>

        <MiniCard label="Reparacion" value={caseDetail.visibleRepairState?.label || repairStatus} color={widgets?.repair?.hasDefinitiveOutcome ? 'emerald' : 'amber'}>
          <WidgetRow label="Estado actual" value={repairStatus} />
          <WidgetRow label="Turno" value={appointmentLabel} />
          {latestIntake?.intakeAt ? <WidgetRow label="Ingreso" value={formatDateTime(latestIntake.intakeAt)} /> : null}
          {latestOutcome?.outcomeAt ? <WidgetRow label="Ultimo egreso" value={formatDateTime(latestOutcome.outcomeAt)} /> : null}
        </MiniCard>

        <MiniCard label="Pagos" value={paymentsState} color={particularFinanceSummary?.paidInFull ? 'emerald' : widgets?.budget?.exists ? 'amber' : 'slate'}>
          <WidgetRow label="Total cotizado" value={widgets?.budget?.exists ? formatCurrency(particularFinanceSummary?.quotedTotal) : 'Pendiente de presupuesto'} />
          <WidgetRow label="Pagado por cliente" value={formatCurrency(particularFinanceSummary?.customerPaid)} />
          <WidgetRow label="Saldo pendiente" value={widgets?.budget?.exists ? formatCurrency(particularFinanceSummary?.pendingBalance) : 'Pendiente de presupuesto'} />
          <WidgetRow label="Estado" value={paymentsState} />
        </MiniCard>

        <MiniCard label="Tareas" value={taskSnapshot.pendingCount > 0 ? pluralize(taskSnapshot.pendingCount, 'pendiente', 'pendientes') : 'Sin tareas pendientes'} color={taskSnapshot.pendingCount > 0 ? 'red' : 'emerald'}>
          <WidgetRow label="Pendientes" value={String(taskSnapshot.pendingCount)} />
          <WidgetRow label="Proximo vencimiento" value={taskSnapshot.nextDueTask?.dueDate ? formatDate(taskSnapshot.nextDueTask.dueDate) : 'Sin tareas pendientes'} />
        </MiniCard>
      </div>

    </div>
  );
};

const MiniCard = ({ label, value, color = 'slate', children }) => {
  const accentColor = {
    emerald: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
    red: 'border-l-red-500',
    slate: 'border-l-slate-300',
  };

  return (
    <div className={`rounded-2xl border border-border/70 bg-card p-4 shadow-sm border-l-4 ${accentColor[color] || accentColor.slate}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
      <div className="mt-3 space-y-2 text-sm">{children}</div>
    </div>
  );
};
