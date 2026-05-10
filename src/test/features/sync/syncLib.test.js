import { describe, it, expect } from 'vitest';
import { 
  detectDirtyState, 
  calculateDebounceDelay, 
  consolidateOperations,
  prepareErrorMessage,
  calculateRetryDelay,
  shouldRetry,
  mergePartialResults
} from '../../../features/sync/lib/syncOperations';

describe('Sync - detectDirtyState', () => {
  it('debería detectar cambios sin guardar', () => {
    const current = { name: 'Juan' };
    const saved = { name: 'Pedro' };
    
    expect(detectDirtyState(current, saved)).toBe(true);
  });

  it('debería retornar false cuando no hay cambios', () => {
    const data = { name: 'Juan' };
    
    expect(detectDirtyState(data, data)).toBe(false);
    expect(detectDirtyState({ ...data }, { ...data })).toBe(false);
  });

  it('debería retornar true cuando current tiene datos y saved es null', () => {
    expect(detectDirtyState({ name: 'Juan' }, null)).toBe(true);
  });

  it('debería retornar true cuando current es null y saved tiene datos', () => {
    expect(detectDirtyState(null, { name: 'Juan' })).toBe(true);
  });

  it('debería retornar false cuando ambos son null', () => {
    expect(detectDirtyState(null, null)).toBe(false);
  });
});

describe('Sync - calculateDebounceDelay', () => {
  it('debería retornar 1000ms para keystroke', () => {
    expect(calculateDebounceDelay('keystroke')).toBe(1000);
  });

  it('debería retornar 500ms para blur', () => {
    expect(calculateDebounceDelay('blur')).toBe(500);
  });

  it('debería retornar 2000ms para auto', () => {
    expect(calculateDebounceDelay('auto')).toBe(2000);
  });

  it('debería retornar 1000ms por defecto', () => {
    expect(calculateDebounceDelay('unknown')).toBe(1000);
    expect(calculateDebounceDelay()).toBe(1000);
  });
});

describe('Sync - consolidateOperations', () => {
  const operations = [
    { entity: 'case', id: '1', action: 'update', data: { status: 'open' } },
    { entity: 'case', id: '1', action: 'update', data: { priority: 'high' } },
    { entity: 'case', id: '2', action: 'create', data: { name: 'New' } },
    { entity: 'case', id: '3', action: 'delete', data: { deleted: true } },
  ];

  it('debería agrupar operaciones por entity + id', () => {
    const result = consolidateOperations(operations);
    
    expect(result).toHaveLength(3);
    
    const case1 = result.find(r => r.id === '1');
    expect(case1.merged).toBe(true);
  });

  it('debería usar action delete cuando existe', () => {
    const result = consolidateOperations(operations);
    
    const case3 = result.find(r => r.id === '3');
    expect(case3.action).toBe('delete');
  });

  it('debería usar action update cuando hay update y create', () => {
    const opsWithUpdateAndCreate = [
      { entity: 'case', id: '1', action: 'update' },
      { entity: 'case', id: '1', action: 'create' },
    ];
    
    const result = consolidateOperations(opsWithUpdateAndCreate);
    const case1 = result[0];
    expect(case1.action).toBe('update');
  });

  it('debería manejar array vacío', () => {
    expect(consolidateOperations([])).toHaveLength(0);
  });

  it('debería manejar null', () => {
    expect(consolidateOperations(null)).toHaveLength(0);
  });
});

describe('Sync - prepareErrorMessage', () => {
  it('debería retornar mensaje para error 401', () => {
    const error = { status: 401 };
    const result = prepareErrorMessage(error, 'guardar');
    
    expect(result).toContain('sesión');
  });

  it('debería retornar mensaje para error 409', () => {
    const error = { status: 409 };
    const result = prepareErrorMessage(error, 'actualizar');
    
    expect(result.toLowerCase()).toContain('conflicto');
  });

  it('debería retornar mensaje para error 422', () => {
    const error = { status: 422, data: { message: 'Datos inválidos' } };
    const result = prepareErrorMessage(error, 'guardar');
    
    expect(result).toBe('Datos inválidos');
  });

  it('debería retornar mensaje para errores 5xx', () => {
    const error = { status: 500 };
    const result = prepareErrorMessage(error, 'guardar');
    
    expect(result).toContain('servidor');
  });

  it('debería retornar mensaje por defecto', () => {
    const error = { message: 'Error específico' };
    expect(prepareErrorMessage(error, 'guardar')).toBe('Error específico');
    
    expect(prepareErrorMessage(null, 'guardar')).toBe('Error desconocido');
  });
});

describe('Sync - calculateRetryDelay', () => {
  it('debería incrementar delay exponencialmente', () => {
    expect(calculateRetryDelay(0, 1000)).toBeLessThan(2000);
    expect(calculateRetryDelay(1, 1000)).toBeGreaterThan(1500);
    expect(calculateRetryDelay(2, 1000)).toBeGreaterThan(3000);
  });

  it('debería tener jitter aleatorio para reintentos mayores a 0', () => {
    // No jitter on attempt 0 for predictability
    const delay0 = calculateRetryDelay(0, 1000);
    expect(delay0).toBe(1000);
    
    // Jitter on attempts > 0
    const delays = new Set();
    for (let i = 0; i < 10; i++) {
      delays.add(calculateRetryDelay(1, 1000));
    }
    expect(delays.size).toBeGreaterThan(1);
  });

  it('debería limitar delay máximo cercano a 30 segundos', () => {
    const delay = calculateRetryDelay(10, 1000);
    // With jitter from attempt > 0, it could exceed slightly, but should be reasonable
    expect(delay).toBeLessThan(40000);
  });
});

describe('Sync - shouldRetry', () => {
  it('debería reintentar en errores de red', () => {
    expect(shouldRetry({ status: 408 }, 0)).toBe(true);
    expect(shouldRetry({ status: 429 }, 0)).toBe(true);
    expect(shouldRetry({ status: 500 }, 0)).toBe(true);
    expect(shouldRetry({ status: 502 }, 0)).toBe(true);
    expect(shouldRetry({ status: 503 }, 0)).toBe(true);
    expect(shouldRetry({ status: 504 }, 0)).toBe(true);
  });

  it('debería no reintentar si excede maxRetries', () => {
    expect(shouldRetry({ status: 500 }, 3, 3)).toBe(false);
  });

  it('debería no reintentar en errores 4xx (excepto 408 y 429)', () => {
    expect(shouldRetry({ status: 400 }, 0)).toBe(false);
    expect(shouldRetry({ status: 401 }, 0)).toBe(false);
    expect(shouldRetry({ status: 404 }, 0)).toBe(false);
  });

  it('debería reintentar si no hay status (error de red)', () => {
    expect(shouldRetry({}, 0)).toBe(true);
  });
});

describe('Sync - mergePartialResults', () => {
  it('debería mergeear resultados exitosos y fallidos', () => {
    const successful = [{ id: 1 }, { id: 2 }];
    const failed = [{ id: 3, error: 'Error' }];
    
    const result = mergePartialResults(successful, failed);
    
    expect(result.success).toHaveLength(2);
    expect(result.failed).toHaveLength(1);
    expect(result.total).toBe(3);
    expect(result.hasErrors).toBe(true);
  });

  it('debería retornar hasErrors false cuando no hay fallos', () => {
    const result = mergePartialResults([{ id: 1 }], []);
    
    expect(result.hasErrors).toBe(false);
  });
});