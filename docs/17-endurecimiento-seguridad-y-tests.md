# Endurecimiento de seguridad y tests del core

## Objetivo

Registrar el avance sobre el endurecimiento del core de `casos` y `workflow` en dos frentes:

- seguridad real de acceso y transición
- tests base del núcleo ya implementado

## Seguridad aplicada

### Autenticación base para entorno actual

- se implementó autenticación por header `X-User-Id`
- el filtro carga usuario activo desde `usuarios`
- se resuelven permisos efectivos a partir de `usuario_roles`, `rol_permisos` y `permisos`
- el principal autenticado vive en `SecurityContext`

Archivos:

- `backend/src/main/java/com/tallerzapata/backend/infrastructure/security/HeaderAuthenticationFilter.java`
- `backend/src/main/java/com/tallerzapata/backend/infrastructure/security/AuthenticatedUser.java`
- `backend/src/main/java/com/tallerzapata/backend/infrastructure/security/CurrentUserService.java`

### Autorización de casos y workflow

- se creó `CaseAccessControlService`
- se valida permiso funcional requerido
- se valida scope por organizacion y sucursal
- `cases` requiere `caso.ver` o `caso.crear` segun operacion
- `workflow` requiere `workflow.transicionar`

Archivos:

- `backend/src/main/java/com/tallerzapata/backend/application/security/CaseAccessControlService.java`
- `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseService.java`
- `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseWorkflowService.java`

## Tests agregados

### Unit tests

- `CaseFolderCodeGeneratorTest`
- `PersonDocumentNormalizerTest`
- `VehiclePlateNormalizerTest`

### Integration test inicial

- `CaseSecurityIntegrationTest`

Cobertura actual:

- rechazo de acceso a `/api/v1/cases` sin autenticación
- acceso permitido con `X-User-Id: 1`

## Limitaciones actuales

- no se verificó ejecución real de tests en esta sesión
- todavía falta testear creación de caso, historial y transiciones en integración
- la autenticación actual es una base de endurecimiento para entorno de desarrollo, no JWT final

## Siguiente mejora recomendada

- migrar esta autenticación base hacia JWT real sin perder `CaseAccessControlService`
- sumar integration tests de creación de caso y transición de workflow
- enriquecer respuestas `403` con más contexto si hiciera falta
