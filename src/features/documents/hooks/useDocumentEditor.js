/**
 * useDocumentEditor hook
 * Manages document upload, edit, preview, download, and replacement
 */
import { useState, useCallback } from 'react';
import {
  updateAuthenticatedDocument,
  replaceAuthenticatedDocument,
  downloadAuthenticatedCaseDocument,
} from '../../../lib/api/backend';
import { validateDocumentMetadata, requiresIssueDate } from '../lib/documentCapabilities';
import { mapFormToApi, mapUpdateToApi, mapDocumentToUI } from '../lib/documentMappers';

export function useDocumentEditor(accessToken, caseId) {
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Upload a new document
   */
  const uploadDocument = useCallback(async (formData, file) => {
    if (!accessToken || !caseId) {
      throw new Error('Missing access token or case ID');
    }

    // Validate metadata
    const validation = validateDocumentMetadata(formData);
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0]);
    }

    setUploading(true);
    setError(null);

    try {
      const payload = mapFormToApi(formData, file);
      const response = await fetch(`/api/v1/cases/${caseId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: payload, // FormData handles multipart
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al subir documento');
      }

      const result = await response.json();
      return mapDocumentToUI(result);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [accessToken, caseId]);

  /**
   * Update document metadata
   */
  const updateDocument = useCallback(async (documentId, updates) => {
    if (!accessToken || !caseId) {
      throw new Error('Missing access token or case ID');
    }

    // Validate if required fields are present
    if (updates.category && requiresIssueDate(updates.category) && !updates.issueDate) {
      throw new Error('La fecha de emisión es requerida para esta categoría');
    }

    setUpdating(true);
    setError(null);

    try {
      const payload = mapUpdateToApi(updates);
      const result = await updateAuthenticatedDocument(accessToken, documentId, payload);
      return mapDocumentToUI(result);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [accessToken, caseId]);

  /**
   * Replace document file
   */
  const replaceDocument = useCallback(async (documentId, file) => {
    if (!accessToken || !caseId) {
      throw new Error('Missing access token or case ID');
    }

    if (!file) {
      throw new Error('El archivo es requerido');
    }

    setReplacing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('archivo', file);

      const result = await replaceAuthenticatedDocument(accessToken, caseId, {
        documentId,
        file: formData,
      });

      return mapDocumentToUI(result);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setReplacing(false);
    }
  }, [accessToken, caseId]);

  /**
   * Download document
   */
  const downloadDocument = useCallback(async (documentId) => {
    if (!accessToken || !caseId) {
      throw new Error('Missing access token or case ID');
    }

    try {
      const blob = await downloadAuthenticatedCaseDocument(accessToken, caseId, documentId);
      return blob;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [accessToken, caseId]);

  /**
   * Preview document (returns URL)
   */
  const getPreviewUrl = useCallback((documentId) => {
    if (!caseId || !documentId) return null;
    return `/api/v1/cases/${caseId}/documents/${documentId}/preview`;
  }, [caseId]);

  /**
   * Get download URL
   */
  const getDownloadUrl = useCallback((documentId) => {
    if (!caseId || !documentId) return null;
    return `/api/v1/cases/${caseId}/documents/${documentId}/download`;
  }, [caseId]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // States
    isUploading: uploading,
    isUpdating: updating,
    isReplacing: replacing,
    error,
    
    // Actions
    uploadDocument,
    updateDocument,
    replaceDocument,
    downloadDocument,
    getPreviewUrl,
    getDownloadUrl,
    clearError,
  };
}