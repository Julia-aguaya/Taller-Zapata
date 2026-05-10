import { describe, it, expect } from 'vitest';
import {
  MOVEMENT_TYPES,
  parseFinanceSummary,
  parseFinancialMovements,
  parseReceipts,
  parseVehicleIntakes,
  parseVehicleOutcomes,
  calculateFinanceTotals,
  formatCurrency,
  getMovementTypeLabel,
} from '../../../features/case-detail/lib/finance';

describe('Finance - Movement Types', () => {
  it('debería tener todos los tipos de movimiento definidos', () => {
    expect(MOVEMENT_TYPES.INGRESO).toBe('ingreso');
    expect(MOVEMENT_TYPES.EGRESO).toBe('egreso');
    expect(MOVEMENT_TYPES.AJUSTE).toBe('ajuste');
  });
});

describe('Finance - parseFinanceSummary', () => {
  it('debería retornar null para entrada nula', () => {
    expect(parseFinanceSummary(null)).toBeNull();
    expect(parseFinanceSummary(undefined)).toBeNull();
  });

  it('debería parsear datos con formato nuevo', () => {
    const data = {
      totalIngresos: 100000,
      totalEgresos: 50000,
      balance: 50000,
      retenciones: 10000,
      pendingAmount: 20000,
      approvedAmount: 30000,
      lastUpdate: '2026-01-15',
    };
    const result = parseFinanceSummary(data);
    expect(result.totalIngresos).toBe(100000);
    expect(result.balance).toBe(50000);
    expect(result.retenciones).toBe(10000);
  });

  it('debería parsear datos con formato legacy', () => {
    const data = {
      total_ingresos: 80000,
      total_egresos: 30000,
      saldo: 50000,
      retenciones: 5000,
      monto_pendiente: 15000,
      monto_aprobado: 35000,
    };
    const result = parseFinanceSummary(data);
    expect(result.totalIngresos).toBe(80000);
    expect(result.balance).toBe(50000);
  });

  it('debería parsear montos con formato string', () => {
    const data = { totalIngresos: '50000.50' };
    const result = parseFinanceSummary(data);
    expect(result.totalIngresos).toBe(50000.5);
  });

  it('debería manejar valores inválidos como 0', () => {
    const data = { totalIngresos: 'invalid', balance: null };
    const result = parseFinanceSummary(data);
    expect(result.totalIngresos).toBe(0);
    expect(result.balance).toBe(0);
  });
});

describe('Finance - parseFinancialMovements', () => {
  it('debería retornar array vacío para null', () => {
    expect(parseFinancialMovements(null)).toEqual([]);
    expect(parseFinancialMovements(undefined)).toEqual([]);
  });

  it('debería retornar array vacío para no array', () => {
    expect(parseFinancialMovements('not an array')).toEqual([]);
  });

  it('debería parsear movimientos correctamente', () => {
    const movements = [
      {
        id: 1,
        tipo: 'ingreso',
        monto: 10000,
        fecha: '2026-01-10',
        descripcion: 'Pago cliente',
      },
    ];
    const result = parseFinancialMovements(movements);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(MOVEMENT_TYPES.INGRESO);
    expect(result[0].amount).toBe(10000);
  });

  it('debería parsear "credit" como ingreso', () => {
    const movements = [{ tipo: 'credit', monto: 5000 }];
    const result = parseFinancialMovements(movements);
    expect(result[0].type).toBe(MOVEMENT_TYPES.INGRESO);
  });

  it('debería parsear "in" como ingreso', () => {
    const movements = [{ tipo: 'in', monto: 5000 }];
    const result = parseFinancialMovements(movements);
    expect(result[0].type).toBe(MOVEMENT_TYPES.INGRESO);
  });

  it('debería parsear "debit" como egreso', () => {
    const movements = [{ tipo: 'debit', monto: 3000 }];
    const result = parseFinancialMovements(movements);
    expect(result[0].type).toBe(MOVEMENT_TYPES.EGRESO);
  });

  it('debería parsear "out" como egreso', () => {
    const movements = [{ tipo: 'out', monto: 3000 }];
    const result = parseFinancialMovements(movements);
    expect(result[0].type).toBe(MOVEMENT_TYPES.EGRESO);
  });
});

describe('Finance - parseReceipts', () => {
  it('debería retornar array vacío para null', () => {
    expect(parseReceipts(null)).toEqual([]);
  });

  it('debería parsear recibos correctamente', () => {
    const receipts = [
      {
        id: 1,
        numero: 'REC-001',
        fecha: '2026-01-15',
        monto: 25000,
        tipo: 'factura',
        estado: 'pagado',
        concepto: 'Servicios profesionales',
      },
    ];
    const result = parseReceipts(receipts);
    expect(result).toHaveLength(1);
    expect(result[0].number).toBe('REC-001');
    expect(result[0].amount).toBe(25000);
    expect(result[0].concept).toBe('Servicios profesionales');
  });
});

describe('Finance - parseVehicleIntakes', () => {
  it('debería retornar array vacío para null', () => {
    expect(parseVehicleIntakes(null)).toEqual([]);
  });

  it('debería parsear entradas de vehículo correctamente', () => {
    const intakes = [
      {
        id: 1,
        fecha: '2026-01-10',
        patente: 'ABC-123',
        descripcion_vehiculo: 'Toyota Corolla',
        tipo_entrada: 'embarque',
        estado: 'recibido',
      },
    ];
    const result = parseVehicleIntakes(intakes);
    expect(result).toHaveLength(1);
    expect(result[0].vehiclePlate).toBe('ABC-123');
    expect(result[0].vehicleDescription).toBe('Toyota Corolla');
  });
});

describe('Finance - parseVehicleOutcomes', () => {
  it('debería retornar array vacío para null', () => {
    expect(parseVehicleOutcomes(null)).toEqual([]);
  });

  it('debería parsear salidas de vehículo correctamente', () => {
    const outcomes = [
      {
        id: 1,
        fecha: '2026-01-20',
        patente: 'ABC-123',
        descripcion_vehiculo: 'Toyota Corolla',
        tipo_salida: 'entrega',
        destino: 'Cliente Final',
        estado: 'completado',
      },
    ];
    const result = parseVehicleOutcomes(outcomes);
    expect(result).toHaveLength(1);
    expect(result[0].vehiclePlate).toBe('ABC-123');
    expect(result[0].destination).toBe('Cliente Final');
  });
});

describe('Finance - calculateFinanceTotals', () => {
  it('debería retornar valores por defecto para null', () => {
    const result = calculateFinanceTotals(null);
    expect(result.total).toBe(0);
    expect(result.available).toBe(0);
    expect(result.locked).toBe(0);
    expect(result.pending).toBe(0);
  });

  it('debería calcular totales correctamente', () => {
    const summary = {
      balance: 30000,
      totalEgresos: 20000,
      retenciones: 5000,
      pendingAmount: 10000,
    };
    const result = calculateFinanceTotals(summary);
    expect(result.total).toBe(50000);
    expect(result.available).toBe(30000);
    expect(result.locked).toBe(5000);
    expect(result.pending).toBe(10000);
  });
});

describe('Finance - formatCurrency', () => {
  it('debería formatear montos correctamente', () => {
    const formatted = formatCurrency(1000);
    expect(formatted).toContain('1.000');
  });

  it('debería manejar valores nulos como 0', () => {
    const formatted = formatCurrency(null);
    expect(formatted).toContain('0');
  });
});

describe('Finance - getMovementTypeLabel', () => {
  it('debería retornar label para cada tipo', () => {
    expect(getMovementTypeLabel(MOVEMENT_TYPES.INGRESO)).toBe('Ingreso');
    expect(getMovementTypeLabel(MOVEMENT_TYPES.EGRESO)).toBe('Egreso');
    expect(getMovementTypeLabel(MOVEMENT_TYPES.AJUSTE)).toBe('Ajuste');
  });

  it('debería retornar el valor mismo para tipo desconocido', () => {
    expect(getMovementTypeLabel('desconocido')).toBe('desconocido');
  });
});