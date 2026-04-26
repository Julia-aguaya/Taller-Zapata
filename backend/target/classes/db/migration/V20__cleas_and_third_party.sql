CREATE TABLE alcances_cleas (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE dictamenes_cleas (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE estados_pago (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE estados_documentacion_terceros (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE modos_provision_repuestos (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_cleas (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    alcance_codigo VARCHAR(40) NULL,
    dictamen_codigo VARCHAR(40) NULL,
    monto_franquicia DECIMAL(14,2) NULL,
    monto_cargo_cliente DECIMAL(14,2) NULL,
    estado_pago_cliente_codigo VARCHAR(40) NULL,
    fecha_pago_cliente DATE NULL,
    monto_pago_compania_franquicia DECIMAL(14,2) NULL,
    estado_pago_compania_franquicia_codigo VARCHAR(40) NULL,
    fecha_pago_compania_franquicia DATE NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_cleas_caso (caso_id),
    CONSTRAINT fk_caso_cleas_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_caso_cleas_alcance FOREIGN KEY (alcance_codigo) REFERENCES alcances_cleas (codigo),
    CONSTRAINT fk_caso_cleas_dictamen FOREIGN KEY (dictamen_codigo) REFERENCES dictamenes_cleas (codigo),
    CONSTRAINT fk_caso_cleas_estado_pago_cliente FOREIGN KEY (estado_pago_cliente_codigo) REFERENCES estados_pago (codigo),
    CONSTRAINT fk_caso_cleas_estado_pago_compania FOREIGN KEY (estado_pago_compania_franquicia_codigo) REFERENCES estados_pago (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_terceros (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    compania_tercero_id BIGINT UNSIGNED NULL,
    referencia_reclamo VARCHAR(120) NULL,
    documentacion_estado_codigo VARCHAR(40) NULL,
    documentacion_aceptada TINYINT(1) NOT NULL DEFAULT 0,
    modo_provision_repuestos_codigo VARCHAR(40) NULL,
    monto_minimo_labor DECIMAL(14,2) NULL,
    monto_minimo_repuestos DECIMAL(14,2) NULL,
    subtotal_mejor_cotizacion DECIMAL(14,2) NULL,
    total_final_repuestos DECIMAL(14,2) NULL,
    monto_facturar_compania DECIMAL(14,2) NULL,
    monto_final_favor_taller DECIMAL(14,2) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_caso_terceros_caso (caso_id),
    CONSTRAINT fk_caso_terceros_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_caso_terceros_compania FOREIGN KEY (compania_tercero_id) REFERENCES companias_seguro (id),
    CONSTRAINT fk_caso_terceros_documentacion FOREIGN KEY (documentacion_estado_codigo) REFERENCES estados_documentacion_terceros (codigo),
    CONSTRAINT fk_caso_terceros_provision FOREIGN KEY (modo_provision_repuestos_codigo) REFERENCES modos_provision_repuestos (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO alcances_cleas (codigo, nombre, activo) VALUES
('PARCIAL', 'Parcial', 1),
('TOTAL', 'Total', 1),
('NO_CUBIERTO', 'No cubierto', 1);

INSERT INTO dictamenes_cleas (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', 1),
('FAVORABLE', 'Favorable', 1),
('DESFAVORABLE', 'Desfavorable', 1);

INSERT INTO estados_pago (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', 1),
('COBRADO', 'Cobrado', 1),
('NO_APLICA', 'No aplica', 1);

INSERT INTO estados_documentacion_terceros (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', 1),
('EN_REVISION', 'En revision', 1),
('ACEPTADA', 'Aceptada', 1),
('RECHAZADA', 'Rechazada', 1);

INSERT INTO modos_provision_repuestos (codigo, nombre, activo) VALUES
('TALLER', 'Taller', 1),
('TERCERO', 'Tercero', 1),
('COMPANIA', 'Compania', 1),
('NO_APLICA', 'No aplica', 1);
