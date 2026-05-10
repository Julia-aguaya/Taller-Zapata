export function parseDashboardData(apiResponse) {
  if (!apiResponse) {
    return {
      casesToday: 0,
      casesThisWeek: 0,
      revenueToday: 0,
      revenueThisWeek: 0,
      pendingCases: 0,
      completedCases: 0,
      activeMechanics: 0,
    };
  }

  return {
    casesToday: apiResponse.casos_hoy || 0,
    casesThisWeek: apiResponse.casos_semana || 0,
    revenueToday: apiResponse.ingresos_hoy || 0,
    revenueThisWeek: apiResponse.ingresos_semana || 0,
    pendingCases: apiResponse.casos_pendientes || 0,
    completedCases: apiResponse.casos_completados || 0,
    activeMechanics: apiResponse.mecanicos_activos || 0,
  };
}

export function checkConnectivity(status) {
  if (!status) return { connected: true, message: 'Conectado' };
  
  if (status.offline) {
    return { connected: false, message: 'Sin conexión' };
  }
  
  if (status.lastSync) {
    const lastSync = new Date(status.lastSync);
    const now = new Date();
    const diffMs = now - lastSync;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes > 5) {
      return { connected: false, message: 'Desconectado hace ' + diffMinutes + ' min' };
    }
  }
  
  return { connected: true, message: 'Conectado' };
}

export function aggregateNotices(notices) {
  if (!notices || notices.length === 0) return [];
  
  const byPriority = { critical: [], warning: [], info: [] };
  
  notices.forEach(notice => {
    const priority = notice.prioridad || 'info';
    if (byPriority[priority]) {
      byPriority[priority].push(notice);
    } else {
      byPriority.info.push(notice);
    }
  });
  
  const aggregated = [];
  if (byPriority.critical.length > 0) {
    aggregated.push({ type: 'critical', notices: byPriority.critical });
  }
  if (byPriority.warning.length > 0) {
    aggregated.push({ type: 'warning', notices: byPriority.warning });
  }
  if (byPriority.info.length > 0) {
    aggregated.push({ type: 'info', notices: byPriority.info });
  }
  
  return aggregated;
}

export function formatMetric(value, type) {
  if (type === 'currency') {
    return new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP',
      maximumFractionDigits: 0 
    }).format(value || 0);
  }
  
  if (type === 'number') {
    return new Intl.NumberFormat('es-CL').format(value || 0);
  }
  
  return value?.toString() || '0';
}