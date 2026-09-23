CREATE TABLE cleas_state_facts (
    caso_id BIGINT UNSIGNED NOT NULL,
    fecha_acuerdo DATE NULL,
    no_repara_activo TINYINT(1) NOT NULL DEFAULT 0,
    no_repara_motivo VARCHAR(255) NULL,
    no_repara_fecha DATETIME NULL,
    no_repara_actor_usuario_id BIGINT UNSIGNED NULL,
    no_repara_revertido_fecha DATETIME NULL,
    no_repara_revertido_actor_usuario_id BIGINT UNSIGNED NULL,
    no_repara_revertido_motivo VARCHAR(255) NULL,
    reparacion_urgente_activa TINYINT(1) NOT NULL DEFAULT 0,
    reparacion_urgente_motivo VARCHAR(255) NULL,
    reparacion_urgente_fecha DATETIME NULL,
    reparacion_urgente_actor_usuario_id BIGINT UNSIGNED NULL,
    PRIMARY KEY (caso_id),
    CONSTRAINT fk_cleas_state_facts_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_cleas_state_facts_no_repara_actor FOREIGN KEY (no_repara_actor_usuario_id) REFERENCES usuarios (id),
    CONSTRAINT fk_cleas_state_facts_no_repara_revertido_actor FOREIGN KEY (no_repara_revertido_actor_usuario_id) REFERENCES usuarios (id),
    CONSTRAINT fk_cleas_state_facts_reparacion_urgente_actor FOREIGN KEY (reparacion_urgente_actor_usuario_id) REFERENCES usuarios (id),
    CONSTRAINT chk_cleas_state_facts_no_repara CHECK ((no_repara_activo = 0) OR (no_repara_motivo IS NOT NULL AND no_repara_fecha IS NOT NULL AND no_repara_actor_usuario_id IS NOT NULL)),
    CONSTRAINT chk_cleas_state_facts_reparacion_urgente CHECK ((reparacion_urgente_activa = 0) OR (reparacion_urgente_motivo IS NOT NULL AND reparacion_urgente_fecha IS NOT NULL AND reparacion_urgente_actor_usuario_id IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cleas_effective_state (
    caso_id BIGINT UNSIGNED NOT NULL,
    tramite_codigo VARCHAR(40) NOT NULL,
    reparacion_codigo VARCHAR(40) NOT NULL,
    recalculated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (caso_id),
    CONSTRAINT fk_cleas_effective_state_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT chk_cleas_effective_state_tramite CHECK (tramite_codigo IN ('SIN_PRESENTAR', 'EN_TRAMITE', 'PRESENTADO_PD', 'ACORDADO', 'PASADO_A_PAGOS', 'PAGADO')),
    CONSTRAINT chk_cleas_effective_state_reparacion CHECK (reparacion_codigo IN ('EN_TRAMITE', 'DAR_TURNO', 'FALTAN_REPUESTOS', 'CON_TURNO', 'DEBE_REINGRESAR', 'REPARADO', 'NO_DEBE_REPARARSE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cleas_effective_state_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    prior_tramite_codigo VARCHAR(40) NULL,
    new_tramite_codigo VARCHAR(40) NOT NULL,
    prior_reparacion_codigo VARCHAR(40) NULL,
    new_reparacion_codigo VARCHAR(40) NOT NULL,
    cause VARCHAR(80) NOT NULL,
    actor_usuario_id BIGINT UNSIGNED NULL,
    reason VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_cleas_effective_state_history_caso_created (caso_id, created_at, id),
    CONSTRAINT fk_cleas_effective_state_history_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_cleas_effective_state_history_actor FOREIGN KEY (actor_usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO tipos_notificacion (codigo, nombre, activo)
VALUES ('CLEAS_NO_REPARA', 'CLEAS no debe repararse', 1);
