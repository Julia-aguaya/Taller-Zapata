ALTER TABLE presupuesto_items
    ADD COLUMN proveedor_id BIGINT UNSIGNED NULL,
    ADD COLUMN proveedor_snapshot VARCHAR(180) NULL,
    ADD KEY idx_presupuesto_items_proveedor (proveedor_id),
    ADD CONSTRAINT fk_presupuesto_items_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id);

ALTER TABLE repuestos_caso
    ADD COLUMN provider_assignment_origin ENUM('BUDGET_ITEM', 'MANUAL') NULL;

ALTER TABLE repuestos_caso
    ADD UNIQUE KEY uq_repuestos_caso_presupuesto_item (caso_id, presupuesto_item_id);
