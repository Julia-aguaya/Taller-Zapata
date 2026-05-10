import DataField from '../../../components/ui/DataField';
import SelectField from '../../../components/ui/SelectField';
import StatusBadge from '../../../components/ui/StatusBadge';
import ToggleField from '../../../components/ui/ToggleField';
import { PAINT_TYPES, VEHICLE_TYPES, VEHICLE_USES } from '../../newCase/constants/formOptions';
import {
  isFranchiseRecoveryCase,
  isThirdPartyClaimCase,
  getFolderDisplayName,
} from '../../cases/lib/caseDomainCheckers';
import { formatDate } from '../../cases/lib/caseFormatters';
import {
  CIVIL_STATUS_OPTIONS,
  OWNERSHIP_PERCENTAGE_OPTIONS,
  TRANSMISSION_OPTIONS,
  VEHICLE_BRAND_OPTIONS,
} from '../constants/gestionOptions';
import { getStatusTone, maxDate, money } from '../lib/gestionUtils';

export default function FichaTecnicaTab({ item, updateCase }) {
  const isThirdParty = isThirdPartyClaimCase(item);
  const isFranchiseRecovery = isFranchiseRecoveryCase(item);
  const clientRegistry = isThirdParty ? item.thirdParty.clientRegistry : null;
  const franchiseSummary = isFranchiseRecovery ? item.computed.franchiseRecovery : null;
  const repairEnabled = franchiseSummary?.repairEnabled ?? true;
  const visibleOwners = isThirdParty && clientRegistry.isOwner === 'NO'
    ? clientRegistry.owners.slice(0, clientRegistry.ownershipPercentage === '50%' ? 2 : 1)
    : [];
  const laborSummary = item.payments.comprobante === 'A' ? item.computed.laborWithVat : item.computed.laborWithoutVat;
  const latestSettlement = isThirdParty
    ? maxDate(item.payments.paymentDate, (item.thirdParty.payments.clientPayments || []).reduce((latest, payment) => maxDate(latest, payment.date), ''))
    : item.payments.settlements.reduce((latest, settlement) => maxDate(latest, settlement.date), '');
  const ingresoSummary = item.repair.ingreso.realDate
    ? `${formatDate(item.repair.ingreso.realDate)}${item.repair.ingreso.hasObservation === 'SI' ? ' · con observaciones' : ''}`
    : 'Pendiente';
  const egresoSummary = item.repair.egreso.date
    ? `${formatDate(item.repair.egreso.date)}${item.repair.egreso.shouldReenter === 'SI' ? ' · requiere reingreso' : item.repair.egreso.definitiveExit ? ' · definitivo' : ''}`
    : 'Pendiente';

  return (
    <div className="tab-layout ficha-tab-layout ops-tab-layout">
      <div className="form-grid two-columns">
        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Cliente</h3>
            <StatusBadge tone={item.customer.referenced === 'SI' ? 'info' : 'success'}>
              Referenciado {item.customer.referenced || 'NO'}
            </StatusBadge>
          </div>
          <div className="form-grid two-columns compact-grid">
            <DataField label="Nombre" onChange={(value) => updateCase((draft) => { draft.customer.firstName = value; })} value={item.customer.firstName} />
            <DataField label="Apellido" onChange={(value) => updateCase((draft) => { draft.customer.lastName = value; })} value={item.customer.lastName} />
            <DataField label="Documento" onChange={(value) => updateCase((draft) => { draft.customer.document = value; })} value={item.customer.document} />
            <DataField label="N° siniestro" onChange={(value) => updateCase((draft) => { draft.claimNumber = value; })} value={item.claimNumber || ''} />
            <DataField label="Fecha nacimiento" onChange={(value) => updateCase((draft) => { draft.customer.birthDate = value; })} type="date" value={item.customer.birthDate || ''} />
            <SelectField label="Estado civil" onChange={(value) => updateCase((draft) => { draft.customer.civilStatus = value; })} options={CIVIL_STATUS_OPTIONS} placeholder="Seleccioná" value={item.customer.civilStatus || ''} />
            <DataField label="Telefono" onChange={(value) => updateCase((draft) => { draft.customer.phone = value; })} value={item.customer.phone} />
            <DataField label="Localidad" onChange={(value) => updateCase((draft) => { draft.customer.locality = value; })} value={item.customer.locality} />
            <DataField label="Email" onChange={(value) => updateCase((draft) => { draft.customer.email = value; })} value={item.customer.email} />
            <DataField label="Ocupación" onChange={(value) => updateCase((draft) => { draft.customer.occupation = value; })} value={item.customer.occupation || ''} />
            <DataField label="Calle" onChange={(value) => updateCase((draft) => { draft.customer.street = value; })} value={item.customer.street || ''} />
            <DataField label="Número" onChange={(value) => updateCase((draft) => { draft.customer.streetNumber = value; })} value={item.customer.streetNumber || ''} />
            <DataField label="Piso / Depto" onChange={(value) => updateCase((draft) => { draft.customer.addressExtra = value; })} value={item.customer.addressExtra || ''} />
            <ToggleField label="Referenciado" onChange={(value) => updateCase((draft) => { draft.customer.referenced = value; if (value !== 'SI') draft.customer.referencedName = ''; })} value={item.customer.referenced} />
            {item.customer.referenced === 'SI' ? (
              <DataField label="Nombre referenciado" onChange={(value) => updateCase((draft) => { draft.customer.referencedName = value; })} value={item.customer.referencedName} />
            ) : null}
          </div>
          {isThirdParty ? (
            <>
              <div className="budget-ready-panel budget-ready-panel-compact">
                <StatusBadge tone={clientRegistry.isOwner === 'SI' ? 'success' : 'info'}>{clientRegistry.isOwner === 'SI' ? 'Cliente titular registral' : 'Titular registral externo'}</StatusBadge>
                <small>Si el cliente no es titular, el sistema toma el primer titular registral para nombrar la carpeta.</small>
              </div>
              <div className="form-grid three-columns compact-grid">
                <ToggleField label="Titular registral" onChange={(value) => updateCase((draft) => {
                  draft.thirdParty.clientRegistry.isOwner = value;
                  if (value !== 'NO') {
                    draft.thirdParty.clientRegistry.ownershipPercentage = '100%';
                  }
                })} value={clientRegistry.isOwner} />
                <SelectField disabled={clientRegistry.isOwner !== 'NO'} label="Porcentaje titularidad" onChange={(value) => updateCase((draft) => {
                  draft.thirdParty.clientRegistry.ownershipPercentage = value;
                })} options={OWNERSHIP_PERCENTAGE_OPTIONS} value={clientRegistry.ownershipPercentage} />
                <DataField label="Identificación carpeta" onChange={() => {}} readOnly value={getFolderDisplayName(item)} />
              </div>
              {visibleOwners.map((owner, index) => (
                <div className="nested-card" key={owner.id}>
                  <div className="section-head small-gap">
                    <h4>{index === 0 ? 'Titular registral principal' : 'Otro titular registral'}</h4>
                    <StatusBadge tone={owner.firstName || owner.lastName ? 'info' : 'danger'}>{owner.firstName || owner.lastName ? 'Cargado' : 'Pendiente'}</StatusBadge>
                  </div>
                  <div className="form-grid two-columns compact-grid">
                    <DataField label="Nombre" onChange={(value) => updateCase((draft) => { draft.thirdParty.clientRegistry.owners[index].firstName = value; })} value={owner.firstName} />
                    <DataField label="Apellido" onChange={(value) => updateCase((draft) => { draft.thirdParty.clientRegistry.owners[index].lastName = value; })} value={owner.lastName} />
                    <DataField label="Documento" onChange={(value) => updateCase((draft) => { draft.thirdParty.clientRegistry.owners[index].document = value; })} value={owner.document} />
                    <DataField label="Fecha nacimiento" onChange={(value) => updateCase((draft) => { draft.thirdParty.clientRegistry.owners[index].birthDate = value; })} type="date" value={owner.birthDate || ''} />
                    <DataField label="Telefono" onChange={(value) => updateCase((draft) => { draft.thirdParty.clientRegistry.owners[index].phone = value; })} value={owner.phone || ''} />
                    <DataField label="Localidad" onChange={(value) => updateCase((draft) => { draft.thirdParty.clientRegistry.owners[index].locality = value; })} value={owner.locality || ''} />
                  </div>
                </div>
              ))}
            </>
          ) : null}
        </article>

        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Vehiculo</h3>
            <StatusBadge tone="info">{item.vehicle.plate}</StatusBadge>
          </div>
          <div className="form-grid two-columns compact-grid">
            <SelectField label="Marca" onChange={(value) => updateCase((draft) => { draft.vehicle.brand = value; })} options={VEHICLE_BRAND_OPTIONS} placeholder="Seleccioná" value={item.vehicle.brand} />
            <DataField label="Modelo" onChange={(value) => updateCase((draft) => { draft.vehicle.model = value; })} value={item.vehicle.model} />
            <DataField label="Dominio" onChange={(value) => updateCase((draft) => { draft.vehicle.plate = value.toUpperCase(); })} value={item.vehicle.plate} />
            <DataField label="Ano" onChange={(value) => updateCase((draft) => { draft.vehicle.year = value; })} value={item.vehicle.year} />
            <SelectField label="Tipo" onChange={(value) => updateCase((draft) => { draft.vehicle.type = value; })} options={VEHICLE_TYPES} value={item.vehicle.type} />
            <SelectField label="Uso" onChange={(value) => updateCase((draft) => { draft.vehicle.usage = value; })} options={VEHICLE_USES} value={item.vehicle.usage} />
            <SelectField label="Pintura" onChange={(value) => updateCase((draft) => { draft.vehicle.paint = value; })} options={PAINT_TYPES} value={item.vehicle.paint} />
            <DataField label="Color" onChange={(value) => updateCase((draft) => { draft.vehicle.color = value; })} value={item.vehicle.color} />
            <DataField label="Motor" onChange={(value) => updateCase((draft) => { draft.vehicle.engine = value; })} value={item.vehicle.engine || ''} />
            <DataField label="Chasis" onChange={(value) => updateCase((draft) => { draft.vehicle.chassis = value; })} value={item.vehicle.chassis || ''} />
            <SelectField label="Caja" onChange={(value) => updateCase((draft) => { draft.vehicle.transmission = value; })} options={TRANSMISSION_OPTIONS} placeholder="Seleccioná" value={item.vehicle.transmission || ''} />
            <DataField label="Kilometraje" onChange={(value) => updateCase((draft) => { draft.vehicle.mileage = value; })} inputMode="numeric" value={item.vehicle.mileage || ''} />
          </div>
          <label className="field">
            <span>Observaciones del vehículo</span>
            <textarea onChange={(event) => updateCase((draft) => { draft.vehicle.observations = event.target.value; })} value={item.vehicle.observations || ''} />
          </label>
        </article>
      </div>

      <div className="form-grid two-columns ficha-summary-grid">
        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Resumen Reparacion</h3>
            <StatusBadge tone={!repairEnabled ? 'info' : item.computed.partsStatus === 'Recibido' ? 'success' : 'danger'}>{!repairEnabled ? 'No aplica' : item.computed.partsStatus}</StatusBadge>
          </div>
          <div className="summary-stack">
            <div className="summary-row"><span>Taller</span><strong>{item.budget.workshop}</strong></div>
            <div className="summary-row"><span>Presupuestó</span><strong>{item.budget.authorizer || 'Pendiente'} · {item.budget.partsQuotedDate ? formatDate(item.budget.partsQuotedDate) : 'sin fecha'}</strong></div>
            <div className="summary-row"><span>Habilita reparación</span><strong>{repairEnabled ? 'SI' : 'NO'}</strong></div>
            <div className="summary-row"><span>Turno</span><strong>{repairEnabled ? (item.repair.turno.date ? `${formatDate(item.repair.turno.date)} · ${item.repair.turno.state}` : 'Sin agendar') : 'Oculto por trámite'}</strong></div>
            <div className="summary-row"><span>Anotaciones turno</span><strong>{repairEnabled ? (item.repair.turno.notes || 'Sin notas de turno') : 'Gestión reparación deshabilitada'}</strong></div>
            <div className="summary-row"><span>Mano de obra resumen</span><strong>{money(laborSummary)} · comprobante {item.payments.comprobante}</strong></div>
            <div className="summary-row"><span>Ingreso</span><strong>{repairEnabled ? ingresoSummary : 'No aplica'}</strong></div>
            <div className="summary-row"><span>Egreso</span><strong>{repairEnabled ? egresoSummary : 'No aplica'}</strong></div>
            <div className="summary-row"><span>Salida estimada</span><strong>{repairEnabled ? (item.computed.turnoEstimatedExit ? formatDate(item.computed.turnoEstimatedExit) : 'Pendiente') : 'No aplica'}</strong></div>
          </div>
        </article>

        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Resumen Pagos</h3>
            <StatusBadge tone={getStatusTone(item.computed.paymentState)}>{item.computed.paymentState}</StatusBadge>
          </div>
          <div className="summary-stack">
            <div className="summary-row"><span>Total cotizado</span><strong>{money(item.computed.totalQuoted)}</strong></div>
            <div className="summary-row"><span>{isThirdParty ? 'Cobro compañía' : 'Senia'}</span><strong>{isThirdParty ? money(item.computed.paidAmount) : item.payments.hasSena === 'SI' ? money(item.payments.senaAmount) : 'No'}</strong></div>
            <div className="summary-row"><span>{isThirdParty ? 'Cobro extras cliente' : 'Cobrado'}</span><strong>{isThirdParty ? money(item.computed.thirdParty.clientPaymentsTotal) : money(item.computed.paidAmount)}</strong></div>
            <div className="summary-row"><span>{isThirdParty ? 'Saldo extras cliente' : 'Saldo deudor'}</span><strong>{isThirdParty ? money(item.computed.thirdParty.clientExtrasBalance) : money(item.computed.balance)}</strong></div>
            <div className="summary-row"><span>Último cobro</span><strong>{latestSettlement ? formatDate(latestSettlement) : 'Sin cobros'}</strong></div>
            <div className="summary-row"><span>Factura</span><strong>{item.payments.invoice === 'SI' ? `${item.payments.businessName} · ${item.payments.invoiceNumber}` : 'No'}</strong></div>
          </div>
        </article>

        <article className="card inner-card summary-span-two">
          <div className="section-head small-gap">
            <h3>Lectura consolidada</h3>
            <StatusBadge tone={item.computed.closeReady ? 'success' : 'info'}>{item.computed.closeReady ? 'Caso cerrable' : 'Caso abierto'}</StatusBadge>
          </div>
          <div className="vehicle-meta-grid consolidated-meta-grid">
            <div>
              <span>Vehículo completo</span>
              <strong>{item.computed.hasVehicleData ? 'OK' : `Falta ${item.computed.vehicleMissingFields.join(', ')}`}</strong>
            </div>
            <div>
              <span>Estado repuestos</span>
              <strong>{repairEnabled ? item.computed.partsStatus : 'No aplica'}</strong>
            </div>
            <div>
              <span>Reingreso</span>
              <strong>{repairEnabled ? (item.repair.egreso.shouldReenter === 'SI' ? (item.repair.egreso.reentryDate ? formatDate(item.repair.egreso.reentryDate) : 'Pendiente agendar') : 'No') : 'No aplica'}</strong>
            </div>
            <div>
              <span>Fotos reparado</span>
              <strong>{repairEnabled ? (item.repair.egreso.repairedPhotos ? 'Cargadas' : 'Pendientes') : 'No aplica'}</strong>
            </div>
            {isFranchiseRecovery ? (
              <>
                <div>
                  <span>Carpeta asociada</span>
                  <strong>{item.franchiseRecovery?.associatedFolderCode || 'Pendiente'}</strong>
                </div>
                <div>
                  <span>Dictamen</span>
                  <strong>{item.franchiseRecovery?.dictamen || 'Pendiente'}</strong>
                </div>
                <div>
                  <span>Monto a recuperar</span>
                  <strong>{money(item.franchiseRecovery?.amountToRecover || 0)}</strong>
                </div>
                <div>
                  <span>Recupero a cliente</span>
                  <strong>{item.computed.franchiseRecovery?.dictamenShared ? 'Demo 50/50' : item.computed.franchiseRecovery?.canRecoverToClient ? item.franchiseRecovery?.recoverToClient || 'NO' : 'No aplica'}</strong>
                </div>
                <div>
                  <span>Gestión reparación</span>
                  <strong>{repairEnabled ? 'Habilitada' : 'Oculta'}</strong>
                </div>
                <div>
                  <span>Monto cliente</span>
                  <strong>{item.computed.franchiseRecovery?.clientChargeActive ? money(item.computed.franchiseRecovery?.clientResponsibilityAmount || 0) : 'No aplica'}</strong>
                </div>
              </>
            ) : null}
            {isThirdParty ? (
              <>
                <div>
                  <span>Pago compañía</span>
                  <strong>{item.computed.thirdParty.companyPaymentReady ? 'OK' : 'Pendiente'}</strong>
                </div>
                <div>
                  <span>Cierre extras cliente</span>
                  <strong>{item.computed.thirdParty.hasExtraWorks ? (item.computed.thirdParty.clientExtrasReady ? 'OK' : money(item.computed.thirdParty.clientExtrasBalance)) : 'No aplica'}</strong>
                </div>
              </>
            ) : null}
          </div>
        </article>
      </div>
    </div>
  );
}
