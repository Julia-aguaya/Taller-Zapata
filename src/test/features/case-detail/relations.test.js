import { describe, it, expect } from 'vitest';
import {
  RELATION_TYPES,
  parseCaseRelations,
  getRelationTypeLabel,
  findRelatedCase,
  getRelatedCasesByType,
  getRelatedCasesCount,
  isValidRelationType,
  sortRelationsByDate,
} from '../../../features/case-detail/lib/relations';

describe('Relations - Types', () => {
  it('debería tener todos los tipos de relación definidos', () => {
    expect(RELATION_TYPES.DERIVADO).toBe('derivado');
    expect(RELATION_TYPES.RELACIONADO).toBe('relacionado');
    expect(RELATION_TYPES.SUBCASO).toBe('subcaso');
  });
});

describe('Relations - parseCaseRelations', () => {
  it('debería retornar array vacío para null', () => {
    expect(parseCaseRelations(null)).toEqual([]);
    expect(parseCaseRelations(undefined)).toEqual([]);
  });

  it('debería retornar array vacío para no array', () => {
    expect(parseCaseRelations('not an array')).toEqual([]);
  });

  it('debería parsear relaciones correctamente', () => {
    const relations = [
      {
        id: 1,
        caso_id: 'ZP-2026-0001',
        numero_caso: 'ZP-2026-0001',
        tipo_relacion: 'relacionado',
        fecha_relacion: '2026-01-15',
        descripcion: 'Caso relacionado por mismo cliente',
      },
    ];
    const result = parseCaseRelations(relations);
    expect(result).toHaveLength(1);
    expect(result[0].caseNumber).toBe('ZP-2026-0001');
    expect(result[0].relationType).toBe(RELATION_TYPES.RELACIONADO);
  });

  it('debería parsear con formato nuevo', () => {
    const relations = [
      {
        id: 1,
        caseId: 'ZP-2026-0002',
        caseNumber: 'ZP-2026-0002',
        relationType: 'derivado',
        relatedDate: '2026-01-20',
      },
    ];
    const result = parseCaseRelations(relations);
    expect(result[0].relationType).toBe(RELATION_TYPES.DERIVADO);
  });
});

describe('Relations - parseRelationType', () => {
  it('debería parsear "derivado" correctamente', () => {
    const relations = [{ tipo_relacion: 'derivado' }];
    expect(parseCaseRelations(relations)[0].relationType).toBe(RELATION_TYPES.DERIVADO);
  });

  it('debería parsear "referred" como derivado', () => {
    const relations = [{ tipo_relacion: 'referred' }];
    expect(parseCaseRelations(relations)[0].relationType).toBe(RELATION_TYPES.DERIVADO);
  });

  it('debería parsear "subcaso" correctamente', () => {
    const relations = [{ tipo_relacion: 'subcaso' }];
    expect(parseCaseRelations(relations)[0].relationType).toBe(RELATION_TYPES.SUBCASO);
  });

  it('debería parsear "subcase" como subcaso', () => {
    const relations = [{ tipo_relacion: 'subcase' }];
    expect(parseCaseRelations(relations)[0].relationType).toBe(RELATION_TYPES.SUBCASO);
  });

  it('debería parsear "child" como subcaso', () => {
    const relations = [{ tipo_relacion: 'child' }];
    expect(parseCaseRelations(relations)[0].relationType).toBe(RELATION_TYPES.SUBCASO);
  });

  it('debería retornar relacionado por defecto', () => {
    const relations = [{ tipo_relacion: 'desconocido' }];
    expect(parseCaseRelations(relations)[0].relationType).toBe(RELATION_TYPES.RELACIONADO);
  });
});

describe('Relations - getRelationTypeLabel', () => {
  it('debería retornar label para cada tipo', () => {
    expect(getRelationTypeLabel(RELATION_TYPES.DERIVADO)).toBe('Derivado');
    expect(getRelationTypeLabel(RELATION_TYPES.RELACIONADO)).toBe('Relacionado');
    expect(getRelationTypeLabel(RELATION_TYPES.SUBCASO)).toBe('Subcaso');
  });

  it('debería retornar el valor mismo para tipo desconocido', () => {
    expect(getRelationTypeLabel('desconocido')).toBe('desconocido');
  });
});

describe('Relations - findRelatedCase', () => {
  const relations = [
    { id: 1, caseId: 'ZP-2026-0001' },
    { id: 2, caseId: 'ZP-2026-0002' },
    { id: 3, caseId: 'ZP-2026-0003' },
  ];

  it('debería encontrar caso por caseId', () => {
    const result = findRelatedCase(relations, 'ZP-2026-0002');
    expect(result).not.toBeNull();
    expect(result.id).toBe(2);
  });

  it('debería encontrar caso por id', () => {
    const result = findRelatedCase(relations, 3);
    expect(result).not.toBeNull();
    expect(result.caseId).toBe('ZP-2026-0003');
  });

  it('debería retornar null para caso no encontrado', () => {
    const result = findRelatedCase(relations, 'ZP-2026-9999');
    expect(result).toBeNull();
  });

  it('debería retornar null para array vacío', () => {
    const result = findRelatedCase([], 'ZP-2026-0001');
    expect(result).toBeNull();
  });

  it('debería retornar null para búsqueda vacía', () => {
    const result = findRelatedCase(relations, '');
    expect(result).toBeNull();
  });
});

describe('Relations - getRelatedCasesByType', () => {
  const relations = [
    { id: 1, relationType: 'derivado' },
    { id: 2, relationType: 'relacionado' },
    { id: 3, relationType: 'derivado' },
    { id: 4, relationType: 'subcaso' },
  ];

  it('debería filtrar casos derivados', () => {
    const result = getRelatedCasesByType(relations, RELATION_TYPES.DERIVADO);
    expect(result).toHaveLength(2);
  });

  it('debería filtrar casos relacionados', () => {
    const result = getRelatedCasesByType(relations, RELATION_TYPES.RELACIONADO);
    expect(result).toHaveLength(1);
  });

  it('debería filtrar subcasos', () => {
    const result = getRelatedCasesByType(relations, RELATION_TYPES.SUBCASO);
    expect(result).toHaveLength(1);
  });

  it('debería retornar array vacío para null', () => {
    const result = getRelatedCasesByType(null, RELATION_TYPES.DERIVADO);
    expect(result).toEqual([]);
  });
});

describe('Relations - getRelatedCasesCount', () => {
  it('debería retornar totales para null', () => {
    const result = getRelatedCasesCount(null);
    expect(result.total).toBe(0);
  });

  it('debería contar casos correctamente', () => {
    const relations = [
      { relationType: 'derivado' },
      { relationType: 'derivado' },
      { relationType: 'relacionado' },
      { relationType: 'subcaso' },
    ];
    const result = getRelatedCasesCount(relations);
    expect(result.total).toBe(4);
    expect(result.derivado).toBe(2);
    expect(result.relacionado).toBe(1);
    expect(result.subcaso).toBe(1);
  });
});

describe('Relations - isValidRelationType', () => {
  it('debería retornar true para tipos válidos', () => {
    expect(isValidRelationType('derivado')).toBe(true);
    expect(isValidRelationType('relacionado')).toBe(true);
    expect(isValidRelationType('subcaso')).toBe(true);
  });

  it('debería retornar false para tipos inválidos', () => {
    expect(isValidRelationType('desconocido')).toBe(false);
    expect(isValidRelationType('')).toBe(false);
  });
});

describe('Relations - sortRelationsByDate', () => {
  it('debería retornar array vacío para null', () => {
    expect(sortRelationsByDate(null)).toEqual([]);
  });

  it('debería ordenar por fecha descendente por defecto', () => {
    const relations = [
      { relatedDate: '2026-01-10' },
      { relatedDate: '2026-01-20' },
      { relatedDate: '2026-01-15' },
    ];
    const result = sortRelationsByDate(relations);
    expect(result[0].relatedDate).toBe('2026-01-20');
    expect(result[2].relatedDate).toBe('2026-01-10');
  });

  it('debería ordenar ascendente cuando se indica', () => {
    const relations = [
      { relatedDate: '2026-01-10' },
      { relatedDate: '2026-01-20' },
      { relatedDate: '2026-01-15' },
    ];
    const result = sortRelationsByDate(relations, true);
    expect(result[0].relatedDate).toBe('2026-01-10');
    expect(result[2].relatedDate).toBe('2026-01-20');
  });
});