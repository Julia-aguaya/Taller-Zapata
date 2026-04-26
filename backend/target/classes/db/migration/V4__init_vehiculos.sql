CREATE TABLE marcas_vehiculo (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_marcas_vehiculo_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE modelos_vehiculo (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    marca_id BIGINT UNSIGNED NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_modelos_vehiculo_marca_codigo (marca_id, codigo),
    CONSTRAINT fk_modelos_vehiculo_marca FOREIGN KEY (marca_id) REFERENCES marcas_vehiculo (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE vehiculos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    marca_id BIGINT UNSIGNED NULL,
    modelo_id BIGINT UNSIGNED NULL,
    marca_texto VARCHAR(120) NULL,
    modelo_texto VARCHAR(120) NULL,
    dominio VARCHAR(20) NULL,
    dominio_normalizado VARCHAR(20) NULL,
    anio SMALLINT NULL,
    tipo_vehiculo_codigo VARCHAR(30) NULL,
    uso_codigo VARCHAR(30) NULL,
    color VARCHAR(80) NULL,
    pintura_codigo VARCHAR(30) NULL,
    chasis VARCHAR(80) NULL,
    motor VARCHAR(80) NULL,
    transmision_codigo VARCHAR(30) NULL,
    kilometraje INT NULL,
    observaciones TEXT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_vehiculos_public_id (public_id),
    UNIQUE KEY uq_vehiculos_dominio_normalizado (dominio_normalizado),
    CONSTRAINT fk_vehiculos_marca FOREIGN KEY (marca_id) REFERENCES marcas_vehiculo (id),
    CONSTRAINT fk_vehiculos_modelo FOREIGN KEY (modelo_id) REFERENCES modelos_vehiculo (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE vehiculo_personas (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    vehiculo_id BIGINT UNSIGNED NOT NULL,
    persona_id BIGINT UNSIGNED NOT NULL,
    rol_vehiculo_codigo VARCHAR(40) NOT NULL,
    es_actual TINYINT(1) NOT NULL DEFAULT 1,
    desde DATE NULL,
    hasta DATE NULL,
    notas VARCHAR(255) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_vehiculo_personas_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id),
    CONSTRAINT fk_vehiculo_personas_persona FOREIGN KEY (persona_id) REFERENCES personas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
