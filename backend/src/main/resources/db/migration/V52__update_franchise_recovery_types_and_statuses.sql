-- Actualiza tipos de recupero de franquicia a los definidos por el negocio
UPDATE tipos_recupero_franquicia SET activo = 0;

UPDATE tipos_recupero_franquicia SET nombre = 'Cia. del 3ero', activo = 1 WHERE codigo = 'CIA_TERCERO';
INSERT INTO tipos_recupero_franquicia (codigo, nombre, activo) SELECT 'CIA_TERCERO', 'Cia. del 3ero', 1 WHERE NOT EXISTS (SELECT 1 FROM tipos_recupero_franquicia WHERE codigo = 'CIA_TERCERO');

UPDATE tipos_recupero_franquicia SET nombre = 'Abona cliente', activo = 1 WHERE codigo = 'ABONA_CLIENTE';
INSERT INTO tipos_recupero_franquicia (codigo, nombre, activo) SELECT 'ABONA_CLIENTE', 'Abona cliente', 1 WHERE NOT EXISTS (SELECT 1 FROM tipos_recupero_franquicia WHERE codigo = 'ABONA_CLIENTE');

UPDATE tipos_recupero_franquicia SET nombre = '3ero particular', activo = 1 WHERE codigo = 'TERCERO_PARTICULAR';
INSERT INTO tipos_recupero_franquicia (codigo, nombre, activo) SELECT 'TERCERO_PARTICULAR', '3ero particular', 1 WHERE NOT EXISTS (SELECT 1 FROM tipos_recupero_franquicia WHERE codigo = 'TERCERO_PARTICULAR');

UPDATE tipos_recupero_franquicia SET nombre = 'Propia Cia.', activo = 1 WHERE codigo = 'PROPIA_CIA';
INSERT INTO tipos_recupero_franquicia (codigo, nombre, activo) SELECT 'PROPIA_CIA', 'Propia Cia.', 1 WHERE NOT EXISTS (SELECT 1 FROM tipos_recupero_franquicia WHERE codigo = 'PROPIA_CIA');

-- Actualiza estados de franquicia a los definidos por el negocio
UPDATE estados_franquicia SET activo = 0;

UPDATE estados_franquicia SET nombre = 'Sin Franquicia', activo = 1 WHERE codigo = 'SIN_FRANQUICIA';
INSERT INTO estados_franquicia (codigo, nombre, activo) SELECT 'SIN_FRANQUICIA', 'Sin Franquicia', 1 WHERE NOT EXISTS (SELECT 1 FROM estados_franquicia WHERE codigo = 'SIN_FRANQUICIA');

UPDATE estados_franquicia SET nombre = 'Pendiente', activo = 1 WHERE codigo = 'PENDIENTE';
INSERT INTO estados_franquicia (codigo, nombre, activo) SELECT 'PENDIENTE', 'Pendiente', 1 WHERE NOT EXISTS (SELECT 1 FROM estados_franquicia WHERE codigo = 'PENDIENTE');

UPDATE estados_franquicia SET nombre = 'Cobrada', activo = 1 WHERE codigo = 'COBRADA';
INSERT INTO estados_franquicia (codigo, nombre, activo) SELECT 'COBRADA', 'Cobrada', 1 WHERE NOT EXISTS (SELECT 1 FROM estados_franquicia WHERE codigo = 'COBRADA');

UPDATE estados_franquicia SET nombre = 'Bonificada', activo = 1 WHERE codigo = 'BONIFICADA';
INSERT INTO estados_franquicia (codigo, nombre, activo) SELECT 'BONIFICADA', 'Bonificada', 1 WHERE NOT EXISTS (SELECT 1 FROM estados_franquicia WHERE codigo = 'BONIFICADA');
