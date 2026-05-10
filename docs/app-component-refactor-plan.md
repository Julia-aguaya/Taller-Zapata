# Plan de refactor para dividir `src/App.jsx`

## Diagnostico actual

- `src/App.jsx` tiene ~15.320 lineas y mezcla demasiadas responsabilidades en un solo modulo.
- El componente `App` empieza en `src/App.jsx:11761` y concentra estado global, autenticacion, lectura/escritura contra backend, navegacion, sincronizacion de casos, helpers de exportacion y render de vistas.
- El mismo archivo tambien declara componentes de UI grandes como `PanelGeneral`, `NuevoCaso`, `GestionView`, `AgendaView` y varias previews (`src/App.jsx:7120`, `src/App.jsx:7188`, `src/App.jsx:11091`, `src/App.jsx:11350`).
- Hay mucho codigo de infraestructura mezclado con presentacion: por ejemplo `openAuthenticatedCaseDetail` (`src/App.jsx:12973`), `syncSelectedCaseToBackend` (`src/App.jsx:14053`), `saveCaseDocument` (`src/App.jsx:14653`) y `createCase` (`src/App.jsx:14785`).
- Tambien hay una cantidad grande de constantes de dominio y factories locales al principio del archivo que dificultan leer el flujo principal.

## Objetivo del refactor

Separar `App.jsx` en capas chicas y con responsabilidades claras para que:

- `App` quede como orquestador de alto nivel.
- la UI viva en componentes/paginas enfocados.
- la logica de backend y sincronizacion salga de la capa visual.
- el estado complejo quede agrupado en hooks y reducers por feature.
- cada parte se pueda testear y modificar sin romper todo lo demas.

## Criterio de division recomendado

### 1. Shell de aplicacion

Mover la estructura general de layout y navegacion a:

- `src/app/shell/AppLayout.jsx`
- `src/app/shell/AppSidebar.jsx`
- `src/app/shell/AppTopbar.jsx`
- `src/app/shell/AppNotices.jsx`

Responsabilidad:

- sidebar
- topbar
- aviso flotante
- banner de sesion vencida
- modal bloqueante de documentacion

`App.jsx` solo deberia decidir que vista renderizar y pasar callbacks.

### 2. Paginas por vista principal

Crear una carpeta como `src/pages/` o `src/features/*/pages/` con estas pantallas:

- `src/pages/PanelPage.jsx`
- `src/pages/CasesPage.jsx`
- `src/pages/NewCasePage.jsx`
- `src/pages/AgendaPage.jsx`
- `src/pages/CaseManagementPage.jsx`
- `src/pages/AuthPage.jsx`

Mapeo sugerido:

- login actual: `src/App.jsx:15057`
- panel: `src/App.jsx:15204`
- carpetas: `src/App.jsx:15251`
- agenda: `src/App.jsx:15272`
- nuevo caso: `src/App.jsx:15280`
- gestion: `src/App.jsx:15296`

### 3. Hooks de estado global

Hoy `App` tiene demasiados `useState` y `useEffect` juntos (`src/App.jsx:11774-12129` y mas abajo). Eso pide hooks dedicados.

Separacion recomendada:

- `src/features/auth/hooks/useAppSession.js`
  - bootstrap de sesion guardada
  - login/logout
  - expiracion de sesion
  - `readWithStoredToken`
- `src/features/cases/hooks/useCasesWorkspace.js`
  - `cases`, `selectedCaseId`, `activeTab`, `activeRepairTab`, `dirtyTabs`, `hasUnsavedChanges`
  - `openCase`, `updateSelectedCase`, sync con hash
- `src/features/dashboard/hooks/useDashboardData.js`
  - refresh de panel, notificaciones, catalogos y previews
- `src/features/new-case/hooks/useNewCaseForm.js`
  - `newCaseForm`, validacion, autofill de cliente/vehiculo, `createCase`
- `src/features/documents/hooks/useCaseDocumentsActions.js`
  - guardar, descargar y preview de documentos

Si queres hacerlo BIEN de verdad, varios de estos hooks deberian usar `useReducer` en lugar de seguir agregando `useState` sueltos.

### 4. Servicios de backend por feature

El problema de fondo no es solo el tamano del componente: es que la UI habla directo con demasiadas operaciones del backend.

Mover a servicios/casos de uso:

- `src/features/auth/services/authService.js`
- `src/features/cases/services/caseDetailService.js`
- `src/features/cases/services/caseSyncService.js`
- `src/features/notifications/services/notificationsService.js`
- `src/features/catalogs/services/catalogsService.js`
- `src/features/documents/services/documentsService.js`

Ejemplos a extraer primero:

- `runCurrentUserRead`
- `runAuthenticatedCasesRead`
- `runAuthenticatedNotificationsRead`
- `openAuthenticatedCaseDetail`
- `syncSelectedCaseToBackend`
- `markNotificationAsRead`

La regla arquitectonica deberia ser simple: componente renderiza, hook coordina, servicio llama APIs.

### 5. Builders y adapters de estado

Hay muchos builders repetitivos de estado remoto en el mismo archivo: `buildCaseRelationsState`, `buildCaseInsuranceState`, `buildCaseLegalNewsState`, etc.

Moverlos a una carpeta como:

- `src/features/case-detail/lib/stateBuilders/`

Separacion sugerida:

- `detailCoreState.js`
- `insuranceStateBuilders.js`
- `legalStateBuilders.js`
- `financeStateBuilders.js`
- `timelineStateBuilders.js`

Esto baja ruido brutal en `App.jsx` y permite probar cada mapper por separado.

### 6. Constantes y factories de dominio

Las constantes grandes y factories del principio del archivo tienen que salir YA de `App.jsx`.

Mover a:

- `src/features/cases/constants/caseOptions.js`
- `src/features/cases/constants/workshops.js`
- `src/features/cases/factories/caseFactories.js`
- `src/features/budget/factories/budgetFactories.js`
- `src/features/repair/factories/repairFactories.js`

Incluye cosas como:

- `NAV_ITEMS`
- `BRANCHES`
- listas de opciones del dominio
- `createEmptyForm`
- `createBudgetDefaults`
- `createRepairPart`
- `createSettlement`

### 7. Componentes gigantes que todavia viven en `App.jsx`

Estos deberian ser prioridad alta para mover a archivos propios:

- `PanelGeneral` (`src/App.jsx:7120`)
- `NuevoCaso` (`src/App.jsx:7188`)
- `FichaTecnicaTab` (`src/App.jsx:7310`)
- `GestionTramiteTab` (`src/App.jsx:7526`)
- `DocumentacionTab` (`src/App.jsx:8369`)
- `PresupuestoTab` (`src/App.jsx:8454`)
- `GestionReparacionTab` (`src/App.jsx:9019`)
- `PagosTab` (`src/App.jsx:9901`)
- `AbogadoTab` (`src/App.jsx:10743`)
- `AgendaView` (`src/App.jsx:11091`)
- `GestionView` (`src/App.jsx:11350`)

Propuesta de ubicacion:

- `src/features/panel/components/PanelGeneral.jsx`
- `src/features/new-case/components/NuevoCaso.jsx`
- `src/features/case-management/components/tabs/*.jsx`
- `src/features/agenda/components/AgendaView.jsx`
- `src/features/case-management/components/GestionView.jsx`

## Orden de ejecucion recomendado

### Fase 1 - Bajar riesgo sin tocar comportamiento

1. Mover constantes y factories.
2. Mover componentes visuales chicos (`StatusBadge`, `DataField`, `SelectField`, etc.).
3. Mover vistas grandes ya declaradas en el archivo a archivos separados, sin cambiar props.

Resultado esperado:

- mismo comportamiento
- archivo mas corto
- imports mas claros

### Fase 2 - Sacar logica de negocio del componente

1. Extraer `useAppSession`.
2. Extraer `useCasesWorkspace`.
3. Extraer `useNewCaseForm`.
4. Extraer `useCaseDocumentsActions`.
5. Extraer los readers/refreshers autenticados a servicios o hooks dedicados.

Resultado esperado:

- `App` deja de ser un dios-objeto.
- los efectos quedan agrupados por responsabilidad.

### Fase 3 - Separar sincronizacion y detalle

1. Sacar `openAuthenticatedCaseDetail` a un servicio/hook de case detail.
2. Sacar `syncSelectedCaseToBackend` a `caseSyncService` + helpers por tab.
3. Dividir el sync por dominio:
   - `syncFichaTab`
   - `syncTramiteTab`
   - `syncPresupuestoTab`
   - `syncPagosTab`
   - `syncAbogadoTab`

Resultado esperado:

- menos acoplamiento
- errores por solapa mas faciles de ubicar
- mejor testabilidad

### Fase 4 - Endurecer arquitectura

1. Reemplazar grupos de `useState` por `useReducer` donde haya transiciones complejas.
2. Agregar tests a mappers, builders y servicios.
3. Evaluar un context liviano o provider por workspace si sigue habiendo prop drilling.

## Estructura destino sugerida

```text
src/
  app/
    shell/
      AppLayout.jsx
      AppSidebar.jsx
      AppTopbar.jsx
      AppNotices.jsx
  pages/
    AuthPage.jsx
    PanelPage.jsx
    CasesPage.jsx
    NewCasePage.jsx
    AgendaPage.jsx
    CaseManagementPage.jsx
  features/
    auth/
      hooks/useAppSession.js
      services/authService.js
    cases/
      hooks/useCasesWorkspace.js
      services/caseDetailService.js
      services/caseSyncService.js
      constants/caseOptions.js
      factories/caseFactories.js
    new-case/
      hooks/useNewCaseForm.js
      components/NuevoCaso.jsx
    case-management/
      components/GestionView.jsx
      components/tabs/
        FichaTecnicaTab.jsx
        GestionTramiteTab.jsx
        DocumentacionTab.jsx
        PresupuestoTab.jsx
        GestionReparacionTab.jsx
        PagosTab.jsx
        AbogadoTab.jsx
    documents/
      hooks/useCaseDocumentsActions.js
      services/documentsService.js
    notifications/
      services/notificationsService.js
    catalogs/
      services/catalogsService.js
    agenda/
      components/AgendaView.jsx
    panel/
      components/PanelGeneral.jsx
```

## Riesgos a cuidar

- `openCase` y el sync con `hash` no se pueden romper porque gobiernan navegacion (`src/App.jsx:11972`, `src/App.jsx:14013`).
- `syncSelectedCaseToBackend` tiene reglas de negocio por solapa; moverlo sin tests seria pegarle al tablero con los ojos cerrados.
- el detalle autenticado depende de muchas llamadas paralelas; conviene extraerlo con contrato estable antes de cambiar comportamiento.
- el formulario de alta reutiliza catalogos, busquedas y creacion condicional de persona/vehiculo; no hay que mezclar esa logica con presentacion.

## Primer sprint sugerido

Si queres avanzar sin hacer una locura cosmica de una sola vez, el primer PR deberia hacer SOLO esto:

1. mover `PanelGeneral`, `NuevoCaso`, `AgendaView`, `GestionView` a archivos propios
2. mover `StatusBadge`, `DataField`, `SelectField`, `ToggleField`, `TabButton` a `src/components/ui/`
3. mover constantes/factories a `features/*/constants` y `features/*/factories`
4. dejar `App.jsx` como coordinador de vistas, sin cambiar logica de negocio

Eso ya te baja muchisimo el ruido y reduce el riesgo.

## Definicion de exito

El refactor va bien si al final:

- `App.jsx` queda en menos de 500-800 lineas
- cada feature importante tiene su hook o servicio
- ninguna vista principal vive declarada dentro de `App.jsx`
- los efectos de React estan agrupados por responsabilidad
- la sincronizacion con backend se entiende por tab y no como un bloque monolitico
