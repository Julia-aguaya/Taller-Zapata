-- V85 moved fiscal receipts to their AFIP identity. Legacy, non-fiscal receipts
-- still require their original type + number uniqueness under concurrent writes.
ALTER TABLE comprobantes_emitidos
    ADD COLUMN numero_comprobante_legacy VARCHAR(80)
        GENERATED ALWAYS AS (CASE WHEN tipo_fiscal_codigo IS NULL THEN numero_comprobante ELSE NULL END) STORED,
    ADD CONSTRAINT uq_comprobantes_emitidos_identidad_legacy
        UNIQUE (tipo_comprobante_codigo, numero_comprobante_legacy);
