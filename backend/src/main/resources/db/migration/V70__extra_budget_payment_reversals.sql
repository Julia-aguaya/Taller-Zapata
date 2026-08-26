ALTER TABLE presupuesto_extra_pago_aplicaciones
    ADD COLUMN revierte_aplicacion_id BIGINT UNSIGNED NULL;

ALTER TABLE presupuesto_extra_pago_aplicaciones
    ADD UNIQUE KEY uq_presupuesto_extra_pago_aplicaciones_reversion (revierte_aplicacion_id);

ALTER TABLE presupuesto_extra_pago_aplicaciones
    ADD CONSTRAINT fk_presupuesto_extra_pago_aplicaciones_reversion
        FOREIGN KEY (revierte_aplicacion_id) REFERENCES presupuesto_extra_pago_aplicaciones (id);
