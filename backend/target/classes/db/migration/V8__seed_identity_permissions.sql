INSERT IGNORE INTO permisos (codigo, nombre, modulo, descripcion)
VALUES
('identity.permissions.read', 'Ver permisos', 'identity', 'Permite listar permisos del sistema'),
('identity.roles.manage', 'Gestionar roles de usuario', 'identity', 'Permite consultar y actualizar asignaciones de roles de usuarios');

INSERT IGNORE INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 1, p.id, 1
FROM permisos p
WHERE p.codigo IN ('identity.permissions.read', 'identity.roles.manage');
