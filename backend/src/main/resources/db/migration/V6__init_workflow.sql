CREATE TABLE workflow_transiciones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    dominio VARCHAR(40) NOT NULL,
    tipo_tramite_id BIGINT UNSIGNED NULL,
    estado_origen_id BIGINT UNSIGNED NOT NULL,
    estado_destino_id BIGINT UNSIGNED NOT NULL,
    accion_codigo VARCHAR(60) NOT NULL,
    requiere_permiso_codigo VARCHAR(100) NULL,
    automatica TINYINT(1) NOT NULL DEFAULT 0,
    regla_json JSON NULL,
    active_from DATETIME NULL,
    active_to DATETIME NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    CONSTRAINT fk_workflow_transiciones_tipo_tramite FOREIGN KEY (tipo_tramite_id) REFERENCES tipos_tramite (id),
    CONSTRAINT fk_workflow_transiciones_estado_origen FOREIGN KEY (estado_origen_id) REFERENCES workflow_estados (id),
    CONSTRAINT fk_workflow_transiciones_estado_destino FOREIGN KEY (estado_destino_id) REFERENCES workflow_estados (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_estado_historial (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    dominio_estado VARCHAR(40) NOT NULL,
    estado_id BIGINT UNSIGNED NOT NULL,
    fecha_estado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_id BIGINT UNSIGNED NULL,
    automatico TINYINT(1) NOT NULL DEFAULT 0,
    motivo VARCHAR(255) NULL,
    detalle_json JSON NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_caso_estado_historial_caso FOREIGN KEY (caso_id) REFERENCES casos (id),
    CONSTRAINT fk_caso_estado_historial_estado FOREIGN KEY (estado_id) REFERENCES workflow_estados (id),
    CONSTRAINT fk_caso_estado_historial_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE auditoria_eventos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT UNSIGNED NULL,
    caso_id BIGINT UNSIGNED NULL,
    entidad_tipo VARCHAR(60) NOT NULL,
    entidad_id BIGINT UNSIGNED NULL,
    accion_codigo VARCHAR(60) NOT NULL,
    antes_json JSON NULL,
    despues_json JSON NULL,
    metadata_json JSON NULL,
    ip_origen VARCHAR(60) NULL,
    user_agent VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_auditoria_eventos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    CONSTRAINT fk_auditoria_eventos_caso FOREIGN KEY (caso_id) REFERENCES casos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO workflow_estados (codigo, dominio, nombre, descripcion, orden_visual, terminal)
VALUES
('INGRESADO', 'tramite', 'Ingresado', 'Caso creado', 1, 0),
('EN_TRAMITE', 'tramite', 'En tramite', 'Gestion en curso', 2, 0),
('CERRADO', 'tramite', 'Cerrado', 'Caso finalizado', 99, 1),
('SIN_TURNO', 'reparacion', 'Sin turno', 'Todavia no hay turno asignado', 1, 0),
('CON_TURNO', 'reparacion', 'Con turno', 'Turno asignado', 2, 0),
('REPARADO', 'reparacion', 'Reparado', 'Reparacion finalizada', 99, 1);

INSERT INTO workflow_transiciones (dominio, tipo_tramite_id, estado_origen_id, estado_destino_id, accion_codigo, requiere_permiso_codigo, automatica, activo)
VALUES
('tramite', NULL, 1, 2, 'tramite.avanzar', 'workflow.transicionar', 0, 1),
('tramite', NULL, 2, 3, 'tramite.cerrar', 'workflow.transicionar', 0, 1),
('reparacion', NULL, 4, 5, 'reparacion.asignar_turno', 'workflow.transicionar', 0, 1),
('reparacion', NULL, 5, 6, 'reparacion.cerrar', 'workflow.transicionar', 0, 1);
