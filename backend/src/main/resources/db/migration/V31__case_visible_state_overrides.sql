ALTER TABLE casos
    ADD COLUMN estado_visible_tramite_override_codigo VARCHAR(40) NULL,
    ADD COLUMN estado_visible_reparacion_override_codigo VARCHAR(40) NULL;

INSERT IGNORE INTO permisos (codigo, nombre, modulo, descripcion)
VALUES ('workflow.estado.visible.override', 'Override manual de estados visibles', 'workflow', 'Permite definir manualmente el estado visible de tramite y reparacion');

INSERT IGNORE INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT 1, id, 1
FROM permisos
WHERE codigo = 'workflow.estado.visible.override';
