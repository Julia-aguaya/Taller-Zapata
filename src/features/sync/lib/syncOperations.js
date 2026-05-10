export function detectDirtyState(currentData, savedData) {
  if (!currentData && !savedData) return false;
  if (!currentData || !savedData) return true;
  
  return JSON.stringify(currentData) !== JSON.stringify(savedData);
}

export function calculateDebounceDelay(changeType) {
  const delays = {
    keystroke: 1000,
    blur: 500,
    auto: 2000,
  };
  return delays[changeType] || 1000;
}

export function consolidateOperations(operations) {
  if (!operations || operations.length === 0) return [];
  
  const grouped = {};
  
  operations.forEach(op => {
    const key = `${op.entity}_${op.id}`;
    if (!grouped[key]) {
      grouped[key] = { ...op, actions: [] };
    }
    grouped[key].actions.push(op.action);
  });
  
  return Object.values(grouped).map(group => ({
    ...group,
    action: group.actions.includes('delete') ? 'delete' : 
           group.actions.includes('update') ? 'update' : 'create',
    merged: group.actions.length > 1,
  }));
}

export function prepareErrorMessage(error, operation) {
  if (!error) return 'Error desconocido';
  
  if (error.status === 401) {
    return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
  }
  
  if (error.status === 409) {
    return `Conflicto al ${operation}: los datos fueron modificados por otro usuario.`;
  }
  
  if (error.status === 422) {
    return error.data?.message || 'Datos inválidos';
  }
  
  if (error.status >= 500) {
    return 'Error del servidor. Intenta más tarde.';
  }
  
  return error.message || 'Error de conexión';
}

export function calculateRetryDelay(attempt, baseDelay = 1000) {
  const maxDelay = 30000;
  // Calculate delay with exponential backoff, then cap it
  const rawDelay = baseDelay * Math.pow(2, attempt);
  const cappedDelay = Math.min(rawDelay, maxDelay);
  // Only add jitter for attempts > 0 to keep initial attempts predictable
  if (attempt > 0) {
    const jitter = Math.random() * 0.3 * cappedDelay;
    return Math.floor(cappedDelay + jitter);
  }
  return cappedDelay;
}

export function shouldRetry(error, attempt, maxRetries = 3) {
  if (attempt >= maxRetries) return false;
  
  if (!error.status) return true;
  
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  return retryableStatuses.includes(error.status);
}

export function mergePartialResults(successful, failed) {
  return {
    success: successful,
    failed: failed,
    total: successful.length + failed.length,
    hasErrors: failed.length > 0,
  };
}