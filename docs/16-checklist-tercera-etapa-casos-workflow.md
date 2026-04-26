# Checklist tercera etapa backend - casos y workflow core

## Objetivo

Cubrir el corazon operativo del sistema:

- alta de `casos`
- relacion minima con personas y vehiculos
- estados actuales cacheados
- historial y transiciones de workflow
- auditoria basica de negocio

## 1. Casos

- [x] Crear entidad persistente `CaseEntity`
- [x] Crear repositorio `CaseRepository`
- [x] Modelar alta minima de caso con persona y vehiculo principal existentes
- [x] Generar `numero_orden` por organizacion
- [x] Generar `codigo_carpeta` con prefijo y codigo de sucursal
- [x] Persistir `caso_personas` para el cliente principal
- [x] Persistir `caso_vehiculos` para el vehiculo principal
- [x] Persistir `caso_siniestro` cuando llegan datos del hecho
- [x] Implementar `GET /api/v1/cases`
- [x] Implementar `GET /api/v1/cases/{caseId}`
- [x] Implementar `POST /api/v1/cases`
- [x] Implementar actualización de caso
- [x] Implementar `caso_relaciones`

## 2. Workflow core

- [x] Crear repositorios de `workflow_estados` y `workflow_transiciones`
- [x] Crear repositorio de `caso_estado_historial`
- [x] Resolver estados iniciales de `tramite` y `reparacion`
- [x] Registrar historial inicial al crear caso
- [x] Implementar transición de workflow por `domain + actionCode`
- [x] Actualizar cache de estado actual en `casos`
- [x] Implementar `POST /api/v1/cases/{caseId}/workflow/transitions`
- [x] Implementar `GET /api/v1/cases/{caseId}/workflow/history`
- [x] Implementar `GET /api/v1/cases/{caseId}/audit/events` con filtros (`actionCode`, `domain`, `userId`) y paginación (`page`, `size`)
- [x] Validar permisos reales por transición
- [x] Soportar más dominios además de `tramite` y `reparacion`
- [x] Evaluar `regla_json` en las transiciones

## 3. Auditoria

- [x] Crear entidad y repositorio de `auditoria_eventos`
- [x] Registrar evento de auditoria al crear caso
- [x] Registrar evento de auditoria al transicionar estado
- [x] Agregar snapshots/diffs más ricos en JSON

## 4. Reglas implementadas

- [x] No crear caso si no existe tipo de tramite
- [x] No crear caso si la sucursal no pertenece a la organizacion indicada
- [x] No crear caso si no existen persona principal y vehiculo principal
- [x] No transicionar workflow si no existe transición válida
- [x] No transicionar workflow si el caso no tiene estado actual para ese dominio
- [x] Exigir permiso fino por `accion_codigo` de transición (además de alcance del caso)
- [x] Evaluar `regla_json` con operadores extendidos (`EQ`, `NEQ`, `IN`, `NOT_IN`, `GT`, `GTE`, `LT`, `LTE`, `CONTAINS`, `STARTS_WITH`, `all`, `any`, `not`)

## 5. Pendientes para cerrar esta etapa al 100%

- [x] Tests unitarios de generación de carpeta y transición
- [x] Tests de integración para creación de caso
- [x] Tests de historial de workflow
- [ ] Verificación de compilación y arranque
- [x] Seguridad real aplicada a transiciones según permiso y scope
- [x] Implementación de `caso_relaciones`
- [x] Implementación de actualización de caso
- [x] Dominios adicionales `pago`, `documentacion` y `legal` con cache actual en `casos`

## Archivos principales

- `backend/src/main/java/com/tallerzapata/backend/api/casefile/CaseController.java`
- `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseService.java`
- `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseWorkflowService.java`
- `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseAuditService.java`
- `backend/src/main/java/com/tallerzapata/backend/infrastructure/persistence/casefile/CaseEntity.java`
- `backend/src/main/java/com/tallerzapata/backend/infrastructure/persistence/workflow/CaseStateHistoryEntity.java`

## Nota

- Esta etapa deja andando el esqueleto del expediente y de la máquina de estados.
- Falta endurecer permisos, testing y varios detalles de evolución antes de considerarla cerrada del todo.
