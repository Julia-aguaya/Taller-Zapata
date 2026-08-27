-- Repair historical duplicate direct links before the unique constraint in V64.
-- The canonical row is the most operationally complete one; id makes ties deterministic.
CREATE TABLE IF NOT EXISTS repuestos_caso_deduplicacion_auditoria (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    presupuesto_item_id BIGINT UNSIGNED NOT NULL,
    canonical_repuesto_id BIGINT UNSIGNED NOT NULL,
    discarded_repuesto_id BIGINT UNSIGNED NOT NULL,
    discarded_row JSON NOT NULL,
    repaired_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_repuestos_caso_deduplicacion_descartado (discarded_repuesto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TEMPORARY TABLE tmp_repuestos_caso_canonicos AS
SELECT id, caso_id, presupuesto_item_id
FROM (
    SELECT rc.id, rc.caso_id, rc.presupuesto_item_id,
           ROW_NUMBER() OVER (
               PARTITION BY rc.caso_id, rc.presupuesto_item_id
               ORDER BY
                   ((CASE WHEN rc.proveedor_id IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN rc.proveedor_final IS NOT NULL THEN 1 ELSE 0 END) +
                    (CASE WHEN rc.autorizado_codigo IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN rc.compra_por_codigo IS NOT NULL THEN 1 ELSE 0 END) +
                    (CASE WHEN rc.pago_estado_codigo IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN rc.precio_presupuestado IS NOT NULL THEN 1 ELSE 0 END) +
                    (CASE WHEN rc.precio_final IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN rc.fecha_recibido IS NOT NULL THEN 1 ELSE 0 END) +
                    (CASE WHEN COALESCE(rc.usado, 0) <> 0 THEN 1 ELSE 0 END) + (CASE WHEN COALESCE(rc.devuelto, 0) <> 0 THEN 1 ELSE 0 END) +
                    (CASE WHEN rc.numero_inventario IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN rc.codigo_pieza IS NOT NULL THEN 1 ELSE 0 END)) DESC,
                   rc.id ASC
            ) AS ranking
    FROM repuestos_caso rc
    WHERE rc.presupuesto_item_id IS NOT NULL
) ranked
WHERE ranking = 1;

CREATE TEMPORARY TABLE tmp_repuestos_caso_descartados AS
SELECT rc.id, rc.caso_id, rc.presupuesto_item_id, canonical.id AS canonical_repuesto_id
FROM repuestos_caso rc
JOIN tmp_repuestos_caso_canonicos canonical
  ON canonical.caso_id = rc.caso_id AND canonical.presupuesto_item_id = rc.presupuesto_item_id
WHERE rc.presupuesto_item_id IS NOT NULL AND rc.id <> canonical.id;

INSERT INTO repuestos_caso_deduplicacion_auditoria (
    caso_id, presupuesto_item_id, canonical_repuesto_id, discarded_repuesto_id, discarded_row
)
SELECT discarded.caso_id, discarded.presupuesto_item_id, discarded.canonical_repuesto_id, discarded.id,
       JSON_OBJECT(
           'id', rc.id, 'descripcion', rc.descripcion, 'codigo_pieza', rc.codigo_pieza,
           'proveedor_final', rc.proveedor_final, 'proveedor_id', rc.proveedor_id,
           'autorizado_codigo', rc.autorizado_codigo, 'estado_codigo', rc.estado_codigo,
           'compra_por_codigo', rc.compra_por_codigo, 'pago_estado_codigo', rc.pago_estado_codigo,
           'precio_presupuestado', rc.precio_presupuestado, 'precio_final', rc.precio_final,
           'fecha_recibido', rc.fecha_recibido, 'usado', rc.usado, 'devuelto', rc.devuelto,
           'numero_inventario', rc.numero_inventario, 'source_comparison_piece_id', rc.source_comparison_piece_id
       )
FROM tmp_repuestos_caso_descartados discarded
JOIN repuestos_caso rc ON rc.id = discarded.id;

-- Cotizaciones are dependent operational data, so retain them by moving them to the winner.
-- Uses the already-populated permanent audit table as the relocation map so the
-- statement never touches a temporary table twice (MySQL forbids reopening them).
UPDATE cotizaciones_repuesto quote_row
SET quote_row.repuesto_id =
        (SELECT audit.canonical_repuesto_id
         FROM repuestos_caso_deduplicacion_auditoria audit
         WHERE audit.discarded_repuesto_id = quote_row.repuesto_id)
WHERE quote_row.repuesto_id IN (
        SELECT audit2.discarded_repuesto_id
        FROM repuestos_caso_deduplicacion_auditoria audit2
);

DELETE FROM repuestos_caso
WHERE id IN (SELECT discarded.discarded_repuesto_id FROM repuestos_caso_deduplicacion_auditoria discarded);

DROP TABLE tmp_repuestos_caso_descartados;
DROP TABLE tmp_repuestos_caso_canonicos;
