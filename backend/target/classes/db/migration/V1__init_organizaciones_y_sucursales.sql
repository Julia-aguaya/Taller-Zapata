CREATE TABLE organizaciones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    razon_social VARCHAR(200) NULL,
    cuit VARCHAR(20) NULL,
    condicion_iva VARCHAR(50) NULL,
    telefono VARCHAR(50) NULL,
    email VARCHAR(150) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_organizaciones_public_id (public_id),
    UNIQUE KEY uq_organizaciones_codigo (codigo),
    UNIQUE KEY uq_organizaciones_cuit (cuit)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE sucursales (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    organizacion_id BIGINT UNSIGNED NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    direccion_linea1 VARCHAR(200) NULL,
    ciudad VARCHAR(100) NULL,
    provincia VARCHAR(100) NULL,
    telefono VARCHAR(50) NULL,
    email VARCHAR(150) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sucursales_public_id (public_id),
    UNIQUE KEY uq_sucursales_org_codigo (organizacion_id, codigo),
    CONSTRAINT fk_sucursales_organizacion FOREIGN KEY (organizacion_id) REFERENCES organizaciones (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE tipos_tramite (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    prefijo_carpeta VARCHAR(20) NULL,
    orden_visual INT NOT NULL DEFAULT 0,
    requiere_tramitacion TINYINT(1) NOT NULL DEFAULT 0,
    requiere_abogado TINYINT(1) NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tipos_tramite_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE parametros_sistema (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    scope_tipo VARCHAR(50) NOT NULL,
    scope_id BIGINT UNSIGNED NULL,
    clave VARCHAR(120) NOT NULL,
    valor_json JSON NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_parametros_scope_clave (scope_tipo, scope_id, clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO organizaciones (public_id, codigo, nombre, razon_social, cuit, condicion_iva, telefono, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'TZ', 'Taller Zapata', 'Talleres Zapata SRL', '30-54986217-5', 'Responsable Inscripto', '3414261200', 'contacto@tallereszapata.com');

INSERT INTO sucursales (public_id, organizacion_id, codigo, nombre, ciudad, provincia, telefono, email)
VALUES
('00000000-0000-0000-0000-000000000010', 1, 'Z', 'Zapata', 'Rosario', 'Santa Fe', '3414261200', 'contacto@tallereszapata.com'),
('00000000-0000-0000-0000-000000000011', 1, 'C', 'Centro', 'Rosario', 'Santa Fe', '3414208800', 'centro@tallereszapata.com');

INSERT INTO tipos_tramite (codigo, nombre, prefijo_carpeta, orden_visual, requiere_tramitacion, requiere_abogado)
VALUES
('PARTICULAR', 'Particular', 'P', 1, 0, 0),
('TODO_RIESGO', 'Todo Riesgo', 'T', 2, 1, 0),
('GRANIZO', 'Granizo', 'G', 3, 1, 0),
('CLEAS', 'CLEAS', 'CL', 4, 1, 0),
('RECLAMO_TERCEROS', 'Reclamo de Terceros', 'R', 5, 1, 0),
('RECLAMO_TERCEROS_ABOGADO', 'Reclamo de Terceros - Abogado', 'RA', 6, 1, 1),
('RECUPERO_FRANQUICIA', 'Recupero de Franquicia', 'RF', 7, 1, 1);
