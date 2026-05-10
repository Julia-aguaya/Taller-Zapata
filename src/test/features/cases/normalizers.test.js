import { describe, it, expect } from 'vitest';
import { normalizeDocument, normalizePlate, normalizePhone, normalizeLookupText } from '../../../features/cases/lib/caseNormalizers';

describe('Cases - normalizeDocument', () => {
  it('debería eliminar no-dígitos del RUT chileno', () => {
    expect(normalizeDocument('20.123.456-7')).toBe('201234567');
  });

  it('debería eliminar puntos y guiones', () => {
    expect(normalizeDocument('12.345.678-9')).toBe('123456789');
  });

  it('debería manejar valores sin formato', () => {
    expect(normalizeDocument('12345678')).toBe('12345678');
  });

  it('debería manejar null y undefined', () => {
    expect(normalizeDocument(null)).toBe('');
    expect(normalizeDocument(undefined)).toBe('');
  });

  it('debería manejar strings vacíos', () => {
    expect(normalizeDocument('')).toBe('');
  });

  it('debería eliminar espacios en blanco', () => {
    expect(normalizeDocument('  12.345.678-9  ')).toBe('123456789');
  });
});

describe('Cases - normalizePlate', () => {
  it('debería convertir a mayúsculas', () => {
    expect(normalizePlate('abc123')).toBe('ABC123');
  });

  it('debería eliminar espacios', () => {
    expect(normalizePlate('ABC 123')).toBe('ABC123');
  });

  it('debería eliminar múltiples espacios', () => {
    expect(normalizePlate('ABC   123')).toBe('ABC123');
  });

  it('debería manejar patentes con guiones', () => {
    expect(normalizePlate('ABC-123')).toBe('ABC-123');
  });

  it('debería manejar null y undefined', () => {
    expect(normalizePlate(null)).toBe('');
    expect(normalizePlate(undefined)).toBe('');
  });

  it('debería manejar string vacío', () => {
    expect(normalizePlate('')).toBe('');
  });

  it('debería preservar caracteres alfanuméricos', () => {
    expect(normalizePlate('XYZ-987')).toBe('XYZ-987');
  });
});

describe('Cases - normalizePhone', () => {
  it('debería eliminar no-dígitos', () => {
    expect(normalizePhone('+56 9 1234 5678')).toBe('56912345678');
  });

  it('debería eliminar paréntesis y guiones', () => {
    expect(normalizePhone('(56) 2 1234-5678')).toBe('56212345678');
  });

  it('debería manejar números sin formato', () => {
    expect(normalizePhone('912345678')).toBe('912345678');
  });

  it('debería manejar null y undefined', () => {
    expect(normalizePhone(null)).toBe('');
    expect(normalizePhone(undefined)).toBe('');
  });
});

describe('Cases - normalizeLookupText', () => {
  it('debería convertir a minúsculas', () => {
    expect(normalizeLookupText('HOLAMUNDO')).toBe('holamundo');
  });

  it('debería eliminar acentos', () => {
    expect(normalizeLookupText('Café')).toBe('cafe');
    expect(normalizeLookupText('ño')).toBe('no');
  });

  it('debería trimhear espacios', () => {
    expect(normalizeLookupText('  hola  ')).toBe('hola');
  });

  it('debería manejar null y undefined', () => {
    expect(normalizeLookupText(null)).toBe('');
    expect(normalizeLookupText(undefined)).toBe('');
  });

  it('debería manejar string vacío', () => {
    expect(normalizeLookupText('')).toBe('');
  });

  it('debería manejar texto con múltiples acentos', () => {
    expect(normalizeLookupText('avíÓN')).toBe('avion');
  });

  it('debería normalizar texto con diacríticos complejos', () => {
    expect(normalizeLookupText('María José')).toBe('maria jose');
  });
});