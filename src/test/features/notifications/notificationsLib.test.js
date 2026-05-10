import { describe, it, expect } from 'vitest';
import { 
  parseNotification, 
  parseNotificationList,
  filterByType, 
  groupByDate, 
  sortByDate 
} from '../../../features/notifications/lib/notificationMappers';

describe('Notifications - parseNotification', () => {
  it('debería transformar respuesta API a formato UI', () => {
    const apiData = { notification_id: 1, titulo: 'Test', mensaje: 'Mensaje test', leida: false };
    const result = parseNotification(apiData);
    
    expect(result.id).toBe(1);
    expect(result.title).toBe('Test');
    expect(result.message).toBe('Mensaje test');
    expect(result.read).toBe(false);
  });

  it('debería manejar leida como true y 1', () => {
    expect(parseNotification({ notification_id: 1, titulo: 'Test', leida: true }).read).toBe(true);
    expect(parseNotification({ notification_id: 2, titulo: 'Test', leida: 1 }).read).toBe(true);
  });

  it('debería manejar valores null', () => {
    expect(parseNotification(null)).toBeNull();
  });

  it('debería usar tipo por defecto info', () => {
    const result = parseNotification({ notification_id: 1, titulo: 'Test' });
    expect(result.type).toBe('info');
  });

  it('debería parsear fecha de creación', () => {
    const apiDate = '2024-01-15T10:30:00Z';
    const result = parseNotification({ notification_id: 1, titulo: 'Test', fecha_creacion: apiDate });
    
    expect(result.createdAt).toBeInstanceOf(Date);
  });
});

describe('Notifications - parseNotificationList', () => {
  it('debería transformar array de respuestas API', () => {
    const apiResponse = {
      content: [
        { notification_id: 1, titulo: 'Notif 1', leida: false },
        { notification_id: 2, titulo: 'Notif 2', leida: true },
      ]
    };
    
    const result = parseNotificationList(apiResponse);
    
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });

  it('debería manejar respuesta vacía', () => {
    expect(parseNotificationList(null)).toHaveLength(0);
    expect(parseNotificationList({ content: [] })).toHaveLength(0);
  });

  it('debería filtrar valores null', () => {
    const apiResponse = {
      content: [
        { notification_id: 1, titulo: 'Valid' },
        null,
        undefined,
      ]
    };
    
    const result = parseNotificationList(apiResponse);
    expect(result).toHaveLength(1);
  });
});

describe('Notifications - filterByType', () => {
  const notifications = [
    { id: 1, type: 'info', title: 'Info' },
    { id: 2, type: 'warning', title: 'Warning' },
    { id: 3, type: 'error', title: 'Error' },
    { id: 4, type: 'success', title: 'Success' },
  ];

  it('debería filtrar por tipo info', () => {
    const result = filterByType(notifications, 'info');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Info');
  });

  it('debería filtrar por tipo warning', () => {
    const result = filterByType(notifications, 'warning');
    expect(result).toHaveLength(1);
  });

  it('debería devolver todos cuando type es "all" o null', () => {
    expect(filterByType(notifications, 'all')).toHaveLength(4);
    expect(filterByType(notifications, null)).toHaveLength(4);
  });
});

describe('Notifications - groupByDate', () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const notifications = [
    { id: 1, title: 'Hoy', createdAt: today },
    { id: 2, title: 'Ayer', createdAt: yesterday },
    { id: 3, title: 'Esta semana', createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000) },
    { id: 4, title: 'Semana pasada', createdAt: weekAgo },
    { id: 5, title: 'Mes pasado', createdAt: monthAgo },
  ];

  it('debería agrupar notificaciones de hoy', () => {
    const groups = groupByDate(notifications);
    expect(groups.today).toHaveLength(1);
    expect(groups.today[0].title).toBe('Hoy');
  });

  it('debería agrupar notificaciones de ayer', () => {
    const groups = groupByDate(notifications);
    expect(groups.yesterday).toHaveLength(1);
    expect(groups.yesterday[0].title).toBe('Ayer');
  });

  it('debería agrupar notificaciones de esta semana', () => {
    const groups = groupByDate(notifications);
    expect(groups.thisWeek).toHaveLength(2);
  });

  it('debería agrupar notificaciones antiguas', () => {
    const groups = groupByDate(notifications);
    expect(groups.older).toHaveLength(1);
  });
});

describe('Notifications - sortByDate', () => {
  it('debería ordenar más recientes primero por defecto', () => {
    const notifications = [
      { id: 1, title: 'Antiguo', createdAt: new Date('2024-01-01') },
      { id: 2, title: 'Reciente', createdAt: new Date('2024-01-15') },
    ];
    
    const result = sortByDate(notifications);
    expect(result[0].title).toBe('Reciente');
    expect(result[1].title).toBe('Antiguo');
  });

  it('debería ordenar ascendente cuando se especifica', () => {
    const notifications = [
      { id: 1, title: 'Antiguo', createdAt: new Date('2024-01-01') },
      { id: 2, title: 'Reciente', createdAt: new Date('2024-01-15') },
    ];
    
    const result = sortByDate(notifications, true);
    expect(result[0].title).toBe('Antiguo');
    expect(result[1].title).toBe('Reciente');
  });

  it('debería manejar array vacío', () => {
    expect(sortByDate([])).toHaveLength(0);
  });
});