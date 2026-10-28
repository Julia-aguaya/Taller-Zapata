CREATE TABLE tipos_vehiculo (
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    nombre_normalizado VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo),
    UNIQUE KEY uq_tipos_vehiculo_nombre_normalizado (nombre_normalizado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO tipos_vehiculo (codigo, nombre, nombre_normalizado, activo)
VALUES
    ('SEDAN', 'Sedan', 'sedan', 1),
    ('PICK_UP', 'Pick up', 'pick up', 1),
    ('FURGON', 'Furgon', 'furgon', 1),
    ('UTILITARIO', 'Utilitario', 'utilitario', 1),
    ('CAMION', 'Camion', 'camion', 1),
    ('MOTO', 'Moto', 'moto', 1),
    ('OTRO', 'Otro', 'otro', 1);
