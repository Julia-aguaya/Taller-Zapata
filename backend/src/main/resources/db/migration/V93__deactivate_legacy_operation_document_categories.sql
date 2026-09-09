UPDATE categorias_documentales
SET activo = 0
WHERE modulo_codigo = 'OPERACION'
  AND codigo IN ('ORDEN_INGRESO', 'FOTO_DANO', 'INFORME_INTERNO');
