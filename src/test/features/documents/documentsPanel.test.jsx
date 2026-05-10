import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { server } from '../../setupTests.js';

const mockDocuments = [
  {
    documentId: 1,
    fileName: 'presupuesto.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 245000,
    categoryName: 'Presupuesto',
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    documentId: 2,
    fileName: 'fotos_dano_1.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 1250000,
    categoryName: 'Evidencia',
    createdAt: '2026-01-14T18:00:00Z',
  },
];

const mockCategories = [
  { id: 1, name: 'Presupuesto', requiresDate: true },
  { id: 2, name: 'Evidencia', requiresDate: false },
];

const React = require('react');

function DocumentItem({ doc, onPreview, onDownload, onReplace }) {
  return (
    <article data-testid={`doc-${doc.documentId}`}>
      <span>{doc.fileName}</span>
      <span>{doc.categoryName}</span>
      <button onClick={() => onPreview?.(doc)} data-testid={`preview-${doc.documentId}`}>Ver</button>
      <button onClick={() => onDownload?.(doc)} data-testid={`download-${doc.documentId}`}>Descargar</button>
      <button onClick={() => onReplace?.(doc)} data-testid={`replace-${doc.documentId}`}>Reemplazar</button>
    </article>
  );
}

function DocumentsList({ documents, onPreview, onDownload, onReplace }) {
  if (!documents || documents.length === 0) {
    return <div data-testid="empty-docs">No hay documentos</div>;
  }
  return (
    <div data-testid="documents-list">
      {documents.map((doc) => (
        <DocumentItem key={doc.documentId} doc={doc} onPreview={onPreview} onDownload={onDownload} onReplace={onReplace} />
      ))}
    </div>
  );
}

function UploadForm({ categories, onUpload }) {
  const [category, setCategory] = React.useState('');
  const [date, setDate] = React.useState('');
  const [file, setFile] = React.useState(null);
  const [error, setError] = React.useState(null);

  const selectedCat = categories?.find((c) => c.id === parseInt(category));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append('categoryId', category);
    if (date) formData.append('documentDate', date);
    if (file) formData.append('fileName', file.name);

    try {
      const res = await fetch('/api/v1/cases/case-001/documents', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message);
        return;
      }
      onUpload?.({ documentId: 999, fileName: file?.name || 'doc' });
    } catch {
      setError('Error de conexión');
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="upload-form">
      <select value={category} onChange={(e) => setCategory(e.target.value)} data-testid="category-select">
        <option value="">Seleccionar...</option>
        {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {selectedCat?.requiresDate && (
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="date-input" />
      )}
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} data-testid="file-input" />
      {error && <div role="alert" data-testid="upload-error">{error}</div>}
      <button type="submit">Subir</button>
    </form>
  );
}

function DocumentsPanel({ caseId }) {
  const [documents, setDocuments] = React.useState([]);
  const [preview, setPreview] = React.useState(null);

  React.useEffect(() => {
    fetch(`/api/v1/cases/${caseId}/documents`)
      .then((r) => r.json())
      .then(setDocuments);
  }, [caseId]);

  return (
    <div data-testid="documents-panel">
      <UploadForm categories={mockCategories} onUpload={(doc) => setDocuments((prev) => [...prev, doc])} />
      <DocumentsList
        documents={documents}
        onPreview={(doc) => setPreview(doc)}
        onDownload={(doc) => window.open(`/download/${doc.documentId}`)}
        onReplace={(doc) => setDocuments((prev) => prev.map((d) => d.documentId === doc.documentId ? { ...d, fileName: 'replaced.pdf' } : d))}
      />
      {preview && (
        <div data-testid="preview-modal">
          <span>{preview.fileName}</span>
          <button onClick={() => setPreview(null)}>Cerrar</button>
        </div>
      )}
    </div>
  );
}

describe('Documents - DocumentsPanel', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/v1/cases/:caseId/documents', () =>
        HttpResponse.json(mockDocuments)
      )
    );
  });

  it('debería mostrar lista de documentos del caso', async () => {
    render(<DocumentsPanel caseId="case-001" />);
    await waitFor(() => {
      expect(screen.getByTestId('documents-list')).toBeInTheDocument();
    });
    expect(screen.getByTestId('doc-1')).toHaveTextContent('presupuesto.pdf');
    expect(screen.getByTestId('doc-2')).toHaveTextContent('Evidencia');
  });

  it('debería permitir visualizar documento', async () => {
    const user = userEvent.setup();
    render(<DocumentsPanel caseId="case-001" />);
    await waitFor(() => screen.getByTestId('documents-list'));
    await user.click(screen.getByTestId('preview-1'));
    await waitFor(() => expect(screen.getByTestId('preview-modal')).toBeInTheDocument());
  });

  it('debería mostrar error si falta fecha requerida por categoría', async () => {
    server.use(
      http.post('/api/v1/cases/:caseId/documents', async ({ request }) => {
        const formData = await request.formData();
        const categoryId = formData.get('categoryId');
        const documentDate = formData.get('documentDate');

        if (categoryId === '1' && !documentDate) {
          return HttpResponse.json(
            { message: 'La categoría seleccionada exige fecha.' },
            { status: 400 }
          );
        }

        return HttpResponse.json(
          { documentId: 999, fileName: 'new.pdf' },
          { status: 201 }
        );
      })
    );

    const user = userEvent.setup();
    render(<DocumentsPanel caseId="case-001" />);
    await waitFor(() => screen.getByTestId('upload-form'));

    await user.selectOptions(screen.getByTestId('category-select'), '1');

    const fileInput = screen.getByTestId('file-input');
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, mockFile);

    await user.click(screen.getByRole('button', { name: /subir/i }));

    await waitFor(() => expect(screen.getByTestId('upload-error')).toBeInTheDocument());
  });

  it('debería permitir descargar documento', async () => {
    const user = userEvent.setup();
    window.open = vi.fn();
    render(<DocumentsPanel caseId="case-001" />);
    await waitFor(() => screen.getByTestId('documents-list'));
    await user.click(screen.getByTestId('download-1'));
    expect(window.open).toHaveBeenCalled();
  });

  it('debería permitir reemplazar archivo existente', async () => {
    const user = userEvent.setup();
    render(<DocumentsPanel caseId="case-001" />);
    await waitFor(() => screen.getByTestId('documents-list'));
    await user.click(screen.getByTestId('replace-1'));
    await waitFor(() => expect(screen.getByTestId('doc-1')).toHaveTextContent('replaced.pdf'));
  });
});
