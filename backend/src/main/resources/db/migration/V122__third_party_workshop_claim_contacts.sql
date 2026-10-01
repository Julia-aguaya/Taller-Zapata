ALTER TABLE caso_terceros ADD COLUMN tramitador_caso_persona_id BIGINT UNSIGNED NULL;
ALTER TABLE caso_terceros ADD COLUMN tramitador_nombre_snapshot VARCHAR(180) NULL;
ALTER TABLE caso_terceros ADD COLUMN tramitador_email_snapshot VARCHAR(255) NULL;
ALTER TABLE caso_terceros ADD COLUMN tramitador_telefono_snapshot VARCHAR(80) NULL;
ALTER TABLE caso_terceros ADD COLUMN inspector_caso_persona_id BIGINT UNSIGNED NULL;
ALTER TABLE caso_terceros ADD COLUMN inspector_nombre_snapshot VARCHAR(180) NULL;
ALTER TABLE caso_terceros ADD COLUMN inspector_email_snapshot VARCHAR(255) NULL;
ALTER TABLE caso_terceros ADD COLUMN inspector_telefono_snapshot VARCHAR(80) NULL;
ALTER TABLE caso_terceros ADD COLUMN vehiculo_tercero_id BIGINT UNSIGNED NULL;
ALTER TABLE caso_terceros ADD COLUMN conductor_caso_persona_id BIGINT UNSIGNED NULL;

ALTER TABLE caso_terceros ADD CONSTRAINT fk_caso_terceros_tramitador FOREIGN KEY (tramitador_caso_persona_id) REFERENCES caso_personas(id);
ALTER TABLE caso_terceros ADD CONSTRAINT fk_caso_terceros_inspector FOREIGN KEY (inspector_caso_persona_id) REFERENCES caso_personas(id);
ALTER TABLE caso_terceros ADD CONSTRAINT fk_caso_terceros_vehiculo FOREIGN KEY (vehiculo_tercero_id) REFERENCES vehiculos(id);
ALTER TABLE caso_terceros ADD CONSTRAINT fk_caso_terceros_conductor FOREIGN KEY (conductor_caso_persona_id) REFERENCES caso_personas(id);
