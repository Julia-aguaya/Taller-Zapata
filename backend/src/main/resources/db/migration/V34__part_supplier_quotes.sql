-- Catálogo: tipos de facturación para cotizaciones
CREATE TABLE facturacion_cotizacion (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
);

INSERT INTO facturacion_cotizacion (codigo, nombre) VALUES
('A', 'Factura A'),
('C', 'Factura C'),
('SIN_F', 'Sin Factura');

-- Catálogo: medios de pago para cotizaciones
CREATE TABLE medio_pago_cotizacion (
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (codigo)
);

INSERT INTO medio_pago_cotizacion (codigo, nombre) VALUES
('TARJETA_1_PAGO', 'Tarjeta 1 pago'),
('TARJETA_CUOTAS', 'Tarjetas cuotas'),
('CONTADO', 'Contado'),
('TRANSFERENCIA', 'Transferencia');

-- Cotizaciones de repuestos por proveedor
CREATE TABLE cotizaciones_repuesto (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    repuesto_id BIGINT UNSIGNED NOT NULL,
    proveedor VARCHAR(150) NOT NULL,
    importe DECIMAL(14,2) NOT NULL,
    facturacion_codigo VARCHAR(40) NOT NULL,
    medio_pago_codigo VARCHAR(40) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_cotizaciones_repuesto_repuesto FOREIGN KEY (repuesto_id) REFERENCES repuestos_caso(id) ON DELETE CASCADE,
    CONSTRAINT fk_cotizaciones_facturacion FOREIGN KEY (facturacion_codigo) REFERENCES facturacion_cotizacion(codigo),
    CONSTRAINT fk_cotizaciones_medio_pago FOREIGN KEY (medio_pago_codigo) REFERENCES medio_pago_cotizacion(codigo)
);
