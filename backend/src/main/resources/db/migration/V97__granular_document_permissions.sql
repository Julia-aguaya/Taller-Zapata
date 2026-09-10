-- Document actions are granted independently. Destructive operations remain global-admin only.
INSERT IGNORE INTO permisos (codigo, nombre, modulo, descripcion) VALUES
    ('documento.editar', 'Editar metadatos de documentos', 'documents', 'Permite modificar los metadatos de documentos vinculados a casos abiertos'),
    ('documento.reemplazar', 'Reemplazar documentos', 'documents', 'Permite reemplazar archivos documentales'),
    ('documento.desvincular', 'Desvincular documentos', 'documents', 'Permite quitar relaciones documentales');

DELETE FROM rol_permisos
WHERE rol_id IN (SELECT id FROM roles WHERE codigo IN ('ROLE_ADMIN', 'ROLE_OPERADOR'))
  AND permiso_id IN (SELECT id FROM permisos WHERE codigo IN ('documento.subir', 'documento.relacionar', 'documento.editar', 'documento.reemplazar', 'documento.desvincular', 'documento.eliminar'));

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT r.id, p.id, 1
FROM roles r
JOIN permisos p ON p.codigo IN ('documento.subir', 'documento.relacionar', 'documento.editar')
WHERE r.codigo = 'ROLE_OPERADOR';

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT r.id, p.id, 1
FROM roles r
JOIN permisos p ON p.codigo IN ('documento.subir', 'documento.relacionar', 'documento.editar', 'documento.reemplazar', 'documento.desvincular', 'documento.eliminar')
WHERE r.codigo = 'ROLE_ADMIN';
