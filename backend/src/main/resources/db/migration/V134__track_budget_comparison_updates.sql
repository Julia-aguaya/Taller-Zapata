ALTER TABLE comparacion_presupuesto_snapshot
    ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

UPDATE comparacion_presupuesto_snapshot
SET updated_at = created_at;
