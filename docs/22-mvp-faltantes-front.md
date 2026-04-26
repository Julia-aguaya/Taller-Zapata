# MVP backend - faltantes para destrabar frontend

## Contexto

Este documento enumera los faltantes funcionales del backend para que frontend pueda implementar flujos sin hardcodear reglas de negocio.

## Faltantes priorizados

- [x] Exponer catálogos para formularios de casos (`tipos_tramite`, `roles_caso`, `roles_vehiculo`, `prioridades_caso`).
- [x] Exponer acciones de workflow disponibles por caso/dominio (según estado actual, permisos y regla_json).
- [x] Exponer `CaseResponse` con cache de estados para `pago`, `documentacion` y `legal`.
- [x] Mejorar contrato de paginación de `GET /cases` con metadata (`totalElements`, `totalPages`, `page`, `size`).
- [ ] Agregar búsqueda parcial para personas y vehículos (autocomplete por texto, no solo exact match).

## Criterio MVP equipo

Para habilitar construcción de pantallas sin fricción, frontend debe poder:

1. cargar combos de alta/edición desde backend
2. renderizar botón/acciones de workflow sin reglas hardcodeadas
3. no depender de listas de códigos duplicadas en front

Con los dos primeros puntos cerrados, frontend puede avanzar en auth + casos + workflow core de punta a punta.
