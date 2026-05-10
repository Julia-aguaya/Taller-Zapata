export const NAV_ITEMS = [
  { id: 'panel', label: 'Panel general' },
  { id: 'carpetas', label: 'Carpetas' },
  { id: 'nuevo', label: 'Nuevo caso' },
  { id: 'agenda', label: 'Agenda' },
];

export function getActiveViewTitle(activeView) {
  if (activeView === 'panel') return 'Panel general';
  if (activeView === 'carpetas') return 'Mis carpetas';
  if (activeView === 'agenda') return 'Agenda de tareas';
  if (activeView === 'nuevo') return 'Nuevo caso';
  return 'Gestión de trámites';
}
