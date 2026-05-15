import { useEffect, useState } from 'react';
import StatusBadge from '../../../components/ui/StatusBadge';
import StatusStepper from '../../../components/ui/StatusStepper';
import TabButton from '../../../components/ui/TabButton';
import StatusActionBar from '../../../components/ui/StatusActionBar';
import {
  getFolderDisplayName,
  isCleasCase,
  isFranchiseRecoveryCase,
  isInsuranceWorkflowCase,
  isThirdPartyLawyerCase,
  isThirdPartyWorkshopCase,
  isTodoRiesgoCase,
} from '../../cases/lib/caseDomainCheckers';
import { formatDate, formatDateTime } from '../../cases/lib/caseFormatters';
import { getTramiteStepperConfig, getRepairStepperConfig, bindWorkflowActions } from '../lib/gestionHelpers';
import FichaTecnicaTab from './FichaTecnicaTab';
import GestionTramiteTab from './GestionTramiteTab';
import DocumentacionTab from './DocumentacionTab';
import PresupuestoTab from './PresupuestoTab';
import GestionReparacionTab from './GestionReparacionTab';
import PagosTab from './PagosTab';
import AbogadoTab from './AbogadoTab';
import { money, numberValue } from '../lib/gestionUtils';
import { todayIso } from '../../cases/lib/caseAgendaHelpers';
import { MANUAL_VISIBLE_STATE_OPTIONS } from '../../cases/lib/backendVisibleStates';

function isAdminRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  return ['admin', 'administrador', 'administrator', 'superadmin'].includes(normalized);
}

export default function GestionView({ item, activeTab, onChangeTab, activeRepairTab, onChangeRepairTab, updateCase, flash, onSyncCase, onRunWorkflowTransition, onSetVisibleStateOverride, isSavingCase = false, hasUnsavedChanges = false, insuranceCatalogs = null, financeCatalogs = null, debugCodeIssues = [], allCases = [], currentUserRole = '', detailState = null }) {
  const [manualVisibleStateDraft, setManualVisibleStateDraft] = useState({ tramite: '', reparacion: '' });
  const [changeNoteDraft, setChangeNoteDraft] = useState('');
  const [visibleAuditCount, setVisibleAuditCount] = useState(3);

  useEffect(() => {
    setVisibleAuditCount(3);
  }, [item?.id]);

  if (!item) {
    return (
      <div className="page-stack">
        <section className="card empty-state">
          <h2>No hay carpeta seleccionada.</h2>
          <p>Elegí un caso desde Panel general o crealo en Nuevo caso.</p>
        </section>
      </div>
    );
  }

  const franchiseRecovery = isFranchiseRecoveryCase(item);
  const canManageAdministrativeStates = isAdminRole(currentUserRole);
  const auditEventsState = detailState?.item?.id === item?.id ? (detailState?.auditEventsState || { status: 'idle', items: [], total: 0, detail: '' }) : { status: 'idle', items: [], total: 0, detail: '' };
  const visibleAuditItems = Array.isArray(auditEventsState.items) ? auditEventsState.items.slice(0, visibleAuditCount) : [];
  const remainingAuditCount = Math.max((auditEventsState.total || 0) - visibleAuditItems.length, 0);
  const franchiseEnablesRepair = franchiseRecovery ? item.franchiseRecovery?.enablesRepair !== 'NO' : true;
  const supportsTramiteTab = isInsuranceWorkflowCase(item) || franchiseRecovery;
  const tabs = isThirdPartyLawyerCase(item)
    ? [
      { id: 'ficha', label: 'Ficha Tecnica' },
      { id: 'tramite', label: 'Gestión del trámite' },
      { id: 'presupuesto', label: 'Presupuesto' },
      { id: 'gestion', label: 'Gestión de reparación' },
      { id: 'pagos', label: 'Pagos' },
      { id: 'abogado', label: 'Abogado' },
    ]
    : isThirdPartyWorkshopCase(item)
    ? [
      { id: 'ficha', label: 'Ficha Tecnica' },
      { id: 'tramite', label: 'Gestión del trámite' },
      { id: 'presupuesto', label: 'Presupuesto' },
      { id: 'documentacion', label: 'Documentación' },
      { id: 'gestion', label: 'Gestión de reparación' },
      { id: 'pagos', label: 'Pagos' },
    ]
    : franchiseRecovery
    ? [
      { id: 'ficha', label: 'Ficha Tecnica' },
      { id: 'tramite', label: 'Gestión del trámite' },
      ...(franchiseEnablesRepair ? [{ id: 'presupuesto', label: 'Presupuesto' }, { id: 'gestion', label: 'Gestión de reparación' }] : []),
      { id: 'pagos', label: 'Pagos' },
    ]
    : isInsuranceWorkflowCase(item)
    ? [
      { id: 'ficha', label: 'Ficha Tecnica' },
      { id: 'tramite', label: 'Gestión del trámite' },
      { id: 'presupuesto', label: 'Presupuesto' },
      { id: 'gestion', label: 'Gestión de reparación' },
      { id: 'pagos', label: 'Pagos' },
    ]
    : [
      { id: 'ficha', label: 'Ficha Tecnica' },
      { id: 'presupuesto', label: 'Presupuesto' },
      { id: 'gestion', label: 'Gestión de reparación' },
      { id: 'pagos', label: 'Pagos' },
    ];

  const hasInteractiveInsuranceControls = isTodoRiesgoCase(item) || isCleasCase(item);
  const tramiteStepper = getTramiteStepperConfig(item);
  const repairStepper = getRepairStepperConfig(item);
  const tramiteActions = hasInteractiveInsuranceControls
    ? [
      { label: 'Sin presentar', active: item.computed.tramiteStatus === 'Sin presentar', disabled: false },
      {
        label: 'Presentado (PD) o En trámite',
        active: ['Presentado (PD)', 'En trámite'].includes(item.computed.tramiteStatus),
        disabled: !item.computed.todoRisk.canCompleteProcessingCore,
      },
      { label: 'Acordado', active: item.computed.tramiteStatus === 'Acordado', disabled: !item.todoRisk.processing.presentedDate },
      { label: 'Pasado a pagos', active: item.computed.tramiteStatus === 'Pasado a pagos', disabled: !item.computed.todoRisk.quoteAgreed },
      { label: 'Pagado', active: item.computed.tramiteStatus === 'Pagado', disabled: !item.payments.passedToPaymentsDate },
    ]
    : [];
  const repairActions = hasInteractiveInsuranceControls
    ? [
      { label: 'En trámite', active: item.computed.repairStatus === 'En trámite', disabled: false },
      {
        label: 'Faltan repuestos / Dar Turno',
        active: ['Faltan repuestos', 'Dar Turno'].includes(item.computed.repairStatus),
        disabled: !item.computed.todoRisk.quoteAgreed,
      },
      { label: 'Con Turno', active: item.computed.repairStatus === 'Con Turno', disabled: !item.computed.todoRisk.quoteAgreed },
      { label: 'Debe reingresar', active: item.computed.repairStatus === 'Debe reingresar', disabled: false },
      { label: 'Reparado', active: item.computed.repairStatus === 'Reparado', disabled: false },
      {
        label: 'No debe repararse',
        active: item.computed.repairStatus === 'No debe repararse',
        disabled: !item.todoRisk.processing.adminTurnOverride && item.computed.repairStatus !== 'No debe repararse',
      },
    ]
    : [];
  const availableWorkflowActions = item.backendWorkflow?.actions || [];
  const tramiteActionsBound = bindWorkflowActions(tramiteActions, 'tramite', availableWorkflowActions);
  const repairActionsBound = bindWorkflowActions(repairActions, 'reparacion', availableWorkflowActions);
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label || 'Ficha Tecnica';
  const lastSavedByTab = item?.meta?.lastSavedByTab || {};
  const syncErrorsByTab = item?.meta?.syncErrorsByTab || {};
  const isTabDirty = (tabId) => Boolean(item?.meta?.dirtyTabs?.[tabId]);
  const getTabSyncLabel = (tabId) => {
    if (isSavingCase && activeTab === tabId) return 'Guardando...';
    if (syncErrorsByTab[tabId]) return 'Error al guardar';
    if (isTabDirty(tabId)) return 'Pendiente';
    return lastSavedByTab[tabId] ? `Guardado ${formatDateTime(lastSavedByTab[tabId])}` : 'Sin cambios';
  };
  const getTabSyncTone = (tabId) => {
    if (isSavingCase && activeTab === tabId) return 'info';
    if (syncErrorsByTab[tabId]) return 'danger';
    if (isTabDirty(tabId)) return 'warning';
    return lastSavedByTab[tabId] ? 'success' : 'info';
  };
  const saveStatusId = `gestion-save-status-${item.id}`;
  const activeTabSyncError = syncErrorsByTab[activeTab];
  const saveBadgeTone = activeTabSyncError ? 'danger' : hasUnsavedChanges ? 'warning' : 'success';
  const saveBadgeLabel = activeTabSyncError ? 'Error al guardar' : hasUnsavedChanges ? 'Cambios sin guardar' : 'Sincronizado';
  const saveHelperText = activeTabSyncError
    ? `${activeTabLabel}: ${activeTabSyncError}`
    : hasUnsavedChanges
      ? `${activeTabLabel}: tenés cambios pendientes. Guardalos para mantener la carpeta sincronizada.`
      : `${activeTabLabel}: los datos visibles ya están sincronizados.`;
  const handleTramiteAction = async ({ label, backendAction }) => {
    const transitioned = await onRunWorkflowTransition?.({
      changeNote: changeNoteDraft,
      caseId: item.id,
      domain: 'tramite',
      label,
      backendAction,
      availableActions: item.backendWorkflow?.actions || [],
    });
    if (transitioned) {
      setChangeNoteDraft('');
      return;
    }

    const today = todayIso();

    if (label === 'Sin presentar') {
      updateCase((draft) => {
        draft.todoRisk.processing.presentedDate = '';
        draft.todoRisk.processing.derivedToInspectionDate = '';
        draft.todoRisk.processing.quoteStatus = 'Pendiente';
        draft.todoRisk.processing.quoteDate = '';
        draft.todoRisk.processing.agreedAmount = '';
        draft.payments.passedToPaymentsDate = '';
        draft.payments.paymentDate = '';
        draft.payments.depositedAmount = '';
      });
      return;
    }

    if (!item.computed.todoRisk.canCompleteProcessingCore) {
      flash('Primero cargá fecha del siniestro y definí recupero en Franquicia.');
      return;
    }

    if (label === 'Presentado (PD) o En trámite') {
      updateCase((draft) => {
        draft.todoRisk.processing.presentedDate = draft.todoRisk.processing.presentedDate || today;
      });
      return;
    }

    if (!item.todoRisk.processing.presentedDate) {
      flash('No podés avanzar sin fecha de presentación.');
      return;
    }

    if (label === 'Acordado') {
      updateCase((draft) => {
        draft.todoRisk.processing.quoteStatus = 'Acordada';
        draft.todoRisk.processing.quoteDate = draft.todoRisk.processing.quoteDate || today;
        draft.todoRisk.processing.agreedAmount = draft.todoRisk.processing.agreedAmount || String(Math.max(numberValue(draft.budget.minimumLaborClose), numberValue(item.computed.totalQuoted)));
      });
      return;
    }

    if (!item.computed.todoRisk.quoteAgreed) {
      flash('Para pasar a pagos necesitás cotización acordada con fecha y monto.');
      return;
    }

    if (label === 'Pasado a pagos') {
      updateCase((draft) => {
        draft.payments.passedToPaymentsDate = draft.payments.passedToPaymentsDate || today;
      });
      return;
    }

    updateCase((draft) => {
      draft.payments.passedToPaymentsDate = draft.payments.passedToPaymentsDate || today;
      draft.payments.paymentDate = draft.payments.paymentDate || today;
      draft.payments.depositedAmount = draft.payments.depositedAmount || String(item.computed.todoRisk.amountToInvoice || 0);
      if (draft.payments.hasRetentions === 'SI') {
        draft.payments.retentions = {
          iva: draft.payments.retentions?.iva || '0',
          gains: draft.payments.retentions?.gains || '0',
          employerContribution: draft.payments.retentions?.employerContribution || '0',
          iibb: draft.payments.retentions?.iibb || '0',
          drei: draft.payments.retentions?.drei || '0',
          other: draft.payments.retentions?.other || '0',
        };
      }
    });
  };

  const handleRepairAction = async ({ label, backendAction }) => {
    const transitioned = await onRunWorkflowTransition?.({
      changeNote: changeNoteDraft,
      caseId: item.id,
      domain: 'reparacion',
      label,
      backendAction,
      availableActions: item.backendWorkflow?.actions || [],
    });
    if (transitioned) {
      setChangeNoteDraft('');
      return;
    }

    const today = todayIso();

    if (label === 'En trámite') {
      updateCase((draft) => {
        draft.todoRisk.processing.noRepairNeeded = false;
        draft.repair.turno.date = '';
        draft.repair.egreso.date = '';
        draft.repair.egreso.definitiveExit = false;
      });
      return;
    }

    if (label === 'No debe repararse') {
      if (!item.todoRisk.processing.adminTurnOverride && item.computed.repairStatus !== 'No debe repararse') {
        flash('No debe repararse queda reservado como excepción controlada por administración.');
        return;
      }

      updateCase((draft) => {
        draft.todoRisk.processing.noRepairNeeded = true;
      });
      return;
    }

    if (label === 'Reparado') {
      updateCase((draft) => {
        draft.todoRisk.processing.noRepairNeeded = false;
        draft.repair.egreso.date = draft.repair.egreso.date || today;
        draft.repair.egreso.shouldReenter = 'NO';
        draft.repair.egreso.definitiveExit = true;
      });
      return;
    }

    if (label === 'Debe reingresar') {
      updateCase((draft) => {
        draft.todoRisk.processing.noRepairNeeded = false;
        draft.repair.egreso.date = draft.repair.egreso.date || today;
        draft.repair.egreso.shouldReenter = 'SI';
        draft.repair.egreso.definitiveExit = false;
      });
      return;
    }

    if (!item.computed.todoRisk.quoteAgreed) {
      flash('Primero necesitás cotización acordada con fecha y monto.');
      return;
    }

    if (label === 'Faltan repuestos / Dar Turno') {
      updateCase((draft) => {
        draft.todoRisk.processing.noRepairNeeded = false;
        const hasPendingAuthorizedPart = draft.repair.parts.some(
          (part) => part.source === 'budget' && part.authorized === 'SI' && part.state !== 'Recibido',
        );

        draft.repair.parts.forEach((part) => {
          if (part.source !== 'budget') return;

          if (!part.authorized) {
            part.authorized = 'SI';
          }

          if (part.authorized === 'SI') {
            part.state = hasPendingAuthorizedPart ? (part.state === 'Recibido' ? 'Pendiente' : part.state) : 'Recibido';
          }
        });

        draft.repair.turno.date = '';
        draft.repair.turno.state = 'Pendiente programar';
      });
      return;
    }

    updateCase((draft) => {
      draft.todoRisk.processing.noRepairNeeded = false;
      draft.repair.parts.forEach((part) => {
        if (part.source === 'budget' && part.authorized === 'SI') {
          part.state = 'Recibido';
        }
      });
      draft.repair.turno.date = draft.repair.turno.date || today;
      draft.repair.turno.estimatedDays = draft.repair.turno.estimatedDays || draft.budget.estimatedWorkDays || '3';
      draft.repair.turno.state = 'Confirmado';
    });
  };

  const currentVisibleTramite = item.backendVisibleStates?.tramite || null;
  const currentVisibleRepair = item.backendVisibleStates?.reparacion || null;

  const handleVisibleStateOverride = async (domain) => {
    const selectedCode = manualVisibleStateDraft[domain] || '';
    const success = await onSetVisibleStateOverride?.({
      caseId: item.id,
      changeNote: changeNoteDraft,
      domain,
      stateCode: selectedCode || null,
    });
    if (!success) return;
    setChangeNoteDraft('');
    setManualVisibleStateDraft((current) => ({ ...current, [domain]: '' }));
  };

  const handleSaveChanges = async () => {
    const success = await onSyncCase?.({ changeNote: changeNoteDraft });
    if (success) {
      setChangeNoteDraft('');
    }
  };

  return (
    <div className="page-stack">
      <section className={`hero-panel compact-hero detail-hero ${franchiseRecovery ? 'franchise-hero' : ''}`}>
        <div>
          <p className="eyebrow">Gestión</p>
          <div className="detail-heading-row">
            <h1>{item.code} - {getFolderDisplayName(item)}</h1>
            {franchiseRecovery ? <span className="tramite-identity-badge is-franchise">Trámite Franquicia</span> : null}
          </div>
          <p className="muted">{item.vehicle.brand} {item.vehicle.model} - {item.vehicle.plate} · cierre {item.computed.closeReady ? formatDate(item.computed.closeDate) : 'pendiente'}</p>
          <p className="muted">Siniestro {item.claimNumber || 'sin informar'}.</p>
        </div>

        <div className="status-toolbar status-toolbar-expanded">
          {canManageAdministrativeStates && hasInteractiveInsuranceControls ? (
            <>
              <StatusActionBar label="Trámite" actions={tramiteActionsBound} onSelect={handleTramiteAction} />
              <StatusActionBar label="Reparación" actions={repairActionsBound} onSelect={handleRepairAction} />
            </>
          ) : (
            canManageAdministrativeStates ? (
              <>
                <StatusStepper
                  activeValue={tramiteStepper.activeValue}
                  items={tramiteStepper.items}
                  label="Trámite"
                />
                <StatusStepper
                  activeValue={repairStepper.activeValue}
                  items={repairStepper.items}
                  label="Reparación"
                />
              </>
            ) : (
              <div className="status-toolbar-readonly-shell">
                <div className="status-toolbar-readonly-copy">
                  <span>Estado de tu carpeta</span>
                  <strong>Seguimiento actual</strong>
                </div>
                <div className="status-toolbar-readonly" role="list" aria-label="Estados actuales del caso">
                  <article className="status-summary-card" role="listitem">
                    <span>Trámite actual</span>
                    <strong>{item.computed.tramiteStatus || 'Sin dato'}</strong>
                  </article>
                  <article className="status-summary-card" role="listitem">
                    <span>Reparación actual</span>
                    <strong>{item.computed.repairStatus || 'Sin dato'}</strong>
                  </article>
                </div>
              </div>
            )
          )}
          {canManageAdministrativeStates ? (
            <div className="status-group muted-restricted">
              <span>Administración</span>
              <div className="status-toolbar-admin-row">
                <label className="admin-state-picker">
                  <span>Trámite visible</span>
                  <select onChange={(event) => setManualVisibleStateDraft((current) => ({ ...current, tramite: event.target.value }))} value={manualVisibleStateDraft.tramite}>
                    {MANUAL_VISIBLE_STATE_OPTIONS.tramite.map((option) => (
                      <option key={option.code || 'auto-tramite'} value={option.code}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <button className="ghost-button" onClick={() => { void handleVisibleStateOverride('tramite'); }} type="button">Aplicar</button>
                {currentVisibleTramite?.manualOverride ? <StatusBadge tone="warning">Manual: {currentVisibleTramite.label}</StatusBadge> : <StatusBadge tone="info">Automático</StatusBadge>}
              </div>
              <div className="status-toolbar-admin-row">
                <label className="admin-state-picker">
                  <span>Reparación visible</span>
                  <select onChange={(event) => setManualVisibleStateDraft((current) => ({ ...current, reparacion: event.target.value }))} value={manualVisibleStateDraft.reparacion}>
                    {MANUAL_VISIBLE_STATE_OPTIONS.reparacion.map((option) => (
                      <option key={option.code || 'auto-reparacion'} value={option.code}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <button className="ghost-button" onClick={() => { void handleVisibleStateOverride('reparacion'); }} type="button">Aplicar</button>
                {currentVisibleRepair?.manualOverride ? <StatusBadge tone="warning">Manual: {currentVisibleRepair.label}</StatusBadge> : <StatusBadge tone="info">Automático</StatusBadge>}
              </div>
              {item.computed.repairStatus === 'No debe repararse' ? <StatusBadge tone="info">No debe repararse</StatusBadge> : null}
            </div>
          ) : null}
        </div>
      </section>

      {import.meta.env.DEV && debugCodeIssues.length ? (
        <div className="inline-alert warning-banner" role="status" aria-live="polite">
          <strong>Revisión técnica:</strong> {debugCodeIssues.join(' | ')}
        </div>
      ) : null}

      <div className="tab-strip">
        {tabs.map((tab) => (
          <TabButton
            active={activeTab === tab.id}
            key={tab.id}
            onClick={() => {
              if (tab.id === 'tramite' && !supportsTramiteTab) {
                return;
              }
              if (tab.id === 'documentacion' && !isInsuranceWorkflowCase(item) && !isThirdPartyWorkshopCase(item)) {
                return;
              }
              if (tab.id === 'gestion' && !item.computed.budgetReady) {
                flash('Bloqueado: Presupuesto sigue en rojo. Cerralo, completalo y generá el presupuesto para habilitar Gestión reparación.');
                return;
              }
              onChangeTab(tab.id);
            }}
            state={item.computed.tabs[tab.id]}
          >
            {tab.label} · {getTabSyncLabel(tab.id)}
            {syncErrorsByTab[tab.id] ? <StatusBadge tone={getTabSyncTone(tab.id)}>{syncErrorsByTab[tab.id]}</StatusBadge> : null}
          </TabButton>
        ))}
      </div>

      <section className="gestion-save-bar" aria-label="Guardado de la carpeta">
        <div className="gestion-save-bar-copy">
          <p className="eyebrow">Edición activa</p>
          <strong>{activeTabLabel}</strong>
          <small id={saveStatusId} role="status" aria-live="polite">{isSavingCase ? `Guardando cambios de ${activeTabLabel}...` : saveHelperText}</small>
          <label className="field gestion-save-note-field">
            <span>Nota del cambio (opcional)</span>
            <textarea onChange={(event) => setChangeNoteDraft(event.target.value)} placeholder="Ej: actualicé estado, corregí datos del seguro, registré pago, etc." value={changeNoteDraft} />
          </label>
        </div>
        <div className="gestion-save-bar-actions">
          <StatusBadge tone={saveBadgeTone}>{isSavingCase ? 'Guardando...' : saveBadgeLabel}</StatusBadge>
          <button
            aria-describedby={saveStatusId}
            className="primary-button gestion-save-button"
            disabled={isSavingCase}
            onClick={() => { void handleSaveChanges(); }}
            type="button"
          >
            {isSavingCase ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </section>

      <div className="form-grid aside-layout aside-layout-full">
        <div>
          {activeTab === 'ficha' ? <FichaTecnicaTab item={item} updateCase={updateCase} /> : null}
          {activeTab === 'tramite' ? <GestionTramiteTab allCases={allCases} flash={flash} insuranceCatalogs={insuranceCatalogs} item={item} updateCase={updateCase} /> : null}
          {activeTab === 'documentacion' ? <DocumentacionTab flash={flash} item={item} updateCase={updateCase} /> : null}
          {activeTab === 'presupuesto' ? <PresupuestoTab flash={flash} item={item} updateCase={updateCase} /> : null}
          {activeTab === 'gestion' ? (
            <GestionReparacionTab
              activeRepairTab={activeRepairTab}
              flash={flash}
              item={item}
              onChangeRepairTab={onChangeRepairTab}
              updateCase={updateCase}
            />
          ) : null}
          {activeTab === 'pagos' ? <PagosTab financeCatalogs={financeCatalogs} flash={flash} insuranceCatalogs={insuranceCatalogs} item={item} updateCase={updateCase} /> : null}
          {activeTab === 'abogado' ? <AbogadoTab flash={flash} insuranceCatalogs={insuranceCatalogs} item={item} updateCase={updateCase} /> : null}
        </div>
      </div>

      <details className="card inner-card collapsible-card">
        <summary className="collapsible-summary">
          <div className="collapsible-summary-copy">
            <span className="collapsible-summary-kicker">Actividad</span>
            <strong>Historial</strong>
            <small>Últimos cambios de la carpeta con fecha, usuario y nota opcional.</small>
          </div>
          <div className="collapsible-summary-meta">
            <StatusBadge tone="info">{auditEventsState.total || 0} evento(s)</StatusBadge>
          </div>
        </summary>

        {auditEventsState.status === 'loading' ? (
          <div className="backend-cases-empty" role="status" aria-live="polite">
            <strong>Estamos cargando el historial.</strong>
            <p>{auditEventsState.detail || 'En unos instantes vas a ver los últimos cambios.'}</p>
          </div>
        ) : auditEventsState.status === 'success' ? (
          <div className="backend-timeline gestion-history-list" role="list" aria-label="Historial reciente de la carpeta">
            {visibleAuditItems.map((event, index) => (
              <article className="backend-timeline-item gestion-history-item" key={event.id || `${event.createdAt || 'audit'}-${index}`} role="listitem">
                <div className="backend-document-card-head">
                  <div className="stack-tight">
                    <span className="client-case-kicker">{formatBackendState(event.domain || 'Seguimiento')}</span>
                    <strong>{formatBackendState(event.actionCode || 'Cambio')}</strong>
                  </div>
                  <StatusBadge tone="info">{formatDateTime(event.createdAt)}</StatusBadge>
                </div>
                {event.changeNote ? <p className="backend-audit-note">Nota: {event.changeNote}</p> : null}
                <small>{event.actorDisplayName || 'Registro automático del sistema'}</small>
              </article>
            ))}

            {remainingAuditCount > 0 ? (
              <div className="actions-row gestion-history-actions">
                <button className="secondary-button gestion-history-load-more" onClick={() => setVisibleAuditCount((current) => current + 3)} type="button">
                  Cargar más ({remainingAuditCount} restante/s)
                </button>
              </div>
            ) : null}
          </div>
        ) : auditEventsState.status === 'error' ? (
          <div className="backend-cases-empty" role="status">
            <strong>No pudimos mostrar el historial.</strong>
            <p>{auditEventsState.detail || 'Intentá nuevamente en unos instantes.'}</p>
          </div>
        ) : (
          <div className="backend-cases-empty" role="status">
            <strong>Todavía no vemos historial para esta carpeta.</strong>
            <p>{auditEventsState.detail || 'Cuando se registren cambios, van a aparecer acá.'}</p>
          </div>
        )}
      </details>

      <aside className="side-panel">
        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Cierre del caso</h3>
            <StatusBadge tone={item.computed.closeReady ? 'success' : 'danger'}>
              {item.computed.closeReady ? 'Cerrable' : 'Pendiente'}
            </StatusBadge>
          </div>
          <div className="summary-stack">
            <div className="summary-row"><span>Salida definitiva / no reingreso</span><strong>{item.computed.repairResolved ? 'Cumplido' : 'Falta resolver'}</strong></div>
            {isThirdPartyWorkshopCase(item) ? (
              <>
                <div className="summary-row"><span>Pago compañía</span><strong>{item.computed.thirdParty.companyPaymentReady ? 'Cumplido' : 'Falta registrar'}</strong></div>
                <div className="summary-row"><span>Pago cliente extras</span><strong>{item.computed.thirdParty.hasExtraWorks ? (item.computed.thirdParty.clientExtrasReady ? 'Cumplido' : money(item.computed.thirdParty.clientExtrasBalance)) : 'No aplica'}</strong></div>
                <div className="summary-row"><span>Cierre económico</span><strong>{item.computed.todoRisk.paymentsReady ? 'Completo' : 'Pendiente'}</strong></div>
              </>
            ) : (
              <div className="summary-row"><span>Pago total</span><strong>{item.computed.balance === 0 ? 'Cumplido' : money(item.computed.balance)}</strong></div>
            )}
            <div className="summary-row"><span>Fecha de cierre</span><strong>{item.computed.closeDate ? formatDate(item.computed.closeDate) : '-'}</strong></div>
          </div>
        </article>
      </aside>
    </div>
  );
}
