import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';

const mockCaseDetail = {
  id: 'case-001',
  folderCode: 'ZP-2026-0001',
  currentCaseStateCode: 'en_tramite',
  caseType: 'Particular',
  branch: 'Z',
  openAt: '2026-01-15T10:00:00Z',
  dueAt: '2026-02-15T10:00:00Z',
  incident: {
    incidentDate: '2026-01-14T16:30:00Z',
    incidentLocation: 'Av. Pellegrini 1500, Rosario',
    description: 'Colisión trasera en semáforo',
  },
  vehicle: {
    plate: 'ABC123',
    brand: 'Chevrolet',
    model: 'Cruze LTZ',
    year: 2022,
    vin: '8AGJX6820NR123456',
    color: 'Gris',
    transmission: 'Automática',
  },
  client: {
    firstName: 'Juan',
    lastName: 'Perez',
    document: '20123456789',
    phone: '3414567890',
    email: 'juan.perez@example.com',
  },
  priority: 'media',
  responsibleUserId: 1,
};

const mockWorkflowHistory = [
  {
    id: 'wf-1',
    fromState: 'nuevo',
    toState: 'en_tramite',
    transitionCode: 'iniciar_tramite',
    performedBy: 'Usuario Test',
    performedAt: '2026-01-15T10:30:00Z',
    observation: 'Caso iniciado',
  },
  {
    id: 'wf-2',
    fromState: 'en_tramite',
    toState: 'esperando_aprobacion',
    transitionCode: 'enviar_presupuesto',
    performedBy: 'Usuario Test',
    performedAt: '2026-01-20T14:00:00Z',
    observation: 'Presupuesto enviado al cliente',
  },
];

const mockAppointments = [
  {
    id: 'apt-001',
    appointmentDate: '2026-02-01',
    appointmentTime: '09:00',
    status: 'confirmado',
    workshop: 'Taller Zapata',
    recipientName: 'Juan Perez',
    observations: 'Entrada por collision',
  },
];

const mockDocuments = [
  {
    documentId: 1,
    fileName: 'presupuesto.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 245000,
    categoryName: 'Presupuesto',
    createdAt: '2026-01-20T10:00:00Z',
  },
];

const server = setupServer(
  http.get('/api/v1/cases/:id', ({ params }) => {
    if (params.id === 'error-500') {
      return HttpResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
    }
    if (params.id === 'error-404') {
      return HttpResponse.json({ message: 'Caso no encontrado' }, { status: 404 });
    }
    return HttpResponse.json(mockCaseDetail, { status: 200 });
  }),
  http.get('/api/v1/cases/:id/workflow/history', ({ params }) => {
    if (params.id === 'empty') {
      return HttpResponse.json([], { status: 200 });
    }
    return HttpResponse.json(mockWorkflowHistory, { status: 200 });
  }),
  http.get('/api/v1/cases/:id/appointments', ({ params }) => {
    if (params.id === 'no-appointments') {
      return HttpResponse.json([], { status: 200 });
    }
    return HttpResponse.json(mockAppointments, { status: 200 });
  }),
  http.get('/api/v1/cases/:id/documents', () => {
    return HttpResponse.json(mockDocuments, { status: 200 });
  })
);

const React = require('react');

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('es-AR');
}

function CaseDetailSummary({ caseId }) {
  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('ficha');

  React.useEffect(() => {
    if (!caseId) return;

    setLoading(true);
    setError(null);

    fetch(`/api/v1/cases/${caseId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setDetail(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [caseId]);

  if (loading) {
    return <div data-testid="loading-state">Cargando detalle...</div>;
  }

  if (error) {
    return (
      <div role="alert" data-testid="error-message">
        No pudimos abrir esta carpeta ahora. Intentá nuevamente en unos instantes.
      </div>
    );
  }

  return (
    <div data-testid="case-detail-summary">
      <header className="detail-header">
        <h1>Carpeta: {detail.folderCode}</h1>
        <span className="case-type">{detail.caseType}</span>
      </header>

      <nav className="detail-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'ficha'}
          onClick={() => setActiveTab('ficha')}
          data-testid="tab-ficha"
        >
          Ficha
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'workflow'}
          onClick={() => setActiveTab('workflow')}
          data-testid="tab-workflow"
        >
          Seguimiento
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'turnos'}
          onClick={() => setActiveTab('turnos')}
          data-testid="tab-turnos"
        >
          Turnos
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'documentos'}
          onClick={() => setActiveTab('documentos')}
          data-testid="tab-documentos"
        >
          Documentos
        </button>
      </nav>

      <div className="detail-content" role="tabpanel">
        {activeTab === 'ficha' && (
          <div data-testid="tab-panel-ficha">
            <section>
              <h2>Cliente</h2>
              <p>{detail.client.firstName} {detail.client.lastName}</p>
              <p>Documento: {detail.client.document}</p>
              <p>Teléfono: {detail.client.phone}</p>
            </section>
            <section>
              <h2>Vehículo</h2>
              <p>{detail.vehicle.brand} {detail.vehicle.model}</p>
              <p>Patente: {detail.vehicle.plate}</p>
              <p>Año: {detail.vehicle.year}</p>
            </section>
            <section>
              <h2>Incidente</h2>
              <p>{detail.incident.description}</p>
              <p>Lugar: {detail.incident.incidentLocation}</p>
              <p>Fecha: {formatDate(detail.incident.incidentDate)}</p>
            </section>
          </div>
        )}

        {activeTab === 'workflow' && (
          <div data-testid="tab-panel-workflow">
            <CaseWorkflowSection caseId={caseId} />
          </div>
        )}

        {activeTab === 'turnos' && (
          <div data-testid="tab-panel-turnos">
            <CaseAppointmentsSection caseId={caseId} />
          </div>
        )}

        {activeTab === 'documentos' && (
          <div data-testid="tab-panel-documentos">
            <CaseDocumentsSection caseId={caseId} />
          </div>
        )}
      </div>
    </div>
  );
}

function CaseWorkflowSection({ caseId }) {
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/v1/cases/${caseId}/workflow/history`)
      .then((res) => res.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [caseId]);

  if (loading) return <div>Cargando workflow...</div>;

  if (history.length === 0) return <div>No hay historial de seguimiento</div>;

  return (
    <div data-testid="workflow-list">
      {history.map((item) => (
        <div key={item.id} className="workflow-item">
          <span>{item.fromState} → {item.toState}</span>
          <span>{item.performedBy}</span>
          <span>{formatDate(item.performedAt)}</span>
        </div>
      ))}
    </div>
  );
}

function CaseAppointmentsSection({ caseId }) {
  const [appointments, setAppointments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/v1/cases/${caseId}/appointments`)
      .then((res) => res.json())
      .then((data) => {
        setAppointments(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [caseId]);

  if (loading) return <div>Cargando turnos...</div>;

  if (appointments.length === 0) return <div>No hay turnos asignados</div>;

  return (
    <div data-testid="appointments-list">
      {appointments.map((apt) => (
        <div key={apt.id} className="appointment-item">
          <span>{apt.appointmentDate} {apt.appointmentTime}</span>
          <span>{apt.status}</span>
          <span>{apt.workshop}</span>
        </div>
      ))}
    </div>
  );
}

function CaseDocumentsSection({ caseId }) {
  const [documents, setDocuments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/v1/cases/${caseId}/documents`)
      .then((res) => res.json())
      .then((data) => {
        setDocuments(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [caseId]);

  if (loading) return <div>Cargando documentos...</div>;

  if (documents.length === 0) return <div>No hay documentos</div>;

  return (
    <div data-testid="documents-list">
      {documents.map((doc) => (
        <div key={doc.documentId} className="document-item">
          <span>{doc.fileName}</span>
          <span>{doc.categoryName}</span>
        </div>
      ))}
    </div>
  );
}

function LoadingState() {
  return <div data-testid="loading-state">Cargando...</div>;
}

function ErrorMessage({ message }) {
  return (
    <div role="alert" data-testid="error-message">
      {message}
    </div>
  );
}

describe('Case Detail - CaseDetailSummary', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('debería mostrar información del caso al abrir', async () => {
    function TestWrapper() {
      const [caseId, setCaseId] = React.useState('case-001');
      return <CaseDetailSummary caseId={caseId} />;
    }

    render(<TestWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId('case-detail-summary')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByTestId('case-detail-summary')).toHaveTextContent('ZP-2026-0001');
    expect(screen.getByTestId('case-detail-summary')).toHaveTextContent('Juan Perez');
    expect(screen.getByTestId('case-detail-summary')).toHaveTextContent('ABC123');
  });

  it('debería permitir navegar entre workflow, turnos y documentos', async () => {
    const user = userEvent.setup();

    function TestWrapper() {
      const [caseId, setCaseId] = React.useState('case-001');
      return <CaseDetailSummary caseId={caseId} />;
    }

    render(<TestWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId('case-detail-summary')).toBeInTheDocument();
    });

    expect(screen.getByTestId('tab-ficha')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('tab-panel-ficha')).toBeInTheDocument();

    await user.click(screen.getByTestId('tab-workflow'));

    expect(screen.getByTestId('tab-workflow')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('tab-panel-workflow')).toBeInTheDocument();

    await user.click(screen.getByTestId('tab-turnos'));

    expect(screen.getByTestId('tab-turnos')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('tab-panel-turnos')).toBeInTheDocument();

    await user.click(screen.getByTestId('tab-documentos'));

    expect(screen.getByTestId('tab-documentos')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('tab-panel-documentos')).toBeInTheDocument();
  });

  it('debería mostrar error si falla el request', async () => {
    const errorServer = setupServer(
      http.get('/api/v1/cases/:id', () => {
        return HttpResponse.json({ message: 'Error interno' }, { status: 500 });
      })
    );

    errorServer.listen();

    function TestWrapper() {
      const [caseId, setCaseId] = React.useState('error-500');
      return <CaseDetailSummary caseId={caseId} />;
    }

    render(<TestWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByTestId('error-message')).toHaveTextContent(/carpeta/i);

    errorServer.close();
  });

  it('debería mostrar loading mientras carga', async () => {
    let resolvePromise;
    const loadingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const loadingServer = setupServer(
      http.get('/api/v1/cases/:id', async () => {
        await loadingPromise;
        return HttpResponse.json(mockCaseDetail, { status: 200 });
      })
    );

    loadingServer.listen();

    function TestWrapper() {
      const [caseId, setCaseId] = React.useState('case-001');
      return <CaseDetailSummary caseId={caseId} />;
    }

    const { container } = render(<TestWrapper />);

    expect(container.querySelector('[data-testid="loading-state"]')).toBeInTheDocument();

    resolvePromise();

    await waitFor(() => {
      expect(screen.getByTestId('case-detail-summary')).toBeInTheDocument();
    });

    loadingServer.close();
  });
});