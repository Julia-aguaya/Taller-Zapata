import { useState } from 'react';
import DataField from '../../../components/ui/DataField';
import SelectField from '../../../components/ui/SelectField';
import StatusBadge from '../../../components/ui/StatusBadge';
import ToggleField from '../../../components/ui/ToggleField';
import {
  getFolderDisplayName,
  isCleasCase,
  isFranchiseRecoveryCase,
  isInsuranceWorkflowCase,
  isThirdPartyLawyerCase,
  isThirdPartyWorkshopCase,
} from '../../cases/lib/caseDomainCheckers';
import { getCatalogEntries, getCatalogSelectOptions, resolveCatalogCode } from '../../cases/lib/caseCatalogHelpers';
import { formatDate } from '../../cases/lib/caseFormatters';
import {
  CLEAS_PAYMENT_STATUS_OPTIONS,
  COMPROBANTES,
  FRANCHISE_CLIENT_PAYMENT_STATUS_OPTIONS,
  PAYMENT_MODES,
  TODO_RIESGO_DICTAMEN_OPTIONS,
  TODO_RIESGO_FRANCHISE_STATUS_OPTIONS,
  TODO_RIESGO_RECOVERY_OPTIONS,
} from '../constants/gestionOptions';
import {
  collectPaymentEvents,
  createSettlement,
  createTodoRiskInvoice,
  escapeHtml,
} from '../lib/gestionShared';
import { getStatusTone } from '../lib/gestionUtils';

export default function PagosTab({ item, updateCase, flash, financeCatalogs = null, insuranceCatalogs = null }) {
  const receiptTypeOptions = getCatalogSelectOptions(financeCatalogs, 'receiptTypeCodes', COMPROBANTES);
  const paymentMethodOptions = getCatalogSelectOptions(financeCatalogs, 'paymentMethodCodes', PAYMENT_MODES);
  const insurancePaymentStatusOptions = getCatalogSelectOptions(insuranceCatalogs, 'paymentStatusCodes', CLEAS_PAYMENT_STATUS_OPTIONS);
  const [activePaymentTab, setActivePaymentTab] = useState('facturacion');

  if (isFranchiseRecoveryCase(item)) {
    const franchiseComputed = item.computed.franchiseRecovery || {};
    const repairEnabled = item.franchiseRecovery?.enablesRepair !== 'NO';
    const showClientRecoveryFields = franchiseComputed.dictamenShared || (!repairEnabled && item.franchiseRecovery?.recoverToClient === 'SI');

    return (
      <div className="tab-layout todo-risk-layout pagos-tab-layout ops-tab-layout">
        <article className="card inner-card franchise-management-card">
          <div className="section-head small-gap">
            <div>
              <p className="eyebrow">Pagos</p>
              <h3>Lectura mínima de franquicia</h3>
            </div>
            <StatusBadge tone={getStatusTone(item.computed.paymentState)}>{item.computed.paymentState}</StatusBadge>
          </div>

          <div className="form-grid four-columns compact-grid">
            <DataField label="Gestiona" onChange={() => {}} readOnly value={item.franchiseRecovery?.managerType || 'Taller'} />
            <DataField label="Carpeta asociada" onChange={() => {}} readOnly value={item.franchiseRecovery?.associatedFolderCode || '-'} />
            <DataField label="Dictamen" onChange={() => {}} readOnly value={item.franchiseRecovery?.dictamen || 'Pendiente'} />
            <DataField label="Habilita reparación" onChange={() => {}} readOnly value={repairEnabled ? 'SI' : 'NO'} />
            <DataField label="Monto a recuperar" onChange={() => {}} readOnly value={money(item.franchiseRecovery?.amountToRecover || 0)} />
            <DataField label="Recupero a cliente" onChange={() => {}} readOnly value={franchiseComputed.dictamenShared ? 'Demo 50/50' : item.computed.franchiseRecovery?.canRecoverToClient ? item.franchiseRecovery?.recoverToClient || 'NO' : 'No aplica'} />
            <DataField label="Saldo base" onChange={() => {}} readOnly value={money(item.computed.balance)} />
          </div>

          {franchiseComputed.hasEconomicAlert ? <div className="inline-alert danger-banner franchise-flow-banner">Recupero económico en alerta: {money(franchiseComputed.amountToRecover || 0)} vs acordado {money(franchiseComputed.agreementAmount || 0)}.</div> : null}
          {franchiseComputed.dictamenShared ? <div className="inline-alert info-banner franchise-flow-banner">Dictamen compartido: 50/50 con cliente {money(franchiseComputed.clientResponsibilityAmount || 0)} y compañía {money(franchiseComputed.companyExpectedAmount || 0)}.</div> : null}

          {repairEnabled && !franchiseComputed.dictamenShared ? (
            <div className="inline-alert info-banner franchise-flow-banner">
              Recupero a cliente solo aplica cuando <strong>Habilita reparación = NO</strong>.
            </div>
          ) : showClientRecoveryFields ? (
            <div className="franchise-client-recovery-block">
              <div className="section-head small-gap">
                <div>
                  <p className="eyebrow">Recupero a cliente</p>
                  <h3>Campos mínimos visibles</h3>
                </div>
                <StatusBadge tone={item.franchiseRecovery?.clientRecoveryStatus === 'Cancelado' ? 'success' : 'info'}>
                  {item.franchiseRecovery?.clientRecoveryStatus || 'Pendiente'}
                </StatusBadge>
              </div>

              <div className="form-grid three-columns compact-grid">
                <DataField label="Monto cliente" onChange={(value) => updateCase((draft) => { draft.franchiseRecovery.clientResponsibilityAmount = value; })} value={item.franchiseRecovery?.clientResponsibilityAmount || ''} />
                <SelectField label="Estado cobro cliente" onChange={(value) => updateCase((draft) => { draft.franchiseRecovery.clientRecoveryStatus = value; })} options={FRANCHISE_CLIENT_PAYMENT_STATUS_OPTIONS} value={item.franchiseRecovery?.clientRecoveryStatus || 'Pendiente'} />
                <DataField label="Fecha cobro cliente" onChange={(value) => updateCase((draft) => { draft.franchiseRecovery.clientRecoveryDate = value; })} type="date" value={item.franchiseRecovery?.clientRecoveryDate || ''} />
              </div>
            </div>
          ) : (
            <div className="inline-alert success-banner franchise-flow-banner">
              Marcá <strong>Recupero a cliente = SI</strong> para mostrar el bloque mínimo de recupero dentro de Franquicia.
            </div>
          )}
        </article>
      </div>
    );
  }

  if (isThirdPartyLawyerCase(item)) {
    const addInvoice = () => {
      updateCase((draft) => {
        draft.payments.invoice = 'SI';
        draft.payments.invoices = [
          ...(draft.payments.invoices || []),
          createTodoRiskInvoice({
            amount: String(draft.payments.manualTotalAmount || draft.lawyer.closure.totalAmount || ''),
            issuedAt: draft.payments.passedToPaymentsDate || draft.lawyer.entryDate || '',
            notes: 'Convenio / factura abogado',
          }),
        ];
      });
    };

    const addClientPayment = () => {
      updateCase((draft) => {
        draft.thirdParty.payments.clientPayments.push(createSettlement());
      });
    };

    const paymentReferenceLabel = item.lawyer.instance === 'Judicial' ? 'N° CUIJ' : 'N° de siniestro';
    const paymentReferenceValue = item.lawyer.instance === 'Judicial' ? item.lawyer.cuij || '' : item.claimNumber || '';

    return (
      <div className="tab-layout todo-risk-layout pagos-tab-layout ops-tab-layout">
        <article className="card inner-card todo-risk-summary-card">
          <div className="section-head small-gap">
            <div>
              <p className="eyebrow">Pagos</p>
              <h3>Versión resumida para abogado</h3>
            </div>
            <StatusBadge tone={getStatusTone(item.computed.paymentState)}>{item.computed.paymentState}</StatusBadge>
          </div>
          <div className="parts-total-grid third-party-summary-grid">
            <article className="summary-chip">
              <span>{paymentReferenceLabel}</span>
              <strong>{paymentReferenceValue || 'Pendiente'}</strong>
            </article>
            <article className="summary-chip">
              <span>Importe total manual</span>
              <strong>{money(item.computed.thirdParty.amountToInvoice)}</strong>
            </article>
            <article className="summary-chip">
              <span>Tareas extras</span>
              <strong>{money(item.computed.thirdParty.extraWorksTotal)}</strong>
            </article>
            <article className="summary-chip">
              <span>Saldo extras</span>
              <strong>{money(item.computed.thirdParty.clientExtrasBalance)}</strong>
            </article>
          </div>
        </article>

        <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Facturación / convenio</p>
              <h3>Sin firma conforme cliente</h3>
            </div>
            <div className="tag-row">
              <StatusBadge tone={item.computed.thirdParty.companyPaymentReady ? 'success' : 'info'}>{item.computed.thirdParty.companyPaymentReady ? 'Pago principal registrado' : 'Pendiente pago principal'}</StatusBadge>
              <button className="secondary-button" onClick={addInvoice} type="button">Agregar factura</button>
            </div>
          </div>
          <div className="form-grid four-columns compact-grid">
            <DataField label={paymentReferenceLabel} onChange={() => {}} readOnly value={paymentReferenceValue} />
            <DataField label="Importe total manual" onChange={(value) => updateCase((draft) => { draft.payments.manualTotalAmount = value; })} value={item.payments.manualTotalAmount || ''} />
            <DataField label="Firma convenio abogado" onChange={(value) => updateCase((draft) => { draft.payments.signedAgreementDate = value; })} type="date" value={item.payments.signedAgreementDate || ''} />
            <DataField label="Pasado a pagos" onChange={(value) => updateCase((draft) => { draft.payments.passedToPaymentsDate = value; })} type="date" value={item.payments.passedToPaymentsDate || ''} />
            <DataField label="Fecha estimada pago" onChange={(value) => updateCase((draft) => { draft.payments.estimatedPaymentDate = value; })} type="date" value={item.payments.estimatedPaymentDate || ''} />
            <DataField label="Razón social" onChange={(value) => updateCase((draft) => { draft.payments.businessName = value; })} value={item.payments.businessName || ''} />
            <DataField label="Instancia" onChange={() => {}} readOnly value={item.lawyer.instance} />
            <DataField label="Cierre por" onChange={() => {}} readOnly value={item.lawyer.closure.closeBy} />
          </div>
          <div className="budget-lines">
            {(item.payments.invoices || []).map((invoice) => (
              <div className="budget-line" key={invoice.id}>
                <DataField label="N° factura" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.invoiceNumber = value; if (!draft.payments.invoiceNumber) draft.payments.invoiceNumber = value; })} value={invoice.invoiceNumber} />
                <DataField label="Importe total" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.amount = value; })} value={invoice.amount} />
                <DataField label="Fecha factura" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.issuedAt = value; })} type="date" value={invoice.issuedAt} />
                <DataField label="Notas" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.notes = value; })} value={invoice.notes} />
              </div>
            ))}
          </div>
        </article>

        <article className="card inner-card">
          <div className="section-head small-gap">
            <div>
              <p className="eyebrow">Pago principal</p>
              <h3>Fecha manual y validación mínima</h3>
            </div>
            <StatusBadge tone={item.computed.thirdParty.companyPaymentReady ? 'success' : 'danger'}>{item.computed.thirdParty.companyPaymentReady ? 'Completo' : 'Pendiente'}</StatusBadge>
          </div>
          <div className="form-grid four-columns compact-grid">
            <DataField label="Fecha de pago" onChange={(value) => updateCase((draft) => { draft.payments.paymentDate = value; })} type="date" value={item.payments.paymentDate || ''} />
            <DataField label="Monto depositado" onChange={(value) => updateCase((draft) => { draft.payments.depositedAmount = value; })} value={item.payments.depositedAmount || ''} />
            <ToggleField label="Retenciones" onChange={(value) => updateCase((draft) => { draft.payments.hasRetentions = value; })} value={item.payments.hasRetentions || 'NO'} />
            <DataField label="N° factura principal" onChange={(value) => updateCase((draft) => { draft.payments.invoiceNumber = value; })} value={item.payments.invoiceNumber || ''} />
          </div>
          {item.payments.hasRetentions === 'SI' ? (
            <div className="form-grid six-columns compact-grid retention-grid">
              <DataField label="IVA" onChange={(value) => updateCase((draft) => { draft.payments.retentions.iva = value; })} value={item.payments.retentions?.iva || ''} />
              <DataField label="Ganancias" onChange={(value) => updateCase((draft) => { draft.payments.retentions.gains = value; })} value={item.payments.retentions?.gains || ''} />
              <DataField label="Contr. Patr." onChange={(value) => updateCase((draft) => { draft.payments.retentions.employerContribution = value; })} value={item.payments.retentions?.employerContribution || ''} />
              <DataField label="IIBB" onChange={(value) => updateCase((draft) => { draft.payments.retentions.iibb = value; })} value={item.payments.retentions?.iibb || ''} />
              <DataField label="DREI" onChange={(value) => updateCase((draft) => { draft.payments.retentions.drei = value; })} value={item.payments.retentions?.drei || ''} />
              <DataField label="Otra" onChange={(value) => updateCase((draft) => { draft.payments.retentions.other = value; })} value={item.payments.retentions?.other || ''} />
            </div>
          ) : null}
        </article>

        <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Tareas extras</p>
              <h3>Tramo particular visible</h3>
            </div>
            <div className="tag-row">
              <StatusBadge tone={item.computed.thirdParty.clientExtrasReady ? 'success' : item.computed.thirdParty.hasExtraWorks ? 'danger' : 'info'}>
                {item.computed.thirdParty.hasExtraWorks ? (item.computed.thirdParty.clientExtrasReady ? 'Extras cancelados' : 'Extras pendientes') : 'Sin tareas extras'}
              </StatusBadge>
              <button className="secondary-button" onClick={addClientPayment} type="button">+ Agregar pago</button>
            </div>
          </div>
          <div className="parts-total-grid third-party-summary-grid">
            <article className="summary-chip"><span>Total extras</span><strong>{money(item.computed.thirdParty.extraWorksTotal)}</strong></article>
            <article className="summary-chip"><span>Total cobrado cliente</span><strong>{money(item.computed.thirdParty.clientPaymentsTotal)}</strong></article>
            <article className="summary-chip"><span>Saldo cliente</span><strong>{money(item.computed.thirdParty.clientExtrasBalance)}</strong></article>
          </div>
          <div className="budget-lines">
            {(item.thirdParty.payments.clientPayments || []).map((payment) => (
              <div className="settlement-card" key={payment.id}>
                <div className="form-grid four-columns compact-grid">
                  <SelectField label="Cancela saldo" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id); target.kind = value; })} options={['Parcial', 'Total', 'Bonificacion']} value={payment.kind} />
                  <DataField label="Monto" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id); target.amount = value; })} value={payment.amount} />
                  <DataField label="Fecha" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id); target.date = value; })} type="date" value={payment.date} />
                  <SelectField label="Modo" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id); target.mode = value; })} options={PAYMENT_MODES} value={payment.mode} />
                </div>
              </div>
            ))}
          </div>
          <button className="secondary-button" onClick={() => flash('Documentación de pagos: acá podés abrir recibos, transferencias o respaldos del convenio y extras.')} type="button">Documentación pagos</button>
        </article>
      </div>
    );
  }

  if (isThirdPartyWorkshopCase(item)) {
    const addInvoice = () => {
      updateCase((draft) => {
        draft.payments.invoice = 'SI';
        draft.payments.invoices = [
          ...(draft.payments.invoices || []),
          createTodoRiskInvoice({
            amount: String(item.computed.thirdParty.amountToInvoice || ''),
            issuedAt: draft.payments.passedToPaymentsDate || draft.thirdParty.claim.presentedDate || '',
            notes: 'Factura principal a compañía',
          }),
        ];
      });
    };

    const addClientPayment = () => {
      updateCase((draft) => {
        draft.thirdParty.payments.clientPayments.push(createSettlement());
      });
    };

    return (
      <div className="tab-layout todo-risk-layout pagos-tab-layout ops-tab-layout">
        <article className="card inner-card todo-risk-summary-card">
          <div className="section-head small-gap">
            <div>
              <p className="eyebrow">Pagos</p>
              <h3>Mixto compañía + particular</h3>
            </div>
            <StatusBadge tone={getStatusTone(item.computed.paymentState)}>{item.computed.paymentState}</StatusBadge>
          </div>

          <div className="parts-total-grid third-party-summary-grid">
            <article className="summary-chip">
              <span>Cía. del 3ero</span>
              <strong>{item.thirdParty.claim.thirdCompany || 'Pendiente'}</strong>
            </article>
            <article className="summary-chip">
              <span>A facturar Cía.</span>
              <strong>{money(item.computed.thirdParty.amountToInvoice)}</strong>
            </article>
            <article className="summary-chip">
              <span>Tareas extras cliente</span>
              <strong>{money(item.computed.thirdParty.extraWorksTotal)}</strong>
            </article>
            <article className="summary-chip">
              <span>Saldo extras cliente</span>
              <strong>{money(item.computed.thirdParty.clientExtrasBalance)}</strong>
            </article>
          </div>

          <div className="budget-ready-panel budget-ready-panel-compact">
            <StatusBadge tone={item.computed.todoRisk.paymentsReady ? 'success' : 'danger'}>{item.computed.todoRisk.paymentsReady ? 'Pagos en azul/verde operativo' : 'Pagos todavía no cierra'}</StatusBadge>
            <small>{item.computed.thirdParty.hasExtraWorks ? 'Condición: fecha + monto de pago de compañía y además cancelación total del cliente sobre tareas extras.' : 'Condición: fecha + monto de pago de compañía. Sin extras, no se exige cancelación cliente.'}</small>
          </div>

          {!item.computed.thirdParty.companyPaymentReady ? <div className="inline-alert danger-banner">Falta registrar fecha y monto del pago de la compañía.</div> : null}
          {item.computed.thirdParty.hasExtraWorks && !item.computed.thirdParty.clientExtrasReady ? <div className="inline-alert danger-banner">Hay tareas extras y el cliente todavía debe {money(item.computed.thirdParty.clientExtrasBalance)} para cerrar el tramo particular.</div> : null}
        </article>

        <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Facturación compañía</p>
              <h3>Datos traídos desde Tramitación</h3>
            </div>
            <div className="tag-row">
              <StatusBadge tone={item.computed.thirdParty.companyPaymentReady ? 'success' : 'info'}>{item.computed.thirdParty.companyPaymentReady ? 'Pago compañía registrado' : 'Pendiente pago compañía'}</StatusBadge>
              <button className="secondary-button" onClick={addInvoice} type="button">Agregar factura</button>
            </div>
          </div>

          <div className="form-grid four-columns compact-grid">
            <DataField label="Cía. del 3ero" onChange={() => {}} readOnly value={item.thirdParty.claim.thirdCompany || ''} />
            <DataField label="N° de siniestro" onChange={() => {}} readOnly value={item.claimNumber || ''} />
            <DataField label="A facturar Cía." onChange={() => {}} readOnly value={item.computed.thirdParty.amountToInvoice} />
            <DataField label="Fecha presentado" onChange={() => {}} readOnly type="date" value={item.thirdParty.claim.presentedDate || ''} />
            <DataField label="Cliente firma conforme" onChange={(value) => updateCase((draft) => { draft.payments.signedAgreementDate = value; })} type="date" value={item.payments.signedAgreementDate || ''} />
            <DataField label="Pasado a pagos" onChange={(value) => updateCase((draft) => { draft.payments.passedToPaymentsDate = value; })} type="date" value={item.payments.passedToPaymentsDate || ''} />
            <DataField label="Fecha estimada pago" onChange={(value) => updateCase((draft) => { draft.payments.estimatedPaymentDate = value; })} type="date" value={item.payments.estimatedPaymentDate || ''} />
            <DataField label="Razón social" onChange={(value) => updateCase((draft) => { draft.payments.businessName = value; })} value={item.payments.businessName || ''} />
          </div>

          <div className="budget-lines">
            {(item.payments.invoices || []).map((invoice) => (
              <div className="budget-line" key={invoice.id}>
                <DataField label="N° factura" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.invoiceNumber = value; if (!draft.payments.invoiceNumber) draft.payments.invoiceNumber = value; })} value={invoice.invoiceNumber} />
                <DataField label="Importe total" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.amount = value; })} value={invoice.amount} />
                <DataField label="Fecha factura" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.issuedAt = value; })} type="date" value={invoice.issuedAt} />
                <DataField label="Notas" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.notes = value; })} value={invoice.notes} />
              </div>
            ))}
          </div>
        </article>

        <article className="card inner-card">
          <div className="section-head small-gap">
            <div>
              <p className="eyebrow">Pago compañía</p>
              <h3>Fecha manual y validación mínima</h3>
            </div>
            <StatusBadge tone={item.computed.thirdParty.companyPaymentReady ? 'success' : 'danger'}>{item.computed.thirdParty.companyPaymentReady ? 'Completo' : 'Pendiente'}</StatusBadge>
          </div>

          <div className="form-grid four-columns compact-grid">
            <DataField label="Fecha de pago" onChange={(value) => updateCase((draft) => { draft.payments.paymentDate = value; })} type="date" value={item.payments.paymentDate || ''} />
            <DataField label="Monto depositado" onChange={(value) => updateCase((draft) => { draft.payments.depositedAmount = value; })} value={item.payments.depositedAmount || ''} />
            <ToggleField label="Retenciones" onChange={(value) => updateCase((draft) => { draft.payments.hasRetentions = value; })} value={item.payments.hasRetentions || 'NO'} />
            <DataField label="N° factura principal" onChange={(value) => updateCase((draft) => { draft.payments.invoiceNumber = value; })} value={item.payments.invoiceNumber || ''} />
          </div>

          {item.payments.hasRetentions === 'SI' ? (
            <div className="form-grid six-columns compact-grid retention-grid">
              <DataField label="IVA" onChange={(value) => updateCase((draft) => { draft.payments.retentions.iva = value; })} value={item.payments.retentions?.iva || ''} />
              <DataField label="Ganancias" onChange={(value) => updateCase((draft) => { draft.payments.retentions.gains = value; })} value={item.payments.retentions?.gains || ''} />
              <DataField label="Contr. Patr." onChange={(value) => updateCase((draft) => { draft.payments.retentions.employerContribution = value; })} value={item.payments.retentions?.employerContribution || ''} />
              <DataField label="IIBB" onChange={(value) => updateCase((draft) => { draft.payments.retentions.iibb = value; })} value={item.payments.retentions?.iibb || ''} />
              <DataField label="DREI" onChange={(value) => updateCase((draft) => { draft.payments.retentions.drei = value; })} value={item.payments.retentions?.drei || ''} />
              <DataField label="Otra" onChange={(value) => updateCase((draft) => { draft.payments.retentions.other = value; })} value={item.payments.retentions?.other || ''} />
            </div>
          ) : null}
        </article>

        <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Pagos cliente</p>
              <h3>Tareas extras / tramo particular</h3>
            </div>
            <div className="tag-row">
              <StatusBadge tone={item.computed.thirdParty.clientExtrasReady ? 'success' : item.computed.thirdParty.hasExtraWorks ? 'danger' : 'info'}>
                {item.computed.thirdParty.hasExtraWorks
                  ? item.computed.thirdParty.clientExtrasReady ? 'Extras cancelados' : 'Extras pendientes'
                  : 'Sin tareas extras'}
              </StatusBadge>
              <button className="secondary-button" onClick={addClientPayment} type="button">+ Agregar pago</button>
            </div>
          </div>

          <div className="parts-total-grid third-party-summary-grid">
            <article className="summary-chip">
              <span>Total extras</span>
              <strong>{money(item.computed.thirdParty.extraWorksTotal)}</strong>
            </article>
            <article className="summary-chip">
              <span>Total cobrado cliente</span>
              <strong>{money(item.computed.thirdParty.clientPaymentsTotal)}</strong>
            </article>
            <article className="summary-chip">
              <span>Saldo cliente</span>
              <strong>{money(item.computed.thirdParty.clientExtrasBalance)}</strong>
            </article>
          </div>

          {!item.computed.thirdParty.hasExtraWorks ? (
            <div className="inline-alert info-banner">No hay tareas extras activas. El cierre de Pagos depende solo del pago de la compañía.</div>
          ) : null}

          <div className="budget-lines">
            {(item.thirdParty.payments.clientPayments || []).map((payment) => (
              <div className="settlement-card" key={payment.id}>
                <div className={`form-grid compact-grid ${payment.kind === 'Bonificacion' ? 'three-columns' : 'four-columns'}`}>
                  <SelectField label="Cancela saldo" onChange={(value) => updateCase((draft) => {
                    const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id);
                    target.kind = value;
                    if (value === 'Bonificacion') {
                      target.mode = '';
                      target.modeDetail = '';
                      return;
                    }
                    target.reason = '';
                    if (!target.mode) {
                      target.mode = PAYMENT_MODES[0];
                    }
                  })} options={['Parcial', 'Total', 'Bonificacion']} value={payment.kind} />
                  <DataField label="Monto" onChange={(value) => updateCase((draft) => {
                    const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id);
                    target.amount = value;
                  })} value={payment.amount} />
                  <DataField label="Fecha" onChange={(value) => updateCase((draft) => {
                    const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id);
                    target.date = value;
                  })} type="date" value={payment.date} />
                  {payment.kind !== 'Bonificacion' ? (
                    <SelectField label="Modo" onChange={(value) => updateCase((draft) => {
                      const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id);
                      target.mode = value;
                      if (value !== 'Otro') target.modeDetail = '';
                    })} options={PAYMENT_MODES} value={payment.mode} />
                  ) : null}
                </div>

                {payment.kind !== 'Bonificacion' && payment.mode === 'Otro' ? (
                  <DataField label="Detalle modo otro" onChange={(value) => updateCase((draft) => {
                    const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id);
                    target.modeDetail = value;
                  })} value={payment.modeDetail} />
                ) : null}

                {payment.kind === 'Bonificacion' ? (
                  <DataField label="Motivo bonificación" onChange={(value) => updateCase((draft) => {
                    const target = draft.thirdParty.payments.clientPayments.find((entry) => entry.id === payment.id);
                    target.reason = value;
                  })} value={payment.reason} />
                ) : null}

                <div className="actions-row compact-actions">
                  <StatusBadge tone={payment.kind === 'Bonificacion' ? 'info' : payment.kind === 'Total' ? 'success' : 'danger'}>
                    {payment.kind}
                  </StatusBadge>
                  <button className="ghost-button" onClick={() => updateCase((draft) => {
                    draft.thirdParty.payments.clientPayments = draft.thirdParty.payments.clientPayments.filter((entry) => entry.id !== payment.id);
                  })} type="button">Eliminar</button>
                </div>
              </div>
            ))}
          </div>

          {item.computed.thirdParty.hasExtraWorks && !item.thirdParty.payments.clientPayments.length ? (
            <div className="inline-alert danger-banner">Las tareas extras impactan en el cierre económico: registrá el cobro particular para llevar el saldo a cero.</div>
          ) : null}
          <button className="secondary-button" onClick={() => flash('Documentación de pagos: acá podés abrir recibos, transferencias o respaldos contables del tramo mixto.')} type="button">Documentación pagos</button>
        </article>
      </div>
    );
  }

  if (isInsuranceWorkflowCase(item)) {
    const isCleas = isCleasCase(item);
    const cleasClientChargeFlow = isCleas && item.computed.todoRisk.cleasScope === 'Sobre franquicia' && item.computed.todoRisk.dictamen === 'En contra';

    const addInvoice = () => {
      updateCase((draft) => {
        draft.payments.invoice = 'SI';
        draft.payments.invoices = [
          ...(draft.payments.invoices || []),
          createTodoRiskInvoice({
            amount: String(item.computed.todoRisk.amountToInvoice || ''),
            issuedAt: draft.payments.passedToPaymentsDate || draft.todoRisk.processing.quoteDate || '',
          }),
        ];
      });
    };

    return (
      <div className="tab-layout todo-risk-layout pagos-tab-layout ops-tab-layout">
        <div className="subtabs-row">
          {[
            { id: 'facturacion', label: 'Facturación' },
            { id: 'pagos', label: 'Pagos' },
          ].map((tab) => (
            <button className={`subtab-button ${activePaymentTab === tab.id ? 'is-active' : ''}`} key={tab.id} onClick={() => setActivePaymentTab(tab.id)} type="button">
              {tab.label}
            </button>
          ))}
        </div>

        {activePaymentTab === 'facturacion' ? <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Facturación</p>
              <h3>Datos traídos desde Tramitación</h3>
            </div>
            <div className="tag-row">
              <StatusBadge tone={item.computed.todoRisk.paymentsReady ? 'success' : 'info'}>{item.computed.todoRisk.paymentStatus}</StatusBadge>
              <button className="secondary-button" onClick={addInvoice} type="button">Agregar factura</button>
            </div>
          </div>

          <div className="form-grid four-columns compact-grid">
            <DataField label="Cía. aseguradora" onChange={() => {}} readOnly value={item.todoRisk.insurance.company} />
            <DataField label="N° de siniestro" onChange={() => {}} readOnly value={item.claimNumber || ''} />
            <DataField label="A facturar Cía." onChange={() => {}} readOnly value={item.computed.todoRisk.amountToInvoice} />
            <DataField label="Fecha de acuerdo" onChange={() => {}} readOnly type="date" value={item.todoRisk.processing.quoteDate} />
            {isCleas ? <DataField label="Monto franquicia" onChange={() => {}} readOnly value={item.computed.todoRisk.franchiseAmount || '0'} /> : null}
            {cleasClientChargeFlow ? <DataField label="Pago franquicia Cía." onChange={() => {}} readOnly value={item.computed.todoRisk.companyFranchisePaymentAmount} /> : null}
            {cleasClientChargeFlow ? <DataField label="A cargo del cliente" onChange={() => {}} readOnly value={item.computed.todoRisk.clientChargeAmount} /> : null}
            <DataField label="Cliente firma conforme" onChange={(value) => updateCase((draft) => { draft.payments.signedAgreementDate = value; })} type="date" value={item.payments.signedAgreementDate || ''} />
            <DataField label="Pasado a pagos" onChange={(value) => updateCase((draft) => { draft.payments.passedToPaymentsDate = value; })} type="date" value={item.payments.passedToPaymentsDate || ''} />
            <DataField label="Fecha estimada pago" onChange={(value) => updateCase((draft) => { draft.payments.estimatedPaymentDate = value; })} type="date" value={item.payments.estimatedPaymentDate || ''} />
            <DataField label="Razón social" onChange={(value) => updateCase((draft) => { draft.payments.businessName = value; })} value={item.payments.businessName || ''} />
          </div>

          <div className="budget-lines">
            {(item.payments.invoices || []).map((invoice) => (
              <div className="budget-line" key={invoice.id}>
                <DataField label="N° factura" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.invoiceNumber = value; if (!draft.payments.invoiceNumber) draft.payments.invoiceNumber = value; })} value={invoice.invoiceNumber} />
                <DataField label="Importe total" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.amount = value; })} value={invoice.amount} />
                <DataField label="Fecha factura" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.issuedAt = value; })} type="date" value={invoice.issuedAt} />
                <DataField label="Notas" onChange={(value) => updateCase((draft) => { const target = draft.payments.invoices.find((entry) => entry.id === invoice.id); target.notes = value; })} value={invoice.notes} />
              </div>
            ))}
          </div>
        </article> : null}

        {activePaymentTab === 'pagos' ? <article className="card inner-card">
          <div className="section-head small-gap">
            <div>
              <p className="eyebrow">Pagos</p>
              <h3>Fecha manual y estado automático</h3>
            </div>
            <StatusBadge tone={getStatusTone(item.computed.todoRisk.paymentStatus)}>{item.computed.todoRisk.paymentStatus}</StatusBadge>
          </div>

          <div className="form-grid four-columns compact-grid">
            <DataField label="Fecha de pago" onChange={(value) => updateCase((draft) => { draft.payments.paymentDate = value; })} type="date" value={item.payments.paymentDate || ''} />
            <DataField label="Monto depositado" onChange={(value) => updateCase((draft) => { draft.payments.depositedAmount = value; })} value={item.payments.depositedAmount || ''} />
            <ToggleField label="Retenciones" onChange={(value) => updateCase((draft) => { draft.payments.hasRetentions = value; })} value={item.payments.hasRetentions || 'NO'} />
            {isCleas ? <DataField label="CLEAS sobre" onChange={() => {}} readOnly value={item.computed.todoRisk.cleasScope || '-'} /> : <DataField label="Estado franquicia" onChange={() => {}} readOnly value={item.todoRisk.franchise.status} />}
            {isCleas ? <DataField label="Monto franquicia" onChange={() => {}} readOnly value={item.computed.todoRisk.franchiseAmount || '0'} /> : <DataField label="Monto franquicia" onChange={() => {}} readOnly value={item.todoRisk.franchise.amount || '0'} />}
            {isCleas ? <DataField label="Dictamen" onChange={() => {}} readOnly value={item.computed.todoRisk.dictamen} /> : <DataField label="Recupero" onChange={() => {}} readOnly value={item.todoRisk.franchise.recoveryType || 'Pendiente'} />}
            {isCleas ? <DataField label="N° de CLEAS" onChange={() => {}} readOnly value={item.todoRisk.insurance.cleasNumber || '-'} /> : <DataField label="Caso asociado" onChange={() => {}} readOnly value={item.todoRisk.franchise.associatedCase || '-'} />}
            {cleasClientChargeFlow ? <DataField label="Pago franquicia Cía." onChange={() => {}} readOnly value={item.computed.todoRisk.companyFranchisePaymentAmount} /> : null}
            {cleasClientChargeFlow ? <DataField label="A cargo del cliente" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.clientChargeAmount = value; })} value={item.todoRisk.processing.clientChargeAmount || ''} /> : null}
            {cleasClientChargeFlow ? <SelectField label="Estado pago cliente" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.clientChargeStatus = value; })} options={insurancePaymentStatusOptions} value={resolveCatalogCode(item.todoRisk.processing.clientChargeStatus, getCatalogEntries(insuranceCatalogs, 'paymentStatusCodes'), CLEAS_PAYMENT_STATUS_OPTIONS) || item.todoRisk.processing.clientChargeStatus} /> : null}
            {cleasClientChargeFlow ? <DataField label="Fecha pago cliente" onChange={(value) => updateCase((draft) => { draft.todoRisk.processing.clientChargeDate = value; })} type="date" value={item.todoRisk.processing.clientChargeDate || ''} /> : null}
          </div>

          {item.payments.hasRetentions === 'SI' ? (
            <div className="form-grid six-columns compact-grid retention-grid">
              <DataField label="IVA" onChange={(value) => updateCase((draft) => { draft.payments.retentions.iva = value; })} value={item.payments.retentions?.iva || ''} />
              <DataField label="Ganancias" onChange={(value) => updateCase((draft) => { draft.payments.retentions.gains = value; })} value={item.payments.retentions?.gains || ''} />
              <DataField label="Contr. Patr." onChange={(value) => updateCase((draft) => { draft.payments.retentions.employerContribution = value; })} value={item.payments.retentions?.employerContribution || ''} />
              <DataField label="IIBB" onChange={(value) => updateCase((draft) => { draft.payments.retentions.iibb = value; })} value={item.payments.retentions?.iibb || ''} />
              <DataField label="DREI" onChange={(value) => updateCase((draft) => { draft.payments.retentions.drei = value; })} value={item.payments.retentions?.drei || ''} />
              <DataField label="Otra" onChange={(value) => updateCase((draft) => { draft.payments.retentions.other = value; })} value={item.payments.retentions?.other || ''} />
            </div>
          ) : null}

          <div className="budget-ready-panel budget-ready-panel-compact">
            <StatusBadge tone={item.computed.todoRisk.paymentsReady ? 'success' : 'danger'}>{item.computed.todoRisk.paymentsReady ? 'Pagos en azul/verde operativo' : 'Pagos todavía no cierra'}</StatusBadge>
            <small>{cleasClientChargeFlow ? 'Condición: fecha de pago + monto + retenciones definidas si corresponde + pago cliente cancelado cuando aplica CLEAS sobre franquicia.' : 'Condición: fecha de pago + monto + retenciones definidas si corresponde + franquicia no pendiente.'}</small>
          </div>
          <button className="secondary-button" onClick={() => flash('Documentación de pagos: acá podés abrir la carpeta o adjuntos contables.') } type="button">Documentación pagos</button>
        </article> : null}
      </div>
    );
  }

  const addSettlement = () => {
    updateCase((draft) => {
      draft.payments.settlements.push(createSettlement());
    });
  };

  const paymentEvents = collectPaymentEvents([item]);

  const openReceiptDemo = () => {
    const printable = window.open('', '_blank', 'noopener,noreferrer,width=980,height=860');

    if (!printable) {
      return;
    }

    printable.document.write(`<!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Recibo ${escapeHtml(item.code)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 28px; color: #18252f; }
            h1, h2, p { margin: 0; }
            .stack { display: grid; gap: 12px; }
            .card { border: 1px solid #c9d5dc; border-radius: 12px; padding: 16px; margin-top: 16px; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
            .row { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid #eef2f4; padding: 8px 0; }
            small { color: #5f7481; }
          </style>
        </head>
        <body>
          <div class="stack">
            <div>
              <h1>Recibo Particular</h1>
              <p>${escapeHtml(item.code)} - ${escapeHtml(`${item.customer.lastName}, ${item.customer.firstName}`)}</p>
            </div>
            <div class="card grid">
              <div>
                <small>Vehículo</small>
                <p>${escapeHtml(`${item.vehicle.brand} ${item.vehicle.model} - ${item.vehicle.plate}`)}</p>
              </div>
              <div>
                <small>Comprobante</small>
                <p>${escapeHtml(item.payments.comprobante)}</p>
              </div>
              <div>
                <small>Total cotizado</small>
                <p>${escapeHtml(money(item.computed.totalQuoted))}</p>
              </div>
              <div>
                <small>Saldo deudor</small>
                <p>${escapeHtml(money(item.computed.balance))}</p>
              </div>
            </div>
            <div class="card">
              <h2>Movimientos</h2>
              ${paymentEvents.map((event) => `
                <div class="row">
                  <span>${escapeHtml(event.type)} - ${escapeHtml(formatDate(event.date))}</span>
                  <strong>${escapeHtml(money(event.amount))}</strong>
                </div>`).join('') || '<p>Sin movimientos registrados.</p>'}
            </div>
          </div>
        </body>
      </html>`);
    printable.document.close();
    printable.focus();
    printable.print();
  };

  return (
    <div className="tab-layout pagos-tab-layout ops-tab-layout">
      <article className="card inner-card receipt-shell">
        <div className="section-head">
          <div>
            <p className="eyebrow">Pagos</p>
            <h3>Comprobante, saldo y lectura contable</h3>
          </div>
          <StatusBadge tone={item.computed.balance === 0 ? 'success' : 'danger'}>{money(item.computed.balance)}</StatusBadge>
        </div>

        <div className="receipt-grid">
          <div className="summary-stack">
            <div className="summary-row"><span>Cliente</span><strong>{getFolderDisplayName(item)}</strong></div>
            <div className="summary-row"><span>Vehiculo</span><strong>{item.vehicle.brand} {item.vehicle.model} - {item.vehicle.plate}</strong></div>
            <div className="summary-row"><span>Repuestos</span><strong>{money(item.computed.partsTotal)}</strong></div>
            <div className="summary-row"><span>Mano de obra</span><strong>{money(item.payments.comprobante === 'A' ? item.computed.laborWithVat : item.computed.laborWithoutVat)}</strong></div>
            <div className="summary-row"><span>Total cotizado</span><strong>{money(item.computed.totalQuoted)}</strong></div>
            <div className="summary-row"><span>Retenciones cargadas</span><strong>{money(item.computed.totalRetentions)}</strong></div>
          </div>

          <div className="form-grid two-columns compact-grid receipt-core-grid">
            <SelectField label="Tipo de comprobante" onChange={(value) => updateCase((draft) => { draft.payments.comprobante = value; })} options={receiptTypeOptions} value={resolveCatalogCode(item.payments.comprobante, getCatalogEntries(financeCatalogs, 'receiptTypeCodes'), COMPROBANTES) || item.payments.comprobante} />
            <ToggleField label="Emitir factura" onChange={(value) => updateCase((draft) => { draft.payments.invoice = value; if (value !== 'SI') { draft.payments.businessName = ''; draft.payments.invoiceNumber = ''; } })} value={item.payments.invoice} />
            <ToggleField label="Seña" onChange={(value) => updateCase((draft) => { draft.payments.hasSena = value; if (value !== 'SI') { draft.payments.senaAmount = ''; draft.payments.senaDate = ''; draft.payments.senaModeDetail = ''; } })} value={item.payments.hasSena} />
          </div>

          <div className="receipt-status-row" aria-label="Estado de facturacion y senia">
            <span className={`status-badge ${item.payments.invoice === 'SI' ? 'success' : 'neutral'}`}>Factura: {item.payments.invoice === 'SI' ? 'Si' : 'No'}</span>
            <span className={`status-badge ${item.payments.hasSena === 'SI' ? 'info' : 'neutral'}`}>Seña: {item.payments.hasSena === 'SI' ? 'Si' : 'No'}</span>
          </div>
        </div>

        {item.payments.hasSena === 'SI' ? (
          <div className="form-grid four-columns compact-grid">
            <DataField label="Monto senia" onChange={(value) => updateCase((draft) => { draft.payments.senaAmount = value; })} value={item.payments.senaAmount} />
            <DataField label="Fecha senia" onChange={(value) => updateCase((draft) => { draft.payments.senaDate = value; })} type="date" value={item.payments.senaDate} />
            <SelectField label="Modo" onChange={(value) => updateCase((draft) => { draft.payments.senaMode = value; if (value !== 'OTRO' && value !== 'Otro') draft.payments.senaModeDetail = ''; })} options={paymentMethodOptions} value={resolveCatalogCode(item.payments.senaMode, getCatalogEntries(financeCatalogs, 'paymentMethodCodes'), PAYMENT_MODES) || item.payments.senaMode} />
            {item.payments.senaMode === 'Otro' ? (
              <DataField label="Detalle modo otro" onChange={(value) => updateCase((draft) => { draft.payments.senaModeDetail = value; })} value={item.payments.senaModeDetail} />
            ) : null}
          </div>
        ) : null}

        {item.payments.invoice === 'SI' ? (
          <div className="form-grid two-columns compact-grid receipt-invoice-grid">
            <DataField label="Razón social" onChange={(value) => updateCase((draft) => { draft.payments.businessName = value; })} value={item.payments.businessName} />
            <DataField label="Número factura" onChange={(value) => updateCase((draft) => { draft.payments.invoiceNumber = value; })} value={item.payments.invoiceNumber} />
          </div>
        ) : null}
      </article>

      <article className="card inner-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Cancelaciones</p>
            <h3>Parcial, total o bonificacion</h3>
          </div>
          <div className="tag-row">
            <button className="secondary-button" onClick={openReceiptDemo} type="button">Recibo / PDF</button>
            <button className="secondary-button" onClick={addSettlement} type="button">+ Agregar pago</button>
          </div>
        </div>

        <div className="budget-lines">
          {item.payments.settlements.map((settlement) => (
            <div className="settlement-card" key={settlement.id}>
              <div className={`form-grid compact-grid ${settlement.kind === 'Bonificacion' ? 'three-columns' : 'four-columns'}`}>
                <SelectField label="Cancela saldo" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.kind = value;
                  if (value === 'Bonificacion') {
                    target.mode = '';
                    target.modeDetail = '';
                    target.gainsRetention = '';
                    target.ivaRetention = '';
                    target.dreiRetention = '';
                    target.employerContributionRetention = '';
                    target.iibbRetention = '';
                    return;
                  }
                  target.reason = '';
                  if (!target.mode) {
                    target.mode = paymentMethodOptions[0]?.value || PAYMENT_MODES[0];
                  }
                })} options={['Parcial', 'Total', 'Bonificacion']} value={settlement.kind} />
                <DataField label="Monto" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.amount = value;
                })} value={settlement.amount} />
                <DataField label="Fecha" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.date = value;
                })} type="date" value={settlement.date} />
                {settlement.kind !== 'Bonificacion' ? (
                  <SelectField label="Modo" onChange={(value) => updateCase((draft) => {
                    const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                    target.mode = value;
                    if (value !== 'Otro') target.modeDetail = '';
                  })} options={paymentMethodOptions} value={resolveCatalogCode(settlement.mode, getCatalogEntries(financeCatalogs, 'paymentMethodCodes'), PAYMENT_MODES) || settlement.mode} />
                ) : null}
              </div>

              {settlement.kind !== 'Bonificacion' && settlement.mode === 'Otro' ? (
                <DataField label="Detalle modo otro" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.modeDetail = value;
                })} value={settlement.modeDetail} />
              ) : null}

              {settlement.kind === 'Bonificacion' ? (
                <DataField label="Motivo bonificacion" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.reason = value;
                })} value={settlement.reason} />
              ) : null}

              {settlement.kind !== 'Bonificacion' ? (
                <div className="form-grid five-columns compact-grid retention-grid">
                  <DataField label="Ganancias" onChange={(value) => updateCase((draft) => {
                    const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                    target.gainsRetention = value;
                  })} value={settlement.gainsRetention} />
                  <DataField label="IVA" onChange={(value) => updateCase((draft) => {
                    const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                    target.ivaRetention = value;
                  })} value={settlement.ivaRetention} />
                  <DataField label="DREI" onChange={(value) => updateCase((draft) => {
                    const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                    target.dreiRetention = value;
                  })} value={settlement.dreiRetention} />
                  <DataField label="Contr. Pat." onChange={(value) => updateCase((draft) => {
                    const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                    target.employerContributionRetention = value;
                  })} value={settlement.employerContributionRetention} />
                  <DataField label="IIBB" onChange={(value) => updateCase((draft) => {
                    const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                    target.iibbRetention = value;
                  })} value={settlement.iibbRetention} />
                </div>
              ) : null}

              <div className="actions-row compact-actions">
                <StatusBadge tone={settlement.kind === 'Bonificacion' ? 'info' : settlement.kind === 'Total' ? 'success' : 'danger'}>
                  {settlement.kind}
                </StatusBadge>
                <button className="ghost-button" onClick={() => updateCase((draft) => {
                  draft.payments.settlements = draft.payments.settlements.filter((entry) => entry.id !== settlement.id);
                })} type="button">Eliminar</button>
              </div>
            </div>
          ))}
        </div>

        <div className="receipt-demo">
          <div>
            <span>Recibo</span>
            <strong>{item.code}</strong>
          </div>
          <div>
            <span>Total cotizado segun comprobante {item.payments.comprobante}</span>
            <strong>{money(item.computed.totalQuoted)}</strong>
          </div>
          <div>
            <span>Saldo deudor</span>
            <strong>{money(item.computed.balance)}</strong>
          </div>
        </div>
      </article>

      <article className="card inner-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Vista contable</p>
            <h3>Ordenado por fecha de cobro</h3>
          </div>
          <StatusBadge tone="info">{paymentEvents.length} movimientos</StatusBadge>
        </div>

        <div className="table-wrap">
          <table className="data-table compact-table accounting-table">
            <thead>
              <tr>
                <th>Fecha efectivo pago</th>
                <th>Monto depositado</th>
                <th>Ganancias</th>
                <th>IVA</th>
                <th>DREI</th>
                <th>Contr. Pat.</th>
                <th>IIBB</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {paymentEvents.map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.date)}</td>
                  <td>{money(event.amount)}</td>
                  <td>{money(event.gainsRetention)}</td>
                  <td>{money(event.ivaRetention)}</td>
                  <td>{money(event.dreiRetention)}</td>
                  <td>{money(event.employerContributionRetention)}</td>
                  <td>{money(event.iibbRetention)}</td>
                  <td>
                    <strong>{event.type}</strong>
                    <small>{event.folderName}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

