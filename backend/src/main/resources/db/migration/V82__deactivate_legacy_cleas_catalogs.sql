-- Desactiva los códigos legacy de CLEAS que quedaron activos desde V20
-- y que el código ya no usa (fueron reemplazados por los de V80).

UPDATE alcances_cleas SET activo = 0
WHERE codigo IN ('PARCIAL', 'TOTAL', 'NO_CUBIERTO');

UPDATE dictamenes_cleas SET activo = 0
WHERE codigo IN ('FAVORABLE', 'DESFAVORABLE');
