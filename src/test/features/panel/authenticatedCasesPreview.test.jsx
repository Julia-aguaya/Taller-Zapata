import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AuthenticatedCasesPreview from '../../../features/panel/components/AuthenticatedCasesPreview';

describe('AuthenticatedCasesPreview', () => {
  it('envia paidFrom y paidTo automáticamente al cambiar fechas', async () => {
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

    await user.type(screen.getByLabelText('Pagado desde'), '2026-03-01');
    await user.type(screen.getByLabelText('Pagado hasta'), '2026-03-31');

    await waitFor(() => {
      expect(onRefresh).toHaveBeenLastCalledWith({
        paidFrom: '2026-03-01',
        paidTo: '2026-03-31',
      });
    });
  });
});
