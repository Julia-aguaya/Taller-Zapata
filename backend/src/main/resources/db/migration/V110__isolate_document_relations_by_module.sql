ALTER TABLE documento_relaciones
    DROP INDEX uq_documento_relaciones_documento_entidad;

ALTER TABLE documento_relaciones
    ADD UNIQUE KEY uq_documento_relaciones_documento_entidad_modulo
        (documento_id, entidad_tipo, entidad_id, modulo_codigo);
