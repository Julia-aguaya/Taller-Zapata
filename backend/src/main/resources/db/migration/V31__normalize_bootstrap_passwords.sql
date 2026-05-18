UPDATE usuarios
SET password_hash = '$2b$12$nZmU4YEfkCWyIKyNE8nwMeuSYzqgsHM9rUIJvuIL35LIu4b6PAakS'
WHERE email IN ('admin@tallerzapata.local', 'admin@demo.com');
