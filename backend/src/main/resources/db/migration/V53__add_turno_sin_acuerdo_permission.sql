INSERT INTO permisos (codigo, nombre, modulo, descripcion) VALUES
('turno.crear.sin_acuerdo', 'Crear turnos sin acuerdo de cotizacion', 'operation', 'Permite agendar turnos aunque no este acordada la cotizacion con la Cia.');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 1, id, TRUE FROM permisos WHERE codigo = 'turno.crear.sin_acuerdo';

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 2, id, TRUE FROM permisos WHERE codigo = 'turno.crear.sin_acuerdo';
