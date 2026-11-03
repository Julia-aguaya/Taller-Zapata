ALTER TABLE repuestos_caso
    ADD COLUMN cantidad_pedida INT NOT NULL DEFAULT 1;

ALTER TABLE repuestos_caso
    ADD CONSTRAINT ck_repuestos_caso_cantidad_pedida CHECK (cantidad_pedida > 0);

CREATE TABLE repuestos_caso_recepciones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    repuesto_id BIGINT UNSIGNED NOT NULL,
    cantidad INT NOT NULL,
    fecha_recepcion DATE NULL,
    PRIMARY KEY (id),
    KEY idx_repuestos_caso_recepciones_repuesto_fecha (repuesto_id, fecha_recepcion, id),
    CONSTRAINT fk_repuestos_caso_recepciones_repuesto FOREIGN KEY (repuesto_id) REFERENCES repuestos_caso (id) ON DELETE CASCADE,
    CONSTRAINT ck_repuestos_caso_recepciones_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A legacy received date or terminal receipt status represented one physical unit.
-- When the historical date is absent, retain that inferred unit with a NULL date.
INSERT INTO repuestos_caso_recepciones (repuesto_id, cantidad, fecha_recepcion)
SELECT id, 1, fecha_recibido
FROM repuestos_caso
WHERE fecha_recibido IS NOT NULL OR estado_codigo IN ('RECIBIDO', 'INSTALADO');
