# Backlog ejecutado - seguridad y contratos base

## Objetivo del bloque

Cerrar seguridad real JWT + refresh, mantener compatibilidad de tests, y ordenar el contrato de listados de casos para la siguiente etapa.

## Backlog priorizado (10 tareas)

1. [x] Definir backlog tecnico priorizado para seguridad y contratos.
2. [x] Incorporar librerias JWT en el backend.
3. [x] Agregar configuracion JWT (`secret`, expiracion access y refresh).
4. [x] Implementar servicio de JWT (firma y validacion).
5. [x] Implementar persistencia de refresh tokens y rotacion.
6. [x] Crear migracion Flyway `V7` para `auth_refresh_tokens`.
7. [x] Reescribir `/api/v1/auth/login|refresh|logout|me` con flujo real.
8. [x] Integrar `JwtAuthenticationFilter` en `SecurityConfig`.
9. [x] Mantener `X-User-Id` solo para perfil `test` (compatibilidad de tests existentes).
10. [x] Ajustar contrato de listado de casos con `page`, `size`, `organizationId`, `branchId`.

## Tests y verificacion

- [x] Mantener test suite existente en verde.
- [x] Agregar tests de integracion para auth JWT (`AuthIntegrationTest`).

## Resultado del bloque

- Seguridad base ya no depende de tokens mock.
- Refresh token persiste hash y rota en cada refresh.
- `me` valida autenticacion real desde Bearer token.
- Listado de casos ya acepta paginacion/filtros basicos sin romper compatibilidad.
