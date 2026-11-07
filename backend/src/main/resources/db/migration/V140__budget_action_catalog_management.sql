ALTER TABLE acciones_presupuesto
    ADD COLUMN nombre_normalizado VARCHAR(120) NOT NULL DEFAULT '';

UPDATE acciones_presupuesto
SET nombre_normalizado = LOWER(TRIM(nombre));

ALTER TABLE acciones_presupuesto
    ADD CONSTRAINT uq_acciones_presupuesto_nombre_normalizado UNIQUE (nombre_normalizado);

INSERT INTO permisos (codigo, nombre, modulo, descripcion)
VALUES ('presupuesto.catalogo.gestionar', 'Gestionar catálogo de acciones de presupuesto', 'budget', 'Permite agregar tipos de acción reutilizables para presupuestos');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT r.id, p.id, 1
FROM roles r
JOIN permisos p ON p.codigo = 'presupuesto.catalogo.gestionar'
WHERE r.codigo = 'ROLE_ADMIN';
