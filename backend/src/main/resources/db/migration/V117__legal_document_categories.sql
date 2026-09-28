INSERT INTO categorias_documentales (codigo, nombre, modulo_codigo, tipo_tramite_id, requiere_fecha, visible_cliente, activo)
VALUES
    ('EXPEDIENTE_LEGAL', 'Expediente legal', 'LEGAL', NULL, 0, 0, 1),
    ('CIERRE_LEGAL', 'Documentación de cierre legal', 'LEGAL', NULL, 0, 0, 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), modulo_codigo = VALUES(modulo_codigo), activo = 1;
