CREATE TABLE presupuestos_extra (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    organizacion_id BIGINT UNSIGNED NOT NULL,
    sucursal_id BIGINT UNSIGNED NOT NULL,
    numero_emitido BIGINT UNSIGNED NULL,
    version_actual INT NOT NULL DEFAULT 1,
    version_aceptada_id BIGINT UNSIGNED NULL,
    monto_deuda_aceptada DECIMAL(14,2) NOT NULL DEFAULT 0,
    estado_actual ENUM('BORRADOR', 'PRESENTADO', 'ACEPTADO', 'RECHAZADO') NOT NULL DEFAULT 'BORRADOR',
    version_lock BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_presupuestos_extra_caso (caso_id),
    UNIQUE KEY uq_presupuestos_extra_numero (organizacion_id, sucursal_id, numero_emitido),
    KEY idx_presupuestos_extra_aceptada (version_aceptada_id),
    CONSTRAINT fk_presupuestos_extra_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_presupuestos_extra_organizacion FOREIGN KEY (organizacion_id) REFERENCES organizaciones (id),
    CONSTRAINT fk_presupuestos_extra_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE presupuesto_extra_versiones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    presupuesto_extra_id BIGINT UNSIGNED NOT NULL,
    numero_version INT NOT NULL,
    estado ENUM('BORRADOR', 'PRESENTADO', 'ACEPTADO', 'RECHAZADO') NOT NULL DEFAULT 'BORRADOR',
    cliente_snapshot VARCHAR(255) NULL,
    vehiculo_snapshot VARCHAR(255) NULL,
    carpeta_snapshot VARCHAR(120) NULL,
    mano_obra_sin_iva DECIMAL(14,2) NOT NULL DEFAULT 0,
    alicuota_iva DECIMAL(5,2) NOT NULL DEFAULT 21.00,
    mano_obra_iva DECIMAL(14,2) NOT NULL DEFAULT 0,
    mano_obra_con_iva DECIMAL(14,2) NOT NULL DEFAULT 0,
    repuestos_total DECIMAL(14,2) NOT NULL DEFAULT 0,
    total DECIMAL(14,2) NOT NULL DEFAULT 0,
    presented_at DATETIME NULL,
    presented_by BIGINT UNSIGNED NULL,
    accepted_at DATETIME NULL,
    accepted_by BIGINT UNSIGNED NULL,
    rejected_at DATETIME NULL,
    rejected_by BIGINT UNSIGNED NULL,
    rejection_reason VARCHAR(500) NULL,
    pdf_snapshot_json JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_presupuesto_extra_versiones_numero (presupuesto_extra_id, numero_version),
    KEY idx_presupuesto_extra_versiones_estado (presupuesto_extra_id, estado),
    CONSTRAINT fk_presupuesto_extra_versiones_presupuesto FOREIGN KEY (presupuesto_extra_id) REFERENCES presupuestos_extra (id) ON DELETE CASCADE,
    CONSTRAINT fk_presupuesto_extra_versiones_presented_by FOREIGN KEY (presented_by) REFERENCES usuarios (id),
    CONSTRAINT fk_presupuesto_extra_versiones_accepted_by FOREIGN KEY (accepted_by) REFERENCES usuarios (id),
    CONSTRAINT fk_presupuesto_extra_versiones_rejected_by FOREIGN KEY (rejected_by) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE presupuestos_extra
    ADD CONSTRAINT fk_presupuestos_extra_version_aceptada
    FOREIGN KEY (version_aceptada_id) REFERENCES presupuesto_extra_versiones (id);

CREATE TABLE presupuesto_extra_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    presupuesto_extra_version_id BIGINT UNSIGNED NOT NULL,
    orden_visual INT NOT NULL DEFAULT 0,
    descripcion VARCHAR(255) NOT NULL,
    cantidad DECIMAL(14,2) NOT NULL DEFAULT 1,
    importe_unitario_repuesto DECIMAL(14,2) NOT NULL DEFAULT 0,
    importe_unitario_mano_obra DECIMAL(14,2) NOT NULL DEFAULT 0,
    total_repuestos DECIMAL(14,2) NOT NULL DEFAULT 0,
    total_mano_obra DECIMAL(14,2) NOT NULL DEFAULT 0,
    total_linea DECIMAL(14,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_presupuesto_extra_items_version_orden (presupuesto_extra_version_id, orden_visual),
    CONSTRAINT fk_presupuesto_extra_items_version FOREIGN KEY (presupuesto_extra_version_id) REFERENCES presupuesto_extra_versiones (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE presupuesto_extra_eventos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    presupuesto_extra_id BIGINT UNSIGNED NOT NULL,
    presupuesto_extra_version_id BIGINT UNSIGNED NULL,
    transicion VARCHAR(40) NOT NULL,
    actor_id BIGINT UNSIGNED NULL,
    metadata_json JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_presupuesto_extra_eventos_presupuesto_fecha (presupuesto_extra_id, created_at),
    KEY idx_presupuesto_extra_eventos_version (presupuesto_extra_version_id),
    CONSTRAINT fk_presupuesto_extra_eventos_presupuesto FOREIGN KEY (presupuesto_extra_id) REFERENCES presupuestos_extra (id) ON DELETE CASCADE,
    CONSTRAINT fk_presupuesto_extra_eventos_version FOREIGN KEY (presupuesto_extra_version_id) REFERENCES presupuesto_extra_versiones (id) ON DELETE CASCADE,
    CONSTRAINT fk_presupuesto_extra_eventos_actor FOREIGN KEY (actor_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE secuencias_presupuesto_extra (
    organizacion_id BIGINT UNSIGNED NOT NULL,
    sucursal_id BIGINT UNSIGNED NOT NULL,
    proximo_numero BIGINT UNSIGNED NOT NULL DEFAULT 1,
    PRIMARY KEY (organizacion_id, sucursal_id),
    CONSTRAINT fk_secuencias_presupuesto_extra_organizacion FOREIGN KEY (organizacion_id) REFERENCES organizaciones (id),
    CONSTRAINT fk_secuencias_presupuesto_extra_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE presupuesto_extra_pago_aplicaciones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    movimiento_id BIGINT UNSIGNED NOT NULL,
    presupuesto_extra_id BIGINT UNSIGNED NOT NULL,
    presupuesto_extra_version_id BIGINT UNSIGNED NOT NULL,
    monto_aplicado DECIMAL(14,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_presupuesto_extra_pago_aplicaciones_movimiento (movimiento_id),
    KEY idx_presupuesto_extra_pago_aplicaciones_presupuesto (presupuesto_extra_id),
    KEY idx_presupuesto_extra_pago_aplicaciones_version (presupuesto_extra_version_id),
    CONSTRAINT fk_presupuesto_extra_pago_aplicaciones_movimiento FOREIGN KEY (movimiento_id) REFERENCES movimientos_financieros (id),
    CONSTRAINT fk_presupuesto_extra_pago_aplicaciones_presupuesto FOREIGN KEY (presupuesto_extra_id) REFERENCES presupuestos_extra (id) ON DELETE CASCADE,
    CONSTRAINT fk_presupuesto_extra_pago_aplicaciones_version FOREIGN KEY (presupuesto_extra_version_id) REFERENCES presupuesto_extra_versiones (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO cancela_tipos_financiero (codigo, nombre, activo) VALUES
('TRABAJOS_EXTRAS', 'Trabajos extras', 1);
