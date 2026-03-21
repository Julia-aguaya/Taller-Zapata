# Schema inicial de base de datos

## Objetivo

Este esquema propone una base relacional inicial para soportar el nucleo comun del sistema y permitir extender reglas por tipo de tramite sin rehacer la estructura.

## Criterios de modelado

- separar datos comunes de datos especificos por tramite
- guardar estados actuales y tambien historial
- permitir multiples titulares, adjuntos, pagos y tareas por caso
- soportar permisos por usuario, rol y taller
- desacoplar catalogos de la operatoria diaria

## Entidades principales

### Talleres y usuarios

#### `talleres`

- `id` PK
- `nombre`
- `codigo` unique
- `razon_social`
- `cuit`
- `activo`
- `created_at`
- `updated_at`

#### `sucursales`

- `id` PK
- `taller_id` FK -> `talleres.id`
- `nombre`
- `codigo` unique dentro de taller
- `direccion`
- `telefono`
- `email`
- `activa`
- `created_at`
- `updated_at`

#### `usuarios`

- `id` PK
- `nombre`
- `apellido`
- `email` unique
- `password_hash`
- `activo`
- `ultimo_acceso_at`
- `created_at`
- `updated_at`

#### `roles`

- `id` PK
- `codigo` unique
- `nombre`
- `descripcion`

#### `permisos`

- `id` PK
- `codigo` unique
- `nombre`
- `descripcion`

#### `usuario_roles`

- `id` PK
- `usuario_id` FK -> `usuarios.id`
- `rol_id` FK -> `roles.id`
- `taller_id` FK -> `talleres.id` nullable
- `sucursal_id` FK -> `sucursales.id` nullable

#### `rol_permisos`

- `id` PK
- `rol_id` FK -> `roles.id`
- `permiso_id` FK -> `permisos.id`

## Catalogos

#### `tipos_tramite`

- `id` PK
- `codigo` unique
- `nombre`
- `prefijo_carpeta`
- `activo`

Ejemplos: `P`, `T`, `G`, `C`, `R`, `F`.

#### `marcas_vehiculo`

- `id` PK
- `nombre`
- `activo`

#### `companias_seguro`

- `id` PK
- `nombre`
- `codigo`
- `cuit`
- `requiere_fotos_reparado`
- `activa`

#### `inspectores`

- `id` PK
- `companias_seguro_id` FK -> `companias_seguro.id` nullable
- `nombre`
- `telefono`
- `email`
- `activo`

#### `tramitadores`

- `id` PK
- `companias_seguro_id` FK -> `companias_seguro.id` nullable
- `nombre`
- `telefono`
- `email`
- `activo`

#### `feriados`

- `id` PK
- `fecha` unique
- `descripcion`
- `ambito`

## Clientes y vehiculos

#### `clientes`

- `id` PK
- `nombre`
- `apellido`
- `documento`
- `cuit_cuil`
- `telefono`
- `email`
- `direccion`
- `estado_civil`
- `created_at`
- `updated_at`

#### `vehiculos`

- `id` PK
- `marca_id` FK -> `marcas_vehiculo.id`
- `modelo`
- `dominio`
- `anio`
- `tipo_vehiculo`
- `caja`
- `uso`
- `color`
- `pintura`
- `created_at`
- `updated_at`

## Casos

#### `casos`

- `id` PK
- `numero_orden` integer
- `codigo_carpeta` unique
- `tipo_tramite_id` FK -> `tipos_tramite.id`
- `taller_id` FK -> `talleres.id`
- `sucursal_id` FK -> `sucursales.id`
- `cliente_id` FK -> `clientes.id`
- `vehiculo_id` FK -> `vehiculos.id`
- `usuario_creador_id` FK -> `usuarios.id`
- `referenciado` boolean
- `referenciado_por` nullable
- `estado_tramite_actual_id` FK -> `estados_tramite.id` nullable
- `estado_reparacion_actual_id` FK -> `estados_reparacion.id` nullable
- `fecha_cierre` nullable
- `observaciones_generales` nullable
- `created_at`
- `updated_at`

#### `caso_titulares`

- `id` PK
- `caso_id` FK -> `casos.id`
- `nombre`
- `apellido`
- `documento`
- `telefono`
- `email`
- `direccion`
- `es_cliente` boolean
- `porcentaje_titularidad`
- `orden`

#### `casos_relacionados`

- `id` PK
- `caso_origen_id` FK -> `casos.id`
- `caso_relacionado_id` FK -> `casos.id`
- `tipo_relacion`
- `observacion`

## Estados e historial

#### `estados_tramite`

- `id` PK
- `codigo` unique
- `nombre`
- `orden`
- `activo`

#### `estados_reparacion`

- `id` PK
- `codigo` unique
- `nombre`
- `orden`
- `activo`

#### `historial_estados_caso`

- `id` PK
- `caso_id` FK -> `casos.id`
- `tipo_estado` enum: `tramite`, `reparacion`
- `estado_id`
- `fecha`
- `usuario_id` FK -> `usuarios.id` nullable
- `motivo`
- `automatico` boolean

## Ficha tecnica y tramite

#### `fichas_tecnicas`

- `id` PK
- `caso_id` FK -> `casos.id` unique
- `numero_siniestro` nullable
- `fecha_siniestro` nullable
- `fecha_presentacion` nullable
- `fecha_prescripcion` nullable
- `dias_tramitando` nullable
- `cliente_es_titular` nullable
- `resumen_tareas` nullable
- `observaciones` nullable
- `created_at`
- `updated_at`

#### `datos_seguro_caso`

- `id` PK
- `caso_id` FK -> `casos.id` unique
- `compania_seguro_id` FK -> `companias_seguro.id` nullable
- `inspector_id` FK -> `inspectores.id` nullable
- `tramitador_id` FK -> `tramitadores.id` nullable
- `poliza_numero` nullable
- `certificado_numero` nullable
- `cobertura_tipo` nullable
- `numero_cleas` nullable
- `compania_tercero_id` FK -> `companias_seguro.id` nullable

#### `franquicias_caso`

- `id` PK
- `caso_id` FK -> `casos.id` unique
- `estado`
- `monto` nullable
- `recupero_tipo` nullable
- `caso_asociado_id` FK -> `casos.id` nullable
- `dictamen` nullable
- `cotizacion_supera_franquicia` nullable
- `monto_recuperar` nullable
- `monto_exigido_compania` nullable

#### `tramitaciones_caso`

- `id` PK
- `caso_id` FK -> `casos.id` unique
- `modalidad` nullable
- `dictamen` nullable
- `cotizacion_estado` nullable
- `cotizacion_fecha` nullable
- `cotizacion_monto` nullable
- `monto_minimo_mano_obra` nullable
- `lleva_repuestos` nullable
- `repuestos_autorizacion` nullable
- `monto_minimo_repuestos` nullable
- `a_facturar_compania` nullable
- `final_a_favor_taller` nullable
- `repara_vehiculo` nullable

## Presupuesto

#### `presupuestos`

- `id` PK
- `caso_id` FK -> `casos.id` unique
- `taller_presupuestador_id` FK -> `talleres.id`
- `informe_cerrado` boolean
- `fecha_cierre_informe` nullable
- `mano_obra_sin_iva` nullable
- `mano_obra_iva` nullable
- `mano_obra_con_iva` nullable
- `repuestos_total` nullable
- `total_cotizado` nullable
- `observaciones` nullable
- `created_at`
- `updated_at`

#### `presupuesto_items`

- `id` PK
- `presupuesto_id` FK -> `presupuestos.id`
- `orden`
- `pieza_afectada`
- `tarea_ejecutar`
- `nivel_danio`
- `accion` nullable
- `requiere_reemplazo` boolean
- `valor_repuesto` nullable
- `horas` nullable
- `importe_mano_obra` nullable
- `origen` enum: `principal`, `extra`

## Reparacion y repuestos

#### `repuestos_caso`

- `id` PK
- `caso_id` FK -> `casos.id`
- `presupuesto_item_id` FK -> `presupuesto_items.id` nullable
- `descripcion`
- `codigo_pieza` nullable
- `inventario_numero` nullable
- `proveedor` nullable
- `autorizado` nullable
- `estado` nullable
- `precio_presupuestado` nullable
- `precio_final` nullable
- `fecha_recibido` nullable
- `origen` enum: `presupuesto`, `manual`

#### `cotizaciones_repuestos`

- `id` PK
- `repuesto_id` FK -> `repuestos_caso.id`
- `proveedor`
- `importe`
- `facturacion_tipo` nullable
- `medio_pago` nullable
- `es_mejor_cotizacion` boolean

#### `turnos_reparacion`

- `id` PK
- `caso_id` FK -> `casos.id`
- `fecha_turno`
- `dias_estimados`
- `fecha_salida_estimada`
- `estado`
- `anotaciones` nullable
- `usuario_id` FK -> `usuarios.id`
- `created_at`

#### `ingresos_vehiculo`

- `id` PK
- `caso_id` FK -> `casos.id`
- `turno_id` FK -> `turnos_reparacion.id` nullable
- `fecha_ingreso`
- `fecha_salida_estimada`
- `con_observaciones` boolean
- `detalle_observaciones` nullable
- `created_at`

#### `egresos_vehiculo`

- `id` PK
- `caso_id` FK -> `casos.id`
- `fecha_egreso`
- `egreso_definitivo` boolean
- `debe_reingresar` boolean
- `motivo_reingreso` nullable
- `created_at`

## Pagos y facturacion

#### `facturas`

- `id` PK
- `caso_id` FK -> `casos.id`
- `tipo_comprobante`
- `numero_factura` nullable
- `razon_social` nullable
- `fecha_pasado_pagos` nullable
- `fecha_estimada_pago` nullable
- `fecha_pago` nullable
- `estado_pago` nullable
- `importe_neto` nullable
- `importe_iva` nullable
- `importe_total` nullable
- `firma_conforme` nullable

#### `pagos`

- `id` PK
- `caso_id` FK -> `casos.id`
- `origen_pago` enum: `cliente`, `compania`, `tercero`, `otro`
- `tipo_pago` nullable
- `monto`
- `fecha_pago`
- `modo_pago` nullable
- `detalle_modo_pago` nullable
- `es_senia` boolean
- `cancela_saldo` nullable
- `es_bonificacion` boolean
- `bonificacion_motivo` nullable
- `saldo_resultante` nullable
- `observaciones` nullable
- `created_at`

#### `retenciones_pago`

- `id` PK
- `pago_id` FK -> `pagos.id`
- `tipo`
- `monto`
- `detalle` nullable

## Tareas y alertas

#### `tareas_caso`

- `id` PK
- `caso_id` FK -> `casos.id`
- `titulo`
- `detalle`
- `usuario_asignado_id` FK -> `usuarios.id`
- `estado`
- `fecha_vencimiento` nullable
- `fecha_resolucion` nullable
- `origen_modulo`
- `created_by` FK -> `usuarios.id`
- `created_at`

#### `alertas_caso`

- `id` PK
- `caso_id` FK -> `casos.id`
- `tipo`
- `mensaje`
- `nivel`
- `usuario_destino_id` FK -> `usuarios.id` nullable
- `resuelta` boolean
- `created_at`

## Documentos y multimedia

#### `documentos`

- `id` PK
- `caso_id` FK -> `casos.id`
- `categoria`
- `subcategoria` nullable
- `nombre_archivo`
- `ruta_archivo`
- `mime_type`
- `tamano_bytes`
- `subido_por` FK -> `usuarios.id`
- `created_at`

#### `documento_etiquetas`

- `id` PK
- `documento_id` FK -> `documentos.id`
- `etiqueta`

## Auditoria

#### `auditoria_eventos`

- `id` PK
- `caso_id` FK -> `casos.id` nullable
- `usuario_id` FK -> `usuarios.id` nullable
- `entidad`
- `entidad_id`
- `accion`
- `detalle_json`
- `created_at`

## Relaciones clave

- un `taller` tiene muchas `sucursales`
- un `usuario` puede operar en uno o varios talleres y sucursales
- un `caso` pertenece a un tipo de tramite, taller, sucursal, cliente y vehiculo
- un `caso` puede tener muchos titulares, documentos, pagos, repuestos, tareas y alertas
- un `caso` tiene un presupuesto principal y una ficha tecnica principal
- un `caso` puede tener datos de seguro, franquicia y tramitacion si el tramite lo requiere
- un `caso` puede tener muchos turnos, ingresos y egresos

## Tablas a parametrizar despues

Estas columnas arrancan como texto o enum simple y luego pueden migrarse a catalogos propios:

- estado de franquicia
- dictamen
- modalidad
- estado de repuesto
- tipo de comprobante
- medio de pago
- estado de tarea
- categoria de documento

## Reglas que conviene resolver en backend

- generacion correlativa de `numero_orden` y `codigo_carpeta`
- calculo de `fecha_prescripcion`
- calculo de `dias_tramitando`
- calculo de `fecha_salida_estimada`
- derivacion automatica de estados
- bloqueo de transiciones invalidas
- calculo de saldos, IVA y totales
- cierre automatico del caso cuando se cumplen condiciones

## Prioridad de implementacion del schema

### Fase 1

- talleres, sucursales, usuarios, roles
- clientes, vehiculos, casos
- estados e historial
- ficha tecnica
- documentos

### Fase 2

- presupuestos e items
- repuestos
- turnos, ingresos y egresos
- pagos y facturas

### Fase 3

- datos de seguro
- franquicias
- tramitaciones
- tareas y alertas
- casos relacionados

## Observaciones

- no conviene meter todo en una sola tabla `casos`
- tampoco conviene separar por tabla cada tramite completo, porque se duplicaria demasiada logica
- este esquema deja un core comun y extensiones por modulo, que es lo mas sano para crecer
