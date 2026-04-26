CREATE TABLE combustibles_vehiculo (
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE tipos_ingreso_item (
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE estados_ingreso_item (
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE estados_reingreso (
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE ingresos_vehiculo (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    caso_id BIGINT UNSIGNED NOT NULL,
    turno_id BIGINT UNSIGNED NULL,
    vehiculo_id BIGINT UNSIGNED NOT NULL,
    fecha_ingreso DATETIME NOT NULL,
    recibido_por_usuario_id BIGINT UNSIGNED NOT NULL,
    persona_entrega_id BIGINT UNSIGNED NULL,
    kilometraje_ingreso INT NULL,
    combustible_codigo VARCHAR(30) NULL,
    fecha_salida_estimada DATE NULL,
    con_observaciones TINYINT(1) NOT NULL DEFAULT 0,
    detalle_observaciones TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ingresos_vehiculo_public_id (public_id),
    KEY idx_ingresos_vehiculo_caso_fecha (caso_id, fecha_ingreso),
    KEY idx_ingresos_vehiculo_turno (turno_id),
    CONSTRAINT fk_ingresos_vehiculo_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_ingresos_vehiculo_turno FOREIGN KEY (turno_id) REFERENCES turnos_reparacion (id),
    CONSTRAINT fk_ingresos_vehiculo_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id),
    CONSTRAINT fk_ingresos_vehiculo_recibido_por FOREIGN KEY (recibido_por_usuario_id) REFERENCES usuarios (id),
    CONSTRAINT fk_ingresos_vehiculo_persona_entrega FOREIGN KEY (persona_entrega_id) REFERENCES personas (id),
    CONSTRAINT fk_ingresos_vehiculo_combustible FOREIGN KEY (combustible_codigo) REFERENCES combustibles_vehiculo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE ingreso_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ingreso_id BIGINT UNSIGNED NOT NULL,
    tipo_item_codigo VARCHAR(30) NOT NULL,
    detalle VARCHAR(255) NOT NULL,
    estado_codigo VARCHAR(30) NOT NULL,
    referencia_media VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ingreso_items_ingreso (ingreso_id),
    CONSTRAINT fk_ingreso_items_ingreso FOREIGN KEY (ingreso_id) REFERENCES ingresos_vehiculo (id) ON DELETE CASCADE,
    CONSTRAINT fk_ingreso_items_tipo FOREIGN KEY (tipo_item_codigo) REFERENCES tipos_ingreso_item (codigo),
    CONSTRAINT fk_ingreso_items_estado FOREIGN KEY (estado_codigo) REFERENCES estados_ingreso_item (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE egresos_vehiculo (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    caso_id BIGINT UNSIGNED NOT NULL,
    ingreso_id BIGINT UNSIGNED NOT NULL,
    turno_reingreso_id BIGINT UNSIGNED NULL,
    fecha_egreso DATETIME NOT NULL,
    entregado_por_usuario_id BIGINT UNSIGNED NOT NULL,
    persona_recibe_id BIGINT UNSIGNED NULL,
    egreso_definitivo TINYINT(1) NOT NULL DEFAULT 0,
    debe_reingresar TINYINT(1) NOT NULL DEFAULT 0,
    fecha_reingreso_prevista DATE NULL,
    dias_estimados_reingreso INT NULL,
    estado_reingreso_codigo VARCHAR(30) NULL,
    fotos_reparado_cargadas TINYINT(1) NOT NULL DEFAULT 0,
    notas TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_egresos_vehiculo_public_id (public_id),
    UNIQUE KEY uq_egresos_vehiculo_ingreso (ingreso_id),
    KEY idx_egresos_vehiculo_caso_fecha (caso_id, fecha_egreso),
    CONSTRAINT fk_egresos_vehiculo_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_egresos_vehiculo_ingreso FOREIGN KEY (ingreso_id) REFERENCES ingresos_vehiculo (id) ON DELETE CASCADE,
    CONSTRAINT fk_egresos_vehiculo_turno_reingreso FOREIGN KEY (turno_reingreso_id) REFERENCES turnos_reparacion (id),
    CONSTRAINT fk_egresos_vehiculo_entregado_por FOREIGN KEY (entregado_por_usuario_id) REFERENCES usuarios (id),
    CONSTRAINT fk_egresos_vehiculo_persona_recibe FOREIGN KEY (persona_recibe_id) REFERENCES personas (id),
    CONSTRAINT fk_egresos_vehiculo_estado_reingreso FOREIGN KEY (estado_reingreso_codigo) REFERENCES estados_reingreso (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO combustibles_vehiculo (codigo, nombre, activo)
VALUES
('VACIO', 'Vacio', 1),
('RESERVA', 'Reserva', 1),
('MEDIO', 'Medio tanque', 1),
('LLENO', 'Lleno', 1);

INSERT INTO tipos_ingreso_item (codigo, nombre, activo)
VALUES
('ACCESORIO', 'Accesorio', 1),
('DANO_PREEXISTENTE', 'Dano preexistente', 1),
('FALTANTE', 'Faltante', 1),
('OBSERVACION', 'Observacion', 1);

INSERT INTO estados_ingreso_item (codigo, nombre, activo)
VALUES
('OK', 'OK', 1),
('OBSERVADO', 'Observado', 1),
('FALTANTE', 'Faltante', 1),
('DANADO', 'Danado', 1);

INSERT INTO estados_reingreso (codigo, nombre, activo)
VALUES
('PENDIENTE', 'Pendiente', 1),
('AGENDADO', 'Agendado', 1),
('REINGRESADO', 'Reingresado', 1),
('CANCELADO', 'Cancelado', 1);

INSERT INTO permisos (codigo, nombre, modulo, descripcion)
VALUES
('ingreso.ver', 'Ver ingresos', 'operation', 'Permite consultar ingresos de vehiculos'),
('ingreso.crear', 'Crear ingresos', 'operation', 'Permite registrar ingresos de vehiculos'),
('egreso.ver', 'Ver egresos', 'operation', 'Permite consultar egresos de vehiculos'),
('egreso.crear', 'Crear egresos', 'operation', 'Permite registrar egresos de vehiculos');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 1, id, 1
FROM permisos
WHERE codigo IN ('ingreso.ver', 'ingreso.crear', 'egreso.ver', 'egreso.crear');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 2, id, 1
FROM permisos
WHERE codigo IN ('ingreso.ver', 'ingreso.crear', 'egreso.ver', 'egreso.crear');
