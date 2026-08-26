-- Activation controls whether the extra-budget draft is exposed. It is independent from customer confirmation.
ALTER TABLE presupuestos_extra
    ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;
