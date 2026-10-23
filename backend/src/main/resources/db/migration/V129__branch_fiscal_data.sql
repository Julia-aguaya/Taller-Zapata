-- Cada sucursal es una entidad legal propia: CUIT y condición de IVA viven en la sucursal.
ALTER TABLE sucursales ADD COLUMN cuit VARCHAR(20) NULL;
ALTER TABLE sucursales ADD COLUMN condicion_iva VARCHAR(50) NULL;
ALTER TABLE sucursales ADD COLUMN whatsapp VARCHAR(50) NULL;

-- La sucursal 'Centro' pasa a llamarse 'Casablanca'.
UPDATE sucursales SET nombre = 'Casablanca' WHERE codigo = 'C';

-- Data real por sucursal.
UPDATE sucursales
SET cuit = '30-71877589-9',
    condicion_iva = 'Responsable Inscripto',
    direccion_linea1 = 'Pje. Casablanca 2537',
    telefono = '3414320467',
    whatsapp = '3415151270',
    email = 'administracion@tallereszapata.com'
WHERE codigo = 'Z';

UPDATE sucursales
SET cuit = '27-30891638-9',
    condicion_iva = 'Monotributista',
    direccion_linea1 = 'Pje. Casablanca 2520',
    telefono = NULL,
    whatsapp = '3415151270',
    email = 'casablanca@tallereszapata.com'
WHERE codigo = 'C';

-- El CUIT/IVA dejan de ser de la organización: la razón social se mantiene compartida a nivel org.
ALTER TABLE organizaciones DROP COLUMN cuit;
ALTER TABLE organizaciones DROP COLUMN condicion_iva;
