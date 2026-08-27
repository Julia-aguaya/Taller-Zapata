-- V72 is additive: V66/V68/V69-V71 rows keep their legacy shape and are never converted here.
ALTER TABLE presupuesto_extra_items
    ADD COLUMN pieza_afectada VARCHAR(150) NULL;
ALTER TABLE presupuesto_extra_items
    ADD COLUMN tarea_codigo VARCHAR(40) NULL;
ALTER TABLE presupuesto_extra_items
    ADD COLUMN nivel_danio_codigo VARCHAR(40) NULL;
ALTER TABLE presupuesto_extra_items
    ADD COLUMN monto_repuestos DECIMAL(14,2) NULL;
ALTER TABLE presupuesto_extra_items
    ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE presupuesto_extra_items
    ADD CONSTRAINT fk_presupuesto_extra_items_tarea
        FOREIGN KEY (tarea_codigo) REFERENCES tareas_presupuesto (codigo);
ALTER TABLE presupuesto_extra_items
    ADD CONSTRAINT fk_presupuesto_extra_items_nivel_danio
        FOREIGN KEY (nivel_danio_codigo) REFERENCES niveles_danio (codigo);
ALTER TABLE presupuesto_extra_items
    ADD CONSTRAINT ck_presupuesto_extra_items_monto_repuestos
        CHECK (monto_repuestos IS NULL OR monto_repuestos >= 0);
ALTER TABLE presupuesto_extra_items
    ADD CONSTRAINT ck_presupuesto_extra_items_source
        CHECK ((source_type IS NULL AND source_id IS NULL) OR (source_type IS NOT NULL AND source_id IS NOT NULL));

ALTER TABLE presupuesto_extra_versiones
    ADD COLUMN mano_obra_general DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE presupuesto_extra_versiones
    ADD COLUMN mano_obra_general_aplica_iva TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE presupuesto_extra_versiones
    ADD COLUMN notas TEXT NULL;
ALTER TABLE presupuesto_extra_versiones
    ADD COLUMN confirmado_at DATETIME NULL;
ALTER TABLE presupuesto_extra_versiones
    ADD COLUMN confirmado_by BIGINT UNSIGNED NULL;
ALTER TABLE presupuesto_extra_versiones
    ADD CONSTRAINT fk_presupuesto_extra_versiones_confirmed_by
        FOREIGN KEY (confirmado_by) REFERENCES usuarios (id);
ALTER TABLE presupuesto_extra_versiones
    ADD CONSTRAINT ck_presupuesto_extra_versiones_mano_obra_general
        CHECK (mano_obra_general >= 0);

-- Extend the canonical part source safely. Existing BUDGET_ITEM, ACCESSORY_WORK and MANUAL rows remain unchanged.
ALTER TABLE repuestos_caso
    ADD COLUMN presupuesto_extra_item_id BIGINT UNSIGNED NULL;
ALTER TABLE repuestos_caso
    MODIFY COLUMN source_type ENUM('BUDGET_ITEM', 'ACCESSORY_WORK', 'EXTRA_BUDGET_ITEM', 'MANUAL') NOT NULL;
CREATE INDEX idx_repuestos_caso_presupuesto_extra_item ON repuestos_caso (presupuesto_extra_item_id);
CREATE UNIQUE INDEX uq_repuestos_caso_presupuesto_extra_item ON repuestos_caso (caso_id, presupuesto_extra_item_id);
ALTER TABLE repuestos_caso
    ADD CONSTRAINT fk_repuestos_caso_presupuesto_extra_item
        FOREIGN KEY (presupuesto_extra_item_id) REFERENCES presupuesto_extra_items (id);

ALTER TABLE repuestos_caso
    DROP CONSTRAINT ck_repuestos_caso_source;
ALTER TABLE repuestos_caso
    ADD CONSTRAINT ck_repuestos_caso_source CHECK (
        (source_type = 'BUDGET_ITEM' AND presupuesto_item_id IS NOT NULL AND accessory_work_id IS NULL AND presupuesto_extra_item_id IS NULL)
        OR (source_type = 'ACCESSORY_WORK' AND presupuesto_item_id IS NULL AND accessory_work_id IS NOT NULL AND presupuesto_extra_item_id IS NULL)
        OR (source_type = 'EXTRA_BUDGET_ITEM' AND presupuesto_item_id IS NULL AND accessory_work_id IS NULL AND presupuesto_extra_item_id IS NOT NULL)
        OR (source_type = 'MANUAL' AND presupuesto_item_id IS NULL AND accessory_work_id IS NULL AND presupuesto_extra_item_id IS NULL)
    );

CREATE TABLE presupuesto_extra_version_confirmaciones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    presupuesto_extra_version_id BIGINT UNSIGNED NOT NULL,
    confirmado_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmado_by BIGINT UNSIGNED NULL,
    mano_obra_general DECIMAL(14,2) NOT NULL,
    mano_obra_general_aplica_iva TINYINT(1) NOT NULL,
    notas TEXT NULL,
    PRIMARY KEY (id),
    KEY idx_presupuesto_extra_version_confirmaciones_version (presupuesto_extra_version_id, confirmado_at),
    CONSTRAINT fk_presupuesto_extra_version_confirmaciones_version
        FOREIGN KEY (presupuesto_extra_version_id) REFERENCES presupuesto_extra_versiones (id) ON DELETE CASCADE,
    CONSTRAINT fk_presupuesto_extra_version_confirmaciones_usuario
        FOREIGN KEY (confirmado_by) REFERENCES usuarios (id),
    CONSTRAINT ck_presupuesto_extra_version_confirmaciones_mano_obra
        CHECK (mano_obra_general >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
