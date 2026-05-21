import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import DocumentsDetailBlock from '../../../components/caseDetailBlocks/DocumentsDetailBlock';
import StatusBadge from '../../../components/ui/StatusBadge';
import AuthenticatedCaseDetail from '../../../features/panel/components/AuthenticatedCaseDetail';
import { formatDocumentAudience, formatDocumentDescriptor, formatDocumentSize } from '../../../features/panel/lib/panelPreviewHelpers';

function formatDate(value) {
  return value || 'Sin fecha';
}

function formatDateTime(value) {
  return value || 'Sin fecha';
}

const documentItem = {
  relationId: 1,
  documentId: 10,
  categoryId: 1,
  fileName: 'informe.pdf',
  mimeType: 'application/pdf',
  originCode: 'SEED_LOCAL',
  observations: '',
  visibleToCustomer: true,
  principal: false,
  visualOrder: 1,
};

const secondDocumentItem = {
  ...documentItem,
  relationId: 2,
  documentId: 11,
  fileName: 'foto.jpg',
  mimeType: 'image/jpeg',
};

const baseDetailState = {
  status: 'success',
  item: { id: 99 },
  data: {
    id: 99,
    folderCode: 'ZP-99',
    customerName: 'Juan Perez',
    vehicleBrand: 'Ford',
    vehicleModel: 'Focus',
    domain: 'ABC123',
    currentCaseStateCode: 'en_tramite',
    priorityCode: 'media',
    openedAt: '2026-05-01',
    dueAt: '2026-05-10',
  },
  workflowHistory: [],
  workflowActions: [],
  appointmentsState: {
    items: [],
    nextAppointment: null,
  },
  documentsState: {
    status: 'success',
    items: [],
    visibleCount: 0,
    total: 0,
  },
};

describe('AuthenticatedCaseDetail', () => {
  it('abre gestión y documentación desde ver detalle usando la apertura del caso', async () => {
    const user = userEvent.setup();
    const onOpenCase = vi.fn();

    render(
      <AuthenticatedCaseDetail
        detailState={baseDetailState}
        onOpenCase={onOpenCase}
        onOpenDetail={vi.fn()}
        onSaveDocument={vi.fn()}
        onDownloadDocument={vi.fn()}
        onPreviewDocument={vi.fn()}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
        documentsCatalogs={{ categories: [] }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Abrir gestión' }));
    await user.click(screen.getByRole('button', { name: 'Documentación' }));

    expect(onOpenCase).toHaveBeenNthCalledWith(1, baseDetailState.data, { tab: 'gestion' });
    expect(onOpenCase).toHaveBeenNthCalledWith(2, baseDetailState.data, { tab: 'documentacion' });
  });
});

describe('DocumentsDetailBlock copy', () => {
  it('muestra copy entendible para editar documentos', async () => {
    const user = userEvent.setup();

    render(
      <DocumentsDetailBlock
        documentsState={{
          status: 'success',
          items: [documentItem],
          visibleCount: 1,
          total: 1,
        }}
        documentGroups={[
          {
            origin: 'Carga interna',
            items: [documentItem],
          },
        ]}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
        formatDocumentSize={formatDocumentSize}
        formatDocumentDescriptor={formatDocumentDescriptor}
        formatDocumentAudience={formatDocumentAudience}
        onSaveDocument={vi.fn().mockResolvedValue(true)}
        onDownloadDocument={vi.fn()}
        onPreviewDocument={vi.fn()}
        caseId={99}
        documentsCatalogs={{ categories: [{ id: 1, name: 'General', requiresDate: false }] }}
        StatusBadge={StatusBadge}
      />,
    );

    expect(screen.getByText('Carga interna')).toBeInTheDocument();
    expect(screen.queryByText('Seed local')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Editar documento' }));

    expect(screen.getByText('Edicion rapida del documento')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument();
  });

  it('bloquea solo el documento que esta ejecutando una accion', () => {
    render(
      <DocumentsDetailBlock
        documentsState={{
          status: 'success',
          items: [documentItem, secondDocumentItem],
          visibleCount: 2,
          total: 2,
        }}
        documentGroups={[
          {
            origin: 'Carga interna',
            items: [documentItem, secondDocumentItem],
          },
        ]}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
        formatDocumentSize={formatDocumentSize}
        formatDocumentDescriptor={formatDocumentDescriptor}
        formatDocumentAudience={formatDocumentAudience}
        onSaveDocument={vi.fn().mockResolvedValue(true)}
        onDownloadDocument={vi.fn()}
        onPreviewDocument={vi.fn()}
        isSavingDocuments={{ upload: false, byId: { 10: 'update-relation' } }}
        isDownloadingDocument={{ byId: { 10: true } }}
        isPreviewingDocument={{ byId: { 10: true } }}
        caseId={99}
        documentsCatalogs={{ categories: [{ id: 1, name: 'General', requiresDate: false }] }}
        StatusBadge={StatusBadge}
      />,
    );

    expect(screen.getByRole('button', { name: 'Guardando visibilidad...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Descargando archivo...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Abriendo vista previa...' })).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Editar documento' })[0]).toBeEnabled();
    expect(screen.getAllByRole('button', { name: 'Vista previa' })[0]).toBeEnabled();
    expect(screen.getAllByRole('button', { name: 'Descargar archivo' })[0]).toBeEnabled();
  });
});
