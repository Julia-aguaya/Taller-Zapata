import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocumentsSection } from './documents-section';
import { clearStoredAuth, saveStoredAuth } from '@/shared/auth/session-storage';

const jsonResponse = (body) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { 'content-type': 'application/json' },
});

const renderSection = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <DocumentsSection caseId="42" />
    </QueryClientProvider>,
  );
};

describe('DocumentsSection', () => {
  afterEach(() => {
    clearStoredAuth();
    vi.unstubAllGlobals();
  });

  it('prepopulates, allows editing, and sends documentDate in ISO format when the selected category requires it', async () => {
    saveStoredAuth({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    const fetchMock = vi.fn((url, options = {}) => {
      if (url === '/api/v1/documents/catalogs') return Promise.resolve(jsonResponse({ categories: [{ id: 7, name: 'Presupuesto', requiresDate: true }] }));
      if (url === '/api/v1/cases/42/documents') return Promise.resolve(jsonResponse([]));
      if (url === '/api/v1/documents' && options.method === 'POST') return Promise.resolve(jsonResponse({ id: 99 }));
      if (url === '/api/v1/documents/99/relations' && options.method === 'POST') return Promise.resolve(jsonResponse({ id: 10 }));
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderSection();
    fireEvent.click(screen.getByRole('button', { name: /agregar items/i }));

    expect(await screen.findByRole('option', { name: 'Presupuesto' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText('Archivo'), { target: { files: [new File(['content'], 'presupuesto.pdf', { type: 'application/pdf' })] } });
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
      if (url === '/api/v1/documents/catalogs') return Promise.resolve(jsonResponse({ categories: [{ id: 8, name: 'Foto', requiresDate: false }] }));
      if (url === '/api/v1/cases/42/documents') return Promise.resolve(jsonResponse([]));
      if (url === '/api/v1/documents' && options.method === 'POST') return Promise.resolve(jsonResponse({ id: 100 }));
      if (url === '/api/v1/documents/100/relations' && options.method === 'POST') return Promise.resolve(jsonResponse({ id: 11 }));
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderSection();
    fireEvent.click(screen.getByRole('button', { name: /agregar items/i }));
    expect(await screen.findByRole('option', { name: 'Foto' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('Archivo'), { target: { files: [new File(['content'], 'foto.pdf', { type: 'application/pdf' })] } });

    expect(screen.queryByLabelText('Fecha del documento *')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^subir$/i })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /^subir$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/documents', expect.objectContaining({ method: 'POST' })));
    const [, uploadOptions] = fetchMock.mock.calls.find(([url]) => url === '/api/v1/documents');
    expect(uploadOptions.body.get('documentDate')).toBeNull();
  });

  it('sends editable observations using the backend field name', async () => {
    saveStoredAuth({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    const fetchMock = vi.fn((url, options = {}) => {
      if (url === '/api/v1/documents/catalogs') return Promise.resolve(jsonResponse({ categories: [{ id: 8, name: 'Foto', requiresDate: false }] }));
      if (url === '/api/v1/cases/42/documents') return Promise.resolve(jsonResponse([]));
      if (url === '/api/v1/documents' && options.method === 'POST') return Promise.resolve(jsonResponse({ id: 100 }));
      if (url === '/api/v1/documents/100/relations' && options.method === 'POST') return Promise.resolve(jsonResponse({ id: 11 }));
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderSection();
    fireEvent.click(screen.getByRole('button', { name: /agregar items/i }));
    expect(await screen.findByRole('option', { name: 'Foto' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('Archivo'), { target: { files: [new File(['content'], 'foto.pdf', { type: 'application/pdf' })] } });
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
});
