-- V85 removed uq_comprobantes_emitidos_tipo_numero, which had been supporting
-- fk_comprobantes_emitidos_tipo. Existing environments can already have the
-- replacement index, so create it only when it is absent.
SET @idx_comprobantes_emitidos_tipo_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'comprobantes_emitidos'
      AND index_name = 'idx_comprobantes_emitidos_tipo'
);

SET @create_idx_comprobantes_emitidos_tipo = IF(
    @idx_comprobantes_emitidos_tipo_exists = 0,
    'CREATE INDEX idx_comprobantes_emitidos_tipo ON comprobantes_emitidos (tipo_comprobante_codigo)',
    'SELECT 1'
);

PREPARE create_idx_comprobantes_emitidos_tipo FROM @create_idx_comprobantes_emitidos_tipo;
EXECUTE create_idx_comprobantes_emitidos_tipo;
DEALLOCATE PREPARE create_idx_comprobantes_emitidos_tipo;
