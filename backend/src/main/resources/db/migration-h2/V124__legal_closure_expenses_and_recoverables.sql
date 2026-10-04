-- H2 does not support multiple operations in one ALTER TABLE statement and
-- uses DROP CONSTRAINT instead of MySQL's DROP FOREIGN KEY syntax.
ALTER TABLE legal_gastos ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE legal_rubros_recuperables ADD COLUMN fecha_pago_prevista DATE NULL;
ALTER TABLE legal_rubros_recuperables ADD COLUMN fecha_pago_efectivo DATE NULL;
ALTER TABLE legal_rubros_recuperables ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE movimientos_financieros ADD COLUMN estado_cobro_codigo VARCHAR(40) NULL;
ALTER TABLE legal_rubros_recuperables DROP CONSTRAINT fk_legal_rubros_movimiento;
ALTER TABLE legal_rubros_recuperables ADD CONSTRAINT fk_legal_rubros_movimiento FOREIGN KEY (movimiento_financiero_id) REFERENCES movimientos_financieros (id) ON DELETE SET NULL;

UPDATE cierre_por_legal SET activo = 0;
MERGE INTO cierre_por_legal (codigo, nombre, activo) KEY (codigo) VALUES
    ('PENDIENTE', 'Pendiente', 1),
    ('CONCILIACION', 'Conciliación', 1),
    ('SENTENCIA', 'Sentencia', 1),
    ('DESISTIMIENTO', 'Desistimiento', 1);

MERGE INTO pagado_por_gasto_legal (codigo, nombre, activo) KEY (codigo) VALUES
    ('CLIENTE', 'Cliente', 1),
    ('ABOGADO', 'Abogado', 1);
