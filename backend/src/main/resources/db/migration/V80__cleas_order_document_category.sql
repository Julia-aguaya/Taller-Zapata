INSERT INTO categorias_documentales (codigo, nombre, modulo_codigo, tipo_tramite_id, requiere_fecha, visible_cliente, activo)
SELECT 'ORDEN_CLEAS', 'Orden CLEAS', 'CLEAS', id, 0, 0, 1
FROM tipos_tramite
WHERE codigo = 'CLEAS'
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    tipo_tramite_id = VALUES(tipo_tramite_id),
    activo = VALUES(activo);

INSERT INTO alcances_cleas (codigo, nombre, activo) VALUES
    ('DANIO_TOTAL', 'Dano total', 1),
    ('FRANQUICIA', 'Franquicia', 1)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    activo = VALUES(activo);

INSERT INTO dictamenes_cleas (codigo, nombre, activo) VALUES
    ('A_FAVOR', 'A favor', 1),
    ('EN_CONTRA', 'En contra', 1),
    ('CULPA_COMPARTIDA', 'Culpa compartida', 1)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    activo = VALUES(activo);
