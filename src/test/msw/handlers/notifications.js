import { http, HttpResponse } from 'msw';

// Fixture de notificaciones
export const mockNotifications = [
  {
    id: 1,
    title: 'Presupuesto aprobado',
    message: 'El cliente aprobó el presupuesto del caso ZP-2026-0001',
    type: 'success',
    read: false,
    createdAt: '2026-01-25T10:00:00Z',
    caseId: 'case-001',
  },
  {
    id: 2,
    title: 'Turno confirmado',
    message: 'El turno para el 01/02/2026 fue confirmado por el cliente',
    type: 'info',
    read: false,
    createdAt: '2026-01-24T14:30:00Z',
    caseId: 'case-001',
  },
  {
    id: 3,
    title: 'Documentación pendiente',
    message: 'Faltan subir fotos del vehículo para el caso ZP-2026-0002',
    type: 'warning',
    read: true,
    createdAt: '2026-01-22T09:15:00Z',
    caseId: 'case-002',
  },
];

export const notificationsHandlers = [
  // GET /api/v1/notifications/unread
  http.get('/api/v1/notifications/unread', () => {
    const unread = mockNotifications.filter((n) => !n.read);
    return HttpResponse.json(unread, { status: 200 });
  }),

  // GET /api/v1/notifications/count-unread
  http.get('/api/v1/notifications/count-unread', () => {
    const count = mockNotifications.filter((n) => !n.read).length;
    return HttpResponse.json({ count }, { status: 200 });
  }),

  // GET /api/v1/notifications
  http.get('/api/v1/notifications', ({ request }) => {
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';

    let filtered = [...mockNotifications];
    if (unreadOnly) {
      filtered = filtered.filter((n) => !n.read);
    }

    return HttpResponse.json(filtered, { status: 200 });
  }),

  // PATCH /api/v1/notifications/:id/read
  http.patch('/api/v1/notifications/:id/read', ({ params }) => {
    const notification = mockNotifications.find((n) => n.id === parseInt(params.id, 10));
    if (!notification) {
      return HttpResponse.json({ message: 'Notificación no encontrada' }, { status: 404 });
    }
    notification.read = true;
    return HttpResponse.json(notification, { status: 200 });
  }),
];