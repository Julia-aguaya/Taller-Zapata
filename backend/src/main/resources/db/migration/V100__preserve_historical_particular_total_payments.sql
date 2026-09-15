-- V99 makes TOTAL the explicit PARTICULAR payment-completion signal. Preserve only
-- historical PRESUPUESTO payments whose case was already fully paid under the old rule.
UPDATE movimientos_financieros
SET cancela_tipo_codigo = 'TOTAL'
WHERE id IN (
    SELECT completed_case.movement_id
    FROM (
        SELECT MAX(candidate.id) AS movement_id
        FROM movimientos_financieros candidate
        JOIN casos case_file ON case_file.id = candidate.caso_id
        JOIN tipos_tramite case_type ON case_type.id = case_file.tipo_tramite_id
        JOIN presupuestos budget ON budget.caso_id = case_file.id
        WHERE case_type.codigo = 'PARTICULAR'
          AND candidate.tipo_movimiento_codigo = 'INGRESO'
          AND candidate.origen_flujo_codigo = 'CLIENTE'
          AND candidate.cancela_tipo_codigo = 'PRESUPUESTO'
          AND budget.total_cotizado > 0
          AND (
              SELECT COALESCE(SUM(
                  CASE
                      WHEN balance_movement.tipo_movimiento_codigo = 'INGRESO'
                           OR (balance_movement.tipo_movimiento_codigo = 'AJUSTE' AND balance_movement.monto_neto >= 0)
                      THEN balance_movement.monto_neto
                      ELSE -ABS(balance_movement.monto_neto)
                  END
              ), 0)
              FROM movimientos_financieros balance_movement
              WHERE balance_movement.caso_id = case_file.id
                AND balance_movement.origen_flujo_codigo = 'CLIENTE'
          ) >= budget.total_cotizado
        GROUP BY candidate.caso_id
    ) completed_case
);
