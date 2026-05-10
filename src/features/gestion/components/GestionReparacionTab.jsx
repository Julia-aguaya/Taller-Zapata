import { useEffect, useState } from 'react';
import DataField from '../../../components/ui/DataField';
import SelectField from '../../../components/ui/SelectField';
import StatusBadge from '../../../components/ui/StatusBadge';
import ToggleField from '../../../components/ui/ToggleField';
import {
  isInsuranceWorkflowCase,
  isThirdPartyClaimCase,
  isThirdPartyLawyerCase,
  isThirdPartyWorkshopCase,
} from '../../cases/lib/caseDomainCheckers';
import { formatDate } from '../../cases/lib/caseFormatters';
import {
  INGRESO_TYPES,
  REPAIR_PART_BUYER_OPTIONS,
  REPAIR_PART_PAYMENT_OPTIONS,
  REPAIR_PART_STATE_OPTIONS,
  THIRD_PARTY_BILLING_OPTIONS,
  THIRD_PARTY_ORDER_STATE_OPTIONS,
  THIRD_PARTY_PARTS_PROVIDER_OPTIONS,
  THIRD_PARTY_PAYMENT_OPTIONS,
  TURNO_STATE_OPTIONS,
  YES_NO_AV_OPTIONS,
} from '../constants/gestionOptions';
import {
  buildThirdPartyBudgetParts,
  createIngresoItem,
  createRepairPart,
  createTodoRiskTask,
  getBestQuoteValue,
  getThirdPartyInventoryCode,
  syncRepairPartsWithBudget,
  syncThirdPartyQuoteRowsWithBudget,
} from '../lib/gestionShared';
import { createTodoRiskTask as createTodoRiskTaskFactory } from '../../cases/lib/caseFactories';
import { getStatusTone, todayIso } from '../lib/gestionUtils';
import { todayIso as todayIsoAgenda } from '../../cases/lib/caseAgendaHelpers';

export default function GestionReparacionTab({ item, updateCase, activeRepairTab, onChangeRepairTab, flash }) {
  const [previewMedia, setPreviewMedia] = useState(null);
  const [failedMediaIds, setFailedMediaIds] = useState([]);
  const [brokenPreviewIds, setBrokenPreviewIds] = useState([]);

  const addRepairFollowUpTask = () => {
    updateCase((draft) => {
      const targetAgenda = draft.lawyer?.agenda || draft.todoRisk?.processing?.agenda;

      if (!targetAgenda) {
        return;
      }

      targetAgenda.push(createTodoRiskTask({
        title: 'Seguimiento operativo de reparación',
        description: 'Controlar repuestos, turno o salida estimada desde la solapa de reparación.',
        scheduledAt: draft.repair.turno.date || todayIso(),
        assignee: TODO_RIESGO_ASSIGNABLE_USERS[0],
        priority: 'media',
        status: 'pendiente',
        sourceArea: 'Gestión reparación',
        sourceLabel: 'Gestión reparación',
        relatedTab: draft.lawyer?.agenda ? 'abogado' : 'tramite',
        relatedSubtab: activeRepairTab,
        linkedCaseId: draft.id,
        linkedCaseCode: draft.code,
      }));
    });
  };

  const syncBudgetParts = (resetRemoved = false) => {
    updateCase((draft) => {
      if (resetRemoved) {
        draft.repair.removedBudgetLineIds = [];
      }
      syncRepairPartsWithBudget(draft);
    });
  };

  const removeRepairPart = (partId) => {
    updateCase((draft) => {
      const target = draft.repair.parts.find((entry) => entry.id === partId);
      if (target?.backendId) {
        draft.meta = draft.meta || {};
        draft.meta.removedPartIds = [...new Set([...(draft.meta.removedPartIds || []), target.backendId])];
      }
      if (!isThirdPartyWorkshopCase(draft) && target?.source === 'budget' && target.sourceLineId) {
        draft.repair.removedBudgetLineIds = [...new Set([...(draft.repair.removedBudgetLineIds || []), target.sourceLineId])];
      }
      draft.repair.parts = draft.repair.parts.filter((entry) => entry.id !== partId);
    });
  };

  const assignTurn = () => {
    if (!item.computed.budgetReady) {
      flash('La gestión de reparación sigue bloqueada hasta que Presupuesto quede completo y generado.');
      return;
    }

    if (isInsuranceWorkflowCase(item) && !item.computed.todoRisk.quoteAgreed && !item.todoRisk.processing.adminTurnOverride) {
      flash('Bloqueado: para Todo Riesgo necesitás cotización acordada con fecha y monto. Solo administración puede forzar la excepción visual.');
      return;
    }

    if (!item.computed.turnoReady) {
      flash('No se puede agendar turno si faltan fecha, dias estimados, salida estimada y estado.');
      return;
    }

    if (isInsuranceWorkflowCase(item)) {
      const pendingParts = item.repair.parts.filter((part) => part.authorized === 'SI' && part.state !== 'Recibido');
      if (pendingParts.length) {
        const confirmed = window.confirm('Hay repuestos autorizados pendientes. ¿Querés agendar igual y registrar recordatorio en la agenda del trámite?');
        if (!confirmed) {
          return;
        }

        updateCase((draft) => {
          draft.todoRisk.processing.agenda.push(createTodoRiskTask({
            title: `Recordar seguimiento por ${pendingParts.length} repuesto(s) pendiente(s) antes del ingreso.`,
            description: 'Recordatorio automático disparado al agendar turno con repuestos autorizados todavía pendientes.',
            scheduledAt: draft.repair.turno.date || '',
            assignee: TODO_RIESGO_ASSIGNABLE_USERS[0],
            priority: 'alta',
            status: 'pendiente',
            resolved: false,
            sourceArea: 'Gestión reparación',
            sourceLabel: 'Gestión reparación',
            relatedTab: 'tramite',
            relatedSubtab: activeRepairTab,
            linkedCaseId: draft.id,
            linkedCaseCode: draft.code,
          }));
        });
      }
    }

    flash('Turno agendado. La salida estimada excluye fines de semana.');
  };

  const addRepairPart = () => {
    updateCase((draft) => {
      draft.repair.parts.push(createRepairPart());
    });
  };

  const addIngresoItem = () => {
    updateCase((draft) => {
      if (!draft.repair.ingreso.items) {
        draft.repair.ingreso.items = [];
      }
      draft.repair.ingreso.items.push(createIngresoItem());
    });
  };

  const markMediaThumbFailed = (mediaId) => {
    setFailedMediaIds((current) => (current.includes(mediaId) ? current : [...current, mediaId]));
  };

  const markPreviewFailed = (mediaId) => {
    setBrokenPreviewIds((current) => (current.includes(mediaId) ? current : [...current, mediaId]));
  };

  const repairTabs = [
    { id: 'repuestos', label: 'Repuestos' },
    { id: 'turno', label: 'Turno' },
    { id: 'ingreso', label: 'Ingreso' },
    { id: 'egreso', label: 'Egreso' },
  ];
  const autoPartCount = item.repair.parts.filter((part) => part.source === 'budget').length;
  const manualPartCount = item.repair.parts.filter((part) => part.source !== 'budget').length;
  const overriddenPartCount = item.repair.parts.filter((part) => part.source === 'budget' && part.amount !== part.budgetAmount).length;
  const removedBudgetLineIds = item.repair.removedBudgetLineIds || [];
  const expectedBudgetPartsSignature = item.computed.budgetParts
    .filter((part) => !removedBudgetLineIds.includes(part.lineId))
    .map((part) => `${part.lineId}:${part.name}:${part.amount}:${part.replacementDecision || ''}`)
    .join('|');
  const currentBudgetPartsSignature = item.repair.parts
    .filter((part) => part.source === 'budget')
    .map((part) => `${part.sourceLineId}:${part.name}:${part.budgetAmount || part.amount}`)
    .join('|');
  const expectedQuoteSignature = buildThirdPartyBudgetParts(item.budget.lines, item.budget.accessoryWorks)
    .map((part) => `${part.lineId}:${part.name}:${part.amount}`)
    .join('|');
  const currentQuoteSignature = (item.repair.quoteRows || [])
    .map((row) => `${row.sourceLineId}:${row.piece}`)
    .join('|');
  const repairedMediaItems = item.repair.egreso.repairedMedia || [];
  const currentPreviewBroken = previewMedia ? brokenPreviewIds.includes(previewMedia.id) : false;
  const thirdPartyRepairTab = ['repuestos', 'turno'].includes(activeRepairTab) ? activeRepairTab : 'repuestos';

  useEffect(() => {
    if (activeRepairTab !== 'repuestos') {
      return;
    }

    if (isThirdPartyClaimCase(item)) {
      if (expectedQuoteSignature !== currentQuoteSignature) {
        updateCase((draft) => {
          syncThirdPartyQuoteRowsWithBudget(draft);
        });
      }
      return;
    }

    if (expectedBudgetPartsSignature !== currentBudgetPartsSignature) {
      syncBudgetParts();
    }
  }, [activeRepairTab, currentBudgetPartsSignature, currentQuoteSignature, expectedBudgetPartsSignature, expectedQuoteSignature, item, updateCase]);

  if (isThirdPartyClaimCase(item)) {
    const bestQuoteSubtotal = item.computed.thirdParty.subtotalBestQuote;
    const receivedPartsCount = item.repair.parts.filter((part) => part.state === 'Recibido').length;
    const isLawyer = isThirdPartyLawyerCase(item);
    const noRepairNeeded = isLawyer && item.lawyer.repairVehicle === 'NO';

    return (
      <div className="tab-layout gestion-tab-layout ops-tab-layout">
        <article className="card inner-card todo-risk-summary-card">
          <div className="section-head small-gap">
            <div>
              <h3>Gestión reparación - Reclamo de Tercero</h3>
              <p className="muted">Podés dejar seguimiento manual y también se crean recordatorios automáticos cuando el turno queda condicionado.</p>
            </div>
            <div className="tag-row">
              <StatusBadge tone={getStatusTone(item.computed.repairStatus)}>{item.computed.repairStatus}</StatusBadge>
              <button className="secondary-button" onClick={addRepairFollowUpTask} type="button">Crear tarea</button>
            </div>
          </div>
          <div className="form-grid five-columns compact-grid">
            <DataField label={isLawyer && item.lawyer.instance === 'Judicial' ? 'N° CUIJ' : 'N° de siniestro'} onChange={() => {}} readOnly value={isLawyer && item.lawyer.instance === 'Judicial' ? item.lawyer.cuij || '' : item.claimNumber || ''} />
            <DataField label="Taller" onChange={() => {}} readOnly value={item.budget.workshop || 'Pendiente'} />
            <DataField label="Piezas a cotizar" onChange={() => {}} readOnly value={item.repair.quoteRows?.length || 0} />
            <DataField label="Subtotal mejor cotización" onChange={() => {}} readOnly value={bestQuoteSubtotal} />
            <DataField label="Total final repuestos" onChange={() => {}} readOnly value={item.computed.thirdParty.totalFinalParts} />
          </div>
          {noRepairNeeded ? <div className="inline-alert info-banner">Repara vehículo = NO: no se exige reparación normal y esta solapa queda resuelta como trazabilidad operativa.</div> : null}
        </article>

        <div className="subtabs-row third-party-repair-tabs">
          {[
            { id: 'repuestos', label: 'Planilla de cotizaciones' },
            { id: 'turno', label: 'Gestión de pedidos' },
          ].map((tab) => (
            <button className={`subtab-button ${thirdPartyRepairTab === tab.id ? 'is-active' : ''}`} key={tab.id} onClick={() => onChangeRepairTab(tab.id)} type="button">
              {tab.label}
            </button>
          ))}
        </div>

        {thirdPartyRepairTab === 'repuestos' ? (
          <article className="card inner-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Planilla de cotizaciones</p>
                <h3>Piezas traídas desde Presupuesto</h3>
              </div>
              <div className="tag-row">
                <StatusBadge tone={item.repair.quoteRows?.length ? 'info' : 'danger'}>{item.repair.quoteRows?.length || 0} pieza(s)</StatusBadge>
                <button className="secondary-button" onClick={() => updateCase((draft) => { syncThirdPartyQuoteRowsWithBudget(draft); })} type="button">Actualizar desde Presupuesto</button>
              </div>
            </div>

            <div className="inline-alert info-banner">Se incluyen automáticamente las piezas a reemplazar del Presupuesto y también los trabajos extras que tengan repuestos asociados. La pieza se cotiza aunque internamente después se decida reparar.</div>

            <div className="parts-total-grid third-party-summary-grid">
              <article className="summary-chip">
                <span>Subtotal mejor cotización</span>
                <strong>{money(bestQuoteSubtotal)}</strong>
              </article>
              <article className="summary-chip">
                <span>Mínimo repuestos</span>
                <strong>{money(item.computed.thirdParty.minimumParts)}</strong>
              </article>
              <article className="summary-chip">
                <span>Piezas sincronizadas</span>
                <strong>{item.repair.quoteRows?.length || 0}</strong>
              </article>
            </div>

            <div className="table-wrap">
              <table className="data-table compact-table third-party-quote-table">
                <thead>
                  <tr>
                    <th>Pieza</th>
                    <th>Cotización 1</th>
                    <th>Cotización 2</th>
                    <th>Cotización 3</th>
                    <th>Cotización 4</th>
                    <th>Mejor</th>
                    <th>Facturación</th>
                    <th>Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {(item.repair.quoteRows || []).map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="table-piece-cell">
                          <strong>{row.piece}</strong>
                          <small>{row.source === 'budget' ? 'Sincronizado desde Presupuesto' : 'Carga manual'}</small>
                        </div>
                      </td>
                      <td><DataField label="Cotización 1" onChange={(value) => updateCase((draft) => { const target = draft.repair.quoteRows.find((entry) => entry.id === row.id); target.provider1 = value; })} value={row.provider1} /></td>
                      <td><DataField label="Cotización 2" onChange={(value) => updateCase((draft) => { const target = draft.repair.quoteRows.find((entry) => entry.id === row.id); target.provider2 = value; })} value={row.provider2} /></td>
                      <td><DataField label="Cotización 3" onChange={(value) => updateCase((draft) => { const target = draft.repair.quoteRows.find((entry) => entry.id === row.id); target.provider3 = value; })} value={row.provider3} /></td>
                      <td><DataField label="Cotización 4" onChange={(value) => updateCase((draft) => { const target = draft.repair.quoteRows.find((entry) => entry.id === row.id); target.provider4 = value; })} value={row.provider4} /></td>
                      <td><strong>{money(getBestQuoteValue(row))}</strong></td>
                      <td><SelectField label="Facturación" onChange={(value) => updateCase((draft) => { const target = draft.repair.quoteRows.find((entry) => entry.id === row.id); target.billing = value; })} options={THIRD_PARTY_BILLING_OPTIONS} value={row.billing} /></td>
                      <td><SelectField label="Pago" onChange={(value) => updateCase((draft) => { const target = draft.repair.quoteRows.find((entry) => entry.id === row.id); target.paymentMethod = value; })} options={THIRD_PARTY_PAYMENT_OPTIONS} value={row.paymentMethod} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ) : null}

        {thirdPartyRepairTab === 'turno' ? (
          <article className="card inner-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Gestión de pedidos</p>
                <h3>Carga manual y etiquetas</h3>
              </div>
              <div className="tag-row">
                <StatusBadge tone={item.repair.parts.length ? 'info' : 'danger'}>{item.repair.parts.length} repuesto(s)</StatusBadge>
                <button className="secondary-button" onClick={() => flash('Imprimir etiquetas: se generarán las etiquetas con carpeta, inventario y código de pieza.')} type="button">Imprimir etiquetas</button>
                <button className="secondary-button" onClick={addRepairPart} type="button">Agregar repuesto</button>
              </div>
            </div>

            <div className="parts-total-grid third-party-summary-grid">
              <article className="summary-chip">
                <span>Total final repuestos</span>
                <strong>{money(item.computed.thirdParty.totalFinalParts)}</strong>
              </article>
              <article className="summary-chip">
                <span>Recibidos</span>
                <strong>{receivedPartsCount}</strong>
              </article>
              <article className="summary-chip">
                <span>Pendientes / gestión</span>
                <strong>{Math.max(item.repair.parts.length - receivedPartsCount, 0)}</strong>
              </article>
            </div>

            <div className="budget-lines">
              {item.repair.parts.length ? (
                item.repair.parts.map((part, index) => (
                  <div className="budget-line repair-part-line third-party-order-line" key={part.id}>
                    <div className="budget-line-header">
                      <strong>{part.name || 'Nuevo repuesto'}</strong>
                      <small>N° inventario {getThirdPartyInventoryCode(item.code, index)}</small>
                    </div>
                    <DataField disabled={noRepairNeeded} label="Repuesto" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.name = value;
                    })} value={part.name} />
                    <DataField disabled={noRepairNeeded} label="Importe" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.amount = value;
                    })} value={part.amount} />
                    <DataField disabled={noRepairNeeded} label="Proveedor" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.provider = value;
                    })} value={part.provider} />
                    <SelectField disabled={noRepairNeeded} label="Estado" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.state = value;
                      if (value !== 'Recibido') {
                        target.receivedDate = '';
                      }
                    })} options={THIRD_PARTY_ORDER_STATE_OPTIONS} value={part.state} />
                    <DataField disabled={noRepairNeeded} label="Fecha recibido" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.receivedDate = value;
                      if (value) {
                        target.state = 'Recibido';
                      }
                    })} type="date" value={part.receivedDate} />
                    <DataField disabled={noRepairNeeded} label="Código pieza" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.partCode = value;
                    })} value={part.partCode} />
                    <DataField label="N° inventario" onChange={() => {}} readOnly value={getThirdPartyInventoryCode(item.code, index)} />
                    <div className="budget-line-footer">
                      <div className="budget-line-meta repair-line-meta">
                        <StatusBadge tone={part.state === 'Recibido' ? 'success' : 'info'}>{part.state}</StatusBadge>
                        {part.source === 'budget' ? <small>Originado en Presupuesto</small> : <small>Carga manual</small>}
                      </div>
                      <button className="ghost-button" onClick={() => removeRepairPart(part.id)} type="button">Eliminar</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-media" role="status">Todavía no cargaste repuestos para gestionar pedidos.</div>
              )}
            </div>
          </article>
        ) : null}
      </div>
    );
  }

  if (isInsuranceWorkflowCase(item)) {
    const todoRiskParts = item.repair.parts.filter((part) => part.source === 'budget');
    const authorizedParts = todoRiskParts.filter((part) => part.authorized === 'SI');
    const turnoBlockedForTodoRisk = !item.computed.todoRisk.quoteAgreed && !item.todoRisk.processing.adminTurnOverride;
    const authorizationBlocked = !item.computed.todoRisk.canProgressFromPresentation;

    return (
      <div className="tab-layout gestion-tab-layout ops-tab-layout">
        {!item.computed.budgetReady ? <div className="alert-banner danger-banner">Presupuesto en rojo: completá y generá el informe para habilitar Gestión reparación.</div> : null}

        <article className="card inner-card todo-risk-summary-card">
          <div className="section-head small-gap">
            <div>
              <h3>Gestión reparación - Todo Riesgo</h3>
              <p className="muted">Sumá seguimiento puntual para repuestos, turno o egreso sin salir del caso.</p>
            </div>
            <div className="tag-row">
              <StatusBadge tone={getStatusTone(item.computed.repairStatus)}>{item.computed.repairStatus}</StatusBadge>
              <button className="secondary-button" onClick={addRepairFollowUpTask} type="button">Crear tarea</button>
            </div>
          </div>
          <div className="form-grid four-columns compact-grid">
            <DataField label="N° de siniestro" onChange={() => {}} readOnly value={item.claimNumber || ''} />
            <DataField label="Días tramitando" onChange={() => {}} readOnly value={item.computed.todoRisk.daysProcessing} />
            <DataField label="Repuestos autorizados" onChange={() => {}} readOnly value={authorizedParts.length} />
            <DataField label="Estado actual" onChange={() => {}} readOnly value={item.computed.repairStatus} />
          </div>
        </article>

        <div className="subtabs-row">
          {repairTabs.map((tab) => (
            <button className={`subtab-button ${activeRepairTab === tab.id ? 'is-active' : ''}`} key={tab.id} onClick={() => onChangeRepairTab(tab.id)} type="button">
              {tab.label}
            </button>
          ))}
        </div>

        {activeRepairTab === 'repuestos' ? (
          <article className="card inner-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Repuestos</p>
                <h3>Automáticos desde Presupuesto</h3>
              </div>
              <button className="secondary-button" onClick={() => flash('Imprimir etiqueta: se preparará la etiqueta individual del repuesto.') } type="button">Imprimir etiqueta</button>
            </div>
            <div className="table-wrap">
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>Repuesto</th>
                    <th>Autorizado</th>
                    <th>Proveedor</th>
                    <th>Estado</th>
                    <th>Recibido</th>
                    <th>N° inventario</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {todoRiskParts.map((part, index) => {
                    const inventoryIndex = authorizedParts.findIndex((entry) => entry.id === part.id) + 1;
                    const inventoryCode = part.authorized === 'SI' ? `${item.code}-${String(inventoryIndex).padStart(2, '0')}` : 'Pendiente';
                    return (
                      <tr key={part.id}>
                        <td>{part.name}</td>
                        <td>
                          <div className="todo-risk-inline-actions">
                            <button className={`secondary-button compact-button ${part.authorized === 'SI' ? 'is-selected' : ''}`} disabled={authorizationBlocked} onClick={() => updateCase((draft) => { const target = draft.repair.parts.find((entry) => entry.id === part.id); target.authorized = 'SI'; })} type="button">Sí</button>
                            <button className={`secondary-button compact-button ${part.authorized === 'NO' ? 'is-selected' : ''}`} disabled={authorizationBlocked} onClick={() => updateCase((draft) => { const target = draft.repair.parts.find((entry) => entry.id === part.id); target.authorized = 'NO'; })} type="button">No</button>
                          </div>
                        </td>
                        <td><DataField label="Proveedor" onChange={(value) => updateCase((draft) => { const target = draft.repair.parts.find((entry) => entry.id === part.id); target.provider = value; })} value={part.provider} /></td>
                        <td><SelectField disabled={authorizationBlocked} label="Estado" onChange={(value) => updateCase((draft) => { const target = draft.repair.parts.find((entry) => entry.id === part.id); target.state = value; })} options={REPAIR_PART_STATE_OPTIONS} value={part.state} /></td>
                        <td>{part.state === 'Recibido' ? 'Sí' : 'No'}</td>
                        <td>{inventoryCode}</td>
                        <td><button className="ghost-button" onClick={() => flash(`Etiqueta para ${part.name}: ${inventoryCode}.`)} type="button">Etiqueta</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {authorizationBlocked ? <div className="inline-alert danger-banner">Sin fecha de presentación no se habilitan autorizaciones ni seguimiento operativo de repuestos.</div> : null}
          </article>
        ) : null}

        {activeRepairTab === 'turno' ? (
          <article className="card inner-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Turno</p>
                <h3>Guard con excepción administrativa</h3>
              </div>
              <button className="primary-button" onClick={assignTurn} type="button">Agendar turno</button>
            </div>
            {turnoBlockedForTodoRisk ? <div className="inline-alert danger-banner">Sin cotización acordada no se da turno, salvo la excepción visual administrativa.</div> : null}
            <div className="form-grid four-columns compact-grid">
              <DataField label="Fecha" onChange={(value) => updateCase((draft) => { draft.repair.turno.date = value; })} type="date" value={item.repair.turno.date} />
              <DataField label="Días estimados" onChange={(value) => updateCase((draft) => { draft.repair.turno.estimatedDays = value; })} type="number" value={item.repair.turno.estimatedDays} />
              <DataField label="Salida estimada" onChange={() => {}} readOnly type="date" value={item.computed.turnoEstimatedExit} />
              <SelectField label="Estado" onChange={(value) => updateCase((draft) => { draft.repair.turno.state = value; })} options={TURNO_STATE_OPTIONS} value={item.repair.turno.state} />
            </div>
            <button className={`toggle-button ${item.todoRisk.processing.adminTurnOverride ? 'is-on' : ''}`} onClick={() => updateCase((draft) => { draft.todoRisk.processing.adminTurnOverride = !draft.todoRisk.processing.adminTurnOverride; })} type="button">Excepción visual administrativa</button>
            <label className="field">
              <span>Anotaciones de turno</span>
              <textarea onChange={(event) => updateCase((draft) => { draft.repair.turno.notes = event.target.value; })} value={item.repair.turno.notes} />
            </label>
          </article>
        ) : null}
      
        {activeRepairTab === 'ingreso' ? (
          <article className="card inner-card">
            <div className="section-head small-gap">
              <h3>Ingreso</h3>
              <StatusBadge tone={item.repair.ingreso.realDate ? 'success' : 'danger'}>{item.repair.ingreso.realDate ? 'Ingreso registrado' : 'Pendiente'}</StatusBadge>
            </div>
            <div className="form-grid three-columns compact-grid">
              <DataField label="Ingreso real" onChange={(value) => updateCase((draft) => { draft.repair.ingreso.realDate = value; })} type="date" value={item.repair.ingreso.realDate} />
              <DataField label="Salida estimada" onChange={() => {}} readOnly type="date" value={item.computed.turnoEstimatedExit} />
              <ToggleField label="Observación en ingreso" onChange={(value) => updateCase((draft) => { draft.repair.ingreso.hasObservation = value; })} value={item.repair.ingreso.hasObservation} />
            </div>
          </article>
        ) : null}

        {activeRepairTab === 'egreso' ? (
          <article className="card inner-card">
            <div className="section-head small-gap">
              <h3>Egreso</h3>
              <StatusBadge tone={item.computed.repairResolved || item.todoRisk.processing.noRepairNeeded ? 'success' : 'danger'}>{item.computed.repairStatus}</StatusBadge>
            </div>
            <div className="form-grid four-columns compact-grid">
              <DataField label="Fecha egreso" onChange={(value) => updateCase((draft) => { draft.repair.egreso.date = value; })} type="date" value={item.repair.egreso.date} />
              <ToggleField label="Debe reingresar" onChange={(value) => updateCase((draft) => { draft.repair.egreso.shouldReenter = value; })} value={item.repair.egreso.shouldReenter} />
              <button className={`toggle-button ${item.repair.egreso.definitiveExit ? 'is-on' : ''}`} onClick={() => updateCase((draft) => { draft.repair.egreso.definitiveExit = !draft.repair.egreso.definitiveExit; })} type="button">Cierre operativo</button>
              <button className={`toggle-button ${item.todoRisk.processing.noRepairNeeded ? 'is-on' : ''}`} disabled={!item.todoRisk.processing.adminTurnOverride && !item.todoRisk.processing.noRepairNeeded} onClick={() => updateCase((draft) => { draft.todoRisk.processing.noRepairNeeded = !draft.todoRisk.processing.noRepairNeeded; })} type="button">No debe repararse</button>
            </div>
            <label className="field">
              <span>Anotaciones de egreso</span>
              <textarea onChange={(event) => updateCase((draft) => { draft.repair.egreso.notes = event.target.value; })} value={item.repair.egreso.notes} />
            </label>
          </article>
        ) : null}
      </div>
    );
  }

  return (
    <div className="tab-layout gestion-tab-layout ops-tab-layout">
      {!item.computed.budgetReady ? (
        <div className="alert-banner danger-banner">Presupuesto en rojo: completá y generá el informe para habilitar acciones operativas.</div>
      ) : null}

      <div className="subtabs-row">
        {repairTabs.map((tab) => (
          <button className={`subtab-button ${activeRepairTab === tab.id ? 'is-active' : ''}`} key={tab.id} onClick={() => onChangeRepairTab(tab.id)} type="button">
            {tab.label}
          </button>
        ))}
      </div>

      {activeRepairTab === 'repuestos' ? (
        <div className="repuestos-stack">
          <article className="card inner-card parts-forecast-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Repuestos presupuestados</p>
                <h3>Traídos desde REEMPLAZAR</h3>
              </div>
              <StatusBadge tone={item.computed.budgetParts.length ? 'info' : 'danger'}>
                {item.computed.budgetParts.length ? `${item.computed.budgetParts.length} piezas` : 'Sin líneas'}
              </StatusBadge>
            </div>

            <div className="inline-alert info-banner">
              Esta sub-solapa replica automáticamente las lineas con REEMPLAZAR. Podés sacar items acá sin tocar el origen del presupuesto.
            </div>

            {item.computed.budgetParts.length ? (
              <div className="parts-forecast-grid">
                {item.computed.budgetParts.map((part) => (
                  <div className="nested-card" key={part.lineId}>
                    <div className="section-head small-gap">
                      <div>
                        <strong>{part.name}</strong>
                        <small>{part.task}</small>
                      </div>
                      <span className="damage-pill">{part.damageLevel || 'Sin nivel'}</span>
                    </div>
                    <div className="summary-row">
                      <span>Monto referencial</span>
                      <strong>{money(part.amount)}</strong>
                    </div>
                    <div className="part-source-row">
                      <small>{part.replacementDecision || 'Sin decision interna'}</small>
                      {removedBudgetLineIds.includes(part.lineId) ? <StatusBadge tone="danger">Quitado en Repuestos</StatusBadge> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-media" role="status">
                Marca las líneas con REEMPLAZAR y completá la pieza para poblar este listado.
              </div>
            )}

            <div className="parts-total-row">
              <span>Total presupuestado</span>
              <strong>{money(item.computed.partsTotal)}</strong>
            </div>
          </article>

          <article className="card inner-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Gestión operativa</p>
                <h3>Pedidos y recepciones</h3>
              </div>
              <div className="tag-row">
                <StatusBadge tone={item.repair.parts.length ? 'info' : 'danger'}>{money(item.computed.repairPartsTotal)}</StatusBadge>
                <StatusBadge tone={autoPartCount ? 'success' : 'danger'}>{autoPartCount} automático(s)</StatusBadge>
                <StatusBadge tone={manualPartCount ? 'info' : 'danger'}>{manualPartCount} manual(es)</StatusBadge>
                <StatusBadge tone={overriddenPartCount ? 'info' : 'success'}>{overriddenPartCount} editado(s)</StatusBadge>
                <button className="secondary-button" onClick={() => syncBudgetParts(true)} type="button">Traer reemplazos</button>
                <button className="secondary-button" onClick={addRepairPart} type="button">Agregar repuesto</button>
              </div>
            </div>

            <div className="parts-total-grid">
              <article className="summary-chip">
                <span>Total presupuestado</span>
                <strong>{money(item.computed.partsTotal)}</strong>
              </article>
              <article className="summary-chip">
                <span>Total gestionado</span>
                <strong>{money(item.computed.repairPartsTotal)}</strong>
              </article>
              <article className="summary-chip">
                <span>Diferencia</span>
                <strong>{money(item.computed.repairPartsTotal - item.computed.partsTotal)}</strong>
              </article>
            </div>

            <div className="budget-lines">
              {item.repair.parts.length ? (
                item.repair.parts.map((part) => (
                  <div className="budget-line repair-part-line" key={part.id}>
                    <div className="budget-line-header">
                      <strong>{part.name || 'Nuevo repuesto'}</strong>
                      <small>{part.source === 'budget' ? 'Arrastrado desde Presupuesto' : 'Carga independiente en Repuestos'}</small>
                    </div>
                    <DataField label="Repuesto" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.name = value;
                    })} value={part.name} />
                    <DataField label="Proveedor" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.provider = value;
                    })} value={part.provider} />
                    <DataField label="Importe" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.amount = value;
                    })} value={part.amount} />
                    <SelectField label="Estado" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.state = value;
                    })} options={REPAIR_PART_STATE_OPTIONS} value={part.state} />
                    <SelectField label="Compra" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.purchaseBy = value;
                    })} options={REPAIR_PART_BUYER_OPTIONS} value={part.purchaseBy} />
                    <SelectField label="Pago" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.paymentStatus = value;
                    })} options={REPAIR_PART_PAYMENT_OPTIONS} value={part.paymentStatus} />
                    <div className="budget-line-footer">
                      <div className="budget-line-meta repair-line-meta">
                        <StatusBadge tone={part.source === 'budget' ? 'info' : 'success'}>
                          {part.source === 'budget' ? 'Desde presupuesto' : 'Carga manual'}
                        </StatusBadge>
                        {part.budgetAmount ? <small>Monto ref: {money(part.budgetAmount)}</small> : null}
                        {part.source === 'budget' && part.amount !== part.budgetAmount ? <small>Importe editado en Repuestos</small> : null}
                      </div>
                      <button className="ghost-button" onClick={() => removeRepairPart(part.id)} type="button">Eliminar</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-media" role="status">Todavía no cargaste repuestos gestionados.</div>
              )}
            </div>

            <div className="parts-total-row">
              <span>Total gestionado</span>
              <strong>{money(item.computed.repairPartsTotal)}</strong>
            </div>
          </article>
        </div>
      ) : null}

      {activeRepairTab === 'turno' ? (
        <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Subsolapa Turno</p>
              <h3>Agenda con salida estimada automática</h3>
            </div>
            <button className="primary-button" onClick={assignTurn} type="button">Agendar turno</button>
          </div>

          <div className="budget-ready-panel budget-ready-panel-compact">
            <StatusBadge tone={item.computed.turnoReady ? 'success' : 'danger'}>{item.computed.turnoReady ? 'Turno consistente' : 'Turno incompleto'}</StatusBadge>
            <small>La salida estimada se calcula en días hábiles desde la fecha elegida.</small>
          </div>

          <div className="form-grid four-columns compact-grid">
            <DataField label="Fecha" onChange={(value) => updateCase((draft) => { draft.repair.turno.date = value; })} type="date" value={item.repair.turno.date} />
            <DataField label="Dias estimados" onChange={(value) => updateCase((draft) => { draft.repair.turno.estimatedDays = value; })} type="number" value={item.repair.turno.estimatedDays} />
            <DataField label="Salida estimada" onChange={() => {}} type="date" value={item.computed.turnoEstimatedExit} />
            <SelectField label="Estado" onChange={(value) => updateCase((draft) => { draft.repair.turno.state = value; })} options={TURNO_STATE_OPTIONS} value={item.repair.turno.state} />
          </div>
          <label className="field">
            <span>Anotaciones de turno</span>
            <textarea onChange={(event) => updateCase((draft) => { draft.repair.turno.notes = event.target.value; })} value={item.repair.turno.notes} />
          </label>
        </article>
      ) : null}

      {activeRepairTab === 'ingreso' ? (
        <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Subsolapa Ingreso</p>
              <h3>Fecha real + ítems de la planilla</h3>
            </div>
            <StatusBadge tone={item.repair.ingreso.realDate ? 'success' : 'danger'}>{item.repair.ingreso.realDate ? 'Ingreso registrado' : 'Pendiente'}</StatusBadge>
          </div>

          <div className="budget-ready-panel budget-ready-panel-compact">
            <StatusBadge tone={item.repair.ingreso.hasObservation === 'SI' ? 'info' : 'success'}>{item.repair.ingreso.hasObservation === 'SI' ? 'Ingreso observado' : 'Sin observaciones'}</StatusBadge>
            <small>La fecha real de ingreso puede ser distinta al turno programado.</small>
          </div>

          <div className="form-grid three-columns compact-grid">
            <DataField label="Ingreso real" onChange={(value) => updateCase((draft) => { draft.repair.ingreso.realDate = value; })} type="date" value={item.repair.ingreso.realDate} />
            <DataField label="Salida estimada" onChange={() => {}} type="date" value={item.computed.turnoEstimatedExit} />
            <ToggleField label="Observacion en ingreso" onChange={(value) => updateCase((draft) => {
              draft.repair.ingreso.hasObservation = value;
              if (value !== 'SI') {
                draft.repair.ingreso.observation = '';
                draft.repair.ingreso.items = [];
              }
            })} value={item.repair.ingreso.hasObservation} />
          </div>

          {item.repair.ingreso.hasObservation === 'SI' ? (
            <>
              <div className="inline-alert info-banner">
                Fecha visible de la observación: {item.repair.ingreso.realDate ? formatDate(item.repair.ingreso.realDate) : 'pendiente de cargar en Ingreso real'}.
              </div>

              <label className="field">
                <span>Resumen general</span>
                <textarea onChange={(event) => updateCase((draft) => { draft.repair.ingreso.observation = event.target.value; })} value={item.repair.ingreso.observation} />
              </label>

              <div className="section-head small-gap">
                <h4>Ítems observados</h4>
                <button className="secondary-button" onClick={addIngresoItem} type="button">Agregar ítem</button>
              </div>

              <div className="budget-lines">
                {item.computed.ingresoItems.map((entry) => (
                  <div className="budget-line" key={entry.id}>
                    <SelectField label="Tipo" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.ingreso.items.find((itemEntry) => itemEntry.id === entry.id);
                      target.type = value;
                    })} options={INGRESO_TYPES} value={entry.type} />
                    <DataField label="Daño / observaciones" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.ingreso.items.find((itemEntry) => itemEntry.id === entry.id);
                      target.detail = value;
                    })} value={entry.detail} />
                    <DataField label="Fotos / videos" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.ingreso.items.find((itemEntry) => itemEntry.id === entry.id);
                      target.media = value;
                    })} value={entry.media} />
                    <button className="ghost-button" onClick={() => updateCase((draft) => {
                      draft.repair.ingreso.items = draft.repair.ingreso.items.filter((itemEntry) => itemEntry.id !== entry.id);
                    })} type="button">Eliminar</button>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </article>
      ) : null}

      {activeRepairTab === 'egreso' ? (
        <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Subsolapa Egreso</p>
              <h3>Cierre, reingreso y fotos reparado</h3>
            </div>
            <StatusBadge tone={item.computed.repairResolved ? 'success' : 'danger'}>{item.computed.repairStatus}</StatusBadge>
          </div>

          <div className="form-grid four-columns compact-grid">
            <DataField label="Fecha egreso" onChange={(value) => updateCase((draft) => { draft.repair.egreso.date = value; })} type="date" value={item.repair.egreso.date} />
            <ToggleField label="Debe reingresar" onChange={(value) => updateCase((draft) => {
              draft.repair.egreso.shouldReenter = value;
              if (value !== 'SI') {
                draft.repair.egreso.reentryDate = '';
                draft.repair.egreso.reentryEstimatedDays = '';
                draft.repair.egreso.reentryState = 'Pendiente programar';
                draft.repair.egreso.reentryNotes = '';
              }
            })} value={item.repair.egreso.shouldReenter} />
            <button className={`toggle-button ${item.repair.egreso.definitiveExit ? 'is-on' : ''}`} onClick={() => updateCase((draft) => { draft.repair.egreso.definitiveExit = !draft.repair.egreso.definitiveExit; })} type="button">
              Egreso definitivo
            </button>
            <button className={`toggle-button ${item.repair.egreso.repairedPhotos ? 'is-on' : ''}`} onClick={() => updateCase((draft) => { draft.repair.egreso.repairedPhotos = !draft.repair.egreso.repairedPhotos; })} type="button">
              Fotos vehiculo reparado
            </button>
          </div>

          <label className="field">
            <span>Anotaciones de egreso</span>
            <textarea onChange={(event) => updateCase((draft) => { draft.repair.egreso.notes = event.target.value; })} value={item.repair.egreso.notes} />
          </label>

          {item.repair.egreso.shouldReenter === 'SI' ? (
            <div className="nested-card">
              <h4>Turno reingreso</h4>
              <div className="form-grid three-columns compact-grid">
                <DataField label="Fecha reingreso" onChange={(value) => updateCase((draft) => { draft.repair.egreso.reentryDate = value; })} type="date" value={item.repair.egreso.reentryDate} />
                <DataField label="Dias estimados" onChange={(value) => updateCase((draft) => { draft.repair.egreso.reentryEstimatedDays = value; })} type="number" value={item.repair.egreso.reentryEstimatedDays} />
                <DataField label="Salida reingreso" onChange={() => {}} type="date" value={item.computed.reentryEstimatedExit} />
                <SelectField label="Estado reingreso" onChange={(value) => updateCase((draft) => { draft.repair.egreso.reentryState = value; })} options={TURNO_STATE_OPTIONS} value={item.repair.egreso.reentryState} />
              </div>
              <label className="field">
                <span>Notas reingreso</span>
                <textarea onChange={(event) => updateCase((draft) => { draft.repair.egreso.reentryNotes = event.target.value; })} value={item.repair.egreso.reentryNotes} />
              </label>
            </div>
          ) : null}

          <div className="budget-ready-panel budget-ready-panel-compact">
            <StatusBadge tone={item.repair.egreso.repairedPhotos ? 'success' : 'danger'}>{item.repair.egreso.repairedPhotos ? 'Fotos finales visibles' : 'Sin fotos finales'}</StatusBadge>
            <small>La solapa Gestión reparación recién cierra en verde cuando no reingresa o se marca egreso definitivo.</small>
          </div>

          {item.repair.egreso.repairedPhotos ? (
            repairedMediaItems.length ? (
              <div className="media-gallery compact-media-gallery">
                {repairedMediaItems.map((media) => (
                  <button
                    aria-label={`Abrir evidencia final ${media.label}`}
                    className="media-card"
                    key={media.id}
                    onClick={() => setPreviewMedia(media)}
                    type="button"
                  >
                    {media.thumbnail && !failedMediaIds.includes(media.id) ? (
                      <img alt="" className="media-card-image" onError={() => markMediaThumbFailed(media.id)} src={media.thumbnail} />
                    ) : (
                      <div className="media-card-fallback" aria-hidden="true">
                        <strong>EGRESO</strong>
                        <small>Preview no disponible</small>
                      </div>
                    )}
                    <span className="media-card-scrim" aria-hidden="true" />
                    <span>{media.label}</span>
                    <small>{media.description || 'Foto final de entrega'}</small>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-media" role="status">La bandera de fotos finales está activa, pero todavía no hay adjuntos de egreso para revisar.</div>
            )
          ) : null}
        </article>
      ) : null}

      {previewMedia ? (
        <div className="media-overlay" onClick={() => setPreviewMedia(null)} role="presentation">
          <div aria-label={`Vista ampliada de ${previewMedia.label}`} aria-modal="true" className="media-modal" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="media-modal-head">
              <div>
                <strong>{previewMedia.label}</strong>
                <p>{previewMedia.description || 'Adjunto operativo del caso.'}</p>
              </div>
              <button className="ghost-button" onClick={() => setPreviewMedia(null)} type="button">Cerrar</button>
            </div>

            {previewMedia.type === 'video' ? (
              currentPreviewBroken ? (
                <div className="empty-media" role="status">El video no pudo previsualizarse. Abrilo en una pestaña nueva para revisar el original.</div>
              ) : (
                <video controls onError={() => markPreviewFailed(previewMedia.id)} src={previewMedia.url} />
              )
            ) : currentPreviewBroken ? (
              <div className="empty-media" role="status">La imagen no cargó en la previsualización. Usá "Abrir archivo" para validarla igual.</div>
            ) : (
              <img alt={previewMedia.label} onError={() => markPreviewFailed(previewMedia.id)} src={previewMedia.url} />
            )}

            <div className="media-preview-actions">
              <a className="secondary-button button-link" href={previewMedia.url} rel="noreferrer" target="_blank">Abrir archivo</a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

