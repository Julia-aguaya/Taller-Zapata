ALTER TABLE presupuesto_items
    ADD COLUMN proveedor_id BIGINT UNSIGNED NULL;
ALTER TABLE presupuesto_items
    ADD COLUMN proveedor_snapshot VARCHAR(180) NULL;
CREATE INDEX idx_presupuesto_items_proveedor ON presupuesto_items (proveedor_id);
ALTER TABLE presupuesto_items
    ADD CONSTRAINT fk_presupuesto_items_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id);

ALTER TABLE repuestos_caso
    ADD COLUMN provider_assignment_origin ENUM('BUDGET_ITEM', 'MANUAL') NULL;

CREATE UNIQUE INDEX uq_repuestos_caso_presupuesto_item ON repuestos_caso (caso_id, presupuesto_item_id);
