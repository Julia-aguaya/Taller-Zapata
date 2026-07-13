# Auditoria backend por tramites

Fecha: 2026-06-26

## Objetivo

Dejar trazado el estado real del backend frente a los tramites del negocio antes de definir el plan conjunto de saneamiento y el nuevo `front2`.

Semaforo usado:

- Verde: soporte bastante bueno
- Amarillo: soporte parcial o con riesgo
- Rojo: ausente, muy flojo o incorrecto para negocio

## Hallazgo transversal

El backend ya tiene buena base de permisos, alcance por organizacion/sucursal, auditoria, workflow formal y modulos de seguros, legal, finanzas, operacion y recuperos. El problema principal NO es falta de tablas o endpoints; el problema principal es falta de enforcement del proceso por tipo de tramite.

En criollo:

- guarda muchos datos especializados
- pero todavia no hace cumplir bien bloqueos, readiness, cierre y transiciones por familia de tramite

## Matriz comparativa

| Tramite | Persistencia de datos | Workflow real | Bloqueos de avance | Estados automaticos | Cierre de caso | Observacion corta |
| --- | --- | --- | --- | --- | --- | --- |
| Particular | Amarillo | Amarillo | Rojo | Amarillo | Rojo | Buen esqueleto, falta cerrar reglas finas |
| Todo Riesgo | Verde | Amarillo | Rojo | Amarillo | Rojo | Seguro y franquicia existen; proceso flojo |
| Granizo | Rojo | Rojo | Rojo | Rojo | Rojo | Hoy es casi solo un tipo catalogado |
| CLEAS | Verde | Rojo | Rojo | Rojo | Rojo | Buenos datos, muy poco gobierno del flujo |
| Reclamo de Tercero - Taller | Amarillo | Rojo | Rojo | Rojo | Rojo | Existe mas como estructura que como tramite |
| Reclamo de Tercero - Abogado | Verde | Amarillo | Rojo | Rojo | Rojo | Modulo legal bueno, reglas de expediente flojas |
| Recupero / Franquicia | Verde | Amarillo | Rojo | Rojo | Rojo | Mucha estructura, acople conceptual difuso |

## Por tramite

### 1. Particular

Estado general: Amarillo

Lo que ya existe:

- presupuesto, repuestos, turnos, ingresos, egresos, finanzas y estados visibles
- calculo de IVA y totales de presupuesto
- calculo de salida estimada con dias habiles y feriados
- reingreso modelado

Lo que hoy no cierra:

- alta minima no cumple el requerimiento del negocio
- cierre del caso sigue siendo manual, no derivado de pago total + egreso definitivo
- faltan bloqueos por completitud entre solapas y readiness por etapa
- el estado visible resuelve bastante, pero no siempre coincide con el estado formal persistido

Evidencia:

- `backend/src/main/java/com/tallerzapata/backend/api/casefile/CaseCreateRequest.java:9`
- `backend/src/main/java/com/tallerzapata/backend/application/budget/BudgetService.java:98`
- `backend/src/main/java/com/tallerzapata/backend/application/common/BusinessDayCalculator.java:14`
- `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseVisibleStateResolver.java:198`
- `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseService.java:418`

### 2. Todo Riesgo

Estado general: Amarillo/Verde

Lo que ya existe:

- modulo de seguro
- procesamiento de seguro
- modulo de franquicia
- campos operativos para presentacion, inspeccion, modalidad, acuerdo, repuestos y no repara

Lo que hoy no cierra:

- no hay bloqueo real por fecha de presentacion, acuerdo o readiness documental
- turno y reparacion no quedan subordinados de forma estricta al avance de la tramitacion
- no hay cierre fuerte derivado de pago, franquicia y reparacion

Evidencia:

- `backend/src/main/resources/db/migration/V19__init_insurance_module.sql:83`
- `backend/src/main/resources/db/migration/V19__init_insurance_module.sql:103`
- `backend/src/main/resources/db/migration/V19__init_insurance_module.sql:130`
- `backend/src/main/java/com/tallerzapata/backend/application/insurance/InsuranceService.java:167`
- `backend/src/main/java/com/tallerzapata/backend/application/operation/RepairAppointmentService.java:87`

### 3. Granizo

Estado general: Rojo

Lo que ya existe:

- solo el tipo de tramite en catalogo

Lo que hoy no cierra:

- no hay modulo propio
- no hay reglas propias
- no hay diferenciacion real respecto de Todo Riesgo

Evidencia:

- `backend/src/main/resources/db/migration/V1__init_organizaciones_y_sucursales.sql:78`

### 4. CLEAS

Estado general: Amarillo

Lo que ya existe:

- tabla y servicio especificos para CLEAS
- datos de dictamen, alcance, franquicia, montos y pagos

Lo que hoy no cierra:

- el estado visible no lee la informacion CLEAS como fuente de verdad del avance
- faltan reglas para dictamen a favor, en contra, pendiente y culpa compartida
- no hay enforcement de cierre o bloqueo por combinacion de dictamen + franquicia + pagos

Evidencia:

- `backend/src/main/resources/db/migration/V20__cleas_and_third_party.sql:36`
- `backend/src/main/java/com/tallerzapata/backend/application/insurance/InsuranceService.java:256`
- `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseVisibleStateResolver.java:130`

### 5. Reclamo de Tercero - Taller

Estado general: Amarillo/Rojo

Lo que ya existe:

- modelo de terceros y algunos datos de reclamo

Lo que hoy no cierra:

- el naming del tipo es generico: `RECLAMO_TERCEROS`
- no esta clara en dominio la separacion con gestion por abogado
- no hay flujo propio fuerte de documentacion, cotizaciones, reparacion y cobro

Evidencia:

- `backend/src/main/resources/db/migration/V1__init_organizaciones_y_sucursales.sql:80`
- `backend/src/main/resources/db/migration/V20__cleas_and_third_party.sql:57`

### 6. Reclamo de Tercero - Abogado

Estado general: Amarillo/Verde

Lo que ya existe:

- tipo especifico del tramite
- modulo legal con expediente, novedades, erogaciones y cierre
- datos para instancia administrativa o judicial

Lo que hoy no cierra:

- `requiere_abogado` no gobierna invariantes reales
- faltan bloqueos por instancia, CUIJ, documentacion legal y lesionados
- el cierre legal y su impacto contable todavia no aparecen conectados al caso de manera integral

Evidencia:

- `backend/src/main/resources/db/migration/V1__init_organizaciones_y_sucursales.sql:81`
- `backend/src/main/resources/db/migration/V21__legal_module.sql:36`
- `backend/src/main/java/com/tallerzapata/backend/application/insurance/InsuranceService.java:318`

### 7. Recupero / Franquicia

Estado general: Amarillo

Lo que ya existe:

- modulo de recupero de franquicia
- datos de gestor, carpeta base, dictamen, montos, habilita reparacion y cobro cliente

Lo que hoy no cierra:

- conviven `caso_franquicia` y `recuperos_franquicia` con fronteras conceptuales no del todo claras
- faltan reglas para derivar automaticamente que parte va a compania y que parte a cliente
- el estado visible no usa el recupero como disparador principal del avance

Evidencia:

- `backend/src/main/resources/db/migration/V19__init_insurance_module.sql:130`
- `backend/src/main/resources/db/migration/V26__franchise_recovery.sql:22`
- `backend/src/main/java/com/tallerzapata/backend/application/recovery/FranchiseRecoveryService.java:53`

## Riesgos transversales

### 1. Workflow demasiado generico

Hay workflow formal, pero las transiciones seed siguen siendo demasiado genericas para soportar la casuistica de cada familia.

Evidencia:

- `backend/src/main/resources/db/migration/V6__init_workflow.sql:63`
- `backend/src/main/resources/db/migration/V10__extend_workflow_domains_and_case_state_cache.sql:23`

### 2. Estados visibles y estados formales no siempre cuentan la misma historia

Hoy la capa de estado visible compensa huecos del workflow formal. Eso ayuda al frontend, pero puede abrir inconsistencias de negocio.

Evidencia:

- `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseVisibleStateResolver.java:198`

### 3. Falta enforcement por tipo de tramite

Varios servicios aceptan informacion especializada sin verificar de forma estricta que el caso pertenezca al tipo correcto.

Evidencia:

- `backend/src/main/java/com/tallerzapata/backend/application/insurance/InsuranceService.java:256`
- `backend/src/main/java/com/tallerzapata/backend/application/recovery/FranchiseRecoveryService.java:53`

### 4. El motor de reglas del workflow no mira suficiente dominio

El workflow hoy puede mirar pocos campos del encabezado del caso, pero no gobierna bien sobre dictamen, documentacion, pagos, abogado, CLEAS o franquicia.

Evidencia:

- `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseWorkflowService.java:390`
- `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseWorkflowService.java:455`

## Prioridad sugerida para saneamiento

1. Particular
2. Todo Riesgo
3. CLEAS
4. Reclamo de Tercero - Taller
5. Reclamo de Tercero - Abogado
6. Recupero / Franquicia
7. Granizo

## Conclusion

El backend no esta para tirar. Esta para ordenar. La deuda principal no es de tablas ni de endpoints, sino de reglas ejecutables por tipo de tramite, readiness por solapa, bloqueos de avance y cierre derivado por negocio.
