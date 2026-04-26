INSERT IGNORE INTO permisos (codigo, nombre, modulo, descripcion) VALUES
('caso.ver', 'Ver casos', 'case', 'Permite consultar casos'),
('caso.crear', 'Crear casos', 'case', 'Permite crear y editar casos'),
('persona.ver', 'Ver personas', 'person', 'Permite consultar personas'),
('persona.crear', 'Crear personas', 'person', 'Permite crear y editar personas'),
('vehiculo.ver', 'Ver vehiculos', 'vehicle', 'Permite consultar vehiculos'),
('vehiculo.crear', 'Crear vehiculos', 'vehicle', 'Permite crear y editar vehiculos'),
('turno.ver', 'Ver turnos', 'operation', 'Permite consultar turnos'),
('turno.crear', 'Crear turnos', 'operation', 'Permite crear y editar turnos'),
('ingreso.ver', 'Ver ingresos', 'operation', 'Permite consultar ingresos de vehiculos'),
('ingreso.crear', 'Crear ingresos', 'operation', 'Permite registrar ingresos de vehiculos'),
('egreso.ver', 'Ver egresos', 'operation', 'Permite consultar egresos de vehiculos'),
('egreso.crear', 'Crear egresos', 'operation', 'Permite registrar egresos de vehiculos'),
('tarea.ver', 'Ver tareas', 'operation', 'Permite consultar tareas'),
('tarea.crear', 'Crear tareas', 'operation', 'Permite crear y resolver tareas'),
('documento.ver', 'Ver documentos', 'document', 'Permite consultar documentos'),
('documento.crear', 'Crear documentos', 'document', 'Permite subir y relacionar documentos'),
('notificacion.ver', 'Ver notificaciones', 'notification', 'Permite consultar notificaciones'),
('notificacion.crear', 'Crear notificaciones', 'notification', 'Permite crear notificaciones');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 1, id, 1 FROM permisos WHERE codigo IN (
    'caso.ver', 'caso.crear',
    'persona.ver', 'persona.crear',
    'vehiculo.ver', 'vehiculo.crear',
    'turno.ver', 'turno.crear',
    'ingreso.ver', 'ingreso.crear',
    'egreso.ver', 'egreso.crear',
    'tarea.ver', 'tarea.crear',
    'documento.ver', 'documento.crear',
    'notificacion.ver', 'notificacion.crear'
)
ON DUPLICATE KEY UPDATE allow_flag = 1;

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 2, id, 1 FROM permisos WHERE codigo IN (
    'caso.ver', 'caso.crear',
    'persona.ver', 'persona.crear',
    'vehiculo.ver', 'vehiculo.crear',
    'turno.ver', 'turno.crear',
    'ingreso.ver', 'ingreso.crear',
    'egreso.ver', 'egreso.crear',
    'tarea.ver', 'tarea.crear',
    'documento.ver', 'documento.crear',
    'notificacion.ver', 'notificacion.crear'
)
ON DUPLICATE KEY UPDATE allow_flag = 1;
