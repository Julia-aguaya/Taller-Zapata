ALTER TABLE egresos_vehiculo
    ADD COLUMN turno_reingreso_id BIGINT UNSIGNED NULL AFTER ingreso_id,
    ADD CONSTRAINT fk_egresos_vehiculo_turno_reingreso FOREIGN KEY (turno_reingreso_id) REFERENCES turnos_reparacion (id);
