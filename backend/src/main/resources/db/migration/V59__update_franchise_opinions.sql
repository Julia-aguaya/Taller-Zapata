-- Actualiza dictamenes_franquicia a las opciones de negocio: A favor / Rechazado / Pendiente
UPDATE dictamenes_franquicia SET activo = 0;

UPDATE dictamenes_franquicia SET nombre = 'Pendiente', activo = 1 WHERE codigo = 'PENDIENTE';
INSERT INTO dictamenes_franquicia (codigo, nombre, activo) SELECT 'PENDIENTE', 'Pendiente', 1 WHERE NOT EXISTS (SELECT 1 FROM dictamenes_franquicia WHERE codigo = 'PENDIENTE');

UPDATE dictamenes_franquicia SET nombre = 'A favor', activo = 1 WHERE codigo = 'A_FAVOR';
INSERT INTO dictamenes_franquicia (codigo, nombre, activo) SELECT 'A_FAVOR', 'A favor', 1 WHERE NOT EXISTS (SELECT 1 FROM dictamenes_franquicia WHERE codigo = 'A_FAVOR');

UPDATE dictamenes_franquicia SET nombre = 'Rechazado', activo = 1 WHERE codigo = 'RECHAZADO';
INSERT INTO dictamenes_franquicia (codigo, nombre, activo) SELECT 'RECHAZADO', 'Rechazado', 1 WHERE NOT EXISTS (SELECT 1 FROM dictamenes_franquicia WHERE codigo = 'RECHAZADO');
