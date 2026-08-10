ALTER TABLE auditoria_eventos MODIFY COLUMN antes_json LONGTEXT NULL;
ALTER TABLE auditoria_eventos MODIFY COLUMN despues_json LONGTEXT NULL;
ALTER TABLE auditoria_eventos MODIFY COLUMN metadata_json LONGTEXT NULL;
