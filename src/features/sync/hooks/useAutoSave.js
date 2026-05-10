import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  detectDirtyState, 
  calculateDebounceDelay, 
  consolidateOperations,
  prepareErrorMessage,
  calculateRetryDelay,
  shouldRetry 
} from '../lib/syncOperations';

export function useAutoSave({ 
  data, 
  onSave, 
  debounceMs = 1000,
  maxRetries = 3 
}) {
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);
  const [pendingOperations, setPendingOperations] = useState([]);
  
  const savedDataRef = useRef(null);
  const timeoutRef = useRef(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    savedDataRef.current = data;
  }, [data]);

  useEffect(() => {
    setIsDirty(detectDirtyState(data, savedDataRef.current));
  }, [data]);

  useEffect(() => {
    if (!isDirty || isSaving) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      await performSave();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isDirty, data, debounceMs, isSaving]);

  const performSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const consolidated = consolidateOperations(pendingOperations);
      const result = await onSave(consolidated.length > 0 ? consolidated : data);
      
      setLastSaved(new Date());
      setPendingOperations([]);
      retryCountRef.current = 0;
      savedDataRef.current = data;
      setIsDirty(false);
      
      return result;
    } catch (err) {
      const errorMsg = prepareErrorMessage(err, 'guardar');
      setError(errorMsg);
      
      if (shouldRetry(err, retryCountRef.current, maxRetries)) {
        retryCountRef.current++;
        const delay = calculateRetryDelay(retryCountRef.current);
        
        setTimeout(() => {
          performSave();
        }, delay);
      }
      
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return performSave();
  }, [data, pendingOperations]);

  const addOperation = useCallback((operation) => {
    setPendingOperations(prev => [...prev, operation]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isDirty,
    isSaving,
    lastSaved,
    error,
    saveNow,
    addOperation,
    clearError,
    retry: () => {
      retryCountRef.current = 0;
      return performSave();
    },
  };
}