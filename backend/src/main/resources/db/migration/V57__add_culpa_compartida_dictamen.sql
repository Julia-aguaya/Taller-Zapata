-- Agrega dictamen "Culpa compartida" al catalogo de dictamenes de recupero
INSERT INTO dictamenes_recupero (codigo, nombre, activo)
SELECT 'CULPA_COMPARTIDA', 'Culpa compartida', 1
WHERE NOT EXISTS (SELECT 1 FROM dictamenes_recupero WHERE codigo = 'CULPA_COMPARTIDA');
