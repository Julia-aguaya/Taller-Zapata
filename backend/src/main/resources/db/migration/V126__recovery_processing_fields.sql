ALTER TABLE recuperos_franquicia ADD COLUMN fecha_derivado_inspeccion DATE NULL;
ALTER TABLE recuperos_franquicia ADD COLUMN fecha_inspeccion DATE NULL;
ALTER TABLE recuperos_franquicia ADD COLUMN modalidad_codigo VARCHAR(40) NULL;
ALTER TABLE recuperos_franquicia ADD COLUMN cotizacion_estado_codigo VARCHAR(40) NULL;
ALTER TABLE recuperos_franquicia ADD COLUMN fecha_cotizacion DATE NULL;
ALTER TABLE recuperos_franquicia ADD COLUMN lleva_repuestos TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE recuperos_franquicia ADD COLUMN repara_vehiculo TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE recuperos_franquicia ADD COLUMN provision_repuestos_codigo VARCHAR(40) NULL;
