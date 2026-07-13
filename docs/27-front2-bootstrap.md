# front2 bootstrap inicial

Fecha: 2026-06-28

## Objetivo

Levantar una base limpia en `front2/` para empezar el frontend nuevo sobre los endpoints ya preparados en backend:

- `GET /api/v1/auth/session`
- `GET /api/v1/panel/general`
- `GET /api/v1/cases/{caseId}/workspace`

## Estructura inicial

```text
front2/
  src/
    app/
      router.jsx
      shell/
      styles/
    modules/
      auth/
      panel/
    shared/
      api/
      auth/
      lib/
      ui/
```

## Decisiones

- `React + Vite` en carpeta separada para no mezclar el rewrite con el frontend viejo.
- `TanStack Query` para bootstrap y data fetching.
- base `shadcn-style` con Tailwind + `cva` + `tailwind-merge`.
- `session` como fuente del shell.
- `panel/general` como fuente del dashboard.
- `workspace` como bootstrap compuesto de carpeta para evitar waterfalls.

## Primer corte funcional

- login conectado al backend
- shell autenticado
- panel general operativo **ahora en tabla filtrable**
- **vista `Carpetas` con tabla, filtros y búsqueda**
- **navegación `Agenda` y `Gestión` como placeholders**
- primera vista de carpeta consumiendo `workspace`
- tab `PRESUPUESTO` ya editable con guardado real contra backend
- tab `GESTION_REPARACION` ya operable para turno, ingreso y egreso
- tab `PAGOS` ya operable con movimientos financieros reales
- `Nuevo caso` real con alta mínima y redirección a carpeta creada

## Cambio de patrón UI

- panel y carpetas ahora usan `Table` / `TableHeader` / `TableBody` / `TableRow` / `TableHead` / `TableCell` en vez de cards individuales
- primitivas shadcn-style en `front2/src/shared/ui/table.jsx` y `front2/src/shared/ui/select.jsx`
- toda tabla tiene acción `Abrir` que navega a la carpeta

## Navegación ampliada

El backend ahora devuelve 5 items en `auth/session`:
- PANEL, CASES (Carpetas), NEW_CASE, AGENDA, MANAGEMENT

## Hardcodes eliminados

- `Nuevo caso` ya consume backend para:
  - tipos de trámite
  - marcas de vehículo
  - modelos de vehículo
  - tipo de vehículo
  - uso
  - transmisión

- `PRESUPUESTO` ya consume backend para:
  - estado de informe
  - tareas
  - niveles de daño
  - decisiones de repuesto
  - acciones

- `GESTION_REPARACION` ya consume backend para:
  - estados de turno
  - estados de reingreso

## Deuda restante razonable

- edición/update de turnos, ingresos, egresos y pagos ya creados
- validaciones UX más finas para líneas de presupuesto antes del submit

## Pendiente inmediato

- instalar dependencias de `front2`
- implementar vista de carpeta consumiendo `workspace`
- aprovechar `finance/particular-summary` para la solapa de pagos de la carpeta
