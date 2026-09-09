INSERT INTO decisiones_repuesto (codigo, nombre, activo) VALUES
    ('DEBE_REEMPLAZARSE', 'Debe reemplazarse', 1),
    ('PUEDE_REPARARSE', 'Puede repararse', 1),
    ('A_VERIFICAR', 'A verificar', 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = 1;

UPDATE presupuesto_items SET decision_repuesto_codigo = CASE decision_repuesto_codigo
    WHEN 'REEMPLAZAR' THEN 'DEBE_REEMPLAZARSE'
    WHEN 'REPARAR' THEN 'PUEDE_REPARARSE'
    WHEN 'PULIR' THEN 'PUEDE_REPARARSE'
    WHEN 'NO_APLICA' THEN 'A_VERIFICAR'
    ELSE decision_repuesto_codigo END;

UPDATE decisiones_repuesto SET activo = 0 WHERE codigo NOT IN ('DEBE_REEMPLAZARSE', 'PUEDE_REPARARSE', 'A_VERIFICAR');
