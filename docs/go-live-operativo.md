# Taller Zapata - Go-live Operativo (Entorno Cliente)

## Objetivo

Definir un plan operativo accionable para salida a produccion en entorno cliente, cubriendo catalogos definitivos, soporte inicial, backup/recuperacion e incidentes, con placeholders explicitos para completar junto al cliente.

## Decisiones de Go-Live para aprobar (Top 10)

1. **SLA SEV1**
   - Valor propuesto: respuesta <= 15 min, resolucion <= 4 h
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: Owner de Soporte Cliente
   - Fecha limite: [AAAA-MM-DD]
2. **SLA SEV2**
   - Valor propuesto: respuesta <= 30 min, resolucion <= 8 h
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: Owner de Soporte Cliente
   - Fecha limite: [AAAA-MM-DD]
3. **SLA SEV3/SEV4**
   - Valor propuesto: SEV3 respuesta <= 4 h y resolucion <= 3 dias habiles; SEV4 respuesta <= 8 h y resolucion <= 5 dias habiles
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: Owner de Soporte Cliente
   - Fecha limite: [AAAA-MM-DD]
4. **RPO/RTO DB**
   - Valor propuesto: RPO 15 min, RTO 2 h
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: Owner de Infraestructura Cliente
   - Fecha limite: [AAAA-MM-DD]
5. **RPO/RTO Documentos y Configuracion**
   - Valor propuesto: Documentos RPO 1 h, RTO 4 h; Configuracion RPO 24 h, RTO 2 h
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: Owner de Infraestructura Cliente
   - Fecha limite: [AAAA-MM-DD]
6. **Ventana de soporte hiper-care (2-4 semanas)**
   - Valor propuesto: 4 semanas (2 activas + 2 mixtas) en TZ cliente
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: PM Cliente
   - Fecha limite: [AAAA-MM-DD]
7. **Canales oficiales de contacto**
   - Valor propuesto: tickets (sistema ITSM), chat operativo, telefono on-call para SEV1/SEV2, email para reportes
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: Coordinacion de Soporte Cliente
   - Fecha limite: [AAAA-MM-DD]
8. **Reglas de escalamiento minimo**
   - Valor propuesto: L1->L2 en 15 min, L2->L3 en 30 min, tecnico->negocio en 30 min para SEV1/SEV2
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: Lider Tecnico Cliente
   - Fecha limite: [AAAA-MM-DD]
9. **Retencion de backups**
   - Valor propuesto: DB 30 dias, storage 30 dias, configuracion 90 dias
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: Owner de Compliance/Seguridad Cliente
   - Fecha limite: [AAAA-MM-DD]
10. **Fecha de go-live y congelamiento de cambios**
   - Valor propuesto: congelamiento de 5 dias habiles previos a go-live
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: Comite de Cambio Cliente
   - Fecha limite: [AAAA-MM-DD]

## Alcance y supuestos

- Este documento aplica al primer paso a produccion de `Taller-Zapata` en entorno cliente.
- No define datos reales del cliente; todos los campos marcados como `[POR DEFINIR CLIENTE]` deben cerrarse antes del go-live.
- Todo cambio en catalogos, configuracion o soporte debe quedar registrado en evidencia operativa.

---

## 1) Catalogo y codigos definitivos (seguros/finanzas/documentos)

### 1.1 Checklist de definicion

- [ ] Confirmar universo de catalogos: `seguros`, `finanzas`, `documentos`.
- [ ] Confirmar sistema origen por cada catalogo (`[SISTEMA_ORIGEN]`).
- [ ] Congelar version de codigos a usar en produccion (`[VERSION_CATALOGO]`).
- [ ] Definir owner funcional y owner tecnico por catalogo.
- [ ] Definir convenciones de codigo (longitud, prefijos, mayusculas, vigencia).
- [ ] Confirmar valores obsoletos y estrategia de deprecacion.
- [ ] Validar impactos en integraciones/APIs/reportes.
- [ ] Obtener aprobacion formal de negocio (acta/correo/ticket).

### 1.2 Matriz de mapeo origen -> destino (plantilla)

| Dominio | Catalogo | Sistema origen | Codigo origen | Descripcion origen | Codigo destino | Descripcion destino | Regla de transformacion | Estado | Owner |
|---------|----------|----------------|---------------|--------------------|----------------|---------------------|-------------------------|--------|-------|
| Seguros | [CAT_SEG_1] | [SISTEMA_ORIGEN] | [COD_ORIGEN] | [DESC_ORIGEN] | [COD_DESTINO] | [DESC_DESTINO] | [REGLA] | [PENDIENTE/APROBADO] | [RESPONSABLE] |
| Finanzas | [CAT_FIN_1] | [SISTEMA_ORIGEN] | [COD_ORIGEN] | [DESC_ORIGEN] | [COD_DESTINO] | [DESC_DESTINO] | [REGLA] | [PENDIENTE/APROBADO] | [RESPONSABLE] |
| Documentos | [CAT_DOC_1] | [SISTEMA_ORIGEN] | [COD_ORIGEN] | [DESC_ORIGEN] | [COD_DESTINO] | [DESC_DESTINO] | [REGLA] | [PENDIENTE/APROBADO] | [RESPONSABLE] |

### 1.3 Validaciones y criterios de aceptacion

#### Validaciones minimas

- Integridad: 100% de codigos destino sin nulos para registros dentro del alcance.
- Unicidad: no se permiten codigos destino duplicados dentro del mismo catalogo.
- Trazabilidad: cada codigo destino debe poder rastrearse a su codigo origen.
- Compatibilidad: los codigos cargados deben respetar contratos vigentes de API/DB.
- Cobertura: validar casos normales, valores limite y codigos obsoletos.

#### Criterios de aceptacion

- [ ] Cobertura de mapeo completada: `>= [UMBRAL_COBERTURA]%`.
- [ ] Error de transformacion: `<= [UMBRAL_ERROR]%`.
- [ ] Muestreo funcional aprobado por negocio (`[CANTIDAD_MUESTRAS]` registros).
- [ ] Prueba de regresion en procesos dependientes sin bloqueantes.
- [ ] Aprobacion final registrada por `[OWNER_FUNCIONAL]` y `[OWNER_TECNICO]`.

### 1.4 Plan de carga inicial + rollback de catalogo

#### Plan de carga inicial (runbook)

| Paso | Actividad | Responsable | Ventana | Evidencia |
|------|-----------|-------------|---------|-----------|
| 1 | Respaldar estado actual de catalogos | [ROL_TECNICO] | [FECHA/HORA] | Snapshot/export previo |
| 2 | Ejecutar pre-validaciones de estructura y formato | [ROL_TECNICO] | [FECHA/HORA] | Log de validacion |
| 3 | Cargar catalogos en entorno cliente | [ROL_TECNICO] | [FECHA/HORA] | Log de carga + conteos |
| 4 | Ejecutar validaciones post-carga | [ROL_TECNICO] | [FECHA/HORA] | Reporte de control |
| 5 | Validacion funcional de negocio | [ROL_NEGOCIO] | [FECHA/HORA] | Acta de conformidad |
| 6 | Habilitar operacion normal | [ROL_RESPONSABLE] | [FECHA/HORA] | Aprobacion final |

#### Rollback de catalogo

- Trigger de rollback: error severo de integridad, incompatibilidad funcional critica o rechazo de negocio.
- Punto de retorno: snapshot/export tomado en paso 1.
- Procedimiento:
  1. Poner proceso afectado en modo controlado (`[MODO_MANTENIMIENTO]`).
  2. Restaurar catalogos desde respaldo validado.
  3. Re-ejecutar validaciones minimas de integridad y compatibilidad.
  4. Confirmar restauracion con negocio y cerrar incidente asociado.
- Criterio de exito rollback: estado funcional equivalente al baseline previo con evidencia completa.

---

## 2) Plan de soporte inicial (2-4 semanas)

### 2.1 Cobertura horaria

| Semana | Ventana horaria | Zona horaria | Modalidad | Objetivo |
|--------|------------------|--------------|-----------|----------|
| 1 | 08:00-20:00 | [TZ_CLIENTE] | Guardia activa | Contencion inmediata post go-live |
| 2 | 08:00-20:00 | [TZ_CLIENTE] | Guardia activa | Estabilizacion funcional/tecnica |
| 3 | 09:00-18:00 | [TZ_CLIENTE] | Guardia mixta | Reduccion de incidentes recurrentes |
| 4 | 09:00-18:00 | [TZ_CLIENTE] | Guardia pasiva/activa | Traspaso a soporte regular |

Notas de aprobacion cliente para cobertura horaria:
- Valor propuesto: 4 semanas con cobertura activa semanas 1-2 y mixta semanas 3-4
- Estado: Pendiente de validacion cliente
- Responsable de aprobacion: PM Cliente
- Fecha limite: [AAAA-MM-DD]

### 2.2 Roles y responsabilidades (L1/L2/L3)

| Nivel | Foco | Responsabilidades | Tiempo objetivo de toma |
|-------|------|-------------------|--------------------------|
| L1 | Operacion y triage | Recepcion, categorizacion, evidencias iniciales, comunicacion base | 10 min |
| L2 | Analisis funcional/tecnico | Diagnostico, workaround, correccion de configuracion/datos operativos | 30 min |
| L3 | Ingenieria especialista | Fix de codigo, cambios estructurales, hotfixes controlados | 60 min |

Notas de aprobacion cliente para responsables:
- Valor propuesto: asignar 1 titular + 1 backup por nivel (L1/L2/L3) y on-call de negocio
- Estado: Pendiente de validacion cliente
- Responsable de aprobacion: Gerencia de Operaciones Cliente
- Fecha limite: [AAAA-MM-DD]

### 2.3 Canales de contacto

| Canal | Uso | Horario | Responsable |
|-------|-----|---------|-------------|
| Sistema de tickets (ITSM cliente) | Registro formal y trazabilidad | 24x7 recepcion / atencion segun guardia | L1 |
| Chat operativo (canal unico de incidentes) | Coordinacion en vivo incidentes | Segun guardia activa/mixta | L1/L2 |
| Telefono on-call | Escalamiento urgente SEV1/SEV2 | 24x7 | On-call |
| Email operativo | Comunicaciones formales y reportes | 09:00-18:00 dias habiles | Coordinacion soporte |

Notas de aprobacion cliente para canales:
- Valor propuesto: unificar toda apertura en ITSM y usar chat/telefono solo para coordinacion y urgencias
- Estado: Pendiente de validacion cliente
- Responsable de aprobacion: Coordinacion de Soporte Cliente
- Fecha limite: [AAAA-MM-DD]

### 2.4 Rituales diarios/semanales

#### Diario (15-30 min)

- Estado de incidentes abiertos/cerrados.
- Bloqueos tecnicos y plan de remocion.
- Cambios de configuracion ejecutados/pendientes.
- Riesgos de negocio para siguiente ventana operativa.

#### Semanal (45-60 min)

- Revision de metricas de estabilizacion.
- Top causas raiz y acciones preventivas.
- Ajustes a cobertura y nivel de guardia.
- Decision de continuidad o cierre de etapa hiper-care.

### 2.5 Metricas de estabilizacion

| Metrica | Definicion | Meta sugerida | Fuente |
|--------|------------|---------------|--------|
| Incidentes por semana | Total incidentes en ventana | Tendencia descendente semanal | ITSM cliente |
| MTTA | Tiempo medio de respuesta | <= 30 min | ITSM + monitoreo |
| MTTR | Tiempo medio de resolucion | <= 8 h | ITSM + monitoreo |
| Reapertura | % incidentes reabiertos | <= 10% | ITSM cliente |
| Cumplimiento SLA | % tickets dentro de SLA | >= 95% | ITSM cliente |

---

## 3) Backup y recuperacion

### 3.1 Frecuencia y tipo de backups

| Componente | Tipo de backup | Frecuencia sugerida | Retencion sugerida | Owner |
|------------|----------------|---------------------|--------------------|-------|
| Base de datos | Full + incremental/logico | Full diario + incremental cada 1 hora | 30 dias | [OWNER_INFRA] |
| Storage de documentos | Snapshot/versionado de objetos | Cada 4 horas + diario | 30 dias | [OWNER_INFRA] |
| Configuraciones | Export versionado (IaC/config app) | Por cambio + diario | 90 dias | [OWNER_DEVOPS] |

Notas de aprobacion cliente para backups:
- Valor propuesto: retencion estandar 30/30/90 dias (DB/storage/config)
- Estado: Pendiente de validacion cliente
- Responsable de aprobacion: Owner de Compliance/Seguridad Cliente
- Fecha limite: [AAAA-MM-DD]

### 3.2 Objetivos RPO/RTO sugeridos

| Activo | RPO sugerido | RTO sugerido | Justificacion |
|--------|--------------|--------------|---------------|
| DB transaccional | 15 min | 2 h | Minimizar perdida de datos operativos |
| Documentos | 1 h | 4 h | Continuidad de expediente y evidencia |
| Configuracion | 24 h | 2 h | Recuperar capacidad de servicio rapidamente |

Notas de aprobacion cliente para RPO/RTO:
- Valor propuesto: baseline enterprise (DB 15m/2h, documentos 1h/4h, configuracion 24h/2h)
- Estado: Pendiente de validacion cliente
- Responsable de aprobacion: Owner de Infraestructura Cliente
- Fecha limite: [AAAA-MM-DD]

### 3.3 Procedimiento de restore probado (plantilla)

| Paso | Actividad | Responsable | Resultado esperado |
|------|-----------|-------------|--------------------|
| 1 | Seleccionar punto de restauracion validado | [ROL] | Punto objetivo confirmado |
| 2 | Restaurar componente en entorno de prueba/DR | [ROL] | Restore finalizado sin errores criticos |
| 3 | Ejecutar smoke tests tecnicos | [ROL] | Servicios y conectividad operativos |
| 4 | Ejecutar validacion funcional minima | [ROL_NEGOCIO/L2] | Flujo critico operativo |
| 5 | Documentar tiempos reales RPO/RTO | [ROL] | Evidencia comparativa vs objetivo |

### 3.4 Evidencia minima requerida por prueba de recuperacion

- [ ] Registro de fecha/hora de inicio y fin de restore.
- [ ] Identificador exacto de backup restaurado.
- [ ] Logs de restauracion y validaciones tecnicas.
- [ ] Resultado de smoke tests y pruebas funcionales criticas.
- [ ] Medicion real de RPO/RTO alcanzado.
- [ ] Desvios encontrados y acciones correctivas.
- [ ] Aprobacion final (tecnica y negocio).

---

## 4) Politica de incidentes

### 4.1 Severidades (SEV1..SEV4)

| Severidad | Definicion operativa | Ejemplo tipico | Comunicacion |
|-----------|----------------------|----------------|--------------|
| SEV1 | Caida total o impacto critico en operacion principal | Sistema no disponible o perdida grave de operacion | Inmediata a tecnico + negocio |
| SEV2 | Degradacion severa con workaround limitado | Modulo critico inestable con alto impacto | Alta prioridad con seguimiento continuo |
| SEV3 | Impacto moderado con workaround viable | Error funcional acotado | Gestion en ventana regular priorizada |
| SEV4 | Impacto menor o consulta | Ajuste cosmetico/reportes no criticos | Planificacion en backlog |

### 4.2 SLA de respuesta y resolucion objetivo

| Severidad | Respuesta objetivo | Resolucion objetivo |
|-----------|--------------------|---------------------|
| SEV1 | <= 15 min | <= 4 h |
| SEV2 | <= 30 min | <= 8 h |
| SEV3 | <= 4 h | <= 3 dias habiles |
| SEV4 | <= 8 h | <= 5 dias habiles |

Notas de aprobacion cliente para SLA:
- Valor propuesto: esquema enterprise base con foco en contencion SEV1/SEV2
- Estado: Pendiente de validacion cliente
- Responsable de aprobacion: Owner de Soporte Cliente
- Fecha limite: [AAAA-MM-DD]

### 4.3 Escalamiento tecnico y negocio

| Nivel | Cuando aplica | Escala a | Tiempo maximo antes de escalar |
|------|----------------|----------|---------------------------------|
| L1 -> L2 | Sin diagnostico claro o impacto sostenido | Lider L2 de guardia | 15 min |
| L2 -> L3 | Requiere cambio estructural/hotfix | Lider L3 de guardia | 30 min |
| Tecnico -> Negocio | Impacto en servicio cliente/operacion | On-call de negocio | 30 min |

Notas de aprobacion cliente para escalamiento:
- Valor propuesto: escalamiento obligatorio por tiempo para SEV1/SEV2
- Estado: Pendiente de validacion cliente
- Responsable de aprobacion: Lider Tecnico Cliente
- Fecha limite: [AAAA-MM-DD]

### 4.4 Postmortem y acciones preventivas

#### Plantilla minima de postmortem

| Campo | Contenido esperado |
|------|---------------------|
| ID incidente | [INC-XXXX] |
| Severidad final | [SEV1..SEV4] |
| Timeline | [Linea de tiempo de eventos clave] |
| Causa raiz | [Tecnica/proceso/persona/dato] |
| Impacto | [Usuarios/modulos/tiempo] |
| Acciones correctivas | [Accion + owner + fecha] |
| Acciones preventivas | [Accion + owner + fecha] |
| Estado de cierre | [ABIERTO/CERRADO] |

#### Reglas operativas

- Todo SEV1 y SEV2 requiere postmortem formal.
- Toda accion preventiva debe tener owner y fecha compromiso.
- Las acciones abiertas se revisan en ritual semanal hasta cierre.

---

## Plantillas reutilizables

### A) Ticket de cambio de catalogo

| Campo | Valor |
|------|-------|
| ID cambio | [CHG-XXXX] |
| Catalogo afectado | [NOMBRE_CATALOGO] |
| Motivo | [MOTIVO_CAMBIO] |
| Riesgo | [BAJO/MEDIO/ALTO] |
| Ventana | [FECHA/HORA] |
| Plan de validacion | [CHECKS] |
| Plan de rollback | [RESUMEN] |
| Aprobadores | [NEGOCIO/TECNICO] |

### B) Minuta diaria de soporte inicial

| Campo | Valor |
|------|-------|
| Fecha | [FECHA] |
| Incidentes nuevos | [CANTIDAD] |
| Incidentes cerrados | [CANTIDAD] |
| Riesgos activos | [DETALLE] |
| Bloqueos | [DETALLE] |
| Acciones para manana | [ACCIONES] |

### C) Registro de prueba de restore

| Campo | Valor |
|------|-------|
| Fecha prueba | [FECHA] |
| Componente | [DB/STORAGE/CONFIG] |
| Backup usado | [ID_BACKUP] |
| RPO objetivo vs real | [OBJ] / [REAL] |
| RTO objetivo vs real | [OBJ] / [REAL] |
| Resultado | [OK/CON_DESVIOS/FALLIDO] |
| Acciones | [DETALLE] |

---

## Definiciones pendientes del cliente (obligatorio antes de produccion)

- [ ] Ventanas horarias definitivas de soporte por semana (semanas 1 a 4).
- [ ] Responsables nominales L1/L2/L3 y on-call de negocio.
- [ ] Canales oficiales de contacto y reglas de uso por severidad.
- [ ] SLA finales acordados para SEV1..SEV4.
- [ ] Valores finales de RPO/RTO por activo.
- [ ] Retencion y politica de backups aprobadas por compliance.
- [ ] Matriz de mapeo de catalogos completa y aprobada.
- [ ] Criterios de aceptacion cuantitativos finales (cobertura/error).
- [ ] Procedimiento de rollback validado en simulacro.
- [ ] Fecha de go-live y ventana de congelamiento de cambios.

Campos equivalentes a "TBD/pendiente cliente" detectados y normalizados en este runbook:
- Valor propuesto: SLA por severidad, RPO/RTO, backups, soporte 2-4 semanas, canales y escalamiento con defaults enterprise
- Estado: Pendiente de validacion cliente
- Responsable de aprobacion: PM Cliente + Owners de Soporte/Infraestructura/Negocio
- Fecha limite: [AAAA-MM-DD]

## Matriz de placeholders criticos a cerrar con cliente

1. `TZ_CLIENTE`
   - Valor propuesto: zona horaria oficial de operacion del cliente (ej.: America/Argentina/Buenos_Aires)
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: PM Cliente
   - Fecha limite: [AAAA-MM-DD]
2. `OWNER_INFRA`
   - Valor propuesto: rol Infraestructura Cliente (titular y backup)
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: Gerencia de Infraestructura Cliente
   - Fecha limite: [AAAA-MM-DD]
3. `OWNER_DEVOPS`
   - Valor propuesto: rol DevOps/Plataforma Cliente (titular y backup)
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: Gerencia de Plataforma Cliente
   - Fecha limite: [AAAA-MM-DD]
4. `ROL` (restore) y `ROL_NEGOCIO/L2`
   - Valor propuesto: Infraestructura lidera restore tecnico; Negocio + L2 validan flujo funcional minimo
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: Gerencia de Operaciones Cliente
   - Fecha limite: [AAAA-MM-DD]
5. `SISTEMA_ORIGEN`
   - Valor propuesto: sistema maestro por dominio (seguros/finanzas/documentos) definido en acta de integracion
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: Owner Funcional Cliente
   - Fecha limite: [AAAA-MM-DD]
6. `VERSION_CATALOGO`
   - Valor propuesto: version semantica congelada previa a go-live (ej.: v1.0.0)
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: Owner Funcional Cliente
   - Fecha limite: [AAAA-MM-DD]
7. `UMBRAL_COBERTURA` y `UMBRAL_ERROR`
   - Valor propuesto: cobertura >= 99.5% y error <= 0.5%
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: Owner Funcional + QA Cliente
   - Fecha limite: [AAAA-MM-DD]
8. `CANTIDAD_MUESTRAS`
   - Valor propuesto: muestreo minimo de 100 registros por dominio
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: QA Cliente
   - Fecha limite: [AAAA-MM-DD]
9. `OWNER_FUNCIONAL` y `OWNER_TECNICO`
   - Valor propuesto: aprobacion dual negocio + tecnologia para cierre de catalogos
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: PM Cliente
   - Fecha limite: [AAAA-MM-DD]
10. `MODO_MANTENIMIENTO`
   - Valor propuesto: modo solo lectura con aviso operativo y ventana controlada
   - Estado: Pendiente de validacion cliente
   - Responsable de aprobacion: Lider Tecnico Cliente
   - Fecha limite: [AAAA-MM-DD]

Nota: los placeholders de las secciones "Plantillas reutilizables" se conservan intencionalmente por ser formatos genericos de uso recurrente (no decisiones de go-live).

## Control de version del documento

| Version | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | [FECHA] | [EQUIPO_PROYECTO] | Creacion inicial del runbook operativo de go-live |
