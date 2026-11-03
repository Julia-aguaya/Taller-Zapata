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
    'documentacion.marcar_incompleta',
    'workflow.documentacion.completar',
    0,
    NULL,
    1
FROM workflow_estados origen
JOIN workflow_estados destino
    ON destino.dominio = 'documentacion' AND destino.codigo = 'PENDIENTE_DOCS'
WHERE origen.dominio = 'documentacion' AND origen.codigo = 'COMPLETA'
  AND NOT EXISTS (
      SELECT 1 FROM workflow_transiciones wt
      WHERE wt.dominio = 'documentacion'
        AND wt.estado_origen_id = origen.id
        AND wt.accion_codigo = 'documentacion.marcar_incompleta'
  );
