import DataField from '../../../components/ui/DataField';
import SelectField from '../../../components/ui/SelectField';
import StatusBadge from '../../../components/ui/StatusBadge';
import ToggleField from '../../../components/ui/ToggleField';
import { isThirdPartyWorkshopCase } from '../../cases/lib/caseDomainCheckers';
import { createTodoRiskDocument } from '../../cases/lib/caseFactories';
import {
  THIRD_PARTY_BILLING_OPTIONS,
  THIRD_PARTY_ORDER_STATE_OPTIONS,
  THIRD_PARTY_PARTS_PROVIDER_OPTIONS,
  THIRD_PARTY_PAYMENT_OPTIONS,
} from '../constants/gestionOptions';
import { maxDate } from '../lib/gestionUtils';

export default function DocumentacionTab({ item, updateCase, flash }) {
  if (!isThirdPartyWorkshopCase(item)) {
    return null;
  }

  const thirdParty = item.thirdParty;

  const addDocumentItem = () => {
    updateCase((draft) => {
      draft.thirdParty.claim.documents.push(createTodoRiskDocument());
    });
  };

  return (
    <div className="tab-layout">
      <article className="card inner-card todo-risk-summary-card">
        <div className="section-head small-gap">
          <div>
            <p className="eyebrow">Documentación</p>
            <h3>Carpeta base del reclamo</h3>
          </div>
          <StatusBadge tone={thirdParty.claim.documentationStatus === 'Completa' ? 'success' : 'danger'}>
            {thirdParty.claim.documentationStatus}
          </StatusBadge>
        </div>
        <div className="form-grid three-columns compact-grid">
          <SelectField
            label="Estado manual"
            onChange={(value) => updateCase((draft) => {
              draft.thirdParty.claim.documentationStatus = value;
              draft.thirdParty.claim.documentationAccepted = value === 'Completa';
            })}
            options={['Completa', 'Incompleta']}
            value={thirdParty.claim.documentationStatus}
          />
          <DataField label="Items cargados" onChange={() => {}} readOnly value={thirdParty.claim.documents.length} />
          <DataField label="Última carga" onChange={() => {}} readOnly value={thirdParty.claim.documents.reduce((latest, doc) => maxDate(latest, doc.uploadedAt), '')} type="date" />
        </div>
        {thirdParty.claim.documentationStatus === 'Incompleta' ? (
          <div className="inline-alert danger-banner">Carpeta con documentación pendiente. Cada vez que entrás a la carpeta aparece el aviso bloqueante hasta aceptar.</div>
        ) : (
          <div className="inline-alert info-banner">La documentación queda marcada como completa y no dispara el bloqueo de ingreso.</div>
        )}
      </article>

      <article className="card inner-card">
        <div className="section-head">
          <div>
            <h3>Documentos cargados</h3>
            <p className="muted">Demo manual con descarga masiva y edición simple por fila.</p>
          </div>
          <div className="tag-row">
            <button className="secondary-button" onClick={addDocumentItem} type="button">Agregar ítem</button>
            <button className="secondary-button" onClick={() => flash('Descargar todo: se preparará un paquete único con toda la documentación del reclamo.')} type="button">Descargar todo</button>
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
                  <td><SelectField label="Categoría" onChange={(value) => updateCase((draft) => { const target = draft.thirdParty.claim.documents.find((entry) => entry.id === doc.id); target.category = value; })} options={TODO_RIESGO_DOC_CATEGORY_OPTIONS} value={doc.category} /></td>
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

