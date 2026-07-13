# Contrato backend para `front2`

Fecha: 2026-06-28

## Objetivo

Definir la superficie backend recomendada para `front2`, apoyandonos en lo que ya quedo saneado en `PARTICULAR`:

- alta minima real
- readiness por solapa
- estados visibles alineados
- cierre automatico

La idea no es inventar un backend nuevo, sino ordenar un contrato estable para que el frontend nuevo consuma verdad de dominio y no tenga que adivinar reglas.

## Principios del contrato

### 1. Backend como fuente de verdad

`front2` no debe decidir por su cuenta:

- si una solapa esta completa
- si una accion esta bloqueada
- si un caso puede avanzar
- que badge visible mostrar
- si una carpeta esta cerrada

Todo eso debe venir del backend.

### 2. Un endpoint para bootstrap de sesion

Hoy `GET /api/v1/auth/me` es demasiado pobre para `front2` porque solo devuelve:

- `id`
- `displayName`
- `role`

Eso no alcanza para navegación, permisos, badges ni layout condicional.

### 3. Un endpoint para detalle de caso y otro para readiness

Ya existe una buena base:

- `GET /api/v1/cases/{caseId}`
- `GET /api/v1/cases/{caseId}/readiness`

Eso está BIEN. Lo que falta es completarlo con un contrato consistente para el shell, el panel y la navegación.

## Estado actual reutilizable

### Ya existe y conviene preservar

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/cases`
- `GET /api/v1/cases/{caseId}`
- `GET /api/v1/cases/{caseId}/readiness`
- `GET /api/v1/cases/{caseId}/workflow/actions`
- `GET /api/v1/cases/{caseId}/audit/events`

### Ya existe pero no alcanza solo

- `GET /api/v1/cases/{caseId}/finance-summary`
  - hoy es un resumen financiero generico, util pero insuficiente para la logica particular del frontend

## Contrato recomendado para `front2`

## 1. Session Bootstrap

### Endpoint propuesto

`GET /api/v1/auth/session`

### Problema que resuelve

`front2` necesita arrancar con una sola llamada que diga:

- quien es el usuario
- que puede ver
- en que organizacion/sucursal opera
- que menu mostrar
- a donde mandarlo al entrar

### Respuesta sugerida

```json
{
  "user": {
    "id": "1",
    "displayName": "Admin Bootstrap",
    "role": "ADMIN"
  },
  "authorities": [
    "caso.ver",
    "caso.crear",
    "presupuesto.crear",
    "turno.crear",
    "finanza.crear"
  ],
  "scopes": [
    {
      "organizationId": 1,
      "branchId": 1,
      "branchCode": "Z"
    }
  ],
  "navigation": {
    "defaultRoute": "/panel",
    "items": [
      { "code": "PANEL", "label": "Panel general", "path": "/panel", "enabled": true },
      { "code": "NEW_CASE", "label": "Nuevo caso", "path": "/cases/new", "enabled": true },
      { "code": "MANAGEMENT", "label": "Gestion", "path": "/management", "enabled": true }
    ]
  },
  "capabilities": {
    "canCreateCase": true,
    "canOverrideVisibleStates": true,
    "canForceWorkflowTransition": false,
    "canAccessManagement": true
  }
}
```

### Notas

- `authorities` debe salir de permisos efectivos, no de `role` plano.
- `navigation` debe venir lista para el shell.
- `defaultRoute` hoy deberia ser `/panel`.

## 2. Panel General

### Endpoint propuesto

`GET /api/v1/panel/general`

### Problema que resuelve

El panel no deberia listar casos sin criterio. Debe priorizar urgencias y pendientes del negocio.

### Respuesta sugerida

```json
{
  "generatedAt": "2026-06-28T15:30:00",
  "summary": {
    "openCases": 42,
    "pendingPayments": 8,
    "casesWithoutAppointment": 6,
    "casesNearPrescription": 3,
    "pendingTasks": 11
  },
  "priorityBuckets": [
    {
      "code": "URGENT",
      "label": "Urgentes",
      "items": [
        {
          "caseId": 101,
          "folderCode": "0001PZ",
          "title": "Perez, Juan - Astra - AB123CD",
          "visibleTramiteState": "PASADO_A_PAGOS",
          "visibleRepairState": "REPARADO",
          "priorityReasons": [
            "Pago atrasado",
            "Caso proximo a prescribir"
          ]
        }
      ]
    }
  ]
}
```

### Notas

- Este endpoint todavia no existe.
- Conviene que devuelva casos ya priorizados, no que el frontend ordene heuristicas locales.

## 3. Listado de casos

### Endpoint actual reutilizable

`GET /api/v1/cases`

### Recomendación

Mantenerlo, pero consolidar su payload para `front2` con estos campos como parte estable:

- `id`
- `folderCode`
- `caseTypeCode`
- `principalCustomerName`
- `principalVehiclePlate`
- `visibleTramiteState`
- `visibleRepairState`
- `closedAt`
- `createdAt`
- `createdByDisplayName`

### Mejora recomendada

Agregar en cada item:

- `readinessSummary`
- `priorityReasons`
- `pendingTasksCount`

Ejemplo:

```json
{
  "id": 101,
  "folderCode": "0001PZ",
  "caseTypeCode": "PARTICULAR",
  "principalCustomerName": "Carlos Cliente",
  "principalVehiclePlate": "AB123CD",
  "visibleTramiteState": { "code": "PASADO_A_PAGOS", "label": "Pasado a pagos" },
  "visibleRepairState": { "code": "REPARADO", "label": "Reparado" },
  "readinessSummary": {
    "completedTabs": 3,
    "totalTabs": 4,
    "blockingTabs": ["PAGOS"]
  },
  "priorityReasons": ["Saldo pendiente"],
  "pendingTasksCount": 0
}
```

## 4. Detalle de caso

### Endpoint actual reutilizable

`GET /api/v1/cases/{caseId}`

### Recomendación

Mantenerlo como endpoint de encabezado del caso.

Debe ser el payload base de la vista de carpeta y contener:

- identidad de carpeta
- metadatos de creación
- estados persistidos
- estados visibles
- cierre

### Ejemplo de uso en `front2`

- header de la carpeta
- breadcrumbs
- badges de estado
- acciones globales
- datos mínimos para el shell lateral

## 5. Readiness del caso

### Endpoint actual reutilizable

`GET /api/v1/cases/{caseId}/readiness`

### Estado actual

Hoy ya devuelve:

- `caseId`
- `caseTypeCode`
- `tabs[]`
  - `tabCode`
  - `allowed`
  - `completed`
  - `colorHint`
  - `blockingReasons`
  - `warningReasons`

Eso es una MUY buena base.

### Recomendación

Preservarlo y convertirlo en contrato estable de frontend.

### Mejora sugerida

Agregar opcionalmente:

- `sortOrder`
- `label`
- `completionPercent`
- `nextRecommendedAction`

Ejemplo:

```json
{
  "caseId": 101,
  "caseTypeCode": "PARTICULAR",
  "tabs": [
    {
      "tabCode": "PRESUPUESTO",
      "label": "Presupuesto",
      "allowed": true,
      "completed": false,
      "colorHint": "RED",
      "blockingReasons": ["El presupuesto todavia no fue cerrado"],
      "warningReasons": [],
      "nextRecommendedAction": "Cerrar el presupuesto"
    }
  ]
}
```

## 6. Case Workspace Bootstrap

### Endpoint propuesto

`GET /api/v1/cases/{caseId}/workspace`

### Problema que resuelve

La pantalla de carpeta hoy tendria que hacer varias llamadas:

- detalle de caso
- readiness
- workflow actions
- finance summary
- presupuesto
- turnos/ingresos/egresos

Eso te arma cascadas al pedo.

### Respuesta sugerida

```json
{
  "case": { },
  "readiness": { },
  "workflowActions": { },
  "financeSummary": { },
  "widgets": {
    "budget": {
      "exists": true,
      "reportStatusCode": "CERRADO",
      "totalQuoted": 1210.00
    },
    "repair": {
      "hasAppointment": true,
      "hasIntake": true,
      "hasDefinitiveOutcome": false
    }
  }
}
```

### Vercel best practice aplicada

Esto evita waterfalls en el bootstrap de la pantalla y sigue la lógica de `async-parallel`.

## 7. Finance Summary específico para Particular

### Endpoint actual

`GET /api/v1/cases/{caseId}/finance-summary`

### Problema

Hoy es demasiado genérico. Sirve para finanzas globales, pero no para UX de `PARTICULAR`.

### Endpoint recomendado

`GET /api/v1/cases/{caseId}/finance/particular-summary`

### Respuesta sugerida

```json
{
  "caseId": 101,
  "quotedTotal": 1210.00,
  "customerPaid": 800.00,
  "pendingBalance": 410.00,
  "hasAdvancePayment": true,
  "isPaidInFull": false,
  "paidInFullAt": null
}
```

### Notas

- Esta respuesta debería reutilizar la misma lógica que hoy usa readiness y cierre automático.
- Nada de duplicar reglas en frontend.

## 8. Workflow actions

### Endpoint actual reutilizable

`GET /api/v1/cases/{caseId}/workflow/actions`

### Recomendación

Mantenerlo, pero enriquecerlo con razones de no disponibilidad cuando aplique.

Hoy el sistema devuelve acciones disponibles.
Para `front2` sería mejor poder renderizar:

- acciones habilitadas
- acciones visibles pero bloqueadas
- motivo del bloqueo

Ejemplo:

```json
{
  "domain": "reparacion",
  "actions": [
    {
      "code": "AGENDAR_TURNO",
      "enabled": false,
      "blockedReason": "El presupuesto todavia no fue cerrado"
    }
  ]
}
```

## 9. Toasts, modals y mensajes de negocio

El backend no debe devolver “UI components”, pero sí motivos legibles.

### Regla

Cada bloqueo crítico debería poder expresarse como:

- `code`
- `message`
- `severity`

Hoy readiness devuelve solo strings. Eso sirve para arrancar, pero a futuro conviene migrar a objetos:

```json
{
  "code": "BUDGET_NOT_CLOSED",
  "message": "El presupuesto todavia no fue cerrado",
  "severity": "error"
}
```

Eso le da a `front2` material limpio para:

- toast
- modal
- banner inline
- badge de advertencia

## 10. Nuevo caso

### Endpoint actual reutilizable

`POST /api/v1/cases`

### Recomendación

Mantenerlo como alta mínima real para `PARTICULAR` y, a futuro, tener una estrategia homogénea por trámite.

`front2` debería poder crear una carpeta mínima y luego navegar al workspace del caso.

### Flujo recomendado

1. `POST /api/v1/cases`
2. recibir `id`, `folderCode`, `visible states`, `createdAt`
3. navegar a `/cases/{id}`
4. bootstrappear con `workspace`

## Contrato mínimo recomendado para arrancar `front2`

Si hubiera que definir el mínimo viable serio, sería este:

### Imprescindibles

- `GET /api/v1/auth/session` nuevo
- `GET /api/v1/panel/general` nuevo
- `GET /api/v1/cases`
- `GET /api/v1/cases/{caseId}`
- `GET /api/v1/cases/{caseId}/readiness`
- `GET /api/v1/cases/{caseId}/workflow/actions`
- `POST /api/v1/cases`

### Muy recomendables

- `GET /api/v1/cases/{caseId}/workspace` nuevo
- `GET /api/v1/cases/{caseId}/finance/particular-summary` nuevo

## Roadmap de adopción

### Etapa 1 - Contrato de shell

- agregar `GET /api/v1/auth/session`
- agregar `GET /api/v1/panel/general`

### Etapa 2 - Contrato de carpeta

- preservar `GET /cases/{id}`
- estabilizar `GET /cases/{id}/readiness`
- enriquecer `GET /cases/{id}/workflow/actions`

### Etapa 3 - Bootstrap de vista

- agregar `GET /cases/{id}/workspace`

### Etapa 4 - Finanza particular específica

- agregar `GET /cases/{id}/finance/particular-summary`

## Tradeoffs

### Opción A - muchos endpoints chicos

- mas simple de mantener
- mas REST puro
- mas riesgo de waterfalls en frontend

### Opción B - endpoint `workspace` agregado

- mejor performance de bootstrap
- frontend mas simple
- backend con mas responsabilidad de composición

### Recomendación

Usar ambas:

- endpoints chicos como base canónica
- `workspace` como composición optimizada para pantallas clave

## Conclusión

Ahora que `PARTICULAR` ya tiene readiness, estados visibles alineados y cierre automático, el contrato de `front2` ya no debe girar alrededor de formularios sueltos sino alrededor de estas cuatro piezas:

- `session`
- `panel`
- `case detail`
- `readiness/workspace`

Si el frontend consume eso, deja de adivinar. Y ese es exactamente el objetivo.
