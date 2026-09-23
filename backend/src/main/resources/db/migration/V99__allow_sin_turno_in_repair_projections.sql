ALTER TABLE particular_effective_state
    DROP CONSTRAINT chk_particular_effective_state_reparacion;
ALTER TABLE particular_effective_state
    ADD CONSTRAINT chk_particular_effective_state_reparacion
    CHECK (reparacion_codigo IN ('SIN_TURNO', 'EN_TRAMITE', 'DAR_TURNO', 'FALTAN_REPUESTOS', 'CON_TURNO', 'DEBE_REINGRESAR', 'REPARADO', 'RECHAZADO', 'DESISTIDO'));

ALTER TABLE particular_effective_state_history
    DROP CONSTRAINT chk_particular_effective_state_history_prior_reparacion;
ALTER TABLE particular_effective_state_history
    DROP CONSTRAINT chk_particular_effective_state_history_new_reparacion;
ALTER TABLE particular_effective_state_history
    ADD CONSTRAINT chk_particular_effective_state_history_prior_reparacion
    CHECK (prior_reparacion_codigo IS NULL OR prior_reparacion_codigo IN ('SIN_TURNO', 'EN_TRAMITE', 'DAR_TURNO', 'FALTAN_REPUESTOS', 'CON_TURNO', 'DEBE_REINGRESAR', 'REPARADO', 'RECHAZADO', 'DESISTIDO'));
ALTER TABLE particular_effective_state_history
    ADD CONSTRAINT chk_particular_effective_state_history_new_reparacion
    CHECK (new_reparacion_codigo IS NULL OR new_reparacion_codigo IN ('SIN_TURNO', 'EN_TRAMITE', 'DAR_TURNO', 'FALTAN_REPUESTOS', 'CON_TURNO', 'DEBE_REINGRESAR', 'REPARADO', 'RECHAZADO', 'DESISTIDO'));

ALTER TABLE todo_riesgo_effective_state
    DROP CONSTRAINT chk_todo_riesgo_effective_state_reparacion;
ALTER TABLE todo_riesgo_effective_state
    ADD CONSTRAINT chk_todo_riesgo_effective_state_reparacion
    CHECK (reparacion_codigo IN ('SIN_TURNO', 'EN_TRAMITE', 'DAR_TURNO', 'FALTAN_REPUESTOS', 'CON_TURNO', 'DEBE_REINGRESAR', 'REPARADO', 'NO_DEBE_REPARARSE'));

ALTER TABLE todo_riesgo_effective_state_history
    DROP CONSTRAINT chk_todo_riesgo_effective_state_history_new_reparacion;
ALTER TABLE todo_riesgo_effective_state_history
    ADD CONSTRAINT chk_todo_riesgo_effective_state_history_new_reparacion
    CHECK (new_reparacion_codigo IN ('SIN_TURNO', 'EN_TRAMITE', 'DAR_TURNO', 'FALTAN_REPUESTOS', 'CON_TURNO', 'DEBE_REINGRESAR', 'REPARADO', 'NO_DEBE_REPARARSE'));
