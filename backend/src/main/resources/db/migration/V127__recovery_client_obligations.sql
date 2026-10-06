CREATE TABLE recupero_obligaciones_cliente (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    caso_id BIGINT NOT NULL,
    tipo_codigo VARCHAR(50) NOT NULL,
    direccion_codigo VARCHAR(30) NOT NULL,
    importe_original DECIMAL(14,2) NOT NULL,
    saldo_vigente DECIMAL(14,2) NOT NULL,
    estado_codigo VARCHAR(20) NOT NULL,
    creado_at DATETIME NOT NULL,
    actualizado_at DATETIME NOT NULL,
    inactivado_at DATETIME NULL,
    motivo_inactivacion VARCHAR(255) NULL,
    CONSTRAINT fk_recupero_obligacion_caso FOREIGN KEY (caso_id) REFERENCES casos(id),
    CONSTRAINT uk_recupero_obligacion_tipo UNIQUE (caso_id, tipo_codigo)
);
