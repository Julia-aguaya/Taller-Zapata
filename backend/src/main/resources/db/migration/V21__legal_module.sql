CREATE TABLE quienes_tramitan_legal (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE quienes_reclaman_legal (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE instancias_legal (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cierre_por_legal (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE pagado_por_gasto_legal (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_legal (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    tramita_codigo VARCHAR(40) NULL,
    reclama_codigo VARCHAR(40) NULL,
    instancia_codigo VARCHAR(40) NULL,
    fecha_ingreso DATE NULL,
    cuij VARCHAR(80) NULL,
    juzgado VARCHAR(150) NULL,
    autos VARCHAR(200) NULL,
    abogado_contraparte VARCHAR(150) NULL,
    telefono_contraparte VARCHAR(50) NULL,
    email_contraparte VARCHAR(150) NULL,
    repara_vehiculo TINYINT(1) NOT NULL DEFAULT 0,
    cierre_por_codigo VARCHAR(40) NULL,
    fecha_cierre_legal DATE NULL,
    importe_total_expediente DECIMAL(14,2) NULL,
    observaciones TEXT NULL,
    notas_cierre TEXT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_legal_caso (caso_id),
    CONSTRAINT fk_caso_legal_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_caso_legal_tramita FOREIGN KEY (tramita_codigo) REFERENCES quienes_tramitan_legal (codigo),
    CONSTRAINT fk_caso_legal_reclama FOREIGN KEY (reclama_codigo) REFERENCES quienes_reclaman_legal (codigo),
    CONSTRAINT fk_caso_legal_instancia FOREIGN KEY (instancia_codigo) REFERENCES instancias_legal (codigo),
    CONSTRAINT fk_caso_legal_cierre_por FOREIGN KEY (cierre_por_codigo) REFERENCES cierre_por_legal (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE legal_novedades (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_legal_id BIGINT UNSIGNED NOT NULL,
    fecha_novedad DATE NOT NULL,
    detalle TEXT NOT NULL,
    notificar_cliente TINYINT(1) NOT NULL DEFAULT 0,
    notificado_at DATETIME NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_legal_novedades_caso_legal FOREIGN KEY (caso_legal_id) REFERENCES caso_legal (id),
    KEY idx_legal_novedades_caso_legal_fecha (caso_legal_id, fecha_novedad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE legal_gastos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_legal_id BIGINT UNSIGNED NOT NULL,
    concepto VARCHAR(150) NOT NULL,
    monto DECIMAL(14,2) NOT NULL,
    fecha_gasto DATE NOT NULL,
    pagado_por_codigo VARCHAR(40) NULL,
    movimiento_financiero_id BIGINT UNSIGNED NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_legal_gastos_caso_legal FOREIGN KEY (caso_legal_id) REFERENCES caso_legal (id),
    CONSTRAINT fk_legal_gastos_pagado_por FOREIGN KEY (pagado_por_codigo) REFERENCES pagado_por_gasto_legal (codigo),
    KEY idx_legal_gastos_caso_legal_fecha (caso_legal_id, fecha_gasto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO quienes_tramitan_legal (codigo, nombre, activo) VALUES
('ABOGADO', 'Abogado', 1),
('TALLER', 'Taller', 1),
('CLIENTE', 'Cliente', 1);

INSERT INTO quienes_reclaman_legal (codigo, nombre, activo) VALUES
('CLIENTE', 'Cliente', 1),
('TALLER', 'Taller', 1),
('TERCERO', 'Tercero', 1),
('COMPANIA', 'Compania', 1);

INSERT INTO instancias_legal (codigo, nombre, activo) VALUES
('ADMINISTRATIVA', 'Administrativa', 1),
('JUDICIAL', 'Judicial', 1),
('ARBITRAJE', 'Arbitraje', 1),
('MEDIACION', 'Mediacion', 1);

INSERT INTO cierre_por_legal (codigo, nombre, activo) VALUES
('ACUERDO', 'Acuerdo', 1),
('SENTENCIA', 'Sentencia', 1),
('DESISTIMIENTO', 'Desistimiento', 1),
('CADUCIDAD', 'Caducidad', 1);

INSERT INTO pagado_por_gasto_legal (codigo, nombre, activo) VALUES
('CLIENTE', 'Cliente', 1),
('ABOGADO', 'Abogado', 1),
('TALLER', 'Taller', 1),
('TERCERO', 'Tercero', 1);
