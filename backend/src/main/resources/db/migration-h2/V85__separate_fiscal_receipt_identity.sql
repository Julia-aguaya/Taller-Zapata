-- Variante H2 del perfil de test. La version para MySQL real (prod/dev) vive en
-- db/migration-mysql/ con los mismos cambios: separar la identidad fiscal AFIP
-- (tipo_fiscal_codigo, punto_venta, numero_fiscal) de la identidad legacy
-- (tipo_comprobante_codigo, numero_comprobante).
-- H2 no soporta AFTER, ni multiples operaciones por ALTER TABLE, ni
-- ALTER TABLE ... ADD INDEX / DROP INDEX (usa CREATE INDEX / DROP CONSTRAINT).
ALTER TABLE comprobantes_emitidos ADD COLUMN tipo_fiscal_codigo VARCHAR(1) NULL;
ALTER TABLE comprobantes_emitidos ADD COLUMN punto_venta VARCHAR(4) NULL;
ALTER TABLE comprobantes_emitidos ADD COLUMN numero_fiscal VARCHAR(8) NULL;
CREATE INDEX idx_comprobantes_emitidos_tipo ON comprobantes_emitidos (tipo_comprobante_codigo);
ALTER TABLE comprobantes_emitidos DROP CONSTRAINT uq_comprobantes_emitidos_tipo_numero;
ALTER TABLE comprobantes_emitidos ADD CONSTRAINT uq_comprobantes_emitidos_identidad_fiscal UNIQUE (tipo_fiscal_codigo, punto_venta, numero_fiscal);
