import { afterEach, describe, expect, it, vi } from 'vitest';
import { FILE_UPLOAD_CHUNK_SIZE, RESUMABLE_UPLOAD_STORAGE_KEY, uploadFileResumably } from './resumable-file-upload-api';

const requestJson = vi.fn();
vi.mock('@/shared/api/http-client', () => ({ requestJson: (...args) => requestJson(...args) }));

describe('uploadFileResumably', () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    requestJson.mockReset();
  });

  it('uploads chunks and creates its optional relation after completion', async () => {
    vi.stubGlobal('crypto', { subtle: { digest: vi.fn().mockResolvedValue(new Uint8Array(32).buffer) } });
    requestJson.mockImplementation((path) => {
      if (path === '/document-uploads') return Promise.resolve({ uploadId: '00000000-0000-4000-8000-000000000001', chunkCount: 3, nextChunk: 0 });
      if (path.endsWith('/complete')) return Promise.resolve({ id: 44 });
      return Promise.resolve({});
    });
    await uploadFileResumably({
      file: new File([new Uint8Array(FILE_UPLOAD_CHUNK_SIZE * 2 + 1)], 'video.mp4', { type: 'video/mp4' }),
      metadata: { caseId: 12, categoryId: 7, originCode: 'TALLER' },
      relation: { caseId: 12, entityType: 'CASO', entityId: 12, moduleCode: 'PRESUPUESTO' },
    });
    expect(requestJson.mock.calls.map(([path]) => path)).toEqual([
      '/document-uploads',
      '/document-uploads/00000000-0000-4000-8000-000000000001/chunks/0',
      '/document-uploads/00000000-0000-4000-8000-000000000001/chunks/1',
      '/document-uploads/00000000-0000-4000-8000-000000000001/chunks/2',
      '/document-uploads/00000000-0000-4000-8000-000000000001/complete',
      '/documents/44/relations',
    ]);
  });

  it('allows a global upload without a relation', async () => {
    vi.stubGlobal('crypto', { subtle: { digest: vi.fn().mockResolvedValue(new Uint8Array(32).buffer) } });
    requestJson.mockImplementation((path) => path === '/document-uploads'
      ? Promise.resolve({ uploadId: '00000000-0000-4000-8000-000000000002', chunkCount: 1, nextChunk: 0 })
      : path.endsWith('/complete') ? Promise.resolve({ id: 45 }) : Promise.resolve({}));
    await uploadFileResumably({ file: new File(['logo'], 'logo.png', { type: 'image/png' }), metadata: { categoryId: 4, originCode: 'TALLER' } });
    expect(JSON.parse(requestJson.mock.calls[0][1].body)).toMatchObject({ caseId: null, categoryId: 4, fileName: 'logo.png' });
    expect(requestJson.mock.calls.map(([path]) => path)).not.toContain('/documents/45/relations');
  });

  it('resumes an active matching upload from its next chunk', async () => {
    vi.stubGlobal('crypto', { subtle: { digest: vi.fn().mockResolvedValue(new Uint8Array(32).buffer) } });
    const file = new File([new Uint8Array(FILE_UPLOAD_CHUNK_SIZE * 3)], 'video.mp4', { type: 'video/mp4', lastModified: 123 });
    const checksum = '00'.repeat(32);
    const identity = JSON.stringify({ checksumSha256: checksum, name: file.name, type: file.type, size: file.size, lastModified: file.lastModified });
    const createRequest = { caseId: 12, categoryId: 7, originCode: 'TALLER', fileName: file.name, mimeType: file.type, sizeBytes: file.size, checksumSha256: checksum, chunkCount: 3 };
    localStorage.setItem(RESUMABLE_UPLOAD_STORAGE_KEY, JSON.stringify({ sessions: { [identity]: { uploadId: '00000000-0000-4000-8000-000000000003', requestFingerprint: JSON.stringify({ createRequest, relation: null }) } } }));
    requestJson.mockImplementation((path) => {
      if (path === '/document-uploads/00000000-0000-4000-8000-000000000003') return Promise.resolve({ uploadId: '00000000-0000-4000-8000-000000000003', chunkCount: 3, nextChunk: 2, status: 'ACTIVA', expiresAt: '2099-01-01T00:00:00Z' });
      if (path.endsWith('/complete')) return Promise.resolve({ id: 46 });
      return Promise.resolve({});
    });

    await uploadFileResumably({ file, metadata: { caseId: 12, categoryId: 7, originCode: 'TALLER' } });

    expect(requestJson.mock.calls.map(([path]) => path)).toEqual([
      '/document-uploads/00000000-0000-4000-8000-000000000003',
      '/document-uploads/00000000-0000-4000-8000-000000000003/chunks/2',
      '/document-uploads/00000000-0000-4000-8000-000000000003/complete',
    ]);
    expect(localStorage.getItem(RESUMABLE_UPLOAD_STORAGE_KEY)).toBeNull();
  });

  it('removes a stale mapping and creates a new upload session', async () => {
    vi.stubGlobal('crypto', { subtle: { digest: vi.fn().mockResolvedValue(new Uint8Array(32).buffer) } });
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    const checksum = '00'.repeat(32);
    const identity = JSON.stringify({ checksumSha256: checksum, name: file.name, type: file.type, size: file.size, lastModified: file.lastModified });
    const createRequest = { categoryId: 4, originCode: 'TALLER', caseId: null, fileName: file.name, mimeType: file.type, sizeBytes: file.size, checksumSha256: checksum, chunkCount: 1 };
    localStorage.setItem(RESUMABLE_UPLOAD_STORAGE_KEY, JSON.stringify({ sessions: { [identity]: { uploadId: 'stale-upload', requestFingerprint: JSON.stringify({ createRequest, relation: null }) } } }));
    requestJson.mockImplementation((path) => {
      if (path === '/document-uploads/stale-upload') return Promise.reject(Object.assign(new Error('[404] No existe la sesion de carga'), { httpStatus: 404 }));
      if (path === '/document-uploads') return Promise.resolve({ uploadId: '00000000-0000-4000-8000-000000000004', chunkCount: 1, nextChunk: 0 });
      if (path.endsWith('/complete')) return Promise.resolve({ id: 47 });
      return Promise.resolve({});
    });

    await uploadFileResumably({ file, metadata: { categoryId: 4, originCode: 'TALLER' } });

    expect(requestJson.mock.calls.map(([path]) => path)).toEqual([
      '/document-uploads/stale-upload',
      '/document-uploads',
      '/document-uploads/00000000-0000-4000-8000-000000000004/chunks/0',
      '/document-uploads/00000000-0000-4000-8000-000000000004/complete',
    ]);
    expect(localStorage.getItem(RESUMABLE_UPLOAD_STORAGE_KEY)).toBeNull();
  });
});
