CREATE TABLE caso_terceros_abogado_siniestro (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    dominio_tercero VARCHAR(20) NULL,
    marca_tercero VARCHAR(100) NULL,
    modelo_tercero VARCHAR(100) NULL,
    conductor_nombre VARCHAR(150) NULL,
    conductor_dni VARCHAR(50) NULL,
    conductor_domicilio VARCHAR(255) NULL,
    conductor_es_titular TINYINT(1) NULL,
    titular_nombre VARCHAR(150) NULL,
    titular_dni VARCHAR(50) NULL,
    titular_domicilio VARCHAR(255) NULL,
    porcentaje_titularidad INT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_terceros_abogado_siniestro_caso (caso_id),
    CONSTRAINT fk_caso_terceros_abogado_siniestro_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
