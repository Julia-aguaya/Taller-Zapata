# Backend - reparto de trabajo

## Contexto general

Este archivo resume el estado real del backend de `Taller-Zapata` para repartir trabajo entre 2 devs sin duplicar esfuerzo.

Criterio usado:
- **Prioridad backend**: cambios donde hoy falta contrato, logica o modelo backend para destrabar frontend.
- **Backend ya esta**: cambios donde ya existen endpoints, persistencia y tests; backend no deberia ser cuello de botella, aunque puede valer la pena revisar contratos, cobertura o blindajes.

---

## Cambios para tomar en backend

### 1. Busqueda en panel general por numero / apellido

- **Objetivo**: permitir buscar casos desde el panel general por numero de caso/carpeta y por apellido del cliente.
- **Estado actual**: incompleto.
- **Que existe**:
  - `GET /api/v1/cases` ya soporta paginacion y filtros estructurados (`organizationId`, `branchId`, `folderStatus`, fechas, estados, `caseTypeCode`, `opinionCode`, `managerCode`, etc.).
  - La logica esta centralizada en `CaseController` + `CaseService`.
  - Existen autocompletes parciales en otros modulos:
    - personas por nombre/documento
    - vehiculos por patente/texto
- **Que falta**:
  - agregar parametro de busqueda textual al listado de casos (`q` o equivalente);
  - definir contra que campos busca:
    - `numero_orden`
    - `codigo_carpeta`
    - apellido / nombre del cliente principal (`personas.nombre`, `personas.apellido`, `personas.nombre_mostrar`);
  - implementar query/repo eficiente en vez de seguir filtrando todo en memoria;
  - agregar tests de integracion para busqueda por numero y por apellido;
  - validar impacto en paginacion y combinacion con filtros existentes.
- **Archivos clave**:
  - `backend/src/main/java/com/tallerzapata/backend/api/casefile/CaseController.java`
  - `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseService.java`
  - `backend/src/test/java/com/tallerzapata/backend/api/casefile/CaseListFiltersIntegrationTest.java`
  - probable nuevo/ajuste en repositorios de caso/persona
- **Complejidad**: media.
- **Recomendacion**:
  - que un dev tome este cambio primero;
  - hacer busqueda textual en DB, no sobre `findAll()` + filtros en memoria;
  - si hay duda de contrato, usar `q` como convencion porque personas/vehiculos ya usan eso.

### 2. Preview PDF de presupuesto

- **Objetivo**: exponer una forma de previsualizar o descargar el PDF del presupuesto desde frontend.
- **Estado actual**: faltante.
- **Que existe**:
  - modulo de presupuesto con contratos completos para presupuesto, items y repuestos;
  - modulo de documentos con:
    - listado por caso
    - descarga de archivo por caso/documento
  - regla documentada: no generar PDF de presupuesto sin `Informe Cerrado`.
- **Que falta**:
  - definir si el preview se resuelve como:
    - generacion on-demand de PDF, o
    - descarga de un documento PDF ya generado/subido;
  - endpoint especifico para presupuesto (`preview` / `download` / `generate`);
  - decidir origen de datos del PDF:
    - `presupuestos`
    - `presupuesto_items`
    - eventualmente `repuestos_caso`
  - definir content type / headers para inline preview;
  - tests de integracion del contrato;
  - si aplica, persistencia/versionado del archivo generado.
- **Archivos clave**:
  - `backend/src/main/java/com/tallerzapata/backend/api/budget/BudgetController.java`
  - `backend/src/main/java/com/tallerzapata/backend/application/budget/BudgetService.java`
  - `backend/src/main/java/com/tallerzapata/backend/api/document/DocumentController.java`
  - `backend/src/main/java/com/tallerzapata/backend/application/document/DocumentService.java`
  - `backend/src/test/java/com/tallerzapata/backend/api/budget/BudgetIntegrationTest.java`
  - `backend/src/test/java/com/tallerzapata/backend/api/document/DocumentIntegrationTest.java`
  - `docs/05-reglas-negocio-y-automatizaciones.md`
- **Complejidad**: media/alta.
- **Recomendacion**:
  - cerrar primero la definicion funcional;
  - si hay que destrabar rapido frontend, conviene una **v1** con endpoint de descarga/preview de documento PDF existente;
  - si el PDF debe salir del estado vivo del presupuesto, eso ya es un cambio mas grande y conviene separarlo.

### 3. Separacion cotizacion repuestos vs gestion de pedidos

- **Objetivo**: separar claramente el flujo de cotizacion de repuestos del seguimiento operativo/pedidos.
- **Estado actual**: parcial.
- **Que existe**:
  - backend ya distingue:
    - presupuesto e items (`/budget`, `/budget/items`)
    - repuestos del caso (`/parts`)
  - `repuestos_caso` funciona como seguimiento operativo del repuesto;
  - `presupuesto_items` sirve como origen funcional de piezas/intervenciones;
  - hay tests de presupuesto y repuestos.
- **Que falta**:
  - hoy no existe un submodelo/backend explicito para **cotizacion de repuestos** ni para **gestion de pedidos** como flujos separados;
  - no hay endpoints especificos para cotizaciones de repuestos;
  - no aparece implementacion de tablas/entidades tipo `cotizaciones_repuestos`;
  - falta decidir si:
    - se extiende `repuestos_caso`, o
    - se crea un agregado nuevo para cotizaciones/pedidos;
  - falta definir reglas de transicion entre:
    - item presupuestado
    - repuesto cotizado
    - repuesto pedido
    - repuesto recibido/usado/devuelto
  - falta cobertura de contrato para esa separacion funcional.
- **Archivos clave**:
  - `backend/src/main/java/com/tallerzapata/backend/api/budget/BudgetController.java`
  - `backend/src/main/java/com/tallerzapata/backend/application/budget/BudgetService.java`
  - `backend/src/main/java/com/tallerzapata/backend/infrastructure/persistence/budget/BudgetEntity.java`
  - `backend/src/main/java/com/tallerzapata/backend/infrastructure/persistence/budget/BudgetItemEntity.java`
  - `backend/src/main/java/com/tallerzapata/backend/infrastructure/persistence/budget/CasePartEntity.java`
  - `backend/src/test/java/com/tallerzapata/backend/api/budget/BudgetIntegrationTest.java`
  - `docs/08-schema-inicial-base-de-datos.md`
  - `docs/09-estructura-base-de-datos.md`
- **Complejidad**: alta.
- **Recomendacion**:
  - que lo tome el dev con mas contexto de dominio;
  - arrancar con definicion de modelo y contrato antes de tocar codigo;
  - alternativa de menor riesgo: mantener `repuestos_caso` como tracking operativo y sumar entidad/endpoint especifico de cotizacion;
  - alternativa de mayor alcance: redisenar el modulo de repuestos con estados y subflujos separados.

---

## Cambios donde backend ya esta

### 1. Agenda por cotizacion acordada

- **No deberia ser prioridad backend**.
- **Que ya esta**:
  - endpoints de turnos:
    - listar por caso
    - crear
    - actualizar
  - logica de calculo de salida estimada y sync de estado de reparacion;
  - tests de integracion de turnos.
- **Que revisar si se quiere blindar**:
  - si frontend necesita bloqueo por "cotizacion acordada", verificar si esa regla debe vivir en backend o solo en UI;
  - agregar validacion explicita si el negocio exige no crear turno sin cierto estado de cotizacion;
  - revisar permisos (`turno.ver`, `turno.crear`, `turno.editar`).
- **Archivos clave**:
  - `backend/src/main/java/com/tallerzapata/backend/api/operation/RepairAppointmentController.java`
  - `backend/src/main/java/com/tallerzapata/backend/application/operation/RepairAppointmentService.java`
  - `backend/src/test/java/com/tallerzapata/backend/api/operation/RepairAppointmentIntegrationTest.java`

### 2. Reclamo Abogado

- **No deberia ser prioridad backend**.
- **Que ya esta**:
  - el tipo `RECLAMO_TERCEROS_ABOGADO` existe en catalogo y se persiste por `caseTypeId`;
  - backend distingue el tipo y devuelve `caseTypeCode`;
  - hay endpoints y tablas para datos de terceros y legales.
- **Que revisar si se quiere blindar**:
  - sumar test de integracion creando un caso con `RECLAMO_TERCEROS_ABOGADO`;
  - validar que el frontend este enviando el `caseTypeId` correcto;
  - revisar naming/contrato para que frontend no mezcle tercero comun con abogado.
- **Archivos clave**:
  - `backend/src/main/resources/db/migration/V1__init_organizaciones_y_sucursales.sql`
  - `backend/src/main/java/com/tallerzapata/backend/api/casefile/CaseController.java`
  - `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseService.java`
  - `backend/src/test/java/com/tallerzapata/backend/api/insurance/InsuranceIntegrationTest.java`

### 3. Asociar franquicia con Todo Riesgo

- **No deberia ser prioridad backend**.
- **Que ya esta**:
  - `GET/PUT /api/v1/cases/{caseId}/franchise-recovery`;
  - persistencia de `baseCaseId` y `baseFolderCode`;
  - validacion basica para que el caso base exista y no sea el mismo caso.
- **Que revisar si se quiere blindar**:
  - validar consistencia entre `baseCaseId` y `baseFolderCode`;
  - sumar test que verifique roundtrip de ambos campos;
  - revisar si hay que sincronizar esto con otras relaciones del dominio (`relatedCaseId` en franquicia).
- **Archivos clave**:
  - `backend/src/main/java/com/tallerzapata/backend/api/recovery/FranchiseRecoveryController.java`
  - `backend/src/main/java/com/tallerzapata/backend/application/recovery/FranchiseRecoveryService.java`
  - `backend/src/main/resources/db/migration/V26__franchise_recovery.sql`
  - `backend/src/test/java/com/tallerzapata/backend/api/recovery/FranchiseRecoveryIntegrationTest.java`

### 4. Tipo / uso vehiculo

- **No deberia ser prioridad backend**.
- **Que ya esta**:
  - `VehicleResponse` y `VehicleUpsertRequest` ya exponen `vehicleTypeCode` y `usageCode`;
  - el servicio de vehiculo ya persiste esos campos.
- **Que revisar si se quiere blindar**:
  - confirmar si frontend necesita ademas catalogos explicitos para esos codigos;
  - revisar validaciones si hoy esos valores entran mas libres de lo deseado;
  - sumar tests de create/update usando esos campos si van a ser criticos en UI.
- **Archivos clave**:
  - `backend/src/main/java/com/tallerzapata/backend/api/vehicle/VehicleResponse.java`
  - `backend/src/main/java/com/tallerzapata/backend/api/vehicle/VehicleUpsertRequest.java`
  - `backend/src/main/java/com/tallerzapata/backend/application/vehicle/VehicleService.java`
  - `backend/src/test/java/com/tallerzapata/backend/api/vehicle/VehicleIntegrationTest.java`

### 5. Catalogos franquicia / recupero

- **No deberia ser prioridad backend**.
- **Que ya esta**:
  - catalogos de seguros incluyen franquicia y recupero;
  - recupero de franquicia tiene GET/PUT propio;
  - hay tests de integracion para ambos modulos.
- **Que revisar si se quiere blindar**:
  - validar que frontend este leyendo el catalogo correcto:
    - catalogos de `insurance`
    - contrato de `franchise-recovery`
  - revisar consistencia de codigos entre franquicia y recupero;
  - sumar test de contrato si se consumen combos cruzados en una misma pantalla.
- **Archivos clave**:
  - `backend/src/main/java/com/tallerzapata/backend/api/insurance/InsuranceController.java`
  - `backend/src/main/java/com/tallerzapata/backend/api/recovery/FranchiseRecoveryController.java`
  - `backend/src/test/java/com/tallerzapata/backend/api/insurance/InsuranceIntegrationTest.java`
  - `backend/src/test/java/com/tallerzapata/backend/api/recovery/FranchiseRecoveryIntegrationTest.java`

---

## Orden sugerido

1. **Busqueda en panel general por numero / apellido**
   - menor alcance que repuestos;
   - destraba una necesidad visible de UX;
   - deja una mejora clara de contrato en `GET /api/v1/cases`.

2. **Preview PDF de presupuesto**
   - requiere definicion funcional, pero puede resolverse en una v1 acotada;
   - conviene atacarlo antes que el rediseno de repuestos.

3. **Separacion cotizacion repuestos vs gestion de pedidos**
   - es el cambio mas grande de modelo;
   - conviene encararlo con diseno previo y no como ajuste incremental improvisado.

Sugerencia de reparto:
- **Dev A**: busqueda panel general + definicion/implementacion de preview PDF.
- **Dev B**: analisis/modelado de separacion repuestos vs pedidos y propuesta de contrato.

---

## Riesgos y dependencias con frontend

- La **busqueda del panel general** necesita definicion cerrada de UX:
  - un solo input libre (`q`) vs filtros separados;
  - que significa "numero": `numero_orden`, `codigo_carpeta`, ambos.
- El **preview PDF** depende de acordar si frontend espera:
  - un PDF generado en tiempo real,
  - un documento persistido,
  - o una URL de descarga/preview inline.
- La **separacion repuestos vs pedidos** requiere que frontend no consolide prematuramente en una sola grilla conceptos distintos del dominio.
- En los cambios donde backend "ya esta", el mayor riesgo no es implementacion sino **desalineacion de contrato**:
  - nombres de campos,
  - ubicacion del dato,
  - catalogos correctos,
  - permisos.
- Si frontend avanza antes de cerrar estos contratos, hay riesgo de:
  - hardcodear reglas,
  - duplicar estados/codigos,
  - pedir retrabajo backend despues.
