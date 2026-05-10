export const AUDIT_EVENT_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  STATUS_CHANGE: 'status_change',
  ASSIGN: 'assign',
  COMMENT: 'comment',
  DOCUMENT: 'document',
};

export function parseAuditEvents(auditData) {
  if (!auditData) return [];
  if (!Array.isArray(auditData)) return [];
  
  return auditData.map(event => ({
    id: event.id || event.evento_id,
    type: parseEventType(event.tipo || event.type),
    timestamp: parseAuditTimestamp(event.fecha || event.timestamp),
    actor: parseAuditActor(event.actor || event.usuario || event.user),
    details: event.detalles || event.details,
    entity: event.entidad || event.entity,
    entityId: event.entidad_id || event.entityId,
    changes: event.cambios || event.changes,
  }));
}

function parseEventType(type) {
  if (!type) return AUDIT_EVENT_TYPES.UPDATE;
  
  const normalized = String(type).toLowerCase().trim();
  
  if (normalized.includes('creat') || normalized === 'alta') {
    return AUDIT_EVENT_TYPES.CREATE;
  }
  if (normalized.includes('delete') || normalized === 'baja') {
    return AUDIT_EVENT_TYPES.DELETE;
  }
  if (normalized.includes('status') || normalized.includes('estado')) {
    return AUDIT_EVENT_TYPES.STATUS_CHANGE;
  }
  if (normalized.includes('assign') || normalized.includes('asign')) {
    return AUDIT_EVENT_TYPES.ASSIGN;
  }
  if (normalized.includes('comment') || normalized.includes('comentario')) {
    return AUDIT_EVENT_TYPES.COMMENT;
  }
  if (normalized.includes('document') || normalized.includes('documento')) {
    return AUDIT_EVENT_TYPES.DOCUMENT;
  }
  
  return AUDIT_EVENT_TYPES.UPDATE;
}

export function parseAuditTimestamp(timestamp) {
  if (!timestamp) return null;
  
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  const parsed = new Date(timestamp);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function formatAuditTimestamp(timestamp) {
  const parsed = parseAuditTimestamp(timestamp);
  if (!parsed) return '';
  
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function parseAuditActor(actor) {
  if (!actor) return { id: null, name: 'Sistema' };
  
  if (typeof actor === 'string') {
    return { id: null, name: actor };
  }
  
  return {
    id: actor.id || actor.usuario_id || null,
    name: actor.nombre || actor.name || actor.username || actor.usuario || 'Usuario',
  };
}

export function getAuditActorName(event) {
  const actor = parseAuditActor(event.actor);
  return actor.name;
}

export function getAuditEventLabel(type) {
  const labels = {
    [AUDIT_EVENT_TYPES.CREATE]: 'Creación',
    [AUDIT_EVENT_TYPES.UPDATE]: 'Modificación',
    [AUDIT_EVENT_TYPES.DELETE]: 'Eliminación',
    [AUDIT_EVENT_TYPES.STATUS_CHANGE]: 'Cambio de Estado',
    [AUDIT_EVENT_TYPES.ASSIGN]: 'Asignación',
    [AUDIT_EVENT_TYPES.COMMENT]: 'Comentario',
    [AUDIT_EVENT_TYPES.DOCUMENT]: 'Documento',
  };
  return labels[type] || type;
}

export function filterAuditEvents(events, filters) {
  if (!events) return [];
  if (!filters) return events;
  
  let filtered = [...events];
  
  if (filters.type) {
    filtered = filtered.filter(e => e.type === filters.type);
  }
  
  if (filters.actorId) {
    filtered = filtered.filter(e => e.actor?.id === filters.actorId);
  }
  
  if (filters.startDate) {
    const start = parseAuditTimestamp(filters.startDate);
    filtered = filtered.filter(e => {
      const eventTime = parseAuditTimestamp(e.timestamp);
      return eventTime && eventTime >= start;
    });
  }
  
  if (filters.endDate) {
    const end = parseAuditTimestamp(filters.endDate);
    filtered = filtered.filter(e => {
      const eventTime = parseAuditTimestamp(e.timestamp);
      return eventTime && eventTime <= end;
    });
  }
  
  return filtered;
}