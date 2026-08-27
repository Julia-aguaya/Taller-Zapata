-- Preserve all historical source labels while requiring source_type and source_id to be present together.
-- MySQL 8.0.19+ supports DROP CONSTRAINT; the project already uses this form in V72.
ALTER TABLE presupuesto_extra_items
    DROP CONSTRAINT ck_presupuesto_extra_items_source;
ALTER TABLE presupuesto_extra_items
    ADD CONSTRAINT ck_presupuesto_extra_items_source
        CHECK (
            (source_type IS NULL AND source_id IS NULL)
            OR (source_type IS NOT NULL AND source_id IS NOT NULL)
        );
