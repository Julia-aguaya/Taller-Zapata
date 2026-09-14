ALTER TABLE caso_cleas
    ADD COLUMN dominio_tercero VARCHAR(20) NULL;

UPDATE caso_cleas
SET dominio_tercero = (
    SELECT vehicle.dominio_normalizado
    FROM caso_vehiculos relation
    JOIN vehiculos vehicle ON vehicle.id = relation.vehiculo_id
    WHERE relation.caso_id = caso_cleas.caso_id
      AND relation.rol_vehiculo_codigo = 'TERCERO'
      AND vehicle.dominio_normalizado IS NOT NULL
    ORDER BY relation.id
    LIMIT 1
)
WHERE dominio_tercero IS NULL
  AND EXISTS (
      SELECT 1
      FROM caso_vehiculos relation
      JOIN vehiculos vehicle ON vehicle.id = relation.vehiculo_id
      WHERE relation.caso_id = caso_cleas.caso_id
        AND relation.rol_vehiculo_codigo = 'TERCERO'
        AND vehicle.dominio_normalizado IS NOT NULL
  );
