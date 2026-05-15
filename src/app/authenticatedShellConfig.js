function isAdminRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  return ['admin', 'administrador', 'administrator', 'superadmin'].includes(normalized);
}

export function getNavItems(currentUserRole = '') {
  const items = [
    { id: 'panel', label: 'Panel general' },
    { id: 'carpetas', label: 'Carpetas' },
    { id: 'nuevo', label: 'Nuevo caso' },
    { id: 'agenda', label: 'Agenda' },
  ];

  if (isAdminRole(currentUserRole)) {
    items.push({ id: 'admin-gestion', label: 'Gestión' });
  }

  return items;
}

export const NAV_ITEMS = getNavItems('');

export function getActiveViewTitle(activeView) {
  if (activeView === 'panel') return 'Panel general';
  if (activeView === 'carpetas') return 'Mis carpetas';
  if (activeView === 'agenda') return 'Agenda de tareas';
  if (activeView === 'nuevo') return 'Nuevo caso';
  if (activeView === 'admin-gestion') return 'Gestión administrativa';
  return 'Gestión de trámites';
}
