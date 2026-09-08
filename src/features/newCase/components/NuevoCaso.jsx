import { useEffect, useMemo, useState } from 'react';
import { normalizeDocument, normalizePlate } from '../../cases/lib/caseNormalizers';
import DataField from '../../../components/ui/DataField';
import SelectField from '../../../components/ui/SelectField';
import StatusBadge from '../../../components/ui/StatusBadge';
import ToggleField from '../../../components/ui/ToggleField';
import { createAuthenticatedReferrer, readAuthenticatedReferrers } from '../../../lib/api/backend';
import { BRANCHES, PAINT_TYPES, TRAMITE_TYPES, VEHICLE_TYPES, VEHICLE_USES } from '../constants/formOptions';

export default function NuevoCaso({
  accessToken,
  form,
  onChange,
  onCreate,
  isCreating = false,
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
  const isSearchingCustomer = customerLookupState.status === 'loading';
  const isSearchingVehicle = vehicleLookupState.status === 'loading';
  const [referenceSearch, setReferenceSearch] = useState('');
  const [referrers, setReferrers] = useState([]);
  const [newReferrer, setNewReferrer] = useState({ nombre: '', apellido: '' });
  const [referralStatus, setReferralStatus] = useState({ status: 'idle', message: '' });
  const hasPendingReferrer = Boolean(newReferrer.nombre.trim() && newReferrer.apellido.trim());
  const effectiveMissing = missing.filter((field) => field !== 'referenciador' || !hasPendingReferrer);

  useEffect(() => {
    if (form.referenced !== 'SI' || !accessToken) {
      setReferralStatus({ status: 'idle', message: '' });
      return;
    }

    let ignore = false;
    setReferralStatus({ status: 'loading', message: '' });
    readAuthenticatedReferrers(accessToken, { active: true })
      .then((result) => {
        if (ignore) return;
        setReferrers(Array.isArray(result.data) ? result.data : []);
        setReferralStatus({ status: 'success', message: '' });
      })
      .catch((error) => {
        if (ignore) return;
        setReferralStatus({ status: 'error', message: error?.message || 'No pudimos cargar referenciadores.' });
      });

    return () => {
      ignore = true;
    };
  }, [accessToken, form.referenced]);

  useEffect(() => {
    if (form.referenced !== 'SI') {
      setReferenceSearch('');
    }
  }, [form.referenced]);

  const filteredReferralOptions = useMemo(() => {
    const search = referenceSearch.trim().toLowerCase();
    const items = search
      ? referrers.filter((item) => [item?.nombre, item?.apellido, item?.displayName, item?.telefono].filter(Boolean).some((value) => String(value).toLowerCase().includes(search)))
      : referrers;

    return items.map((item) => ({ value: String(item.id), label: item.displayName || [item.nombre, item.apellido].filter(Boolean).join(' ') }));
  }, [referenceSearch, referrers]);

  const selectReferrer = (id) => {
    const referrer = referrers.find((item) => String(item.id) === id);
    onChange('referenciadorId', id);
    onChange('referencedName', referrer?.displayName || [referrer?.nombre, referrer?.apellido].filter(Boolean).join(' '));
  };

  const createReferrer = async () => {
    const nombre = newReferrer.nombre.trim();
    const apellido = newReferrer.apellido.trim();
    if (!nombre) {
      setReferralStatus({ status: 'error', message: 'Ingresá el nombre del referenciador.' });
      return;
    }

    setReferralStatus({ status: 'creating', message: '' });
    try {
      const result = await createAuthenticatedReferrer(accessToken, { nombre, apellido: apellido || null, telefono: null });
      const referrer = result.data;
      const displayName = referrer.displayName || [referrer.nombre, referrer.apellido].filter(Boolean).join(' ');
      setReferrers((current) => [...current.filter((item) => item.id !== referrer.id), referrer]);
      onChange('referenciadorId', String(referrer.id));
      onChange('referencedName', displayName);
      setNewReferrer({ nombre: '', apellido: '' });
      setReferralStatus({ status: 'success', message: '' });
      return { referenciadorId: String(referrer.id), referencedName: displayName };
    } catch (error) {
      setReferralStatus({ status: 'error', message: error?.message || 'No pudimos crear el referenciador.' });
      return null;
    }
  };

  const handleCreateCase = async () => {
    if (referralStatus.status === 'creating') {
      return;
    }

    if (form.referenced === 'SI' && !form.referenciadorId && hasPendingReferrer) {
      const createdReferrer = await createReferrer();
      if (!createdReferrer) {
        return;
      }
      onCreate(createdReferrer);
      return;
    }

    onCreate();
  };

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
          <StatusBadge tone={effectiveMissing.length ? 'danger' : 'success'}>{nextCode}</StatusBadge>
        </div>
      </section>

      <section className="content-grid single-column">
        <article className="card nuevo-caso-card">
          <div className="section-head nuevo-caso-head">
            <div className="stack-tight nuevo-caso-title-group">
              <p className="eyebrow">Mínimos obligatorios</p>
              <h2>Datos para generar carpeta</h2>
            </div>
              <StatusBadge tone={effectiveMissing.length ? 'danger' : 'success'}>
               {effectiveMissing.length ? 'Completar datos' : 'Listo para generar'}
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
                <button
                  aria-busy={isSearchingCustomer ? 'true' : 'false'}
                  className="secondary-button"
                  disabled={isSearchingCustomer}
                  onClick={onSearchDocument}
                  type="button"
                >
                  {isSearchingCustomer ? 'Buscando cliente por DNI...' : 'Buscar DNI'}
                </button>
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
                <button
                  aria-busy={isSearchingVehicle ? 'true' : 'false'}
                  className="secondary-button"
                  disabled={isSearchingVehicle}
                  onClick={onSearchPlate}
                  type="button"
                >
                  {isSearchingVehicle ? 'Buscando vehículo por patente...' : 'Buscar patente'}
                </button>
              </div>
              {vehicleLookupState.detail ? <p className="lookup-detail">{vehicleLookupState.detail}</p> : null}
            </div>
          </div>

          <div className="auto-code-card nuevo-caso-code-card" role="status" aria-live="polite">
            <span>Identificador de carpeta</span>
            <strong>{nextCode}</strong>
          </div>

          <div className="form-grid three-columns nuevo-caso-form">
            <SelectField invalid={fieldHasError('tipo de tramite')} label="Tipo de trámite" onChange={(value) => onChange('type', value)} options={TRAMITE_TYPES} required value={form.type} />
            <SelectField label="Sucursal" onChange={(value) => onChange('branch', value)} options={BRANCHES.map((branch) => branch.label)} value={form.branch} />
            <DataField label="N° siniestro" onChange={(value) => onChange('claimNumber', value)} value={form.claimNumber} />
            <DataField highlighted={fieldWasAutofilled('firstName')} invalid={fieldHasError('nombre')} label="Nombre" onChange={(value) => onChange('firstName', value)} required value={form.firstName} />
            <DataField highlighted={fieldWasAutofilled('lastName')} invalid={fieldHasError('apellido')} label="Apellido" onChange={(value) => onChange('lastName', value)} required value={form.lastName} />
            <DataField highlighted={fieldWasAutofilled('phone')} label="Teléfono" onChange={(value) => onChange('phone', value)} value={form.phone} />
            <DataField highlighted={fieldWasAutofilled('brand')} invalid={fieldHasError('marca')} label="Marca" onChange={(value) => onChange('brand', value)} required value={form.brand} />
            <DataField highlighted={fieldWasAutofilled('model')} invalid={fieldHasError('modelo')} label="Modelo" onChange={(value) => onChange('model', value)} required value={form.model} />
            <SelectField highlighted={fieldWasAutofilled('vehicleType')} label="Tipo de vehículo" onChange={(value) => onChange('vehicleType', value)} options={VEHICLE_TYPES} value={form.vehicleType} />
            <SelectField highlighted={fieldWasAutofilled('vehicleUse')} label="Uso" onChange={(value) => onChange('vehicleUse', value)} options={VEHICLE_USES} value={form.vehicleUse} />
            <SelectField highlighted={fieldWasAutofilled('paint')} label="Pintura" onChange={(value) => onChange('paint', value)} options={PAINT_TYPES} value={form.paint} />
             <ToggleField highlighted={fieldWasAutofilled('referenced')} invalid={fieldHasError('referenciado si/no')} label="Referenciado" onChange={(value) => onChange('referenced', value)} required value={form.referenced} />
             {form.referenced === 'SI' ? (
              <div className="stack-tight nuevo-caso-reference-picker">
                  <DataField label="Buscar referenciador" onChange={setReferenceSearch} placeholder="Buscar por nombre" value={referenceSearch} />
                  <SelectField highlighted={fieldWasAutofilled('referenciadorId')} invalid={fieldHasError('referenciador')} label="Referenciador" onChange={selectReferrer} options={filteredReferralOptions} placeholder="Seleccioná" required value={form.referenciadorId || ''} />
                  {referralStatus.status === 'loading' ? <small className="muted">Cargando referenciadores...</small> : null}
                  <DataField label="Nombre del referenciador" onChange={(nombre) => setNewReferrer((current) => ({ ...current, nombre }))} required value={newReferrer.nombre} />
                  <DataField label="Apellido del referenciador" onChange={(apellido) => setNewReferrer((current) => ({ ...current, apellido }))} required value={newReferrer.apellido} />
                 {referralStatus.status === 'error' ? <small className="muted">{referralStatus.message}</small> : null}
              </div>
             ) : null}
           </div>

          <div className="nuevo-caso-actions">
            <button
              aria-busy={isCreating ? 'true' : 'false'}
              className="primary-button"
               disabled={isCreating || referralStatus.status === 'creating'}
               onClick={handleCreateCase}
              type="button"
            >
               {referralStatus.status === 'creating' ? 'Creando referenciador...' : isCreating ? 'Generando carpeta...' : `Generar carpeta ${form.type || 'Particular'}`}
            </button>
            <p className="nuevo-caso-submit-hint" role="status" aria-live="polite">
              {isCreating ? 'Estamos generando la carpeta. Bloqueamos el botón para evitar duplicados.' : 'Cuando generes la carpeta, vas a ver la confirmación apenas termine el alta.'}
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
