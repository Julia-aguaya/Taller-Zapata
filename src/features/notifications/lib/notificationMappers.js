export function parseNotification(apiData) {
  if (!apiData) return null;
  
  return {
    id: apiData.notification_id,
    title: apiData.titulo,
    message: apiData.mensaje,
    type: apiData.tipo || 'info',
    read: apiData.leida === true || apiData.leida === 1,
    createdAt: apiData.fecha_creacion ? new Date(apiData.fecha_creacion) : new Date(),
  };
}

export function parseNotificationList(apiResponse) {
  if (!apiResponse || !apiResponse.content) return [];
  return apiResponse.content.map(parseNotification).filter(Boolean);
}

export function filterByType(notifications, type) {
  if (!type || type === 'all') return notifications;
  return notifications.filter(n => n.type === type);
}

export function groupByDate(notifications) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const groups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  notifications.forEach(n => {
    const notifDate = n.createdAt instanceof Date ? n.createdAt : new Date(n.createdAt);
    if (notifDate >= today) {
      groups.today.push(n);
    } else if (notifDate >= yesterday) {
      groups.yesterday.push(n);
    } else if (notifDate >= weekAgo) {
      groups.thisWeek.push(n);
    } else {
      groups.older.push(n);
    }
  });

  return groups;
}

export function sortByDate(notifications, ascending = false) {
  return [...notifications].sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
    return ascending ? dateA - dateB : dateB - dateA;
  });
}