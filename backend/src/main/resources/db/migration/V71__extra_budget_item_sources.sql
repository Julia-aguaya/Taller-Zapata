ALTER TABLE presupuesto_extra_items
    ADD COLUMN source_type VARCHAR(40) NULL;
ALTER TABLE presupuesto_extra_items
    ADD COLUMN source_id BIGINT UNSIGNED NULL;

ALTER TABLE presupuesto_extra_items
    ADD UNIQUE KEY uq_presupuesto_extra_items_source (presupuesto_extra_version_id, source_type, source_id);
