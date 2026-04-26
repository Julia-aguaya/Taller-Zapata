CREATE TABLE personas (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    tipo_persona ENUM('fisica', 'juridica') NOT NULL,
    nombre VARCHAR(120) NULL,
    apellido VARCHAR(120) NULL,
    razon_social VARCHAR(200) NULL,
    nombre_mostrar VARCHAR(220) NOT NULL,
    tipo_documento_codigo VARCHAR(20) NULL,
    numero_documento VARCHAR(30) NULL,
    numero_documento_normalizado VARCHAR(30) NULL,
    cuit_cuil VARCHAR(20) NULL,
    fecha_nacimiento DATE NULL,
    telefono_principal VARCHAR(50) NULL,
    email_principal VARCHAR(150) NULL,
    ocupacion VARCHAR(120) NULL,
    observaciones TEXT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_personas_public_id (public_id),
    UNIQUE KEY uq_personas_documento (tipo_documento_codigo, numero_documento_normalizado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE persona_contactos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    persona_id BIGINT UNSIGNED NOT NULL,
    tipo_contacto_codigo VARCHAR(30) NOT NULL,
    valor VARCHAR(200) NOT NULL,
    principal TINYINT(1) NOT NULL DEFAULT 0,
    validado TINYINT(1) NOT NULL DEFAULT 0,
    observaciones VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_persona_contactos_persona FOREIGN KEY (persona_id) REFERENCES personas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE persona_domicilios (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    persona_id BIGINT UNSIGNED NOT NULL,
    tipo_domicilio_codigo VARCHAR(30) NOT NULL,
    calle VARCHAR(150) NULL,
    numero VARCHAR(20) NULL,
    piso VARCHAR(20) NULL,
    depto VARCHAR(20) NULL,
    localidad VARCHAR(100) NULL,
    provincia VARCHAR(100) NULL,
    codigo_postal VARCHAR(20) NULL,
    pais_codigo VARCHAR(10) NULL,
    principal TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_persona_domicilios_persona FOREIGN KEY (persona_id) REFERENCES personas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
