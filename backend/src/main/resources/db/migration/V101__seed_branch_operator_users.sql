INSERT INTO usuarios (public_id, username, email, password_hash, nombre, apellido, telefono, activo)
SELECT '00000000-0000-0000-0000-000000000301', 'operador-centro', 'operador-centro@demo.tallerzapata.local', '$2b$12$nZmU4YEfkCWyIKyNE8nwMeuSYzqgsHM9rUIJvuIL35LIu4b6PAakS', 'Operador', 'Centro', '3414208800', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.username = 'operador-centro');

INSERT INTO usuarios (public_id, username, email, password_hash, nombre, apellido, telefono, activo)
SELECT '00000000-0000-0000-0000-000000000302', 'operador-zapata', 'operador-zapata@demo.tallerzapata.local', '$2b$12$nZmU4YEfkCWyIKyNE8nwMeuSYzqgsHM9rUIJvuIL35LIu4b6PAakS', 'Operador', 'Zapata', '3414261200', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.username = 'operador-zapata');

INSERT INTO usuario_roles (usuario_id, rol_id, organizacion_id, sucursal_id)
SELECT u.id, r.id, s.organizacion_id, s.id
FROM usuarios u
JOIN roles r ON r.codigo = 'ROLE_OPERADOR'
JOIN organizaciones o ON o.codigo = 'TZ'
JOIN sucursales s ON s.organizacion_id = o.id AND s.codigo = 'C'
WHERE u.username = 'operador-centro'
  AND NOT EXISTS (
      SELECT 1
      FROM usuario_roles ur
      WHERE ur.usuario_id = u.id
        AND ur.rol_id = r.id
        AND ur.organizacion_id = s.organizacion_id
        AND ur.sucursal_id = s.id
  );

INSERT INTO usuario_roles (usuario_id, rol_id, organizacion_id, sucursal_id)
SELECT u.id, r.id, s.organizacion_id, s.id
FROM usuarios u
JOIN roles r ON r.codigo = 'ROLE_OPERADOR'
JOIN organizaciones o ON o.codigo = 'TZ'
JOIN sucursales s ON s.organizacion_id = o.id AND s.codigo = 'Z'
WHERE u.username = 'operador-zapata'
  AND NOT EXISTS (
      SELECT 1
      FROM usuario_roles ur
      WHERE ur.usuario_id = u.id
        AND ur.rol_id = r.id
        AND ur.organizacion_id = s.organizacion_id
        AND ur.sucursal_id = s.id
  );
