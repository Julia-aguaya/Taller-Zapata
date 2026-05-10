import { normalizeDocument, normalizePlate } from '../../cases/lib/caseNormalizers';
import DataField from '../../../components/ui/DataField';
import SelectField from '../../../components/ui/SelectField';
import StatusBadge from '../../../components/ui/StatusBadge';
import ToggleField from '../../../components/ui/ToggleField';
import { BRANCHES, PAINT_TYPES, TRAMITE_TYPES, VEHICLE_TYPES, VEHICLE_USES } from '../constants/formOptions';

export default function NuevoCaso({
  form,
  onChange,
  onCreate,
  nextCode,
  missing,
  showValidation,
  customerLookupState,
  vehicleLookupState,
  onSearchDocument,
  onSearchPlate,
  autofilledFields,
}) {
  const fieldHasError = (field) => showValidation && missing.includes(field);
  const fieldWasAutofilled = (field) => autofilledFields.includes(field);
  const customerTone = customerLookupState.status === 'found' ? 'success' : customerLookupState.status === 'empty' ? 'danger' : 'info';
  const vehicleTone = vehicleLookupState.status === 'found' ? 'success' : vehicleLookupState.status === 'empty' ? 'danger' : 'info';

  return (
    <div className="page-stack">
      <section className="hero-panel compact-hero">
        <div className="stack-tight">
          <p className="eyebrow">Nuevo caso</p>
          <h1>Alta de caso particular</h1>
          <p className="muted">Completá los datos mínimos y generá la carpeta.</p>
        </div>
        <div className="tag-row">
          <StatusBadge tone="info">Carpeta automática</StatusBadge>
          <StatusBadge tone={missing.length ? 'danger' : 'success'}>{nextCode}</StatusBadge>
        </div>
      </section>

      <section className="content-grid single-column">
        <article className="card nuevo-caso-card">
          <div className="section-head nuevo-caso-head">
            <div className="stack-tight nuevo-caso-title-group">
              <p className="eyebrow">Minimos obligatorios</p>
              <h2>Datos para generar carpeta</h2>
            </div>
            <StatusBadge tone={missing.length ? 'danger' : 'success'}>
              {missing.length ? 'Completar datos' : 'Listo para generar'}
            </StatusBadge>
          </div>

          <div className="lookup-grid nuevo-caso-lookups">
            <div className={`lookup-card ${customerLookupState.status === 'found' ? 'is-found' : ''}`}>
              <div className="lookup-head">
                <div className="stack-tight">
                  <p className="eyebrow">Cliente</p>
                  <h3>Buscar por DNI</h3>
                </div>
                {customerLookupState.message ? <StatusBadge tone={customerTone}>{customerLookupState.message}</StatusBadge> : null}
              </div>
              <div className="lookup-form">
                <DataField
                  highlighted={fieldWasAutofilled('document')}
                  label="DNI"
                  onChange={(value) => onChange('document', normalizeDocument(value))}
                  placeholder="Ej: 30111888"
                  value={form.document}
                  inputMode="numeric"
                />
                <button className="secondary-button" onClick={onSearchDocument} type="button">Buscar DNI</button>
              </div>
              {customerLookupState.detail ? <p className="lookup-detail">{customerLookupState.detail}</p> : null}
            </div>

            <div className={`lookup-card ${vehicleLookupState.status === 'found' ? 'is-found' : ''}`}>
              <div className="lookup-head">
                <div className="stack-tight">
                  <p className="eyebrow">Vehículo</p>
                  <h3>Buscar por patente</h3>
                </div>
                {vehicleLookupState.message ? <StatusBadge tone={vehicleTone}>{vehicleLookupState.message}</StatusBadge> : null}
              </div>
              <div className="lookup-form">
                <DataField
                  highlighted={fieldWasAutofilled('plate')}
                  label="Patente"
                  onChange={(value) => onChange('plate', normalizePlate(value))}
                  placeholder="Ej: AA365BE"
                  value={form.plate}
                  invalid={fieldHasError('dominio')}
                />
                <button className="secondary-button" onClick={onSearchPlate} type="button">Buscar patente</button>
              </div>
              {vehicleLookupState.detail ? <p className="lookup-detail">{vehicleLookupState.detail}</p> : null}
            </div>
          </div>

          <div className="auto-code-card nuevo-caso-code-card" role="status" aria-live="polite">
            <span>Identificador de carpeta</span>
            <strong>{nextCode}</strong>
          </div>

          <div className="form-grid three-columns nuevo-caso-form">
            <SelectField invalid={fieldHasError('tipo de tramite')} label="Tipo de tramite" onChange={(value) => onChange('type', value)} options={TRAMITE_TYPES} required value={form.type} />
            <SelectField label="Sucursal" onChange={(value) => onChange('branch', value)} options={BRANCHES.map((branch) => branch.label)} value={form.branch} />
            <DataField label="N° siniestro" onChange={(value) => onChange('claimNumber', value)} value={form.claimNumber} />
            <DataField highlighted={fieldWasAutofilled('firstName')} invalid={fieldHasError('nombre')} label="Nombre" onChange={(value) => onChange('firstName', value)} required value={form.firstName} />
            <DataField highlighted={fieldWasAutofilled('lastName')} invalid={fieldHasError('apellido')} label="Apellido" onChange={(value) => onChange('lastName', value)} required value={form.lastName} />
            <DataField highlighted={fieldWasAutofilled('phone')} label="Telefono" onChange={(value) => onChange('phone', value)} value={form.phone} />
            <DataField highlighted={fieldWasAutofilled('brand')} invalid={fieldHasError('marca')} label="Marca" onChange={(value) => onChange('brand', value)} required value={form.brand} />
            <DataField highlighted={fieldWasAutofilled('model')} invalid={fieldHasError('modelo')} label="Modelo" onChange={(value) => onChange('model', value)} required value={form.model} />
            <SelectField highlighted={fieldWasAutofilled('vehicleType')} label="Tipo vehiculo" onChange={(value) => onChange('vehicleType', value)} options={VEHICLE_TYPES} value={form.vehicleType} />
            <SelectField highlighted={fieldWasAutofilled('vehicleUse')} label="Uso" onChange={(value) => onChange('vehicleUse', value)} options={VEHICLE_USES} value={form.vehicleUse} />
            <SelectField highlighted={fieldWasAutofilled('paint')} label="Pintura" onChange={(value) => onChange('paint', value)} options={PAINT_TYPES} value={form.paint} />
            <ToggleField highlighted={fieldWasAutofilled('referenced')} invalid={fieldHasError('referenciado si/no')} label="Referenciado" onChange={(value) => onChange('referenced', value)} required value={form.referenced} />
            {form.referenced === 'SI' ? (
              <DataField highlighted={fieldWasAutofilled('referencedName')} invalid={fieldHasError('nombre del referenciado')} label="Nombre del referenciado" onChange={(value) => onChange('referencedName', value)} required value={form.referencedName} />
            ) : null}
          </div>

          <button className="primary-button" onClick={onCreate} type="button">
            Generar carpeta {form.type || 'Particular'}
          </button>
        </article>
      </section>
    </div>
  );
}
