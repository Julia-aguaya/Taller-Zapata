import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useBatchFileUpload } from './use-batch-file-upload';
import { BatchFileUploadStatus } from '@/shared/ui/batch-file-upload-status';

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((nextResolve, nextReject) => { resolve = nextResolve; reject = nextReject; });
  return { promise, resolve, reject };
};

const UploadHarness = ({ uploadFile, files, onCompleted = vi.fn() }) => {
  const upload = useBatchFileUpload({ uploadFile, onCompleted });
  return <><button type="button" onClick={() => upload.upload(files)} disabled={upload.isUploading}>Subir</button><BatchFileUploadStatus upload={upload} /></>;
};

describe('useBatchFileUpload', () => {
  it('shows an indicator for a single file, prevents duplicate starts, and completes it', async () => {
    const first = deferred();
    const uploadFile = vi.fn(() => first.promise);
    render(<UploadHarness uploadFile={uploadFile} files={[new File(['a'], 'uno.jpg', { type: 'image/jpeg' })]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Subir' }));
    fireEvent.click(screen.getByRole('button', { name: 'Subir' }));

    expect(screen.getByRole('status')).toHaveTextContent('Subiendo fotos… (0 de 1)');
    expect(screen.getByRole('button', { name: 'Subir' })).toBeDisabled();
    expect(uploadFile).toHaveBeenCalledTimes(1);
    first.resolve({ id: 1 });
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
  });

  it('keeps the indicator until every selected file finishes', async () => {
    const first = deferred();
    const second = deferred();
    const uploadFile = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    render(<UploadHarness uploadFile={uploadFile} files={[new File(['a'], 'uno.jpg'), new File(['b'], 'dos.jpg')]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Subir' }));
    first.resolve({ id: 1 });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Subiendo fotos… (1 de 2)'));
    second.resolve({ id: 2 });
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
    expect(uploadFile).toHaveBeenCalledTimes(2);
  });

  it('reports failed files and retries only those files', async () => {
    const first = new File(['a'], 'guardada.jpg');
    const failed = new File(['b'], 'fallida.jpg');
    const uploadFile = vi.fn()
      .mockResolvedValueOnce({ id: 1 })
      .mockRejectedValueOnce(new Error('Sin conexión'))
      .mockResolvedValueOnce({ id: 2 });
    const onCompleted = vi.fn();
    render(<UploadHarness uploadFile={uploadFile} files={[first, failed]} onCompleted={onCompleted} />);

    fireEvent.click(screen.getByRole('button', { name: 'Subir' }));
    await screen.findByText(/no se pudieron subir: fallida\.jpg/i);
    expect(uploadFile).toHaveBeenNthCalledWith(1, first);
    expect(uploadFile).toHaveBeenNthCalledWith(2, failed);
    expect(onCompleted).toHaveBeenLastCalledWith(expect.objectContaining({ uploaded: [{ id: 1 }], failed: [expect.objectContaining({ file: failed })] }));

    fireEvent.click(screen.getByRole('button', { name: /reintentar archivos fallidos/i }));
    await waitFor(() => expect(uploadFile).toHaveBeenCalledTimes(3));
    expect(uploadFile).toHaveBeenLastCalledWith(failed);
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
  });
});
