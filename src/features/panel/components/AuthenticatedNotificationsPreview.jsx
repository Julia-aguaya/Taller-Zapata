import StatusBadge from '../../../components/ui/StatusBadge';
import { formatNotificationType, getNotificationTone } from '../lib/panelPreviewHelpers';

export default function AuthenticatedNotificationsPreview({
  pendingIds,
  state,
  itemActionStates = {},
  onMarkAsRead,
  onOpenCaseDetail,
  onRefresh,
  formatDateTime,
}) {
  const hasItems = state.items.length > 0;
  const hasRecentItems = (state.recentItems || []).length > 0;
  const isLoading = state.status === 'loading';
  const statusTone = state.status === 'error'
    ? 'danger'
    : state.status === 'success'
      ? 'success'
      : 'info';
  const statusLabel = isLoading
    ? 'Actualizando'
    : state.status === 'success'
      ? 'Activas'
      : state.status === 'error'
        ? 'Revisar'
        : 'Pendiente';

  return (
    <section className="card backend-notifications-card simple-panel-section">
      <div className="section-head backend-cases-head">
        <div className="stack-tight">
          <p className="eyebrow">Avisos</p>
          <h2>Pendientes para revisar</h2>
          <p className="muted">
            Acá ves los avisos reales que siguen sin leer en tu cuenta para no perder contexto entre una entrada y la siguiente.
          </p>
        </div>

        <div className="backend-cases-actions">
          <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
          <button className="secondary-button" disabled={isLoading} onClick={() => { void onRefresh(); }} type="button">
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      <div className="backend-cases-metrics" role="list" aria-label="Resumen de avisos pendientes">
        <article className="backend-case-metric" role="listitem">
          <span>Sin leer</span>
          <strong>{state.unreadCount}</strong>
          <small>
            {state.unreadCountSource === 'fallback-list'
              ? 'Conteo estimado por listado; el contador oficial no respondió en este intento.'
              : state.unreadCount === 1
                ? 'Hay un aviso esperando revisión.'
                : 'Mostramos los avisos pendientes de tu cuenta.'}
          </small>
        </article>
        <article className="backend-case-metric" role="listitem">
          <span>Última actualización</span>
          <strong>{state.checkedAt ? formatDateTime(state.checkedAt) : '-'}</strong>
          <small>{isLoading ? 'Estamos refrescando tus avisos.' : 'Podés volver a consultar cuando quieras.'}</small>
        </article>
        <article className="backend-case-metric" role="listitem">
          <span>Historial reciente</span>
          <strong>{state.recentCount || 0}</strong>
          <small>Últimos avisos recibidos, incluyendo los ya leídos.</small>
        </article>
      </div>

      {state.status === 'error' ? (
        <div className={`alert-banner ${state.tone}-banner backend-inline-banner`} role="status" aria-live="polite">
          <div className="api-connection-copy">
            <strong>{state.title}</strong>
            <small>{state.detail}</small>
          </div>
        </div>
      ) : null}

      {hasItems ? (
        <div className="notification-list" role="list" aria-label="Notificaciones pendientes">
          {state.items.map((notification) => {
            const isPending = pendingIds.includes(notification.id);
            const actionState = itemActionStates[notification.id] || null;
            const actionHasError = actionState?.status === 'error';
            const actionLabel = isPending
              ? 'Actualizando...'
              : actionHasError
                ? 'Reintentar'
                : 'Marcar leida';

            return (
              <article className="notification-card" key={notification.id} role="listitem">
                <div className="notification-card-head">
                  <div className="stack-tight">
                    <span className="client-case-kicker">{formatNotificationType(notification.typeCode)}</span>
                    <h3>{notification.title || 'Aviso pendiente'}</h3>
                  </div>
                  <StatusBadge tone={getNotificationTone(notification.typeCode)}>{formatNotificationType(notification.typeCode)}</StatusBadge>
                </div>

                <p className="notification-card-message">{notification.message || 'Tenés un aviso pendiente para revisar.'}</p>

                <div className="notification-card-meta">
                  <small>{notification.createdAt ? formatDateTime(notification.createdAt) : 'Sin fecha informada'}</small>
                  {notification.caseId ? <small>Carpeta #{notification.caseId}</small> : null}
                </div>

                <div className="notification-card-actions">
                  {notification.caseId ? (
                    <button className="ghost-button" onClick={() => { void onOpenCaseDetail({ id: notification.caseId }); }} type="button">
                      Abrir carpeta
                    </button>
                  ) : null}
                  <button className="secondary-button" disabled={isPending} onClick={() => { void onMarkAsRead(notification); }} type="button">
                    {actionLabel}
                  </button>
                </div>

                {actionHasError ? (
                  <small className="notification-action-feedback" role="status" aria-live="polite">
                    {actionState.message}
                  </small>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}

      {hasRecentItems ? (
        <div className="notification-list" role="list" aria-label="Historial reciente de notificaciones">
          {(state.recentItems || []).slice(0, 6).map((notification, index) => (
            <article className="notification-card" key={notification.id || `${notification.createdAt || 'recent'}-${index}`} role="listitem">
              <div className="notification-card-head">
                <div className="stack-tight">
                  <span className="client-case-kicker">{formatNotificationType(notification.typeCode)}</span>
                  <h3>{notification.title || 'Aviso'}</h3>
                </div>
                <StatusBadge tone={notification.read || notification.readAt ? 'neutral' : getNotificationTone(notification.typeCode)}>
                  {notification.read || notification.readAt ? 'Leída' : 'Pendiente'}
                </StatusBadge>
              </div>

              <p className="notification-card-message">{notification.message || 'Sin mensaje visible.'}</p>

              <div className="notification-card-meta">
                <small>{notification.createdAt ? formatDateTime(notification.createdAt) : 'Sin fecha informada'}</small>
                {notification.caseId ? <small>Carpeta #{notification.caseId}</small> : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {state.status === 'loading' && !hasItems ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>Estamos cargando tus avisos.</strong>
          <p>En unos instantes vas a ver las novedades pendientes de tu cuenta.</p>
        </div>
      ) : null}

      {state.status === 'success' && !hasItems ? (
        <div className="backend-cases-empty" role="status">
          <strong>No tenés avisos pendientes.</strong>
          <p>Cuando aparezca una novedad real para tu cuenta, la vas a ver acá.</p>
        </div>
      ) : null}
    </section>
  );
}
