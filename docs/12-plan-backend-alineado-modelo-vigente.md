# Plan backend alineado al modelo vigente

## Objetivo

Definir un plan detallado para construir el backend del sistema tomando como fuente de verdad exclusiva del modelo de datos a `docs/09-estructura-base-de-datos.md`.

Este plan asume que:

- el modelo relacional vigente ya fue consolidado
- `casos` es el agregado raiz del negocio
- `usuarios` y `personas` resuelven problemas distintos
- la trazabilidad, auditoria, workflow y operacion documental son requisitos de base y no extras

## Fuente de verdad y criterio rector

El backend debe obedecer estas decisiones del documento vigente:

- `docs/09-estructura-base-de-datos.md` es el documento principal y vigente del modelo
- cualquier otro documento de modelado se toma solo como apoyo si NO contradice ese archivo
- el modelo se disena para el producto completo, no solo para un MVP descartable
- los datos comunes viven en tablas base y los datos especificos por tramite en tablas de extension `1 a 1`
- toda accion sensible debe dejar evidencia en `auditoria_eventos`

## Stack recomendado

### Recomendacion principal

- Java 21
- Spring Boot 3
- Spring Web
- Spring Validation
- Spring Data JPA
- Spring Security
- MySQL 8
- Flyway
- springdoc-openapi
- Actuator
- Testcontainers

### Por que este stack encaja bien

- el dominio tiene mucho workflow, trazabilidad y validaciones transaccionales
- el modelo tiene muchas relaciones consistentes, extensiones `1 a 1` y reglas de integridad
- RBAC scopeado, auditoria persistente y ledger financiero central piden una base robusta
- Spring permite un monolito modular con fronteras claras sin sobredisenar microservicios

### Alternativa valida si priorizas velocidad

- TypeScript + NestJS + MySQL

Tradeoff:

- gana velocidad y reduce boilerplate
- pierde algo de solidez y disciplina por defecto para un dominio de este nivel de complejidad

## Estilo arquitectonico recomendado

## Monolito modular primero

No conviene arrancar con microservicios.

La arquitectura recomendada es un monolito modular con estos principios:

- una sola base transaccional
- modulos por dominio, no por pantalla
- reglas de negocio en backend
- workflow centralizado y auditable
- integraciones desacopladas con outbox

## Capas sugeridas

### `api`

- controladores REST
- DTOs de request y response
- validacion de forma
- manejo uniforme de errores

### `application`

- casos de uso
- transacciones
- coordinacion entre agregados y servicios
- publicacion de eventos de dominio

### `domain`

- entidades de negocio
- value objects
- reglas y politicas
- validadores de workflow
- contratos de repositorio

### `infrastructure`

- JPA/Hibernate
- persistencia MySQL
- seguridad
- almacenamiento documental
- outbox
- auditoria tecnica
- integraciones externas

## Modulos backend sugeridos

- `organization`
- `catalog`
- `identity`
- `security`
- `vehicle`
- `casefile`
- `workflow`
- `repair-operation`
- `tasking`
- `budget`
- `parts`
- `finance`
- `document`
- `insurance`
- `third-party-claim`
- `legal`
- `franchise-recovery`
- `notification`
- `integration`
- `audit`

## Mapeo del modelo vigente a modulos

### 1. Nucleo organizacional y catalogos

Tablas fuente:

- `organizaciones`
- `sucursales`
- `tipos_tramite`
- `parametros_sistema`
- catalogos auxiliares como `marcas_vehiculo`, `modelos_vehiculo`, `categorias_documentales`, `workflow_estados`

Objetivos backend:

- soportar tenancy por organizacion
- definir alcance operativo por sucursal
- centralizar catalogos configurables
- evitar valores funcionales hardcodeados en UI

### 2. Personas, usuarios y seguridad

Tablas fuente:

- `personas`
- `persona_contactos`
- `persona_domicilios`
- `usuarios`
- `roles`
- `permisos`
- `rol_permisos`
- `usuario_roles`

Decision clave:

- `personas` representa identidad de negocio
- `usuarios` representa identidad autenticable
- NO hay que colapsar ambas cosas en una sola entidad

Objetivos backend:

- login seguro
- permisos atomicos por modulo/accion
- roles reutilizables
- asignacion por organizacion y opcionalmente sucursal

### 3. Vehiculos

Tablas fuente:

- `vehiculos`
- `vehiculo_personas`
- `marcas_vehiculo`
- `modelos_vehiculo`

Objetivos backend:

- buscar por dominio normalizado
- separar vehiculo reutilizable del contexto del caso
- distinguir titular, asegurado y quien trae el vehiculo

### 4. Casos y relaciones del caso

Tablas fuente:

- `casos`
- `caso_personas`
- `caso_vehiculos`
- `caso_relaciones`
- `caso_siniestro`

Decision clave:

- `casos` es la raiz operativa del sistema
- todo modulo transversal debe poder colgar del caso

Objetivos backend:

- alta minima de expediente en una transaccion consistente
- correlativo por organizacion para `numero_orden`
- unicidad de `codigo_carpeta`
- relacion entre expedientes para CLEAS, recuperos y derivados

### 5. Workflow y estados

Tablas fuente:

- `workflow_estados`
- `workflow_transiciones`
- `caso_estado_historial`

Decision clave:

- el estado actual vive cacheado en `casos`
- la verdad historica vive en `caso_estado_historial`
- toda transicion valida debe pasar por reglas y permisos

Objetivos backend:

- validar transiciones por dominio y tipo de tramite
- soportar transiciones automaticas y manuales
- registrar motivo y contexto del cambio
- rechazar transiciones invalidas con auditoria suficiente

### 6. Operacion taller

Tablas fuente:

- `turnos_reparacion`
- `ingresos_vehiculo`
- `ingreso_items`
- `egresos_vehiculo`
- `tareas`
- `feriados`

Decision clave:

- turno, ingreso y egreso son eventos distintos
- reingreso crea un nuevo ingreso, nunca recicla el anterior

Objetivos backend:

- reservar agenda
- registrar recepcion real con checklist
- registrar egreso final o parcial
- calcular fechas estimadas con calendario no habil
- disparar tareas y alertas

### 7. Presupuesto y repuestos

Tablas fuente:

- `presupuestos`
- `presupuesto_items`
- `repuestos_caso`

Objetivos backend:

- calcular mano de obra e IVA en backend
- consolidar total cotizado
- bajar presupuesto al seguimiento operativo del repuesto
- bloquear cierres si hay informacion critica incompleta

### 8. Finanzas

Tablas fuente:

- `movimientos_financieros`
- `movimiento_retenciones`
- `movimiento_aplicaciones`
- `comprobantes_emitidos`

Decision clave:

- el modelo financiero correcto es ledger central, no tablas separadas por cada flujo

Objetivos backend:

- registrar cobros, senias, bonificaciones, pagos, retenciones e imputaciones
- conectar finanzas con casos, personas, companias y legal
- emitir comprobantes con soporte documental

### 9. Documentos

Tablas fuente:

- `categorias_documentales`
- `documentos`
- `documento_relaciones`

Decision clave:

- archivo y contexto van separados
- NO se duplica storage por cada uso funcional

Objetivos backend:

- subida segura de archivos
- versionado o baja logica, no borrado ciego
- relacionar un documento con muchas entidades del dominio
- filtrar documentacion por caso aunque el documento cuelgue de otra entidad

### 10. Tramites especializados

Tablas fuente:

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
- `recuperos_franquicia`

Decision clave:

- los tramites complejos son extensiones del caso, no sistemas separados

Objetivos backend:

- soportar variaciones por tramite sin ensuciar `casos`
- compartir nucleo operativo y financiero
- permitir evolucion legal, economica y documental de cada flujo

### 11. Administracion, integraciones y auditoria

Tablas fuente:

- `notificaciones`
- `integraciones_config`
- `integraciones_log`
- `outbox_eventos`
- `auditoria_eventos`

Objetivos backend:

- centralizar eventos visibles para usuarios
- desacoplar integraciones externas
- implementar publicacion confiable con outbox
- mantener auditoria persistente y consultable

## Roadmap recomendado por fases

## Fase 0. Cierre de definiciones funcionales y tecnicas

Entregables:

- catalogo canonico de `tipos_tramite`
- catalogo inicial de `workflow_estados` por dominio
- primeras `workflow_transiciones`
- codigos controlados: prioridad, estado de tarea, tipos de contacto, medio de pago, estado de repuesto, categoria documental
- regla de `codigo_carpeta`
- criterios de auditoria obligatoria

No arrancar implementacion seria sin esta fase. Si no, el backend nace con deriva semantica.

## Fase 1. Bootstrap tecnico

Entregables:

- proyecto `backend/`
- configuracion por perfiles
- Flyway operativo
- OpenAPI
- Actuator
- manejo global de errores
- seguridad base
- convenciones de logs y trazas

## Fase 2. Seguridad y organizacion

Entregables:

- CRUD administrativo de `organizaciones` y `sucursales`
- modulo de `usuarios`
- login
- RBAC con `roles`, `permisos`, `usuario_roles`
- middleware de scoping por organizacion/sucursal
- auditoria de autenticacion y cambios de permisos

## Fase 3. Personas y vehiculos

Entregables:

- alta y busqueda de `personas`
- contactos y domicilios
- alta y busqueda de `vehiculos`
- normalizacion de documento y dominio
- relacion `vehiculo_personas`

## Fase 4. Core de casos

Entregables:

- alta minima de `casos`
- creacion transaccional de persona principal y vehiculo principal si no existen
- `caso_personas`
- `caso_vehiculos`
- `caso_relaciones`
- `caso_siniestro`
- listados iniciales y detalle de expediente

## Fase 5. Workflow central

Entregables:

- carga de `workflow_estados`
- carga de `workflow_transiciones`
- servicio de transicion
- `caso_estado_historial`
- actualizacion atomica del cache en `casos`
- auditoria de transiciones

## Fase 6. Operacion taller

Entregables:

- `turnos_reparacion`
- `ingresos_vehiculo`
- `ingreso_items`
- `egresos_vehiculo`
- `tareas`
- calculo de salida estimada con `feriados`
- reingresos con trazabilidad completa

## Fase 7. Presupuesto y repuestos

Entregables:

- `presupuestos`
- `presupuesto_items`
- calculos de mano de obra, IVA y total
- `repuestos_caso`
- bloqueo de cierre si faltan datos minimos
- derivacion de alertas por repuestos y desvio economico

## Fase 8. Finanzas y comprobantes

Entregables:

- `movimientos_financieros`
- `movimiento_retenciones`
- `movimiento_aplicaciones`
- `comprobantes_emitidos`
- resumen financiero por caso
- saldo e imputacion funcional

## Fase 9. Documentos

Entregables:

- `categorias_documentales`
- subida de `documentos`
- vinculacion con `documento_relaciones`
- permisos de visibilidad
- filtros por caso, modulo y entidad

## Fase 10. Todo Riesgo y seguros

Entregables:

- `companias_seguro`
- `companias_contactos`
- `caso_seguro`
- `caso_tramitacion_seguro`
- `caso_franquicia`
- reglas de acuerdo, repuestos y override administrativo

## Fase 11. CLEAS, terceros y legal

Entregables:

- `caso_cleas`
- `caso_terceros`
- `caso_legal`
- `legal_novedades`
- `legal_gastos`
- relacion con finanzas y documentos

## Fase 12. Recupero de franquicia e integraciones

Entregables:

- `recuperos_franquicia`
- `notificaciones`
- `integraciones_config`
- `integraciones_log`
- `outbox_eventos`
- endurecimiento de `auditoria_eventos`

## Orden recomendado de construccion real

1. bootstrap tecnico
2. seguridad y organizacion
3. personas y vehiculos
4. casos y relaciones
5. workflow
6. operacion taller
7. presupuesto y repuestos
8. finanzas
9. documentos
10. seguros
11. CLEAS, terceros y legal
12. recuperos, notificaciones e integraciones

## Casos de uso prioritarios de la V1 util

### Seguridad

- iniciar sesion
- obtener contexto del usuario
- validar permisos por organizacion y sucursal

### Personas y vehiculos

- buscar persona por documento normalizado
- buscar vehiculo por dominio normalizado
- crear persona
- crear vehiculo

### Casos

- crear caso con persona y vehiculo principal
- consultar detalle de caso
- listar casos con filtros
- relacionar casos
- agregar roles de personas al caso
- agregar vehiculos relacionados al caso

### Workflow

- transicionar estado de tramite
- transicionar estado de reparacion
- consultar historial

### Operacion taller

- crear turno
- registrar ingreso
- registrar egreso
- crear tarea
- resolver tarea

### Presupuesto

- crear o actualizar presupuesto
- agregar items
- generar totales
- cerrar informe

### Repuestos

- crear seguimiento de repuesto
- actualizar estado
- registrar recepcion y desvio de precio

### Finanzas

- registrar senia o cobro
- registrar retenciones
- emitir comprobante
- imputar movimiento

### Documentos

- subir documento
- relacionar documento con caso o entidad
- consultar documentacion de caso

## Contratos API iniciales sugeridos

## Auth y contexto

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

## Organizacion y seguridad

- `GET /api/v1/organizations`
- `GET /api/v1/branches`
- `GET /api/v1/users/{id}/roles`
- `PUT /api/v1/users/{id}/roles`
- `GET /api/v1/permissions`

## Personas y vehiculos

- `GET /api/v1/persons?document=`
- `POST /api/v1/persons`
- `PUT /api/v1/persons/{personId}`
- `GET /api/v1/vehicles?plate=`
- `POST /api/v1/vehicles`
- `PUT /api/v1/vehicles/{vehicleId}`

## Casos

- `GET /api/v1/cases`
- `POST /api/v1/cases`
- `GET /api/v1/cases/{caseId}`
- `PUT /api/v1/cases/{caseId}`
- `POST /api/v1/cases/{caseId}/persons`
- `POST /api/v1/cases/{caseId}/vehicles`
- `POST /api/v1/cases/{caseId}/relations`
- `PUT /api/v1/cases/{caseId}/incident`

## Workflow

- `POST /api/v1/cases/{caseId}/workflow/transitions`
- `GET /api/v1/cases/{caseId}/workflow/history`

## Operacion

- `POST /api/v1/cases/{caseId}/repair-turns`
- `PUT /api/v1/repair-turns/{turnId}`
- `POST /api/v1/cases/{caseId}/vehicle-entries`
- `POST /api/v1/cases/{caseId}/vehicle-exits`
- `GET /api/v1/tasks`
- `POST /api/v1/tasks`
- `PUT /api/v1/tasks/{taskId}`

## Presupuesto y repuestos

- `GET /api/v1/cases/{caseId}/budget`
- `PUT /api/v1/cases/{caseId}/budget`
- `POST /api/v1/cases/{caseId}/budget/items`
- `PUT /api/v1/cases/{caseId}/budget/items/{itemId}`
- `POST /api/v1/cases/{caseId}/budget/close`
- `GET /api/v1/cases/{caseId}/parts`
- `POST /api/v1/cases/{caseId}/parts`
- `PUT /api/v1/cases/{caseId}/parts/{partId}`

## Finanzas

- `GET /api/v1/cases/{caseId}/financial-movements`
- `POST /api/v1/cases/{caseId}/financial-movements`
- `POST /api/v1/financial-movements/{movementId}/retentions`
- `POST /api/v1/financial-movements/{movementId}/applications`
- `POST /api/v1/cases/{caseId}/receipts`

## Documentos

- `POST /api/v1/documents`
- `POST /api/v1/document-relations`
- `GET /api/v1/cases/{caseId}/documents`

## Seguros y tramites especializados

- `PUT /api/v1/cases/{caseId}/insurance`
- `PUT /api/v1/cases/{caseId}/insurance-processing`
- `PUT /api/v1/cases/{caseId}/franchise`
- `PUT /api/v1/cases/{caseId}/cleas`
- `PUT /api/v1/cases/{caseId}/third-party`
- `PUT /api/v1/cases/{caseId}/legal`
- `PUT /api/v1/cases/{caseId}/franchise-recovery`

## Estrategia de persistencia

- Flyway manda en schema
- JPA valida y mapea
- `ddl-auto=validate`
- migraciones chicas y versionadas
- constraints fuertes en base siempre que MySQL lo permita
- reglas complejas complementadas en aplicacion

## Estrategia de seguridad

## Autenticacion

- JWT de vida corta
- refresh token rotado
- hash con BCrypt

## Autorizacion

- permisos atomicos por codigo
- roles reutilizables
- asignacion scopeada por organizacion/sucursal
- chequeo obligatorio de scope en cada acceso a `casos`

## Operaciones sensibles que SIEMPRE auditan

- cambio de roles o permisos
- transiciones excepcionales de workflow
- anulacion logica
- override administrativo de turno o acuerdo
- carga o reemplazo documental sensible
- alta o imputacion de movimientos financieros

## Estrategia de auditoria

`auditoria_eventos` debe registrar como minimo:

- altas, ediciones, archivados y anulaciones de caso
- cambios de estado
- asignaciones y resoluciones de tareas
- creacion y cambio de personas, vehiculos y relaciones
- turnos, ingresos, egresos y reingresos
- movimientos financieros y comprobantes
- cambios de roles/permisos

Convencion de `accion_codigo` sugerida:

- `crear`
- `actualizar`
- `archivar`
- `transicionar_estado`
- `crear_turno`
- `registrar_ingreso`
- `registrar_egreso`
- `adjuntar_documento`
- `registrar_movimiento_financiero`
- `emitir_comprobante`

## Estrategia de testing

## Unit tests

Cubrir:

- generacion de `codigo_carpeta`
- normalizacion de documento y dominio
- validadores de roles de caso
- reglas de workflow
- calculos de presupuesto
- calculos financieros y retenciones
- reglas de reingreso

## Integration tests con Testcontainers

Cubrir:

- migraciones Flyway
- constraints principales
- alta transaccional de caso
- transiciones de workflow
- operacion turno -> ingreso -> egreso
- persistencia financiera y documental

## Controller tests

Cubrir:

- 400 por request invalido
- 401/403 por permisos o scope
- contratos JSON clave para frontend

## Riesgos principales y mitigacion

### Riesgo 1. Modelar el backend copiando la UI

Mitigacion:

- usar `docs/09-estructura-base-de-datos.md` como verdad del dominio
- usar la UI solo como referencia funcional

### Riesgo 2. Colapsar `usuarios` y `personas`

Mitigacion:

- respetar separacion identidad de acceso vs identidad de negocio

### Riesgo 3. Saltarse workflow parametrizable

Mitigacion:

- centralizar transiciones en `workflow_transiciones`
- auditar cada cambio de estado

### Riesgo 4. Duplicar documentos por contexto

Mitigacion:

- usar `documentos` + `documento_relaciones`

### Riesgo 5. Armar pagos por modulo en vez de ledger

Mitigacion:

- usar `movimientos_financieros` como fuente financiera central

### Riesgo 6. No registrar auditoria real

Mitigacion:

- exigir `auditoria_eventos` desde el primer release tecnico

## Validaciones previas antes de empezar a codear

- cerrar codigos controlados de catalogos base
- confirmar algoritmo final de `codigo_carpeta`
- decidir estrategia exacta de `workflow_transiciones.regla_json`
- definir politicas documentales: retencion, reemplazo, visibilidad, tamanos
- validar si `usuarios` tendra FK opcional a `personas` en una iteracion futura
- decidir el alcance inicial de `integraciones_config` y `outbox_eventos`

## Resultado esperado de la primera version util

La primera version realmente util del backend deberia permitir:

- autenticar usuarios con permisos scopeados
- crear personas y vehiculos reutilizables
- abrir carpetas consistentes con persona y vehiculo principal
- registrar workflow con historial y auditoria
- gestionar turnos, ingresos, egresos y reingresos
- manejar presupuesto y repuestos
- registrar dinero y comprobantes en un ledger unificado
- adjuntar documentos sin duplicar archivos
- dejar listo el terreno para seguros, terceros, legal y recuperos sin redisenar el core

## Recomendacion final

El mejor camino para este proyecto es:

- `Spring Boot + MySQL`
- monolito modular
- backend guiado por `docs/09-estructura-base-de-datos.md`
- implementacion por fases del core hacia las extensiones
- auditoria, workflow y documento-relacion como piezas fundacionales, no como agregado posterior

Si el equipo respeta eso, no solo va a tener un MVP: va a construir una base sana para crecer sin romper todo a los dos meses.
