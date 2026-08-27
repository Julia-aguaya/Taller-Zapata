-- Phase 1: add only compatible columns. Existing rows are classified before any source constraint.
ALTER TABLE presupuesto_trabajos_extras
    ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE repuestos_caso
    ADD COLUMN source_type ENUM('BUDGET_ITEM', 'ACCESSORY_WORK', 'MANUAL') NULL;
ALTER TABLE repuestos_caso
    ADD COLUMN accessory_work_id BIGINT UNSIGNED NULL;
ALTER TABLE repuestos_caso
    ADD COLUMN non_canonical TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE repuestos_caso
    ADD COLUMN is_accessory TINYINT(1) NOT NULL DEFAULT 0;

CREATE TABLE repuestos_caso_reconciliation_warnings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    repuesto_id BIGINT UNSIGNED NOT NULL,
    source_type ENUM('BUDGET_ITEM', 'ACCESSORY_WORK') NOT NULL,
    source_id BIGINT UNSIGNED NOT NULL,
    reason VARCHAR(200) NOT NULL,
    state ENUM('OPEN', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    resolution JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    resolved_by BIGINT UNSIGNED NULL,
    PRIMARY KEY (id),
    KEY idx_repuestos_caso_warnings_case_state (caso_id, state),
    UNIQUE KEY uq_repuestos_caso_warning_open (repuesto_id, source_type, source_id, state),
    CONSTRAINT fk_repuestos_caso_warning_case FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_repuestos_caso_warning_part FOREIGN KEY (repuesto_id) REFERENCES repuestos_caso (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE repuestos_caso_canonical_backfill_audit (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    source_type ENUM('BUDGET_ITEM', 'ACCESSORY_WORK') NOT NULL,
    source_id BIGINT UNSIGNED NOT NULL,
    canonical_repuesto_id BIGINT UNSIGNED NULL,
    affected_repuesto_id BIGINT UNSIGNED NOT NULL,
    action ENUM('MERGED_CLEAN_DUPLICATE', 'RETAINED_NONCANONICAL_DUPLICATE') NOT NULL,
    affected_row JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_repuestos_caso_canonical_backfill_audit_part (affected_repuesto_id),
    KEY idx_repuestos_caso_canonical_backfill_audit_case (caso_id),
    CONSTRAINT fk_repuestos_caso_canonical_backfill_audit_case FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A direct FK-backed Budget item is the only legacy source that can be identified exactly.
UPDATE repuestos_caso
SET source_type = 'BUDGET_ITEM', non_canonical = 0, is_accessory = 0
WHERE presupuesto_item_id IS NOT NULL;

-- Legacy rows with no stable canonical source are retained, never deleted, and excluded from sync.
UPDATE repuestos_caso
SET source_type = 'MANUAL', non_canonical = 1, is_accessory = 0
WHERE source_type IS NULL;

-- Phase 2: only exact same-source duplicates are considered. Any activity or ambiguous comparison
-- provenance retains every row as noncanonical and creates an OPEN, manually resolvable warning.
CREATE TEMPORARY TABLE tmp_rc_duplicate_groups AS
SELECT caso_id, presupuesto_item_id AS source_id
FROM repuestos_caso
WHERE source_type = 'BUDGET_ITEM'
GROUP BY caso_id, presupuesto_item_id
HAVING COUNT(*) > 1;

CREATE TEMPORARY TABLE tmp_rc_duplicate_rows AS
SELECT rc.id,
       rc.caso_id,
       rc.presupuesto_item_id AS source_id,
       CASE WHEN rc.autorizado_codigo IS NOT NULL
                  OR rc.estado_codigo <> 'PENDIENTE'
                  OR rc.compra_por_codigo IS NOT NULL
                  OR rc.pago_estado_codigo IS NOT NULL
                  OR rc.fecha_recibido IS NOT NULL
                  OR COALESCE(rc.usado, 0) <> 0
                  OR COALESCE(rc.devuelto, 0) <> 0
                  OR rc.numero_inventario IS NOT NULL
                  OR rc.codigo_pieza IS NOT NULL
                  OR rc.provider_assignment_origin = 'MANUAL'
                  OR rc.source_comparison_piece_id IS NOT NULL
                  OR EXISTS (SELECT 1 FROM cotizaciones_repuesto quote_row WHERE quote_row.repuesto_id = rc.id)
            THEN 1 ELSE 0 END AS has_activity_or_ambiguous,
        ((CASE WHEN rc.proveedor_id IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN rc.proveedor_final IS NOT NULL THEN 1 ELSE 0 END) +
         (CASE WHEN rc.autorizado_codigo IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN rc.compra_por_codigo IS NOT NULL THEN 1 ELSE 0 END) +
         (CASE WHEN rc.pago_estado_codigo IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN rc.precio_presupuestado IS NOT NULL THEN 1 ELSE 0 END) +
         (CASE WHEN rc.precio_final IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN rc.fecha_recibido IS NOT NULL THEN 1 ELSE 0 END) +
         (CASE WHEN COALESCE(rc.usado, 0) <> 0 THEN 1 ELSE 0 END) + (CASE WHEN COALESCE(rc.devuelto, 0) <> 0 THEN 1 ELSE 0 END) +
         (CASE WHEN rc.numero_inventario IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN rc.codigo_pieza IS NOT NULL THEN 1 ELSE 0 END)) AS completeness
FROM repuestos_caso rc
JOIN tmp_rc_duplicate_groups duplicate_group
  ON duplicate_group.caso_id = rc.caso_id
 AND duplicate_group.source_id = rc.presupuesto_item_id;

CREATE TEMPORARY TABLE tmp_rc_ambiguous_groups AS
SELECT caso_id, source_id
FROM tmp_rc_duplicate_rows
GROUP BY caso_id, source_id
HAVING MAX(has_activity_or_ambiguous) = 1;

CREATE TEMPORARY TABLE tmp_rc_ambiguous_duplicate_rows AS
SELECT duplicate_row.*
FROM tmp_rc_duplicate_rows duplicate_row
JOIN tmp_rc_ambiguous_groups ambiguous_group
  ON ambiguous_group.caso_id = duplicate_row.caso_id
 AND ambiguous_group.source_id = duplicate_row.source_id;

INSERT INTO repuestos_caso_canonical_backfill_audit (
    caso_id, source_type, source_id, canonical_repuesto_id, affected_repuesto_id, action, affected_row
)
SELECT duplicate_row.caso_id, 'BUDGET_ITEM', duplicate_row.source_id, NULL, duplicate_row.id,
       'RETAINED_NONCANONICAL_DUPLICATE',
       JSON_OBJECT('id', rc.id, 'descripcion', rc.descripcion, 'codigo_pieza', rc.codigo_pieza,
                   'proveedor_id', rc.proveedor_id, 'proveedor_final', rc.proveedor_final,
                   'precio_presupuestado', rc.precio_presupuestado, 'precio_final', rc.precio_final,
                   'source_comparison_piece_id', rc.source_comparison_piece_id)
FROM tmp_rc_ambiguous_duplicate_rows duplicate_row
JOIN repuestos_caso rc ON rc.id = duplicate_row.id;

UPDATE repuestos_caso rc
SET rc.non_canonical = 1
WHERE rc.id IN (SELECT id FROM tmp_rc_ambiguous_duplicate_rows);

INSERT INTO repuestos_caso_reconciliation_warnings (caso_id, repuesto_id, source_type, source_id, reason)
SELECT duplicate_row.caso_id, duplicate_row.id, 'BUDGET_ITEM', duplicate_row.source_id,
       'Duplicado histórico con actividad o procedencia ambigua; requiere resolución manual'
FROM tmp_rc_ambiguous_duplicate_rows duplicate_row;

CREATE TEMPORARY TABLE tmp_rc_clean_duplicate_losers AS
SELECT ranked.id, ranked.caso_id, ranked.source_id, ranked.canonical_repuesto_id
FROM (
    SELECT duplicate_row.id,
           duplicate_row.caso_id,
           duplicate_row.source_id,
           FIRST_VALUE(duplicate_row.id) OVER (
               PARTITION BY duplicate_row.caso_id, duplicate_row.source_id
               ORDER BY duplicate_row.completeness DESC, duplicate_row.id ASC
           ) AS canonical_repuesto_id,
           ROW_NUMBER() OVER (
               PARTITION BY duplicate_row.caso_id, duplicate_row.source_id
               ORDER BY duplicate_row.completeness DESC, duplicate_row.id ASC
           ) AS rn
    FROM tmp_rc_duplicate_rows duplicate_row
    LEFT JOIN tmp_rc_ambiguous_duplicate_rows ambiguous_row ON ambiguous_row.id = duplicate_row.id
    WHERE ambiguous_row.id IS NULL
) ranked
WHERE ranked.rn > 1;

-- The merged-rows audit is recorded first so it can serve as the permanent
-- relocation map below; no statement here touches a temporary table twice.
INSERT INTO repuestos_caso_canonical_backfill_audit (
    caso_id, source_type, source_id, canonical_repuesto_id, affected_repuesto_id, action, affected_row
)
SELECT loser.caso_id, 'BUDGET_ITEM', loser.source_id, loser.canonical_repuesto_id, loser.id,
       'MERGED_CLEAN_DUPLICATE',
       JSON_OBJECT('id', rc.id, 'descripcion', rc.descripcion, 'codigo_pieza', rc.codigo_pieza,
                   'proveedor_id', rc.proveedor_id, 'proveedor_final', rc.proveedor_final,
                   'precio_presupuestado', rc.precio_presupuestado, 'precio_final', rc.precio_final,
                   'source_comparison_piece_id', rc.source_comparison_piece_id)
FROM tmp_rc_clean_duplicate_losers loser
JOIN repuestos_caso rc ON rc.id = loser.id;

-- Quotes are moved before deleting an activity-free duplicate; no dependent quote/history is lost.
UPDATE cotizaciones_repuesto quote_row
SET quote_row.repuesto_id =
        (SELECT audit.canonical_repuesto_id
         FROM repuestos_caso_canonical_backfill_audit audit
         WHERE audit.action = 'MERGED_CLEAN_DUPLICATE'
           AND audit.affected_repuesto_id = quote_row.repuesto_id)
WHERE quote_row.repuesto_id IN (
        SELECT audit2.affected_repuesto_id
        FROM repuestos_caso_canonical_backfill_audit audit2
        WHERE audit2.action = 'MERGED_CLEAN_DUPLICATE'
);

DELETE FROM repuestos_caso
WHERE id IN (
    SELECT merged.affected_repuesto_id
    FROM repuestos_caso_canonical_backfill_audit merged
    WHERE merged.action = 'MERGED_CLEAN_DUPLICATE'
);

DROP TABLE tmp_rc_clean_duplicate_losers;
DROP TABLE tmp_rc_ambiguous_groups;
DROP TABLE tmp_rc_ambiguous_duplicate_rows;
DROP TABLE tmp_rc_duplicate_rows;
DROP TABLE tmp_rc_duplicate_groups;

-- Phase 3: all existing rows now have a valid source shape, so constraints are safe to enforce.
ALTER TABLE repuestos_caso
    MODIFY COLUMN source_type ENUM('BUDGET_ITEM', 'ACCESSORY_WORK', 'MANUAL') NOT NULL;
ALTER TABLE repuestos_caso
    ADD CONSTRAINT fk_repuestos_caso_accessory_work FOREIGN KEY (accessory_work_id) REFERENCES presupuesto_trabajos_extras (id);
CREATE INDEX idx_repuestos_caso_accessory_work ON repuestos_caso (accessory_work_id);
CREATE UNIQUE INDEX uq_repuestos_caso_accessory_work ON repuestos_caso (caso_id, accessory_work_id);
ALTER TABLE repuestos_caso
    ADD CONSTRAINT ck_repuestos_caso_source CHECK (
        (source_type = 'BUDGET_ITEM' AND presupuesto_item_id IS NOT NULL AND accessory_work_id IS NULL)
        OR (source_type = 'ACCESSORY_WORK' AND presupuesto_item_id IS NULL AND accessory_work_id IS NOT NULL)
        OR (source_type = 'MANUAL' AND presupuesto_item_id IS NULL AND accessory_work_id IS NULL)
    );
