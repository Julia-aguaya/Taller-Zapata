import { getSessionLabel } from '../features/auth/lib/authMessages';

function FloatingNotice({ notice }) {
  if (!notice) {
    return null;
  }

  return (
    <div className={`floating-notice ${notice.tone || 'info'}`} role="status" aria-live="polite">
      <strong>{notice.title}</strong>
      <span>{notice.message}</span>
    </div>
  );
}

function SessionExpiryBanner({ notice, seconds }) {
  if (!notice) {
    return null;
  }

  return (
    <div className="alert-banner danger-banner" role="status" aria-live="polite">
      <strong>Sesión vencida {seconds > 0 ? `(${seconds})` : ''}</strong>
      <p>{notice}</p>
    </div>
  );
}

export default function AuthenticatedAppShell({
  activeView,
  activeViewTitle,
  backendSession,
  children,
  navItems,
  notice,
  onLogout,
  onOpenView,
  sessionExpiryNotice,
  sessionExpirySeconds,
  unreadCount,
  unreadCountSource,
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">DT</span>
          <div>
            <strong>Delta Taller</strong>
            <small>Seguimiento de carpetas</small>
          </div>
        </div>

        <nav className="nav-list" aria-label="Principal">
          {navItems.map((item) => (
            <button className={`nav-item ${activeView === item.id ? 'is-active' : ''}`} key={item.id} onClick={() => onOpenView(item.id)} type="button">
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Panel</p>
            <h2>{activeViewTitle}</h2>
          </div>

          <div className="topbar-right">
            <div className="topbar-notification-pill" role="status" aria-live="polite">
              <span>Avisos pendientes</span>
              <strong>{unreadCount}</strong>
              {unreadCountSource === 'fallback-list' ? <small>estimado</small> : null}
            </div>
            <div className="session-badge-panel">
              <div>
                <span>Cuenta activa</span>
                <strong>{getSessionLabel(backendSession)}</strong>
              </div>
              <button className="ghost-button" onClick={onLogout} type="button">Cerrar sesión</button>
            </div>
          </div>
        </header>

        <FloatingNotice notice={notice} />
        <SessionExpiryBanner notice={sessionExpiryNotice} seconds={sessionExpirySeconds} />

        {children}
      </main>
    </div>
  );
}
