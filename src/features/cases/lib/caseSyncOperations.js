/**
 * caseSyncOperations.js
 * Sync operations for case draft management
 */

/**
 * Calculate debounce delay based on change type
 */
export function calculateSyncDebounceDelay(changeType) {
  const delays = {
    keystroke: 1000,
    blur: 500,
    auto: 2000,
    manual: 0,
  };
  return delays[changeType] || 1000;
}

/**
 * Detect if data has changed (dirty state)
 */
export function detectDirtyState(currentData, savedData) {
  if (!currentData && !savedData) return false;
  if (!currentData || !savedData) return true;
  
  return JSON.stringify(currentData) !== JSON.stringify(savedData);
}

/**
 * Merge draft changes with saved data
 */
export function mergeDraftChanges(draft, saved) {
  return { ...saved, ...draft };
}

/**
 * Prepare sync payload from draft
 */
export function prepareSyncPayload(draft, operation = 'update') {
  const payload = {
    data: draft,
    operation,
    timestamp: new Date().toISOString(),
  };
  
  // Add metadata about what changed
  if (draft.changes) {
    payload.changes = Object.keys(draft.changes);
  }
  
  return payload;
}

/**
 * Consolidate multiple operations into single batch
 */
export function consolidateOperations(operations) {
  if (!operations || operations.length === 0) return [];
  
  const grouped = {};
  
  operations.forEach((op) => {
    const key = `${op.entity}_${op.id}`;
    if (!grouped[key]) {
      grouped[key] = { ...op, actions: [] };
    }
    grouped[key].actions.push(op.action);
  });
  
  return Object.values(grouped).map((group) => ({
    ...group,
    action: group.actions.includes('delete') ? 'delete' : 
           group.actions.includes('update') ? 'update' : 'create',
    merged: group.actions.length > 1,
  }));
}

/**
 * Handle partial sync success
 */
export function handlePartialSuccess(results, operation) {
  const successful = results.filter((r) => r.status === 'fulfilled');
  const failed = results.filter((r) => r.status === 'rejected');
  
  return {
    success: successful.map((r) => r.value),
    failed: failed.map((r) => r.reason),
    partial: failed.length > 0 && successful.length > 0,
    total: results.length,
    successCount: successful.length,
    failedCount: failed.length,
  };
}

/**
 * Prepare error message for sync failures
 */
export function prepareSyncErrorMessage(error, operation = 'guardar') {
  if (!error) return 'Error desconocido al guardar';
  
  if (error.status === 401) {
    return 'Tu sesión ha expirado. Por favor, iniciá sesión nuevamente.';
  }
  
  if (error.status === 409) {
    return `Conflicto al ${operation}: los datos fueron modificados por otro usuario.`;
  }
  
  if (error.status === 422) {
    return error.data?.message || 'Datos inválidos';
  }
  
  if (error.status >= 500) {
    return 'Error del servidor. Intentá más tarde.';
  }
  
  if (error.status === 0 || error.message?.includes('timeout')) {
    return 'La conexión tardó demasiado. Revisá tu conexión e intentá nuevamente.';
  }
  
  return error.message || 'Error al guardar cambios';
}

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateSyncRetryDelay(attempt, baseDelay = 1000) {
  const maxDelay = 30000;
  const rawDelay = baseDelay * Math.pow(2, attempt);
  const cappedDelay = Math.min(rawDelay, maxDelay);
  
  // Add jitter for attempts > 0
  if (attempt > 0) {
    const jitter = Math.random() * 0.3 * cappedDelay;
    return Math.floor(cappedDelay + jitter);
  }
  return cappedDelay;
}

/**
 * Determine if should retry after error
 */
export function shouldSyncRetry(error, attempt, maxRetries = 3) {
  if (attempt >= maxRetries) return false;
  
  if (!error.status) return true;
  
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  return retryableStatuses.includes(error.status);
}

/**
 * Create sync checkpoint for recovery
 */
export function createSyncCheckpoint(draft, operationId) {
  return {
    id: operationId,
    data: { ...draft },
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };
}

/**
 * Validate draft before sync
 */
export function validateDraftForSync(draft) {
  const errors = [];
  
  if (!draft) {
    errors.push('No hay datos para guardar');
    return { isValid: false, errors };
  }
  
  // Add specific validation rules based on draft type
  if (draft.caseNumber && !draft.caseNumber.match(/^[A-Z0-9-]+$/i)) {
    errors.push('Número de caso inválido');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}