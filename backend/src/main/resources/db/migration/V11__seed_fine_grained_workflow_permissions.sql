INSERT IGNORE INTO permisos (codigo, nombre, modulo, descripcion)
VALUES
('workflow.tramite.avanzar', 'Avanzar tramite', 'workflow', 'Permite mover el dominio tramite a su siguiente estado'),
('workflow.tramite.cerrar', 'Cerrar tramite', 'workflow', 'Permite cerrar el dominio tramite'),
('workflow.reparacion.asignar_turno', 'Asignar turno de reparacion', 'workflow', 'Permite pasar reparacion a con turno'),
('workflow.reparacion.cerrar', 'Cerrar reparacion', 'workflow', 'Permite cerrar reparacion'),
('workflow.pago.marcar_pagado', 'Marcar pago', 'workflow', 'Permite marcar el dominio pago como pagado'),
('workflow.documentacion.completar', 'Completar documentacion', 'workflow', 'Permite cerrar el dominio documentacion'),
('workflow.legal.iniciar', 'Iniciar gestion legal', 'workflow', 'Permite iniciar gestion legal del caso');

INSERT IGNORE INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 1, p.id, 1
FROM permisos p
WHERE p.codigo IN (
    'workflow.tramite.avanzar',
    'workflow.tramite.cerrar',
    'workflow.reparacion.asignar_turno',
    'workflow.reparacion.cerrar',
    'workflow.pago.marcar_pagado',
    'workflow.documentacion.completar',
    'workflow.legal.iniciar'
);

INSERT IGNORE INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 2, p.id, 1
FROM permisos p
WHERE p.codigo IN (
    'workflow.tramite.avanzar',
    'workflow.tramite.cerrar',
    'workflow.reparacion.asignar_turno',
    'workflow.reparacion.cerrar',
    'workflow.pago.marcar_pagado',
    'workflow.documentacion.completar',
    'workflow.legal.iniciar'
);

UPDATE workflow_transiciones
SET requiere_permiso_codigo = 'workflow.tramite.avanzar'
WHERE accion_codigo = 'tramite.avanzar';

UPDATE workflow_transiciones
SET requiere_permiso_codigo = 'workflow.tramite.cerrar'
WHERE accion_codigo = 'tramite.cerrar';

UPDATE workflow_transiciones
SET requiere_permiso_codigo = 'workflow.reparacion.asignar_turno'
WHERE accion_codigo = 'reparacion.asignar_turno';

UPDATE workflow_transiciones
SET requiere_permiso_codigo = 'workflow.reparacion.cerrar'
WHERE accion_codigo = 'reparacion.cerrar';

UPDATE workflow_transiciones
SET requiere_permiso_codigo = 'workflow.pago.marcar_pagado'
WHERE accion_codigo = 'pago.marcar_pagado';

UPDATE workflow_transiciones
SET requiere_permiso_codigo = 'workflow.documentacion.completar'
WHERE accion_codigo = 'documentacion.completar';

UPDATE workflow_transiciones
SET requiere_permiso_codigo = 'workflow.legal.iniciar'
WHERE accion_codigo = 'legal.iniciar';
