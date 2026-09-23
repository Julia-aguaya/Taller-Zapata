ALTER TABLE particular_effective_state
    ADD COLUMN comprobante_intencion_codigo VARCHAR(1) NULL;

ALTER TABLE particular_effective_state
    ADD CONSTRAINT chk_particular_effective_state_comprobante_intencion
    CHECK (comprobante_intencion_codigo IS NULL OR comprobante_intencion_codigo IN ('A', 'C', 'R'));
