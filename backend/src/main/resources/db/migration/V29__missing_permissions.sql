INSERT INTO permisos (codigo, nombre, modulo, descripcion)
SELECT codigo, nombre, modulo, descripcion FROM (
    SELECT 'caso.ver' AS codigo, 'Ver casos' AS nombre, 'case' AS modulo, 'Permite consultar casos' AS descripcion UNION ALL
    SELECT 'caso.crear', 'Crear casos', 'case', 'Permite crear y editar casos' UNION ALL
    SELECT 'persona.ver', 'Ver personas', 'person', 'Permite consultar personas' UNION ALL
    SELECT 'persona.crear', 'Crear personas', 'person', 'Permite crear y editar personas' UNION ALL
    SELECT 'vehiculo.ver', 'Ver vehiculos', 'vehicle', 'Permite consultar vehiculos' UNION ALL
    SELECT 'vehiculo.crear', 'Crear vehiculos', 'vehicle', 'Permite crear y editar vehiculos' UNION ALL
    SELECT 'turno.ver', 'Ver turnos', 'operation', 'Permite consultar turnos' UNION ALL
    SELECT 'turno.crear', 'Crear turnos', 'operation', 'Permite crear y editar turnos' UNION ALL
    SELECT 'ingreso.ver', 'Ver ingresos', 'operation', 'Permite consultar ingresos de vehiculos' UNION ALL
    SELECT 'ingreso.crear', 'Crear ingresos', 'operation', 'Permite registrar ingresos de vehiculos' UNION ALL
    SELECT 'egreso.ver', 'Ver egresos', 'operation', 'Permite consultar egresos de vehiculos' UNION ALL
    SELECT 'egreso.crear', 'Crear egresos', 'operation', 'Permite registrar egresos de vehiculos' UNION ALL
    SELECT 'tarea.ver', 'Ver tareas', 'operation', 'Permite consultar tareas' UNION ALL
    SELECT 'tarea.crear', 'Crear tareas', 'operation', 'Permite crear y resolver tareas' UNION ALL
    SELECT 'documento.ver', 'Ver documentos', 'document', 'Permite consultar documentos' UNION ALL
    SELECT 'documento.crear', 'Crear documentos', 'document', 'Permite subir y relacionar documentos' UNION ALL
    SELECT 'notificacion.ver', 'Ver notificaciones', 'notification', 'Permite consultar notificaciones' UNION ALL
    SELECT 'notificacion.crear', 'Crear notificaciones', 'notification', 'Permite crear notificaciones'
) AS nuevos_permisos
WHERE NOT EXISTS (SELECT 1 FROM permisos p WHERE p.codigo = nuevos_permisos.codigo);

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
