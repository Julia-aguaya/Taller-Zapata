CREATE TABLE presupuesto_trabajos_extras (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    presupuesto_id BIGINT UNSIGNED NOT NULL,
    pieza_afectada VARCHAR(150) NULL,
    accion_codigo VARCHAR(40) NULL,
    nivel_danio_codigo VARCHAR(40) NULL,
    monto_repuestos DECIMAL(14,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_presupuesto_trabajos_extras_presupuesto (presupuesto_id),
    CONSTRAINT fk_presupuesto_trabajos_extras_presupuesto FOREIGN KEY (presupuesto_id) REFERENCES presupuestos (id) ON DELETE CASCADE,
    CONSTRAINT fk_presupuesto_trabajos_extras_accion FOREIGN KEY (accion_codigo) REFERENCES acciones_presupuesto (codigo),
    CONSTRAINT fk_presupuesto_trabajos_extras_nivel_danio FOREIGN KEY (nivel_danio_codigo) REFERENCES niveles_danio (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
