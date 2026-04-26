CREATE TABLE informes_estado (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE tareas_presupuesto (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE niveles_danio (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE decisiones_repuesto (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE acciones_presupuesto (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE estados_repuesto (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE compra_por_repuesto (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE pagos_estado_repuesto (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE presupuestos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    organizacion_id BIGINT UNSIGNED NOT NULL,
    sucursal_id BIGINT UNSIGNED NOT NULL,
    fecha_presupuesto DATE NOT NULL,
    informe_estado_codigo VARCHAR(40) NOT NULL,
    mano_obra_sin_iva DECIMAL(14,2) NOT NULL DEFAULT 0,
    alicuota_iva DECIMAL(5,2) NOT NULL DEFAULT 21.00,
    mano_obra_iva DECIMAL(14,2) NOT NULL DEFAULT 0,
    mano_obra_con_iva DECIMAL(14,2) NOT NULL DEFAULT 0,
    repuestos_total DECIMAL(14,2) NOT NULL DEFAULT 0,
    total_cotizado DECIMAL(14,2) NOT NULL DEFAULT 0,
    dias_estimados INT NULL,
    monto_minimo_cierre_mo DECIMAL(14,2) NULL,
    observaciones TEXT NULL,
    version_actual INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_presupuestos_caso (caso_id),
    CONSTRAINT fk_presupuestos_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_presupuestos_organizacion FOREIGN KEY (organizacion_id) REFERENCES organizaciones (id),
    CONSTRAINT fk_presupuestos_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales (id),
    CONSTRAINT fk_presupuestos_informe_estado FOREIGN KEY (informe_estado_codigo) REFERENCES informes_estado (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE presupuesto_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    presupuesto_id BIGINT UNSIGNED NOT NULL,
    orden_visual INT NOT NULL DEFAULT 0,
    pieza_afectada VARCHAR(150) NOT NULL,
    tarea_codigo VARCHAR(40) NULL,
    nivel_danio_codigo VARCHAR(40) NULL,
    decision_repuesto_codigo VARCHAR(40) NULL,
    accion_codigo VARCHAR(40) NULL,
    requiere_reemplazo TINYINT(1) NOT NULL DEFAULT 0,
    valor_repuesto DECIMAL(14,2) NOT NULL DEFAULT 0,
    horas_estimadas DECIMAL(8,2) NULL,
    importe_mano_obra DECIMAL(14,2) NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    KEY idx_presupuesto_items_presupuesto (presupuesto_id, orden_visual),
    CONSTRAINT fk_presupuesto_items_presupuesto FOREIGN KEY (presupuesto_id) REFERENCES presupuestos (id) ON DELETE CASCADE,
    CONSTRAINT fk_presupuesto_items_tarea FOREIGN KEY (tarea_codigo) REFERENCES tareas_presupuesto (codigo),
    CONSTRAINT fk_presupuesto_items_nivel_danio FOREIGN KEY (nivel_danio_codigo) REFERENCES niveles_danio (codigo),
    CONSTRAINT fk_presupuesto_items_decision_repuesto FOREIGN KEY (decision_repuesto_codigo) REFERENCES decisiones_repuesto (codigo),
    CONSTRAINT fk_presupuesto_items_accion FOREIGN KEY (accion_codigo) REFERENCES acciones_presupuesto (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE repuestos_caso (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    caso_id BIGINT UNSIGNED NOT NULL,
    presupuesto_item_id BIGINT UNSIGNED NULL,
    descripcion VARCHAR(200) NOT NULL,
    codigo_pieza VARCHAR(80) NULL,
    proveedor_final VARCHAR(150) NULL,
    autorizado_codigo VARCHAR(40) NULL,
    estado_codigo VARCHAR(40) NOT NULL,
    compra_por_codigo VARCHAR(40) NULL,
    pago_estado_codigo VARCHAR(40) NULL,
    precio_presupuestado DECIMAL(14,2) NULL,
    precio_final DECIMAL(14,2) NULL,
    fecha_recibido DATE NULL,
    usado TINYINT(1) NOT NULL DEFAULT 0,
    devuelto TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_repuestos_caso_caso_estado (caso_id, estado_codigo),
    KEY idx_repuestos_caso_presupuesto_item (presupuesto_item_id),
    CONSTRAINT fk_repuestos_caso_caso FOREIGN KEY (caso_id) REFERENCES casos (id) ON DELETE CASCADE,
    CONSTRAINT fk_repuestos_caso_presupuesto_item FOREIGN KEY (presupuesto_item_id) REFERENCES presupuesto_items (id),
    CONSTRAINT fk_repuestos_caso_autorizado FOREIGN KEY (autorizado_codigo) REFERENCES autorizaciones_repuestos_seguro (codigo),
    CONSTRAINT fk_repuestos_caso_estado FOREIGN KEY (estado_codigo) REFERENCES estados_repuesto (codigo),
    CONSTRAINT fk_repuestos_caso_compra_por FOREIGN KEY (compra_por_codigo) REFERENCES compra_por_repuesto (codigo),
    CONSTRAINT fk_repuestos_caso_pago_estado FOREIGN KEY (pago_estado_codigo) REFERENCES pagos_estado_repuesto (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO informes_estado (codigo, nombre, activo) VALUES
('BORRADOR', 'Borrador', 1),
('PENDIENTE', 'Pendiente', 1),
('APROBADO', 'Aprobado', 1),
('RECHAZADO', 'Rechazado', 1),
('CERRADO', 'Cerrado', 1);

INSERT INTO tareas_presupuesto (codigo, nombre, activo) VALUES
('CHAPA', 'Chapa', 1),
('PINTURA', 'Pintura', 1),
('MECANICA', 'Mecanica', 1),
('ELECTRICIDAD', 'Electricidad', 1),
('PULIDO', 'Pulido', 1),
('OTRO', 'Otro', 1);

INSERT INTO niveles_danio (codigo, nombre, activo) VALUES
('LEVE', 'Leve', 1),
('MEDIO', 'Medio', 1),
('GRAVE', 'Grave', 1),
('TOTAL', 'Total', 1);

INSERT INTO decisiones_repuesto (codigo, nombre, activo) VALUES
('REPARAR', 'Reparar', 1),
('REEMPLAZAR', 'Reemplazar', 1),
('PULIR', 'Pulir', 1),
('NO_APLICA', 'No aplica', 1);

INSERT INTO acciones_presupuesto (codigo, nombre, activo) VALUES
('DESABOLLAR', 'Desabollar', 1),
('ENDEREZAR', 'Enderezar', 1),
('PINTAR', 'Pintar', 1),
('CAMBIAR', 'Cambiar', 1),
('REPARAR', 'Reparar', 1),
('AJUSTAR', 'Ajustar', 1),
('LIMPIAR', 'Limpiar', 1);

INSERT INTO estados_repuesto (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', 1),
('PEDIDO', 'Pedido', 1),
('EN_CAMINO', 'En camino', 1),
('RECIBIDO', 'Recibido', 1),
('INSTALADO', 'Instalado', 1),
('DEVUELTO', 'Devuelto', 1),
('CANCELADO', 'Cancelado', 1);

INSERT INTO compra_por_repuesto (codigo, nombre, activo) VALUES
('TALLER', 'Taller', 1),
('COMPANIA', 'Compania', 1),
('CLIENTE', 'Cliente', 1),
('TERCERO', 'Tercero', 1);

INSERT INTO pagos_estado_repuesto (codigo, nombre, activo) VALUES
('PENDIENTE', 'Pendiente', 1),
('PAGADO', 'Pagado', 1),
('NO_APLICA', 'No aplica', 1);

INSERT INTO permisos (codigo, nombre, modulo, descripcion) VALUES
('presupuesto.ver', 'Ver presupuestos', 'budget', 'Permite consultar presupuestos y repuestos'),
('presupuesto.crear', 'Crear presupuestos', 'budget', 'Permite crear y editar presupuestos y repuestos');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 1, id, 1 FROM permisos WHERE codigo IN ('presupuesto.ver', 'presupuesto.crear');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 2, id, 1 FROM permisos WHERE codigo IN ('presupuesto.ver', 'presupuesto.crear');
