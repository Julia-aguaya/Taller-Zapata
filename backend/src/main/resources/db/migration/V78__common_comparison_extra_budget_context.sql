-- Keep the V61 common matrix as the single comparison store while preserving every MAIN snapshot and piece.
ALTER TABLE comparacion_presupuesto_snapshot
    MODIFY COLUMN presupuesto_id BIGINT UNSIGNED NULL;
ALTER TABLE comparacion_presupuesto_snapshot
    MODIFY COLUMN fecha_presupuesto DATE NULL;
ALTER TABLE comparacion_presupuesto_snapshot
    MODIFY COLUMN version_presupuesto INT NULL;
ALTER TABLE comparacion_presupuesto_snapshot
    ADD COLUMN contexto VARCHAR(10) NOT NULL DEFAULT 'MAIN';
ALTER TABLE comparacion_presupuesto_snapshot
    ADD COLUMN presupuesto_extra_version_id BIGINT UNSIGNED NULL;
CREATE INDEX idx_comparacion_snapshot_presupuesto_extra_version ON comparacion_presupuesto_snapshot (presupuesto_extra_version_id);
ALTER TABLE comparacion_presupuesto_snapshot
    ADD CONSTRAINT fk_comparacion_snapshot_presupuesto_extra_version
        FOREIGN KEY (presupuesto_extra_version_id) REFERENCES presupuesto_extra_versiones (id);
ALTER TABLE comparacion_presupuesto_snapshot
    ADD CONSTRAINT ck_comparacion_snapshot_contexto
        CHECK (
            (contexto = 'MAIN' AND presupuesto_id IS NOT NULL AND presupuesto_extra_version_id IS NULL)
            OR (contexto = 'EXTRA' AND presupuesto_id IS NULL AND presupuesto_extra_version_id IS NOT NULL)
        );

ALTER TABLE comparacion_pieza
    ADD COLUMN contexto VARCHAR(10) NOT NULL DEFAULT 'MAIN';
ALTER TABLE comparacion_pieza
    ADD COLUMN presupuesto_extra_item_origen_id BIGINT UNSIGNED NULL;
CREATE UNIQUE INDEX uq_comparacion_pieza_extra_origen ON comparacion_pieza (snapshot_id, presupuesto_extra_item_origen_id);
CREATE INDEX idx_comparacion_pieza_presupuesto_extra_item ON comparacion_pieza (presupuesto_extra_item_origen_id);
ALTER TABLE comparacion_pieza
    ADD CONSTRAINT fk_comparacion_pieza_presupuesto_extra_item
        FOREIGN KEY (presupuesto_extra_item_origen_id) REFERENCES presupuesto_extra_items (id);
ALTER TABLE comparacion_pieza
    ADD CONSTRAINT ck_comparacion_pieza_contexto
        CHECK (
            (contexto = 'MAIN' AND presupuesto_extra_item_origen_id IS NULL)
            OR (contexto = 'EXTRA' AND presupuesto_item_origen_id IS NULL AND presupuesto_extra_item_origen_id IS NOT NULL)
        );
