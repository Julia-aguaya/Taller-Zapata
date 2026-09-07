ALTER TABLE comprobantes_emitidos
    ADD COLUMN tipo_fiscal_codigo VARCHAR(1) NULL AFTER comprobante_fiscal,
    ADD COLUMN punto_venta VARCHAR(4) NULL AFTER tipo_fiscal_codigo,
    ADD COLUMN numero_fiscal VARCHAR(8) NULL AFTER punto_venta;

-- El FK fk_comprobantes_emitidos_tipo usa uq_comprobantes_emitidos_tipo_numero como unico indice
-- soporte (InnoDB descarto el indice auto-creado cuando V84 agrego ese unique). Hay que crear un
-- indice de reemplazo ANTES de dropear el unique, o InnoDB falla con error 1553.
ALTER TABLE comprobantes_emitidos ADD INDEX idx_comprobantes_emitidos_tipo (tipo_comprobante_codigo);

DROP INDEX uq_comprobantes_emitidos_tipo_numero ON comprobantes_emitidos;
ALTER TABLE comprobantes_emitidos
    ADD CONSTRAINT uq_comprobantes_emitidos_identidad_fiscal UNIQUE (tipo_fiscal_codigo, punto_venta, numero_fiscal);
