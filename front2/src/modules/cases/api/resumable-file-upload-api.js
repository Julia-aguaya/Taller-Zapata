import { requestJson } from '@/shared/api/http-client';

export const FILE_UPLOAD_CHUNK_SIZE = 5 * 1024 * 1024;
export const RESUMABLE_UPLOAD_STORAGE_KEY = 'taller-zapata.resumable-document-uploads.v1';
const MAX_ATTEMPTS = 3;

const sha256 = async (blob) => {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const uploadChunk = async (uploadId, index, chunk) => {
  const checksum = await sha256(chunk);
  const form = new FormData();
  form.append('file', chunk, 'chunk.bin');
  let lastError;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await requestJson(`/document-uploads/${uploadId}/chunks/${index}`, { method: 'POST', headers: { 'X-Chunk-Sha256': checksum }, body: form });
    } catch (error) {
      lastError = error;
      try {
        if ((await requestJson(`/document-uploads/${uploadId}`)).nextChunk > index) return null;
      } catch { /* Preserve the original upload error. */ }
    }
  }
  throw lastError;
};

const storage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const readUploadMappings = () => {
  const localStorage = storage();
  if (!localStorage) return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(RESUMABLE_UPLOAD_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && parsed.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {};
  } catch {
    localStorage.removeItem(RESUMABLE_UPLOAD_STORAGE_KEY);
    return {};
  }
};

const writeUploadMappings = (sessions) => {
  const localStorage = storage();
  if (!localStorage) return;
  try {
    if (Object.keys(sessions).length === 0) localStorage.removeItem(RESUMABLE_UPLOAD_STORAGE_KEY);
    else localStorage.setItem(RESUMABLE_UPLOAD_STORAGE_KEY, JSON.stringify({ sessions }));
  } catch {
    // Uploads continue when storage is unavailable or full; only cross-reload recovery is lost.
  }
};

const removeUploadMapping = (fileIdentity) => {
  const sessions = readUploadMappings();
  delete sessions[fileIdentity];
  writeUploadMappings(sessions);
};

const saveUploadMapping = (fileIdentity, uploadId, requestFingerprint) => {
  const sessions = readUploadMappings();
  sessions[fileIdentity] = { uploadId, requestFingerprint };
  writeUploadMappings(sessions);
};

const hasValidSessionShape = (session, chunkCount) => (
  session
  && typeof session.uploadId === 'string'
  && Number.isInteger(session.nextChunk)
  && session.nextChunk >= 0
  && session.nextChunk <= chunkCount
  && session.chunkCount === chunkCount
);

const isExpired = (expiresAt) => !expiresAt || Number.isNaN(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now();

const isExistingRelationConflict = (error) => (
  error?.httpStatus === 409 && /ya esta relacionado/i.test(error.message || '')
);

const createRelation = async (document, relation) => {
  if (!relation) return;
  try {
    await requestJson(`/documents/${document.id}/relations`, { method: 'POST', body: JSON.stringify(relation) });
  } catch (error) {
    // A lost response can leave the relation created. The server only emits this conflict for the same document/entity pair.
    if (!isExistingRelationConflict(error)) throw error;
  }
};

export const uploadFileResumably = async ({ file, metadata, relation }) => {
  const chunkCount = Math.ceil(file.size / FILE_UPLOAD_CHUNK_SIZE);
  const checksumSha256 = await sha256(file);
  const createRequest = {
    ...metadata,
    caseId: metadata.caseId == null ? null : Number(metadata.caseId),
    categoryId: Number(metadata.categoryId),
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    checksumSha256,
    chunkCount,
  };
  const fileIdentity = JSON.stringify({ checksumSha256, name: file.name, type: file.type || 'application/octet-stream', size: file.size, lastModified: file.lastModified });
  const requestFingerprint = JSON.stringify({ createRequest, relation: relation ?? null });
  const mapping = readUploadMappings()[fileIdentity];
  let session;
  let completedDocument;

  if (mapping?.uploadId && mapping.requestFingerprint === requestFingerprint) {
    try {
      const recovered = await requestJson(`/document-uploads/${mapping.uploadId}`);
      if (recovered.status === 'ACTIVA' && !isExpired(recovered.expiresAt) && hasValidSessionShape(recovered, chunkCount)) {
        session = recovered;
      } else if (recovered.status === 'COMPLETADA' && recovered.documentId != null) {
        completedDocument = await requestJson(`/documents/${recovered.documentId}`);
      } else {
        removeUploadMapping(fileIdentity);
      }
    } catch {
      removeUploadMapping(fileIdentity);
    }
  } else if (mapping) {
    removeUploadMapping(fileIdentity);
  }

  if (completedDocument) {
    await createRelation(completedDocument, relation);
    removeUploadMapping(fileIdentity);
    return completedDocument;
  }

  if (!session) {
    session = await requestJson('/document-uploads', { method: 'POST', body: JSON.stringify(createRequest) });
    if (!hasValidSessionShape(session, chunkCount)) throw new Error('La sesion de carga recibida es invalida.');
    saveUploadMapping(fileIdentity, session.uploadId, requestFingerprint);
  }

  for (let index = session.nextChunk; index < chunkCount; index += 1) {
    await uploadChunk(session.uploadId, index, file.slice(index * FILE_UPLOAD_CHUNK_SIZE, Math.min(file.size, (index + 1) * FILE_UPLOAD_CHUNK_SIZE)));
  }
  const document = await requestJson(`/document-uploads/${session.uploadId}/complete`, { method: 'POST' });
  await createRelation(document, relation);
  removeUploadMapping(fileIdentity);
  return document;
};
