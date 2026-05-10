import { describe, it, expect } from 'vitest';
import { formatBackendState, formatCaseNumber, formatDate, formatCurrency } from '../../../features/cases/lib/caseFormatters';

describe('Cases - formatBackendState', () => {
  it('debería formatear código snake_case', () => {
    expect(formatBackendState('en_tramite')).toBe('En Tramite');
  });

  it('debería formatear código con puntos', () => {
    expect(formatBackendState('esperando.aprobacion')).toBe('Esperando Aprobacion');
  });

  it('debería formatear código con guiones', () => {
    expect(formatBackendState('cerrado-definitivo')).toBe('Cerrado Definitivo');
  });

  it('debería manejar código unknown', () => {
    expect(formatBackendState('unknown')).toBe('Unknown');
  });

  it('debería usar fallback para valor nulo', () => {
    expect(formatBackendState(null)).toBe('Sin dato');
  });

  it('debería usar fallback para valor undefined', () => {
    expect(formatBackendState(undefined)).toBe('Sin dato');
  });

  it('debería usar fallback para string vacío', () => {
    expect(formatBackendState('')).toBe('Sin dato');
  });

  it('debería usar fallback personalizado', () => {
    expect(formatBackendState(null, 'Sin información')).toBe('Sin información');
  });

  it('debería manejar códigos con múltiples tokens', () => {
    expect(formatBackendState('uno_dos_tres')).toBe('Uno Dos Tres');
  });
});

describe('Cases - formatCaseNumber', () => {
  it('debería formatear número de caso en mayúsculas', () => {
    expect(formatCaseNumber('zp-2026-0001')).toBe('ZP-2026-0001');
  });

  it('debería mantener mayúsculas', () => {
    expect(formatCaseNumber('ZP-2026-0001')).toBe('ZP-2026-0001');
  });

  it('debería manejar valor nulo', () => {
    expect(formatCaseNumber(null)).toBe('');
  });

  it('debería manejar valor undefined', () => {
    expect(formatCaseNumber(undefined)).toBe('');
  });

  it('debería manejar string vacío', () => {
    expect(formatCaseNumber('')).toBe('');
  });
});

describe('Cases - formatDate', () => {
  it('debería formatear fecha en formato argentino', () => {
    const result = formatDate('2026-01-15');
    expect(result).toContain('15');
    expect(result).toContain('1');
    expect(result).toContain('2026');
  });

  it('debería retornar "-" para fecha nula', () => {
    expect(formatDate(null)).toBe('-');
  });

  it('debería retornar "-" para fecha undefined', () => {
    expect(formatDate(undefined)).toBe('-');
  });

  it('debería retornar "-" para string vacío', () => {
    expect(formatDate('')).toBe('-');
  });
});

describe('Cases - formatCurrency', () => {
  it('debería formatear número en pesos argentinos', () => {
    const result = formatCurrency(1000);
    expect(result).toContain('1.000');
  });

  it('debería formatear con decimales', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('123');
    expect(result).toContain('56');
  });

  it('debería manejar número decimal correctamente', () => {
    const result = formatCurrency(1.56);
    expect(result).toContain('1');
    expect(result).toContain('56');
  });

  it('debería retornar "-" para valor nulo', () => {
    expect(formatCurrency(null)).toBe('-');
  });

  it('debería retornar "-" para valor undefined', () => {
    expect(formatCurrency(undefined)).toBe('-');
  });

  it('debería retornar "-" para string vacío', () => {
    expect(formatCurrency('')).toBe('-');
  });

  it('debería manejar valores grandes', () => {
    const result = formatCurrency(1000000);
    expect(result).toContain('1.000.000');
  });
});