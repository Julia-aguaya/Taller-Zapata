CREATE TABLE estados_turno_reparacion (
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE estados_tarea (
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    terminal TINYINT(1) NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE prioridades_tarea (
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    orden_visual INT NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE turnos_reparacion (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    caso_id BIGINT UNSIGNED NOT NULL,
    fecha_turno DATE NOT NULL,
    hora_turno TIME NOT NULL,
    dias_estimados INT NULL,
    fecha_salida_estimada DATE NULL,
    estado_codigo VARCHAR(30) NOT NULL,
    es_reingreso TINYINT(1) NOT NULL DEFAULT 0,
    notas TEXT NULL,
    usuario_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_turnos_reparacion_public_id (public_id),
    KEY idx_turnos_reparacion_caso_fecha (caso_id, fecha_turno),
    KEY idx_turnos_reparacion_usuario_estado (usuario_id, estado_codigo),
    CONSTRAINT fk_turnos_reparacion_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_turnos_reparacion_estado FOREIGN KEY (estado_codigo) REFERENCES estados_turno_reparacion (codigo),
    CONSTRAINT fk_turnos_reparacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE tareas (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    caso_id BIGINT UNSIGNED NULL,
    organizacion_id BIGINT UNSIGNED NOT NULL,
    sucursal_id BIGINT UNSIGNED NULL,
    modulo_origen_codigo VARCHAR(50) NULL,
    subtab_origen_codigo VARCHAR(50) NULL,
    titulo VARCHAR(160) NOT NULL,
    descripcion TEXT NULL,
    fecha_limite DATE NULL,
    prioridad_codigo VARCHAR(30) NOT NULL,
    estado_codigo VARCHAR(30) NOT NULL,
    usuario_asignado_id BIGINT UNSIGNED NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    resuelta TINYINT(1) NOT NULL DEFAULT 0,
    resuelta_at DATETIME NULL,
    payload_json TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tareas_public_id (public_id),
    KEY idx_tareas_scope_estado (organizacion_id, sucursal_id, estado_codigo),
    KEY idx_tareas_asignado_estado_limite (usuario_asignado_id, estado_codigo, fecha_limite),
    KEY idx_tareas_caso (caso_id),
    CONSTRAINT fk_tareas_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_tareas_organizacion FOREIGN KEY (organizacion_id) REFERENCES organizaciones (id),
    CONSTRAINT fk_tareas_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales (id),
    CONSTRAINT fk_tareas_prioridad FOREIGN KEY (prioridad_codigo) REFERENCES prioridades_tarea (codigo),
    CONSTRAINT fk_tareas_estado FOREIGN KEY (estado_codigo) REFERENCES estados_tarea (codigo),
    CONSTRAINT fk_tareas_asignado FOREIGN KEY (usuario_asignado_id) REFERENCES usuarios (id),
    CONSTRAINT fk_tareas_created_by FOREIGN KEY (created_by) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO estados_turno_reparacion (codigo, nombre, activo)
VALUES
('PENDIENTE', 'Pendiente', 1),
('REPROGRAMADO', 'Reprogramado', 1),
('CANCELADO', 'Cancelado', 1),
('CUMPLIDO', 'Cumplido', 1);

INSERT INTO estados_tarea (codigo, nombre, terminal, activo)
VALUES
('PENDIENTE', 'Pendiente', 0, 1),
('EN_PROGRESO', 'En progreso', 0, 1),
('RESUELTA', 'Resuelta', 1, 1),
('CANCELADA', 'Cancelada', 1, 1);

INSERT INTO prioridades_tarea (codigo, nombre, orden_visual, activo)
VALUES
('BAJA', 'Baja', 1, 1),
('MEDIA', 'Media', 2, 1),
('ALTA', 'Alta', 3, 1),
('URGENTE', 'Urgente', 4, 1);

INSERT INTO permisos (codigo, nombre, modulo, descripcion)
VALUES
('turno.ver', 'Ver turnos', 'operation', 'Permite consultar turnos de reparacion'),
('turno.crear', 'Crear turnos', 'operation', 'Permite crear turnos de reparacion'),
('turno.editar', 'Editar turnos', 'operation', 'Permite actualizar turnos de reparacion'),
('tarea.ver', 'Ver tareas', 'operation', 'Permite consultar tareas operativas'),
('tarea.crear', 'Crear tareas', 'operation', 'Permite crear tareas operativas'),
('tarea.editar', 'Editar tareas', 'operation', 'Permite actualizar tareas operativas');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 1, id, 1
FROM permisos
WHERE codigo IN ('turno.ver', 'turno.crear', 'turno.editar', 'tarea.ver', 'tarea.crear', 'tarea.editar');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 2, id, 1
FROM permisos
WHERE codigo IN ('turno.ver', 'turno.crear', 'turno.editar', 'tarea.ver', 'tarea.crear', 'tarea.editar');
