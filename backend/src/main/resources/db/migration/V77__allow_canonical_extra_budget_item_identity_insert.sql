-- IDENTITY generates the item id during INSERT, so a canonical item has no source_id until its first update.
ALTER TABLE presupuesto_extra_items
    DROP CONSTRAINT ck_presupuesto_extra_items_source;
ALTER TABLE presupuesto_extra_items
    ADD CONSTRAINT ck_presupuesto_extra_items_source
        CHECK (
            (source_type IS NULL AND source_id IS NULL)
            OR (source_type IS NOT NULL AND source_id IS NOT NULL)
            OR (source_type = 'EXTRA_BUDGET_ITEM' AND source_id IS NULL)
        );
