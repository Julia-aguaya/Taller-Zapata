/**
 * useCaseDraftSync hook
 * Manages case draft sync with debounce, autosave, and retry logic
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  detectDirtyState,
  calculateSyncDebounceDelay,
  prepareSyncPayload,
  consolidateOperations,
  handlePartialSuccess,
  prepareSyncErrorMessage,
  calculateSyncRetryDelay,
  shouldSyncRetry,
  validateDraftForSync,
} from '../lib/caseSyncOperations';

export function useCaseDraftSync(accessToken, caseId, initialData, onSync) {
  const [savedData, setSavedData] = useState(initialData);
  const [draftData, setDraftData] = useState(initialData);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveCount, setSaveCount] = useState(0);
  
  const debounceRef = useRef(null);
  const retryRef = useRef(null);

  // Track dirty state
  useEffect(() => {
    const dirty = detectDirtyState(draftData, savedData);
    setIsDirty(dirty);
  }, [draftData, savedData]);

  // Debounced save function
  const debouncedSave = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (!accessToken || !caseId || !isDirty) return;

      // Validate before sync
      const validation = validateDraftForSync(draftData);
      if (!validation.isValid) {
        setSaveError(validation.errors[0]);
        return;
      }

      setIsSaving(true);
      setSaveError(null);

      try {
        const payload = prepareSyncPayload(draftData);
        
        // Call the sync callback
        if (onSync) {
          const result = await onSync(payload);
          
          // Update saved data on success
          setSavedData(draftData);
          setLastSaved(new Date());
          setSaveCount((c) => c + 1);
        }
      } catch (err) {
        setSaveError(prepareSyncErrorMessage(err, 'guardar'));
        
        // Handle retry logic
        if (shouldSyncRetry(err, retryRef.current?.retryCount || 0)) {
          const delay = calculateSyncRetryDelay((retryRef.current?.retryCount || 0) + 1);
          retryRef.current = { retryCount: (retryRef.current?.retryCount || 0) + 1 };
          
          setTimeout(debouncedSave, delay);
        }
      } finally {
        setIsSaving(false);
      }
    }, calculateSyncDebounceDelay('auto'));
  }, [accessToken, caseId, draftData, isDirty, onSync]);

  // Trigger debounced save when draft changes
  useEffect(() => {
    if (isDirty && draftData !== savedData) {
      debouncedSave();
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [draftData, isDirty, savedData, debouncedSave]);

  /**
   * Update draft data
   */
  const updateDraft = useCallback((updates) => {
    setDraftData((prev) => ({ ...prev, ...updates }));
    setSaveError(null);
  }, []);

  /**
   * Update specific field
   */
  const updateField = useCallback((field, value) => {
    setDraftData((prev) => ({ ...prev, [field]: value }));
    setSaveError(null);
  }, []);

  /**
   * Force immediate save
   */
  const saveNow = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!accessToken || !caseId) return;

    // Validate before sync
    const validation = validateDraftForSync(draftData);
    if (!validation.isValid) {
      setSaveError(validation.errors[0]);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const payload = prepareSyncPayload(draftData, 'manual');
      
      if (onSync) {
        await onSync(payload);
        setSavedData(draftData);
        setLastSaved(new Date());
        setSaveCount((c) => c + 1);
        retryRef.current = null;
      }
    } catch (err) {
      setSaveError(prepareSyncErrorMessage(err, 'guardar'));
    } finally {
      setIsSaving(false);
    }
  }, [accessToken, caseId, draftData, onSync]);

  /**
   * Reset draft to saved state
   */
  const resetDraft = useCallback(() => {
    setDraftData(savedData);
    setSaveError(null);
  }, [savedData]);

  /**
   * Discard all changes
   */
  const discardChanges = useCallback(() => {
    setDraftData(savedData);
    setIsDirty(false);
    setSaveError(null);
  }, [savedData]);

  return {
    // Data
    draftData,
    savedData,
    
    // State
    isDirty,
    isSaving,
    lastSaved,
    saveError,
    saveCount,
    
    // Actions
    updateDraft,
    updateField,
    saveNow,
    resetDraft,
    discardChanges,
  };
}