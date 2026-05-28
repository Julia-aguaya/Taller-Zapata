import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AuthenticatedCasesPreview from '../../../features/panel/components/AuthenticatedCasesPreview';

describe('AuthenticatedCasesPreview', () => {
  it('usa q del backend cuando cambia la búsqueda textual', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <AuthenticatedCasesPreview
        detailState={{ status: 'idle' }}
        documentsCatalogs={null}
        formatDate={() => '-'}
        formatDateTime={() => '-'}
        onDownloadDocument={() => {}}
        onOpenCase={() => {}}
        onOpenDetail={() => {}}
        onPreviewDocument={() => {}}
        onRefresh={onRefresh}
        onSaveDocument={() => {}}
        state={{
          status: 'success',
          tone: 'success',
          title: 'ok',
          detail: '',
          items: [],
          total: 0,
          visible: 0,
          checkedAt: '',
        }}
      />,
    );

    await user.type(screen.getByLabelText('Buscar carpeta'), 'paragolpe');

    await waitFor(() => {
      expect(onRefresh).toHaveBeenLastCalledWith({ q: 'paragolpe' });
    }, { timeout: 1200 });
  });

  it('mantiene resultados del backend cuando la búsqueda coincide con campos reales anidados', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <AuthenticatedCasesPreview
        detailState={{ status: 'idle' }}
        documentsCatalogs={null}
        formatDate={() => '-'}
        formatDateTime={() => '-'}
        onDownloadDocument={() => {}}
        onOpenCase={() => {}}
        onOpenDetail={() => {}}
        onPreviewDocument={() => {}}
        onRefresh={onRefresh}
        onSaveDocument={() => {}}
        state={{
          status: 'success',
          tone: 'success',
          title: 'ok',
          detail: '',
          items: [
            {
              id: 'case-001',
              folderCode: 'ZP-2026-0001',
              branch: 'Z',
              currentCaseStateCode: 'en_tramite',
              client: {
                firstName: 'Juan',
                lastName: 'Perez',
              },
              vehicle: {
                plate: 'ABC123',
                brand: 'Chevrolet',
                model: 'Cruze',
              },
            },
          ],
          total: 1,
          visible: 1,
          checkedAt: '',
        }}
      />,
    );

    expect(screen.getByText('ZP-2026-0001')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Buscar carpeta'), 'ABC123');

    await waitFor(() => {
      expect(onRefresh).toHaveBeenLastCalledWith({ q: 'ABC123' });
    }, { timeout: 1200 });

    expect(screen.getByText('ZP-2026-0001')).toBeInTheDocument();
    expect(screen.queryByText('No encontramos carpetas con estos filtros.')).not.toBeInTheDocument();
  });

  it('aplica paidFrom y paidTo solo al confirmar filtros avanzados', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <AuthenticatedCasesPreview
        detailState={{ status: 'idle' }}
        documentsCatalogs={null}
        formatDate={() => '-'}
        formatDateTime={() => '-'}
        onDownloadDocument={() => {}}
        onOpenCase={() => {}}
        onOpenDetail={() => {}}
        onPreviewDocument={() => {}}
        onRefresh={onRefresh}
        onSaveDocument={() => {}}
        state={{
          status: 'success',
          tone: 'success',
          title: 'ok',
          detail: '',
          items: [],
          total: 0,
          visible: 0,
          checkedAt: '',
        }}
      />,
    );

    await user.click(screen.getByText('Filtros avanzados'));
    await user.type(screen.getByLabelText('Pagado desde'), '2026-03-01');
    await user.type(screen.getByLabelText('Pagado hasta'), '2026-03-31');

    expect(onRefresh).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Aplicar' }));

    await waitFor(() => {
      expect(onRefresh).toHaveBeenLastCalledWith({
        paidFrom: '2026-03-01',
        paidTo: '2026-03-31',
      });
    });
  });

  it('envia filtros avanzados del backend sin afectar los filtros rápidos', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <AuthenticatedCasesPreview
        detailState={{ status: 'idle' }}
        documentsCatalogs={null}
        formatDate={() => '-'}
        formatDateTime={() => '-'}
        insuranceCatalogs={{
          paymentStatusCodes: [{ code: 'PAGADO', name: 'Pagado' }],
          opinionCodes: [{ code: 'APROBADO', name: 'Aprobado' }],
        }}
        onDownloadDocument={() => {}}
        onOpenCase={() => {}}
        onOpenDetail={() => {}}
        onPreviewDocument={() => {}}
        onRefresh={onRefresh}
        onSaveDocument={() => {}}
        state={{
          status: 'success',
          tone: 'success',
          title: 'ok',
          detail: '',
          items: [
            {
              id: 1,
              folderCode: 'CAR-1',
              branchCode: 'Z',
              currentCaseStateCode: 'EN_TRAMITE',
              caseType: 'Particular',
            },
            {
              id: 2,
              folderCode: 'CAR-2',
              branchCode: 'Z',
              currentCaseStateCode: 'EN_TRAMITE',
              caseTypeCode: 'TODO_RIESGO',
              caseTypeName: 'Todo Riesgo',
            },
          ],
          total: 2,
          visible: 2,
          checkedAt: '',
        }}
      />,
    );

    await user.click(screen.getByText('Filtros avanzados'));
    await user.selectOptions(screen.getByLabelText('Tipo de carpeta'), 'PARTICULAR');
    await user.selectOptions(screen.getByLabelText('Estado de cobro'), 'PAGADO');
    await user.selectOptions(screen.getByLabelText('Pendientes por resolver'), 'true');

    expect(onRefresh).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Aplicar' }));

    await waitFor(() => {
      expect(onRefresh).toHaveBeenLastCalledWith({
        caseTypeCode: 'PARTICULAR',
        paymentStateCode: 'PAGADO',
        hasPendingTasks: true,
      });
    });

    await user.selectOptions(screen.getByLabelText('Estado del trámite'), 'En Tramite');
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('actualiza el listado visible al aplicar filtros avanzados aunque la respuesta todavia no cambie', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <AuthenticatedCasesPreview
        detailState={{ status: 'idle' }}
        documentsCatalogs={null}
        formatDate={() => '-'}
        formatDateTime={() => '-'}
        insuranceCatalogs={null}
        onDownloadDocument={() => {}}
        onOpenCase={() => {}}
        onOpenDetail={() => {}}
        onPreviewDocument={() => {}}
        onRefresh={onRefresh}
        onSaveDocument={() => {}}
        state={{
          status: 'success',
          tone: 'success',
          title: 'ok',
          detail: '',
          items: [
            {
              id: 1,
              folderCode: 'CAR-1',
              branchCode: 'Z',
              currentCaseStateCode: 'EN_TRAMITE',
              caseTypeCode: 'PARTICULAR',
            },
            {
              id: 2,
              folderCode: 'CAR-2',
              branchCode: 'Z',
              currentCaseStateCode: 'EN_TRAMITE',
              caseTypeCode: 'TODO_RIESGO',
            },
          ],
          total: 2,
          visible: 2,
          checkedAt: '',
        }}
      />,
    );

    expect(screen.getByText('CAR-1')).toBeInTheDocument();
    expect(screen.getByText('CAR-2')).toBeInTheDocument();

    await user.click(screen.getByText('Filtros avanzados'));
    await user.selectOptions(screen.getByLabelText('Tipo de carpeta'), 'PARTICULAR');
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));

    await waitFor(() => {
      expect(screen.getByText('CAR-1')).toBeInTheDocument();
      expect(screen.queryByText('CAR-2')).not.toBeInTheDocument();
    });

    expect(onRefresh).toHaveBeenLastCalledWith({ caseTypeCode: 'PARTICULAR' });
  });

  it('ordena el bloque del panel general por fecha de alta descendente cuando se pide latest-created', () => {
    render(
      <AuthenticatedCasesPreview
        detailState={{ status: 'idle' }}
        documentsCatalogs={null}
        formatDate={() => '-'}
        formatDateTime={() => '-'}
        insuranceCatalogs={null}
        onDownloadDocument={() => {}}
        onOpenCase={() => {}}
        onOpenDetail={() => {}}
        onPreviewDocument={() => {}}
        onRefresh={vi.fn().mockResolvedValue(undefined)}
        onSaveDocument={() => {}}
        showLoadMore={false}
        sortStrategy="latest-created"
        state={{
          status: 'success',
          tone: 'success',
          title: 'ok',
          detail: '',
          items: [
            {
              id: 1,
              folderCode: 'CAR-1',
              branchCode: 'Z',
              currentCaseStateCode: 'EN_TRAMITE',
              createdAt: '2026-05-10',
            },
            {
              id: 2,
              folderCode: 'CAR-2',
              branchCode: 'Z',
              currentCaseStateCode: 'EN_TRAMITE',
              createdAt: '2026-05-18',
            },
          ],
          total: 2,
          visible: 2,
          checkedAt: '',
        }}
      />,
    );

    const headings = screen.getAllByRole('heading', { level: 3 });

    expect(headings[0]).toHaveTextContent('CAR-2');
    expect(headings[1]).toHaveTextContent('CAR-1');
  });

  it('no vuelve a refrescar solo porque cambia la referencia de onRefresh', async () => {
    const user = userEvent.setup();
    const firstOnRefresh = vi.fn().mockResolvedValue(undefined);

    const view = render(
      <AuthenticatedCasesPreview
        detailState={{ status: 'idle' }}
        documentsCatalogs={null}
        formatDate={() => '-'}
        formatDateTime={() => '-'}
        insuranceCatalogs={null}
        onDownloadDocument={() => {}}
        onOpenCase={() => {}}
        onOpenDetail={() => {}}
        onPreviewDocument={() => {}}
        onRefresh={firstOnRefresh}
        onSaveDocument={() => {}}
        state={{
          status: 'success',
          tone: 'success',
          title: 'ok',
          detail: '',
          items: [],
          total: 0,
          visible: 0,
          checkedAt: '',
        }}
      />,
    );

    await user.click(screen.getByText('Filtros avanzados'));
    await user.type(screen.getByLabelText('Pagado desde'), '2026-03-01');

    await user.click(screen.getByRole('button', { name: 'Aplicar' }));

    await waitFor(() => {
      expect(firstOnRefresh).toHaveBeenCalledTimes(1);
    });

    const secondOnRefresh = vi.fn().mockResolvedValue(undefined);

    view.rerender(
      <AuthenticatedCasesPreview
        detailState={{ status: 'idle' }}
        documentsCatalogs={null}
        formatDate={() => '-'}
        formatDateTime={() => '-'}
        insuranceCatalogs={null}
        onDownloadDocument={() => {}}
        onOpenCase={() => {}}
        onOpenDetail={() => {}}
        onPreviewDocument={() => {}}
        onRefresh={secondOnRefresh}
        onSaveDocument={() => {}}
        state={{
          status: 'success',
          tone: 'success',
          title: 'ok',
          detail: '',
          items: [],
          total: 0,
          visible: 0,
          checkedAt: '',
        }}
      />,
    );

    await new Promise((resolve) => {
      setTimeout(resolve, 450);
    });

    expect(firstOnRefresh).toHaveBeenCalledTimes(1);
    expect(secondOnRefresh).not.toHaveBeenCalled();
  });
});
