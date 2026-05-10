import React, { useState, useEffect } from 'react';
import { parseNotificationList, sortByDate } from '../lib/notificationMappers';

export function NotificationsPanel({ onMarkAsRead }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
        const parsed = parseNotificationList(recentData);
        setNotifications(sortByDate(parsed));
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
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        onMarkAsRead?.(id);
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
              key={notif.id}
              data-testid={`notification-${notif.id}`}
              className={notif.read ? 'read' : 'unread'}
            >
              <span data-testid={`notif-title-${notif.id}`}>{notif.title}</span>
              <button
                data-testid={`mark-read-${notif.id}`}
                onClick={() => handleMarkAsRead(notif.id)}
                disabled={notif.read}
              >
                {notif.read ? 'Leída' : 'Marcar leída'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}