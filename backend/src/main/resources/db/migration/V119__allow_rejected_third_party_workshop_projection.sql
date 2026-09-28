ALTER TABLE todo_riesgo_effective_state
    DROP CONSTRAINT chk_todo_riesgo_effective_state_tramite;
ALTER TABLE todo_riesgo_effective_state
    ADD CONSTRAINT chk_todo_riesgo_effective_state_tramite
    CHECK (tramite_codigo IN ('SIN_PRESENTAR', 'EN_TRAMITE', 'PRESENTADO_PD', 'ACORDADO', 'PASADO_A_PAGOS', 'PAGADO', 'RECHAZADO'));

ALTER TABLE todo_riesgo_effective_state_history
    DROP CONSTRAINT chk_todo_riesgo_effective_state_history_new_tramite;
ALTER TABLE todo_riesgo_effective_state_history
    ADD CONSTRAINT chk_todo_riesgo_effective_state_history_new_tramite
    CHECK (new_tramite_codigo IN ('SIN_PRESENTAR', 'EN_TRAMITE', 'PRESENTADO_PD', 'ACORDADO', 'PASADO_A_PAGOS', 'PAGADO', 'RECHAZADO'));
