export const CASE_TABS = ['ficha', 'tramite', 'presupuesto', 'documentacion', 'gestion', 'pagos', 'abogado'];
export const REPAIR_TABS = ['repuestos', 'turno', 'ingreso', 'egreso'];

export function getCaseHash(id, target = {}) {
  const resolvedTab = CASE_TABS.includes(target.tab) ? target.tab : '';
  const resolvedRepairTab = resolvedTab === 'gestion' && REPAIR_TABS.includes(target.subtab) ? target.subtab : '';

  return `#/caso/${id}${resolvedTab ? `/${resolvedTab}` : ''}${resolvedRepairTab ? `/${resolvedRepairTab}` : ''}`;
}

export function getCaseRouteFromHash(hash) {
  const match = hash.match(/^#\/caso\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?$/);

  return {
    id: match?.[1] ?? '',
    tab: CASE_TABS.includes(match?.[2]) ? match[2] : '',
    subtab: REPAIR_TABS.includes(match?.[3]) ? match[3] : '',
  };
}