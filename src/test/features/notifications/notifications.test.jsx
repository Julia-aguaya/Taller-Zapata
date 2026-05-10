import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';

const React = require('react');

const mockNotifications = [
  { notification_id: 1, titulo: 'Nuevo caso asignado', mensaje: 'Se le asignó el caso #1234', tipo: 'info', leida: false, fecha_creacion: new Date().toISOString() },
  { notification_id: 2, titulo: 'Recordatorio de pago', mensaje: 'Pago pendiente hace 5 días', tipo: 'warning', leida: true, fecha_creacion: new Date(Date.now() - 86400000).toISOString() },
];

const server = setupServer(
  http.get('/api/v1/notifications/unread', () => {
    return HttpResponse.json({ count: 3 });
  }),
  http.get('/api/v1/notifications/recent', () => {
    return HttpResponse.json({ content: mockNotifications });
  }),
  http.put('/api/v1/notifications/1/read', () => {
    return HttpResponse.json({ success: true });
  })
);

function NotificationsPanel() {
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const [countRes, recentRes] = await Promise.all([
          fetch('/api/v1/notifications/unread'),
          fetch('/api/v1/notifications/recent'),
        ]);

        if (!countRes.ok || !recentRes.ok) {
          throw new Error('Error al cargar notificaciones');
        }

        const countData = await countRes.json();
        const recentData = await recentRes.json();

        setUnreadCount(countData.count || 0);
        setNotifications(recentData.content || []);
      } catch (err) {
        setError(err.message || 'Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await fetch(`/api/v1/notifications/${id}/read`, {
        method: 'PUT',
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.notification_id === id ? { ...n, leida: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  if (loading) {
    return <div data-testid="notifications-loading">Cargando...</div>;
  }

  if (error) {
    return (
      <div data-testid="notifications-error" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div data-testid="notifications-panel">
      <div data-testid="unread-badge">
        {unreadCount > 0 && <span data-testid="unread-count">{unreadCount}</span>}
      </div>
      
      {notifications.length === 0 ? (
        <div data-testid="notifications-empty">No hay notificaciones</div>
      ) : (
        <ul data-testid="notifications-list">
          {notifications.map(notif => (
            <li
              key={notif.notification_id}
              data-testid={`notification-${notif.notification_id}`}
              className={notif.leida ? 'read' : 'unread'}
            >
              <span data-testid={`notif-title-${notif.notification_id}`}>{notif.titulo}</span>
              <button
                data-testid={`mark-read-${notif.notification_id}`}
                onClick={() => handleMarkAsRead(notif.notification_id)}
                disabled={notif.leida}
              >
                {notif.leida ? 'Leída' : 'Marcar leída'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

describe('NotificationsPanel - Integración', () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    vi.restoreAllMocks();
  });
  afterAll(() => server.close());

  it('debería mostrar badge con unread count', async () => {
    render(<NotificationsPanel />);
    
    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('unread-count')).toHaveTextContent('3');
  });

  it('debería cargar y mostrar lista de notificaciones recientes', async () => {
    render(<NotificationsPanel />);
    
    await waitFor(() => {
      expect(screen.getByTestId('notifications-list')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('notif-title-1')).toHaveTextContent('Nuevo caso asignado');
    expect(screen.getByTestId('notif-title-2')).toHaveTextContent('Recordatorio de pago');
  });

  it('debería marcar notificación como leída al hacer click', async () => {
    const user = userEvent.setup();
    render(<NotificationsPanel />);
    
    await waitFor(() => {
      expect(screen.getByTestId('notification-1')).toBeInTheDocument();
    });
    
    const markReadButton = screen.getByTestId('mark-read-1');
    await user.click(markReadButton);
    
    await waitFor(() => {
      const button = screen.getByTestId('mark-read-1');
      expect(button).toHaveTextContent('Leída');
    });
  });

  it('debería mostrar error cuando falla la carga de notificaciones', async () => {
    server.use(
      http.get('/api/v1/notifications/unread', () => {
        return HttpResponse.json({ message: 'Error del servidor' }, { status: 500 });
      })
    );
    
    render(<NotificationsPanel />);
    
    await waitFor(() => {
      expect(screen.getByTestId('notifications-error')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('notifications-error')).toHaveTextContent(/error/i);
  });

  it('debería mostrar estado vacío cuando no hay notificaciones', async () => {
    server.use(
      http.get('/api/v1/notifications/recent', () => {
        return HttpResponse.json({ content: [] });
      })
    );
    
    render(<NotificationsPanel />);
    
    await waitFor(() => {
      expect(screen.getByTestId('notifications-empty')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('notifications-empty')).toHaveTextContent('No hay notificaciones');
  });
});