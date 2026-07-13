# Frontend - backlog operativo de integracion

## Contexto general

Este documento resume los cambios de frontend e integracion detectados en `Taller-Zapata` para repartir trabajo entre 2 devs. El foco esta en cerrar gaps entre lo que ya existe en backend, lo que el frontend hoy consume de forma parcial y lo que todavia queda solo local o sin contrato claro.

Criterio de lectura:
- `Dependencia backend`: `No`, `Parcial`, `Si`.
- `Complejidad`: `Baja`, `Media`, `Alta`.
- `Archivos clave`: punto de entrada mas probable para implementar/corregir.

---

## Cambios para tomar en frontend

### 1. Agenda bloqueada por cotizacion acordada

- `Objetivo`: alinear el guard de agenda/turno con la regla real del negocio y evitar bloqueos incorrectos o poco claros.
- `Estado actual`: en Todo Riesgo el front bloquea `Agendar turno` si no hay cotizacion `Acordada` con fecha y monto, salvo override administrativo.
- `Que existe`: validacion y mensajes ya implementados en `GestionReparacionTab`; la condicion usa `item.computed.todoRisk.quoteAgreed`.
- `Que hay que cambiar`: revisar si el bloqueo debe seguir en el boton, en la subsolapa o solo como warning; unificar mensaje/estado visible con Tramitacion y evitar dobles reglas locales.
- `Archivos clave`: `src/features/gestion/components/GestionReparacionTab.jsx`, `src/features/gestion/components/GestionView.jsx`, `src/features/cases/computed/getComputedCase.js`.
- `Dependencia backend`: `Parcial` (solo si la regla final debe venir del workflow/backend y no de computo local).
- `Complejidad`: `Media`.

### 2. Reclamo Abogado creado como comun

- `Objetivo`: asegurar que un caso creado como `Reclamo de Tercero - Abogado` se abra y se lea como tal, con tabs y flujo correctos.
- `Estado actual`: el alta ya permite elegir ese tipo y resuelve `caseTypeId`, pero la clasificacion posterior depende de inferencia por texto; si backend no devuelve algo con `abogado`, el front cae en `Particular`.
- `Que existe`: selector de tipo en alta, mapeo de `caseTypeId`, tab `Abogado`, flujo y componentes especificos.
- `Que hay que cambiar`: robustecer la deteccion del tipo desde respuesta backend; no depender solo de heuristicas de texto; validar que al abrir una carpeta recien creada entre en flujo `abogado`.
- `Archivos clave`: `src/features/newCase/components/NuevoCaso.jsx`, `src/App.jsx`, `src/features/cases/lib/caseDomainCheckers.js`.
- `Dependencia backend`: `Parcial` (si backend no expone un identificador consistente de tipo).
- `Complejidad`: `Media`.

### 3. Asociar franquicia con Todo Riesgo

- `Objetivo`: vincular correctamente un tramite de recupero de franquicia con una carpeta base de `Todo Riesgo`, leyendo y guardando la asociacion real.
- `Estado actual`: la UI permite seleccionar carpeta compatible y completar datos derivados, pero el comportamiento es mayormente local.
- `Que existe`: lectura de `franchise-recovery`, selector de carpeta asociada, computos de recupero y lectura de carpetas compatibles.
- `Que hay que cambiar`: hidratar `franchiseRecovery` al draft local, persistir `associatedFolderCode`/`associatedCaseId` y campos relacionados, y reflejar el estado real al reabrir la carpeta.
- `Archivos clave`: `src/features/gestion/components/GestionTramiteTab.jsx`, `src/features/gestion/components/PagosTab.jsx`, `src/features/cases/lib/patchCaseWithBackendDetail.js`, `src/lib/api/backend.js`.
- `Dependencia backend`: `Si` (hoy no hay sync equivalente a `franchise-recovery` en frontend).
- `Complejidad`: `Alta`.

### 4. Tipo / uso de vehiculo

- `Objetivo`: dejar de tratar `tipo` y `uso` como datos solo visuales/locales y persistirlos correctamente.
- `Estado actual`: el front muestra selects en alta y ficha tecnica, pero al crear vehiculo envia `vehicleTypeCode` y `usageCode` en `null`; al hidratar desde backend tampoco los completa.
- `Que existe`: campos en UI y placeholders en payload de alta de vehiculo.
- `Que hay que cambiar`: mapear label/code en create/read/update; completar hydration de vehiculo; asegurar roundtrip real al guardar y reabrir.
- `Archivos clave`: `src/features/newCase/components/NuevoCaso.jsx`, `src/features/gestion/components/FichaTecnicaTab.jsx`, `src/features/cases/lib/backendCaseHydration.js`, `src/App.jsx`.
- `Dependencia backend`: `Parcial` (si ya existen codigos/catalogos, es front; si no, hay que confirmar fuente).
- `Complejidad`: `Media`.

### 5. Dropdowns franquicia / recupero

- `Objetivo`: estabilizar dropdowns de `Franquicia` y `Recupero` para que muestren, validen y guarden siempre el valor correcto.
- `Estado actual`: el front ya usa catalogos backend para varias opciones, pero el flujo depende de normalizacion/fallbacks locales y puede bloquear guardado si no resuelve el codigo.
- `Que existe`: `getCatalogSelectOptions`, `resolveCatalogCode`, validacion previa al sync.
- `Que hay que cambiar`: revisar mapeo load/save para `status`, `recoveryType`, `dictamen`; eliminar ambiguedades entre label visible, code backend y fallback hardcodeado.
- `Archivos clave`: `src/features/gestion/components/GestionTramiteTab.jsx`, `src/App.jsx`, `src/features/cases/lib/patchCaseWithBackendDetail.js`.
- `Dependencia backend`: `No` si los catalogos ya son correctos; `Parcial` si faltan valores o nombres consistentes.
- `Complejidad`: `Media`.

### 6. Tramitacion incompleta para Reclamo de Tercero - Taller

- `Objetivo`: completar el flujo de Tramitacion para `Reclamo de Tercero - Taller` y evitar que queden campos solo locales sin persistencia.
- `Estado actual`: hay UI dedicada para datos del siniestro, terceros, documentacion y calculos, pero el sync actual a backend guarda solo un bloque resumido.
- `Que existe`: `GestionTramiteTab`, `DocumentacionTab`, calculos de minimos/cotizacion/facturacion y endpoint `updateAuthenticatedCaseThirdParty`.
- `Que hay que cambiar`: definir que campos deben persistirse de verdad y cablearlos; hoy participantes, compania del tercero, documentacion detallada y varias fechas no tienen persistencia real equivalente.
- `Archivos clave`: `src/features/gestion/components/GestionTramiteTab.jsx`, `src/features/gestion/components/DocumentacionTab.jsx`, `src/App.jsx`, `src/lib/api/backend.js`.
- `Dependencia backend`: `Si` (el contrato actual parece insuficiente para toda la UI visible).
- `Complejidad`: `Alta`.

### 7. Agregar linea de presupuesto arriba

- `Objetivo`: permitir insertar nuevas lineas de presupuesto arriba de la lista, no solo al final.
- `Estado actual`: `Agregar linea` hace `push` y siempre agrega al final.
- `Que existe`: alta/eliminacion de lineas, validaciones de completitud y sync de orden visual.
- `Que hay que cambiar`: insertar al inicio o agregar accion explicita `Agregar arriba`; mantener `visualOrder` correcto al sincronizar.
- `Archivos clave`: `src/features/gestion/components/PresupuestoTab.jsx`, `src/App.jsx`.
- `Dependencia backend`: `No`.
- `Complejidad`: `Baja`.

### 8. Preview PDF presupuesto

- `Objetivo`: poder previsualizar el PDF de presupuesto emitido desde la solapa de Presupuesto o desde una accion cercana.
- `Estado actual`: el front ya tiene preview/download generico para documentos, pero Presupuesto solo marca `generated = true`; no hay boton ni enlace a un documento emitido.
- `Que existe`: infraestructura de descarga/previsualizacion de documentos PDF por `blob`.
- `Que hay que cambiar`: agregar CTA de preview, resolver de donde sale el documento de presupuesto y reutilizar el modal/flujo de preview existente.
- `Archivos clave`: `src/features/gestion/components/PresupuestoTab.jsx`, `src/App.jsx`, `src/components/caseDetailBlocks/DocumentsDetailBlock.jsx`.
- `Dependencia backend`: `Si` para emision/lookup del PDF real si hoy no queda como documento asociado.
- `Complejidad`: `Media`.

### 9. Separacion cotizacion / pedidos (parte UI / flujo)

- `Objetivo`: separar mejor la etapa de cotizacion de la etapa de pedidos para que el flujo sea claro y consistente.
- `Estado actual`: en `Reclamo de Tercero` ya hay una separacion parcial (`Planilla de cotizaciones` vs `Gestion de pedidos`), pero no esta unificada con otros flujos ni con el resto de la navegacion.
- `Que existe`: subtabs para tercero, sincronizacion desde Presupuesto y calculos derivados.
- `Que hay que cambiar`: definir limites claros entre cotizar y pedir; alinear labels, CTAs y datos que arrastran entre subtabs; revisar si la separacion debe aplicarse tambien en otros tipos de tramite.
- `Archivos clave`: `src/features/gestion/components/GestionReparacionTab.jsx`, `src/features/gestion/components/PresupuestoTab.jsx`.
- `Dependencia backend`: `No` para la separacion visual; `Parcial` si despues se quiere persistencia separada de cotizaciones/proveedores/pedidos.
- `Complejidad`: `Media`.

---

## Cambios con backend pendiente

### Backend pendiente claro

- `Asociar franquicia con Todo Riesgo`
  - Falta persistencia/hydration real del bloque `franchiseRecovery`.
  - Hoy hay lectura (`GET`) pero no un sync equivalente en frontend para guardar asociacion y recupero.

- `Tramitacion incompleta para Reclamo de Tercero - Taller`
  - El endpoint actual de terceros parece guardar un resumen, no toda la informacion visible en UI.
  - Antes de cerrar el front conviene definir contrato para participantes, fechas, documentacion y compania del tercero.

- `Preview PDF presupuesto`
  - Falta definir si el PDF se genera via endpoint dedicado o si aparece como documento de carpeta.
  - El front ya tiene preview generico, pero necesita una fuente real del archivo.

### Backend a confirmar / ajustar si hiciera falta

- `Reclamo Abogado creado como comun`
  - Si backend no devuelve `caseTypeName`/`caseTypeCode` distinguible, el front no puede inferir bien el flujo.
  - Si ese dato ya existe, es correccion frontend.

- `Separacion cotizacion / pedidos`
  - Solo requiere backend si se quiere persistir cotizaciones por proveedor o estados de pedido como entidades separadas.
  - Si es solo UX/flujo, puede salir en frontend primero.

- `Tipo / uso de vehiculo`
  - Si backend ya maneja `vehicleTypeCode` y `usageCode`, es cableado frontend.
  - Si no hay catalogos/codigos oficiales, hay que acordarlos.

---

## Orden sugerido

1. `Tipo / uso de vehiculo` + `Dropdowns franquicia / recupero`
   - Son cambios de base; conviene cerrar primero mapeos y roundtrip para no propagar estados inconsistentes.

2. `Reclamo Abogado creado como comun`
   - Impacta alta, routing y clasificacion; cuanto antes se resuelva, menos ruido mete en QA.

3. `Agenda bloqueada por cotizacion acordada`
   - Ajuste puntual de flujo; bueno para destrabar pruebas operativas.

4. `Agregar linea de presupuesto arriba`
   - Cambio chico, aislado y de bajo riesgo.

5. `Separacion cotizacion / pedidos`
   - Ordena UX y flujo antes de tocar preview o contratos mas grandes.

6. `Preview PDF presupuesto`
   - Hacerlo cuando ya este claro donde vive el documento emitido.

7. `Asociar franquicia con Todo Riesgo`
   - Depende de contrato/sync real; mejor tomarlo con backend alineado.

8. `Tramitacion incompleta para Reclamo de Tercero - Taller`
   - Es el bloque mas grande y con mas superficie de contrato; dejarlo para un tramo dedicado.

### Paralelizacion sugerida para 2 devs

- `Dev A`:
  - Tipo/uso vehiculo
  - Dropdowns franquicia/recupero
  - Agregar linea de presupuesto arriba
  - Agenda bloqueada por cotizacion acordada

- `Dev B`:
  - Reclamo Abogado creado como comun
  - Separacion cotizacion/pedidos
  - Preview PDF presupuesto
  - Preparacion del frente para franquicia / tercero-taller mientras se define backend

---

## Riesgos de integracion

- La app mezcla estado local rico con persistencia parcial; hay campos visibles que hoy no sobreviven a recarga.
- Varias reglas de negocio viven en `computed` local; si backend calcula distinto, aparecen bloqueos o estados inconsistentes.
- La clasificacion del tipo de tramite depende en parte de heuristicas sobre strings devueltos por backend.
- Los catalogos de seguros/franquicia pueden romper guardado si label y code no hacen roundtrip limpio.
- El bloque `franchiseRecovery` hoy esta desalineado: se lee aparte, no se hidrata al draft y tampoco se sincroniza.
- `Reclamo de Tercero - Taller` y `Abogado` muestran mas UI de la que hoy realmente se persiste; eso puede generar falsa sensacion de funcionalidad completa.
