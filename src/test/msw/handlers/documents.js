import { http, HttpResponse } from 'msw';

// Fixture de documentos
export const mockDocuments = [
  {
    documentId: 1,
    relationId: 1,
    fileName: 'presupuesto.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 245000,
    categoryId: 1,
    categoryName: 'Presupuesto',
    subcategoryCode: 'reparacion',
    originCode: 'TALLER',
    originLabel: 'Taller',
    documentDate: '2026-01-20',
    visibleToCustomer: true,
    principal: true,
    createdAt: '2026-01-20T10:00:00Z',
    createdBy: 'Usuario Test',
  },
  {
    documentId: 2,
    relationId: 2,
    fileName: 'fotos_dano_1.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 1250000,
    categoryId: 2,
    categoryName: 'Evidencia',
    subcategoryCode: 'fotos',
    originCode: 'CLIENTE',
    originLabel: 'Cliente',
    documentDate: '2026-01-14',
    visibleToCustomer: false,
    principal: false,
    createdAt: '2026-01-14T18:00:00Z',
    createdBy: 'Sistema',
  },
];

// Fixture de catálogos de documentos
export const mockDocumentsCatalogs = {
  categories: [
    { id: 1, name: 'Presupuesto', requiresDate: true },
    { id: 2, name: 'Evidencia', requiresDate: false },
    { id: 3, name: 'Seguro', requiresDate: true },
    { id: 4, name: 'Personal', requiresDate: false },
    { id: 5, name: 'Vehículo', requiresDate: false },
  ],
};

export const documentsHandlers = [
  // GET /api/v1/documents/catalogs
  http.get('/api/v1/documents/catalogs', () => {
    return HttpResponse.json(mockDocumentsCatalogs, { status: 200 });
  }),

  // POST /api/v1/cases/:id/documents
  http.post('/api/v1/cases/:caseId/documents', async ({ params, request }) => {
    const formData = await request.formData();

    // Validación: si la categoría requiere fecha y no viene, devolver error
    const categoryId = formData.get('categoryId');
    const documentDate = formData.get('documentDate');

    if (categoryId === '1' && !documentDate) {
      return HttpResponse.json(
        { message: 'La categoría seleccionada exige fecha de documento.' },
        { status: 400 }
      );
    }

    // Simular guardado exitoso
    return HttpResponse.json(
      {
        documentId: 999,
        relationId: 999,
        fileName: formData.get('fileName') || 'documento',
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  // PATCH /api/v1/cases/:caseId/documents/:documentId
  http.patch('/api/v1/cases/:caseId/documents/:documentId', async ({ request }) => {
    const body = await request.json();

    // Simular actualización exitosa
    return HttpResponse.json(
      {
        ...body,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }),

  // GET /api/v1/cases/:caseId/documents/:documentId/download
  http.get('/api/v1/cases/:caseId/documents/:documentId/download', () => {
    // Devolver un archivo mockeado (PDF simple)
    const pdfContent = '%PDF-1.4 test';
    return new HttpResponse(pdfContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test.pdf"',
      },
    });
  }),
];