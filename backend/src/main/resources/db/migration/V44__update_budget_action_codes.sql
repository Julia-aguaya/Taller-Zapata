-- Actualiza acciones de presupuesto a las definidas por el negocio
-- Paso 1: desactivar todos los códigos existentes
UPDATE acciones_presupuesto SET activo = 0;

-- Paso 2: reactivar/insertar cada código (compatible H2 + MySQL)
UPDATE acciones_presupuesto SET nombre = 'Reemplazar', activo = 1 WHERE codigo = 'REEMPLAZAR';
INSERT INTO acciones_presupuesto (codigo, nombre, activo) SELECT 'REEMPLAZAR', 'Reemplazar', 1 WHERE NOT EXISTS (SELECT 1 FROM acciones_presupuesto WHERE codigo = 'REEMPLAZAR');

UPDATE acciones_presupuesto SET nombre = 'Reemplazar y pintar', activo = 1 WHERE codigo = 'REEMPLAZAR_Y_PINTAR';
INSERT INTO acciones_presupuesto (codigo, nombre, activo) SELECT 'REEMPLAZAR_Y_PINTAR', 'Reemplazar y pintar', 1 WHERE NOT EXISTS (SELECT 1 FROM acciones_presupuesto WHERE codigo = 'REEMPLAZAR_Y_PINTAR');

UPDATE acciones_presupuesto SET nombre = 'Reemplazar y cargar', activo = 1 WHERE codigo = 'REEMPLAZAR_Y_CARGAR';
INSERT INTO acciones_presupuesto (codigo, nombre, activo) SELECT 'REEMPLAZAR_Y_CARGAR', 'Reemplazar y cargar', 1 WHERE NOT EXISTS (SELECT 1 FROM acciones_presupuesto WHERE codigo = 'REEMPLAZAR_Y_CARGAR');

UPDATE acciones_presupuesto SET nombre = 'Reparar', activo = 1 WHERE codigo = 'REPARAR';
INSERT INTO acciones_presupuesto (codigo, nombre, activo) SELECT 'REPARAR', 'Reparar', 1 WHERE NOT EXISTS (SELECT 1 FROM acciones_presupuesto WHERE codigo = 'REPARAR');

UPDATE acciones_presupuesto SET nombre = 'Reparar y pintar', activo = 1 WHERE codigo = 'REPARAR_Y_PINTAR';
INSERT INTO acciones_presupuesto (codigo, nombre, activo) SELECT 'REPARAR_Y_PINTAR', 'Reparar y pintar', 1 WHERE NOT EXISTS (SELECT 1 FROM acciones_presupuesto WHERE codigo = 'REPARAR_Y_PINTAR');

UPDATE acciones_presupuesto SET nombre = 'Reparar y recuadrar', activo = 1 WHERE codigo = 'REPARAR_Y_RECUADRAR';
INSERT INTO acciones_presupuesto (codigo, nombre, activo) SELECT 'REPARAR_Y_RECUADRAR', 'Reparar y recuadrar', 1 WHERE NOT EXISTS (SELECT 1 FROM acciones_presupuesto WHERE codigo = 'REPARAR_Y_RECUADRAR');

UPDATE acciones_presupuesto SET nombre = 'Escuadrar y pintar', activo = 1 WHERE codigo = 'ESCUADRAR_Y_PINTAR';
INSERT INTO acciones_presupuesto (codigo, nombre, activo) SELECT 'ESCUADRAR_Y_PINTAR', 'Escuadrar y pintar', 1 WHERE NOT EXISTS (SELECT 1 FROM acciones_presupuesto WHERE codigo = 'ESCUADRAR_Y_PINTAR');

UPDATE acciones_presupuesto SET nombre = 'Cargar', activo = 1 WHERE codigo = 'CARGAR';
INSERT INTO acciones_presupuesto (codigo, nombre, activo) SELECT 'CARGAR', 'Cargar', 1 WHERE NOT EXISTS (SELECT 1 FROM acciones_presupuesto WHERE codigo = 'CARGAR');

UPDATE acciones_presupuesto SET nombre = 'Difuminar', activo = 1 WHERE codigo = 'DIFUMINAR';
INSERT INTO acciones_presupuesto (codigo, nombre, activo) SELECT 'DIFUMINAR', 'Difuminar', 1 WHERE NOT EXISTS (SELECT 1 FROM acciones_presupuesto WHERE codigo = 'DIFUMINAR');

UPDATE acciones_presupuesto SET nombre = 'Escuadrar', activo = 1 WHERE codigo = 'ESCUADRAR';
INSERT INTO acciones_presupuesto (codigo, nombre, activo) SELECT 'ESCUADRAR', 'Escuadrar', 1 WHERE NOT EXISTS (SELECT 1 FROM acciones_presupuesto WHERE codigo = 'ESCUADRAR');

UPDATE acciones_presupuesto SET nombre = 'A verificar', activo = 1 WHERE codigo = 'A_VERIFICAR';
INSERT INTO acciones_presupuesto (codigo, nombre, activo) SELECT 'A_VERIFICAR', 'A verificar', 1 WHERE NOT EXISTS (SELECT 1 FROM acciones_presupuesto WHERE codigo = 'A_VERIFICAR');
