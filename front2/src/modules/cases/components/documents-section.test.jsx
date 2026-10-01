import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocumentsSection } from './documents-section';
import { clearStoredAuth, saveStoredAuth } from '@/shared/auth/session-storage';

vi.mock('@/modules/cases/api/resumable-file-upload-api', () => ({
  uploadFileResumably: async ({ file, metadata, relation }) => {
    const form = new FormData();
    form.append('file', file);
    form.append('caseId', String(metadata.caseId));
    form.append('categoryId', String(metadata.categoryId));
    if (metadata.documentDate) form.append('documentDate', metadata.documentDate);
    if (metadata.observations) form.append('observations', metadata.observations);
    form.append('originCode', metadata.originCode);
    const response = await fetch('/api/v1/documents', { method: 'POST', headers: new Headers({ Authorization: 'Bearer access-token' }), body: form });
    const document = await response.json();
    if (relation) await fetch(`/api/v1/documents/${document.id}/relations`, { method: 'POST', headers: new Headers({ Authorization: 'Bearer access-token' }), body: JSON.stringify(relation) });
    return document;
  },
}));

let session = {
  authorities: ['documento.subir', 'documento.eliminar'],
  scopes: [{ organizationId: null, branchId: null }],
};

vi.mock('@/modules/auth/providers/session-provider', () => ({
  useSession: () => ({ session }),
}));

const jsonResponse = (body) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { 'content-type': 'application/json' },
});

const renderSection = (props = {}) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <DocumentsSection caseId="42" {...props} />
    </QueryClientProvider>,
  );
};

describe('DocumentsSection', () => {
  afterEach(() => {
    session = {
      authorities: ['documento.subir', 'documento.eliminar'],
      scopes: [{ organizationId: null, branchId: null }],
    };
    clearStoredAuth();
    vi.unstubAllGlobals();
  });

  it('isolates and collapses legal-case documentation by module', async () => {
    const fetchMock = vi.fn((url) => {
      if (url === '/api/v1/documents/catalogs') return Promise.resolve(jsonResponse({ categories: [{ id: 31, code: 'EXPEDIENTE_LEGAL', name: 'Expediente legal', requiresDate: false }, { id: 8, code: 'OTRO', name: 'Otro', requiresDate: false }] }));
      if (url === '/api/v1/cases/42/documents?moduleCode=LEGAL') return Promise.resolve(jsonResponse([{ documentId: 7, relationId: 7, moduleCode: 'LEGAL', categoryId: 31, fileName: 'demanda.pdf' }]));
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);
    renderSection({ moduleCode: 'LEGAL', includeHistorical: false, title: 'Documentación Expediente', categoryCodes: new Set(['EXPEDIENTE_LEGAL']), collapsible: true, showCompleteAction: false });
    const toggle = await screen.findByRole('button', { name: /documentación expediente/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(await screen.findByText('demanda.pdf')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/cases/42/documents?moduleCode=LEGAL', expect.anything());
  });

  it('prepopulates, allows editing, and sends documentDate in ISO format when the selected category requires it', async () => {
    saveStoredAuth({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    const fetchMock = vi.fn((url, options = {}) => {
      if (url === '/api/v1/documents/catalogs') return Promise.resolve(jsonResponse({ categories: [{ id: 7, code: 'OTRO', name: 'Otro', requiresDate: true }, { id: 8, code: 'ORDEN_CLEAS', name: 'Orden CLEAS', requiresDate: false }] }));
      if (url === '/api/v1/cases/42/documents') return Promise.resolve(jsonResponse([]));
      if (url === '/api/v1/documents' && options.method === 'POST') return Promise.resolve(jsonResponse({ id: 99 }));
      if (url === '/api/v1/documents/99/relations' && options.method === 'POST') return Promise.resolve(jsonResponse({ id: 10 }));
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderSection();
    fireEvent.click(screen.getByRole('button', { name: /agregar items/i }));

    expect(await screen.findByRole('option', { name: 'Otro' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Orden CLEAS' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText('Archivos'), { target: { files: [new File(['content'], 'presupuesto.pdf', { type: 'application/pdf' })] } });
    expect(screen.getByLabelText('Fecha del documento *')).toBeRequired();
    expect(screen.getByLabelText('Fecha del documento *').value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(screen.getByRole('button', { name: /^subir$/i })).toBeEnabled();

    fireEvent.change(screen.getByLabelText('Fecha del documento *'), { target: { value: '2026-05-10' } });
    fireEvent.click(screen.getByRole('button', { name: /^subir$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/documents', expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
      headers: expect.any(Headers),
    })));
    const [, uploadOptions] = fetchMock.mock.calls.find(([url]) => url === '/api/v1/documents');
    expect(uploadOptions.headers.get('Authorization')).toBe('Bearer access-token');
    expect(uploadOptions.headers.has('Content-Type')).toBe(false);
    expect(uploadOptions.body.get('documentDate')).toBe('2026-05-10');
    expect(uploadOptions.body.get('caseId')).toBe('42');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/documents/99/relations', expect.objectContaining({
      method: 'POST',
      headers: expect.any(Headers),
    })));
    const [, relationOptions] = fetchMock.mock.calls.find(([url]) => url === '/api/v1/documents/99/relations');
    expect(relationOptions.headers.get('Authorization')).toBe('Bearer access-token');
    expect(JSON.parse(relationOptions.body)).toMatchObject({
      caseId: 42,
      entityType: 'CASO',
      entityId: 42,
      moduleCode: 'OPERACION',
    });
  });

  it('does not require or send documentDate when the selected category does not require it', async () => {
    saveStoredAuth({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    const fetchMock = vi.fn((url, options = {}) => {
      if (url === '/api/v1/documents/catalogs') return Promise.resolve(jsonResponse({ categories: [{ id: 8, code: 'OTRO', name: 'Otro', requiresDate: false }] }));
      if (url === '/api/v1/cases/42/documents') return Promise.resolve(jsonResponse([]));
      if (url === '/api/v1/documents' && options.method === 'POST') return Promise.resolve(jsonResponse({ id: 100 }));
      if (url === '/api/v1/documents/100/relations' && options.method === 'POST') return Promise.resolve(jsonResponse({ id: 11 }));
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderSection();
    fireEvent.click(screen.getByRole('button', { name: /agregar items/i }));
    expect(await screen.findByRole('option', { name: 'Otro' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('Archivos'), { target: { files: [new File(['content'], 'foto.pdf', { type: 'application/pdf' })] } });

    expect(screen.queryByLabelText('Fecha del documento *')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^subir$/i })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /^subir$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/documents', expect.objectContaining({ method: 'POST' })));
    const [, uploadOptions] = fetchMock.mock.calls.find(([url]) => url === '/api/v1/documents');
    expect(uploadOptions.body.get('documentDate')).toBeNull();
  });

  it('uploads and relates every selected file', async () => {
    saveStoredAuth({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    let uploadCount = 0;
    const fetchMock = vi.fn((url, options = {}) => {
      if (url === '/api/v1/documents/catalogs') return Promise.resolve(jsonResponse({ categories: [{ id: 8, code: 'OTRO', name: 'Otro', requiresDate: false }] }));
      if (url === '/api/v1/cases/42/documents') return Promise.resolve(jsonResponse([]));
      if (url === '/api/v1/documents' && options.method === 'POST') return Promise.resolve(jsonResponse({ id: ++uploadCount }));
      if (/\/api\/v1\/documents\/[12]\/relations/.test(url) && options.method === 'POST') return Promise.resolve(jsonResponse({ id: uploadCount }));
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderSection();
    fireEvent.click(screen.getByRole('button', { name: /agregar items/i }));
    await screen.findByRole('option', { name: 'Otro' });
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('Archivos'), { target: { files: [new File(['a'], 'uno.pdf'), new File(['b'], 'dos.pdf')] } });
    fireEvent.click(screen.getByRole('button', { name: /^subir$/i }));

    await waitFor(() => expect(fetchMock.mock.calls.filter(([url, options]) => url === '/api/v1/documents' && options?.method === 'POST')).toHaveLength(2));
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/documents/1/relations', expect.objectContaining({ method: 'POST' }));
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/documents/2/relations', expect.objectContaining({ method: 'POST' }));
  });

  it('sends editable observations using the backend field name', async () => {
    saveStoredAuth({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    const fetchMock = vi.fn((url, options = {}) => {
      if (url === '/api/v1/documents/catalogs') return Promise.resolve(jsonResponse({ categories: [{ id: 8, code: 'OTRO', name: 'Otro', requiresDate: false }] }));
      if (url === '/api/v1/cases/42/documents') return Promise.resolve(jsonResponse([]));
      if (url === '/api/v1/documents' && options.method === 'POST') return Promise.resolve(jsonResponse({ id: 100 }));
      if (url === '/api/v1/documents/100/relations' && options.method === 'POST') return Promise.resolve(jsonResponse({ id: 11 }));
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderSection();
    fireEvent.click(screen.getByRole('button', { name: /agregar items/i }));
    expect(await screen.findByRole('option', { name: 'Otro' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('Archivos'), { target: { files: [new File(['content'], 'foto.pdf', { type: 'application/pdf' })] } });
    fireEvent.change(screen.getByLabelText('Observaciones'), { target: { value: '  Archivo revisado  ' } });
    fireEvent.click(screen.getByRole('button', { name: /^subir$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/documents', expect.objectContaining({ method: 'POST' })));
    const [, uploadOptions] = fetchMock.mock.calls.find(([url]) => url === '/api/v1/documents');
    expect(uploadOptions.body.get('observations')).toBe('Archivo revisado');
  });

  it('renders observations returned by the case documents listing', async () => {
    const fetchMock = vi.fn((url) => {
      if (url === '/api/v1/documents/catalogs') return Promise.resolve(jsonResponse({ categories: [] }));
      if (url === '/api/v1/cases/42/documents') return Promise.resolve(jsonResponse([{
        relationId: 1,
        documentId: 12,
        fileName: 'foto.pdf',
        observations: 'Archivo revisado',
      }]));
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderSection();

    expect(await screen.findByText('Archivo revisado')).toBeInTheDocument();
  });

  it('opts into all categories and preserves required metadata when editing a document', async () => {
    session = { authorities: ['documento.editar'], scopes: [{ organizationId: null, branchId: null }] };
    const fetchMock = vi.fn((url, options = {}) => {
      if (url === '/api/v1/documents/catalogs') return Promise.resolve(jsonResponse({ categories: [{ id: 8, code: 'OTRO', name: 'Otro', requiresDate: false }, { id: 30, code: 'PRESUPUESTO', name: 'Presupuesto', requiresDate: true }] }));
      if (url === '/api/v1/cases/42/documents?moduleCode=GESTION_TRAMITE') return Promise.resolve(jsonResponse([{ relationId: 1, documentId: 12, moduleCode: 'GESTION_TRAMITE', categoryId: 8, documentDate: '2026-05-10', originCode: 'TALLER', active: true, observations: 'Original', fileName: 'foto.pdf' }]));
      if (url === '/api/v1/documents/12' && options.method === 'PUT') return Promise.resolve(jsonResponse({}));
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderSection({ moduleCode: 'GESTION_TRAMITE', includeHistorical: false, showAllCategories: true, editableMetadata: true, showCompleteAction: false });

    fireEvent.click(await screen.findByRole('button', { name: /^editar$/i }));
    expect(screen.getByRole('option', { name: 'Presupuesto' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Categoría del documento'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('Observaciones del documento'), { target: { value: 'Actualizado' } });
    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/documents/12', expect.objectContaining({ method: 'PUT' })));
    const [, options] = fetchMock.mock.calls.find(([url]) => url === '/api/v1/documents/12');
    expect(JSON.parse(options.body)).toMatchObject({ categoryId: 30, documentDate: '2026-05-10', originCode: 'TALLER', active: true, observations: 'Actualizado' });
  });

  it('shows and downloads only documents from the current module', async () => {
    saveStoredAuth({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    const fetchMock = vi.fn((url) => {
      if (url === '/api/v1/documents/catalogs') return Promise.resolve(jsonResponse({ categories: [] }));
      if (url === '/api/v1/cases/42/documents?moduleCode=GESTION_TRAMITE') return Promise.resolve(jsonResponse([
        { relationId: 1, documentId: 10, moduleCode: 'GESTION_TRAMITE', fileName: 'tramite.pdf' },
        { relationId: 2, documentId: 20, moduleCode: 'EGRESO_DEFINITIVO', fileName: 'egreso.pdf' },
      ]));
      if (url === '/api/v1/cases/42/documents/zip?documentId=10') return Promise.resolve(new Response(null, { status: 500 }));
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderSection({ moduleCode: 'GESTION_TRAMITE' });

    expect(await screen.findByText('tramite.pdf')).toBeInTheDocument();
    expect(screen.queryByText('egreso.pdf')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /descargar todo/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/cases/42/documents/zip?documentId=10',
      expect.objectContaining({ headers: { Authorization: 'Bearer access-token' } }),
    ));
  });

  it('requires an accessible confirmation before deleting a document', async () => {
    const fetchMock = vi.fn((url, options = {}) => {
      if (url === '/api/v1/documents/catalogs') return Promise.resolve(jsonResponse({ categories: [] }));
      if (url === '/api/v1/cases/42/documents') return Promise.resolve(jsonResponse([{ relationId: 1, documentId: 12, fileName: 'foto.pdf' }]));
      if (url === '/api/v1/documents/12' && options.method === 'DELETE') return Promise.resolve(jsonResponse({}));
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderSection();
    expect(await screen.findByRole('button', { name: /^visualizar$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^descargar$/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^eliminar$/i }));

    expect(screen.getByRole('dialog', { name: '¿Eliminar documento?' })).toBeInTheDocument();
    expect(screen.getByText('El documento foto.pdf se eliminará de forma permanente.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith('/api/v1/documents/12', expect.anything());
    expect(screen.getByRole('button', { name: /^cancelar$/i })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }));
    expect(screen.queryByRole('dialog', { name: '¿Eliminar documento?' })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith('/api/v1/documents/12', expect.anything());

    fireEvent.click(screen.getByRole('button', { name: /^eliminar$/i }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: '¿Eliminar documento?' })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith('/api/v1/documents/12', expect.anything());

    fireEvent.click(screen.getByRole('button', { name: /^eliminar$/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar diálogo' }));
    expect(screen.queryByRole('dialog', { name: '¿Eliminar documento?' })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith('/api/v1/documents/12', expect.anything());

    fireEvent.click(screen.getByRole('button', { name: /^eliminar$/i }));
    const confirmationDialog = screen.getByRole('dialog', { name: '¿Eliminar documento?' });
    fireEvent.click(within(confirmationDialog).getByRole('button', { name: /^eliminar$/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/documents/12', expect.objectContaining({ method: 'DELETE' })));
  });

  it('hides destructive document actions without the matching capability', async () => {
    session = { authorities: [], scopes: [] };
    const fetchMock = vi.fn((url) => {
      if (url === '/api/v1/documents/catalogs') return Promise.resolve(jsonResponse({ categories: [] }));
      if (url === '/api/v1/cases/42/documents') return Promise.resolve(jsonResponse([{ relationId: 1, documentId: 12, fileName: 'foto.pdf' }]));
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderSection();

    expect(await screen.findByRole('button', { name: /^visualizar$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /agregar items/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^eliminar$/i })).not.toBeInTheDocument();
  });

  it('hides deletion for an administrator permission without global scope', async () => {
    session = {
      authorities: ['documento.subir', 'documento.eliminar'],
      scopes: [{ organizationId: 1, branchId: 10, branchCode: 'Z' }],
    };
    const fetchMock = vi.fn((url) => {
      if (url === '/api/v1/documents/catalogs') return Promise.resolve(jsonResponse({ categories: [] }));
      if (url === '/api/v1/cases/42/documents') return Promise.resolve(jsonResponse([{ relationId: 1, documentId: 12, fileName: 'foto.pdf' }]));
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderSection();

    expect(await screen.findByRole('alert')).toHaveTextContent('No tenés alcance administrativo global para eliminar documentos.');
    expect(screen.queryByRole('button', { name: /^eliminar$/i })).not.toBeInTheDocument();
  });

  it('renders deletion for an administrator with global scope and permission', async () => {
    const fetchMock = vi.fn((url) => {
      if (url === '/api/v1/documents/catalogs') return Promise.resolve(jsonResponse({ categories: [] }));
      if (url === '/api/v1/cases/42/documents') return Promise.resolve(jsonResponse([{ relationId: 1, documentId: 12, fileName: 'foto.pdf' }]));
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderSection();

    expect(await screen.findByRole('button', { name: /^eliminar$/i })).toBeInTheDocument();
  });

  it('shows pending documentation from workflow even when no files are uploaded', async () => {
    const fetchMock = vi.fn((url) => {
      if (url === '/api/v1/documents/catalogs') return Promise.resolve(jsonResponse({ categories: [] }));
      if (url === '/api/v1/cases/42/documents') return Promise.resolve(jsonResponse([]));
      if (url === '/api/v1/cases/42') return Promise.resolve(jsonResponse({ currentDocumentationStateCode: 'PENDIENTE_DOCS' }));
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderSection();

    expect(await screen.findByLabelText('Estado de documentación')).toHaveValue('PENDIENTE');
    expect(screen.getByLabelText('Estado de documentación')).toBeDisabled();
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Pendiente', 'Completa']);
  });

  it('allows an authorized user to complete documentation from the accessible select independent of files', async () => {
    session = { authorities: ['workflow.documentacion.completar'], scopes: [{ organizationId: null, branchId: null }] };
    let resolveTransition;
    const fetchMock = vi.fn((url, options = {}) => {
      if (url === '/api/v1/documents/catalogs') return Promise.resolve(jsonResponse({ categories: [] }));
      if (url === '/api/v1/cases/42/documents') return Promise.resolve(jsonResponse([]));
      if (url === '/api/v1/cases/42') return Promise.resolve(jsonResponse({ currentDocumentationStateCode: 'PENDIENTE_DOCS' }));
      if (url === '/api/v1/cases/42/workflow/transitions' && options.method === 'POST') return new Promise((resolve) => { resolveTransition = () => resolve(jsonResponse({})); });
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderSection();

    const select = await screen.findByLabelText('Estado de documentación');
    fireEvent.change(select, { target: { value: 'COMPLETA' } });
    expect(select).toBeDisabled();
    expect(screen.getByText('Actualizando estado de documentación...')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/cases/42/workflow/transitions', expect.objectContaining({ method: 'POST' })));
    const [, options] = fetchMock.mock.calls.find(([url]) => url === '/api/v1/cases/42/workflow/transitions');
    expect(JSON.parse(options.body)).toMatchObject({ domain: 'documentacion', actionCode: 'documentacion.completar', automatic: false });
    resolveTransition();
    expect(await screen.findByText('Estado de documentación actualizado a Completa.')).toBeInTheDocument();
  });
});
