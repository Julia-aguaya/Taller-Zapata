CREATE TABLE tipos_contacto (
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE tipos_domicilio (
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE roles_vehiculo (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO tipos_contacto (codigo, nombre, activo)
VALUES
('TELEFONO', 'Telefono fijo', 1),
('CEL', 'Celular', 1),
('CELULAR', 'Celular', 1),
('EMAIL', 'Correo electronico', 1),
('WHATSAPP', 'WhatsApp', 1),
('OTRO', 'Otro', 1);

INSERT INTO tipos_domicilio (codigo, nombre, activo)
VALUES
('FISCAL', 'Fiscal', 1),
('REAL', 'Real', 1),
('LEGAL', 'Legal', 1),
('LABORAL', 'Laboral', 1),
('OTRO', 'Otro', 1);

INSERT INTO roles_vehiculo (codigo, nombre, activo)
VALUES
('TITULAR', 'Titular', 1),
('CONDUCTOR', 'Conductor', 1),
('ASEGURADO', 'Asegurado', 1),
('TENEDOR', 'Tenedor', 1),
('PRINCIPAL', 'Principal', 1),
('OTRO', 'Otro', 1);
