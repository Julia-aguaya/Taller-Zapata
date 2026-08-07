ALTER TABLE casos ADD COLUMN referenciador_id BIGINT;
ALTER TABLE casos ADD CONSTRAINT fk_caso_referenciador FOREIGN KEY (referenciador_id) REFERENCES referenciadores(id);
