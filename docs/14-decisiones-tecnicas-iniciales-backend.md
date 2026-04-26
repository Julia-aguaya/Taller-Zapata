# Decisiones tecnicas iniciales del backend

## Objetivo

Dejar cerradas las decisiones tecnicas de la seccion 4 del checklist para que el backend arranque con una base coherente y sin deriva temprana.

## Decisiones cerradas

### Stack principal

- lenguaje: `Java 21`
- framework: `Spring Boot 3`
- base de datos: `MySQL 8`
- migraciones: `Flyway`
- persistencia: `Spring Data JPA`
- seguridad: `Spring Security`
- contratos API: `springdoc-openapi`
- observabilidad minima: `Actuator`
- testing: `Spring Boot Test` + `Testcontainers`

### Build tool

- se elige `Maven`

Motivo:

- encaja bien con Spring Boot
- reduce friccion inicial del bootstrap
- es suficiente para esta etapa sin meter complejidad extra

### Package root

- `com.tallerzapata.backend`

Motivo:

- deja claro contexto de dominio y tipo de aplicacion
- separa el backend nuevo del frontend actual del repo

### Version inicial de API

- base path: `/api/v1`

Motivo:

- permite evolucion futura sin romper contratos temprano
- deja el versionado explicito desde el arranque

### Estrategia de autenticacion

- objetivo: `JWT + refresh token`
- estado actual: bootstrap inicial preparado, implementacion real pendiente

Motivo:

- se alinea con API stateless
- evita acoplar sesion de servidor desde el dia 1
- permite scoping y autorizacion por claims o contexto cargado

### Estrategia documental para desarrollo

- modo inicial: `local`
- path inicial: `./var/storage`

Motivo:

- es la opcion mas simple para arrancar
- deja abierta la evolucion a storage remoto despues

### Convencion de errores de API

Se define `ApiErrorResponse` con:

- `timestamp`
- `status`
- `error`
- `message`
- `path`
- `details`

Motivo:

- uniforma respuestas de validacion, permisos y errores inesperados
- evita contratos ad hoc por controlador

### Convencion de observabilidad y correlacion

- header de correlacion: `X-Trace-Id`
- clave de MDC: `traceId`
- se devuelve el mismo header en la respuesta

Motivo:

- permite rastrear requests de frontend a backend
- mejora debugging antes de tener stack completo de observabilidad

### CORS inicial

- origen permitido inicial: `http://localhost:5173`

Motivo:

- coincide con el frontend actual en Vite
- evita abrir CORS de forma indiscriminada en el arranque

## Decisiones pendientes

- cerrar implementacion real de JWT
- definir expiracion final de access token y refresh token
- definir proveedor real de secrets por ambiente
- decidir si el storage productivo sera S3 compatible o filesystem de red
- definir formato final de logs estructurados si mas adelante se exportan a observabilidad central

## Archivos impactados por estas decisiones

- `backend/pom.xml`
- `backend/src/main/resources/application.yml`
- `backend/src/main/java/com/tallerzapata/backend/infrastructure/config/WebConfig.java`
- `backend/src/main/java/com/tallerzapata/backend/infrastructure/observability/TraceIdFilter.java`
- `backend/src/main/java/com/tallerzapata/backend/api/common/ApiErrorResponse.java`
