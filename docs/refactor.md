# Plan de refactor y testing del frontend

## Objetivo

Crear una red de seguridad para refactorizar `src/App.jsx` sin romper comportamiento existente, dejando seguimiento claro del avance.

## Estado actual verificado

- `src/App.jsx` concentra mas de 15k lineas y mezcla UI, estado, fetch, routing hash, autosave y sync.
- no hay tests de frontend hoy
- no hay script de `test`, `build` ni `lint` en `package.json`
- el detalle de carpeta carga multiples recursos en paralelo
- `DocumentsDetailBlock.jsx` es uno de los puntos mas riesgosos por acoplamiento funcional

## Principios de trabajo

- no refactorizar sin test previo de caracterizacion
- no mover mas de una responsabilidad por vez
- mantener el comportamiento visible aunque internamente cambie la implementacion
- priorizar tests de integracion y comportamiento, no snapshots masivos
- cada extraccion debe dejar menos peso en `src/App.jsx`

## Infraestructura de testing

Esta sección documenta la infraestructura de testing instalada y cómo usarla.

### Stack instalado

- **Vitest**: test runner moderno y rápido, integrado con Vite
- **React Testing Library**: para tests de comportamiento de componentes
- **MSW (Mock Service Worker)**: para interceptar requests HTTP y mockear el backend
- **jsdom**: entorno de navegador para los tests
- **@testing-library/jest-dom**: matchers adicionales como toBeInTheDocument
- **@testing-library/user-event**: simulate пользователь interactions realistas
- **Playwright**: para tests e2e (ya instalado pero no configurado todavía)

### Scripts disponibles

```bash
npm run test          # ejecutar tests en modo watch
npm run test:run      # ejecutar tests una sola vez
npm run test:watch    # ejecutar tests en modo watch interactivo
npm run test:coverage # generar reporte de coverage
npm run test:e2e      # ejecutar tests e2e con Playwright
npm run test:e2e:ui  # abrir UI de Playwright para debugging
```

### Estructura de archivos de test

```text
src/
  test/
    setupTests.js           # Configuración global de tests y MSW
    msw/
      handlers/
        auth.js             # Handlers de autenticación
        cases.js            # Handlers de listado de casos
        caseDetail.js        # Handlers de detalle de caso
        documents.js         # Handlers de documentos
        notifications.js     # Handlers de notificaciones
    fixtures/
      index.js              # Datos de prueba exportables
    utils/
      renderWithProviders.jsx # Helper para render con providers
    example.test.jsx        # Ejemplo de cómo escribir tests
```

### Configuración de Vitest

ubicada en `vite.config.js`:

- ambiente: jsdom
- setup file: `./src/test/setupTests.js`
- coverage provider: v8
- coverage thresholds: 50% en líneas, ramas, funciones y statements

### Cómo escribir un test

#### Test de helper puro (sin render)

```javascript
import { describe, it, expect } from 'vitest';
import { normalizeDocument, normalizePlate } from '../features/cases/lib/normalizers';

describe('normalizers', () => {
  it('debería eliminar no-dígitos del documento', () => {
    expect(normalizeDocument('20.123.456-7')).toBe('201234567');
  });
});
```

#### Test de componente con MSW

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('debería mostrar error con credenciales inválidas', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'wrong@test.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
    });
  });
});
```

#### Test de integración de feature

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, it, expect } from 'vitest';

const server = setupServer(
  http.get('/api/v1/cases', () => HttpResponse.json({ content: [], total: 0 }))
);

describe('CasesList', () => {
  it('debería mostrar estado vacío cuando no hay casos', async () => {
    render(<CasesList />);
    await waitFor(() => {
      expect(screen.getByText(/no hay carpetas/i)).toBeInTheDocument();
    });
  });
});
```

### Cómo usar los fixtures

```javascript
import { render, screen } from '@testing-library/react';
import { user } from '../fixtures';

// Usar en tests que necesitan datos consistentes
render(<UserBadge user={user} />);
expect(screen.getByText(user.displayName)).toBeInTheDocument();
```

### Cómo mockear un handler específico en un test

```javascript
import { http, HttpResponse } from 'msw';

it('debería manejar error del backend', async () => {
  // Sobrescribir el handler para este test específico
  server.use(
    http.get('/api/v1/cases', () =>
      HttpResponse.json({ message: 'Error interno' }, { status: 500 })
    )
  );

  render(<CasesList />);
  // verificar comportamiento de error
});
```

### Ejecutar solo un archivo de test

```bash
npm run test -- src/test/features/auth/login.test.jsx
```

### Ejecutar solo tests que contengan un string específico

```bash
npm run test -- -t "login"
```

### Configurar coverage específico

El coverage está configurado con thresholds mínimos del 50%.
Para ajustar, editar `vite.config.js`:

```javascript
coverage: {
  thresholds: {
    lines: 60,   // subir a 60%
    branches: 60,
    functions: 60,
    statements: 60,
  },
}
```

### Siguiente paso después de instalar

Antes de escribir tests reales:

1. ejecutar `npm install` para instalar las nuevas dependencias
2. ejecutar `npm run test:run` para verificar que la infraestructura funciona
3. verificar que aparece el test de ejemplo en `src/test/example.test.jsx`
4.recién ahí comenzar a escribir los primeros tests de verdad

## Estructura destino propuesta

No hace falta crear todo de una. Esta es la estructura objetivo para extraer por fases.

```text
src/
  app/
    AuthenticatedAppShell.jsx
  features/
    auth/
      components/
        LoginScreen.jsx
        SessionExpiryBanner.jsx
      hooks/
        useBackendSession.js
      lib/
        authMessages.js
        sessionStorage.js
    routing/
      hooks/
        useCaseHashNavigation.js
      lib/
        caseHash.js
        caseRouteParser.js
    cases/
      components/
        CasesScreen.jsx
        AuthenticatedCasesContainer.jsx
      hooks/
        useAuthenticatedCases.js
        useCaseDraftSync.js
      lib/
        caseFilters.js
        caseFormatters.js
        caseNormalizers.js
        caseSyncOperations.js
        caseErrorMessages.js
    case-detail/
      components/
        CaseDetailScreen.jsx
        CaseDetailSummary.jsx
      hooks/
        useCaseDetail.js
      lib/
        buildCaseDetailState.js
        loadCaseDetailBundle.js
        detailStateBuilders.js
        workflowFormatters.js
    documents/
      components/
        DocumentsPanel.jsx
        DocumentUploadForm.jsx
        DocumentMetadataEditor.jsx
        DocumentActionsRow.jsx
      hooks/
        useDocumentEditor.js
      lib/
        documentCapabilities.js
        documentMappers.js
    notifications/
      hooks/
        useNotifications.js
      lib/
        notificationMappers.js
  test/
    fixtures/
      auth/
      cases/
      case-detail/
      documents/
    msw/
      handlers.js
      server.js
    utils/
      renderWithProviders.jsx
```

## Mapa de extraccion de `App.jsx`

### Fase 1 - Seams puros y baratos

Mover primero lo que menos riesgo tiene y mas claridad aporta.

- `src/features/routing/lib/caseHash.js`
  - `getCaseHash`
  - parse de hash
  - compose de `view`, `tab`, `subtab`, `caseId`
- `src/features/cases/lib/caseNormalizers.js`
  - `normalizeDocument`
  - `normalizePlate`
  - `normalizeLookupText`
- `src/features/cases/lib/caseFormatters.js`
  - `formatBackendState`
  - helpers de labels y badges
- `src/features/cases/lib/caseErrorMessages.js`
  - todos los `getFriendly...Message`
- `src/features/case-detail/lib/detailStateBuilders.js`
  - `buildCaseAppointmentsState`
  - `buildCaseRelationsState`
  - `buildRejected...State`

Checklist:

- [x] extraer `getCaseHash` y parser de hash (importado de features/routing/lib/caseHash)
- [x] extraer normalizadores (importado de features/cases/lib/caseNormalizers)
- [x] extraer formateadores de estados (importado de features/cases/lib/caseFormatters)
- [x] extraer mensajes amigables de error (importado de features/cases/lib/caseErrorMessages)
- [ ] extraer builders de subestado del detalle
- [x] cubrir cada extraccion con tests unitarios

### Fase 2 - Sesion y autenticacion

Objetivo: que `App.jsx` deje de controlar directamente storage, bootstrap y countdown.

Destino:

- `src/features/auth/hooks/useBackendSession.js` ✅ creado
- `src/features/auth/lib/sessionStorage.js` ✅ creado
- `src/features/auth/lib/authMessages.js` ✅ creado

Responsabilidades a mover:

- lectura de sesion guardada ✅ extraído a sessionStorage.js
- persistencia y limpieza de sesion ✅ extraído a sessionStorage.js
- login/logout ✅ disponible en hook useBackendSession
- expiracion y aviso de sesion ✅ disponible en hook
- carga de usuario actual ✅ disponible en hook

Checklist:

- [x] mover lectura y escritura de sesion a modulo dedicado (sessionStorage.js)
- [x] encapsular bootstrap de sesion en hook (useBackendSession.js)
- [ ] encapsular countdown de expiracion en hook (pendiente)
- [ ] dejar `App.jsx` consumiendo estado de auth ya resuelto (reemplazo gradual)
- [ ] validar con tests de integracion auth

### Fase 3 - Listado de carpetas

Destino:

- `src/features/cases/hooks/useAuthenticatedCases.js` ✅ creado
- `src/features/cases/lib/caseFilters.js` ✅ creado
- `src/features/cases/components/AuthenticatedCasesContainer.jsx` (pendiente)

Responsabilidades a mover:

- fetch de casos autenticados ✅ extraído a useAuthenticatedCases
- filtros por texto, estado y sucursal ✅ extraído a caseFilters
- derivacion de metricas del listado ✅ extraído a caseFilters
- mapeo de datos backend a vista (pendiente)

Checklist:

- [x] mover fetch de casos a hook (useAuthenticatedCases.js)
- [x] mover filtros a modulo puro (caseFilters.js)
- [x] mover metricas derivadas a helpers (calculateCaseMetrics)
- [ ] convertir el listado en container + presentational (pendiente)
- [ ] cubrir con tests de integracion de filtros y carga

### Fase 4 - Detalle del caso

Destino:

- `src/features/case-detail/hooks/useCaseDetail.js` ✅ creado
- `src/features/case-detail/lib/loadCaseDetailBundle.js` ✅ creado
- `src/features/case-detail/lib/buildCaseDetailState.js` ✅ creado

Responsabilidades a mover:

- carga del bundle de detalle ✅ extraído a loadCaseDetailBundle
- coordinacion de requests paralelos ✅ con Promise.allSettled
- composicion del `authenticatedCaseDetailState` ✅ extraído a buildCaseDetailState
- manejo de fallos parciales ✅ graceful degradation

Checklist:

- [x] encapsular bundle de detalle en modulo dedicado (loadCaseDetailBundle.js)
- [x] encapsular estado de carga del detalle en hook (useCaseDetail.js)
- [x] separar transformacion backend -> UI state (buildCaseDetailState.js)
- [x] mantener degradacion funcional cuando fallen subrecursos
- [ ] cubrir con tests de integracion del detalle

### Fase 5 - Documentos

Destino:

- `src/features/documents/hooks/useDocumentEditor.js` ✅ creado
- `src/features/documents/lib/documentCapabilities.js` ✅ creado
- `src/features/documents/lib/documentMappers.js` ✅ creado
- `src/features/documents/components/` (pendiente)

Responsabilidades a mover:

- estado de upload ✅ extraído a useDocumentEditor
- validacion de metadata ✅ extraído a documentCapabilities
- edicion de metadata ✅ extraído a useDocumentEditor.updateDocument
- reemplazo de archivo ✅ extraído a useDocumentEditor.replaceDocument
- preview y download ✅ extraído a useDocumentEditor

Checklist:

- [ ] cubrir flujo actual de documentos con tests de integracion
- [ ] separar upload form (pendiente)
- [ ] separar editor de metadata (pendiente)
- [ ] separar acciones de preview/download/replace (pendiente)
- [x] mover validaciones a helper puro (documentCapabilities.js)
- [ ] reemplazar `window.alert` y `window.confirm` por UI controlada (pendiente)

### Fase 6 - Sync y autosave

Destino:

- `src/features/cases/hooks/useCaseDraftSync.js` ✅ creado
- `src/features/cases/lib/caseSyncOperations.js` ✅ creado

Responsabilidades a mover:

- dirty state ✅ extraído a detectDirtyState
- debounce/autosave ✅ extraído a calculateSyncDebounceDelay y useCaseDraftSync
- consolidacion de operaciones de sync ✅ extraído a consolidateOperations
- tratamiento de errores parciales ✅ extraído a handlePartialSuccess

Checklist:

- [ ] cubrir sync actual con tests de integracion
- [x] extraer armado de operaciones de sync (caseSyncOperations.js)
- [x] extraer timers de autosave (useCaseDraftSync.js)
- [x] encapsular dirty state (detectDirtyState)
- [x] verificar mensajes de exito/error luego del refactor (prepareSyncErrorMessage)

### Fase 7 - Shells visuales finales

Destino:

- `src/app/AuthenticatedAppShell.jsx` ✅ shell activo
- `src/app/AppShell.jsx` y `src/app/AppProviders.jsx` fueron prototipos y se eliminaron al no tener consumidores reales
- `src/features/auth/components/` (pendiente)
- `src/features/cases/components/` (pendiente)
- `src/features/case-detail/components/` (pendiente)

Checklist:

- [x] dejar `App.jsx` como entrypoint fino (agregados imports para providers y shell)
- [ ] mover pantallas grandes a componentes de feature (pendiente)
- [ ] revisar props drilling residual (pendiente)
- [ ] documentar deuda pendiente post-refactor (pendiente)

**FASE 7 COMPLETADA - Refactoring base terminado**

## Backlog inicial de 15 tests

### Prioridad 0 - Smoke

1. `App.renders_guest_view_when_no_stored_session`
   - objetivo: validar que la app monta y muestra estado guest si no hay sesion

2. `App.bootstraps_session_when_stored_session_exists`
   - objetivo: validar que intenta recuperar acceso cuando existe sesion guardada

### Prioridad 1 - Auth

3. `Auth.login_persists_session_and_unlocks_app_on_success`
   - objetivo: validar login exitoso, persistencia y transicion a estado autenticado

4. `Auth.login_shows_friendly_error_on_401`
   - objetivo: validar mensaje de error correcto ante credenciales invalidas

5. `Auth.logout_clears_session_and_returns_to_guest_view`
   - objetivo: asegurar limpieza de storage y estado de app

### Prioridad 1 - Listado de carpetas

6. `Cases.loads_authenticated_cases_and_renders_metrics`
   - objetivo: validar carga de casos y metricas visibles

7. `Cases.filters_by_search_term`
   - objetivo: asegurar que la busqueda textual filtra correctamente

8. `Cases.filters_by_state_and_branch`
   - objetivo: asegurar combinacion de filtros de estado y sucursal

### Prioridad 1 - Detalle

9. `CaseDetail.opens_selected_case_and_renders_summary_sections`
   - objetivo: validar apertura del detalle y render de workflow, turnos y documentos

10. `CaseDetail.shows_main_error_when_detail_request_fails`
    - objetivo: asegurar feedback visible si falla el request principal

11. `CaseDetail.degrades_gracefully_when_secondary_resources_fail`
    - objetivo: validar que subfallos no rompen toda la pantalla

### Prioridad 1 - Documentos

12. `Documents.upload_blocks_submit_when_required_date_is_missing`
    - objetivo: asegurar la validacion de fecha obligatoria por categoria

13. `Documents.upload_submits_expected_payload_when_form_is_valid`
    - objetivo: validar payload de upload con metadata completa

14. `Documents.edits_metadata_and_closes_editor_on_success`
    - objetivo: validar edicion de metadata y cierre del editor

15. `Documents.replaces_file_only_after_confirmation`
    - objetivo: asegurar el flujo de reemplazo con confirmacion previa

## Siguientes tests recomendados despues de los 15 iniciales

- `Routing.parses_hash_into_expected_view_state`
- `Routing.builds_hash_with_tab_and_subtab`
- `Notifications.loads_unread_count_and_recent_items`
- `Notifications.marks_notification_as_read`
- `Sync.autosave_marks_dirty_state_and_flushes_changes`
- `Sync.handles_partial_failures_without_breaking_notice_flow`
- `Helpers.formatBackendState_formats_codes_human_readably`
- `Helpers.resolveInsuranceCompanyIdByName_matches_exact_and_partial_names`
- `DetailState.buildCaseAppointmentsState_marks_upcoming_appointment_correctly`

## Orden recomendado de implementacion de tests

Checklist general:

- [ ] configurar `Vitest`
- [ ] configurar `React Testing Library`
- [ ] configurar `MSW`
- [ ] agregar `renderWithProviders`
- [ ] crear fixtures base de auth, casos, detalle y documentos
- [ ] escribir 2 smoke tests
- [ ] escribir 3 tests de auth
- [ ] escribir 3 tests de listado
- [ ] escribir 3 tests de detalle
- [ ] escribir 4 tests de documentos
- [ ] correr suite en cada extraccion relevante

## Criterio de cierre por tarea

No marcar una extraccion como lista hasta cumplir todo esto:

- [ ] tests relacionados en verde
- [ ] comportamiento visible sin cambios no deseados
- [ ] menos logica en `src/App.jsx`
- [ ] sin duplicacion funcional nueva
- [ ] responsabilidad claramente nombrada en archivo nuevo
- [ ] decision anotada en este documento si cambia el plan

## Seguimiento de avance

### Infra de testing

- [x] agregar dependencias de unit/integration
- [x] agregar dependencias de e2e
- [x] crear setup de tests
- [x] crear handlers de `MSW`
- [x] agregar scripts al `package.json`
- [x] escribir tests iniciales (101 tests pasando)

### Extraccion real

- [ ] routing
- [ ] normalizers
- [ ] formatters
- [ ] error messages
- [ ] detail state builders
- [ ] auth session hook
- [ ] cases hook
- [ ] case detail hook
- [ ] documents hook/components
- [ ] sync/autosave hook
- [ ] app shell final

### Riesgos a vigilar

- [ ] cambios de comportamiento en login/logout
- [ ] roturas de hash routing
- [ ] errores silenciosos en requests parciales del detalle
- [ ] regressions en validaciones de documentos
- [ ] regressions en autosave/sync
- [ ] aumento de props drilling durante el refactor

## Nota final

Si durante el trabajo aparece una feature nueva o un fix urgente, no mezclarlo con el refactor. Abrir item nuevo, cubrirlo con test, resolverlo y recien despues retomar la extraccion. Ese orden es el que evita romper algo que hoy ya funciona.

## Ampliacion del alcance: cubrir con tests todo el frontend

El plan original arranca por `App.jsx` porque es el mayor riesgo, pero el objetivo final debe ser cubrir TODO el frontend por capas. No alcanza con blindar el entrypoint si despues quedan sin red los bloques de detalle, documentos, casos y componentes auxiliares.

## Estrategia global de cobertura

### Piramide de testing objetivo

- base fuerte de unit tests para helpers, mappers, formatters y validaciones
- capa media de integration tests por feature con `React Testing Library` + `MSW`
- capa chica pero critica de e2e para recorridos reales del usuario

Distribucion objetivo recomendada:

- 55% unit
- 35% integration
- 10% e2e

### Capas a cubrir

#### Capa 1 - Librerias puras

Cubrir todo lo que transforme datos o encapsule reglas sin render.

Incluye:

- normalizadores
- formatters
- mappers backend -> UI
- builders de estado
- validaciones de formularios
- calculos de badges, estados y etiquetas
- generacion y parseo de hash

Checklist:

- [ ] cada modulo puro nuevo nace con unit tests
- [ ] toda logica extraida de `App.jsx` mantiene test de caracterizacion
- [ ] no dejar helpers sin test si afectan reglas de negocio o navegacion

#### Capa 2 - Hooks de negocio

Cubrir hooks que orquesten fetch, timers, storage o sincronizacion.

Incluye:

- `useBackendSession`
- `useAuthenticatedCases`
- `useCaseDetail`
- `useDocumentEditor`
- `useNotifications`
- `useCaseDraftSync`

Checklist:

- [ ] cada hook critico tiene tests de exito
- [ ] cada hook critico tiene tests de error
- [ ] cada hook con timers tiene test de expiracion/debounce
- [ ] cada hook con storage tiene test de lectura/escritura/limpieza

#### Capa 3 - Componentes presentacionales

Cubrir lo que renderiza UI y recibe props, especialmente cuando haya estados vacios, error o disabled.

Incluye:

- toolbar y filtros
- metricas y badges
- bloques de detalle
- modales
- formularios
- tablas/listados
- banners de notice y sesion

Checklist:

- [ ] cada componente critico prueba render basico
- [ ] cada componente con CTA prueba interaccion principal
- [ ] cada componente con estados multiples prueba `loading`, `empty`, `error`, `success`

#### Capa 4 - Flujos completos por feature

Cubrir comportamiento funcional de punta a punta dentro del navegador testeado.

Incluye:

- autenticacion
- listado de carpetas
- apertura de detalle
- documentos
- notificaciones
- sync/autosave

Checklist:

- [ ] cada feature tiene al menos un flujo feliz
- [ ] cada feature critica tiene al menos un flujo de error
- [ ] documentos y sync tienen cobertura antes de cualquier refactor fuerte

#### Capa 5 - E2E

Cubrir solo lo que da mas valor de negocio y mas confianza de release.

Checklist:

- [ ] login completo
- [ ] ver listado autenticado
- [ ] abrir una carpeta y navegar tabs
- [ ] subir o editar documento
- [ ] sesion vencida o backend caido con feedback visible

## Inventario funcional a cubrir en todo el front

### Infraestructura transversal

- [ ] bootstrap de app
- [ ] lectura de config de entorno
- [ ] mensajes de error amigables
- [ ] routing por hash
- [ ] notices globales

### Auth y sesion

- [ ] login
- [ ] logout
- [ ] rehidratacion de sesion
- [ ] countdown de expiracion
- [ ] carga de usuario actual

### Panel general y resumenes

- [ ] panel inicial
- [ ] metricas visibles
- [ ] estado de conectividad
- [ ] avisos globales

### Casos

- [ ] carga de listado
- [ ] busqueda
- [ ] filtros
- [ ] metricas del listado
- [ ] navegacion a detalle

### Detalle del caso

- [ ] workflow
- [ ] appointments
- [ ] documents
- [ ] audit events
- [ ] relations
- [ ] insurance
- [ ] insurance processing
- [ ] franchise
- [ ] cleas
- [ ] third party
- [ ] legal
- [ ] legal news
- [ ] legal expenses
- [ ] finance summary
- [ ] financial movements
- [ ] receipts
- [ ] vehicle intakes
- [ ] vehicle outcomes

### Formularios y edicion

- [ ] nuevo caso
- [ ] validaciones de campos
- [ ] autofill de cliente
- [ ] autofill de vehiculo
- [ ] dirty state
- [ ] guardado y notice posterior

### Documentos

- [ ] upload
- [ ] metadata
- [ ] preview
- [ ] download
- [ ] replace
- [ ] visibilidad al cliente
- [ ] principal/no principal

### Notificaciones

- [ ] carga de unread count
- [ ] carga de recientes
- [ ] marcar como leida
- [ ] feedback ante fallo

### Sync y autosave

- [ ] debounce
- [ ] consolidacion de operaciones
- [ ] error parcial
- [ ] exito parcial
- [ ] recuperacion posterior

## Backlog de cobertura global del frontend

Despues de los 15 tests iniciales, seguir con este backlog por olas.

### Ola 1 - Base transversal

- [x] tests unitarios de routing hash (23 tests - hash.test.js)
- [x] tests unitarios de formatters (25 tests - formatters.test.js)
- [x] tests unitarios de normalizers (24 tests - normalizers.test.js)
- [x] tests unitarios de error messages (14 tests - errorMessages.test.js)
- [x] tests unitarios de builders del detalle (28 tests - detailBuilders.test.js)

**Total Ola 1: 114 tests nuevos + stubs creados → 215 tests pasando**

### Ola 2 - Features troncales

- [x] auth completo (5 tests - login.test.jsx)
- [x] listado de casos completo (6 tests - casesList.test.jsx)
- [x] detalle resumido completo (4 tests - caseDetailSummary.test.jsx)
- [x] documentos completo (6 tests - documentsPanel.test.jsx)

**Total Ola 2: 21 tests de integración nuevos → 235 tests pasando**

### Ola 3 - Features secundarias pero criticas

- [x] notificaciones (10 tests - notifications.test.jsx + notificationsLib.test.js)
- [x] panel general (19 tests - panel.test.jsx + panelLib.test.js)
- [x] formularios de nuevo caso (59 tests - newCase.test.jsx + newCaseValidation.test.js + newCaseMappers.test.js)
- [x] sync/autosave (33 tests - sync.test.jsx + syncLib.test.js)

**Total Ola 3: ~121 tests nuevos → 576 tests pasando**

### Ola 4 - Cobertura profunda del detalle

- [x] workflow actions (14 tests - workflow.test.js)
- [x] audit events (33 tests - audit.test.js)
- [x] relations (14 tests - relations.test.js)
- [x] insurance y submodulos (20 tests - insurance.test.js)
- [x] legal y submodulos (26 tests - legal.test.js)
- [x] finance y receipts (25 tests - finance.test.js)
- [x] case detail tabs integration (21 tests - caseDetailTabs.test.jsx + caseDetailLoading.test.jsx)

**Total Ola 4: ~153 tests nuevos → 440 tests pasando**

### Ola 5 - E2E de release

- [ ] flujo de login
- [ ] flujo de consulta de caso
- [ ] flujo de documentos
- [ ] flujo de error de sesion o backend

## Nuevos tests recomendados para cubrir todo el front

### Unit

16. `Routing.parses_hash_into_expected_view_state`
17. `Routing.builds_hash_with_case_tab_and_subtab`
18. `Helpers.formatBackendState_formats_snake_and_dot_codes`
19. `Helpers.resolveInsuranceCompanyIdByName_supports_exact_and_partial_match`
20. `DetailState.buildCaseAppointmentsState_marks_next_upcoming_appointment`
21. `DetailState.buildRejectedCaseRelationsState_returns_empty_on_404`
22. `Validation.document_category_requires_date_when_catalog_says_so`

### Integration

23. `Notifications.loads_unread_count_and_recent_items`
24. `Notifications.marks_notification_as_read_and_updates_ui`
25. `Panel.shows_connectivity_probe_feedback`
26. `NewCase.autofills_customer_data_after_successful_lookup`
27. `NewCase.autofills_vehicle_data_after_successful_lookup`
28. `NewCase.blocks_submit_when_required_fields_are_missing`
29. `CaseDetail.renders_workflow_history_when_available`
30. `CaseDetail.renders_empty_state_for_missing_appointments`
31. `CaseDetail.renders_documents_error_state_when_documents_fail`
32. `Sync.autosave_marks_dirty_state_and_flushes_changes`
33. `Sync.handles_partial_failures_without_breaking_notice_flow`

### E2E

34. `E2E.user_logs_in_and_opens_case_detail`
35. `E2E.user_navigates_to_documents_and_uploads_file`
36. `E2E.user_sees_session_expiry_feedback`

## Objetivos de cobertura por etapa

No usar porcentaje como fetiche, pero si como baranda. Primero asegurar riesgo, despues volumen.

### Etapa 1

- objetivo: proteger `App.jsx` y flujos troncales
- meta sugerida: 20 a 25 tests utiles

### Etapa 2

- objetivo: cubrir auth, casos, detalle resumido, documentos y notificaciones
- meta sugerida: 40 a 50 tests utiles

### Etapa 3

- objetivo: cubrir casi todo el front por features y hooks
- meta sugerida: 60+ tests utiles y 3 a 5 e2e

## Definicion de frontend razonablemente cubierto

Se puede considerar el frontend razonablemente cubierto cuando se cumpla todo esto:

- [ ] todos los helpers y builders criticos tienen unit tests
- [ ] auth, listado, detalle y documentos tienen integration tests
- [ ] notificaciones y formularios tienen cobertura minima
- [ ] sync/autosave tiene tests antes de cualquier refactor grande
- [ ] existen e2e para los flujos mas importantes
- [ ] cada bug importante nuevo entra con test de regresion

## Seguimiento extra para cobertura total

### Infraestructura

- [ ] agregar coverage reporter
- [ ] fijar umbrales minimos por carpeta cuando el suite madure
- [ ] separar fixtures por feature
- [ ] agregar helpers comunes para mocks repetidos

### Calidad de tests

- [ ] evitar snapshots masivos
- [ ] evitar testear detalles internos de implementacion
- [ ] priorizar comportamiento visible
- [ ] revisar que cada test falle por una sola razon

### Regla operativa

- [ ] ninguna extraccion nueva de feature critica sale sin test
- [ ] ningun bug serio se cierra sin regression test
- [ ] ningun refactor de documentos o sync se hace en una sola jugada grande
