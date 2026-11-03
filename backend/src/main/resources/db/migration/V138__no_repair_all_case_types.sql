-- La decisión de no reparar también puede aplicarse a PARTICULAR. El estado del
-- trámite continúa siendo independiente y puede pasar por facturación/cobro.
ALTER TABLE particular_effective_state
    DROP CONSTRAINT chk_particular_effective_state_reparacion;
ALTER TABLE particular_effective_state
    ADD CONSTRAINT chk_particular_effective_state_reparacion
    CHECK (reparacion_codigo IN ('SIN_TURNO', 'EN_TRAMITE', 'DAR_TURNO', 'FALTAN_REPUESTOS', 'CON_TURNO', 'DEBE_REINGRESAR', 'REPARADO', 'NO_DEBE_REPARARSE', 'RECHAZADO', 'DESISTIDO'));

ALTER TABLE particular_effective_state
    DROP CONSTRAINT chk_particular_effective_state_reparacion_override;
ALTER TABLE particular_effective_state
    ADD CONSTRAINT chk_particular_effective_state_reparacion_override
    CHECK (reparacion_terminal_override_codigo IS NULL OR reparacion_terminal_override_codigo IN ('NO_DEBE_REPARARSE', 'RECHAZADO', 'DESISTIDO'));

ALTER TABLE particular_effective_state_history
    DROP CONSTRAINT chk_particular_effective_state_history_prior_reparacion;
ALTER TABLE particular_effective_state_history
    DROP CONSTRAINT chk_particular_effective_state_history_new_reparacion;
ALTER TABLE particular_effective_state_history
    DROP CONSTRAINT chk_particular_effective_state_history_reparacion_override;
ALTER TABLE particular_effective_state_history
    ADD CONSTRAINT chk_particular_effective_state_history_prior_reparacion
    CHECK (prior_reparacion_codigo IS NULL OR prior_reparacion_codigo IN ('SIN_TURNO', 'EN_TRAMITE', 'DAR_TURNO', 'FALTAN_REPUESTOS', 'CON_TURNO', 'DEBE_REINGRESAR', 'REPARADO', 'NO_DEBE_REPARARSE', 'RECHAZADO', 'DESISTIDO'));
ALTER TABLE particular_effective_state_history
    ADD CONSTRAINT chk_particular_effective_state_history_new_reparacion
    CHECK (new_reparacion_codigo IS NULL OR new_reparacion_codigo IN ('SIN_TURNO', 'EN_TRAMITE', 'DAR_TURNO', 'FALTAN_REPUESTOS', 'CON_TURNO', 'DEBE_REINGRESAR', 'REPARADO', 'NO_DEBE_REPARARSE', 'RECHAZADO', 'DESISTIDO'));
ALTER TABLE particular_effective_state_history
    ADD CONSTRAINT chk_particular_effective_state_history_reparacion_override
    CHECK (override_dimension <> 'REPARACION' OR override_new_codigo IS NULL OR override_new_codigo IN ('NO_DEBE_REPARARSE', 'RECHAZADO', 'DESISTIDO'));

INSERT INTO tipos_notificacion (codigo, nombre, activo)
SELECT 'NO_REPARA', 'Vehículo no debe repararse', 1
WHERE NOT EXISTS (SELECT 1 FROM tipos_notificacion WHERE codigo = 'NO_REPARA');
