-- Confirmation is independent from the document status and only applies to the redesigned extra-budget flow.
ALTER TABLE presupuestos_extra
    ADD COLUMN confirmacion_cliente VARCHAR(12) NOT NULL DEFAULT 'PENDIENTE',
    ADD COLUMN confirmado_at DATETIME NULL,
    ADD COLUMN confirmado_by BIGINT UNSIGNED NULL,
    ADD COLUMN revertido_at DATETIME NULL,
    ADD COLUMN revertido_by BIGINT UNSIGNED NULL,
    ADD COLUMN motivo_reversion VARCHAR(500) NULL,
    ADD CONSTRAINT fk_presupuestos_extra_confirmado_by FOREIGN KEY (confirmado_by) REFERENCES usuarios (id),
    ADD CONSTRAINT fk_presupuestos_extra_revertido_by FOREIGN KEY (revertido_by) REFERENCES usuarios (id),
    ADD CONSTRAINT ck_presupuestos_extra_confirmacion CHECK (confirmacion_cliente IN ('PENDIENTE', 'SI', 'NO'));
