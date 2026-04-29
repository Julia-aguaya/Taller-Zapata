ALTER TABLE casos ADD COLUMN estado_pago_actual_id BIGINT UNSIGNED NULL;
ALTER TABLE casos ADD COLUMN estado_documentacion_actual_id BIGINT UNSIGNED NULL;
ALTER TABLE casos ADD COLUMN estado_legal_actual_id BIGINT UNSIGNED NULL;
ALTER TABLE casos ADD CONSTRAINT fk_casos_estado_pago_actual FOREIGN KEY (estado_pago_actual_id) REFERENCES workflow_estados (id);
ALTER TABLE casos ADD CONSTRAINT fk_casos_estado_documentacion_actual FOREIGN KEY (estado_documentacion_actual_id) REFERENCES workflow_estados (id);
ALTER TABLE casos ADD CONSTRAINT fk_casos_estado_legal_actual FOREIGN KEY (estado_legal_actual_id) REFERENCES workflow_estados (id);

INSERT INTO workflow_estados (codigo, dominio, nombre, descripcion, orden_visual, terminal)
VALUES
('PENDIENTE', 'pago', 'Pendiente', 'Pago pendiente de gestion', 1, 0),
('PAGADO', 'pago', 'Pagado', 'Pago confirmado', 99, 1),
('PENDIENTE_DOCS', 'documentacion', 'Pendiente docs', 'Documentacion pendiente', 1, 0),
('COMPLETA', 'documentacion', 'Completa', 'Documentacion completa', 99, 1),
('SIN_GESTION', 'legal', 'Sin gestion', 'Sin gestion legal iniciada', 1, 0),
('EN_ESTUDIO', 'legal', 'En estudio', 'Gestion legal en curso', 2, 0)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    descripcion = VALUES(descripcion),
    orden_visual = VALUES(orden_visual),
    terminal = VALUES(terminal),
    activo = 1;

INSERT INTO workflow_transiciones (
    dominio,
    tipo_tramite_id,
    estado_origen_id,
    estado_destino_id,
    accion_codigo,
    requiere_permiso_codigo,
    automatica,
    regla_json,
    activo
)
SELECT
    'pago',
    NULL,
    origen.id,
    destino.id,
    'pago.marcar_pagado',
    'workflow.transicionar',
    0,
    NULL,
    1
FROM workflow_estados origen
JOIN workflow_estados destino
    ON destino.dominio = 'pago' AND destino.codigo = 'PAGADO'
WHERE origen.dominio = 'pago' AND origen.codigo = 'PENDIENTE'
  AND NOT EXISTS (
      SELECT 1 FROM workflow_transiciones wt
      WHERE wt.dominio = 'pago'
        AND wt.estado_origen_id = origen.id
        AND wt.accion_codigo = 'pago.marcar_pagado'
  );

INSERT INTO workflow_transiciones (
    dominio,
    tipo_tramite_id,
    estado_origen_id,
    estado_destino_id,
    accion_codigo,
    requiere_permiso_codigo,
    automatica,
    regla_json,
    activo
)
SELECT
    'documentacion',
    NULL,
    origen.id,
    destino.id,
    'documentacion.completar',
    'workflow.transicionar',
    0,
    NULL,
    1
FROM workflow_estados origen
JOIN workflow_estados destino
    ON destino.dominio = 'documentacion' AND destino.codigo = 'COMPLETA'
WHERE origen.dominio = 'documentacion' AND origen.codigo = 'PENDIENTE_DOCS'
  AND NOT EXISTS (
      SELECT 1 FROM workflow_transiciones wt
      WHERE wt.dominio = 'documentacion'
        AND wt.estado_origen_id = origen.id
        AND wt.accion_codigo = 'documentacion.completar'
  );

INSERT INTO workflow_transiciones (
    dominio,
    tipo_tramite_id,
    estado_origen_id,
    estado_destino_id,
    accion_codigo,
    requiere_permiso_codigo,
    automatica,
    regla_json,
    activo
)
SELECT
    'legal',
    NULL,
    origen.id,
    destino.id,
    'legal.iniciar',
    'workflow.transicionar',
    0,
    '{"field":"referenced","op":"EQ","value":true}',
    1
FROM workflow_estados origen
JOIN workflow_estados destino
    ON destino.dominio = 'legal' AND destino.codigo = 'EN_ESTUDIO'
WHERE origen.dominio = 'legal' AND origen.codigo = 'SIN_GESTION'
  AND NOT EXISTS (
      SELECT 1 FROM workflow_transiciones wt
      WHERE wt.dominio = 'legal'
        AND wt.estado_origen_id = origen.id
        AND wt.accion_codigo = 'legal.iniciar'
  );
