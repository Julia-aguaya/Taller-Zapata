# DER base de datos

## Objetivo

Este DER textual resume el modelo relacional MySQL consolidado para `tallerDemo`, tomando como fuente principal `docs/09-estructura-base-de-datos.md`.

## Decisiones estructurales que gobiernan el DER

- `usuarios` y `personas` son entidades distintas: acceso al sistema vs identidad de negocio.
- `personas` es la unica tabla de negocio para actores humanos o juridicos; los roles se expresan por contexto en `caso_personas`.
- no se modelan porcentajes de titularidad ni copropiedad.
- `turnos_reparacion`, `ingresos_vehiculo` y `egresos_vehiculo` son eventos separados.
- `tareas` puede existir con `caso_id` nullable y `usuario_asignado_id` nullable.
- los permisos se resuelven por `roles`, y el alcance real se aplica en `usuario_roles`.
- `auditoria_eventos` es el log central, visible y persistente.

## Vista general del agregado

```text
organizaciones
  -> sucursales
    -> casos
      -> caso_personas -> personas
      -> caso_vehiculos -> vehiculos
      -> caso_estado_historial -> workflow_estados
      -> turnos_reparacion -> ingresos_vehiculo -> egresos_vehiculo
      -> tareas
      -> presupuestos -> presupuesto_items -> repuestos_caso
      -> movimientos_financieros -> movimiento_retenciones / movimiento_aplicaciones
      -> documentos <- documento_relaciones
      -> extensiones por tramite
      -> auditoria_eventos

usuarios
  -> usuario_roles -> roles -> rol_permisos -> permisos
  -> tareas / turnos_reparacion / documentos / auditoria_eventos / caso_estado_historial
```

## Dominio organizacional y seguridad

### Entidades

- `organizaciones`
- `sucursales`
- `usuarios`
- `roles`
- `permisos`
- `rol_permisos`
- `usuario_roles`

### Relaciones

- `organizaciones` 1:N `sucursales`
- `organizaciones` 1:N `usuario_roles`
- `sucursales` 1:N `usuario_roles`
- `usuarios` 1:N `usuario_roles`
- `roles` 1:N `rol_permisos`
- `permisos` 1:N `rol_permisos`
- `roles` 1:N `usuario_roles`

### Notas de negocio

- `usuario_roles` aplica el scope real por organizacion y opcionalmente por sucursal.
- el permiso no se asigna directo al usuario: se asigna al rol y luego se otorga al usuario con alcance.

## Dominio de personas y vehiculos

### Entidades

- `personas`
- `persona_contactos`
- `persona_domicilios`
- `marcas_vehiculo`
- `modelos_vehiculo`
- `vehiculos`
- `vehiculo_personas`

### Relaciones

- `personas` 1:N `persona_contactos`
- `personas` 1:N `persona_domicilios`
- `marcas_vehiculo` 1:N `modelos_vehiculo`
- `marcas_vehiculo` 1:N `vehiculos`
- `modelos_vehiculo` 1:N `vehiculos`
- `vehiculos` 1:N `vehiculo_personas`
- `personas` 1:N `vehiculo_personas`

### Notas de negocio

- `personas` concentra cliente, titular, conductor, abogado, inspector, tramitador o contacto; el rol concreto depende del contexto.
- `vehiculo_personas` solo cubre relaciones relativamente estables del vehiculo.
- no existe `vehiculo_titulares`; la titularidad se expresa por roles y no por porcentajes.

## Dominio central de casos

### Entidades

- `tipos_tramite`
- `casos`
- `caso_personas`
- `caso_vehiculos`
- `caso_relaciones`
- `caso_siniestro`

### Relaciones

- `tipos_tramite` 1:N `casos`
- `organizaciones` 1:N `casos`
- `sucursales` 1:N `casos`
- `usuarios` 1:N `casos`
- `personas` 1:N `casos` como `cliente_principal_persona_id`
- `vehiculos` 1:N `casos` como `vehiculo_principal_id`
- `casos` 1:N `caso_personas`
- `personas` 1:N `caso_personas`
- `vehiculos` 1:N `caso_personas` cuando el rol requiere contexto vehicular
- `casos` 1:N `caso_vehiculos`
- `vehiculos` 1:N `caso_vehiculos`
- `casos` 1:N `caso_relaciones` como origen y como destino
- `casos` 1:1 `caso_siniestro`

### Notas de negocio

- `casos` es la raiz del agregado del negocio.
- `caso_personas` define quien es quien dentro del expediente: cliente, titular, conductor, lesionado, abogado, inspector, tramitador, quien trae el vehiculo, etc.
- si hay mas de un titular, se registran varias filas en `caso_personas` con rol `titular`; no hay porcentajes.
- `caso_vehiculos` separa el vehiculo principal de terceros involucrados u otras unidades relacionadas.

## Workflow y estados

### Entidades

- `workflow_estados`
- `workflow_transiciones`
- `caso_estado_historial`

### Relaciones

- `workflow_estados` 1:N `workflow_transiciones` como origen
- `workflow_estados` 1:N `workflow_transiciones` como destino
- `tipos_tramite` 1:N `workflow_transiciones`
- `casos` N:1 `workflow_estados` como cache de estado actual
- `casos` 1:N `caso_estado_historial`
- `workflow_estados` 1:N `caso_estado_historial`
- `usuarios` 1:N `caso_estado_historial`

### Notas de negocio

- el estado actual puede cachearse en `casos`, pero la verdad historica vive en `caso_estado_historial`.
- una transicion valida depende de `workflow_transiciones` y puede requerir permiso explicito.

## Turnos y operacion de taller

### Entidades

- `turnos_reparacion`
- `ingresos_vehiculo`
- `ingreso_items`
- `egresos_vehiculo`
- `tareas`

### Relaciones

- `casos` 1:N `turnos_reparacion`
- `usuarios` 1:N `turnos_reparacion`
- `casos` 1:N `ingresos_vehiculo`
- `turnos_reparacion` 1:N `ingresos_vehiculo`
- `vehiculos` 1:N `ingresos_vehiculo`
- `usuarios` 1:N `ingresos_vehiculo` como receptor
- `personas` 1:N `ingresos_vehiculo` como quien entrega
- `ingresos_vehiculo` 1:N `ingreso_items`
- `casos` 1:N `egresos_vehiculo`
- `ingresos_vehiculo` 1:N `egresos_vehiculo`
- `usuarios` 1:N `egresos_vehiculo` como quien entrega
- `personas` 1:N `egresos_vehiculo` como quien recibe
- `casos` 1:N `tareas`
- `usuarios` 1:N `tareas` como asignado o creador

### Notas de negocio

- un turno reserva agenda; no implica ingreso real.
- cada ingreso y cada egreso es un evento distinto y trazable.
- un reingreso crea un nuevo `ingresos_vehiculo`; no reutiliza el anterior.
- `tareas` puede existir sin caso y sin asignado para soportar pendientes generales.

## Presupuesto y finanzas

### Entidades

- `presupuestos`
- `presupuesto_items`
- `repuestos_caso`
- `movimientos_financieros`
- `movimiento_retenciones`
- `movimiento_aplicaciones`
- `comprobantes_emitidos`

### Relaciones

- `casos` 1:1 `presupuestos`
- `presupuestos` 1:N `presupuesto_items`
- `casos` 1:N `repuestos_caso`
- `presupuesto_items` 1:N `repuestos_caso`
- `casos` 1:N `movimientos_financieros`
- `personas` 1:N `movimientos_financieros`
- `companias_seguro` 1:N `movimientos_financieros`
- `usuarios` 1:N `movimientos_financieros`
- `movimientos_financieros` 1:N `movimiento_retenciones`
- `movimientos_financieros` 1:N `movimiento_aplicaciones`
- `casos` 1:N `comprobantes_emitidos`

### Notas de negocio

- el modelo financiero usa un ledger unico y no tablas de pagos separadas por tramite.
- `movimiento_aplicaciones` desacopla el movimiento de dinero de su imputacion funcional.

## Documentos

### Entidades

- `categorias_documentales`
- `documentos`
- `documento_relaciones`

### Relaciones

- `tipos_tramite` 1:N `categorias_documentales`
- `categorias_documentales` 1:N `documentos`
- `usuarios` 1:N `documentos`
- `documentos` 1:N `documento_relaciones`
- `casos` 1:N `documento_relaciones`

### Notas de negocio

- `documentos` guarda el archivo como objeto unico.
- `documento_relaciones` resuelve el contexto de uso sobre `casos` u otras entidades.
- no se crea `persona_documentos`; los respaldos o adjuntos se manejan por el modulo documental generico.

## Tramites especializados

### Entidades

- `companias_seguro`
- `companias_contactos`
- `caso_seguro`
- `caso_tramitacion_seguro`
- `caso_franquicia`
- `caso_cleas`
- `caso_terceros`
- `caso_legal`
- `legal_novedades`
- `legal_gastos`
- `legal_rubros_cierre`
- `recuperos_franquicia`

### Relaciones

- `companias_seguro` 1:N `companias_contactos`
- `personas` 1:N `companias_contactos`
- `casos` 1:1 `caso_seguro`
- `companias_seguro` 1:N `caso_seguro`
- `caso_personas` 1:N `caso_seguro` como referencia opcional de tramitador o inspector
- `casos` 1:1 `caso_tramitacion_seguro`
- `casos` 1:1 `caso_franquicia`
- `casos` 1:1 `caso_cleas`
- `casos` 1:1 `caso_terceros`
- `companias_seguro` 1:N `caso_terceros`
- `casos` 1:1 `caso_legal`
- `caso_legal` 1:N `legal_novedades`
- `caso_legal` 1:N `legal_gastos`
- `caso_legal` 1:N `legal_rubros_cierre`
- `casos` 1:1 `recuperos_franquicia`

### Notas de negocio

- las variantes por tramite se resuelven con extensiones 1:1 y no cargando `casos` con columnas opcionales infinitas.
- los interlocutores del seguro reutilizan `personas` y `caso_personas`; no se crean tablas separadas para inspectores o tramitadores.

## Soporte transversal y auditoria

### Entidades

- `parametros_sistema`
- `feriados`
- `notificaciones`
- `integraciones_config`
- `integraciones_log`
- `outbox_eventos`
- `auditoria_eventos`

### Relaciones

- `usuarios` 1:N `notificaciones`
- `casos` 1:N `notificaciones`
- `integraciones_config` 1:N `integraciones_log`
- `casos` 1:N `integraciones_log`
- `usuarios` 1:N `auditoria_eventos`
- `casos` 1:N `auditoria_eventos`

### Notas de negocio

- `auditoria_eventos` concentra acciones sensibles de negocio y sistema.
- `integraciones_log` es trazabilidad tecnica; no reemplaza la auditoria funcional.

## Cardinalidades clave para leer rapido

```text
organizaciones 1---N sucursales
organizaciones 1---N casos
sucursales 1---N casos
usuarios 1---N usuario_roles
roles 1---N usuario_roles
roles 1---N rol_permisos
permisos 1---N rol_permisos

casos 1---N caso_personas N---1 personas
casos 1---N caso_vehiculos N---1 vehiculos
vehiculos 1---N vehiculo_personas N---1 personas

casos 1---N turnos_reparacion
turnos_reparacion 1---N ingresos_vehiculo
ingresos_vehiculo 1---N ingreso_items
ingresos_vehiculo 1---N egresos_vehiculo

casos 1---1 presupuestos
presupuestos 1---N presupuesto_items
presupuesto_items 1---N repuestos_caso

casos 1---N movimientos_financieros
movimientos_financieros 1---N movimiento_retenciones
movimientos_financieros 1---N movimiento_aplicaciones

documentos 1---N documento_relaciones
casos 1---N documento_relaciones

casos 1---N auditoria_eventos
usuarios 1---N auditoria_eventos
```

## Lectura final del modelo

- el corazon del sistema es `casos`.
- la identidad de negocio vive en `personas`; la identidad autenticable vive en `usuarios`.
- los roles de negocio se expresan en `caso_personas`; los permisos de sistema se expresan en `usuario_roles`.
- la operacion fisica del taller se sigue con la cadena `turnos -> ingresos -> egresos`.
- la trazabilidad transversal se apoya en `caso_estado_historial` y `auditoria_eventos`.
