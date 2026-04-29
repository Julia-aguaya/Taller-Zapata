INSERT INTO usuarios (public_id, username, email, password_hash, nombre, apellido, telefono, activo)
SELECT '00000000-0000-0000-0000-000000000200', 'demo_admin', 'admin@demo.com', '$2a$10$CUGff5cPGp62sH9K8tJlz.G.Z7w0PYDneZsqGbzA3b1tBQfg2hu.W', 'Demo', 'Admin', '3410000000', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.username = 'demo_admin');

INSERT INTO usuario_roles (usuario_id, rol_id, organizacion_id, sucursal_id)
SELECT u.id, 1, 1, NULL
FROM usuarios u
WHERE u.username = 'demo_admin'
  AND NOT EXISTS (SELECT 1 FROM usuario_roles ur WHERE ur.usuario_id = u.id AND ur.rol_id = 1);
