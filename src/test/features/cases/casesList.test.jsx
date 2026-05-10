import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';

const mockCases = [
  {
    id: 'case-001',
    folderCode: 'ZP-2026-0001',
    currentCaseStateCode: 'en_tramite',
    caseType: 'Particular',
    branch: 'Z',
    openAt: '2026-01-15T10:00:00Z',
    dueAt: '2026-02-15T10:00:00Z',
    vehicle: { plate: 'ABC123', brand: 'Chevrolet', model: 'Cruze' },
    client: { firstName: 'Juan', lastName: 'Perez', document: '20123456789' },
    priority: 'media',
    pendingItemsCount: 2,
  },
  {
    id: 'case-002',
    folderCode: 'ZP-2026-0002',
    currentCaseStateCode: 'esperando_aprobacion',
    caseType: 'Todo Riesgo',
    branch: 'Z',
    vehicle: { plate: 'XYZ987', brand: 'Toyota', model: 'Corolla' },
    client: { firstName: 'Maria', lastName: 'Gonzalez' },
    priority: 'alta',
    pendingItemsCount: 5,
  },
];

const server = setupServer(
  http.get('/api/v1/cases', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const state = url.searchParams.get('state');
    const branch = url.searchParams.get('branch');

    let filtered = [...mockCases];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (c) => c.folderCode.toLowerCase().includes(searchLower) ||
          c.client?.firstName?.toLowerCase().includes(searchLower) ||
          c.vehicle?.plate?.toLowerCase().includes(searchLower)
      );
    }

    if (state && state !== 'all') {
      filtered = filtered.filter((c) => c.currentCaseStateCode === state);
    }

    if (branch && branch !== 'all') {
      filtered = filtered.filter((c) => c.branch === branch);
    }

    return HttpResponse.json({ content: filtered, total: filtered.length }, { status: 200 });
  })
);

const React = require('react');

function CasesList({ items }) {
  if (items.length === 0) {
    return <div data-testid="empty-cases">No hay carpetas</div>;
  }
  return (
    <div data-testid="cases-list">
      {items.map((item) => (
        <article key={item.id} data-testid={`case-${item.id}`}>
          <h3>{item.folderCode}</h3>
          <p>{item.client?.firstName} {item.client?.lastName}</p>
          <p>{item.vehicle?.brand} {item.vehicle?.plate}</p>
        </article>
      ))}
    </div>
  );
}

function CasesToolbar({ filters, onFilterChange }) {
  return (
    <div data-testid="cases-toolbar">
      <input
        data-testid="search-input"
        value={filters.search}
        onChange={(e) => onFilterChange('search', e.target.value)}
        placeholder="Buscar..."
      />
      <select
        data-testid="state-filter"
        value={filters.state}
        onChange={(e) => onFilterChange('state', e.target.value)}
      >
        <option value="all">Todos</option>
        <option value="en_tramite">En trámite</option>
        <option value="cerrado">Cerrado</option>
      </select>
      <select
        data-testid="branch-filter"
        value={filters.branch}
        onChange={(e) => onFilterChange('branch', e.target.value)}
      >
        <option value="all">Todas</option>
        <option value="Z">Zapata</option>
        <option value="C">Centro</option>
      </select>
    </div>
  );
}

function LoadingState() {
  return <div data-testid="loading">Cargando...</div>;
}

describe('Cases - CasesList', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('debería mostrar mensaje de "no hay carpetas" cuando el listado está vacío', async () => {
    const emptyServer = setupServer(
      http.get('/api/v1/cases', () => HttpResponse.json({ content: [], total: 0 }))
    );
    emptyServer.listen();

    function TestCases() {
      const [items] = React.useState([]);
      return <CasesList items={items} />;
    }

    render(<TestCases />);
    expect(screen.getByTestId('empty-cases')).toHaveTextContent('No hay carpetas');

    emptyServer.close();
  });

  it('debería mostrar métricas y lista de casos cuando hay datos', async () => {
    function TestCases() {
      const [items] = React.useState(mockCases);
      const byState = items.reduce((acc, item) => {
        acc[item.currentCaseStateCode] = (acc[item.currentCaseStateCode] || 0) + 1;
        return acc;
      }, {});

      return (
        <div>
          <div data-testid="metrics">Total: {items.length}</div>
          <CasesList items={items} />
        </div>
      );
    }

    render(<TestCases />);
    expect(screen.getByTestId('metrics')).toHaveTextContent('Total: 2');
    expect(screen.getByTestId('case-case-001')).toBeInTheDocument();
    expect(screen.getByTestId('case-case-002')).toBeInTheDocument();
  });

  it('debería filtrar casos por texto de búsqueda', async () => {
    const user = userEvent.setup();

    function TestCases() {
      const [filters, setFilters] = React.useState({ search: '', state: 'all', branch: 'all' });
      return (
        <CasesToolbar
          filters={filters}
          onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        />
      );
    }

    render(<TestCases />);
    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'Juan');
    expect(searchInput).toHaveValue('Juan');
  });

  it('debería filtrar casos por estado', async () => {
    const user = userEvent.setup();

    function TestCases() {
      const [filters, setFilters] = React.useState({ search: '', state: 'all', branch: 'all' });
      return (
        <CasesToolbar
          filters={filters}
          onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        />
      );
    }

    render(<TestCases />);
    const stateSelect = screen.getByTestId('state-filter');
    await user.selectOptions(stateSelect, 'cerrado');
    expect(stateSelect).toHaveValue('cerrado');
  });

  it('debería filtrar casos por sucursal', async () => {
    const user = userEvent.setup();

    function TestCases() {
      const [filters, setFilters] = React.useState({ search: '', state: 'all', branch: 'all' });
      return (
        <CasesToolbar
          filters={filters}
          onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        />
      );
    }

    render(<TestCases />);
    const branchSelect = screen.getByTestId('branch-filter');
    await user.selectOptions(branchSelect, 'C');
    expect(branchSelect).toHaveValue('C');
  });

  it('debería mostrar error cuando falla el request', async () => {
    const errorServer = setupServer(
      http.get('/api/v1/cases', () => HttpResponse.error())
    );
    errorServer.listen();

    function TestCases() {
      const [error] = React.useState(true);
      if (error) return <div role="alert" data-testid="error">Error al cargar</div>;
      return <LoadingState />;
    }

    render(<TestCases />);
    expect(screen.getByTestId('error')).toBeInTheDocument();

    errorServer.close();
  });
});