/**
 * Tests de filtros de casos
 * Estos tests validan la lógica de filtrado del listado de carpetas.
 */

import { describe, it, expect } from 'vitest';

// Datos de prueba
const mockCases = [
  {
    id: 'case-001',
    folderCode: 'ZP-2026-0001',
    currentCaseStateCode: 'en_tramite',
    caseType: 'Particular',
    branch: 'Z',
    openAt: '2026-01-15T10:00:00Z',
    dueAt: '2026-02-15T10:00:00Z',
    vehicle: { plate: 'ABC123', brand: 'Chevrolet', model: 'Cruze' },
    client: { firstName: 'Juan', lastName: 'Perez', document: '20123456789' },
    priority: 'media',
    responsibleUserId: 1,
    pendingItemsCount: 2,
    nextSuggestedTask: 'Confirmar turno con cliente',
  },
  {
    id: 'case-002',
    folderCode: 'ZP-2026-0002',
    currentCaseStateCode: 'esperando_aprobacion',
    caseType: 'Todo Riesgo',
    branch: 'Z',
    openAt: '2026-02-01T14:30:00Z',
    dueAt: '2026-03-01T14:30:00Z',
    vehicle: { plate: 'XYZ987', brand: 'Toyota', model: 'Corolla' },
    client: { firstName: 'Maria', lastName: 'Gonzalez', email: 'maria@example.com' },
    priority: 'alta',
    responsibleUserId: 2,
    pendingItemsCount: 5,
    nextSuggestedTask: 'Esperar aprobación de presupuesto',
  },
  {
    id: 'case-003',
    folderCode: 'CE-2026-0001',
    currentCaseStateCode: 'cerrado',
    caseType: 'Terceros',
    branch: 'C',
    openAt: '2025-12-10T09:00:00Z',
    dueAt: null,
    vehicle: { plate: 'DEF456', brand: 'Ford', model: 'Focus' },
    client: { firstName: 'Carlos', lastName: 'Lopez' },
    priority: 'baja',
    responsibleUserId: 1,
    pendingItemsCount: 0,
    nextSuggestedTask: null,
  },
];

// Funciones de filtro extraídas de App.jsx
// Cuando se extraigan a un módulo propio, estos tests se moverán allí.

function getCaseSearchHaystack(item) {
  const parts = [
    item.folderCode,
    item.currentCaseStateCode,
    item.caseType,
    item.branch,
    item.client?.firstName,
    item.client?.lastName,
    item.client?.document,
    item.client?.email,
    item.vehicle?.plate,
    item.vehicle?.brand,
    item.vehicle?.model,
  ];
  return parts.filter(Boolean).join(' ').toLowerCase();
}

function getBackendBranchLabel(item) {
  return item.branch === 'Z' ? 'Zapata' : item.branch === 'C' ? 'Centro' : item.branch || '';
}

function filterCases(items, searchTerm, selectedCaseState, selectedBranch) {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  return items.filter((item) => {
    // Filtro de búsqueda por texto
    const matchesSearch =
      !normalizedSearchTerm ||
      getCaseSearchHaystack(item).includes(normalizedSearchTerm);

    // Filtro por estado
    const caseState = formatBackendState(item.currentCaseStateCode, 'Sin dato');
    const matchesState = selectedCaseState === 'all' || caseState === selectedCaseState;

    // Filtro por sucursal
    const branch = getBackendBranchLabel(item);
    const matchesBranch = selectedBranch === 'all' || branch === selectedBranch;

    return matchesSearch && matchesState && matchesBranch;
  });
}

function formatBackendState(code, fallback = 'Sin dato') {
  if (!code) {
    return fallback;
  }

  return String(code)
    .split(/[._-]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(' ');
}

function calculateCasesMetrics(items) {
  const total = items.length;
  const openCases = items.filter(
    (c) => c.currentCaseStateCode !== 'cerrado' && c.currentCaseStateCode !== 'cancelado'
  ).length;
  const pendingCount = items.reduce((sum, c) => sum + (c.pendingItemsCount || 0), 0);
  const highPriority = items.filter((c) => c.priority === 'alta').length;

  return { total, openCases, pendingCount, highPriority };
}

describe('Cases - getCaseSearchHaystack', () => {
  it('should include folder code in search haystack', () => {
    const haystack = getCaseSearchHaystack(mockCases[0]);
    expect(haystack).toContain('zp-2026-0001');
  });

  it('should include client name in search haystack', () => {
    const haystack = getCaseSearchHaystack(mockCases[0]);
    expect(haystack).toContain('juan');
    expect(haystack).toContain('perez');
  });

  it('should include vehicle plate in search haystack', () => {
    const haystack = getCaseSearchHaystack(mockCases[0]);
    expect(haystack).toContain('abc123');
  });

  it('should include vehicle brand in search haystack', () => {
    const haystack = getCaseSearchHaystack(mockCases[0]);
    expect(haystack).toContain('chevrolet');
  });

  it('should handle missing client data', () => {
    const item = { id: '1', folderCode: 'TEST-001' };
    const haystack = getCaseSearchHaystack(item);
    expect(haystack).toContain('test-001');
  });

  it('should handle missing vehicle data', () => {
    const item = { id: '1', folderCode: 'TEST-001', client: { firstName: 'Test' } };
    const haystack = getCaseSearchHaystack(item);
    expect(haystack).toContain('test');
    expect(haystack).not.toContain('chevrolet');
  });
});

describe('Cases - getBackendBranchLabel', () => {
  it('should return "Zapata" for branch Z', () => {
    expect(getBackendBranchLabel({ branch: 'Z' })).toBe('Zapata');
  });

  it('should return "Centro" for branch C', () => {
    expect(getBackendBranchLabel({ branch: 'C' })).toBe('Centro');
  });

  it('should return original value for other branches', () => {
    expect(getBackendBranchLabel({ branch: 'X' })).toBe('X');
  });

  it('should return empty string for undefined branch', () => {
    expect(getBackendBranchLabel({})).toBe('');
    expect(getBackendBranchLabel({ branch: undefined })).toBe('');
  });
});

describe('Cases - filterCases', () => {
  it('should return all cases when no filters applied', () => {
    const result = filterCases(mockCases, '', 'all', 'all');
    expect(result).toHaveLength(3);
  });

  it('should filter by search term - folder code', () => {
    const result = filterCases(mockCases, 'ZP-2026-0001', 'all', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('case-001');
  });

  it('should filter by search term - client name', () => {
    const result = filterCases(mockCases, 'Juan', 'all', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('case-001');
  });

  it('should filter by search term - partial client name', () => {
    const result = filterCases(mockCases, 'Mar', 'all', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('case-002');
  });

  it('should filter by search term - vehicle plate', () => {
    const result = filterCases(mockCases, 'ABC123', 'all', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('case-001');
  });

  it('should filter by state - En Tramite', () => {
    const result = filterCases(mockCases, '', 'En Tramite', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('case-001');
  });

  it('should filter by state - Cerrado', () => {
    const result = filterCases(mockCases, '', 'Cerrado', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('case-003');
  });

  it('should filter by branch - Zapata', () => {
    const result = filterCases(mockCases, '', 'all', 'Zapata');
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toContain('case-001');
    expect(result.map((c) => c.id)).toContain('case-002');
  });

  it('should filter by branch - Centro', () => {
    const result = filterCases(mockCases, '', 'all', 'Centro');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('case-003');
  });

  it('should combine search and state filters', () => {
    const result = filterCases(mockCases, 'ZP', 'En Tramite', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('case-001');
  });

  it('should combine all filters', () => {
    const result = filterCases(mockCases, 'ZP', 'En Tramite', 'Zapata');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('case-001');
  });

  it('should return empty when no matches', () => {
    const result = filterCases(mockCases, 'NOEXISTE', 'all', 'all');
    expect(result).toHaveLength(0);
  });

  it('should be case insensitive', () => {
    const result = filterCases(mockCases, 'JUAN', 'all', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('case-001');
  });
});

describe('Cases - calculateCasesMetrics', () => {
  it('should calculate total count', () => {
    const metrics = calculateCasesMetrics(mockCases);
    expect(metrics.total).toBe(3);
  });

  it('should count open cases (not closed or canceled)', () => {
    const metrics = calculateCasesMetrics(mockCases);
    expect(metrics.openCases).toBe(2); // case-001 and case-002
  });

  it('should sum pending items across all cases', () => {
    const metrics = calculateCasesMetrics(mockCases);
    expect(metrics.pendingCount).toBe(7); // 2 + 5 + 0
  });

  it('should count high priority cases', () => {
    const metrics = calculateCasesMetrics(mockCases);
    expect(metrics.highPriority).toBe(1); // case-002
  });

  it('should handle empty cases array', () => {
    const metrics = calculateCasesMetrics([]);
    expect(metrics.total).toBe(0);
    expect(metrics.openCases).toBe(0);
    expect(metrics.pendingCount).toBe(0);
    expect(metrics.highPriority).toBe(0);
  });

  it('should handle cases with missing pendingItemsCount', () => {
    const metrics = calculateCasesMetrics([{ id: '1' }]);
    expect(metrics.pendingCount).toBe(0);
  });
});