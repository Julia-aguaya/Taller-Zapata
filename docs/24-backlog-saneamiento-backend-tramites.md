# Backlog de saneamiento backend por tramites

Fecha: 2026-06-26

## Objetivo

Traducir la auditoria del backend a un backlog accionable para ordenar el dominio antes de definir contrato final de `front2`.

Escala de prioridad:

- P0: bloquea el modelo de negocio o genera inconsistencias graves
- P1: muy importante para MVP serio
- P2: mejora fuerte, pero puede venir despues

## Frente transversal

### BG-01 - Introducir readiness por solapa y por tramite

- Hallazgo: hoy no existe una capa unica que diga si una solapa puede abrirse, cerrarse o cambiar de color segun reglas del negocio.
- Impacto: frontend y servicios pueden divergir; se multiplican bloqueos manuales o inconsistentes.
- Cambio backend necesario: crear un agregado o servicio de `CaseReadiness` por caso y por familia de tramite, con estados como `allowed`, `blocked`, `reasons`, `completed`.
- Prioridad: P0
- Depende de: definicion de reglas por tramite.

### BG-02 - Alinear estado visible y workflow formal

- Hallazgo: hoy el `CaseVisibleStateResolver` cubre huecos que el workflow formal no representa.
- Impacto: dos verdades sobre el mismo tramite.
- Cambio backend necesario: decidir que estados viven como workflow persistido y cuales como derivacion; documentar y refactorizar en consecuencia.
- Prioridad: P0
- Depende de: BG-01.

### BG-03 - Validar tipo de tramite en modulos especializados

- Hallazgo: varios servicios aceptan datos de seguro, CLEAS, legal o recupero sin controlar fuerte el `caseTypeId`.
- Impacto: corrupcion de dominio.
- Cambio backend necesario: guardas explicitas por tipo de tramite en cada modulo especializado.
- Prioridad: P0
- Depende de: catalogo canonico de tipos y familias.

### BG-04 - Derivar cierres de caso por negocio y no por carga manual

- Hallazgo: `closedAt` hoy puede setearse manualmente.
- Impacto: el sistema permite cerrar casos fuera de las reglas reales.
- Cambio backend necesario: encapsular cierre por familia de tramite, calcular fecha de cierre por ultimo hito cumplido y restringir update manual.
- Prioridad: P0
- Depende de: reglas por tramite y BG-02.

### BG-05 - Contrato de capacidades, bloqueos y prioridades para `front2`

- Hallazgo: el frontend nuevo necesitara saber que puede hacer, por que no puede avanzar y que debe priorizar.
- Impacto: sin este contrato, el frontend termina adivinando reglas.
- Cambio backend necesario: exponer endpoint de sesion/capacidades y endpoint de panel con prioridades y bloqueos.
- Prioridad: P1
- Depende de: BG-01, BG-02 y definicion minima del panel general.

## Trámite PARTICULAR

### PT-01 - Simplificar el alta minima del caso

- Hallazgo: la creacion actual exige mas datos de los que el negocio considera obligatorios para abrir carpeta.
- Impacto: no cumple el flujo operativo real.
- Cambio backend necesario: soportar alta minima con tipo de tramite, cliente, vehiculo y referenciado; el resto debe poder completarse despues.
- Prioridad: P0
- Depende de: definicion de defaults operativos para organizacion/sucursal/roles.

### PT-02 - Implementar readiness de Presupuesto

- Hallazgo: presupuesto existe, pero no fuerza completitud real por renglon ni cierre operativo.
- Impacto: se puede avanzar a reparacion con presupuesto semicompleto.
- Cambio backend necesario: validar piezas, tarea, nivel de dano, consistencia del item, cierre de informe y PDF solo si el readiness da completo.
- Prioridad: P0
- Depende de: BG-01.

### PT-03 - Implementar readiness de Gestion Reparacion

- Hallazgo: turno, ingreso, egreso y reingreso existen, pero no estan conectados a un checklist claro de negocio.
- Impacto: se puede agendar o avanzar sin cumplir precondiciones del taller.
- Cambio backend necesario: reglas explicitas para turno, ingreso, egreso definitivo, reingreso y fotos reparado.
- Prioridad: P0
- Depende de: BG-01.

### PT-04 - Implementar cierre financiero del Particular

- Hallazgo: finanzas es generica, pero no modela de forma fuerte “pago total”, “saldo deudor” y su relacion con cierre del caso.
- Impacto: no se puede cerrar el caso por regla real.
- Cambio backend necesario: resumen financiero del caso particular, saldo vivo y evento de pago total.
- Prioridad: P0
- Depende de: BG-04.

### PT-05 - Derivar cierre automatico del caso Particular

- Hallazgo: el caso deberia cerrar cuando coinciden egreso definitivo + pago total.
- Impacto: hoy ese hito puede quedar desalineado.
- Cambio backend necesario: policy de cierre `ParticularClosurePolicy` con fecha tomada del ultimo hito cumplido.
- Prioridad: P0
- Depende de: PT-03 y PT-04.

### PT-06 - Consolidar estados superiores de Tramite y Reparacion

- Hallazgo: el visible state ya resuelve parte del problema, pero mezcla heuristicas con estados persistidos.
- Impacto: estados correctos a veces solo en UI y no en el dominio.
- Cambio backend necesario: fijar una tabla canonica de transiciones para Particular y sincronizar visible/formal.
- Prioridad: P1
- Depende de: BG-02.

## Trámite TODO RIESGO

### TR-01 - Formalizar el flujo de tramitacion del seguro

- Hallazgo: hay datos de presentacion, inspeccion, acuerdo y repuestos, pero no un flujo obligado.
- Impacto: se puede cargar informacion fuera de secuencia.
- Cambio backend necesario: policy por hitos `Sin presentar -> Presentado -> En tramite -> Acordado -> Pasado a pagos -> Pagado`.
- Prioridad: P0
- Depende de: BG-01 y BG-02.

### TR-02 - Encapsular la logica de franquicia

- Hallazgo: franquicia ya existe, pero falta que gobierne el avance del tramite y la facturacion.
- Impacto: acuerdos, recuperos y pagos pueden quedar mal interpretados.
- Cambio backend necesario: policy dedicada para franquicia con `estado`, `modo de recupero`, `monto`, `dictamen`, `caso asociado` y efectos sobre cobro/facturacion.
- Prioridad: P0
- Depende de: TR-01.

### TR-03 - Bloquear turnos segun acuerdo, repuestos y autorizaciones

- Hallazgo: hoy el turno puede crearse sin reflejar bien lo pactado con la compania.
- Impacto: riesgo operativo y administrativo.
- Cambio backend necesario: readiness de reparacion en seguros con excepcion autorizable por administrador.
- Prioridad: P0
- Depende de: BG-01.

### TR-04 - Integrar tareas pendientes al avance del tramite

- Hallazgo: existe modulo de tareas, pero no esta acoplado al readiness del tramite.
- Impacto: la agenda no gobierna cierres ni colores de solapa.
- Cambio backend necesario: marcar tareas bloqueantes/no bloqueantes y hacer que el readiness de la tramitacion considere pendientes abiertos.
- Prioridad: P1
- Depende de: BG-01.

### TR-05 - Cerrar el flujo de pagos del Todo Riesgo

- Hallazgo: pagos y comprobantes existen, pero no estan ensamblados con fecha de pasado a pagos, fecha estimada y fecha real de cobro.
- Impacto: el estado del tramite puede mentir.
- Cambio backend necesario: subdominio de facturacion/cobro de compania con estado `Pendiente`, `Atrasado`, `Pagado a termino`, `Pagado con mora`.
- Prioridad: P1
- Depende de: TR-01 y BG-02.

## Resto de tramites

### OT-01 - Modelar GRANIZO como variante real de Todo Riesgo

- Hallazgo: hoy solo existe como tipo catalogado.
- Impacto: no puede diseñarse ni backend ni frontend serio sobre esa base.
- Cambio backend necesario: definir si Granizo hereda de Todo Riesgo con `policy` simplificada o si necesita agregado propio.
- Prioridad: P1
- Depende de: saneamiento de Todo Riesgo.

### OT-02 - Hacer que CLEAS gobierne estados y bloqueos

- Hallazgo: CLEAS ya guarda datos, pero no manda sobre el flujo.
- Impacto: dictamen, franquicia y compensacion quedan decorativos.
- Cambio backend necesario: policy CLEAS con variantes `sobre dano total` y `sobre franquicia`, y dictamen como disparador real.
- Prioridad: P1
- Depende de: BG-01 y TR-02.

### OT-03 - Separar con claridad Terceros Taller vs Terceros Abogado

- Hallazgo: hoy la frontera conceptual no esta bien cerrada.
- Impacto: confusion de negocio y de implementacion.
- Cambio backend necesario: taxonomia clara de familia de tramite, datos obligatorios y readiness especifico por manager.
- Prioridad: P1
- Depende de: BG-03.

### OT-04 - Consolidar Recupero de Franquicia

- Hallazgo: hay solapamiento entre `caso_franquicia` y `recuperos_franquicia`.
- Impacto: duplicacion conceptual y riesgo de inconsistencia.
- Cambio backend necesario: decidir si uno complementa al otro o si deben fusionarse bajo una frontera de dominio unica.
- Prioridad: P1
- Depende de: TR-02.

## Orden sugerido de ejecucion

1. BG-01, BG-02, BG-03, BG-04
2. PT-01 a PT-05
3. TR-01 a TR-03
4. BG-05
5. TR-04, TR-05
6. OT-02, OT-03, OT-04
7. OT-01

## Criterio de avance

Un tramite deberia considerarse saneado cuando cumpla estas condiciones:

- tiene invariantes propias por backend
- tiene readiness por solapa
- tiene estados automaticos alineados con el dominio
- no depende del frontend para reglas criticas
- expone razones de bloqueo entendibles para `front2`
