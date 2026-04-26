CREATE TABLE workflow_estados (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL,
    dominio VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    descripcion VARCHAR(255) NULL,
    orden_visual INT NOT NULL DEFAULT 0,
    terminal TINYINT(1) NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_workflow_estados_dominio_codigo (dominio, codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE casos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    codigo_carpeta VARCHAR(50) NOT NULL,
    numero_orden BIGINT UNSIGNED NOT NULL,
    tipo_tramite_id BIGINT UNSIGNED NOT NULL,
    organizacion_id BIGINT UNSIGNED NOT NULL,
    sucursal_id BIGINT UNSIGNED NOT NULL,
    vehiculo_principal_id BIGINT UNSIGNED NULL,
    cliente_principal_persona_id BIGINT UNSIGNED NULL,
    referenciado TINYINT(1) NOT NULL DEFAULT 0,
    referido_por_persona_id BIGINT UNSIGNED NULL,
    referido_por_texto VARCHAR(180) NULL,
    usuario_creador_id BIGINT UNSIGNED NOT NULL,
    estado_tramite_actual_id BIGINT UNSIGNED NULL,
    estado_reparacion_actual_id BIGINT UNSIGNED NULL,
    prioridad_codigo VARCHAR(30) NULL,
    fecha_cierre DATETIME NULL,
    observaciones_generales TEXT NULL,
    archived_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_casos_public_id (public_id),
    UNIQUE KEY uq_casos_codigo_carpeta (codigo_carpeta),
    UNIQUE KEY uq_casos_org_numero_orden (organizacion_id, numero_orden),
    CONSTRAINT fk_casos_tipo_tramite FOREIGN KEY (tipo_tramite_id) REFERENCES tipos_tramite (id),
    CONSTRAINT fk_casos_organizacion FOREIGN KEY (organizacion_id) REFERENCES organizaciones (id),
    CONSTRAINT fk_casos_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales (id),
    CONSTRAINT fk_casos_vehiculo_principal FOREIGN KEY (vehiculo_principal_id) REFERENCES vehiculos (id),
    CONSTRAINT fk_casos_cliente_principal FOREIGN KEY (cliente_principal_persona_id) REFERENCES personas (id),
    CONSTRAINT fk_casos_referido_por FOREIGN KEY (referido_por_persona_id) REFERENCES personas (id),
    CONSTRAINT fk_casos_usuario_creador FOREIGN KEY (usuario_creador_id) REFERENCES usuarios (id),
    CONSTRAINT fk_casos_estado_tramite_actual FOREIGN KEY (estado_tramite_actual_id) REFERENCES workflow_estados (id),
    CONSTRAINT fk_casos_estado_reparacion_actual FOREIGN KEY (estado_reparacion_actual_id) REFERENCES workflow_estados (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_personas (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    persona_id BIGINT UNSIGNED NOT NULL,
    rol_caso_codigo VARCHAR(50) NOT NULL,
    vehiculo_id BIGINT UNSIGNED NULL,
    es_principal TINYINT(1) NOT NULL DEFAULT 0,
    notas VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_caso_personas_caso FOREIGN KEY (caso_id) REFERENCES casos (id),
    CONSTRAINT fk_caso_personas_persona FOREIGN KEY (persona_id) REFERENCES personas (id),
    CONSTRAINT fk_caso_personas_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_vehiculos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    vehiculo_id BIGINT UNSIGNED NOT NULL,
    rol_vehiculo_codigo VARCHAR(40) NOT NULL,
    es_principal TINYINT(1) NOT NULL DEFAULT 0,
    orden_visual INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_vehiculos (caso_id, vehiculo_id, rol_vehiculo_codigo),
    CONSTRAINT fk_caso_vehiculos_caso FOREIGN KEY (caso_id) REFERENCES casos (id),
    CONSTRAINT fk_caso_vehiculos_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_relaciones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_origen_id BIGINT UNSIGNED NOT NULL,
    caso_destino_id BIGINT UNSIGNED NOT NULL,
    tipo_relacion_codigo VARCHAR(40) NOT NULL,
    descripcion VARCHAR(255) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_relaciones (caso_origen_id, caso_destino_id, tipo_relacion_codigo),
    CONSTRAINT fk_caso_relaciones_origen FOREIGN KEY (caso_origen_id) REFERENCES casos (id),
    CONSTRAINT fk_caso_relaciones_destino FOREIGN KEY (caso_destino_id) REFERENCES casos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_siniestro (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    fecha_siniestro DATE NULL,
    hora_siniestro TIME NULL,
    lugar VARCHAR(255) NULL,
    dinamica TEXT NULL,
    observaciones TEXT NULL,
    fecha_prescripcion DATE NULL,
    dias_tramitando INT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_siniestro_caso (caso_id),
    CONSTRAINT fk_caso_siniestro_caso FOREIGN KEY (caso_id) REFERENCES casos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
