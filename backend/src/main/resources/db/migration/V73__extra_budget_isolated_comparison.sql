-- This comparison belongs exclusively to canonical extra-budget items. It never references repair parts or the main budget comparison.
ALTER TABLE presupuesto_extra_items
    ADD COLUMN accion_codigo VARCHAR(40) NULL,
    ADD COLUMN proveedor_seleccionado_id BIGINT UNSIGNED NULL,
    ADD COLUMN proveedor_seleccionado_nombre VARCHAR(150) NULL,
    ADD COLUMN importe_cotizacion_seleccionada DECIMAL(14,2) NULL,
    ADD CONSTRAINT fk_presupuesto_extra_items_proveedor_seleccionado
        FOREIGN KEY (proveedor_seleccionado_id) REFERENCES proveedores (id),
    ADD CONSTRAINT ck_presupuesto_extra_items_cotizacion_seleccionada
        CHECK (importe_cotizacion_seleccionada IS NULL OR importe_cotizacion_seleccionada >= 0);

CREATE TABLE comparacion_presupuesto_extra_piezas (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    presupuesto_extra_item_id BIGINT UNSIGNED NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_comparacion_presupuesto_extra_pieza_item (presupuesto_extra_item_id),
    CONSTRAINT fk_comparacion_presupuesto_extra_pieza_item
        FOREIGN KEY (presupuesto_extra_item_id) REFERENCES presupuesto_extra_items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE comparacion_presupuesto_extra_cotizaciones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pieza_id BIGINT UNSIGNED NOT NULL,
    proveedor_id BIGINT UNSIGNED NOT NULL,
    proveedor_nombre VARCHAR(150) NOT NULL,
    importe DECIMAL(14,2) NOT NULL,
    seleccionada TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_comparacion_presupuesto_extra_cotizacion (pieza_id, proveedor_id),
    KEY idx_comparacion_presupuesto_extra_cotizacion_pieza (pieza_id),
    CONSTRAINT fk_comparacion_presupuesto_extra_cotizacion_pieza
        FOREIGN KEY (pieza_id) REFERENCES comparacion_presupuesto_extra_piezas (id) ON DELETE CASCADE,
    CONSTRAINT fk_comparacion_presupuesto_extra_cotizacion_proveedor
        FOREIGN KEY (proveedor_id) REFERENCES proveedores (id),
    CONSTRAINT ck_comparacion_presupuesto_extra_cotizacion_importe CHECK (importe >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
