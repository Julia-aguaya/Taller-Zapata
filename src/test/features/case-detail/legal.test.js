import { describe, it, expect } from 'vitest';
import {
  LEGAL_STATES,
  parseLegalInfo,
  parseLegalExpenses,
  parseLegalNews,
  getLegalStateLabel,
  calculateTotalLegalExpenses,
} from '../../../features/case-detail/lib/legal';

describe('Legal - States', () => {
  it('debería tener todos los estados legales definidos', () => {
    expect(LEGAL_STATES.SIN_INFO).toBe('sin_info');
    expect(LEGAL_STATES.EN_CURSO).toBe('en_curso');
    expect(LEGAL_STATES.RESUELTO).toBe('resuelto');
    expect(LEGAL_STATES.APELACION).toBe('apelacion');
  });
});

describe('Legal - parseLegalInfo', () => {
  it('debería retornar null para entrada nula', () => {
    expect(parseLegalInfo(null)).toBeNull();
    expect(parseLegalInfo(undefined)).toBeNull();
  });

  it('debería parsear datos con formato nuevo', () => {
    const data = {
      caseNumber: 'EXP-2026-001',
      court: 'Juzgado Civil N° 5',
      judge: 'Dr. Juan Pérez',
      legalState: 'en_curso',
      startDate: '2026-01-01',
      endDate: null,
    };
    const result = parseLegalInfo(data);
    expect(result.caseNumber).toBe('EXP-2026-001');
    expect(result.court).toBe('Juzgado Civil N° 5');
    expect(result.state).toBe(LEGAL_STATES.EN_CURSO);
  });

  it('debería parsear datos con formato legacy', () => {
    const data = {
      numero_expediente: 'LEG-2026-002',
      juzgado: 'Juzgado Penal N° 3',
      juez: 'Dra. María López',
      estado_legal: 'resuelto',
      fecha_inicio: '2026-01-01',
      fecha_fin: '2026-05-01',
    };
    const result = parseLegalInfo(data);
    expect(result.caseNumber).toBe('LEG-2026-002');
    expect(result.judge).toBe('Dra. María López');
    expect(result.state).toBe(LEGAL_STATES.RESUELTO);
  });
});

describe('Legal - parseLegalState', () => {
  it('debería parsear "en curso" correctamente', () => {
    const data = { estado_legal: 'en curso' };
    expect(parseLegalInfo(data).state).toBe(LEGAL_STATES.EN_CURSO);
  });

  it('debería parsear "en_proceso" correctamente', () => {
    const data = { estado_legal: 'en_proceso' };
    expect(parseLegalInfo(data).state).toBe(LEGAL_STATES.EN_CURSO);
  });

  it('debería parsear "in_progress" correctamente', () => {
    const data = { estado_legal: 'in_progress' };
    expect(parseLegalInfo(data).state).toBe(LEGAL_STATES.EN_CURSO);
  });

  it('debería parsear "resuelto" correctamente', () => {
    const data = { estado_legal: 'resuelto' };
    expect(parseLegalInfo(data).state).toBe(LEGAL_STATES.RESUELTO);
  });

  it('debería parsear "completed" correctamente', () => {
    const data = { estado_legal: 'completed' };
    expect(parseLegalInfo(data).state).toBe(LEGAL_STATES.RESUELTO);
  });

  it('debería parsear "apelacion" correctamente', () => {
    const data = { estado_legal: 'apelacion' };
    expect(parseLegalInfo(data).state).toBe(LEGAL_STATES.APELACION);
  });

  it('debería parsear "apelación" correctamente', () => {
    const data = { estado_legal: 'apelación' };
    expect(parseLegalInfo(data).state).toBe(LEGAL_STATES.APELACION);
  });

  it('debería retornar sin_info para estado desconocido', () => {
    const data = { estado_legal: 'desconocido' };
    expect(parseLegalInfo(data).state).toBe(LEGAL_STATES.SIN_INFO);
  });
});

describe('Legal - parseLegalExpenses', () => {
  it('debería retornar estructura vacía para null', () => {
    const result = parseLegalExpenses(null);
    expect(result.total).toBe(0);
    expect(result.items).toEqual([]);
  });

  it('debería parsear monto directo como número', () => {
    const result = parseLegalExpenses(5000);
    expect(result.total).toBe(5000);
  });

  it('debería parsear array de gastos', () => {
    const expenses = [
      { descripcion: 'Honorarios', monto: 3000 },
      { description: ' Tasas', amount: 1500 },
    ];
    const result = parseLegalExpenses(expenses);
    expect(result.total).toBe(4500);
    expect(result.items).toHaveLength(2);
  });

  it('debería parsear objeto con items', () => {
    const data = {
      total: 10000,
      items: [
        { descripcion: 'Notificaciones', monto: 2000 },
        { descripcion: 'Peritos', monto: 8000 },
      ],
    };
    const result = parseLegalExpenses(data);
    expect(result.total).toBe(10000);
    expect(result.items).toHaveLength(2);
  });

  it('debería incluir categoría en cada item', () => {
    const expenses = [
      { descripcion: 'Honorarios', monto: 3000, categoria: 'abogado' },
    ];
    const result = parseLegalExpenses(expenses);
    expect(result.items[0].category).toBe('abogado');
  });
});

describe('Legal - parseLegalNews', () => {
  it('debería retornar array vacío para null', () => {
    expect(parseLegalNews(null)).toEqual([]);
    expect(parseLegalNews(undefined)).toEqual([]);
  });

  it('debería retornar array vacío para no array', () => {
    expect(parseLegalNews('not an array')).toEqual([]);
    expect(parseLegalNews({})).toEqual([]);
  });

  it('debería parsear noticias correctamente', () => {
    const news = [
      {
        id: 1,
        titulo: 'Nueva resolución',
        fecha: '2026-01-15',
        resumen: 'Se emitió resolución favorable',
        fuente: 'Boletín Oficial',
      },
    ];
    const result = parseLegalNews(news);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Nueva resolución');
    expect(result[0].summary).toBe('Se emitió resolución favorable');
  });
});

describe('Legal - getLegalStateLabel', () => {
  it('debería retornar label para cada estado', () => {
    expect(getLegalStateLabel(LEGAL_STATES.SIN_INFO)).toBe('Sin Información');
    expect(getLegalStateLabel(LEGAL_STATES.EN_CURSO)).toBe('En Curso');
    expect(getLegalStateLabel(LEGAL_STATES.RESUELTO)).toBe('Resuelto');
    expect(getLegalStateLabel(LEGAL_STATES.APELACION)).toBe('En Apelación');
  });

  it('debería retornar el valor mismo para estado desconocido', () => {
    expect(getLegalStateLabel('desconocido')).toBe('desconocido');
  });
});

describe('Legal - calculateTotalLegalExpenses', () => {
  it('debería retornar 0 para null', () => {
    expect(calculateTotalLegalExpenses(null)).toBe(0);
  });

  it('debería retornar el número directo', () => {
    expect(calculateTotalLegalExpenses(5000)).toBe(5000);
  });

  it('debería retornar total de objeto', () => {
    expect(calculateTotalLegalExpenses({ total: 10000 })).toBe(10000);
  });

  it('debería calcular suma de array', () => {
    const expenses = [
      { monto: 1000 },
      { amount: 2000 },
      { monto: 3000 },
    ];
    expect(calculateTotalLegalExpenses(expenses)).toBe(6000);
  });
});