-- El índice único original respalda la FK de documento_id, por lo que MySQL
-- no permite borrarlo directamente. Primero se quita la FK, luego el índice,
-- se agrega el nuevo índice único por módulo y se re-crea la FK.
ALTER TABLE documento_relaciones
    DROP FOREIGN KEY fk_documento_relaciones_documento;

ALTER TABLE documento_relaciones
    DROP INDEX uq_documento_relaciones_documento_entidad;

ALTER TABLE documento_relaciones
    ADD UNIQUE KEY uq_documento_relaciones_documento_entidad_modulo
        (documento_id, entidad_tipo, entidad_id, modulo_codigo);

ALTER TABLE documento_relaciones
    ADD CONSTRAINT fk_documento_relaciones_documento
        FOREIGN KEY (documento_id) REFERENCES documentos (id) ON DELETE CASCADE;
