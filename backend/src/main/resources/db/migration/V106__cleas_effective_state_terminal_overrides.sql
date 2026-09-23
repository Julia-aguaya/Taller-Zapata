ALTER TABLE cleas_effective_state ADD COLUMN tramite_terminal_override_codigo VARCHAR(40) NULL;
ALTER TABLE cleas_effective_state ADD COLUMN reparacion_terminal_override_codigo VARCHAR(40) NULL;
ALTER TABLE cleas_effective_state ADD CONSTRAINT chk_cleas_effective_state_tramite_override
    CHECK (tramite_terminal_override_codigo IS NULL OR tramite_terminal_override_codigo IN ('RECHAZADO', 'DESISTIDO'));
ALTER TABLE cleas_effective_state ADD CONSTRAINT chk_cleas_effective_state_reparacion_override
    CHECK (reparacion_terminal_override_codigo IS NULL OR reparacion_terminal_override_codigo IN ('RECHAZADO', 'DESISTIDO'));

ALTER TABLE cleas_effective_state_history ADD COLUMN override_dimension VARCHAR(20) NULL;
ALTER TABLE cleas_effective_state_history ADD COLUMN override_prior_codigo VARCHAR(40) NULL;
ALTER TABLE cleas_effective_state_history ADD COLUMN override_new_codigo VARCHAR(40) NULL;
ALTER TABLE cleas_effective_state_history ADD CONSTRAINT chk_cleas_effective_state_history_tramite_override
    CHECK (override_dimension <> 'TRAMITE' OR override_new_codigo IS NULL OR override_new_codigo IN ('RECHAZADO', 'DESISTIDO'));
ALTER TABLE cleas_effective_state_history ADD CONSTRAINT chk_cleas_effective_state_history_reparacion_override
    CHECK (override_dimension <> 'REPARACION' OR override_new_codigo IS NULL OR override_new_codigo IN ('RECHAZADO', 'DESISTIDO'));
