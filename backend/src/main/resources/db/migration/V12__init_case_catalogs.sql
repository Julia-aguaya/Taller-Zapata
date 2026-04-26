CREATE TABLE roles_caso (
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE prioridades_caso (
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    orden_visual INT NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO roles_caso (codigo, nombre, activo)
VALUES
('CLIENTE', 'Cliente', 1),
('ASEGURADO', 'Asegurado', 1),
('TERCERO', 'Tercero', 1),
('CONDUCTOR', 'Conductor', 1),
('TITULAR', 'Titular', 1),
('OTRO', 'Otro', 1)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    activo = VALUES(activo);

INSERT INTO prioridades_caso (codigo, nombre, orden_visual, activo)
VALUES
('BAJA', 'Baja', 1, 1),
('MEDIA', 'Media', 2, 1),
('ALTA', 'Alta', 3, 1),
('URGENTE', 'Urgente', 4, 1)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    orden_visual = VALUES(orden_visual),
    activo = VALUES(activo);
