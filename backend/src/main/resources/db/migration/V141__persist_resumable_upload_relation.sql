ALTER TABLE documento_cargas ADD COLUMN relacion_entidad_tipo VARCHAR(30);
ALTER TABLE documento_cargas ADD COLUMN relacion_entidad_id BIGINT UNSIGNED;
ALTER TABLE documento_cargas ADD COLUMN relacion_modulo_codigo VARCHAR(50);
ALTER TABLE documento_cargas ADD COLUMN relacion_principal BOOLEAN;
ALTER TABLE documento_cargas ADD COLUMN relacion_visible_cliente BOOLEAN;
ALTER TABLE documento_cargas ADD COLUMN relacion_orden_visual INT;
