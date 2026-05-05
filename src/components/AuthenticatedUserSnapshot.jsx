function getStatusLabel(status) {
  if (status === 'loading') {
    return 'Actualizando';
  }

  if (status === 'success') {
    return 'Conectado';
  }

  if (status === 'error') {
    return 'Revisar';
  }

  return 'Pendiente';
}

function getHttpLabel(httpStatus) {
  if (!httpStatus) {
    return '-';
  }

  return `HTTP ${httpStatus}`;
}

export default function AuthenticatedUserSnapshot({
  endpoint,
  formatDateTime,
  session,
  state,
  StatusBadge,
  onRefresh,
}) {
  const isLoading = state.status === 'loading';

  return (
    <section className="card backend-user-card simple-panel-section">
      <div className="section-head backend-cases-head">
        <div className="stack-tight">
          <p className="eyebrow">Perfil</p>
          <h2>Usuario autenticado</h2>
          <p className="muted">
            Este bloque valida qué devolvió realmente la API para tu sesión activa.
          </p>
        </div>

        <div className="backend-cases-actions">
          <StatusBadge tone={state.tone}>{getStatusLabel(state.status)}</StatusBadge>
          <button className="secondary-button" disabled={isLoading} onClick={() => { void onRefresh(); }} type="button">
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      <div className="backend-cases-metrics" role="list" aria-label="Resumen del usuario autenticado">
        <article className="backend-case-metric" role="listitem">
          <span>Cuenta activa</span>
          <strong>{session?.user?.displayName || session?.user?.email || 'Sin dato'}</strong>
          <small>{session?.user?.role || 'Rol no informado por backend'}</small>
        </article>
        <article className="backend-case-metric" role="listitem">
          <span>Última lectura</span>
          <strong>{state.checkedAt ? formatDateTime(state.checkedAt) : '-'}</strong>
          <small>{getHttpLabel(state.httpStatus)}</small>
        </article>
      </div>

      <div className={`alert-banner ${state.tone}-banner backend-inline-banner`} role="status" aria-live="polite">
        <div className="api-connection-copy">
          <strong>{state.title}</strong>
          <small>{state.detail}</small>
          <small className="backend-technical-detail">{endpoint}</small>
        </div>
      </div>
    </section>
  );
}
