import { useMemo, useState } from 'react';
import DataField from '../../../components/ui/DataField';
import SelectField from '../../../components/ui/SelectField';
import StatusBadge from '../../../components/ui/StatusBadge';
import ToggleField from '../../../components/ui/ToggleField';
import {
  getAgendaPriorityLabel,
  getAgendaPriorityTone,
  getAgendaStatusLabel,
  getAgendaTaskDueMeta,
  isAgendaTaskResolved,
  normalizeAgendaTask,
  setAgendaTaskResolved,
  setAgendaTaskStatus,
  todayIso,
} from '../../cases/lib/caseAgendaHelpers';
import { isThirdPartyLawyerCase } from '../../cases/lib/caseDomainCheckers';
import { getCatalogEntries, getCatalogSelectOptions, resolveCatalogCode } from '../../cases/lib/caseCatalogHelpers';
import { formatDate } from '../../cases/lib/caseFormatters';
import {
  LAWYER_CLOSE_BY_OPTIONS,
  LAWYER_EXPEDIENT_DOC_CATEGORY_OPTIONS,
  LAWYER_EXPENSE_PAID_BY_OPTIONS,
  LAWYER_GENERAL_DOC_CATEGORY_OPTIONS,
  LAWYER_INJURED_ROLE_OPTIONS,
  LAWYER_INSTANCE_OPTIONS,
  LAWYER_RECLAMA_OPTIONS,
  LAWYER_TRAMITA_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from '../constants/gestionOptions';
import {
  createLawyerClosureItem,
  createLawyerExpense,
  createLawyerInjured,
  createLawyerStatusUpdate,
  triggerDownload,
} from '../lib/gestionShared';
import { createTodoRiskDocument, createTodoRiskTask } from '../../cases/lib/caseFactories';

export default function AbogadoTab({ item, updateCase, flash, insuranceCatalogs = null }) {
  const legalProcessorOptions = getCatalogSelectOptions(insuranceCatalogs, 'legalProcessorCodes', LAWYER_TRAMITA_OPTIONS);
  const legalClaimantOptions = getCatalogSelectOptions(insuranceCatalogs, 'legalClaimantCodes', LAWYER_RECLAMA_OPTIONS);
  const legalInstanceOptions = getCatalogSelectOptions(insuranceCatalogs, 'legalInstanceCodes', LAWYER_INSTANCE_OPTIONS);
  const legalClosureOptions = getCatalogSelectOptions(insuranceCatalogs, 'legalClosureReasonCodes', LAWYER_CLOSE_BY_OPTIONS);
  const legalExpensePayerOptions = getCatalogSelectOptions(insuranceCatalogs, 'legalExpensePayerCodes', LAWYER_EXPENSE_PAID_BY_OPTIONS);
  if (!isThirdPartyLawyerCase(item)) {
    return null;
  }

  const includesInjuries = item.computed.lawyer.includesInjuries;
  const isJudicial = item.computed.lawyer.isJudicial;
  const expensesTotal = item.computed.lawyer.expensesTotal;
  const agendaPendingCount = item.lawyer.agenda.filter((task) => !isAgendaTaskResolved(task)).length;
  const statusUpdateCount = item.lawyer.statusUpdates.length;
  const instanceLabel = isJudicial ? 'Instancia judicial' : 'Instancia administrativa';
  const instanceDescription = isJudicial
    ? 'Expone CUIJ, juzgado y autos y ayuda a leer el cierre separando rubros del taller y del expediente.'
    : 'Mantiene una lectura mas liviana, referenciada por siniestro, sin datos propios de juzgado.';

  const addExpedienteDocument = () => {
    updateCase((draft) => {
      draft.lawyer.expedienteDocuments.push(createTodoRiskDocument({ category: 'Escrito' }));
    });
  };

  const addStatusUpdate = () => {
    updateCase((draft) => {
      draft.lawyer.statusUpdates.push(createLawyerStatusUpdate());
    });
  };

  const addAgendaTask = () => {
    updateCase((draft) => {
      draft.lawyer.agenda.push(createTodoRiskTask({
        sourceArea: 'Abogado',
        sourceLabel: 'Abogado',
        relatedTab: 'abogado',
        linkedCaseId: draft.id,
        linkedCaseCode: draft.code,
      }));
    });
  };

  const addInjured = () => {
    updateCase((draft) => {
      draft.lawyer.injuredParties.push(createLawyerInjured());
    });
  };

  const addExpense = () => {
    updateCase((draft) => {
      draft.lawyer.closure.expenses.push(createLawyerExpense());
    });
  };

  const addClosureItem = () => {
    updateCase((draft) => {
      draft.lawyer.closure.items.push(createLawyerClosureItem());
    });
  };

  const downloadExpensesExcel = () => {
    const csv = [
      ['Concepto', 'Monto', 'Fecha', 'Abonó'].map(escapeCsvValue).join(','),
      ...item.lawyer.closure.expenses.map((expense) => [expense.concept, expense.amount, expense.date, expense.paidBy].map(escapeCsvValue).join(',')),
    ].join('\n');
    triggerDownload(`gastos-${item.code}.csv`, csv, 'text/csv;charset=utf-8;');
    flash('Descargar Excel: se exportó la planilla de gastos del expediente.');
  };

  return (
    <div className="tab-layout lawyer-layout">
      <article className="card inner-card lawyer-summary-card">
        <div className="section-head small-gap">
          <div>
            <p className="eyebrow">Abogado</p>
            <h3>Gestión legal y cierre</h3>
          </div>
          <StatusBadge tone={item.computed.tabs.abogado === 'resolved' ? 'success' : 'info'}>{item.computed.tabs.abogado === 'resolved' ? 'Cierre legal listo' : 'Seguimiento abierto'}</StatusBadge>
        </div>
        <div className="form-grid four-columns compact-grid">
          <SelectField label="Tramita" onChange={(value) => updateCase((draft) => { draft.lawyer.tramita = value; })} options={legalProcessorOptions} value={resolveCatalogCode(item.lawyer.tramita, getCatalogEntries(insuranceCatalogs, 'legalProcessorCodes'), LAWYER_TRAMITA_OPTIONS) || item.lawyer.tramita} />
          <SelectField label="Reclama" onChange={(value) => updateCase((draft) => { draft.lawyer.reclama = value; })} options={legalClaimantOptions} value={resolveCatalogCode(item.lawyer.reclama, getCatalogEntries(insuranceCatalogs, 'legalClaimantCodes'), LAWYER_RECLAMA_OPTIONS) || item.lawyer.reclama} />
          <SelectField label="Instancia" onChange={(value) => updateCase((draft) => { draft.lawyer.instance = value; if (value !== 'Judicial') { draft.lawyer.cuij = ''; draft.lawyer.court = ''; draft.lawyer.autos = ''; } })} options={legalInstanceOptions} value={resolveCatalogCode(item.lawyer.instance, getCatalogEntries(insuranceCatalogs, 'legalInstanceCodes'), LAWYER_INSTANCE_OPTIONS) || item.lawyer.instance} />
          <DataField label="Días tramitando" onChange={() => {}} readOnly value={item.computed.lawyer.daysProcessing} />
          <DataField label="Fecha ingreso" onChange={(value) => updateCase((draft) => { draft.lawyer.entryDate = value; })} type="date" value={item.lawyer.entryDate} />
          {isJudicial ? <DataField label="N° CUIJ" onChange={(value) => updateCase((draft) => { draft.lawyer.cuij = value; })} value={item.lawyer.cuij} /> : null}
          {isJudicial ? <DataField label="Juzgado" onChange={(value) => updateCase((draft) => { draft.lawyer.court = value; })} value={item.lawyer.court} /> : null}
          {isJudicial ? <DataField label="Autos" onChange={(value) => updateCase((draft) => { draft.lawyer.autos = value; })} value={item.lawyer.autos} /> : null}
          <DataField label="Abg. contraparte" onChange={(value) => updateCase((draft) => { draft.lawyer.opponentLawyer = value; })} value={item.lawyer.opponentLawyer} />
          <DataField label="Tel." onChange={(value) => updateCase((draft) => { draft.lawyer.opponentPhone = value; })} value={item.lawyer.opponentPhone} />
          <DataField label="Correo" onChange={(value) => updateCase((draft) => { draft.lawyer.opponentEmail = value; })} value={item.lawyer.opponentEmail} />
        </div>
        <div className={`lawyer-instance-banner ${isJudicial ? 'is-judicial' : 'is-administrative'}`}>
          <div className="stack-tight">
            <p className="eyebrow">Lectura de instancia</p>
            <h4>{instanceLabel}</h4>
            <p className="muted">{instanceDescription}</p>
          </div>
          <div className="tag-row">
            <StatusBadge tone={isJudicial ? 'info' : 'success'}>{instanceLabel}</StatusBadge>
            <StatusBadge tone={includesInjuries ? 'danger' : 'success'}>{includesInjuries ? 'Con lesiones' : 'Sin lesiones'}</StatusBadge>
          </div>
        </div>
      </article>

      {includesInjuries ? (
        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Reclamante lesiones</h3>
            <div className="tag-row">
              <StatusBadge tone="info">{item.lawyer.injuredParties.length} lesionado(s)</StatusBadge>
              <button className="secondary-button" onClick={addInjured} type="button">Agregar lesionado</button>
            </div>
          </div>
          <div className="budget-lines">
            {item.lawyer.injuredParties.map((injured) => (
              <div className="budget-line budget-line-extended" key={injured.id}>
                <SelectField label="Lesionado es" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.injuredRole = value; })} options={LAWYER_INJURED_ROLE_OPTIONS} value={injured.injuredRole} />
                <DataField label="Apellido" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.lastName = value; })} value={injured.lastName} />
                <DataField label="Nombre" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.firstName = value; })} value={injured.firstName} />
                <DataField label="DNI" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.document = value; })} value={injured.document} />
                <DataField label="Fecha nac." onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.birthDate = value; })} type="date" value={injured.birthDate} />
                <DataField label="Domicilio" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.address = value; })} value={injured.address} />
                <DataField label="Estado civil" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.civilStatus = value; })} value={injured.civilStatus} />
                <DataField label="Tel." onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.phone = value; })} value={injured.phone} />
                <DataField label="Correo" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.email = value; })} value={injured.email} />
                <DataField label="Profesión" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.profession = value; })} value={injured.profession} />
                <ToggleField label="Acredita ingresos" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.accreditsIncome = value; })} value={injured.accreditsIncome} />
                <DataField label="Anotaciones" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.injuredParties.find((entry) => entry.id === injured.id); target.notes = value; })} value={injured.notes} />
              </div>
            ))}
          </div>
        </article>
      ) : null}

      <details className="card inner-card collapsible-card" open>
        <summary className="collapsible-summary">
          <div className="collapsible-summary-copy">
            <strong>Observaciones y antecedentes del caso</strong>
            <small>Contexto legal y narrativa breve para entender en que tramo esta el reclamo.</small>
          </div>
          <span className="collapsible-summary-meta">{item.lawyer.observations ? 'Completo' : 'Pendiente'}</span>
        </summary>
        <label className="field">
          <span>Detalle</span>
          <textarea onChange={(event) => updateCase((draft) => { draft.lawyer.observations = event.target.value; })} value={item.lawyer.observations} />
        </label>
      </details>

      <details className="card inner-card collapsible-card" open>
        <summary className="collapsible-summary">
          <div className="collapsible-summary-copy">
            <strong>Documentación Expediente</strong>
            <small>Archivos legales separados de la documentación general del trámite.</small>
          </div>
          <span className="collapsible-summary-meta">{item.lawyer.expedienteDocuments.length} adjunto(s)</span>
        </summary>
        <div className="section-head">
          <p className="muted">Separada de la documentación general del trámite.</p>
          <div className="tag-row">
            <button className="secondary-button" onClick={addExpedienteDocument} type="button">Agregar ítem</button>
            <button className="secondary-button" onClick={() => flash('Descargar todo: se agruparán los archivos del expediente.')} type="button">Descargar todo</button>
          </div>
        </div>
        <div className="table-wrap table-wrap-framed">
          <table className="data-table compact-table">
            <thead>
              <tr><th>Categoría</th><th>Tipo archivo / nombre</th><th>Fecha de carga</th><th>Observaciones</th><th /></tr>
            </thead>
            <tbody>
              {item.lawyer.expedienteDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td><SelectField label="Categoría" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.expedienteDocuments.find((entry) => entry.id === doc.id); target.category = value; })} options={LAWYER_EXPEDIENT_DOC_CATEGORY_OPTIONS} value={doc.category} /></td>
                  <td><DataField label="Nombre" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.expedienteDocuments.find((entry) => entry.id === doc.id); target.name = value; })} value={doc.name} /></td>
                  <td><DataField label="Fecha" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.expedienteDocuments.find((entry) => entry.id === doc.id); target.uploadedAt = value; })} type="date" value={doc.uploadedAt} /></td>
                  <td><DataField label="Notas" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.expedienteDocuments.find((entry) => entry.id === doc.id); target.notes = value; })} value={doc.notes} /></td>
                  <td><button className="ghost-button" onClick={() => updateCase((draft) => { draft.lawyer.expedienteDocuments = draft.lawyer.expedienteDocuments.filter((entry) => entry.id !== doc.id); })} type="button">Quitar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <details className="card inner-card collapsible-card lawyer-section-card" open>
        <summary className="collapsible-summary">
          <div className="collapsible-summary-copy">
            <strong>Estado del expediente</strong>
            <small>Novedades procesales y aviso al cliente en un mismo bloque.</small>
          </div>
          <span className="collapsible-summary-meta">{statusUpdateCount} novedad(es)</span>
        </summary>
        <div className="section-head small-gap">
          <p className="muted">Ordena seguimiento interno y confirma si cada novedad ya se comunicó.</p>
          <div className="tag-row">
            <StatusBadge tone="info">{statusUpdateCount} novedades</StatusBadge>
            <button className="secondary-button" onClick={addStatusUpdate} type="button">Agregar novedad</button>
          </div>
        </div>
        <div className="table-wrap table-wrap-framed">
          <table className="data-table compact-table">
            <thead>
              <tr><th>Actualización</th><th>Fecha novedad</th><th>Notifica a cliente</th><th /></tr>
            </thead>
            <tbody>
              {item.lawyer.statusUpdates.map((update) => (
                <tr key={update.id}>
                  <td><DataField label="Actualización" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.statusUpdates.find((entry) => entry.id === update.id); target.detail = value; })} value={update.detail} /></td>
                  <td><DataField label="Fecha" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.statusUpdates.find((entry) => entry.id === update.id); target.date = value; })} type="date" value={update.date} /></td>
                  <td><button className={`toggle-button ${update.notifyClient ? 'is-on' : ''}`} onClick={() => {
                    if (!update.notifyClient && !window.confirm('¿Confirmás que querés notificar al cliente esta novedad?')) {
                      return;
                    }
                    updateCase((draft) => { const target = draft.lawyer.statusUpdates.find((entry) => entry.id === update.id); target.notifyClient = !target.notifyClient; });
                  }} type="button">{update.notifyClient ? 'Sí' : 'No'}</button></td>
                  <td><button className="ghost-button" onClick={() => updateCase((draft) => { draft.lawyer.statusUpdates = draft.lawyer.statusUpdates.filter((entry) => entry.id !== update.id); })} type="button">Quitar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <details className="card inner-card collapsible-card lawyer-section-card" open>
        <summary className="collapsible-summary">
          <div className="collapsible-summary-copy">
            <strong>Agenda de tareas</strong>
            <small>Seguimiento corto para pendientes del abogado, cliente y taller.</small>
          </div>
          <span className="collapsible-summary-meta">{agendaPendingCount ? `${agendaPendingCount} pendiente(s)` : 'Sin pendientes'}</span>
        </summary>
        <div className="section-head small-gap">
          <p className="muted">Conviene usarlo para recordatorios operativos y no mezclarlo con novedades del expediente.</p>
          <div className="tag-row">
            <StatusBadge tone={agendaPendingCount ? 'danger' : 'success'}>{agendaPendingCount ? `${agendaPendingCount} pendiente(s)` : 'Sin pendientes'}</StatusBadge>
            <button className="secondary-button" onClick={addAgendaTask} type="button">Agregar tarea</button>
          </div>
        </div>
        <div className="table-wrap table-wrap-framed">
          <table className="data-table compact-table">
            <thead>
              <tr><th>Tarea</th><th>Descripción</th><th>Fecha límite</th><th>Prioridad</th><th>Estado</th><th>Responsable</th><th>Hecho</th></tr>
            </thead>
            <tbody>
              {item.lawyer.agenda.map((task) => {
                const normalizedTask = normalizeAgendaTask(task, { sourceArea: 'Abogado', sourceLabel: 'Abogado', relatedTab: 'abogado' });
                const dueMeta = getAgendaTaskDueMeta(normalizedTask.scheduledAt);

                return (
                  <tr className={`agenda-row is-${dueMeta.tone}`} key={task.id}>
                    <td><DataField label="Tarea" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.agenda.find((entry) => entry.id === task.id); target.title = value; })} value={normalizedTask.title} /></td>
                    <td><DataField label="Descripción" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.agenda.find((entry) => entry.id === task.id); target.description = value; })} value={normalizedTask.description} /></td>
                    <td>
                      <DataField label="Fecha límite" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.agenda.find((entry) => entry.id === task.id); target.scheduledAt = value; })} type="date" value={normalizedTask.scheduledAt} />
                      <small>{dueMeta.label}</small>
                    </td>
                    <td><SelectField label="Prioridad" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.agenda.find((entry) => entry.id === task.id); target.priority = value; })} options={TASK_PRIORITY_OPTIONS.map((value) => ({ value, label: getAgendaPriorityLabel(value) }))} value={normalizedTask.priority} /></td>
                    <td><SelectField label="Estado" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.agenda.find((entry) => entry.id === task.id); setAgendaTaskStatus(target, value); })} options={TASK_STATUS_OPTIONS.map((value) => ({ value, label: getAgendaStatusLabel(value) }))} value={normalizedTask.status} /></td>
                    <td><SelectField label="Responsable" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.agenda.find((entry) => entry.id === task.id); target.assignee = value; })} options={TODO_RIESGO_ASSIGNABLE_USERS} value={normalizedTask.assignee} /></td>
                    <td><input checked={normalizedTask.resolved} onChange={(event) => updateCase((draft) => { const target = draft.lawyer.agenda.find((entry) => entry.id === task.id); setAgendaTaskResolved(target, event.target.checked); })} type="checkbox" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>

      <details className="card inner-card collapsible-card lawyer-section-card" open>
        <summary className="collapsible-summary">
          <div className="collapsible-summary-copy">
            <strong>Cierre</strong>
            <small>Planilla de gastos, rubros y total manual del expediente.</small>
          </div>
          <span className="collapsible-summary-meta">{item.lawyer.closure.closeBy}</span>
        </summary>
        <div className="section-head small-gap">
          <div>
            <h3>Cierre</h3>
            <p className="muted">Planilla de gastos, rubros y total manual del expediente.</p>
          </div>
          <StatusBadge tone={item.lawyer.closure.closeBy === 'pendiente' ? 'danger' : 'success'}>{item.lawyer.closure.closeBy}</StatusBadge>
        </div>
        <div className="section-head small-gap">
          <h4>Planilla de gastos</h4>
          <div className="tag-row">
            <button className="secondary-button" onClick={addExpense} type="button">Agregar gasto</button>
            <button className="secondary-button" onClick={downloadExpensesExcel} type="button">Descargar Excel</button>
          </div>
        </div>
        <div className="table-wrap table-wrap-framed">
          <table className="data-table compact-table">
            <thead>
              <tr><th>Concepto</th><th>Monto</th><th>Fecha</th><th>Abonó</th><th /></tr>
            </thead>
            <tbody>
              {item.lawyer.closure.expenses.map((expense) => (
                <tr key={expense.id}>
                  <td><DataField label="Concepto" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.closure.expenses.find((entry) => entry.id === expense.id); target.concept = value; })} value={expense.concept} /></td>
                  <td><DataField label="Monto" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.closure.expenses.find((entry) => entry.id === expense.id); target.amount = value; })} value={expense.amount} /></td>
                  <td><DataField label="Fecha" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.closure.expenses.find((entry) => entry.id === expense.id); target.date = value; })} type="date" value={expense.date} /></td>
                  <td><SelectField label="Abonó" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.closure.expenses.find((entry) => entry.id === expense.id); target.paidBy = value; })} options={legalExpensePayerOptions} value={resolveCatalogCode(expense.paidBy, getCatalogEntries(insuranceCatalogs, 'legalExpensePayerCodes'), LAWYER_EXPENSE_PAID_BY_OPTIONS) || expense.paidBy} /></td>
                  <td><button className="ghost-button" onClick={() => updateCase((draft) => { draft.lawyer.closure.expenses = draft.lawyer.closure.expenses.filter((entry) => entry.id !== expense.id); })} type="button">Quitar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="lawyer-total-row"><span>Total gastos</span><strong>{money(expensesTotal)}</strong></div>
        <div className="form-grid three-columns compact-grid">
          <SelectField label="Cierre por" onChange={(value) => updateCase((draft) => { draft.lawyer.closure.closeBy = value; })} options={legalClosureOptions} value={resolveCatalogCode(item.lawyer.closure.closeBy, getCatalogEntries(insuranceCatalogs, 'legalClosureReasonCodes'), LAWYER_CLOSE_BY_OPTIONS) || item.lawyer.closure.closeBy} />
          <DataField label="Fecha" onChange={(value) => updateCase((draft) => { draft.lawyer.closure.closeDate = value; })} type="date" value={item.lawyer.closure.closeDate} />
          <DataField label="Importe total" onChange={(value) => updateCase((draft) => { draft.lawyer.closure.totalAmount = value; draft.payments.manualTotalAmount = value; })} value={item.lawyer.closure.totalAmount} />
        </div>
        <div className="section-head small-gap">
          <h4>Detalle de rubros</h4>
          <button className="secondary-button" onClick={addClosureItem} type="button">Agregar rubro</button>
        </div>
        <div className="table-wrap table-wrap-framed">
          <table className="data-table compact-table">
            <thead>
              <tr><th>Concepto</th><th>Monto</th><th>Fecha de pago</th><th>Suma Taller</th><th>Pagado</th><th /></tr>
            </thead>
            <tbody>
              {item.lawyer.closure.items.map((entry) => (
                <tr key={entry.id}>
                  <td><DataField label="Concepto" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.closure.items.find((itemEntry) => itemEntry.id === entry.id); target.concept = value; })} value={entry.concept} /></td>
                  <td><DataField label="Monto" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.closure.items.find((itemEntry) => itemEntry.id === entry.id); target.amount = value; })} value={entry.amount} /></td>
                  <td><DataField label="Fecha pago" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.closure.items.find((itemEntry) => itemEntry.id === entry.id); target.paymentDate = value; })} type="date" value={entry.paymentDate} /></td>
                  <td><SelectField label="Suma Taller" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.closure.items.find((itemEntry) => itemEntry.id === entry.id); target.sumWorkshop = value; })} options={['SI', 'NO']} value={entry.sumWorkshop} /></td>
                  <td><DataField label="Pagado" onChange={(value) => updateCase((draft) => { const target = draft.lawyer.closure.items.find((itemEntry) => itemEntry.id === entry.id); target.paidDate = value; })} type="date" value={entry.paidDate} /></td>
                  <td><button className="ghost-button" onClick={() => updateCase((draft) => { draft.lawyer.closure.items = draft.lawyer.closure.items.filter((itemEntry) => itemEntry.id !== entry.id); })} type="button">Quitar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <label className="field">
          <span>Anotaciones</span>
          <textarea onChange={(event) => updateCase((draft) => { draft.lawyer.closure.notes = event.target.value; })} value={item.lawyer.closure.notes} />
        </label>
      </details>
    </div>
  );
}

function AgendaView({ items, onOpenCase, onUpdateTask }) {
  const [activeAgendaTab, setActiveAgendaTab] = useState('pendientes');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [isMobileCalendarVisible, setIsMobileCalendarVisible] = useState(false);
  const assigneeOptions = useMemo(() => [{ value: '', label: 'Todos los usuarios' }, ...new Set(items.map((task) => task.assignee).filter(Boolean))], [items]);

  const filteredItems = useMemo(
    () => items.filter((task) => !assigneeFilter || task.assignee === assigneeFilter),
    [assigneeFilter, items],
  );

  const counts = useMemo(() => ({
    pendientes: filteredItems.filter((task) => task.viewBucket === 'pendientes').length,
    resueltas: filteredItems.filter((task) => task.viewBucket === 'resueltas').length,
    vencidas: filteredItems.filter((task) => task.viewBucket === 'vencidas').length,
    proximas: filteredItems.filter((task) => !task.resolved && task.dueMeta.bucket === 'upcoming').length,
  }), [filteredItems]);

  const visibleItems = useMemo(() => filteredItems
    .filter((task) => {
      if (activeAgendaTab === 'proximas') {
        return !task.resolved && task.dueMeta.bucket === 'upcoming';
      }

      return task.viewBucket === activeAgendaTab;
    })
    .sort((left, right) => {
      const leftDate = left.scheduledAt || '9999-12-31';
      const rightDate = right.scheduledAt || '9999-12-31';

      if (activeAgendaTab === 'resueltas') {
        const leftResolutionDate = left.resolvedAt || left.scheduledAt || '';
        const rightResolutionDate = right.resolvedAt || right.scheduledAt || '';
        return rightResolutionDate.localeCompare(leftResolutionDate) || left.caseCode.localeCompare(right.caseCode);
      }

      return leftDate.localeCompare(rightDate) || left.caseCode.localeCompare(right.caseCode);
    }), [activeAgendaTab, filteredItems]);

  const calendarCells = useMemo(() => {
    const today = new Date(`${todayIso()}T12:00:00`);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0);
    const startDay = (monthStart.getDay() + 6) % 7;
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - startDay);

    return Array.from({ length: 35 }, (_, index) => {
      const current = new Date(gridStart);
      current.setDate(gridStart.getDate() + index);
      const iso = current.toISOString().slice(0, 10);
      const dayItems = filteredItems.filter((task) => task.scheduledAt === iso);

      return {
        iso,
        date: current,
        inCurrentMonth: current.getMonth() === today.getMonth(),
        tasks: dayItems,
      };
    });
  }, [filteredItems]);

  return (
    <div className="agenda-layout">
      <section className="hero-panel compact-hero agenda-hero">
        <div>
          <p className="eyebrow">Agenda transversal</p>
          <h1>Tareas por usuario y por caso</h1>
          <p className="muted">Consolida recordatorios reales de Gestión del trámite, Reparación y Abogado sin tocar el flujo principal del caso.</p>
        </div>
      </section>

      <section className="card inner-card agenda-filter-card">
        <div className="agenda-filter-head">
          <div className="agenda-filter-select">
            <SelectField label="Usuario" onChange={setAssigneeFilter} options={assigneeOptions} value={assigneeFilter} />
          </div>
          <div className="hero-actions agenda-hero-actions">
            <article className="metric-card">
              <span>Pendientes</span>
              <strong>{counts.pendientes}</strong>
              <small>Abiertas y no vencidas</small>
            </article>
            <article className="metric-card">
              <span>Resueltas</span>
              <strong>{counts.resueltas}</strong>
              <small>Marcadas como completadas</small>
            </article>
            <article className="metric-card">
              <span>Vencidas</span>
              <strong>{counts.vencidas}</strong>
              <small>Requieren atención hoy</small>
            </article>
          </div>
        </div>
      </section>

      <div className="agenda-content-grid">
        <article className="card inner-card agenda-tasks-card">
          <div className="section-head small-gap agenda-task-header">
            <div>
              <h3>Tareas</h3>
              <p className="muted">{assigneeFilter ? `${activeAgendaTab === 'resueltas' ? 'Resueltas' : activeAgendaTab === 'vencidas' ? 'Vencidas' : 'Pendientes'} de: ${assigneeFilter}` : activeAgendaTab === 'resueltas' ? 'Resueltas' : activeAgendaTab === 'vencidas' ? 'Vencidas' : 'Pendientes'}</p>
            </div>
            <div className="agenda-task-header-actions">
              <button
                aria-controls="agenda-calendar-panel"
                aria-expanded={isMobileCalendarVisible}
                className="secondary-button agenda-calendar-toggle"
                onClick={() => setIsMobileCalendarVisible((current) => !current)}
                type="button"
              >
                {isMobileCalendarVisible ? 'Ocultar calendario' : 'Ver calendario'}
              </button>
              <StatusBadge tone={activeAgendaTab === 'resueltas' ? 'success' : activeAgendaTab === 'vencidas' ? 'danger' : 'info'}>{visibleItems.length} tarea(s)</StatusBadge>
            </div>
          </div>
          <div className="agenda-view-tabs" role="tablist" aria-label="Filtros de tareas">
          {[
            { id: 'pendientes', label: 'Pendientes', count: counts.pendientes },
            { id: 'resueltas', label: 'Resueltas', count: counts.resueltas },
            { id: 'vencidas', label: 'Venció', count: counts.vencidas },
          ].map((tab) => (
            <button
              className={`compact-button agenda-tab-button ${activeAgendaTab === tab.id ? 'is-selected' : ''}`}
              key={tab.id}
              onClick={() => setActiveAgendaTab(tab.id)}
              type="button"
            >
              {tab.label} ({tab.count})
            </button>
          ))}
          </div>

          {visibleItems.length ? (
            <div className="table-wrap agenda-table-wrap">
              <table className="data-table compact-table agenda-table">
                <thead>
                  <tr>
                    <th>Tarea</th>
                    <th>Vinculo</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Responsable</th>
                    <th>Fecha límite</th>
                    {activeAgendaTab === 'resueltas' ? <th>Fecha resolución</th> : null}
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((task) => (
                    <tr className={`agenda-row is-${task.dueMeta.tone}`} key={`${task.caseId}-${task.collectionKey}-${task.id}`}>
                      <td data-label="Tarea">
                        <div className="agenda-task-copy">
                          <strong>{task.title || 'Tarea sin título'}</strong>
                          <small>{task.description || 'Sin descripción operativa.'}</small>
                        </div>
                      </td>
                      <td data-label="Vinculo">
                        <div className="agenda-task-linkage">
                          <strong>{task.caseCode}</strong>
                          <small>{task.sourceLabel}</small>
                        </div>
                      </td>
                      <td data-label="Prioridad"><StatusBadge tone={getAgendaPriorityTone(task.priority)}>{getAgendaPriorityLabel(task.priority)}</StatusBadge></td>
                      <td data-label="Estado">
                        <SelectField
                          label="Estado"
                          onChange={(value) => onUpdateTask(task, (draftTask) => setAgendaTaskStatus(draftTask, value))}
                          options={TASK_STATUS_OPTIONS.map((value) => ({ value, label: getAgendaStatusLabel(value) }))}
                          value={task.status}
                        />
                      </td>
                      <td data-label="Responsable">{task.assignee}</td>
                      <td data-label="Fecha limite">
                        <div className="agenda-task-due">
                          <strong>{formatDate(task.scheduledAt)}</strong>
                          <small>{task.dueMeta.label}</small>
                        </div>
                      </td>
                      {activeAgendaTab === 'resueltas' ? (
                        <td data-label="Fecha resolucion">
                          <div className="agenda-task-due">
                            <strong>{formatDate(task.resolvedAt || task.scheduledAt)}</strong>
                            <small>{task.resolvedAt ? 'Resuelta' : 'Sin fecha de cierre'}</small>
                          </div>
                        </td>
                      ) : null}
                      <td data-label="Accion">
                        <div className="agenda-action-group">
                          <button
                            className="secondary-button"
                            onClick={() => onOpenCase(task.caseId, { tab: task.relatedTab || 'tramite', subtab: task.relatedSubtab || '' })}
                            type="button"
                          >
                            Abrir
                          </button>
                          <button
                            aria-label={task.resolved ? 'Reabrir tarea' : 'Marcar resuelta'}
                            className="ghost-button"
                            onClick={() => onUpdateTask(task, (draftTask) => setAgendaTaskResolved(draftTask, !isAgendaTaskResolved(draftTask)))}
                            type="button"
                          >
                            ✓
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-media agenda-empty-state">No hay tareas para mostrar en esta combinación de filtros.</div>
          )}
        </article>

        <article className={`card inner-card agenda-calendar-card ${isMobileCalendarVisible ? 'is-mobile-visible' : ''}`} id="agenda-calendar-panel">
          <div className="section-head small-gap">
            <div>
              <h3>Calendario</h3>
              <p className="muted">Vista mensual simple con concentración de vencimientos por día.</p>
            </div>
            <StatusBadge tone="info">Demo simple</StatusBadge>
          </div>
          <div className="agenda-calendar-weekdays">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="agenda-calendar-grid">
            {calendarCells.map((cell) => {
              const dueTone = cell.tasks.some((task) => task.dueMeta.bucket === 'overdue')
                ? 'danger'
                : cell.tasks.some((task) => task.dueMeta.bucket === 'upcoming')
                  ? 'warning'
                  : 'info';

              return (
                <article className={`agenda-calendar-cell ${cell.inCurrentMonth ? '' : 'is-muted'} ${cell.iso === todayIso() ? 'is-today' : ''}`} key={cell.iso}>
                  <div className="agenda-calendar-head">
                    <strong>{cell.date.getDate()}</strong>
                    {cell.tasks.length ? <StatusBadge tone={dueTone}>{cell.tasks.length}</StatusBadge> : null}
                  </div>
                  <div className="agenda-calendar-items">
                    {cell.tasks.slice(0, 3).map((task) => (
                      <button className={`agenda-calendar-task is-${task.dueMeta.tone}`} key={task.id} onClick={() => onOpenCase(task.caseId, { tab: task.relatedTab || 'tramite', subtab: task.relatedSubtab || '' })} type="button">
                        {task.caseCode} · {task.title || 'Tarea'}
                      </button>
                    ))}
                    {cell.tasks.length > 3 ? <small>+{cell.tasks.length - 3} más</small> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </article>
      </div>
    </div>
  );
}

