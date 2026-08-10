CREATE TABLE todo_riesgo_state_facts (
    caso_id BIGINT UNSIGNED NOT NULL,
    fecha_acuerdo DATE NULL,
    fecha_pasado_a_pagos DATE NULL,
    fecha_pago DATE NULL,
    no_repara_activo TINYINT(1) NOT NULL DEFAULT 0,
    no_repara_motivo VARCHAR(255) NULL,
    no_repara_fecha DATETIME NULL,
    no_repara_actor_usuario_id BIGINT UNSIGNED NULL,
    no_repara_revertido_fecha DATETIME NULL,
    no_repara_revertido_actor_usuario_id BIGINT UNSIGNED NULL,
    no_repara_revertido_motivo VARCHAR(255) NULL,
    PRIMARY KEY (caso_id),
    CONSTRAINT fk_todo_riesgo_state_facts_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_todo_riesgo_state_facts_no_repara_actor FOREIGN KEY (no_repara_actor_usuario_id) REFERENCES usuarios (id),
    CONSTRAINT fk_todo_riesgo_state_facts_no_repara_revertido_actor FOREIGN KEY (no_repara_revertido_actor_usuario_id) REFERENCES usuarios (id),
    CONSTRAINT chk_todo_riesgo_state_facts_no_repara CHECK (
        (no_repara_activo = 0) OR (no_repara_motivo IS NOT NULL AND no_repara_fecha IS NOT NULL AND no_repara_actor_usuario_id IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE todo_riesgo_effective_state (
    caso_id BIGINT UNSIGNED NOT NULL,
    tramite_codigo VARCHAR(40) NOT NULL,
    reparacion_codigo VARCHAR(40) NOT NULL,
    reparacion_terminal_override_codigo VARCHAR(40) NULL,
    egreso_origen_id BIGINT UNSIGNED NULL,
    turno_reingreso_origen_id BIGINT UNSIGNED NULL,
    recalculated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (caso_id),
    CONSTRAINT fk_todo_riesgo_effective_state_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT chk_todo_riesgo_effective_state_tramite CHECK (tramite_codigo IN ('SIN_PRESENTAR', 'EN_TRAMITE', 'PRESENTADO_PD', 'ACORDADO', 'PASADO_A_PAGOS', 'PAGADO')),
    CONSTRAINT chk_todo_riesgo_effective_state_reparacion CHECK (reparacion_codigo IN ('EN_TRAMITE', 'DAR_TURNO', 'FALTAN_REPUESTOS', 'CON_TURNO', 'DEBE_REINGRESAR', 'REPARADO', 'NO_DEBE_REPARARSE')),
    CONSTRAINT chk_todo_riesgo_effective_state_reparacion_override CHECK (reparacion_terminal_override_codigo IS NULL OR reparacion_terminal_override_codigo = 'NO_DEBE_REPARARSE')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE todo_riesgo_effective_state_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    prior_tramite_codigo VARCHAR(40) NULL,
    new_tramite_codigo VARCHAR(40) NOT NULL,
    prior_reparacion_codigo VARCHAR(40) NULL,
    new_reparacion_codigo VARCHAR(40) NOT NULL,
    change_scope VARCHAR(20) NOT NULL,
    cause VARCHAR(80) NOT NULL,
    actor_usuario_id BIGINT UNSIGNED NULL,
    reason VARCHAR(255) NULL,
    override_dimension VARCHAR(20) NULL,
    override_prior_codigo VARCHAR(40) NULL,
    override_new_codigo VARCHAR(40) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_todo_riesgo_effective_state_history_caso_created (caso_id, created_at, id),
    CONSTRAINT fk_todo_riesgo_effective_state_history_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_todo_riesgo_effective_state_history_actor FOREIGN KEY (actor_usuario_id) REFERENCES usuarios (id),
    CONSTRAINT chk_todo_riesgo_effective_state_history_scope CHECK (change_scope IN ('TRAMITE', 'REPARACION', 'DUAL', 'OVERRIDE', 'REVERT')),
    CONSTRAINT chk_todo_riesgo_effective_state_history_new_tramite CHECK (new_tramite_codigo IN ('SIN_PRESENTAR', 'EN_TRAMITE', 'PRESENTADO_PD', 'ACORDADO', 'PASADO_A_PAGOS', 'PAGADO')),
    CONSTRAINT chk_todo_riesgo_effective_state_history_new_reparacion CHECK (new_reparacion_codigo IN ('EN_TRAMITE', 'DAR_TURNO', 'FALTAN_REPUESTOS', 'CON_TURNO', 'DEBE_REINGRESAR', 'REPARADO', 'NO_DEBE_REPARARSE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
