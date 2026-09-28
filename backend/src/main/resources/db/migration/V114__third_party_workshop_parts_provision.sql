-- RECLAMO_TERCEROS gestionado por Taller: únicamente estos tres responsables.
UPDATE modos_provision_repuestos
SET activo = 0
WHERE codigo IN ('TERCERO', 'NO_APLICA');

INSERT INTO modos_provision_repuestos (codigo, nombre, activo)
SELECT 'CLIENTE', 'Cliente', 1
WHERE NOT EXISTS (SELECT 1 FROM modos_provision_repuestos WHERE codigo = 'CLIENTE');
