ALTER TABLE comprobantes_emitidos ADD COLUMN comprobante_origen_id BIGINT UNSIGNED NULL;
ALTER TABLE comprobantes_emitidos ADD CONSTRAINT fk_comprobantes_emitidos_origen FOREIGN KEY (comprobante_origen_id) REFERENCES comprobantes_emitidos (id);
CREATE INDEX idx_comprobantes_emitidos_origen ON comprobantes_emitidos (comprobante_origen_id);
