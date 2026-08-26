-- Keep the V61 common matrix as the single comparison store while preserving every MAIN snapshot and piece.
ALTER TABLE comparacion_presupuesto_snapshot
    MODIFY COLUMN presupuesto_id BIGINT UNSIGNED NULL,
    MODIFY COLUMN fecha_presupuesto DATE NULL,
    MODIFY COLUMN version_presupuesto INT NULL,
    ADD COLUMN contexto VARCHAR(10) NOT NULL DEFAULT 'MAIN' AFTER id,
    ADD COLUMN presupuesto_extra_version_id BIGINT UNSIGNED NULL AFTER presupuesto_id,
    ADD KEY idx_comparacion_snapshot_presupuesto_extra_version (presupuesto_extra_version_id),
    ADD CONSTRAINT fk_comparacion_snapshot_presupuesto_extra_version
        FOREIGN KEY (presupuesto_extra_version_id) REFERENCES presupuesto_extra_versiones (id),
    ADD CONSTRAINT ck_comparacion_snapshot_contexto
        CHECK (
            (contexto = 'MAIN' AND presupuesto_id IS NOT NULL AND presupuesto_extra_version_id IS NULL)
            OR (contexto = 'EXTRA' AND presupuesto_id IS NULL AND presupuesto_extra_version_id IS NOT NULL)
        );

ALTER TABLE comparacion_pieza
    ADD COLUMN contexto VARCHAR(10) NOT NULL DEFAULT 'MAIN' AFTER snapshot_id,
    ADD COLUMN presupuesto_extra_item_origen_id BIGINT UNSIGNED NULL AFTER presupuesto_item_origen_id,
    ADD UNIQUE KEY uq_comparacion_pieza_extra_origen (snapshot_id, presupuesto_extra_item_origen_id),
    ADD KEY idx_comparacion_pieza_presupuesto_extra_item (presupuesto_extra_item_origen_id),
    ADD CONSTRAINT fk_comparacion_pieza_presupuesto_extra_item
        FOREIGN KEY (presupuesto_extra_item_origen_id) REFERENCES presupuesto_extra_items (id),
    ADD CONSTRAINT ck_comparacion_pieza_contexto
        CHECK (
            (contexto = 'MAIN' AND presupuesto_extra_item_origen_id IS NULL)
            OR (contexto = 'EXTRA' AND presupuesto_item_origen_id IS NULL AND presupuesto_extra_item_origen_id IS NOT NULL)
        );
