ALTER TABLE documentos
    ADD COLUMN reemplaza_documento_id BIGINT UNSIGNED NULL AFTER observaciones,
    ADD CONSTRAINT fk_documentos_reemplaza_documento FOREIGN KEY (reemplaza_documento_id) REFERENCES documentos (id);
