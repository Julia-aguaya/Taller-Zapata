ALTER TABLE recuperos_franquicia
    ADD COLUMN aprobado_por_usuario_id BIGINT NULL;

ALTER TABLE recuperos_franquicia
    ADD COLUMN aprobado_at DATETIME NULL;

ALTER TABLE recuperos_franquicia
    ADD CONSTRAINT fk_recuperos_franquicia_aprobado_por
        FOREIGN KEY (aprobado_por_usuario_id) REFERENCES usuarios(id);

INSERT INTO tipos_notificacion (codigo, nombre, activo)
SELECT 'RECUPERO_MONTO_MENOR', 'Monto a recuperar menor al acordado', 1
WHERE NOT EXISTS (
    SELECT 1 FROM tipos_notificacion WHERE codigo = 'RECUPERO_MONTO_MENOR'
);
