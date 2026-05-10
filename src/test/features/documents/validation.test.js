/**
 * Tests de validación de documentos
 * Estos tests validan la lógica de validación del flujo de documentos.
 */

import { describe, it, expect } from 'vitest';

// Datos de prueba
const mockDocumentsCatalogs = {
  categories: [
    { id: 1, name: 'Presupuesto', requiresDate: true },
    { id: 2, name: 'Evidencia', requiresDate: false },
    { id: 3, name: 'Seguro', requiresDate: true },
    { id: 4, name: 'Personal', requiresDate: false },
    { id: 5, name: 'Vehículo', requiresDate: false },
  ],
};

// Funciones de validación (copiadas de App.jsx para testear)
function getDocumentCategoryRequiresDate(categories, categoryId) {
  const category = categories.find((c) => String(c.id) === String(categoryId));
  return Boolean(category?.requiresDate);
}

function validateDocumentUpload(metadata, catalogs) {
  const errors = [];

  // Validar categoría
  if (!metadata.categoryId) {
    errors.push('La categoría es obligatoria.');
  }

  // Validar fecha según categoría
  const requiresDate = getDocumentCategoryRequiresDate(catalogs.categories, metadata.categoryId);
  if (requiresDate && !metadata.documentDate) {
    errors.push('La categoría seleccionada exige fecha de documento.');
  }

  // Validar origen
  const validOrigins = ['CLIENTE', 'ASEGURADORA', 'TALLER', 'ABOGADO', 'SISTEMA'];
  if (metadata.originCode && !validOrigins.includes(metadata.originCode)) {
    errors.push('El origen del documento no es válido.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function buildDocumentUploadPayload(metadata, file) {
  return {
    file,
    fileName: file?.name || 'documento',
    categoryId: Number(metadata.categoryId) || 1,
    subcategoryCode: metadata.subcategoryCode || '',
    documentDate: metadata.documentDate || '',
    originCode: metadata.originCode || 'CLIENTE',
    observations: metadata.observations || '',
    visibleToCustomer: metadata.visibleToCustomer ?? true,
    principal: metadata.principal ?? false,
    visualOrder: Number(metadata.visualOrder) || 1,
  };
}

function canEditDocumentMetadata(document, userPermissions) {
  // Por defecto, cualquier usuario puede editar metadata
  // Esta función puede expandirse según permisos
  return userPermissions?.canEditDocuments ?? true;
}

function canReplaceDocument(document, userPermissions) {
  // Por defecto, cualquier usuario puede reemplazar documentos
  return userPermissions?.canReplaceDocuments ?? true;
}

function canDeleteDocument(document, userPermissions) {
  // Solo usuarios con permiso específico pueden eliminar
  return userPermissions?.canDeleteDocuments ?? false;
}

function formatDocumentDateForDisplay(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function buildDocumentEditorState(existingDocument) {
  return {
    categoryId: String(existingDocument?.categoryId || '1'),
    subcategoryCode: existingDocument?.subcategoryCode || '',
    documentDate: (existingDocument?.documentDate || '').slice(0, 10),
    originCode: existingDocument?.originCode || 'CLIENTE',
    observations: existingDocument?.observations || '',
    visibleToCustomer: existingDocument?.visibleToCustomer ?? true,
    principal: existingDocument?.principal ?? false,
    visualOrder: String(existingDocument?.visualOrder || '1'),
  };
}

describe('Documents - getDocumentCategoryRequiresDate', () => {
  it('should return true for categories that require date', () => {
    expect(getDocumentCategoryRequiresDate(mockDocumentsCatalogs.categories, '1')).toBe(true);
    expect(getDocumentCategoryRequiresDate(mockDocumentsCatalogs.categories, '3')).toBe(true);
  });

  it('should return false for categories that do not require date', () => {
    expect(getDocumentCategoryRequiresDate(mockDocumentsCatalogs.categories, '2')).toBe(false);
    expect(getDocumentCategoryRequiresDate(mockDocumentsCatalogs.categories, '4')).toBe(false);
    expect(getDocumentCategoryRequiresDate(mockDocumentsCatalogs.categories, '5')).toBe(false);
  });

  it('should return false for unknown category', () => {
    expect(getDocumentCategoryRequiresDate(mockDocumentsCatalogs.categories, '999')).toBe(false);
  });

  it('should handle numeric category IDs', () => {
    expect(getDocumentCategoryRequiresDate(mockDocumentsCatalogs.categories, 1)).toBe(true);
    expect(getDocumentCategoryRequiresDate(mockDocumentsCatalogs.categories, 2)).toBe(false);
  });
});

describe('Documents - validateDocumentUpload', () => {
  it('should return valid for complete metadata with non-required date category', () => {
    const metadata = {
      categoryId: '2', // Evidencia - no requiere fecha
      documentDate: '',
      originCode: 'CLIENTE',
    };
    const result = validateDocumentUpload(metadata, mockDocumentsCatalogs);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return error when category requires date but none provided', () => {
    const metadata = {
      categoryId: '1', // Presupuesto - requiere fecha
      documentDate: '',
      originCode: 'TALLER',
    };
    const result = validateDocumentUpload(metadata, mockDocumentsCatalogs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('La categoría seleccionada exige fecha de documento.');
  });

  it('should return valid when category requires date and date is provided', () => {
    const metadata = {
      categoryId: '1', // Presupuesto - requiere fecha
      documentDate: '2026-01-15',
      originCode: 'TALLER',
    };
    const result = validateDocumentUpload(metadata, mockDocumentsCatalogs);
    expect(result.isValid).toBe(true);
  });

  it('should return error when category is missing', () => {
    const metadata = {
      categoryId: '',
      documentDate: '',
      originCode: 'CLIENTE',
    };
    const result = validateDocumentUpload(metadata, mockDocumentsCatalogs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('La categoría es obligatoria.');
  });

  it('should return error for invalid origin code', () => {
    const metadata = {
      categoryId: '2',
      documentDate: '',
      originCode: 'INVALIDO',
    };
    const result = validateDocumentUpload(metadata, mockDocumentsCatalogs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('El origen del documento no es válido.');
  });

  it('should accept all valid origin codes', () => {
    const validOrigins = ['CLIENTE', 'ASEGURADORA', 'TALLER', 'ABOGADO', 'SISTEMA'];
    validOrigins.forEach((origin) => {
      const metadata = { categoryId: '2', originCode: origin };
      const result = validateDocumentUpload(metadata, mockDocumentsCatalogs);
      expect(result.errors).not.toContain('El origen del documento no es válido.');
    });
  });

  it('should return multiple errors when applicable', () => {
    const metadata = {
      categoryId: '', // Missing
      originCode: 'INVALIDO', // Invalid
    };
    const result = validateDocumentUpload(metadata, mockDocumentsCatalogs);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe('Documents - buildDocumentUploadPayload', () => {
  it('should build payload with default values', () => {
    const metadata = { categoryId: '1' };
    const file = { name: 'test.pdf' };
    const result = buildDocumentUploadPayload(metadata, file);

    expect(result.file).toBe(file);
    expect(result.fileName).toBe('test.pdf');
    expect(result.categoryId).toBe(1);
    expect(result.subcategoryCode).toBe('');
    expect(result.originCode).toBe('CLIENTE');
    expect(result.visibleToCustomer).toBe(true);
    expect(result.principal).toBe(false);
  });

  it('should use provided values over defaults', () => {
    const metadata = {
      categoryId: '3',
      subcategoryCode: 'poliza',
      documentDate: '2026-01-01',
      originCode: 'ASEGURADORA',
      observations: 'Test observation',
      visibleToCustomer: false,
      principal: true,
      visualOrder: '5',
    };
    const file = { name: 'custom.pdf' };
    const result = buildDocumentUploadPayload(metadata, file);

    expect(result.categoryId).toBe(3);
    expect(result.subcategoryCode).toBe('poliza');
    expect(result.documentDate).toBe('2026-01-01');
    expect(result.originCode).toBe('ASEGURADORA');
    expect(result.observations).toBe('Test observation');
    expect(result.visibleToCustomer).toBe(false);
    expect(result.principal).toBe(true);
    expect(result.visualOrder).toBe(5);
  });
});

describe('Documents - canEditDocumentMetadata', () => {
  it('should allow editing by default', () => {
    expect(canEditDocumentMetadata({})).toBe(true);
  });

  it('should respect canEditDocuments permission', () => {
    expect(canEditDocumentMetadata({}, { canEditDocuments: false })).toBe(false);
    expect(canEditDocumentMetadata({}, { canEditDocuments: true })).toBe(true);
  });
});

describe('Documents - canReplaceDocument', () => {
  it('should allow replacing by default', () => {
    expect(canReplaceDocument({})).toBe(true);
  });

  it('should respect canReplaceDocuments permission', () => {
    expect(canReplaceDocument({}, { canReplaceDocuments: false })).toBe(false);
    expect(canReplaceDocument({}, { canReplaceDocuments: true })).toBe(true);
  });
});

describe('Documents - canDeleteDocument', () => {
  it('should deny deletion by default', () => {
    expect(canDeleteDocument({})).toBe(false);
  });

  it('should allow deletion with explicit permission', () => {
    expect(canDeleteDocument({}, { canDeleteDocuments: true })).toBe(true);
  });
});

describe('Documents - formatDocumentDateForDisplay', () => {
  it('should return empty string for null/undefined', () => {
    expect(formatDocumentDateForDisplay(null)).toBe('');
    expect(formatDocumentDateForDisplay(undefined)).toBe('');
    expect(formatDocumentDateForDisplay('')).toBe('');
  });

  it('should format date in Argentine format', () => {
    const result = formatDocumentDateForDisplay('2026-01-15');
    // Note: Date parsing may adjust for timezone, so we just check format
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('should handle ISO date strings', () => {
    const result = formatDocumentDateForDisplay('2026-01-15T10:30:00Z');
    expect(result).toBe('15/01/2026');
  });

  it('should return error message for invalid dates', () => {
    const result = formatDocumentDateForDisplay('invalid-date');
    // JavaScript's Date parsing returns 'Invalid Date' for invalid strings
    expect(result).toContain('Invalid');
  });
});

describe('Documents - buildDocumentEditorState', () => {
  it('should initialize from existing document', () => {
    const existingDoc = {
      categoryId: 3,
      subcategoryCode: 'poliza',
      documentDate: '2026-01-15',
      originCode: 'ASEGURADORA',
      observations: 'Test obs',
      visibleToCustomer: false,
      principal: true,
      visualOrder: 5,
    };

    const state = buildDocumentEditorState(existingDoc);

    expect(state.categoryId).toBe('3');
    expect(state.subcategoryCode).toBe('poliza');
    expect(state.documentDate).toBe('2026-01-15');
    expect(state.originCode).toBe('ASEGURADORA');
    expect(state.observations).toBe('Test obs');
    expect(state.visibleToCustomer).toBe(false);
    expect(state.principal).toBe(true);
    expect(state.visualOrder).toBe('5');
  });

  it('should use defaults when no existing document', () => {
    const state = buildDocumentEditorState(null);

    expect(state.categoryId).toBe('1');
    expect(state.subcategoryCode).toBe('');
    expect(state.documentDate).toBe('');
    expect(state.originCode).toBe('CLIENTE');
    expect(state.visibleToCustomer).toBe(true);
    expect(state.principal).toBe(false);
    expect(state.visualOrder).toBe('1');
  });
});