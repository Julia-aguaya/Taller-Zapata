CREATE TABLE tipos_notificacion (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE notificaciones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT UNSIGNED NOT NULL,
    caso_id BIGINT UNSIGNED NULL,
    tipo_codigo VARCHAR(40) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    leida TINYINT(1) NOT NULL DEFAULT 0,
    leida_at DATETIME NULL,
    accion_url VARCHAR(500) NULL,
    entidad_tipo VARCHAR(60) NULL,
    entidad_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_notificaciones_usuario_leida (usuario_id, leida, created_at DESC),
    KEY idx_notificaciones_caso (caso_id),
    CONSTRAINT fk_notificaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    CONSTRAINT fk_notificaciones_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_notificaciones_tipo FOREIGN KEY (tipo_codigo) REFERENCES tipos_notificacion (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO tipos_notificacion (codigo, nombre, activo) VALUES
('TURNO_ASIGNADO', 'Turno asignado', 1),
('PRESUPUESTO_APROBADO', 'Presupuesto aprobado', 1),
('PRESUPUESTO_RECHAZADO', 'Presupuesto rechazado', 1),
('REPUESTO_RECIBIDO', 'Repuesto recibido', 1),
('VEHICULO_LISTO', 'Vehiculo listo', 1),
('PAGO_REGISTRADO', 'Pago registrado', 1),
('DOCUMENTO_SUBIDO', 'Documento subido', 1),
('CASO_TRANSFERIDO', 'Caso transferido', 1),
('RECORDATORIO', 'Recordatorio', 1);

INSERT INTO permisos (id, codigo, nombre, modulo, descripcion) VALUES
(37, 'notificacion.ver', 'Ver notificaciones', 'notification', 'Permite consultar notificaciones'),
(38, 'notificacion.crear', 'Crear notificaciones', 'notification', 'Permite crear notificaciones');

INSERT INTO rol_permisos (id, rol_id, permiso_id, allow_flag) VALUES
(70, 1, 37, TRUE),
(71, 1, 38, TRUE),
(72, 2, 37, TRUE),
(73, 2, 38, TRUE);
