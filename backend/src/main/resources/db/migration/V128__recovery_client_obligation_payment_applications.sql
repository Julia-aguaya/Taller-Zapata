CREATE TABLE recupero_obligacion_pago_aplicaciones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    obligacion_id BIGINT UNSIGNED NOT NULL,
    movimiento_id BIGINT UNSIGNED NOT NULL,
    monto_aplicado DECIMAL(14,2) NOT NULL,
    idempotency_key VARCHAR(100) NOT NULL,
    estado_codigo VARCHAR(20) NOT NULL,
    revierte_aplicacion_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL,
    annulled_at DATETIME NULL,
    CONSTRAINT fk_recupero_obligacion_pago_obligacion FOREIGN KEY (obligacion_id) REFERENCES recupero_obligaciones_cliente(id),
    CONSTRAINT fk_recupero_obligacion_pago_movimiento FOREIGN KEY (movimiento_id) REFERENCES movimientos_financieros(id),
    CONSTRAINT fk_recupero_obligacion_pago_reversion FOREIGN KEY (revierte_aplicacion_id) REFERENCES recupero_obligacion_pago_aplicaciones(id),
    CONSTRAINT uk_recupero_obligacion_pago_idempotency UNIQUE (obligacion_id, idempotency_key),
    CONSTRAINT uk_recupero_obligacion_pago_reversion UNIQUE (revierte_aplicacion_id)
);
