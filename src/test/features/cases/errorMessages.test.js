import { describe, it, expect } from 'vitest';
import { getFriendlyErrorMessage } from '../../../features/cases/lib/caseErrorMessages';

describe('ErrorMessages - getFriendlyErrorMessage', () => {
  describe('errores de red', () => {
    it('debería retornar mensaje de red para error de fetch', () => {
      const error = { message: 'Failed to fetch' };
      expect(getFriendlyErrorMessage(error)).toBe('No pudimos conectarnos al servidor. Revisá tu conexión a internet e intentá nuevamente.');
    });

    it('debería retornar mensaje de red para network error', () => {
      const error = { message: 'Network error' };
      expect(getFriendlyErrorMessage(error)).toContain('conectarnos');
    });

    it('debería retornar mensaje para error con httpStatus 0 (timeout)', () => {
      const error = { httpStatus: 0 };
      expect(getFriendlyErrorMessage(error)).toContain('tardó');
    });

    it('debería detectar timeout en mensaje', () => {
      const error = { message: 'Request timeout' };
      expect(getFriendlyErrorMessage(error)).toContain('tardó');
    });
  });

  describe('errores de autenticación', () => {
    it('debería retornar mensaje para error 401', () => {
      const error = { httpStatus: 401 };
      expect(getFriendlyErrorMessage(error)).toContain('sesión');
      expect(getFriendlyErrorMessage(error)).toContain('permiso');
    });

    it('debería retornar mensaje para error 403', () => {
      const error = { httpStatus: 403 };
      expect(getFriendlyErrorMessage(error)).toContain('sesión');
      expect(getFriendlyErrorMessage(error)).toContain('permiso');
    });
  });

  describe('errores de recurso no encontrado', () => {
    it('debería retornar mensaje para error 404', () => {
      const error = { httpStatus: 404 };
      expect(getFriendlyErrorMessage(error)).toContain('disponible');
    });
  });

  describe('errores de servidor', () => {
    it('debería retornar mensaje para error 500', () => {
      const error = { httpStatus: 500 };
      expect(getFriendlyErrorMessage(error)).toContain('servicio');
      expect(getFriendlyErrorMessage(error)).toContain('disponible');
    });

    it('debería retornar mensaje para error 502', () => {
      const error = { httpStatus: 502 };
      expect(getFriendlyErrorMessage(error)).toContain('servicio');
    });

    it('debería retornar mensaje para error 503', () => {
      const error = { httpStatus: 503 };
      expect(getFriendlyErrorMessage(error)).toContain('servicio');
    });
  });

  describe('casos edge', () => {
    it('debería retornar mensaje genérico para error null', () => {
      expect(getFriendlyErrorMessage(null)).toContain('error');
    });

    it('debería retornar mensaje genérico para error undefined', () => {
      expect(getFriendlyErrorMessage(undefined)).toContain('error');
    });

    it('debería usar mensaje del error cuando no hay caso específico', () => {
      const error = { message: 'Error específico de la aplicación' };
      expect(getFriendlyErrorMessage(error)).toBe('Error específico de la aplicación');
    });

    it('debería usar mensaje por defecto si no hay mensaje en error', () => {
      const error = { httpStatus: 418 };
      expect(getFriendlyErrorMessage(error)).toContain('error');
    });
  });
});