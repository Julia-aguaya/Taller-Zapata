CREATE TABLE tipos_movimiento_financiero (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    signo SMALLINT NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE origenes_flujo_financiero (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE contrapartes_tipo_financiero (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE medios_pago_financiero (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cancela_tipos_financiero (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE tipos_retencion_financiero (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE conceptos_aplicacion_financiera (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE tipos_comprobante_emitido (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE comprobantes_emitidos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    caso_id BIGINT UNSIGNED NOT NULL,
    tipo_comprobante_codigo VARCHAR(40) NOT NULL,
    numero_comprobante VARCHAR(80) NOT NULL,
    razon_social_receptor VARCHAR(180) NOT NULL,
    fecha_emision DATE NOT NULL,
    neto_gravado DECIMAL(14,2) NOT NULL,
    iva DECIMAL(14,2) NOT NULL,
    total DECIMAL(14,2) NOT NULL,
    firmado_conforme_en DATETIME NULL,
    notas TEXT NULL,
    documento_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_comprobantes_emitidos_public_id (public_id),
    KEY idx_comprobantes_emitidos_caso_fecha (caso_id, fecha_emision),
    CONSTRAINT fk_comprobantes_emitidos_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_comprobantes_emitidos_tipo FOREIGN KEY (tipo_comprobante_codigo) REFERENCES tipos_comprobante_emitido (codigo),
    CONSTRAINT fk_comprobantes_emitidos_documento FOREIGN KEY (documento_id) REFERENCES documentos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE movimientos_financieros (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    caso_id BIGINT UNSIGNED NOT NULL,
    comprobante_id BIGINT UNSIGNED NULL,
    tipo_movimiento_codigo VARCHAR(40) NOT NULL,
    origen_flujo_codigo VARCHAR(40) NOT NULL,
    contraparte_tipo_codigo VARCHAR(40) NOT NULL,
    contraparte_persona_id BIGINT UNSIGNED NULL,
    contraparte_compania_id BIGINT UNSIGNED NULL,
    fecha_movimiento DATETIME NOT NULL,
    monto_bruto DECIMAL(14,2) NOT NULL,
    monto_neto DECIMAL(14,2) NOT NULL,
    medio_pago_codigo VARCHAR(40) NOT NULL,
    medio_pago_detalle VARCHAR(255) NULL,
    cancela_tipo_codigo VARCHAR(40) NULL,
    es_senia TINYINT(1) NOT NULL DEFAULT 0,
    es_bonificacion TINYINT(1) NOT NULL DEFAULT 0,
    motivo VARCHAR(255) NULL,
    referencia_externa VARCHAR(120) NULL,
    registrado_por BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_movimientos_financieros_public_id (public_id),
    KEY idx_movimientos_financieros_caso_fecha (caso_id, fecha_movimiento),
    CONSTRAINT fk_movimientos_financieros_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_movimientos_financieros_comprobante FOREIGN KEY (comprobante_id) REFERENCES comprobantes_emitidos (id),
    CONSTRAINT fk_movimientos_financieros_tipo FOREIGN KEY (tipo_movimiento_codigo) REFERENCES tipos_movimiento_financiero (codigo),
    CONSTRAINT fk_movimientos_financieros_origen FOREIGN KEY (origen_flujo_codigo) REFERENCES origenes_flujo_financiero (codigo),
    CONSTRAINT fk_movimientos_financieros_contraparte_tipo FOREIGN KEY (contraparte_tipo_codigo) REFERENCES contrapartes_tipo_financiero (codigo),
    CONSTRAINT fk_movimientos_financieros_persona FOREIGN KEY (contraparte_persona_id) REFERENCES personas (id),
    CONSTRAINT fk_movimientos_financieros_medio_pago FOREIGN KEY (medio_pago_codigo) REFERENCES medios_pago_financiero (codigo),
    CONSTRAINT fk_movimientos_financieros_cancela_tipo FOREIGN KEY (cancela_tipo_codigo) REFERENCES cancela_tipos_financiero (codigo),
    CONSTRAINT fk_movimientos_financieros_registrado_por FOREIGN KEY (registrado_por) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE movimiento_retenciones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    movimiento_id BIGINT UNSIGNED NOT NULL,
    tipo_retencion_codigo VARCHAR(40) NOT NULL,
    monto DECIMAL(14,2) NOT NULL,
    detalle VARCHAR(255) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_movimiento_retencion_tipo (movimiento_id, tipo_retencion_codigo),
    CONSTRAINT fk_movimiento_retenciones_movimiento FOREIGN KEY (movimiento_id) REFERENCES movimientos_financieros (id) ON DELETE CASCADE,
    CONSTRAINT fk_movimiento_retenciones_tipo FOREIGN KEY (tipo_retencion_codigo) REFERENCES tipos_retencion_financiero (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE movimiento_aplicaciones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    movimiento_id BIGINT UNSIGNED NOT NULL,
    caso_id BIGINT UNSIGNED NOT NULL,
    concepto_codigo VARCHAR(40) NOT NULL,
    entidad_tipo VARCHAR(60) NOT NULL,
    entidad_id BIGINT UNSIGNED NOT NULL,
    monto_aplicado DECIMAL(14,2) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_movimiento_aplicaciones_movimiento FOREIGN KEY (movimiento_id) REFERENCES movimientos_financieros (id) ON DELETE CASCADE,
    CONSTRAINT fk_movimiento_aplicaciones_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_movimiento_aplicaciones_concepto FOREIGN KEY (concepto_codigo) REFERENCES conceptos_aplicacion_financiera (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO tipos_movimiento_financiero (codigo, nombre, signo, activo) VALUES
('INGRESO', 'Ingreso', 1, 1),
('EGRESO', 'Egreso', -1, 1),
('AJUSTE', 'Ajuste', 1, 1);

INSERT INTO origenes_flujo_financiero (codigo, nombre, activo) VALUES
('CLIENTE', 'Cliente', 1),
('ASEGURADORA', 'Aseguradora', 1),
('INTERNO', 'Interno', 1);

INSERT INTO contrapartes_tipo_financiero (codigo, nombre, activo) VALUES
('PERSONA', 'Persona', 1),
('COMPANIA', 'Compania', 1),
('CAJA', 'Caja', 1);

INSERT INTO medios_pago_financiero (codigo, nombre, activo) VALUES
('EFECTIVO', 'Efectivo', 1),
('TRANSFERENCIA', 'Transferencia', 1),
('TARJETA', 'Tarjeta', 1),
('CHEQUE', 'Cheque', 1);

INSERT INTO cancela_tipos_financiero (codigo, nombre, activo) VALUES
('NINGUNO', 'Ninguno', 1),
('PRESUPUESTO', 'Presupuesto', 1),
('FRANQUICIA', 'Franquicia', 1),
('REPUESTO', 'Repuesto', 1);

INSERT INTO tipos_retencion_financiero (codigo, nombre, activo) VALUES
('IVA', 'IVA', 1),
('IIBB', 'Ingresos Brutos', 1),
('GANANCIAS', 'Ganancias', 1);

INSERT INTO conceptos_aplicacion_financiera (codigo, nombre, activo) VALUES
('MANO_OBRA', 'Mano de obra', 1),
('REPUESTO', 'Repuesto', 1),
('FRANQUICIA', 'Franquicia', 1),
('BONIFICACION', 'Bonificacion', 1);

INSERT INTO tipos_comprobante_emitido (codigo, nombre, activo) VALUES
('FACTURA', 'Factura', 1),
('RECIBO', 'Recibo', 1),
('NOTA_CREDITO', 'Nota de credito', 1);

INSERT INTO permisos (codigo, nombre, modulo, descripcion) VALUES
('finanza.ver', 'Ver finanzas', 'finance', 'Permite consultar movimientos y comprobantes'),
('finanza.crear', 'Crear finanzas', 'finance', 'Permite registrar movimientos y comprobantes');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 1, id, 1 FROM permisos WHERE codigo IN ('finanza.ver', 'finanza.crear');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 2, id, 1 FROM permisos WHERE codigo IN ('finanza.ver', 'finanza.crear');
