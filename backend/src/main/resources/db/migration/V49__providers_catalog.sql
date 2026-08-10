CREATE TABLE proveedores (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    nombre VARCHAR(180) NOT NULL,
    telefono VARCHAR(50) NULL,
    email VARCHAR(180) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_proveedores_public_id (public_id),
    KEY idx_proveedores_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE repuestos_caso ADD COLUMN proveedor_id BIGINT UNSIGNED NULL;
ALTER TABLE repuestos_caso ADD KEY idx_repuestos_caso_proveedor (proveedor_id);
ALTER TABLE repuestos_caso ADD CONSTRAINT fk_repuestos_caso_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id);

ALTER TABLE cotizaciones_repuesto ADD COLUMN proveedor_id BIGINT UNSIGNED NULL;
ALTER TABLE cotizaciones_repuesto ADD KEY idx_cotizaciones_repuesto_proveedor (proveedor_id);
ALTER TABLE cotizaciones_repuesto ADD CONSTRAINT fk_cotizaciones_repuesto_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id);

ALTER TABLE presupuestos ADD COLUMN proveedor_id BIGINT UNSIGNED NULL;
ALTER TABLE presupuestos ADD KEY idx_presupuestos_proveedor (proveedor_id);
ALTER TABLE presupuestos ADD CONSTRAINT fk_presupuestos_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id);

ALTER TABLE caso_tramitacion_seguro ADD COLUMN proveedor_id BIGINT UNSIGNED NULL;
ALTER TABLE caso_tramitacion_seguro ADD KEY idx_caso_tramitacion_seguro_proveedor (proveedor_id);
ALTER TABLE caso_tramitacion_seguro ADD CONSTRAINT fk_caso_tramitacion_seguro_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id);

INSERT INTO permisos (codigo, nombre, modulo, descripcion)
SELECT 'proveedor.ver', 'Ver proveedores', 'providers', 'Permite consultar proveedores'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE codigo = 'proveedor.ver');
INSERT INTO permisos (codigo, nombre, modulo, descripcion)
SELECT 'proveedor.gestionar', 'Gestionar proveedores', 'providers', 'Permite crear, editar y desactivar proveedores'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE codigo = 'proveedor.gestionar');
INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT r.id, p.id, 1 FROM roles r JOIN permisos p ON p.codigo IN ('proveedor.ver', 'proveedor.gestionar')
WHERE r.id IN (1, 2) AND NOT EXISTS (SELECT 1 FROM rol_permisos rp WHERE rp.rol_id = r.id AND rp.permiso_id = p.id);
