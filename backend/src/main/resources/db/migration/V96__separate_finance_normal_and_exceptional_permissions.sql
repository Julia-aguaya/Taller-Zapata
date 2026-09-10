-- Finance access is split by real operation. Exceptional operations additionally
-- require the existing global-admin scope enforced by the application service.
INSERT IGNORE INTO permisos (codigo, nombre, modulo, descripcion) VALUES
    ('finanza.pago.crear', 'Registrar pagos', 'finance', 'Permite registrar pagos normales'),
    ('finanza.recibo.crear', 'Emitir recibos', 'finance', 'Permite emitir recibos y facturas normales'),
    ('finanza.imputacion.crear', 'Registrar imputaciones', 'finance', 'Permite imputar movimientos financieros'),
    ('finanza.retencion.gestionar', 'Gestionar retenciones', 'finance', 'Permite crear y gestionar retenciones'),
    ('finanza.excepcional.modificar', 'Modificar finanzas confirmadas', 'finance', 'Permite corregir, anular o revertir registros financieros confirmados');

-- The legacy broad grant is replaced by the operational matrix.
DELETE FROM rol_permisos
WHERE permiso_id IN (SELECT id FROM permisos WHERE codigo = 'finanza.crear');

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT r.id, p.id, 1
FROM roles r
JOIN permisos p ON p.codigo IN (
    'finanza.pago.crear', 'finanza.recibo.crear', 'finanza.imputacion.crear',
    'finanza.retencion.gestionar', 'finanza.excepcional.modificar'
)
WHERE r.codigo = 'ROLE_ADMIN';

INSERT INTO rol_permisos (rol_id, permiso_id, allow_flag)
SELECT r.id, p.id, 1
FROM roles r
JOIN permisos p ON p.codigo IN (
    'finanza.ver', 'finanza.pago.crear', 'finanza.recibo.crear', 'finanza.imputacion.crear'
)
WHERE r.codigo = 'ROLE_OPERADOR';
