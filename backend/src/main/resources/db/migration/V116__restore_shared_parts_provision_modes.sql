-- V114 pudo desactivar valores de un catálogo compartido. Se restauran para los
-- trámites que ya los consumían; la restricción de Taller se aplica en dominio/UI.
UPDATE modos_provision_repuestos
SET activo = 1
WHERE codigo IN ('TERCERO', 'NO_APLICA');
