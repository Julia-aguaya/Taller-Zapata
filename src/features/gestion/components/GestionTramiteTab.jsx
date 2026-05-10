import DataField from '../../../components/ui/DataField';
import SelectField from '../../../components/ui/SelectField';
import StatusBadge from '../../../components/ui/StatusBadge';
import ToggleField from '../../../components/ui/ToggleField';
import {
  isAgendaTaskResolved,
  normalizeAgendaTask,
  setAgendaTaskResolved,
  setAgendaTaskStatus,
  getAgendaTaskDueMeta,
  getAgendaStatusLabel,
  getAgendaPriorityLabel,
} from '../../cases/lib/caseAgendaHelpers';
import {
  getFolderDisplayName,
  isCleasCase,
  isFranchiseRecoveryCase,
  isThirdPartyLawyerCase,
  isThirdPartyWorkshopCase,
  isTodoRiesgoCase,
} from '../../cases/lib/caseDomainCheckers';
import { getCatalogEntries, getCatalogSelectOptions, resolveCatalogCode } from '../../cases/lib/caseCatalogHelpers';
import { formatDate } from '../../cases/lib/caseFormatters';
import {
  CLEAS_DICTAMEN_OPTIONS,
  CLEAS_PAYMENT_STATUS_OPTIONS,
  CLEAS_SCOPE_OPTIONS,
  FRANCHISE_CLIENT_PAYMENT_STATUS_OPTIONS,
  FRANCHISE_MANAGER_OPTIONS,
  FRANCHISE_RECOVERY_DICTAMEN_OPTIONS,
  LAWYER_GENERAL_DOC_CATEGORY_OPTIONS,
  OWNERSHIP_PERCENTAGE_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  THIRD_PARTY_PARTS_PROVIDER_OPTIONS,
  TODO_RIESGO_ASSIGNABLE_USERS,
  TODO_RIESGO_DICTAMEN_OPTIONS,
  TODO_RIESGO_DOC_CATEGORY_OPTIONS,
  TODO_RIESGO_FRANCHISE_STATUS_OPTIONS,
  TODO_RIESGO_INSURANCE_OPTIONS,
  TODO_RIESGO_MODALITY_OPTIONS,
  TODO_RIESGO_QUOTE_STATUS_OPTIONS,
  TODO_RIESGO_RECOVERY_OPTIONS,
} from '../constants/gestionOptions';
import {
  createThirdPartyParticipant,
  createTodoRiskDocument,
  createTodoRiskTask,
} from '../../cases/lib/caseFactories';
import { getStatusTone, money, numberValue } from '../lib/gestionUtils';

export default function GestionTramiteTab({ item, updateCase, flash, insuranceCatalogs = null, allCases = [] }) {
  const todoRisk = item.todoRisk;
  const thirdParty = item.thirdParty;
  const lawyer = item.lawyer;
  const franchiseRecovery = item.franchiseRecovery;
  const isThirdParty = isThirdPartyWorkshopCase(item);
  const isThirdPartyLawyer = isThirdPartyLawyerCase(item);
  const isFranchiseRecovery = isFranchiseRecoveryCase(item);
  const isCleas = isCleasCase(item);
  const canProgressFromPresentation = item.computed.todoRisk?.canProgressFromPresentation ?? false;
  const canCompleteProcessingCore = item.computed.todoRisk?.canCompleteProcessingCore ?? false;
  const agendaPendingCount = todoRisk?.processing?.agenda?.filter((task) => !isAgendaTaskResolved(task)).length ?? 0;
  const processingLocked = isCleas
    ? !canProgressFromPresentation || item.computed.todoRisk?.noRepairNeeded
    : !canProgressFromPresentation;
  const isFranchiseFlow = todoRisk?.processing?.cleasScope === 'Sobre franquicia';
  const isDamageTotal = todoRisk?.processing?.cleasScope === 'Sobre daño total';
  const dictamen = todoRisk?.processing?.dictamen || 'Pendiente';
  const modalityOptions = getCatalogSelectOptions(insuranceCatalogs, 'modalityCodes', TODO_RIESGO_MODALITY_OPTIONS);
  const opinionOptions = getCatalogSelectOptions(insuranceCatalogs, 'opinionCodes', isCleas ? CLEAS_DICTAMEN_OPTIONS : TODO_RIESGO_DICTAMEN_OPTIONS);
  const quotationStatusOptions = getCatalogSelectOptions(insuranceCatalogs, 'quotationStatusCodes', TODO_RIESGO_QUOTE_STATUS_OPTIONS);
  const franchiseStatusOptions = getCatalogSelectOptions(insuranceCatalogs, 'franchiseStatusCodes', TODO_RIESGO_FRANCHISE_STATUS_OPTIONS);
  const franchiseRecoveryTypeOptions = getCatalogSelectOptions(insuranceCatalogs, 'franchiseRecoveryTypeCodes', TODO_RIESGO_RECOVERY_OPTIONS);
  const franchiseOpinionOptions = getCatalogSelectOptions(insuranceCatalogs, 'franchiseOpinionCodes', TODO_RIESGO_DICTAMEN_OPTIONS);
  const cleasScopeOptions = getCatalogSelectOptions(insuranceCatalogs, 'cleasScopeCodes', CLEAS_SCOPE_OPTIONS);
  const paymentStatusOptions = getCatalogSelectOptions(insuranceCatalogs, 'paymentStatusCodes', CLEAS_PAYMENT_STATUS_OPTIONS);

  const addDocument = () => {
    updateCase((draft) => {
      draft.todoRisk.documentation.items.push(createTodoRiskDocument());
    });
  };

  const addAgendaTask = () => {
    updateCase((draft) => {
      draft.todoRisk.processing.agenda.push(createTodoRiskTask({
        sourceArea: 'Gestión del trámite',
        sourceLabel: 'Gestión del trámite',
        relatedTab: 'tramite',
        linkedCaseId: draft.id,
        linkedCaseCode: draft.code,
      }));
    });
  };

  if (isFranchiseRecovery) {
    const compatibleFolders = allCases.filter(
      (entry) => entry.id !== item.id && isTodoRiesgoCase(entry) && entry.todoRisk?.franchise?.status !== 'Sin Franquicia',
    );
    const linkedCase = compatibleFolders.find((entry) => entry.code === franchiseRecovery.associatedFolderCode) || null;
    const repairEnabled = franchiseRecovery.enablesRepair !== 'NO';
    const franchiseComputed = item.computed.franchiseRecovery || {};
    const showClientRecoveryBlock = franchiseComputed.dictamenShared || (!repairEnabled && franchiseRecovery.recoverToClient === 'SI');

    const handleLinkedFolderChange = (folderCode) => {
      updateCase((draft) => {
        const linkedFolder = compatibleFolders.find((entry) => entry.code === folderCode);

        draft.franchiseRecovery.associatedFolderCode = folderCode;
        draft.franchiseRecovery.associatedCaseId = linkedFolder?.id || '';

        if (!linkedFolder) {
          return;
        }

        if (!draft.claimNumber) draft.claimNumber = linkedFolder.claimNumber || '';
        if (!draft.customer.phone) draft.customer.phone = linkedFolder.customer.phone || '';
        if (!draft.customer.email) draft.customer.email = linkedFolder.customer.email || '';
        if (!draft.vehicle.year) draft.vehicle.year = linkedFolder.vehicle.year || '';
        if (!draft.vehicle.color) draft.vehicle.color = linkedFolder.vehicle.color || '';
        if (!draft.vehicle.chassis) draft.vehicle.chassis = linkedFolder.vehicle.chassis || '';
        if (!draft.vehicle.engine) draft.vehicle.engine = linkedFolder.vehicle.engine || '';
        if (!draft.vehicle.transmission) draft.vehicle.transmission = linkedFolder.vehicle.transmission || '';
        if (!draft.vehicle.mileage) draft.vehicle.mileage = linkedFolder.vehicle.mileage || '';
        if (!draft.budget.workshop) draft.budget.workshop = linkedFolder.budget.workshop || '';
        draft.franchiseRecovery.agreementAmount = linkedFolder.todoRisk?.processing?.agreedAmount || draft.franchiseRecovery.agreementAmount || '';
        if (!draft.franchiseRecovery.amountToRecover) draft.franchiseRecovery.amountToRecover = linkedFolder.todoRisk?.franchise?.amount || '';
        if (draft.franchiseRecovery.dictamen === 'Culpa compartida' && !draft.franchiseRecovery.clientResponsibilityAmount) {
          const baseAmount = numberValue(linkedFolder.todoRisk?.processing?.agreedAmount || draft.franchiseRecovery.amountToRecover || 0);
          if (baseAmount > 0) {
            draft.franchiseRecovery.clientResponsibilityAmount = String(Math.round(baseAmount * 0.5));
          }
        }
      });

      if (folderCode) {
        const linkedFolder = compatibleFolders.find((entry) => entry.code === folderCode);
        flash(`Carpeta ${folderCode} vinculada${linkedFolder?.todoRisk?.insurance?.company ? ` con base ${linkedFolder.todoRisk.insurance.company}` : ''}.`);
      }
    };

    return (
      <div className="tab-layout todo-risk-layout pagos-tab-layout">
        <article className="card inner-card franchise-management-card">
          <div className="section-head small-gap">
            <div>
              <p className="eyebrow">Gestión del trámite</p>
              <h3>Recupero de franquicia</h3>
            </div>
            <span className="tramite-identity-badge is-franchise">Franquicia</span>
          </div>

          <div className={`form-grid ${repairEnabled ? 'four-columns' : 'five-columns'} compact-grid`}>
            <SelectField
              label="Gestiona"
              onChange={(value) => updateCase((draft) => { draft.franchiseRecovery.managerType = value; })}
              options={FRANCHISE_MANAGER_OPTIONS}
              value={franchiseRecovery.managerType}
            />
            <SelectField
              label="Carpeta asociada"
              onChange={handleLinkedFolderChange}
              options={compatibleFolders.map((entry) => ({
                value: entry.code,
                label: `${entry.code} - ${getFolderDisplayName(entry)} · ${entry.vehicle.brand} ${entry.vehicle.model}`,
              }))}
              placeholder="Seleccioná Todo Riesgo"
              value={franchiseRecovery.associatedFolderCode}
            />
            <SelectField
              label="Dictamen"
              onChange={(value) => updateCase((draft) => {
                draft.franchiseRecovery.dictamen = value;

                if (value === 'Culpa compartida') {
                  const baseAmount = numberValue(draft.franchiseRecovery.agreementAmount || draft.franchiseRecovery.amountToRecover || 0);
                  if (!draft.franchiseRecovery.clientResponsibilityAmount && baseAmount > 0) {
                    draft.franchiseRecovery.clientResponsibilityAmount = String(Math.round(baseAmount * 0.5));
                  }
                  if (draft.franchiseRecovery.enablesRepair === 'NO') {
                    draft.franchiseRecovery.recoverToClient = 'SI';
                  }
                }
              })}
              options={FRANCHISE_RECOVERY_DICTAMEN_OPTIONS}
              value={franchiseRecovery.dictamen}
            />
            <DataField
              label="Monto a recuperar"
              onChange={(value) => updateCase((draft) => { draft.franchiseRecovery.amountToRecover = value; })}
              value={franchiseRecovery.amountToRecover}
            />
            <ToggleField
              label="Habilita reparación"
              onChange={(value) => updateCase((draft) => {
                draft.franchiseRecovery.enablesRepair = value;
                if (value === 'NO') {
                  draft.franchiseRecovery.recoverToClient = draft.franchiseRecovery.recoverToClient || 'NO';
                  draft.repair.parts = [];
                  draft.repair.turno = { date: '', estimatedDays: '', state: 'Pendiente programar', notes: '' };
                  draft.repair.ingreso = { realDate: '', hasObservation: 'NO', observation: '', items: [] };
                  draft.repair.egreso = {
                    date: '',
                    notes: '',
                    shouldReenter: 'NO',
                    reentryDate: '',
                    reentryEstimatedDays: '',
                    reentryState: 'Pendiente programar',
                    reentryNotes: '',
                    definitiveExit: false,
                    repairedPhotos: false,
                    repairedMedia: [],
                  };
                } else {
                  draft.franchiseRecovery.recoverToClient = 'NO';
                }
              })}
              value={franchiseRecovery.enablesRepair}
            />
            {!repairEnabled ? (
              <ToggleField
                label="Recupero a cliente"
                onChange={(value) => updateCase((draft) => {
                  draft.franchiseRecovery.recoverToClient = value;

                  if (value !== 'SI' && draft.franchiseRecovery.dictamen !== 'Culpa compartida') {
                    draft.franchiseRecovery.clientResponsibilityAmount = '';
                    draft.franchiseRecovery.clientRecoveryStatus = 'Pendiente';
                    draft.franchiseRecovery.clientRecoveryDate = '';
                  }
                })}
                value={franchiseRecovery.recoverToClient}
              />
            ) : null}
          </div>

          <div className={`inline-alert ${repairEnabled ? 'info-banner' : 'success-banner'} franchise-flow-banner`}>
            {repairEnabled
              ? 'Habilita reparación = SI: se activan Presupuesto y Gestión reparación con la base existente del taller.'
              : 'Habilita reparación = NO: se anulan las solapas operativas de reparación y queda disponible Recupero a cliente.'}
          </div>

          {franchiseComputed.hasEconomicAlert ? (
            <div className="inline-alert danger-banner franchise-flow-banner">
              Recupero económico en alerta: {money(franchiseComputed.amountToRecover || 0)} queda por debajo del monto acordado {money(franchiseComputed.agreementAmount || 0)}. Diferencia: {money(franchiseComputed.economicGapAmount || 0)}.
            </div>
          ) : null}

          {franchiseComputed.dictamenShared ? (
            <div className="inline-alert info-banner franchise-flow-banner">
              Dictamen compartido: se refleja 50/50 con {money(franchiseComputed.clientResponsibilityAmount || 0)} a cargo del cliente y {money(franchiseComputed.companyExpectedAmount || 0)} a cargo de la compañía.
            </div>
          ) : null}

          {showClientRecoveryBlock ? (
            <div className="franchise-client-recovery-block">
              <div className="section-head small-gap">
                <div>
                  <p className="eyebrow">Recupero a cliente</p>
                  <h3>Campos mínimos visibles</h3>
                </div>
                <StatusBadge tone={franchiseRecovery.clientRecoveryStatus === 'Cancelado' ? 'success' : 'info'}>
                  {franchiseRecovery.clientRecoveryStatus}
                </StatusBadge>
              </div>

              <div className="form-grid three-columns compact-grid">
                <DataField
                  label="Monto cliente"
                  onChange={(value) => updateCase((draft) => { draft.franchiseRecovery.clientResponsibilityAmount = value; })}
                  value={franchiseRecovery.clientResponsibilityAmount}
                />
                <SelectField
                  label="Estado cobro cliente"
                  onChange={(value) => updateCase((draft) => { draft.franchiseRecovery.clientRecoveryStatus = value; })}
                  options={FRANCHISE_CLIENT_PAYMENT_STATUS_OPTIONS}
                  value={franchiseRecovery.clientRecoveryStatus}
                />
                <DataField
                  label="Fecha cobro cliente"
                  onChange={(value) => updateCase((draft) => { draft.franchiseRecovery.clientRecoveryDate = value; })}
                  type="date"
                  value={franchiseRecovery.clientRecoveryDate}
                />
              </div>
            </div>
          ) : null}

          {franchiseRecovery.managerType === 'Abogado' ? (
            <div className="inline-alert info-banner franchise-flow-banner">
              Gestión por abogado visible en Fase 1: queda registrada la modalidad, pero la integración completa con la solapa Abogado se deja para Fase 2.
            </div>
          ) : null}
        </article>

        <article className="card inner-card franchise-link-card">
          <div className="section-head small-gap">
            <div>
              <h3>Carpeta vinculada</h3>
              <p className="muted">Solo se listan carpetas compatibles de Todo Riesgo con franquicia activa.</p>
            </div>
            <StatusBadge tone={linkedCase ? 'success' : 'danger'}>{linkedCase ? linkedCase.code : 'Sin vínculo'}</StatusBadge>
          </div>

          {linkedCase ? (
            <>
              <div className="form-grid four-columns compact-grid franchise-data-grid">
                <DataField label="Cliente base" onChange={() => {}} readOnly value={getFolderDisplayName(linkedCase)} />
                <DataField label="Vehículo base" onChange={() => {}} readOnly value={`${linkedCase.vehicle.brand} ${linkedCase.vehicle.model} - ${linkedCase.vehicle.plate}`} />
                <DataField label="Cía. aseguradora" onChange={() => {}} readOnly value={linkedCase.todoRisk.insurance.company || '-'} />
                <DataField label="N° siniestro" onChange={() => {}} readOnly value={linkedCase.claimNumber || '-'} />
                <DataField label="Fecha siniestro" onChange={() => {}} readOnly type="date" value={linkedCase.todoRisk.incident.date || ''} />
                <DataField label="Lugar" onChange={() => {}} readOnly value={linkedCase.todoRisk.incident.location || '-'} />
                <DataField label="Franquicia origen" onChange={() => {}} readOnly value={money(linkedCase.todoRisk.franchise.amount || 0)} />
                <DataField label="Recupero original" onChange={() => {}} readOnly value={linkedCase.todoRisk.franchise.recoveryType || 'Pendiente'} />
              </div>

              <label className="field">
                <span>Dinámica heredada</span>
                <textarea readOnly value={linkedCase.todoRisk.incident.dynamics || ''} />
              </label>
            </>
          ) : (
            <div className="tramite-type-empty" role="status">
              <strong>Todo Riesgo</strong>
              <p>Seleccioná una carpeta compatible para vincular franquicia, compañía y datos básicos del siniestro.</p>
            </div>
          )}
        </article>
      </div>
    );
  }

  if (isThirdPartyLawyer) {
    const participants = thirdParty.claim.thirdParties;

    const addParticipant = () => {
      updateCase((draft) => {
        draft.thirdParty.claim.thirdParties.push(createThirdPartyParticipant());
      });
    };

    const addGeneralDocument = () => {
      updateCase((draft) => {
        draft.thirdParty.claim.documents.push(createTodoRiskDocument());
      });
    };

    return (
      <div className="tab-layout todo-risk-layout pagos-tab-layout">
        <article className="card inner-card todo-risk-summary-card">
          <div className="section-head small-gap">
            <div>
              <p className="eyebrow">Gestión del trámite</p>
              <h3>Base heredada del taller + control legal</h3>
            </div>
            <StatusBadge tone={item.computed.tabs.tramite === 'resolved' ? 'success' : 'info'}>
              {item.computed.tramiteStatus}
            </StatusBadge>
          </div>
          <div className="form-grid five-columns compact-grid">
            <DataField label="Fecha del siniestro" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.date = value; })} type="date" value={todoRisk.incident.date} />
            <DataField label="Prescripción del trámite" onChange={() => {}} readOnly type="date" value={item.computed.lawyer.prescriptionDate} />
            <DataField label="Fecha presentado" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.presentedDate = value; })} type="date" value={thirdParty.claim.presentedDate} />
            <DataField label="Referencia / reclamo" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.claimReference = value; })} value={thirdParty.claim.claimReference} />
            <ToggleField label="Repara vehículo" onChange={(value) => updateCase((draft) => {
              draft.lawyer.repairVehicle = value;
              if (value === 'NO') {
                draft.repair.turno.date = '';
                draft.repair.turno.estimatedDays = '';
                draft.repair.turno.state = 'Pendiente programar';
                draft.repair.egreso.date = '';
                draft.repair.egreso.definitiveExit = false;
              }
            })} value={lawyer.repairVehicle} />
          </div>
          {lawyer.repairVehicle === 'NO' ? <div className="inline-alert info-banner">Se anula la reparación normal: el estado superior pasa a <strong>No debe repararse</strong> y Gestión reparación queda resuelta.</div> : null}
          {!todoRisk.incident.date ? <div className="inline-alert danger-banner">Sin fecha del siniestro no se calcula la prescripción.</div> : null}
        </article>

        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Datos del siniestro</h3>
            <StatusBadge tone={participants.length ? 'info' : 'danger'}>{participants.length} tercero(s)</StatusBadge>
          </div>
          <div className="form-grid three-columns compact-grid">
            <DataField label="Cía. del 3ero" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdCompany = value; })} value={thirdParty.claim.thirdCompany} />
            <DataField label="Lugar de ocurrencia" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.location = value; })} value={todoRisk.incident.location} />
            <DataField label="Hora" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.time = value; })} value={todoRisk.incident.time} />
          </div>
          <label className="field">
            <span>Dinámica del siniestro</span>
            <textarea onChange={(event) => updateCase((draft) => { draft.todoRisk.incident.dynamics = event.target.value; })} value={todoRisk.incident.dynamics} />
          </label>
          <div className="budget-lines">
            {participants.map((participant, index) => (
              <div className="budget-line budget-line-extended" key={participant.id}>
                <div className="budget-line-header">
                  <strong>{index === 0 ? 'Tercero principal' : `Tercero ${index + 1}`}</strong>
                  <small>Se reutiliza la misma estructura base que Taller.</small>
                </div>
                <DataField label="Conductor 3ero" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].driverName = value; })} value={participant.driverName} />
                <DataField label="DNI conductor" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].driverDocument = value; })} value={participant.driverDocument} />
                <DataField label="Dominio" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].plate = value.toUpperCase(); })} value={participant.plate} />
                <DataField label="Marca" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].brand = value; })} value={participant.brand} />
                <DataField label="Modelo" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].model = value; })} value={participant.model} />
                <DataField label="Domicilio" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].address = value; })} value={participant.address} />
              </div>
            ))}
          </div>
          <button className="secondary-button" onClick={addParticipant} type="button">+ Agregar otro 3ero</button>
        </article>

        <article className="card inner-card">
          <div className="section-head">
            <div>
              <h3>Documentación general</h3>
              <p className="muted">Separada del expediente judicial y visible en esta solapa.</p>
            </div>
            <div className="tag-row">
              <button className="secondary-button" onClick={addGeneralDocument} type="button">Agregar ítem</button>
              <button className="secondary-button" onClick={() => flash('Descargar todo: se agrupará la documentación general del reclamo.')} type="button">Descargar todo</button>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table compact-table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Tipo archivo / nombre</th>
                  <th>Fecha de carga</th>
                  <th>Observaciones</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {thirdParty.claim.documents.map((doc) => (
                  <tr key={doc.id}>
                    <td><SelectField label="Categoría" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.claim.documents.find((entry) => entry.id === doc.id); target.category = value; })} options={LAWYER_GENERAL_DOC_CATEGORY_OPTIONS} value={doc.category} /></td>
                    <td><DataField label="Nombre" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.claim.documents.find((entry) => entry.id === doc.id); target.name = value; })} value={doc.name} /></td>
                    <td><DataField label="Fecha" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.claim.documents.find((entry) => entry.id === doc.id); target.uploadedAt = value; })} type="date" value={doc.uploadedAt} /></td>
                    <td><DataField label="Notas" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.claim.documents.find((entry) => entry.id === doc.id); target.notes = value; })} value={doc.notes} /></td>
                    <td><button className="ghost-button" onClick={() => updateCase((draft) => { draft.thirdParty.claim.documents = draft.thirdParty.claim.documents.filter((entry) => entry.id !== doc.id); })} type="button">Quitar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    );
  }

  if (isThirdParty) {
    const participants = thirdParty.claim.thirdParties;
    const amountBelowMinimum = !item.computed.thirdParty.amountMeetsMinimum && item.computed.thirdParty.amountToInvoice > 0;

    const addParticipant = () => {
      updateCase((draft) => {
        draft.thirdParty.claim.thirdParties.push(createThirdPartyParticipant());
      });
    };

    return (
      <div className="tab-layout todo-risk-layout pagos-tab-layout">
        <article className="card inner-card todo-risk-summary-card">
          <div className="section-head small-gap">
            <div>
              <p className="eyebrow">Gestión del trámite</p>
              <h3>Base operativa Fase 2</h3>
            </div>
            <StatusBadge tone={item.computed.todoRisk.managementAdvanced ? 'info' : 'danger'}>
              {item.computed.todoRisk.managementAdvanced ? 'Base completa' : 'Faltan datos base'}
            </StatusBadge>
          </div>
          <div className="form-grid five-columns compact-grid">
            <DataField label="Fecha del siniestro" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.date = value; })} type="date" value={todoRisk.incident.date} />
            <DataField label="Prescripción del trámite" onChange={() => {}} readOnly type="date" value={item.computed.todoRisk.prescriptionDate} />
            <DataField label="Fecha presentado" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.presentedDate = value; })} type="date" value={thirdParty.claim.presentedDate} />
            <DataField label="Días tramitando" onChange={() => {}} readOnly value={item.computed.todoRisk.daysProcessing} />
            <DataField label="Referencia / reclamo" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.claimReference = value; })} value={thirdParty.claim.claimReference} />
          </div>
          {!todoRisk.incident.date ? <div className="inline-alert danger-banner">Sin fecha del siniestro no se puede calcular la prescripción a 3 años.</div> : null}
          <div className="budget-ready-panel budget-ready-panel-compact">
            <StatusBadge tone={participants.length ? 'info' : 'danger'}>{participants.length} tercero(s) cargado(s)</StatusBadge>
            <small>Se mantiene la base de Fase 1 y ahora Tramitación toma mínimos, repuestos y saldo final desde Presupuesto y Gestión reparación.</small>
          </div>
        </article>

        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Datos del siniestro</h3>
            <StatusBadge tone={participants.length ? 'info' : 'danger'}>{participants.length} tercero(s)</StatusBadge>
          </div>
          <div className="form-grid three-columns compact-grid">
            <DataField label="Cía. del 3ero" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdCompany = value; })} value={thirdParty.claim.thirdCompany} />
            <DataField label="Lugar de ocurrencia" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.location = value; })} value={todoRisk.incident.location} />
            <DataField label="Hora" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.time = value; })} value={todoRisk.incident.time} />
          </div>
          <label className="field">
            <span>Dinámica del siniestro</span>
            <textarea onChange={(event) => updateCase((draft) => { draft.todoRisk.incident.dynamics = event.target.value; })} value={todoRisk.incident.dynamics} />
          </label>
          <div className="budget-lines">
            {participants.map((participant, index) => {
              const visibleOwners = participant.isOwner === 'NO'
                ? participant.owners.slice(0, participant.ownershipPercentage === '50%' ? 2 : 1)
                : [];

              return (
                <div className="budget-line budget-line-extended" key={participant.id}>
                  <div className="budget-line-header">
                    <strong>{index === 0 ? 'Tercero principal' : `Tercero ${index + 1}`}</strong>
                    <small>{participant.isOwner === 'SI' ? 'Conductor titular' : 'Conductor distinto del titular'}</small>
                  </div>
                  <DataField label="Conductor 3ero" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].driverName = value; })} value={participant.driverName} />
                  <DataField label="DNI conductor" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].driverDocument = value; })} value={participant.driverDocument} />
                  <DataField label="Dominio" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].plate = value.toUpperCase(); })} value={participant.plate} />
                  <DataField label="Marca" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].brand = value; })} value={participant.brand} />
                  <DataField label="Modelo" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].model = value; })} value={participant.model} />
                  <ToggleField label="Conductor es titular" onChange={(value) => updateCase((draft) => {
                    draft.thirdParty.claim.thirdParties[index].isOwner = value;
                    if (value !== 'NO') {
                      draft.thirdParty.claim.thirdParties[index].ownershipPercentage = '100%';
                    }
                  })} value={participant.isOwner} />
                  <SelectField disabled={participant.isOwner !== 'NO'} label="Porcentaje titularidad" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].ownershipPercentage = value; })} options={OWNERSHIP_PERCENTAGE_OPTIONS} value={participant.ownershipPercentage} />
                  <DataField label="Domicilio" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].address = value; })} value={participant.address} />
                  {visibleOwners.map((owner, ownerIndex) => (
                    <div className="nested-card summary-span-two" key={owner.id}>
                      <div className="section-head small-gap">
                        <h4>{ownerIndex === 0 ? 'Titular 3ero principal' : 'Otro titular 3ero'}</h4>
                      </div>
                      <div className="form-grid two-columns compact-grid">
                        <DataField label="Nombre" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].owners[ownerIndex].firstName = value; })} value={owner.firstName} />
                        <DataField label="Apellido" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].owners[ownerIndex].lastName = value; })} value={owner.lastName} />
                        <DataField label="Documento" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].owners[ownerIndex].document = value; })} value={owner.document} />
                        <DataField label="Localidad" onChange={(value) => updateCase((draft) => { draft.thirdParty.claim.thirdParties[index].owners[ownerIndex].locality = value; })} value={owner.locality || ''} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <button className="secondary-button" onClick={addParticipant} type="button">+ Agregar otro 3ero</button>
        </article>

        <article className="card inner-card">
          <div className="section-head small-gap">
            <div>
              <h3>Tramitación</h3>
              <p className="muted">Mínimos automáticos, proveedor de repuestos y saldo final del taller.</p>
            </div>
            <StatusBadge tone={amountBelowMinimum ? 'danger' : 'info'}>
              {amountBelowMinimum ? 'Aviso a administración pendiente' : 'Automático desde presupuesto'}
            </StatusBadge>
          </div>

          <div className="form-grid four-columns compact-grid">
            <DataField highlighted label="Mínimo MO" onChange={() => {}} readOnly value={item.computed.thirdParty.minimumLabor} />
            <DataField highlighted label="Lleva repuestos" onChange={() => {}} readOnly value={item.computed.hasReplacementParts ? 'SI' : 'NO'} />
            <DataField highlighted label="Mínimo repuestos" onChange={() => {}} readOnly value={item.computed.thirdParty.minimumParts} />
            <DataField highlighted label="Subtotal mejor cotización" onChange={() => {}} readOnly value={item.computed.thirdParty.subtotalBestQuote} />
            <SelectField
              label="Provee repuestos"
              onChange={(value) => updateCase((draft) => {
                draft.thirdParty.claim.partsProviderMode = value;
              })}
              options={THIRD_PARTY_PARTS_PROVIDER_OPTIONS}
              value={thirdParty.claim.partsProviderMode}
            />
            <DataField
              disabled={thirdParty.claim.partsProviderMode !== 'Provee Taller'}
              highlighted={thirdParty.claim.partsProviderMode === 'Provee Taller'}
              label="Total final repuestos"
              onChange={() => {}}
              readOnly
              value={item.computed.thirdParty.totalFinalParts}
            />
            <DataField highlighted invalid={amountBelowMinimum} label="A facturar Cía." onChange={() => {}} readOnly value={item.computed.thirdParty.amountToInvoice} />
            <DataField highlighted invalid={amountBelowMinimum || item.computed.thirdParty.finalInFavorTaller < 0} label="Final a favor Taller" onChange={() => {}} readOnly value={item.computed.thirdParty.finalInFavorTaller} />
          </div>

          {thirdParty.claim.partsProviderMode !== 'Provee Taller' ? (
            <div className="inline-alert info-banner">Total final repuestos queda solo de referencia: impacta en el saldo del taller únicamente cuando los repuestos los provee el taller.</div>
          ) : null}

          {amountBelowMinimum ? (
            <div className="inline-alert danger-banner third-party-admin-alert">
              <span>La cotización acordada / a facturar Cía. quedó por debajo del mínimo correspondiente ({money(item.computed.thirdParty.applicableMinimum)}). Se genera aviso al administrador.</span>
              <button className="secondary-button compact-button" onClick={() => flash(item.computed.thirdParty.adminAlerts[0] || 'Aviso al administrador: revisar cotización acordada por debajo del mínimo.')} type="button">Avisar administrador</button>
            </div>
          ) : null}
        </article>

      </div>
    );
  }

  return (
    <div className="tab-layout todo-risk-layout">
      <article className="card inner-card todo-risk-summary-card">
        <div className="section-head small-gap">
          <div>
            <p className="eyebrow">Gestión del trámite</p>
            <h3>{isCleas ? 'Secuencia CLEAS' : 'Secuencia Todo Riesgo'}</h3>
          </div>
          <StatusBadge tone={item.computed.todoRisk.managementAdvanced ? 'info' : 'danger'}>
            {item.computed.todoRisk.managementAdvanced ? 'Azul operativo' : 'Rojo con pendientes'}
          </StatusBadge>
        </div>

        <div className={`form-grid ${isCleas ? 'six-columns' : 'four-columns'} compact-grid`}>
          <DataField label="Fecha del siniestro" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.date = value; })} type="date" value={todoRisk.incident.date} />
          <DataField label="Prescripción del trámite" onChange={() => {}} readOnly type="date" value={item.computed.todoRisk.prescriptionDate} />
          <DataField disabled={!canCompleteProcessingCore} label="Fecha presentado" onChange={(value) => updateCase((draft) => {
            draft.todoRisk.processing.presentedDate = value;
            if (!value) {
              draft.todoRisk.processing.derivedToInspectionDate = '';
              draft.todoRisk.processing.modality = TODO_RIESGO_MODALITY_OPTIONS[0];
              draft.todoRisk.processing.quoteStatus = 'Pendiente';
              draft.todoRisk.processing.quoteDate = '';
              draft.todoRisk.processing.agreedAmount = '';
            }
          })} type="date" value={todoRisk.processing.presentedDate} />
          <DataField label="Días tramitando" onChange={() => {}} readOnly value={item.computed.todoRisk.daysProcessing} />
          {isCleas ? (
            <>
              <SelectField label="Cleas sobre" onChange={(value) => updateCase((draft) => {
                draft.todoRisk.processing.cleasScope = value;
                if (value !== 'Sobre franquicia') {
                  draft.todoRisk.processing.franchiseAmount = '';
                  draft.todoRisk.processing.clientChargeAmount = '';
                  draft.todoRisk.processing.clientChargeStatus = 'Pendiente';
                  draft.todoRisk.processing.clientChargeDate = '';
                  draft.todoRisk.processing.companyFranchisePaymentAmount = '';
                  draft.todoRisk.processing.companyFranchisePaymentStatus = 'Pendiente';
                  draft.todoRisk.processing.companyFranchisePaymentDate = '';
                }
              })} options={cleasScopeOptions} placeholder="Seleccioná" value={resolveCatalogCode(todoRisk.processing.cleasScope, getCatalogEntries(insuranceCatalogs, 'cleasScopeCodes'), CLEAS_SCOPE_OPTIONS) || todoRisk.processing.cleasScope} />
              <SelectField label="Dictamen" onChange={(value) => updateCase((draft) => {
                draft.todoRisk.processing.dictamen = value;
                if (value !== 'En contra') {
                  draft.todoRisk.processing.clientChargeStatus = 'Pendiente';
                  draft.todoRisk.processing.clientChargeDate = '';
                  draft.todoRisk.processing.companyFranchisePaymentStatus = 'Pendiente';
                  draft.todoRisk.processing.companyFranchisePaymentDate = '';
                }
              })} options={opinionOptions} value={resolveCatalogCode(dictamen, getCatalogEntries(insuranceCatalogs, 'opinionCodes'), CLEAS_DICTAMEN_OPTIONS) || dictamen} />
            </>
          ) : null}
        </div>

        {!todoRisk.incident.date ? <div className="inline-alert danger-banner">Sin fecha del siniestro no se habilita el avance operativo del trámite.</div> : null}
        {isCleas
          ? !todoRisk.processing.cleasScope
            ? <div className="inline-alert danger-banner">Primero definí si CLEAS va sobre franquicia o sobre daño total.</div>
            : null
          : !todoRisk.franchise.recoveryType
            ? <div className="inline-alert danger-banner">Primero definí Recupero en Franquicia; recién ahí se habilita la fecha de presentación.</div>
            : null}
        {isCleas && dictamen === 'Pendiente' ? <div className="inline-alert danger-banner">Con dictamen pendiente se muestra la carpeta, pero se bloquea inspección, cotización y avance operativo.</div> : null}
        {isCleas && item.computed.todoRisk.noRepairNeeded ? <div className="inline-alert info-banner">CLEAS sobre daño total con dictamen en contra: el caso se corta acá y no sigue reparación normal.</div> : null}
      </article>

      <article className="card inner-card">
        <div className="section-head small-gap">
          <h3>Datos del seguro</h3>
          <StatusBadge tone={todoRisk.insurance.company ? 'info' : 'danger'}>{todoRisk.insurance.company || 'Base pendiente'}</StatusBadge>
        </div>
        <div className="form-grid three-columns compact-grid">
          <SelectField label="Compañía" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.company = value; })} options={TODO_RIESGO_INSURANCE_OPTIONS} placeholder="Seleccioná" value={todoRisk.insurance.company} />
          <DataField label="N° póliza" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.policyNumber = value; })} value={todoRisk.insurance.policyNumber || ''} />
          <DataField label="N° certificado" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.certificateNumber = value; })} value={todoRisk.insurance.certificateNumber || ''} />
          {isCleas ? <DataField label="Cía. del 3ero" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.thirdCompany = value; })} value={todoRisk.insurance.thirdCompany || ''} /> : null}
          {isCleas ? <DataField label="N° de CLEAS" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.cleasNumber = value; })} value={todoRisk.insurance.cleasNumber || ''} /> : null}
          <DataField label="Tramitador/a" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.handlerName = value; })} value={todoRisk.insurance.handlerName} />
          <DataField label="Mail tramitador/a" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.handlerEmail = value; })} value={todoRisk.insurance.handlerEmail} />
          <DataField label="Tel. tramitador/a" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.handlerPhone = value; })} value={todoRisk.insurance.handlerPhone} />
          <DataField label="Inspector/a" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.inspectorName = value; })} value={todoRisk.insurance.inspectorName} />
          <DataField label="Mail inspector/a" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.inspectorEmail = value; })} value={todoRisk.insurance.inspectorEmail} />
          <DataField label="Tel. inspector/a" onChange={(value) => updateCase((draft) => { draft.todoRisk.insurance.inspectorPhone = value; })} value={todoRisk.insurance.inspectorPhone} />
          <DataField label="N° de siniestro" onChange={(value) => updateCase((draft) => { draft.claimNumber = value; })} value={item.claimNumber || ''} />
        </div>
        {!isCleas ? (
          <label className="field">
            <span>Detalle de cobertura</span>
            <textarea onChange={(event) => updateCase((draft) => { draft.todoRisk.insurance.coverageDetail = event.target.value; })} value={todoRisk.insurance.coverageDetail} />
          </label>
        ) : null}
      </article>

      <article className="card inner-card">
        <div className="section-head small-gap">
          <h3>Datos del siniestro</h3>
          <StatusBadge tone="info">No bloquea cierre total</StatusBadge>
        </div>
        <div className={`form-grid ${isCleas ? 'four-columns' : 'three-columns'} compact-grid`}>
          <DataField label="Lugar de ocurrencia" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.location = value; })} value={todoRisk.incident.location} />
          <DataField label="Hora" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.time = value; })} value={todoRisk.incident.time} />
          {isCleas ? <DataField label="Dominio del 3ero" onChange={(value) => updateCase((draft) => { draft.todoRisk.incident.thirdPartyPlate = value.toUpperCase(); })} value={todoRisk.incident.thirdPartyPlate || ''} /> : null}
        </div>
        <label className="field">
          <span>Dinámica del siniestro</span>
          <textarea onChange={(event) => updateCase((draft) => { draft.todoRisk.incident.dynamics = event.target.value; })} value={todoRisk.incident.dynamics} />
        </label>
        {isCleas ? (
          <label className="field">
            <span>Observaciones</span>
            <textarea onChange={(event) => updateCase((draft) => { draft.todoRisk.incident.observations = event.target.value; })} value={todoRisk.incident.observations || ''} />
          </label>
        ) : null}
      </article>

      {!isCleas ? (
        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Franquicia</h3>
            <StatusBadge tone={getStatusTone(todoRisk.franchise.status)}>{todoRisk.franchise.status}</StatusBadge>
          </div>
          <div className="form-grid four-columns compact-grid">
            <SelectField label="Estado" onChange={(value) => updateCase((draft) => { draft.todoRisk.franchise.status = value; })} options={franchiseStatusOptions} value={resolveCatalogCode(todoRisk.franchise.status, getCatalogEntries(insuranceCatalogs, 'franchiseStatusCodes'), TODO_RIESGO_FRANCHISE_STATUS_OPTIONS) || todoRisk.franchise.status} />
            <DataField label="Monto" onChange={(value) => updateCase((draft) => { draft.todoRisk.franchise.amount = value; })} value={todoRisk.franchise.amount} />
            <SelectField label="Recupero" onChange={(value) => updateCase((draft) => {
              draft.todoRisk.franchise.recoveryType = value;
              if (value !== 'Cía. del 3ero') draft.todoRisk.franchise.associatedCase = '';
              if (value !== 'Propia Cía.') draft.todoRisk.franchise.dictamen = '';
              if (!value) {
                draft.todoRisk.processing.presentedDate = '';
                draft.todoRisk.processing.derivedToInspectionDate = '';
                draft.todoRisk.processing.quoteStatus = 'Pendiente';
                draft.todoRisk.processing.quoteDate = '';
                draft.todoRisk.processing.agreedAmount = '';
              }
            })} options={franchiseRecoveryTypeOptions} placeholder="Seleccioná" value={resolveCatalogCode(todoRisk.franchise.recoveryType, getCatalogEntries(insuranceCatalogs, 'franchiseRecoveryTypeCodes'), TODO_RIESGO_RECOVERY_OPTIONS) || todoRisk.franchise.recoveryType} />
            <DataField disabled={todoRisk.franchise.recoveryType !== 'Cía. del 3ero'} label="Caso asociado" onChange={(value) => updateCase((draft) => { draft.todoRisk.franchise.associatedCase = value; })} value={todoRisk.franchise.associatedCase} />
            <SelectField disabled={todoRisk.franchise.recoveryType !== 'Propia Cía.'} label="Dictamen" onChange={(value) => updateCase((draft) => { draft.todoRisk.franchise.dictamen = value; })} options={franchiseOpinionOptions} placeholder="Seleccioná" value={resolveCatalogCode(todoRisk.franchise.dictamen, getCatalogEntries(insuranceCatalogs, 'franchiseOpinionCodes'), TODO_RIESGO_DICTAMEN_OPTIONS) || todoRisk.franchise.dictamen} />
            <ToggleField label="Cotización supera Franquicia" onChange={(value) => updateCase((draft) => {
              draft.todoRisk.franchise.exceedsFranchise = value;
              if (value !== 'NO') draft.todoRisk.franchise.recoveryAmount = '';
            })} value={todoRisk.franchise.exceedsFranchise} />
            <DataField disabled={todoRisk.franchise.exceedsFranchise !== 'NO'} label="Monto a recuperar" onChange={(value) => updateCase((draft) => { draft.todoRisk.franchise.recoveryAmount = value; })} value={todoRisk.franchise.recoveryAmount} />
          </div>
          <label className="field">
            <span>Anotaciones</span>
            <textarea onChange={(event) => updateCase((draft) => { draft.todoRisk.franchise.notes = event.target.value; })} value={todoRisk.franchise.notes} />
          </label>
        </article>
      ) : null}

      <article className="card inner-card">
        <div className="section-head">
          <div>
            <h3>Documentación</h3>
            <p className="muted">Categorías y carga del trámite.</p>
          </div>
          <div className="tag-row">
            <button className="secondary-button" onClick={addDocument} type="button">Agregar ítem</button>
            <button className="secondary-button" onClick={() => flash('Descargar todo: se agruparán los adjuntos del trámite en un archivo comprimido.') } type="button">Descargar todo</button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Tipo archivo / nombre</th>
                <th>Fecha de carga</th>
                <th>Observaciones</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {todoRisk.documentation.items.map((doc) => (
                <tr key={doc.id}>
                  <td><SelectField label="Categoría" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.documentation.items.find((entry) => entry.id === doc.id); target.category = value; })} options={TODO_RIESGO_DOC_CATEGORY_OPTIONS} value={doc.category} /></td>
                  <td><DataField label="Nombre" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.documentation.items.find((entry) => entry.id === doc.id); target.name = value; })} value={doc.name} /></td>
                  <td><DataField label="Fecha" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.documentation.items.find((entry) => entry.id === doc.id); target.uploadedAt = value; })} type="date" value={doc.uploadedAt} /></td>
                  <td><DataField label="Notas" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.documentation.items.find((entry) => entry.id === doc.id); target.notes = value; })} value={doc.notes} /></td>
                  <td><button className="ghost-button" onClick={() => updateCase((draft) => { draft.todoRisk.documentation.items = draft.todoRisk.documentation.items.filter((entry) => entry.id !== doc.id); })} type="button">Quitar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="card inner-card">
        <div className="section-head small-gap">
          <div>
            <h3>Tramitación</h3>
            <p className="muted">Cotización, autorización de repuestos y agenda simple.</p>
          </div>
          <StatusBadge tone={getStatusTone(item.computed.tramiteStatus)}>{item.computed.tramiteStatus}</StatusBadge>
        </div>

        <div className={`form-grid ${isCleas ? 'five-columns' : 'four-columns'} compact-grid`}>
          <DataField disabled={!canCompleteProcessingCore} label="Fecha presentado" onChange={(value) => updateCase((draft) => {
            draft.todoRisk.processing.presentedDate = value;
            if (!value) {
              draft.todoRisk.processing.derivedToInspectionDate = '';
              draft.todoRisk.processing.modality = TODO_RIESGO_MODALITY_OPTIONS[0];
              draft.todoRisk.processing.quoteStatus = 'Pendiente';
              draft.todoRisk.processing.quoteDate = '';
              draft.todoRisk.processing.agreedAmount = '';
            }
          })} type="date" value={todoRisk.processing.presentedDate} />
          <DataField disabled={processingLocked} label="Derivado a inspección" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.derivedToInspectionDate = value; })} type="date" value={todoRisk.processing.derivedToInspectionDate} />
          <SelectField disabled={processingLocked} label="Modalidad" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.modality = value; })} options={modalityOptions} value={resolveCatalogCode(todoRisk.processing.modality, getCatalogEntries(insuranceCatalogs, 'modalityCodes'), TODO_RIESGO_MODALITY_OPTIONS) || todoRisk.processing.modality} />
          <DataField label="Mínimo para cierre" onChange={() => {}} readOnly value={item.computed.todoRisk.minimumClosingAmount} />
          <DataField label="Lleva repuestos" onChange={() => {}} readOnly value={item.computed.hasReplacementParts ? 'SI' : 'NO'} />
          {isCleas ? <DataField label="Dictamen actual" onChange={() => {}} readOnly value={dictamen} /> : null}
          <SelectField disabled={processingLocked} label="Cotización" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.quoteStatus = value; })} options={quotationStatusOptions} value={resolveCatalogCode(todoRisk.processing.quoteStatus, getCatalogEntries(insuranceCatalogs, 'quotationStatusCodes'), TODO_RIESGO_QUOTE_STATUS_OPTIONS) || todoRisk.processing.quoteStatus} />
          <DataField disabled={processingLocked} label="Fecha cotización" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.quoteDate = value; })} type="date" value={todoRisk.processing.quoteDate} />
          <DataField disabled={processingLocked} invalid={todoRisk.processing.quoteStatus === 'Acordada' && !item.computed.todoRisk.amountMeetsMinimum} label="Monto acordado" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.agreedAmount = value; })} value={todoRisk.processing.agreedAmount} />
          {!isCleas ? <DataField label="Repuestos" onChange={() => {}} readOnly value={item.computed.todoRisk.partsAuthorization} /> : null}
          {isCleas && isFranchiseFlow ? <DataField disabled={processingLocked && dictamen !== 'En contra'} label="Monto de franquicia" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.franchiseAmount = value; })} value={todoRisk.processing.franchiseAmount || ''} /> : null}
          {isCleas && isFranchiseFlow && dictamen === 'En contra' ? <DataField label="A cargo del cliente" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.clientChargeAmount = value; })} placeholder="Definí monto manual" value={todoRisk.processing.clientChargeAmount || ''} /> : null}
          {isCleas && isFranchiseFlow && dictamen === 'En contra' ? <DataField label="Pago franquicia Cía." onChange={() => {}} readOnly value={item.computed.todoRisk.companyFranchisePaymentAmount} /> : null}
          <DataField label="Provee repuestos" onChange={() => {}} readOnly value={item.budget.partsProvider || 'Sin proveedor'} />
          <DataField label="A facturar Cía." onChange={() => {}} readOnly value={item.computed.todoRisk.amountToInvoice} />
          {isCleas && isFranchiseFlow && dictamen === 'En contra' ? <SelectField label="Estado pago cliente" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.clientChargeStatus = value; })} options={paymentStatusOptions} value={resolveCatalogCode(todoRisk.processing.clientChargeStatus, getCatalogEntries(insuranceCatalogs, 'paymentStatusCodes'), CLEAS_PAYMENT_STATUS_OPTIONS) || todoRisk.processing.clientChargeStatus} /> : null}
          {isCleas && isFranchiseFlow && dictamen === 'En contra' ? <DataField label="Fecha pago cliente" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.clientChargeDate = value; })} type="date" value={todoRisk.processing.clientChargeDate || ''} /> : null}
        </div>

        {!canProgressFromPresentation ? (
          <div className="inline-alert danger-banner">Hasta definir fecha de presentación y dictamen no se habilitan inspección, cotización ni acciones operativas ligadas al trámite.</div>
        ) : null}

        {todoRisk.processing.quoteStatus === 'Acordada' && !item.computed.todoRisk.amountMeetsMinimum ? (
          <div className="inline-alert danger-banner">El monto acordado debe ser igual o mayor al mínimo para cierre traído desde Presupuesto.</div>
        ) : null}
        {isCleas && isFranchiseFlow && dictamen === 'En contra' && !item.computed.todoRisk.clientChargeDefined ? (
          <div className="inline-alert danger-banner">El comprobante de referencia muestra este monto cargado de forma explícita: hasta definir "A cargo del cliente" no se deriva cuánto factura la compañía ni cuánto queda en pagos.</div>
        ) : null}
        {isCleas && isDamageTotal && dictamen === 'En contra' ? <div className="inline-alert info-banner">Este camino se considera cierre directo: no genera reparación normal ni campos de franquicia.</div> : null}
      </article>

      <article className="card inner-card">
        <div className="section-head small-gap todo-risk-agenda-head">
          <div>
            <h3>Agenda de tareas</h3>
            <p className="muted">Pendientes internos que impactan la completitud de Gestión del trámite.</p>
          </div>
          <div className="tag-row">
            <StatusBadge tone={agendaPendingCount ? 'danger' : 'success'}>
              {agendaPendingCount ? `${agendaPendingCount} pendiente(s)` : 'Sin pendientes'}
            </StatusBadge>
            <button className="secondary-button" onClick={addAgendaTask} type="button">Agregar tarea</button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>Tarea</th>
                <th>Descripción</th>
                <th>Fecha límite</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Responsable</th>
                <th>Hecho</th>
              </tr>
            </thead>
            <tbody>
              {todoRisk.processing.agenda.map((task) => {
                const normalizedTask = normalizeAgendaTask(task, { sourceArea: 'Gestión del trámite', sourceLabel: 'Gestión del trámite', relatedTab: 'tramite' });
                const dueMeta = getAgendaTaskDueMeta(normalizedTask.scheduledAt);

                return (
                  <tr className={`agenda-row is-${dueMeta.tone}`} key={task.id}>
                    <td><DataField label="Tarea" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.processing.agenda.find((entry) => entry.id === task.id); target.title = value; })} value={normalizedTask.title} /></td>
                    <td><DataField label="Descripción" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.processing.agenda.find((entry) => entry.id === task.id); target.description = value; })} value={normalizedTask.description} /></td>
                    <td>
                      <DataField label="Fecha límite" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.processing.agenda.find((entry) => entry.id === task.id); target.scheduledAt = value; })} type="date" value={normalizedTask.scheduledAt} />
                      <small>{dueMeta.label}</small>
                    </td>
                    <td><SelectField label="Prioridad" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.processing.agenda.find((entry) => entry.id === task.id); target.priority = value; })} options={TASK_PRIORITY_OPTIONS.map((value) => ({ value, label: getAgendaPriorityLabel(value) }))} value={normalizedTask.priority} /></td>
                    <td><SelectField label="Estado" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.processing.agenda.find((entry) => entry.id === task.id); setAgendaTaskStatus(target, value); })} options={TASK_STATUS_OPTIONS.map((value) => ({ value, label: getAgendaStatusLabel(value) }))} value={normalizedTask.status} /></td>
                    <td><SelectField label="Responsable" onChange={(value) => updateCase((draft) => { const target = draft.todoRisk.processing.agenda.find((entry) => entry.id === task.id); target.assignee = value; })} options={TODO_RIESGO_ASSIGNABLE_USERS} value={normalizedTask.assignee} /></td>
                    <td><input checked={normalizedTask.resolved} onChange={(event) => updateCase((draft) => { const target = draft.todoRisk.processing.agenda.find((entry) => entry.id === task.id); setAgendaTaskResolved(target, event.target.checked); })} type="checkbox" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

