CREATE TABLE caso_creacion_idempotencia (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT UNSIGNED NOT NULL,
    idempotency_key VARCHAR(100) NOT NULL,
    caso_id BIGINT UNSIGNED NOT NULL,
    CONSTRAINT fk_caso_creacion_idempotencia_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_caso_creacion_idempotencia_caso FOREIGN KEY (caso_id) REFERENCES casos(id),
    CONSTRAINT uk_caso_creacion_idempotencia UNIQUE (usuario_id, idempotency_key)
);
