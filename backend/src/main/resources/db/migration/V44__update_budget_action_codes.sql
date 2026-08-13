-- Actualiza acciones de presupuesto a las definidas por el negocio
DELETE FROM acciones_presupuesto;
INSERT INTO acciones_presupuesto (codigo, nombre, activo) VALUES
('REEMPLAZAR', 'Reemplazar', 1),
('REEMPLAZAR_Y_PINTAR', 'Reemplazar y pintar', 1),
('REEMPLAZAR_Y_CARGAR', 'Reemplazar y cargar', 1),
('REPARAR', 'Reparar', 1),
('REPARAR_Y_PINTAR', 'Reparar y pintar', 1),
('REPARAR_Y_RECUADRAR', 'Reparar y recuadrar', 1),
('ESCUADRAR_Y_PINTAR', 'Escuadrar y pintar', 1),
('CARGAR', 'Cargar', 1),
('DIFUMINAR', 'Difuminar', 1),
('ESCUADRAR', 'Escuadrar', 1),
('A_VERIFICAR', 'A verificar', 1);
