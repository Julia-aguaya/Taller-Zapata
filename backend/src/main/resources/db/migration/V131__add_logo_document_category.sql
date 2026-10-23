-- Categoria documental dedicada para el logo de cada sucursal.
-- La categoria 'INFORME_INTERNO' (id 4) que usaba el front quedó inactiva en V93.
INSERT INTO categorias_documentales (codigo, nombre, modulo_codigo, tipo_tramite_id, requiere_fecha, visible_cliente, activo)
VALUES ('LOGO', 'Logo de sucursal', 'OPERACION', NULL, 0, 0, 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), modulo_codigo = VALUES(modulo_codigo), activo = 1;
