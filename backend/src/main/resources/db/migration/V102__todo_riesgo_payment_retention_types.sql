INSERT INTO tipos_retencion_financiero (codigo, nombre, activo) VALUES
    ('CONTRIB_PATRIMONIAL', 'Contribución patrimonial', 1),
    ('DREI', 'DReI', 1),
    ('OTRA', 'Otra', 1)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    activo = VALUES(activo);
