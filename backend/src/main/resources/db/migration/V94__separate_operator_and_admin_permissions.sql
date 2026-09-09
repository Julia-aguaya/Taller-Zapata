-- ROLE_ADMIN is the sole globally scoped role; every other role must be branch scoped.
ALTER TABLE usuario_roles
    MODIFY COLUMN organizacion_id BIGINT UNSIGNED NULL;

INSERT IGNORE INTO permisos (codigo, nombre, modulo, descripcion)
VALUES ('documento.eliminar', 'Eliminar documentos', 'documents', 'Permite borrar definitivamente documentos y sus relaciones');

-- Normalize the two system roles instead of retaining grants accumulated by prior migrations.
DELETE FROM rol_permisos
WHERE rol_id IN (SELECT id FROM roles WHERE codigo IN ('ROLE_ADMIN', 'ROLE_OPERADOR'));

-- Admin remains unrestricted through the relational matrix, including permissions added later.
INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT r.id, p.id, 1
FROM roles r
CROSS JOIN permisos p
WHERE r.codigo = 'ROLE_ADMIN';

-- Operators receive only normal, branch-scoped case operations.
INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT r.id, p.id, 1
FROM roles r
JOIN permisos p ON p.codigo IN (
    'caso.ver', 'caso.crear',
    'persona.ver', 'persona.crear',
    'vehiculo.ver', 'vehiculo.crear',
    'turno.ver', 'turno.crear', 'turno.editar',
    'ingreso.ver', 'ingreso.crear',
    'egreso.ver', 'egreso.crear',
    'tarea.ver', 'tarea.crear', 'tarea.editar',
    'documento.ver', 'documento.crear', 'documento.subir', 'documento.relacionar',
    'notificacion.ver', 'notificacion.crear',
    'presupuesto.ver', 'presupuesto.crear',
    'seguro.ver', 'seguro.crear',
    'recupero.ver', 'recupero.crear',
    'referenciado.ver', 'proveedor.ver',
    'workflow.tramite.avanzar', 'workflow.tramite.cerrar',
    'workflow.reparacion.asignar_turno', 'workflow.reparacion.cerrar',
    'workflow.documentacion.completar'
)
WHERE r.codigo = 'ROLE_OPERADOR';

-- Existing and future admin assignments are global; organization/branch scopes apply to non-admin roles only.
UPDATE usuario_roles
SET organizacion_id = NULL, sucursal_id = NULL
WHERE rol_id IN (SELECT id FROM roles WHERE codigo = 'ROLE_ADMIN');
