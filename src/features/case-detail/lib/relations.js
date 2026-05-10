export const RELATION_TYPES = {
  DERIVADO: 'derivado',
  RELACIONADO: 'relacionado',
  SUBCASO: 'subcaso',
};

export function parseCaseRelations(relationsData) {
  if (!relationsData) return [];
  if (!Array.isArray(relationsData)) return [];
  
  return relationsData.map(relation => ({
    id: relation.id || relation.relacion_id,
    caseId: relation.caso_id || relation.caseId,
    caseNumber: relation.numero_caso || relation.caseNumber,
    relationType: parseRelationType(relation.tipo_relacion || relation.relationType),
    relatedDate: relation.fecha_relacion || relation.relatedDate,
    description: relation.descripcion || relation.description,
    status: relation.estado || relation.status,
  }));
}

function parseRelationType(type) {
  if (!type) return RELATION_TYPES.RELACIONADO;
  
  const normalized = String(type).toLowerCase().trim();
  
  if (normalized.includes('derivado') || normalized === 'referred') {
    return RELATION_TYPES.DERIVADO;
  }
  if (normalized.includes('subcaso') || normalized === 'subcase' || normalized === 'child') {
    return RELATION_TYPES.SUBCASO;
  }
  
  return RELATION_TYPES.RELACIONADO;
}

export function getRelationTypeLabel(type) {
  const labels = {
    [RELATION_TYPES.DERIVADO]: 'Derivado',
    [RELATION_TYPES.RELACIONADO]: 'Relacionado',
    [RELATION_TYPES.SUBCASO]: 'Subcaso',
  };
  return labels[type] || type;
}

export function findRelatedCase(relations, caseId) {
  if (!Array.isArray(relations) || !caseId) return null;
  
  const found = relations.find(relation => 
    relation.caseId === caseId || relation.id === caseId
  );
  return found ?? null;
}

export function getRelatedCasesByType(relations, type) {
  if (!Array.isArray(relations)) return [];
  
  return relations.filter(relation => relation.relationType === type);
}

export function getRelatedCasesCount(relations) {
  if (!Array.isArray(relations)) return { total: 0 };
  
  return {
    total: relations.length,
    derivado: relations.filter(r => r.relationType === RELATION_TYPES.DERIVADO).length,
    relacionado: relations.filter(r => r.relationType === RELATION_TYPES.RELACIONADO).length,
    subcaso: relations.filter(r => r.relationType === RELATION_TYPES.SUBCASO).length,
  };
}

export function isValidRelationType(type) {
  return Object.values(RELATION_TYPES).includes(type);
}

export function sortRelationsByDate(relations, ascending = false) {
  if (!Array.isArray(relations)) return [];
  
  const sorted = [...relations].sort((a, b) => {
    const dateA = new Date(a.relatedDate || a.fecha_relacion || 0);
    const dateB = new Date(b.relatedDate || b.fecha_relacion || 0);
    return dateA.getTime() - dateB.getTime();
  });
  
  return ascending ? sorted : sorted.reverse();
}