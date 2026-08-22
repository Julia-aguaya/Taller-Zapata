-- Agrega estados de autorizacion de repuestos (parcial/total) al catalogo compartido
INSERT INTO autorizaciones_repuestos_seguro (codigo, nombre, activo)
SELECT 'PARCIAL', 'Autorización parcial', 1
WHERE NOT EXISTS (SELECT 1 FROM autorizaciones_repuestos_seguro WHERE codigo = 'PARCIAL');

INSERT INTO autorizaciones_repuestos_seguro (codigo, nombre, activo)
SELECT 'TOTAL', 'Autorización total', 1
WHERE NOT EXISTS (SELECT 1 FROM autorizaciones_repuestos_seguro WHERE codigo = 'TOTAL');
