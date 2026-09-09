CREATE TABLE aprobaciones_acuerdo_bajo_minimo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    caso_id BIGINT NOT NULL,
    monto_propuesto DECIMAL(19,2) NOT NULL,
    monto_minimo_esperado DECIMAL(19,2) NOT NULL,
    usuario_solicitante_id BIGINT NOT NULL,
    motivo VARCHAR(1000) NOT NULL,
    solicitado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL,
    decidido_en TIMESTAMP NULL,
    administrador_aprobador_id BIGINT NULL,
    CONSTRAINT uq_aprobaciones_acuerdo_bajo_minimo_caso UNIQUE (caso_id),
    CONSTRAINT fk_aprobaciones_acuerdo_bajo_minimo_caso FOREIGN KEY (caso_id) REFERENCES casos(id),
    CONSTRAINT fk_aprobaciones_acuerdo_bajo_minimo_solicitante FOREIGN KEY (usuario_solicitante_id) REFERENCES usuarios(id),
    CONSTRAINT fk_aprobaciones_acuerdo_bajo_minimo_aprobador FOREIGN KEY (administrador_aprobador_id) REFERENCES usuarios(id)
);
