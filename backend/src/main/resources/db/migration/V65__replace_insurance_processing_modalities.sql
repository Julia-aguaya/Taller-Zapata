-- Preserve historical processing records while consolidating the selectable modalities.
INSERT INTO modalidades_tramitacion_seguro (codigo, nombre, activo) VALUES
    ('PRESENCIAL', 'Presencial', 1),
    ('POR_FOTOS', 'Por fotos', 1);

-- CONVENIO and INSPECCION require an in-person process; EXPRESS is handled by photos.
UPDATE caso_tramitacion_seguro
SET modalidad_codigo = CASE modalidad_codigo
    WHEN 'CONVENIO' THEN 'PRESENCIAL'
    WHEN 'INSPECCION' THEN 'PRESENCIAL'
    WHEN 'EXPRESS' THEN 'POR_FOTOS'
    ELSE modalidad_codigo
END
WHERE modalidad_codigo IN ('CONVENIO', 'INSPECCION', 'EXPRESS');

DELETE FROM modalidades_tramitacion_seguro
WHERE codigo IN ('CONVENIO', 'INSPECCION', 'EXPRESS');
