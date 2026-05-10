import React, { useState, useEffect } from 'react';
import { parseDashboardData, checkConnectivity, aggregateNotices, formatMetric } from '../lib/dashboardUtils';

export function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [connectivity, setConnectivity] = useState({ connected: true, message: 'Conectado' });
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [dashRes, statusRes, noticesRes] = await Promise.all([
          fetch('/api/v1/dashboard/metrics'),
          fetch('/api/v1/system/connectivity'),
          fetch('/api/v1/notices'),
        ]);

        const dashData = await dashRes.json();
        const statusData = await statusRes.json();
        const noticesData = await noticesRes.json();

        setMetrics(parseDashboardData(dashData));
        setConnectivity(checkConnectivity(statusData));
        setNotices(aggregateNotices(noticesData.content || []));
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div data-testid="dashboard-loading">Cargando dashboard...</div>;
  }

  return (
    <div data-testid="dashboard">
      <div data-testid="connectivity-status" className={connectivity.connected ? 'connected' : 'disconnected'}>
        {connectivity.message}
      </div>

      {notices.length > 0 && (
        <div data-testid="notices-banner">
          {notices.map((group, idx) => (
            <div key={idx} data-testid={`notice-${group.type}`} className={`notice notice-${group.type}`}>
              {group.notices.map(n => (
                <span key={n.id} data-testid={`notice-item-${n.id}`}>{n.mensaje}</span>
              ))}
            </div>
          ))}
        </div>
      )}

      <div data-testid="metrics-grid">
        {metrics && (
          <>
            <div data-testid="metric-cases-today">
              <span data-testid="label-cases-today">Casos hoy</span>
              <span data-testid="value-cases-today">{formatMetric(metrics.casesToday, 'number')}</span>
            </div>
            <div data-testid="metric-cases-week">
              <span data-testid="label-cases-week">Casos semana</span>
              <span data-testid="value-cases-week">{formatMetric(metrics.casesThisWeek, 'number')}</span>
            </div>
            <div data-testid="metric-revenue-today">
              <span data-testid="label-revenue-today">Ingresos hoy</span>
              <span data-testid="value-revenue-today">{formatMetric(metrics.revenueToday, 'currency')}</span>
            </div>
            <div data-testid="metric-revenue-week">
              <span data-testid="label-revenue-week">Ingresos semana</span>
              <span data-testid="value-revenue-week">{formatMetric(metrics.revenueThisWeek, 'currency')}</span>
            </div>
            <div data-testid="metric-pending">
              <span data-testid="label-pending">Pendientes</span>
              <span data-testid="value-pending">{formatMetric(metrics.pendingCases, 'number')}</span>
            </div>
            <div data-testid="metric-completed">
              <span data-testid="label-completed">Completados</span>
              <span data-testid="value-completed">{formatMetric(metrics.completedCases, 'number')}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}