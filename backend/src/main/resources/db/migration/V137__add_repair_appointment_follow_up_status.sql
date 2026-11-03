ALTER TABLE turnos_reparacion
    ADD COLUMN seguimiento_confirmacion_codigo VARCHAR(30) NULL;

CREATE INDEX idx_turnos_reparacion_seguimiento_confirmacion
    ON turnos_reparacion (seguimiento_confirmacion_codigo);
