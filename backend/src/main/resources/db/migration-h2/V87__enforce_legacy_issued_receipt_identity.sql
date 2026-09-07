-- H2 (perfil de test) no soporta la palabra clave STORED de columnas generadas
-- de MySQL ni multiples operaciones en un mismo ALTER TABLE.
-- La version para MySQL real vive en db/migration-mysql/.
ALTER TABLE comprobantes_emitidos ADD COLUMN numero_comprobante_legacy VARCHAR(80)
    GENERATED ALWAYS AS (CASE WHEN tipo_fiscal_codigo IS NULL THEN numero_comprobante ELSE NULL END);
ALTER TABLE comprobantes_emitidos
    ADD CONSTRAINT uq_comprobantes_emitidos_identidad_legacy
        UNIQUE (tipo_comprobante_codigo, numero_comprobante_legacy);
