import { describe, it, expect } from 'vitest';
import { 
  parseDashboardData, 
  checkConnectivity, 
  aggregateNotices, 
  formatMetric 
} from '../../../features/panel/lib/dashboardUtils';

describe('Panel - parseDashboardData', () => {
  it('debería transformar datos API a métricas', () => {
    const apiResponse = {
      casos_hoy: 10,
      casos_semana: 50,
      ingresos_hoy: 1000000,
      ingresos_semana: 5000000,
      casos_pendientes: 3,
      casos_completados: 20,
      mecanicos_activos: 5,
    };
    
    const result = parseDashboardData(apiResponse);
    
    expect(result.casesToday).toBe(10);
    expect(result.casesThisWeek).toBe(50);
    expect(result.revenueToday).toBe(1000000);
    expect(result.revenueThisWeek).toBe(5000000);
    expect(result.pendingCases).toBe(3);
    expect(result.completedCases).toBe(20);
    expect(result.activeMechanics).toBe(5);
  });

  it('debería manejar valores null con defaults', () => {
    const result = parseDashboardData(null);
    
    expect(result.casesToday).toBe(0);
    expect(result.revenueToday).toBe(0);
  });

  it('debería usar defaults cuando faltan propiedades', () => {
    const result = parseDashboardData({ casos_hoy: 5 });
    
    expect(result.casesToday).toBe(5);
    expect(result.casesThisWeek).toBe(0);
  });
});

describe('Panel - checkConnectivity', () => {
  it('debería retornar conectado cuando status es null', () => {
    const result = checkConnectivity(null);
    
    expect(result.connected).toBe(true);
    expect(result.message).toBe('Conectado');
  });

  it('debería detectar offline cuando offline es true', () => {
    const result = checkConnectivity({ offline: true });
    
    expect(result.connected).toBe(false);
    expect(result.message).toBe('Sin conexión');
  });

  it('debería detectar desconexión cuando sync tiene más de 5 min', () => {
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    const result = checkConnectivity({ lastSync: sixMinutesAgo });
    
    expect(result.connected).toBe(false);
    expect(result.message).toContain('Desconectado');
  });

  it('debería retornar conectado cuando sync es reciente', () => {
    const recentSync = new Date().toISOString();
    const result = checkConnectivity({ lastSync: recentSync });
    
    expect(result.connected).toBe(true);
    expect(result.message).toBe('Conectado');
  });
});

describe('Panel - aggregateNotices', () => {
  const notices = [
    { id: 1, prioridad: 'critical', mensaje: 'Error crítico' },
    { id: 2, prioridad: 'critical', mensaje: 'Otro error crítico' },
    { id: 3, prioridad: 'warning', mensaje: 'Advertencia' },
    { id: 4, prioridad: 'info', mensaje: 'Información' },
    { id: 5, prioridad: 'info', mensaje: 'Otra info' },
  ];

  it('debería agrupar notices por prioridad', () => {
    const result = aggregateNotices(notices);
    
    expect(result).toHaveLength(3);
    
    const critical = result.find(r => r.type === 'critical');
    const warning = result.find(r => r.type === 'warning');
    const info = result.find(r => r.type === 'info');
    
    expect(critical.notices).toHaveLength(2);
    expect(warning.notices).toHaveLength(1);
    expect(info.notices).toHaveLength(2);
  });

  it('debería manejar array vacío', () => {
    const result = aggregateNotices([]);
    expect(result).toHaveLength(0);
  });

  it('debería manejar null', () => {
    const result = aggregateNotices(null);
    expect(result).toHaveLength(0);
  });

  it('debería usar info como default para prioridad desconocida', () => {
    const noticesWithUnknown = [
      { id: 1, prioridad: 'unknown', mensaje: 'Test' },
    ];
    
    const result = aggregateNotices(noticesWithUnknown);
    expect(result[0].type).toBe('info');
  });

  it('debería ordenar por prioridad: critical, warning, info', () => {
    const result = aggregateNotices(notices);
    
    expect(result[0].type).toBe('critical');
    expect(result[1].type).toBe('warning');
    expect(result[2].type).toBe('info');
  });
});

describe('Panel - formatMetric', () => {
  it('debería formatear currency en CLP', () => {
    const result = formatMetric(1500000, 'currency');
    
    expect(result).toContain('1.500.000');
    expect(result).toContain('$');
  });

  it('debería formatear números', () => {
    const result = formatMetric(1234567, 'number');
    
    expect(result).toContain('1.234.567');
  });

  it('debería usar string por defecto', () => {
    expect(formatMetric(0, 'unknown')).toBe('0');
    expect(formatMetric(null, 'number')).toBe('0');
  });
});