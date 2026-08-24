ALTER TABLE comparacion_presupuesto_snapshot
    ADD COLUMN modo VARCHAR(10) NOT NULL DEFAULT 'MATRIX';

UPDATE comparacion_presupuesto_snapshot SET modo = 'LEGACY';

ALTER TABLE comparacion_presupuesto_snapshot
    ADD CONSTRAINT ck_comparacion_snapshot_modo CHECK (modo IN ('LEGACY', 'MATRIX'));

CREATE TABLE comparacion_proveedor (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    snapshot_id BIGINT UNSIGNED NOT NULL,
    proveedor_id BIGINT UNSIGNED NOT NULL,
    proveedor_snapshot VARCHAR(180) NOT NULL,
    facturacion_codigo VARCHAR(20) NOT NULL,
    medio_pago_codigo VARCHAR(40) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_comparacion_proveedor_snapshot_proveedor (snapshot_id, proveedor_id),
    KEY idx_comparacion_proveedor_snapshot (snapshot_id),
    CONSTRAINT fk_comparacion_proveedor_snapshot FOREIGN KEY (snapshot_id) REFERENCES comparacion_presupuesto_snapshot (id) ON DELETE CASCADE,
    CONSTRAINT fk_comparacion_proveedor_global FOREIGN KEY (proveedor_id) REFERENCES proveedores (id),
    CONSTRAINT ck_comparacion_proveedor_facturacion CHECK (facturacion_codigo IN ('A', 'C', 'SIN_FACTURA')),
    CONSTRAINT ck_comparacion_proveedor_pago CHECK (medio_pago_codigo IN ('CONTADO', 'TARJETA_1_PAGO_SIN_INTERES', 'TARJETA_CUOTAS_SIN_INTERES'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE comparacion_precio (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pieza_id BIGINT UNSIGNED NOT NULL,
    comparacion_proveedor_id BIGINT UNSIGNED NOT NULL,
    importe DECIMAL(14,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_comparacion_precio_pieza_proveedor (pieza_id, comparacion_proveedor_id),
    KEY idx_comparacion_precio_proveedor (comparacion_proveedor_id),
    CONSTRAINT fk_comparacion_precio_pieza FOREIGN KEY (pieza_id) REFERENCES comparacion_pieza (id) ON DELETE CASCADE,
    CONSTRAINT fk_comparacion_precio_proveedor FOREIGN KEY (comparacion_proveedor_id) REFERENCES comparacion_proveedor (id) ON DELETE CASCADE,
    CONSTRAINT ck_comparacion_precio_importe CHECK (importe >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
