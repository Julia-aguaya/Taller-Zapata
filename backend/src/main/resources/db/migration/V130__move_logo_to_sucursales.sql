-- El logo es propio de cada sucursal, no de la organización.
ALTER TABLE sucursales ADD COLUMN logo_document_id BIGINT UNSIGNED NULL;
ALTER TABLE organizaciones DROP COLUMN logo_document_id;
