CREATE TABLE comparacion_presupuesto_snapshot (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    presupuesto_id BIGINT UNSIGNED NOT NULL,
    generacion INT NOT NULL,
    fecha_presupuesto DATE NOT NULL,
    version_presupuesto INT NOT NULL,
    idempotency_key VARCHAR(120) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_comparacion_snapshot_generacion (caso_id, generacion),
    UNIQUE KEY uq_comparacion_snapshot_idempotencia (caso_id, idempotency_key),
    CONSTRAINT fk_comparacion_snapshot_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_comparacion_snapshot_presupuesto FOREIGN KEY (presupuesto_id) REFERENCES presupuestos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE comparacion_pieza (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    snapshot_id BIGINT UNSIGNED NOT NULL,
    presupuesto_item_origen_id BIGINT UNSIGNED NULL,
    descripcion VARCHAR(200) NOT NULL,
    accion_codigo VARCHAR(40) NULL,
    valor_repuesto_fuente DECIMAL(14,2) NOT NULL DEFAULT 0,
    origen VARCHAR(20) NOT NULL,
    transferred_part_id BIGINT UNSIGNED NULL,
    transferred_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_comparacion_pieza_origen (snapshot_id, presupuesto_item_origen_id),
    KEY idx_comparacion_pieza_snapshot (snapshot_id),
    CONSTRAINT fk_comparacion_pieza_snapshot FOREIGN KEY (snapshot_id) REFERENCES comparacion_presupuesto_snapshot (id) ON DELETE RESTRICT,
    CONSTRAINT ck_comparacion_pieza_origen CHECK (origen IN ('IMPORTADA', 'MANUAL'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE comparacion_oferta (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pieza_id BIGINT UNSIGNED NOT NULL,
    proveedor_id BIGINT UNSIGNED NULL,
    proveedor_snapshot VARCHAR(180) NOT NULL,
    importe DECIMAL(14,2) NOT NULL,
    medio_pago_codigo VARCHAR(40) NOT NULL,
    facturacion_codigo VARCHAR(40) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_comparacion_oferta_pieza (pieza_id, importe),
    CONSTRAINT fk_comparacion_oferta_pieza FOREIGN KEY (pieza_id) REFERENCES comparacion_pieza (id) ON DELETE RESTRICT,
    CONSTRAINT fk_comparacion_oferta_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id),
    CONSTRAINT fk_comparacion_oferta_medio FOREIGN KEY (medio_pago_codigo) REFERENCES medio_pago_cotizacion (codigo),
    CONSTRAINT fk_comparacion_oferta_facturacion FOREIGN KEY (facturacion_codigo) REFERENCES facturacion_cotizacion (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE repuestos_caso ADD COLUMN source_comparison_piece_id BIGINT UNSIGNED NULL;
ALTER TABLE repuestos_caso ADD UNIQUE KEY uq_repuestos_caso_comparacion_pieza (source_comparison_piece_id);
ALTER TABLE repuestos_caso ADD CONSTRAINT fk_repuestos_caso_comparacion_pieza FOREIGN KEY (source_comparison_piece_id) REFERENCES comparacion_pieza (id);
