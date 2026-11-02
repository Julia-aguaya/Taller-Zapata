-- Eliminacion definitiva de carpetas sin actividad. Restringida a ROLE_ADMIN global.
INSERT IGNORE INTO permisos (codigo, nombre, modulo, descripcion)
VALUES ('caso.eliminar', 'Eliminar casos', 'casefile', 'Permite eliminar definitivamente carpetas sin actividad');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT r.id, p.id, 1
FROM roles r
JOIN permisos p ON p.codigo = 'caso.eliminar'
WHERE r.codigo = 'ROLE_ADMIN'
ON DUPLICATE KEY UPDATE allow_flag = 1;
