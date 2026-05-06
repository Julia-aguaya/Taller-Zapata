export default function RelationsDetailBlock({
  relationsState,
  formatBackendState,
  StatusBadge,
}) {
  return (
    <section className="backend-detail-section backend-section-relations">
      <div className="stack-tight">
        <span className="backend-detail-section-kicker">Vínculos</span>
        <h4>Relaciones de la carpeta</h4>
      </div>

      <div className="backend-document-summary" role="list" aria-label="Resumen de vínculos de la carpeta">
        <article className="backend-document-summary-card" role="listitem">
          <span>Relaciones</span>
          <strong>{relationsState.total}</strong>
          <small>Personas o entidades vinculadas a este caso.</small>
        </article>
      </div>

      {relationsState.status === 'loading' ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>Estamos cargando los vínculos de esta carpeta.</strong>
          <p>{relationsState.detail || 'En unos instantes vas a ver esta información.'}</p>
        </div>
      ) : relationsState.status === 'success' ? (
        <div className="backend-appointment-list backend-item-list-horizontal" role="list" aria-label="Relaciones de la carpeta">
          {relationsState.items.slice(0, 6).map((relation, index) => (
            <article className="backend-appointment-card" key={relation.id || relation.publicId || `${relation.relationTypeCode || 'relation'}-${index}`} role="listitem">
              <div className="backend-document-card-head">
                <div className="stack-tight">
                  <span className="client-case-kicker">{formatBackendState(relation.relationTypeCode, 'Relación')}</span>
                  <strong>{relation.displayName || relation.personName || relation.name || 'Vínculo registrado'}</strong>
                </div>
                <StatusBadge tone="info">{formatBackendState(relation.statusCode, 'Activo')}</StatusBadge>
              </div>
              <div className="backend-appointment-meta" role="list" aria-label="Datos de la relación">
                <div className="backend-appointment-meta-item" role="listitem"><span>Rol</span><strong>{formatBackendState(relation.roleCode, 'Sin dato')}</strong></div>
                <div className="backend-appointment-meta-item" role="listitem"><span>Documento</span><strong>{relation.documentNumber || '-'}</strong></div>
                <div className="backend-appointment-meta-item" role="listitem"><span>Contacto</span><strong>{relation.email || relation.phone || '-'}</strong></div>
              </div>
            </article>
          ))}
        </div>
      ) : relationsState.status === 'error' ? (
        <div className="backend-cases-empty" role="status">
          <strong>No pudimos mostrar los vínculos de esta carpeta.</strong>
          <p>{relationsState.detail || 'Intentá nuevamente en unos instantes.'}</p>
        </div>
      ) : (
        <div className="backend-cases-empty" role="status">
          <strong>Todavía no vemos vínculos registrados para esta carpeta.</strong>
          <p>{relationsState.detail || 'Cuando se registren vínculos, vas a verlos acá.'}</p>
        </div>
      )}
    </section>
  );
}
