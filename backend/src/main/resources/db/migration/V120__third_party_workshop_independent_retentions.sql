CREATE TABLE caso_terceros_retenciones (
    caso_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    version_lock BIGINT NOT NULL DEFAULT 0,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_caso_terceros_retenciones_caso FOREIGN KEY (caso_id) REFERENCES casos(id)
);

CREATE TABLE caso_terceros_retencion_detalle (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    caso_id BIGINT UNSIGNED NOT NULL,
    tipo_retencion_codigo VARCHAR(50) NOT NULL,
    monto DECIMAL(15,2) NOT NULL,
    detalle VARCHAR(255),
    CONSTRAINT uq_caso_terceros_retencion_tipo UNIQUE (caso_id, tipo_retencion_codigo),
    CONSTRAINT fk_caso_terceros_retencion_detalle_caso FOREIGN KEY (caso_id) REFERENCES caso_terceros_retenciones(caso_id)
);
