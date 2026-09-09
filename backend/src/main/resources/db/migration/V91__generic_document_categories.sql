INSERT INTO categorias_documentales (codigo, nombre, modulo_codigo, tipo_tramite_id, requiere_fecha, visible_cliente, activo)
VALUES
    ('PERSONAL', 'Personal', 'OPERACION', NULL, 0, 0, 1),
    ('VEHICULO', 'Vehículo', 'OPERACION', NULL, 0, 0, 1),
    ('SEGURO', 'Seguro', 'OPERACION', NULL, 0, 0, 1),
    ('OTRO', 'Otro', 'OPERACION', NULL, 0, 0, 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = 1;
