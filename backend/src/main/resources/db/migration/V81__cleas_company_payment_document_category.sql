INSERT INTO categorias_documentales (codigo, nombre, modulo_codigo, tipo_tramite_id, requiere_fecha, visible_cliente, activo)
SELECT 'COMPROBANTE_PAGO_CLEAS', 'Comprobante de pago CLEAS', 'CLEAS', id, 0, 0, 1
FROM tipos_tramite
WHERE codigo = 'CLEAS'
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    tipo_tramite_id = VALUES(tipo_tramite_id),
    visible_cliente = VALUES(visible_cliente),
    activo = VALUES(activo);
