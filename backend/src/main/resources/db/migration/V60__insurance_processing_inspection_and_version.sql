ALTER TABLE caso_tramitacion_seguro ADD COLUMN fecha_inspeccion DATE NULL;
ALTER TABLE caso_tramitacion_seguro ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
