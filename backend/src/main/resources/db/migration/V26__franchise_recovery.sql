CREATE TABLE quienes_gestionan_recupero (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE dictamenes_recupero (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE estados_cobro_recupero (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE recuperos_franquicia (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    gestiona_codigo VARCHAR(40) NULL,
    caso_base_id BIGINT UNSIGNED NULL,
    carpeta_base_codigo VARCHAR(40) NULL,
    dictamen_codigo VARCHAR(40) NULL,
    monto_acordado DECIMAL(14,2) NULL,
    monto_recuperar DECIMAL(14,2) NULL,
    habilita_reparacion TINYINT(1) NOT NULL DEFAULT 0,
    recupera_cliente TINYINT(1) NOT NULL DEFAULT 0,
    monto_cliente DECIMAL(14,2) NULL,
    estado_cobro_cliente_codigo VARCHAR(40) NULL,
    fecha_cobro_cliente DATE NULL,
    aprobado_menor_acuerdo TINYINT(1) NOT NULL DEFAULT 0,
    nota_aprobacion TEXT NULL,
    reutiliza_datos_base TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_recuperos_franquicia_caso (caso_id),
    CONSTRAINT fk_recuperos_franquicia_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_recuperos_franquicia_caso_base FOREIGN KEY (caso_base_id) REFERENCES casos (id),
    CONSTRAINT fk_recuperos_franquicia_gestiona FOREIGN KEY (gestiona_codigo) REFERENCES quienes_gestionan_recupero (codigo),
    CONSTRAINT fk_recuperos_franquicia_dictamen FOREIGN KEY (dictamen_codigo) REFERENCES dictamenes_recupero (codigo),
    CONSTRAINT fk_recuperos_franquicia_estado_cobro FOREIGN KEY (estado_cobro_cliente_codigo) REFERENCES estados_cobro_recupero (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO quienes_gestionan_recupero (codigo, nombre, activo) VALUES
('ABOGADO', 'Abogado', 1),
('TALLER', 'Taller', 1),
('CLIENTE', 'Cliente', 1),
('ASEGURADORA', 'Aseguradora', 1);

INSERT INTO dictamenes_recupero (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', 1),
('PROCEDE', 'Procede', 1),
('NO_PROCEDE', 'No procede', 1),
('MENOR_ACUERDO', 'Menor acuerdo', 1);

INSERT INTO estados_cobro_recupero (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', 1),
('COBRADO', 'Cobrado', 1),
('NO_APLICA', 'No aplica', 1),
('EN_JUICIO', 'En juicio', 1);

INSERT INTO permisos (id, codigo, nombre, modulo, descripcion) VALUES
(33, 'recupero.ver', 'Ver recuperos', 'recovery', 'Permite consultar recuperos de franquicia'),
(34, 'recupero.crear', 'Crear recuperos', 'recovery', 'Permite crear y editar recuperos');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 1, id, TRUE
FROM permisos
WHERE codigo IN ('recupero.ver', 'recupero.crear');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 2, id, TRUE
FROM permisos
WHERE codigo IN ('recupero.ver', 'recupero.crear');
