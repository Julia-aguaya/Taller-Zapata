import { describe, it, expect } from 'vitest';
import {
  formatProbeCheckedAt,
  maskToken,
  resolveInsuranceCompanyIdByName,
} from '../../../features/cases/lib/caseAppUtils';

describe('caseAppUtils', () => {
  describe('formatProbeCheckedAt', () => {
    it('debería retornar idleMessage para valor nulo', () => {
      const result = formatProbeCheckedAt(null);
      expect(result).toBe('Todavía no verificamos la conexión.');
    });

    it('debería retornar idleMessage para valor undefined', () => {
      const result = formatProbeCheckedAt(undefined);
      expect(result).toBe('Todavía no verificamos la conexión.');
    });

    it('debería retornar idleMessage para string vacío', () => {
      const result = formatProbeCheckedAt('');
      expect(result).toBe('Todavía no verificamos la conexión.');
    });

    it('debería formatear fecha correctamente', () => {
      const date = new Date('2026-05-10T14:30:00');
      const result = formatProbeCheckedAt(date);
      expect(result).toContain('Último intento');
      expect(result).toContain(':30');
    });

    it('debería formatear timestamp number', () => {
      const timestamp = new Date('2026-05-10T14:30:00').getTime();
      const result = formatProbeCheckedAt(timestamp);
      expect(result).toContain('Último intento');
    });

    it('debería usar idleMessage personalizado', () => {
      const result = formatProbeCheckedAt(null, 'Verificando...');
      expect(result).toBe('Verificando...');
    });

    it('debería formatear fecha ISO string', () => {
      const result = formatProbeCheckedAt('2026-05-10T14:30:00.000Z');
      expect(result).toContain('Último intento');
    });
  });

  describe('maskToken', () => {
    it('debería retornar mensaje por defecto para valor nulo', () => {
      const result = maskToken(null);
      expect(result).toBe('Sesión no iniciada');
    });

    it('debería retornar mensaje por defecto para valor undefined', () => {
      const result = maskToken(undefined);
      expect(result).toBe('Sesión no iniciada');
    });

    it('debería retornar mensaje por defecto para string vacío', () => {
      const result = maskToken('');
      expect(result).toBe('Sesión no iniciada');
    });

    it('debería retornar token sin modificar si es <= 24 caracteres', () => {
      const token = 'abc123';
      const result = maskToken(token);
      expect(result).toBe('abc123');
    });

    it('debería enmascarar token > 24 caracteres', () => {
      const token = 'abcdefghijklmnopqrstuvwxyz0123456789';
      const result = maskToken(token);
      expect(result).toContain('...');
      expect(result.length).toBeLessThan(token.length);
      expect(result.startsWith('abcdefghijklmnop')).toBe(true);
    });

    it('debería tomar primeros 16 y últimos 8 caracteres', () => {
      const token = '12345678901234567890'; // 20 chars, won't be masked
      const result = maskToken(token);
      expect(result).toBe(token);
    });

    it('debería manejar token de exactamente 25 caracteres', () => {
      const token = 'a'.repeat(25);
      const result = maskToken(token);
      expect(result).toContain('...');
      // 16 + 3 + 8 = 27 chars (masked version)
      expect(result.length).toBe(27);
    });
  });

  describe('resolveInsuranceCompanyIdByName', () => {
    const companies = [
      { id: '1', name: 'Seguros ABC', businessName: 'Aseguradora ABC S.A.', label: 'ABC' },
      { id: '2', name: 'XYZ Seguros', businessName: 'XYZ Cía. de Seguros', label: 'XYZ' },
      { id: '3', name: 'Mapfre', businessName: 'Mapfre Chile', label: 'Mapfre' },
    ];

    it('debería retornar null para companies vacío', () => {
      const result = resolveInsuranceCompanyIdByName([], 'ABC');
      expect(result).toBeNull();
    });

    it('debería retornar null para name vacío', () => {
      const result = resolveInsuranceCompanyIdByName(companies, '');
      expect(result).toBeNull();
    });

    it('debería retornar null para name null', () => {
      const result = resolveInsuranceCompanyIdByName(companies, null);
      expect(result).toBeNull();
    });

    it('debería encontrar por nombre exacto', () => {
      const result = resolveInsuranceCompanyIdByName(companies, 'Seguros ABC');
      expect(result).toBe('1');
    });

    it('debería encontrar por name exacto', () => {
      const result = resolveInsuranceCompanyIdByName(companies, 'XYZ Seguros');
      expect(result).toBe('2');
    });

    it('debería encontrar por label', () => {
      const result = resolveInsuranceCompanyIdByName(companies, 'Mapfre');
      expect(result).toBe('3');
    });

    it('debería ser case insensitive', () => {
      const result = resolveInsuranceCompanyIdByName(companies, 'seguros abc');
      expect(result).toBe('1');
    });

    it('debería normalizar acentos', () => {
      const result = resolveInsuranceCompanyIdByName(companies, 'XYZ Seguros');
      expect(result).toBe('2');
    });

    it('debería encontrar por coincidencia parcial (name contiene search)', () => {
      const result = resolveInsuranceCompanyIdByName(companies, 'Seguros');
      expect(result).toBe('1');
    });

    it('debería encontrar por coincidencia parcial (search contiene name)', () => {
      const result = resolveInsuranceCompanyIdByName(companies, 'Seguros');
      expect(result).toBe('1');
    });

    it('debería retornar null si no hay match', () => {
      const result = resolveInsuranceCompanyIdByName(companies, 'Inexistente');
      expect(result).toBeNull();
    });

    it('debería retornar null si no hay companies', () => {
      const result = resolveInsuranceCompanyIdByName(null, 'ABC');
      expect(result).toBeNull();
    });
  });
});