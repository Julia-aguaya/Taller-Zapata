import { describe, it, expect } from 'vitest';
import {
  AUDIT_EVENT_TYPES,
  parseAuditEvents,
  parseAuditTimestamp,
  formatAuditTimestamp,
  getAuditActorName,
  getAuditEventLabel,
  filterAuditEvents,
} from '../../../features/case-detail/lib/audit';

describe('Audit - Event Types', () => {
  it('debería tener todos los tipos de evento definidos', () => {
    expect(AUDIT_EVENT_TYPES.CREATE).toBe('create');
    expect(AUDIT_EVENT_TYPES.UPDATE).toBe('update');
    expect(AUDIT_EVENT_TYPES.DELETE).toBe('delete');
    expect(AUDIT_EVENT_TYPES.STATUS_CHANGE).toBe('status_change');
    expect(AUDIT_EVENT_TYPES.ASSIGN).toBe('assign');
    expect(AUDIT_EVENT_TYPES.COMMENT).toBe('comment');
    expect(AUDIT_EVENT_TYPES.DOCUMENT).toBe('document');
  });
});

describe('Audit - parseAuditEvents', () => {
  it('debería retornar array vacío para null', () => {
    expect(parseAuditEvents(null)).toEqual([]);
    expect(parseAuditEvents(undefined)).toEqual([]);
  });

  it('debería retornar array vacío para no array', () => {
    expect(parseAuditEvents('not an array')).toEqual([]);
  });

  it('debería parsear eventos correctamente', () => {
    const events = [
      {
        id: 1,
        tipo: 'update',
        fecha: '2026-01-15T10:30:00Z',
        actor: { id: 1, nombre: 'Usuario 1' },
        detalles: 'Actualización de estado',
      },
    ];
    const result = parseAuditEvents(events);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(AUDIT_EVENT_TYPES.UPDATE);
    expect(result[0].actor.name).toBe('Usuario 1');
  });
});

describe('Audit - parseEventType', () => {
  it('debería parsear "creat" como create', () => {
    const events = [{ tipo: 'create' }];
    expect(parseAuditEvents(events)[0].type).toBe(AUDIT_EVENT_TYPES.CREATE);
  });

  it('debería parsear "alta" como create', () => {
    const events = [{ tipo: 'alta' }];
    expect(parseAuditEvents(events)[0].type).toBe(AUDIT_EVENT_TYPES.CREATE);
  });

  it('debería parsear "delete" como delete', () => {
    const events = [{ tipo: 'delete' }];
    expect(parseAuditEvents(events)[0].type).toBe(AUDIT_EVENT_TYPES.DELETE);
  });

  it('debería parsear "baja" como delete', () => {
    const events = [{ tipo: 'baja' }];
    expect(parseAuditEvents(events)[0].type).toBe(AUDIT_EVENT_TYPES.DELETE);
  });

  it('debería parsear "status" como status_change', () => {
    const events = [{ tipo: 'status_change' }];
    expect(parseAuditEvents(events)[0].type).toBe(AUDIT_EVENT_TYPES.STATUS_CHANGE);
  });

  it('debería parsear "estado" como status_change', () => {
    const events = [{ tipo: 'cambio de estado' }];
    expect(parseAuditEvents(events)[0].type).toBe(AUDIT_EVENT_TYPES.STATUS_CHANGE);
  });

  it('debería parsear "assign" como assign', () => {
    const events = [{ tipo: 'assign' }];
    expect(parseAuditEvents(events)[0].type).toBe(AUDIT_EVENT_TYPES.ASSIGN);
  });

  it('debería parsear "asign" como assign', () => {
    const events = [{ tipo: 'asignacion' }];
    expect(parseAuditEvents(events)[0].type).toBe(AUDIT_EVENT_TYPES.ASSIGN);
  });

  it('debería parsear "comment" como comment', () => {
    const events = [{ tipo: 'comment' }];
    expect(parseAuditEvents(events)[0].type).toBe(AUDIT_EVENT_TYPES.COMMENT);
  });

  it('debería parsear "comentario" como comment', () => {
    const events = [{ tipo: 'comentario' }];
    expect(parseAuditEvents(events)[0].type).toBe(AUDIT_EVENT_TYPES.COMMENT);
  });

  it('debería parsear "document" como document', () => {
    const events = [{ tipo: 'document' }];
    expect(parseAuditEvents(events)[0].type).toBe(AUDIT_EVENT_TYPES.DOCUMENT);
  });

  it('debería retornar update para tipo desconocido', () => {
    const events = [{ tipo: 'unknown' }];
    expect(parseAuditEvents(events)[0].type).toBe(AUDIT_EVENT_TYPES.UPDATE);
  });
});

describe('Audit - parseAuditTimestamp', () => {
  it('debería retornar null para null', () => {
    expect(parseAuditTimestamp(null)).toBeNull();
  });

  it('debería parsear Date objects', () => {
    const date = new Date('2026-01-15');
    const result = parseAuditTimestamp(date);
    expect(result).toBeInstanceOf(Date);
  });

  it('debería parsear números como timestamps', () => {
    const timestamp = 1705330800000;
    const result = parseAuditTimestamp(timestamp);
    expect(result).toBeInstanceOf(Date);
  });

  it('debería parsear strings de fecha', () => {
    const result = parseAuditTimestamp('2026-01-15T10:30:00Z');
    expect(result).toBeInstanceOf(Date);
  });

  it('debería retornar null para strings inválidos', () => {
    expect(parseAuditTimestamp('invalid date')).toBeNull();
  });
});

describe('Audit - formatAuditTimestamp', () => {
  it('debería formatear timestamps correctamente', () => {
    const formatted = formatAuditTimestamp('2026-01-15T10:30:00Z');
    expect(formatted).toContain('15');
    expect(formatted).toContain('ene');
  });

  it('debería retornar string vacío para null', () => {
    expect(formatAuditTimestamp(null)).toBe('');
  });
});

describe('Audit - parseAuditActor', () => {
  it('debería extraer nombre del actor', () => {
    const events = [{ actor: { nombre: 'Juan Pérez' } }];
    expect(getAuditActorName(events[0])).toBe('Juan Pérez');
  });

  it('debería retornar "Sistema" para actor nulo', () => {
    const events = [{ actor: null }];
    expect(getAuditActorName(events[0])).toBe('Sistema');
  });

  it('debería parsear actor como string', () => {
    const events = [{ actor: 'Usuario Anónimo' }];
    expect(getAuditActorName(events[0])).toBe('Usuario Anónimo');
  });
});

describe('Audit - getAuditEventLabel', () => {
  it('debería retornar label para cada tipo', () => {
    expect(getAuditEventLabel(AUDIT_EVENT_TYPES.CREATE)).toBe('Creación');
    expect(getAuditEventLabel(AUDIT_EVENT_TYPES.UPDATE)).toBe('Modificación');
    expect(getAuditEventLabel(AUDIT_EVENT_TYPES.DELETE)).toBe('Eliminación');
    expect(getAuditEventLabel(AUDIT_EVENT_TYPES.STATUS_CHANGE)).toBe('Cambio de Estado');
    expect(getAuditEventLabel(AUDIT_EVENT_TYPES.ASSIGN)).toBe('Asignación');
    expect(getAuditEventLabel(AUDIT_EVENT_TYPES.COMMENT)).toBe('Comentario');
    expect(getAuditEventLabel(AUDIT_EVENT_TYPES.DOCUMENT)).toBe('Documento');
  });

  it('debería retornar el valor mismo para tipo desconocido', () => {
    expect(getAuditEventLabel('desconocido')).toBe('desconocido');
  });
});

describe('Audit - filterAuditEvents', () => {
  const events = [
    { id: 1, type: 'create', actor: { id: 1 }, timestamp: '2026-01-10' },
    { id: 2, type: 'update', actor: { id: 2 }, timestamp: '2026-01-15' },
    { id: 3, type: 'delete', actor: { id: 1 }, timestamp: '2026-01-20' },
  ];

  it('debería retornar todos los eventos sin filtros', () => {
    const result = filterAuditEvents(events, null);
    expect(result).toHaveLength(3);
  });

  it('debería filtrar por tipo', () => {
    const result = filterAuditEvents(events, { type: 'create' });
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('create');
  });

  it('debería filtrar por actorId', () => {
    const result = filterAuditEvents(events, { actorId: 1 });
    expect(result).toHaveLength(2);
  });

  it('debería filtrar por rango de fechas', () => {
    const result = filterAuditEvents(events, {
      startDate: '2026-01-12',
      endDate: '2026-01-18',
    });
    expect(result).toHaveLength(1);
  });

  it('debería combinar múltiples filtros', () => {
    const result = filterAuditEvents(events, {
      type: 'update',
      actorId: 2,
    });
    expect(result).toHaveLength(1);
  });
});