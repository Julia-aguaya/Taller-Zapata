ALTER TABLE legal_gastos
    ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE legal_rubros_recuperables
    ADD COLUMN fecha_pago_prevista DATE NULL,
    ADD COLUMN fecha_pago_efectivo DATE NULL,
    ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE movimientos_financieros
    ADD COLUMN estado_cobro_codigo VARCHAR(40) NULL;

ALTER TABLE legal_rubros_recuperables
    DROP FOREIGN KEY fk_legal_rubros_movimiento,
    ADD CONSTRAINT fk_legal_rubros_movimiento FOREIGN KEY (movimiento_financiero_id) REFERENCES movimientos_financieros (id) ON DELETE SET NULL;

UPDATE cierre_por_legal SET activo = 0;
INSERT INTO cierre_por_legal (codigo, nombre, activo) VALUES
    ('PENDIENTE', 'Pendiente', 1),
    ('CONCILIACION', 'Conciliación', 1),
    ('SENTENCIA', 'Sentencia', 1),
    ('DESISTIMIENTO', 'Desistimiento', 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = 1;

INSERT INTO pagado_por_gasto_legal (codigo, nombre, activo) VALUES
    ('CLIENTE', 'Cliente', 1),
    ('ABOGADO', 'Abogado', 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = 1;
