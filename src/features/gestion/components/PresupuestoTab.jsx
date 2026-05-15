import { useState } from 'react';
import DataField from '../../../components/ui/DataField';
import SelectField from '../../../components/ui/SelectField';
import StatusBadge from '../../../components/ui/StatusBadge';
import ToggleField from '../../../components/ui/ToggleField';
import { isThirdPartyClaimCase } from '../../cases/lib/caseDomainCheckers';
import { formatDate } from '../../cases/lib/caseFormatters';
import {
  AUTHORIZER_OPTIONS,
  BUDGET_DAMAGE_OPTIONS,
  BUDGET_PART_DECISION_OPTIONS,
  BUDGET_TASK_OPTIONS,
  REPORT_STATUS_OPTIONS,
  WORKSHOP_OPTIONS,
  YES_NO_AV_OPTIONS,
} from '../constants/gestionOptions';
import {
  getBudgetAction,
  getBudgetLineIssues,
  getWorkshopInfo,
  lineIsComplete,
  lineNeedsReplacementDecision,
  syncRepairPartsWithBudget,
  createAccessoryWork,
  createBudgetLine,
  createBudgetService,
} from '../lib/gestionShared';
import { money, numberValue } from '../lib/gestionUtils';

export default function PresupuestoTab({ item, updateCase, flash }) {
  const [previewMedia, setPreviewMedia] = useState(null);
  const [failedMediaIds, setFailedMediaIds] = useState([]);
  const [brokenPreviewIds, setBrokenPreviewIds] = useState([]);

  const updateBudget = (mutator, { syncParts = false } = {}) => {
    updateCase((draft) => {
      mutator(draft);
      if (syncParts) {
        syncRepairPartsWithBudget(draft);
      }
    });
  };

  const updateBudgetLine = (lineId, mutator, { syncParts = false } = {}) => {
    updateBudget((draft) => {
      const target = draft.budget.lines.find((entry) => entry.id === lineId);
      if (!target) return;
      mutator(target, draft);
    }, { syncParts });
  };

  const addLine = () => {
    const current = item.budget.lines.at(-1);

    if (current && !lineIsComplete(current)) {
      flash('No se permite nueva linea si la actual no tiene pieza afectada, tarea a ejecutar y nivel de dano.');
      return;
    }

    updateBudget((draft) => {
      draft.budget.lines.push(createBudgetLine());
    }, { syncParts: true });
  };

  const removeLine = (lineId) => {
    if (item.budget.lines.length === 1) {
      flash('Necesitas al menos una linea de presupuesto.');
      return;
    }

    updateBudget((draft) => {
      const removedLine = draft.budget.lines.find((line) => line.id === lineId);
      if (removedLine?.backendId) {
        draft.meta = draft.meta || {};
        draft.meta.removedBudgetItemIds = [...new Set([...(draft.meta.removedBudgetItemIds || []), removedLine.backendId])];
      }
      draft.budget.lines = draft.budget.lines.filter((line) => line.id !== lineId);
    }, { syncParts: true });
  };

  const generateBudget = () => {
    if (!item.computed.canGenerateBudget) {
      flash('No se puede generar presupuesto sin informe completo y marcado como cerrado.');
      return;
    }

    updateBudget((draft) => {
      draft.budget.generated = true;
    }, { syncParts: true });
  };

  const changeReportStatus = (value) => {
    if (value === 'Informe cerrado') {
      if (!item.budget.workshop) {
        flash('Definí el taller antes de cerrar el informe.');
        return;
      }
      if (!item.computed.hasVehicleData) {
        const missing = item.computed.vehicleMissingFields.join(', ');
        flash(`No se puede cerrar el informe: falta ${missing || 'completar la ficha tecnica del vehiculo'}.`);
        return;
      }
      if (item.computed.pendingReplacementDecision) {
        flash(`Defini la decision interna de repuesto para ${item.computed.pendingReplacementDecision.piece || 'las lineas con REEMPLAZAR'} antes de cerrar.`);
        return;
      }
    }

    updateBudget((draft) => {
      draft.budget.reportStatus = value;
      if (value !== 'Informe cerrado') {
        draft.budget.generated = false;
      }
    });
  };

  const highlightLineErrors = item.budget.reportStatus === 'Informe cerrado';
  const workshopInfo = getWorkshopInfo(item.budget.workshop);
  const mediaItems = item.vehicleMedia ?? [];
  const vehicleSummary = [
    { label: 'Dominio', value: item.vehicle.plate || 'Pendiente' },
    { label: 'Marca / modelo', value: `${item.vehicle.brand || 'Pendiente'} ${item.vehicle.model || ''}`.trim() },
    { label: 'Ano', value: item.vehicle.year || 'Pendiente' },
    { label: 'Tipo', value: item.vehicle.type || 'Pendiente' },
    { label: 'Uso', value: item.vehicle.usage || 'Pendiente' },
    { label: 'Pintura', value: item.vehicle.paint || 'Pendiente' },
    { label: 'Color', value: item.vehicle.color || 'Pendiente' },
    { label: 'Motor', value: item.vehicle.engine || 'Pendiente' },
    { label: 'Chasis', value: item.vehicle.chassis || 'Pendiente' },
    { label: 'Caja', value: item.vehicle.transmission || 'Pendiente' },
    { label: 'Kilometraje', value: item.vehicle.mileage || 'Pendiente' },
  ];
  const customerDisplayName = `${item.customer.firstName || ''} ${item.customer.lastName || ''}`.trim() || 'Pendiente';
  const budgetStatusTone = item.computed.budgetReady ? 'success' : item.computed.canGenerateBudget ? 'info' : 'danger';
  const budgetStatusLabel = item.computed.budgetReady
    ? 'Presupuesto emitido y listo para gestión de reparación'
    : item.computed.canGenerateBudget
      ? 'Informe cerrado. Falta generar el presupuesto final'
      : 'Presupuesto en rojo';
  const budgetHelperCopy = item.computed.budgetReady
    ? 'Los reemplazos ya quedaron sincronizados en Repuestos.'
    : item.computed.canGenerateBudget
      ? 'Al generar, los reemplazos se sincronizan en Repuestos.'
      : 'Completá taller, vehiculo, lineas, decision de reemplazo y mano de obra.';

  const markMediaThumbFailed = (mediaId) => {
    setFailedMediaIds((current) => (current.includes(mediaId) ? current : [...current, mediaId]));
  };

  const markPreviewFailed = (mediaId) => {
    setBrokenPreviewIds((current) => (current.includes(mediaId) ? current : [...current, mediaId]));
  };

  const currentPreviewBroken = previewMedia ? brokenPreviewIds.includes(previewMedia.id) : false;
  const showAccessoryBlock = item.tramiteType !== 'Particular';
  const accessoryTotal = (item.budget.accessoryWorks || []).reduce((sum, entry) => sum + numberValue(entry.amount), 0);

  const addAccessoryWork = () => {
    updateBudget((draft) => {
      draft.budget.accessoryWorkEnabled = 'SI';
      draft.budget.accessoryWorks = [...(draft.budget.accessoryWorks || []), createAccessoryWork()];
    });
  };

  const removeAccessoryWork = (workId) => {
    updateBudget((draft) => {
      draft.budget.accessoryWorks = (draft.budget.accessoryWorks || []).filter((entry) => entry.id !== workId);
      if (!draft.budget.accessoryWorks.length) {
        draft.budget.accessoryWorks = [createAccessoryWork()];
        draft.budget.accessoryWorkEnabled = 'NO';
      }
    });
  };

  const addBudgetService = () => {
    updateBudget((draft) => {
      draft.budget.services = [...(draft.budget.services || []), createBudgetService(`Servicio adicional ${(draft.budget.services?.length || 0) + 1}`)];
    });
  };

  const removeBudgetService = (serviceId) => {
    if ((item.budget.services || []).length === 1) {
      flash('Necesitás al menos un servicio adicional en esta sección.');
      return;
    }

    updateBudget((draft) => {
      draft.budget.services = (draft.budget.services || []).filter((entry) => entry.id !== serviceId);
    });
  };

  return (
    <div className="tab-layout budget-layout ops-tab-layout">
      <div className="budget-main-grid">
        <article className="card inner-card workshop-shell">
          <div className="section-head">
            <div>
              <p className="eyebrow">Presupuesto {item.tramiteType ?? 'Particular'}</p>
              <h3>{item.budget.workshop || 'Seleccioná el taller'}</h3>
            </div>
            <div className="form-grid three-columns compact-grid inline-fields">
              <SelectField
                invalid={!item.budget.workshop && item.budget.reportStatus === 'Informe cerrado'}
                label="Taller"
                onChange={(value) => updateBudget((draft) => { draft.budget.workshop = value; })}
                options={WORKSHOP_OPTIONS}
                placeholder="Seleccioná un taller"
                required
                value={item.budget.workshop}
              />
              <SelectField label="Autorizó" onChange={(value) => updateBudget((draft) => { draft.budget.authorizer = value; })} options={AUTHORIZER_OPTIONS} value={item.budget.authorizer} />
              <SelectField label="Informe" onChange={changeReportStatus} options={REPORT_STATUS_OPTIONS} value={item.budget.reportStatus} />
            </div>
          </div>

          <div className="workshop-banner">
            <div className="workshop-identity">
              <div className="workshop-logo-shell" aria-hidden="true">
                {workshopInfo?.logo ? <img alt="" src={workshopInfo.logo} /> : <span>DT</span>}
              </div>
              <div className="workshop-copy">
                <span className="workshop-kicker">Cabecera por taller</span>
                <strong>{workshopInfo?.legalName || 'Datos comerciales pendientes'}</strong>
                <small>{workshopInfo ? `${workshopInfo.taxId} · ${workshopInfo.taxCondition}` : 'Agregá el taller para ver CUIT y condición impositiva.'}</small>
                <small>{workshopInfo ? `${workshopInfo.address} · ${workshopInfo.phone}` : ''}</small>
                <small>{workshopInfo?.email}</small>
              </div>
            </div>
            <div className="budget-workshop-status">
              <StatusBadge tone={item.computed.reportClosed ? 'success' : 'danger'}>
                {item.budget.reportStatus}
              </StatusBadge>
              <StatusBadge tone={budgetStatusTone}>{budgetStatusLabel}</StatusBadge>
            </div>
          </div>

          <div className="vehicle-summary-card">
            <div className="vehicle-summary-head">
              <div>
                <span>Vehiculo desde Ficha Tecnica</span>
                <strong>{item.vehicle.brand || 'Pendiente'} {item.vehicle.model || ''}</strong>
                <small>Se espejan los datos del vehiculo; las observaciones quedan fuera de esta cabecera.</small>
              </div>
              <div className="vehicle-summary-owner">
                <span>Cliente</span>
                <strong>{customerDisplayName}</strong>
                <small>{item.customer.phone || 'Telefono pendiente'}</small>
              </div>
            </div>
            <div className="vehicle-meta-grid">
              {vehicleSummary.map((entry) => (
                <div key={entry.label}>
                  <span>{entry.label}</span>
                  <strong>{entry.value}</strong>
                </div>
              ))}
            </div>
            {!item.computed.hasVehicleData ? (
              <div className="inline-alert danger-banner">
                No podés cerrar el informe hasta completar en Ficha Tecnica: {item.computed.vehicleMissingFields.join(', ')}.
              </div>
            ) : null}
          </div>

          <div className="media-mock-grid budget-header-grid">
            <article>
              <span>Informe</span>
              <strong>{item.budget.reportStatus}</strong>
              <small>Datos espejo de la planilla Particular</small>
            </article>
            <article>
              <span>Repuestos cotizados</span>
              <strong>{item.budget.partsProvider || 'Sin proveedor'}</strong>
              <small>{item.budget.partsQuotedDate ? `Fecha ${formatDate(item.budget.partsQuotedDate)}` : 'Falta fecha de cotización'}</small>
            </article>
            <article>
              <span>Días estimados</span>
              <strong>{item.budget.estimatedWorkDays || 'Pendiente'}</strong>
              <small>Mínimo cierre MO {item.budget.minimumLaborClose ? money(item.budget.minimumLaborClose) : 'sin dato'}</small>
            </article>
          </div>
        </article>

      </div>

      <article className="card inner-card media-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Fotos y videos</p>
            <h3>Evidencia de daños</h3>
          </div>
          <StatusBadge tone={mediaItems.length ? 'info' : 'danger'}>
            {mediaItems.length ? `${mediaItems.length} adjunto(s)` : 'Sin archivos'}
          </StatusBadge>
        </div>

        {mediaItems.length ? (
          <div className="media-gallery">
            {mediaItems.map((media) => (
              <button
                aria-label={`Abrir ${media.type === 'video' ? 'video' : 'foto'} ${media.label}`}
                className="media-card"
                key={media.id}
                onClick={() => setPreviewMedia(media)}
                type="button"
              >
                {media.thumbnail && !failedMediaIds.includes(media.id) ? (
                  <img
                    alt=""
                    className="media-card-image"
                    onError={() => markMediaThumbFailed(media.id)}
                    src={media.thumbnail}
                  />
                ) : (
                  <div className="media-card-fallback" aria-hidden="true">
                    <strong>{media.type === 'video' ? 'VIDEO' : 'ARCHIVO'}</strong>
                    <small>Preview no disponible</small>
                  </div>
                )}
                <span className="media-card-scrim" aria-hidden="true" />
                <span>{media.label}</span>
                <small>{media.description || (media.type === 'video' ? 'Video' : 'Foto')}</small>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-media" role="status">
            Cargá las fotos en Ficha Técnica &gt; Ingreso para verlas acá mientras presupuestás.
          </div>
        )}
      </article>

      <article className="card inner-card checklist-block">
        <div className="section-head">
          <div>
            <h3>Tareas a realizar</h3>
          </div>
          <button className="secondary-button" onClick={addLine} type="button">Agregar linea</button>
        </div>

        <div className="budget-lines checklist-lines">
          {item.budget.lines.map((line, index) => {
            const lineIssues = getBudgetLineIssues(line);
            const isReplacementLine = lineNeedsReplacementDecision(line);

            return (
            <div className="budget-line budget-line-extended" key={line.id}>
              <div className="budget-line-header">
                <strong>Linea {index + 1}</strong>
                <small>{line.action || 'Tarea sin definir'}</small>
              </div>
              <DataField label="Pieza afectada" onChange={(value) => updateBudgetLine(line.id, (target) => {
                target.piece = value;
              }, { syncParts: true })} required value={line.piece} invalid={!line.piece && highlightLineErrors} />
              <SelectField
                label="Tarea a ejecutar"
                onChange={(value) => updateBudgetLine(line.id, (target) => {
                  target.task = value;
                  target.action = getBudgetAction(value);
                  if (!lineNeedsReplacementDecision({ task: value })) {
                    target.replacementDecision = '';
                    target.partPrice = '';
                  }
                }, { syncParts: true })}
                options={BUDGET_TASK_OPTIONS}
                placeholder="Seleccioná una tarea"
                required
                value={line.task}
                invalid={!line.task && highlightLineErrors}
              />
              <SelectField
                label="Nivel de daño"
                onChange={(value) => updateBudgetLine(line.id, (target) => {
                  target.damageLevel = value;
                })}
                options={BUDGET_DAMAGE_OPTIONS}
                placeholder="Seleccioná el daño"
                required
                value={line.damageLevel}
                invalid={!line.damageLevel && highlightLineErrors}
              />
              <SelectField
                label="Decision interna"
                onChange={(value) => updateBudgetLine(line.id, (target) => {
                  target.replacementDecision = value;
                }, { syncParts: true })}
                options={BUDGET_PART_DECISION_OPTIONS}
                placeholder={isReplacementLine ? 'Definí si reemplaza o repara' : 'No aplica'}
                value={line.replacementDecision}
                invalid={isReplacementLine && !line.replacementDecision && highlightLineErrors}
              />
              <DataField
                label="$ repuesto"
                inputMode="numeric"
                onChange={(value) => updateBudgetLine(line.id, (target) => {
                  target.partPrice = value;
                }, { syncParts: true })}
                placeholder={isReplacementLine ? 'Opcional si reemplaza' : 'Sin repuesto'}
                readOnly={!isReplacementLine}
                value={line.partPrice}
              />
              {highlightLineErrors && lineIssues.length ? (
                <div className="inline-alert danger-banner budget-line-alert">
                  Falta completar: {lineIssues.join(', ')}.
                </div>
              ) : null}
              <div className="budget-line-footer">
                <div className="budget-line-meta">
                  <StatusBadge tone={lineIsComplete(line) ? 'success' : 'danger'}>
                    {lineIsComplete(line) ? 'Linea completa' : 'Falta completar'}
                  </StatusBadge>
                  {isReplacementLine ? (
                    <StatusBadge tone={line.replacementDecision ? 'info' : 'danger'}>
                      {line.replacementDecision || 'Sin decision'}
                    </StatusBadge>
                  ) : null}
                  <small>{line.action || 'Tarea sin definir'}</small>
                </div>
                <button className="ghost-button" onClick={() => removeLine(line.id)} type="button">Eliminar linea</button>
              </div>
            </div>
            );
          })}
        </div>
      </article>

      <article className="card inner-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Servicios adicionales</p>
            <h3>Servicios editables y ampliables</h3>
          </div>
          <div className="tag-row">
            <StatusBadge tone="info">SI / NO / A/V</StatusBadge>
            <button className="secondary-button" onClick={addBudgetService} type="button">Agregar servicio</button>
          </div>
        </div>

        <div className="budget-services-grid">
          {item.budget.services.map((service) => (
            <div className="nested-card budget-service-card" key={service.id}>
              <div className="section-head small-gap">
                <strong>{service.label || 'Servicio adicional'}</strong>
                <StatusBadge tone={service.status === 'SI' ? 'success' : service.status === 'A/V' ? 'info' : 'danger'}>
                  {service.status || 'NO'}
                </StatusBadge>
              </div>
              <DataField
                label="Nombre del servicio"
                onChange={(value) => updateBudget((draft) => {
                  const target = draft.budget.services.find((entry) => entry.id === service.id);
                  target.label = value;
                })}
                value={service.label}
              />
              <SelectField
                label="Aplica"
                onChange={(value) => updateBudget((draft) => {
                  const target = draft.budget.services.find((entry) => entry.id === service.id);
                  target.status = value;
                  if (value === 'NO') {
                    target.detail = '';
                  }
                })}
                options={YES_NO_AV_OPTIONS}
                value={service.status}
              />
              <DataField
                label="Detalle"
                onChange={(value) => updateBudget((draft) => {
                  const target = draft.budget.services.find((entry) => entry.id === service.id);
                  target.detail = value;
                })}
                placeholder="Detalle interno"
                value={service.detail}
              />
              <button className="ghost-button" onClick={() => removeBudgetService(service.id)} type="button">Quitar servicio</button>
            </div>
          ))}
        </div>
      </article>

      {showAccessoryBlock ? (
        <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Trabajos accesorios</p>
                <h3>Bloque fuera del reclamo a la compañía</h3>
            </div>
            <div className="tag-row">
              <StatusBadge tone={item.budget.accessoryWorkEnabled === 'SI' ? 'info' : 'danger'}>
                {item.budget.accessoryWorkEnabled === 'SI' ? 'Activo' : 'Sin extras'}
              </StatusBadge>
              <button className="secondary-button" onClick={addAccessoryWork} type="button">Agregar trabajo accesorio</button>
            </div>
          </div>

          <div className="form-grid three-columns compact-grid">
            <ToggleField label="Hay trabajos accesorios" onChange={(value) => updateBudget((draft) => { draft.budget.accessoryWorkEnabled = value; })} value={item.budget.accessoryWorkEnabled || 'NO'} />
            <DataField label="Total accesorio" onChange={() => {}} readOnly value={accessoryTotal} />
            <DataField label="Impacta compañía" onChange={() => {}} readOnly value="No, queda separado" />
          </div>

          {item.budget.accessoryWorkEnabled === 'SI' ? (
            <div className="budget-lines">
              {(item.budget.accessoryWorks || []).map((work) => (
                <div className="budget-line" key={work.id}>
                  <DataField label="Detalle" onChange={(value) => updateBudget((draft) => { const target = draft.budget.accessoryWorks.find((entry) => entry.id === work.id); target.detail = value; })} value={work.detail} />
                  <DataField label="Monto" onChange={(value) => updateBudget((draft) => { const target = draft.budget.accessoryWorks.find((entry) => entry.id === work.id); target.amount = value; })} value={work.amount} />
                   {isThirdPartyClaimCase(item) ? <ToggleField label="Incluye reemplazo" onChange={(value) => updateBudget((draft) => { const target = draft.budget.accessoryWorks.find((entry) => entry.id === work.id); target.includesReplacement = value; if (value !== 'SI') { target.replacementPiece = ''; target.replacementAmount = ''; } })} value={work.includesReplacement || 'NO'} /> : <DataField label="Cobro" onChange={() => {}} readOnly value="Cliente" />}
                   {isThirdPartyClaimCase(item) && work.includesReplacement === 'SI' ? <DataField label="Pieza reemplazo" onChange={(value) => updateBudget((draft) => { const target = draft.budget.accessoryWorks.find((entry) => entry.id === work.id); target.replacementPiece = value; })} value={work.replacementPiece || ''} /> : null}
                   {isThirdPartyClaimCase(item) && work.includesReplacement === 'SI' ? <DataField label="Monto reemplazo" onChange={(value) => updateBudget((draft) => { const target = draft.budget.accessoryWorks.find((entry) => entry.id === work.id); target.replacementAmount = value; })} value={work.replacementAmount || ''} /> : null}
                   {isThirdPartyClaimCase(item) ? <DataField label="Cobro" onChange={() => {}} readOnly value="Cliente / tramo particular" /> : null}
                  <button className="ghost-button" onClick={() => removeAccessoryWork(work.id)} type="button">Quitar</button>
                </div>
              ))}
            </div>
          ) : null}

          <label className="field">
            <span>Anotaciones accesorios</span>
            <textarea onChange={(event) => updateBudget((draft) => { draft.budget.accessoryNotes = event.target.value; })} value={item.budget.accessoryNotes || ''} />
          </label>
        </article>
      ) : null}

      <article className="card inner-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Cierre económico</p>
            <h3>Totales y condiciones para emitir</h3>
          </div>
        </div>

        <div className="form-grid three-columns compact-grid">
          <DataField label="Fecha cotización repuestos" onChange={(value) => updateBudget((draft) => { draft.budget.partsQuotedDate = value; })} type="date" value={item.budget.partsQuotedDate} />
          <DataField label="Proveedor repuestos" onChange={(value) => updateBudget((draft) => { draft.budget.partsProvider = value; })} value={item.budget.partsProvider} />
          <DataField label="Dias de trabajo estimados" onChange={(value) => updateBudget((draft) => { draft.budget.estimatedWorkDays = value; })} type="number" value={item.budget.estimatedWorkDays} />
          <DataField label="Monto minimo cierre MO" inputMode="numeric" onChange={(value) => updateBudget((draft) => { draft.budget.minimumLaborClose = value; })} value={item.budget.minimumLaborClose} />
          <DataField label="Mano de obra s/IVA" inputMode="numeric" onChange={(value) => updateBudget((draft) => { draft.budget.laborWithoutVat = value; })} value={item.budget.laborWithoutVat} />
          <DataField label="IVA 21% MO" onChange={() => {}} readOnly value={item.computed.laborVat} />
        </div>

        <label className="field">
          <span>Observaciones internas</span>
          <textarea onChange={(event) => updateBudget((draft) => { draft.budget.observations = event.target.value; })} value={item.budget.observations} />
        </label>

        <div className="budget-totals-stack">
          <div className="budget-subtotals-grid">
            <article className="summary-chip budget-total-card">
              <span>Repuestos</span>
              <strong>{money(item.computed.partsTotal)}</strong>
            </article>
            <article className="summary-chip budget-total-card">
              <span>MO s/IVA</span>
              <strong>{money(item.computed.laborWithoutVat)}</strong>
            </article>
            <article className="summary-chip budget-total-card">
              <span>IVA 21%</span>
              <strong>{money(item.computed.laborVat)}</strong>
            </article>
            <article className="summary-chip budget-total-card">
              <span>MO c/IVA</span>
              <strong>{money(item.computed.laborWithVat)}</strong>
            </article>
          </div>

          <article className="summary-chip budget-total-card budget-total-card-emphasis budget-total-summary">
            <span>Total presupuesto</span>
            <strong>{money(item.computed.budgetTotalWithVat)}</strong>
          </article>
        </div>

        <div className="budget-actions-row">
          <button className="primary-button" disabled={!item.computed.canGenerateBudget} onClick={generateBudget} type="button">Generar presupuesto</button>
        </div>

        <div className="budget-ready-panel budget-ready-panel-compact">
          <StatusBadge tone={budgetStatusTone}>{budgetStatusLabel}</StatusBadge>
          <small>{budgetHelperCopy}</small>
        </div>
      </article>

      {previewMedia ? (
        <div className="media-overlay" onClick={() => setPreviewMedia(null)} role="presentation">
          <div aria-label={`Vista ampliada de ${previewMedia.label}`} aria-modal="true" className="media-modal" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="media-modal-head">
              <div>
                <strong>{previewMedia.label}</strong>
                <p>{previewMedia.description || (previewMedia.type === 'video' ? 'Video adjunto desde Ficha Tecnica.' : 'Foto adjunta desde Ficha Tecnica.')}</p>
              </div>
              <button className="ghost-button" onClick={() => setPreviewMedia(null)} type="button">Cerrar</button>
            </div>

            {previewMedia.type === 'video' ? (
              currentPreviewBroken ? (
                <div className="empty-media" role="status">
                  El archivo no se pudo previsualizar. Abrilo en una pestaña nueva para revisar el adjunto original.
                </div>
              ) : (
                <video controls onError={() => markPreviewFailed(previewMedia.id)} src={previewMedia.url} />
              )
            ) : (
              currentPreviewBroken ? (
                <div className="empty-media" role="status">
                  La imagen no cargó en la previsualización. Usá "Abrir archivo" para validarla igual.
                </div>
              ) : (
                <img alt={previewMedia.label} onError={() => markPreviewFailed(previewMedia.id)} src={previewMedia.url} />
              )
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
