import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';

const React = require('react');

const mockDashboardData = {
  casos_hoy: 12,
  casos_semana: 85,
  ingresos_hoy: 1500000,
  ingresos_semana: 8500000,
  casos_pendientes: 5,
  casos_completados: 45,
  mecanicos_activos: 8,
};

const mockConnectivity = {
  connected: true,
  lastSync: new Date().toISOString(),
};

const mockNotices = [
  { id: 1, prioridad: 'warning', mensaje: 'Sistema de facturación en mantenimiento' },
  { id: 2, prioridad: 'info', mensaje: 'Recordatorio de respaldo' },
];

const server = setupServer(
  http.get('/api/v1/dashboard/metrics', () => {
    return HttpResponse.json(mockDashboardData);
  }),
  http.get('/api/v1/system/connectivity', () => {
    return HttpResponse.json(mockConnectivity);
  }),
  http.get('/api/v1/notices', () => {
    return HttpResponse.json({ content: mockNotices });
  })
);

function Dashboard() {
  const [metrics, setMetrics] = React.useState(null);
  const [connectivity, setConnectivity] = React.useState({ connected: true, message: 'Conectado' });
  const [notices, setNotices] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
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

        setMetrics({
          casesToday: dashData.casos_hoy || 0,
          casesThisWeek: dashData.casos_semana || 0,
          revenueToday: dashData.ingresos_hoy || 0,
          revenueThisWeek: dashData.ingresos_semana || 0,
          pendingCases: dashData.casos_pendientes || 0,
          completedCases: dashData.casos_completados || 0,
          activeMechanics: dashData.mecanicos_activos || 0,
        });

        const isConnected = statusData.connected !== false;
        setConnectivity({ 
          connected: isConnected, 
          message: isConnected ? 'Conectado' : 'Sin conexión' 
        });

        const noticesList = noticesData.content || [];
        const grouped = { critical: [], warning: [], info: [] };
        noticesList.forEach(notice => {
          const priority = notice.prioridad || 'info';
          if (grouped[priority]) grouped[priority].push(notice);
        });
        const aggregated = [];
        if (grouped.warning.length > 0) aggregated.push({ type: 'warning', notices: grouped.warning });
        if (grouped.info.length > 0) aggregated.push({ type: 'info', notices: grouped.info });
        setNotices(aggregated);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
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
              <span data-testid="value-cases-today">{metrics.casesToday}</span>
            </div>
            <div data-testid="metric-cases-week">
              <span data-testid="label-cases-week">Casos semana</span>
              <span data-testid="value-cases-week">{metrics.casesThisWeek}</span>
            </div>
            <div data-testid="metric-revenue-today">
              <span data-testid="label-revenue-today">Ingresos hoy</span>
              <span data-testid="value-revenue-today">{metrics.revenueToday}</span>
            </div>
            <div data-testid="metric-revenue-week">
              <span data-testid="label-revenue-week">Ingresos semana</span>
              <span data-testid="value-revenue-week">{metrics.revenueThisWeek}</span>
            </div>
            <div data-testid="metric-pending">
              <span data-testid="label-pending">Pendientes</span>
              <span data-testid="value-pending">{metrics.pendingCases}</span>
            </div>
            <div data-testid="metric-completed">
              <span data-testid="label-completed">Completados</span>
              <span data-testid="value-completed">{metrics.completedCases}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

describe('Dashboard - Integración', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('debería mostrar resumen del dashboard al cargar', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('metrics-grid')).toBeInTheDocument();
  });

  it('debería mostrar métricas del día y semana', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByTestId('value-cases-today')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('value-cases-today')).toHaveTextContent('12');
    expect(screen.getByTestId('value-cases-week')).toHaveTextContent('85');
    expect(screen.getByTestId('value-revenue-today')).toHaveTextContent('1500000');
    expect(screen.getByTestId('value-revenue-week')).toHaveTextContent('8500000');
  });

  it('debería mostrar indicador de conectividad', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByTestId('connectivity-status')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('connectivity-status')).toHaveTextContent('Conectado');
  });

  it('debería mostrar avisos globales cuando existen', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByTestId('notices-banner')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('notice-warning')).toBeInTheDocument();
    expect(screen.getByTestId('notice-info')).toBeInTheDocument();
  });

  it('debería mostrar estado de conectividad desconectado', async () => {
    server.use(
      http.get('/api/v1/system/connectivity', () => {
        return HttpResponse.json({ connected: false, offline: true });
      })
    );
    
    render(<Dashboard />);
    
    await waitFor(() => {
      const status = screen.getByTestId('connectivity-status');
      expect(status).toHaveClass('disconnected');
    });
  });
});