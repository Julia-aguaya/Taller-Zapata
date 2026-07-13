# Plan tecnico backend - tramite Particular

Fecha: 2026-06-26

## Objetivo

Bajar el saneamiento del tramite `PARTICULAR` a tareas tecnicas concretas para poder ejecutarlo por etapas, con criterio de dominio y sin depender del frontend para reglas criticas.

## Alcance de este plan

Incluye:

- alta minima del caso
- readiness por solapa
- presupuesto
- gestion reparacion
- pagos
- cierre automatico
- estados superiores de tramite y reparacion

No incluye todavia:

- contrato final de `front2`
- rediseño visual
- saneamiento de `TODO_RIESGO` y demas tramites

## Resultado esperado

Cuando este plan termine, un caso `PARTICULAR` deberia poder:

- crearse con los datos minimos reales del negocio
- exponer desde backend que solapas estan bloqueadas, completas o pendientes
- impedir avanzar a reparacion si presupuesto no esta listo
- permitir pagos con autonomia cuando corresponda
- cerrar automaticamente cuando se cumplan egreso definitivo + pago total
- reflejar estados de tramite y reparacion alineados con el dominio

## Principios de implementacion

- backend como fuente de verdad
- reglas ejecutables, no solo UI hints
- derivar estado durante backend, no en frontend
- separar `persistencia`, `policy`, `readiness` y `projection`
- no romper compatibilidad de golpe: introducir adaptadores o respuestas nuevas antes de borrar lo viejo

## Entregables tecnicos

1. `ParticularCasePolicy`
2. `CaseReadinessService` con soporte para `PARTICULAR`
3. resumen financiero especifico del particular
4. cierre automatico del caso
5. proyeccion canonica de estados superiores
6. tests de integracion y reglas de negocio

## Workstreams

### WS-01 - Alta minima del caso

#### PTC-01 - Diseñar comando de alta minima

- Objetivo: permitir alta con tipo de tramite, cliente, vehiculo y referenciado, sin exigir toda la estructura actual.
- Cambio tecnico:
  - definir nuevo request o variante de request para apertura minima
  - decidir defaults de `organizationId`, `branchId`, `customerRoleCode` y `principalVehicleRoleCode`
  - documentar restricciones explicitas
- Archivos probables:
  - `backend/src/main/java/com/tallerzapata/backend/api/casefile/CaseCreateRequest.java`
  - `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseService.java`
- Criterio de listo:
  - el backend acepta el alta minima sin datos extra no obligatorios
  - las invariantes faltantes quedan pendientes para etapas posteriores del caso, no para apertura

#### PTC-02 - Persistir metadata de apertura y auditoria

- Objetivo: asegurar trazabilidad de quien creo la carpeta y cuando.
- Cambio tecnico:
  - revisar si la data actual ya alcanza o si hace falta enriquecer la respuesta/proyeccion
  - exponer en DTO o projection de detalle el `createdAt` y el usuario creador de forma util para frontend
- Archivos probables:
  - `backend/src/main/java/com/tallerzapata/backend/api/casefile/CaseResponse.java`
  - `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseService.java`
- Criterio de listo:
  - puede consultarse dia y usuario creador sin inventar logica en frontend

### WS-02 - Readiness por solapa

#### PTC-03 - Introducir modelo canonico de readiness

- Objetivo: centralizar el estado de cada solapa.
- Cambio tecnico:
  - crear modelo tipo `CaseReadinessResult`
  - incluir `tabCode`, `allowed`, `completed`, `colorHint`, `blockingReasons`, `warningReasons`
  - dejar preparado para reutilizarlo luego en otros tramites
- Archivos probables:
  - nuevo paquete en `backend/src/main/java/com/tallerzapata/backend/application/casefile/readiness/`
- Criterio de listo:
  - existe un contrato backend unico para expresar readiness

#### PTC-04 - Implementar readiness de `FICHA_TECNICA`

- Objetivo: expresar si la ficha tecnica esta minima, parcial o completa.
- Cambio tecnico:
  - separar `minimo para crear carpeta` de `completo para operar`
  - validar campos del cliente y vehiculo que pasan a ser obligatorios para presupuesto o pagos
- Dependencias:
  - PTC-03
- Criterio de listo:
  - el backend distingue apertura minima vs completitud operativa

#### PTC-05 - Implementar readiness de `PRESUPUESTO`

- Objetivo: impedir que el caso pase a reparacion con presupuesto incompleto.
- Cambio tecnico:
  - validar por item: pieza afectada, tarea, nivel de dano y consistencias asociadas
  - validar cierre de informe
  - exponer razones de bloqueo concretas
- Archivos probables:
  - `backend/src/main/java/com/tallerzapata/backend/application/budget/BudgetService.java`
  - nuevos validadores/policies en modulo presupuesto
- Dependencias:
  - PTC-03
- Criterio de listo:
  - el backend puede decir si presupuesto esta `blocked`, `in_progress` o `completed`
  - `Gestion Reparacion` no puede declararse habilitada si presupuesto no esta completo

#### PTC-06 - Implementar readiness de `GESTION_REPARACION`

- Objetivo: gobernar turno, ingreso, egreso y reingreso con reglas del negocio.
- Cambio tecnico:
  - exigir condiciones para agendar turno
  - distinguir `pendiente de turno`, `con turno`, `en reparacion`, `reingreso pendiente`, `reparado`
  - modelar warnings por repuestos pendientes si se habilita agenda excepcional
- Archivos probables:
  - `backend/src/main/java/com/tallerzapata/backend/application/operation/RepairAppointmentService.java`
  - `backend/src/main/java/com/tallerzapata/backend/application/operation/VehicleIntakeService.java`
  - `backend/src/main/java/com/tallerzapata/backend/application/operation/VehicleOutcomeService.java`
- Dependencias:
  - PTC-03, PTC-05
- Criterio de listo:
  - el backend decide si la solapa esta bloqueada, habilitada o completa

#### PTC-07 - Implementar readiness de `PAGOS`

- Objetivo: permitir acceso autonomo a pagos, pero marcar completitud real.
- Cambio tecnico:
  - distinguir acceso permitido de cierre completo
  - incorporar reglas de sena, cancelacion total/parcial/bonificacion y factura
  - exponer saldo vivo y faltantes
- Archivos probables:
  - `backend/src/main/java/com/tallerzapata/backend/application/finance/FinanceService.java`
  - nuevo summary o policy de pagos particulares
- Dependencias:
  - PTC-03
- Criterio de listo:
  - pagos puede estar accesible aunque otras solapas esten pendientes
  - el backend sabe cuando pagos esta realmente completo

### WS-03 - Presupuesto y repuestos

#### PTC-08 - Endurecer invariantes del presupuesto

- Objetivo: que el presupuesto no sea solo CRUD.
- Cambio tecnico:
  - validar consistencia de `requiresReplacement` con decision de repuesto
  - permitir `partValue` ausente o cero cuando el negocio lo habilita
  - impedir cierre si faltan datos requeridos o si los totales no son coherentes
- Dependencias:
  - PTC-05
- Criterio de listo:
  - no puede cerrarse ni generar PDF un presupuesto invalido

#### PTC-09 - Derivar repuestos de caso desde presupuesto

- Objetivo: poblar la capa de reparacion a partir de lo definido en presupuesto.
- Cambio tecnico:
  - generar `repuestos_caso` para items con reemplazo o, si el negocio lo decide, para items cotizables
  - conservar independencia posterior entre presupuesto original y gestion real de repuestos
- Archivos probables:
  - `backend/src/main/java/com/tallerzapata/backend/application/budget/BudgetService.java`
- Dependencias:
  - PTC-08
- Criterio de listo:
  - la subsolapa repuestos ya no depende de reconstruccion manual inicial

### WS-04 - Reparacion y agenda

#### PTC-10 - Formalizar reglas de agenda de turno

- Objetivo: encapsular reglas de turno del particular.
- Cambio tecnico:
  - exigir campos obligatorios de turno
  - sostener calculo de salida estimada con dias habiles
  - decidir como se expresan excepciones y warnings
- Archivos probables:
  - `backend/src/main/java/com/tallerzapata/backend/application/operation/RepairAppointmentService.java`
  - `backend/src/main/java/com/tallerzapata/backend/application/common/BusinessDayCalculator.java`
- Dependencias:
  - PTC-06
- Criterio de listo:
  - agendar turno aplica reglas de negocio del taller, no solo validaciones de DTO

#### PTC-11 - Formalizar secuencia ingreso-egreso-reingreso

- Objetivo: que la reparacion responda a la secuencia operativa real.
- Cambio tecnico:
  - dejar explicita la secuencia permitida
  - actualizar estado superior de reparacion al crear ingreso, egreso, reingreso o cierre definitivo
  - contemplar observaciones de ingreso y fotos reparado como condiciones o warnings
- Dependencias:
  - PTC-06, PTC-10
- Criterio de listo:
  - el caso no puede caer en combinaciones incoherentes de operacion

### WS-05 - Finanzas del particular

#### PTC-12 - Crear resumen financiero especifico para Particular

- Objetivo: dejar de depender solo de movimientos genericos.
- Cambio tecnico:
  - proyectar total cotizado, total cobrado, saldo deudor, sena, bonificaciones y estado de cancelacion
  - contemplar logica de comprobante que afecta IVA para el particular
- Archivos probables:
  - `backend/src/main/java/com/tallerzapata/backend/application/finance/FinanceService.java`
  - nuevos DTOs de summary
- Dependencias:
  - PTC-07
- Criterio de listo:
  - el backend puede responder si el cliente pago total o no

#### PTC-13 - Introducir politica de cierre financiero

- Objetivo: definir con precision cuando un particular esta `pagado`.
- Cambio tecnico:
  - comparar deuda esperada vs cobros reales
  - tratar casos de parcial, total y bonificacion
  - exponer fecha efectiva de pago total
- Dependencias:
  - PTC-12
- Criterio de listo:
  - existe un evento o estado de `pago total` derivado del dominio

### WS-06 - Cierre automatico del caso

#### PTC-14 - Implementar `ParticularClosurePolicy`

- Objetivo: cerrar automaticamente el caso con la regla del negocio.
- Cambio tecnico:
  - crear policy que combine egreso definitivo + pago total
  - calcular `closedAt` como la fecha mas tardia entre ambos hitos
  - impedir cierre manual salvo permiso administrativo excepcional bien justificado
- Archivos probables:
  - `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseService.java`
  - nuevo paquete de `closure/`
- Dependencias:
  - PTC-11, PTC-13
- Criterio de listo:
  - el caso se cierra solo cuando negocio realmente lo considera cerrado

### WS-07 - Estados superiores

#### PTC-15 - Canonizar `TramiteState` y `RepairState` para Particular

- Objetivo: eliminar heuristicas ambiguas.
- Cambio tecnico:
  - definir set canonico para Particular
  - documentar disparadores de cada cambio de estado
  - alinear `CaseVisibleStateResolver` con la policy canonica
- Archivos probables:
  - `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseVisibleStateResolver.java`
  - `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseWorkflowService.java`
- Dependencias:
  - PTC-05, PTC-11, PTC-13, PTC-14
- Criterio de listo:
  - estados superiores visibles y persistidos dejan de contradecirse

### WS-08 - Testing

#### PTC-16 - Cubrir el flujo happy path de Particular

- Objetivo: asegurar el flujo principal entero.
- Cambio tecnico:
  - test de integracion desde alta minima hasta cierre automatico
- Dependencias:
  - PTC-14, PTC-15
- Criterio de listo:
  - existe una prueba que valida el recorrido completo del caso particular

#### PTC-17 - Cubrir reglas de bloqueo y excepciones

- Objetivo: proteger el dominio donde hoy esta mas fragil.
- Cambio tecnico:
  - tests para presupuesto incompleto
  - tests para turno bloqueado
  - tests para pago parcial
  - tests para reingreso
  - tests para cierre no permitido
- Dependencias:
  - PTC-05 a PTC-15
- Criterio de listo:
  - las reglas principales quedan cubiertas por tests ejecutables

## Orden recomendado

### Etapa 1 - Fundaciones

1. PTC-01
2. PTC-02
3. PTC-03

### Etapa 2 - Solapas y bloqueo real

4. PTC-04
5. PTC-05
6. PTC-06
7. PTC-07

### Etapa 3 - Dominio operativo

8. PTC-08
9. PTC-09
10. PTC-10
11. PTC-11

### Etapa 4 - Dominio financiero y cierre

12. PTC-12
13. PTC-13
14. PTC-14
15. PTC-15

### Etapa 5 - Red de seguridad

16. PTC-16
17. PTC-17

## Dependencias criticas

- Sin readiness canonico no conviene diseñar `front2` para Particular.
- Sin cierre financiero no conviene automatizar `closedAt`.
- Sin canon de estados no conviene construir panel general ni badges definitivos.

## Definicion de hecho para el saneamiento de Particular

Se considera saneado cuando:

- la apertura minima funciona con reglas reales
- cada solapa tiene readiness backend
- el backend explica por que una solapa esta bloqueada
- el caso puede llegar a `Pagado` y `Reparado` sin heuristicas frontend
- el cierre del caso es automatico y trazable
- el flujo completo esta cubierto por tests
