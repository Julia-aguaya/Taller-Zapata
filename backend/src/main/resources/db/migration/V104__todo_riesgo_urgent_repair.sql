ALTER TABLE todo_riesgo_state_facts ADD COLUMN reparacion_urgente_activa TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE todo_riesgo_state_facts ADD COLUMN reparacion_urgente_motivo VARCHAR(255) NULL;
ALTER TABLE todo_riesgo_state_facts ADD COLUMN reparacion_urgente_fecha DATETIME NULL;
ALTER TABLE todo_riesgo_state_facts ADD COLUMN reparacion_urgente_actor_usuario_id BIGINT UNSIGNED NULL;
ALTER TABLE todo_riesgo_state_facts ADD CONSTRAINT fk_todo_riesgo_state_facts_reparacion_urgente_actor FOREIGN KEY (reparacion_urgente_actor_usuario_id) REFERENCES usuarios (id);
ALTER TABLE todo_riesgo_state_facts ADD CONSTRAINT chk_todo_riesgo_state_facts_reparacion_urgente CHECK (
    (reparacion_urgente_activa = 0) OR (reparacion_urgente_motivo IS NOT NULL AND reparacion_urgente_fecha IS NOT NULL AND reparacion_urgente_actor_usuario_id IS NOT NULL)
);

INSERT INTO tipos_notificacion (codigo, nombre, activo)
VALUES ('TODO_RIESGO_NO_REPARA', 'TODO_RIESGO no debe repararse', 1);
