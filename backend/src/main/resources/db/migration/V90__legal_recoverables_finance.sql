CREATE TABLE estados_cobro_rubro_legal (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE legal_rubros_recuperables (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_legal_id BIGINT UNSIGNED NOT NULL,
    concepto VARCHAR(150) NOT NULL,
    monto DECIMAL(14,2) NOT NULL,
    suma_taller TINYINT(1) NOT NULL DEFAULT 0,
    estado_cobro_codigo VARCHAR(40) NOT NULL,
    movimiento_financiero_id BIGINT UNSIGNED NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_legal_rubros_movimiento (movimiento_financiero_id),
    CONSTRAINT fk_legal_rubros_caso_legal FOREIGN KEY (caso_legal_id) REFERENCES caso_legal (id) ON DELETE CASCADE,
    CONSTRAINT fk_legal_rubros_estado FOREIGN KEY (estado_cobro_codigo) REFERENCES estados_cobro_rubro_legal (codigo),
    CONSTRAINT fk_legal_rubros_movimiento FOREIGN KEY (movimiento_financiero_id) REFERENCES movimientos_financieros (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO estados_cobro_rubro_legal (codigo, nombre, activo) VALUES ('PENDIENTE', 'Pendiente', 1), ('COBRADO', 'Cobrado', 1);
INSERT INTO origenes_flujo_financiero (codigo, nombre, activo) VALUES ('LEGAL', 'Gestión legal', 1);
INSERT INTO cancela_tipos_financiero (codigo, nombre, activo) VALUES ('RUBRO_LEGAL', 'Rubro legal', 1);
