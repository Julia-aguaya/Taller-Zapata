# Taller Zapata Backend - Guía de Onboarding

## Introducción

Este documento es una guía de onboarding completa para el proyecto backend. Te explica desde cero qué es este sistema, cómo está armado, qué tiene implementado y cómo usarlo.

---

## 1. Qué es este backend

Es un backend construido con **Java 21 + Spring Boot 3** que gestiona un sistema de taller/siniestros. El núcleo del negocio gira en torno a **casos** (`casefile`), con módulos relacionados como personas, vehículos, workflow, seguridad e identidad.

### Características principales

- **Arquitectura**: Capas/modular (`api`, `application`, `infrastructure`, `domain`).
- **Base de datos**: MySQL con Flyway para migraciones versionadas.
- **Testing**: Perfil `test` usa H2 en memoria (sin Docker).
- **API**: RESTful con OpenAPI/Swagger y Actuator para observabilidad.

---

## 2. Estructura del proyecto

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/tallerzapata/backend/
│   │   │   ├── api/                    # Controladores REST + DTOs
│   │   │   ├── application/            # Casos de uso y reglas de negocio
│   │   │   ├── infrastructure/         # JPA, repositorios, seguridad
│   │   │   └── domain/                 # Entidades de negocio (si aplica)
│   │   └── resources/
│   │       ├── application.yml         # Config principal
│   │       ├── application-*.yml        # Perfiles (local, test, staging, prod)
│   │       └── db/migration/           # Migraciones Flyway (V1 a V8+)
│   └── test/
│       ├── java/                       # Tests de integración
│       └── resources/
│           └── data.sql                # Seeds para H2 en tests
├── pom.xml
└── mvnw / mvnw.cmd                    # Maven Wrapper
```

### Cómo pensar las capas

| Capa | Responsabilidad | Ejemplo |
|------|-----------------|---------|
| `api` | Controladores REST, DTOs de request/response, validación de forma | `AuthController`, `LoginRequest` |
| `application` | Casos de uso, coordinación entre agregados, reglas de negocio | `AuthApplicationService`, `CaseService` |
| `infrastructure` | JPA/Hibernate, repositorios, seguridad, filtros, configuración | `UserRepository`, `JwtAuthenticationFilter` |

---

## 3. Stack técnico

- **Java**: Versión 21.
- **Spring Boot**: 3.3.5.
- **Build**: Maven (con Wrapper incluído).
- **Base de datos**: MySQL 8 (runtime), H2 (tests).
- **Migraciones**: Flyway.
- **API Docs**: springdoc-openapi (Swagger).
- **Seguridad**: Spring Security + JWT (jjwt).
- **Testing**: JUnit 5, MockMvc, H2 embebido.

### Dependencias clave (pom.xml)

```xml
spring-boot-starter-web
spring-boot-starter-validation
spring-boot-starter-data-jpa
spring-boot-starter-security
spring-boot-starter-actuator
flyway-core + flyway-mysql
mysql-connector-j
springdoc-openapi-starter-webmvc-ui
io.jsonwebtoken (jjwt-api, jjwt-impl, jjwt-jackson)
h2 (test scope)
```

---

## 4. Configuración por perfiles

### application.yml (base)

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/taller_zapata?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=America/Argentina/Buenos_Aires
    username: root
    password: root
  jpa:
    hibernate:
      ddl-auto: validate   # Valida esquema contra entidades
  flyway:
    enabled: true

app:
  security:
    auth-strategy: jwt-refresh-token
    jwt-secret: <secret>
    access-token-seconds: 900
    refresh-token-days: 15
```

### Perfiles disponibles

| Perfil | Propósito | Config notable |
|--------|-----------|----------------|
| `local` | Desarrollo local | Override de URL MySQL con `allowPublicKeyRetrieval=true` |
| `test` | Tests unitarios/integración | H2 en memoria, ddl-auto=create-drop |
| `staging` | Pre-producción | - |
| `prod` | Producción | - |

---

## 5. Módulos funcionales implementados

### 5.1 Auth (autenticación)

**Endpoints:**
- `POST /api/v1/auth/login` - Iniciar sesión (email + password)
- `POST /api/v1/auth/refresh` - Rotar refresh token
- `POST /api/v1/auth/logout` - Revocar refresh token actual (o todos, segun payload)
- `GET /api/v1/auth/me` - Obtener usuario autenticado

**Archivos clave:**
- `api/auth/AuthController.java`
- `application/security/AuthApplicationService.java`
- `application/security/RefreshTokenService.java`
- `infrastructure/security/JwtTokenService.java`
- `infrastructure/security/JwtAuthenticationFilter.java`

**Flujo real (no mock):**
1. Login recibe email + password, valida contra `usuarios.password_hash` con BCrypt.
2. Genera access token JWT (firma con HMAC-SHA256).
3. Genera refresh token, lo hashea con SHA-256 y persiste en `auth_refresh_tokens`.
4. Refresh rota el token: marca el anterior como revocado y emite uno nuevo.

**Migración asociada:**
- `V7__init_auth_refresh_tokens.sql` (tabla `auth_refresh_tokens`)

### 5.2 Personas

**Endpoints:**
- `GET /api/v1/persons?document=...&q=...` - Buscar por documento exacto o autocomplete parcial (nombre/documento)
- `GET /api/v1/persons/{personId}` - Detalle
- `POST /api/v1/persons` - Alta
- `PUT /api/v1/persons/{personId}` - Edición

**Archivo clave:**
- `api/person/PersonController.java`

### 5.3 Vehículos

**Endpoints:**
- `GET /api/v1/vehicles?plate=...&q=...` - Buscar por dominio exacto o autocomplete parcial (dominio/marca/modelo)
- `GET /api/v1/vehicles/{vehicleId}` - Detalle
- `POST /api/v1/vehicles` - Alta
- `PUT /api/v1/vehicles/{vehicleId}` - Edición

**Archivo clave:**
- `api/vehicle/VehicleController.java`

### 5.4 Casos (casefile)

**Endpoints:**
- `GET /api/v1/cases?page=0&size=20&organizationId=1&branchId=1` - Listado paginado con metadata (`items`, `page`, `size`, `totalElements`, `totalPages`)
- `GET /api/v1/cases/catalogs` - Catálogos para formularios (tipos, roles, prioridades)
- `GET /api/v1/cases/{caseId}` - Detalle
- `POST /api/v1/cases` - Alta (transaccional, crea persona/vehículo principal si no existen)
- `PUT /api/v1/cases/{caseId}` - Edición
- `GET /api/v1/cases/{caseId}/relations` - Listar relaciones
- `POST /api/v1/cases/{caseId}/relations` - Crear relación entre casos
- `POST /api/v1/cases/{caseId}/workflow/transitions` - Transicionar estado
- `GET /api/v1/cases/{caseId}/workflow/history` - Historial de estados
- `GET /api/v1/cases/{caseId}/workflow/actions` - Acciones disponibles por estado/permisos

**Archivos clave:**
- `api/casefile/CaseController.java`
- `application/casefile/CaseService.java`
- `application/casefile/CaseWorkflowService.java`

**Características:**
- Genera `codigo_carpeta` automáticamente.
-维权状态 dual: `estado_tramite` + `estado_reparacion`.
- Audita transiciones en `caso_estado_historial`.
- Control de acceso por organización/sucursal (`CaseAccessControlService`).

### 5.5 Identity Admin (gestión de usuarios y roles)

**Endpoints:**
- `GET /api/v1/permissions` - Listar todos los permisos del sistema
- `GET /api/v1/users/{userId}/roles` - Listar asignaciones de rol de un usuario
- `PUT /api/v1/users/{userId}/roles` - Reemplazar asignaciones de rol de un usuario

**Permisos definidos:**
- `identity.permissions.read` - Ver permisos
- `identity.roles.manage` - Gestionar roles de usuario

**Archivos clave:**
- `api/identity/IdentityController.java`
- `application/security/IdentityAdminService.java`

**Migración asociada:**
- `V8__seed_identity_permissions.sql`

---

## 6. Seguridad

### Autenticación

- **JWT real**: Access token viejbpo 15 minutos (`access-token-seconds: 900`).
- **Refresh token**: Persistido en DB, vida de 15 días, rotación obligatoria.
- **Login**: Valida password con BCrypt (`passwordEncoder.matches()`).
- **Logout**: por defecto revoca el refresh token enviado en payload; si `revokeAllSessions=true`, revoca todos los refresh tokens activos del usuario.

### Filtros

| Filtro | Perfil | Función |
|--------|--------|---------|
| `JwtAuthenticationFilter` | todos (prod, local, test) | Extrae Bearer token y autentica |
| `HeaderAuthenticationFilter` | solo `test` | Lee `X-User-Id` (compatibilidad de tests) |

### Métricas de auth

- `auth.login.total{result=success|failure,reason=...}`
- `auth.refresh.total{result=success|failure,reason=...}`
- `auth.logout.total{result=success,scope=single_session|all_sessions}`

Estas métricas quedan expuestas por Actuator en `management` (`/actuator/metrics`).

### Configuración de seguridad

**Archivo:** `infrastructure/security/SecurityConfig.java`

```java
.authorizeHttpRequests(authorize -> authorize
    .requestMatchers("/ping", "/actuator/health", "/actuator/info",
                      "/swagger-ui/**", "/v3/api-docs/**").permitAll()
    .requestMatchers(HttpMethod.POST, "/api/v1/auth/login", 
                      "/api/v1/auth/refresh").permitAll()
    .anyRequest().authenticated())
```

### Manejo de errores

- `401 Unauthorized` para credenciales inválidas, tokens inválidos/expirados.
- `403 Forbidden` para acceso denegado por permisos/alcance.
- `404 NotFound` para recursos no encontrados.
- `409 Conflict` para conflictos de negocio (relaciones duplicadas, etc.).
- Formato unificado: `ApiErrorResponse` en `api/common/GlobalExceptionHandler.java`.

---

## 7. Observabilidad y utilities

| Recurso | URL | Descripción |
|---------|-----|--------------|
| Health | `GET /actuator/health` | Estado de la app |
| Info | `GET /actuator/info` | Metadata |
| Swagger UI | `GET /swagger-ui/index.html` | Documentación interactiva |
| OpenAPI JSON | `GET /v3/api-docs` | Spec JSON |
| Ping público | `GET /ping` | Smoke test sin auth |

---

## 8. Tests

### Suite completa

Ejecutar: `./mvnw test` (o `mvnw.cmd test` en Windows)

**Resultado actual:** ~17 tests, todos pasando.

### Tests clave

| Test | Cobertura |
|------|------------|
| `AuthIntegrationTest` | Login, JWT, refresh token |
| `IdentityAdminIntegrationTest` | Permissions, roles de usuario |
| `CaseSecurityIntegrationTest` | Acceso a casos por permiso y scope |
| `FlywayMigrationTest` | Migraciones ejecutan correctamente |
| `PersonDocumentNormalizerTest` | Normalización de documentos |
| `VehiclePlateNormalizerTest` | Normalización de dominios |

### Seeds de test

- `src/test/resources/data.sql` se ejecuta automáticamente con perfil `test`.
- содержит usuarios, roles, permisos, tipos de trámite, estados de workflow.
- Password del usuario admin seedeado: `password` (hash BCrypt).

---

## 9. Cómo iniciar el proyecto

### Requisitos

- Java 21 instalado.
- MySQL 8 corriendo en `localhost:3306` (o ajustar `application-local.yml`).
- Opcional: Docker si se quiere usar Testcontainers (no requerido para tests).

### Levantar localmente

```bash
# Con Maven Wrapper (recomendado)
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=local

# En Windows
mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local
```

### Verificar que funciona

1. **Smoke test público:**
   ```bash
   curl http://localhost:8080/ping
   ```
   Respuesta esperada: `{"status":"ok","service":"taller-zapata-backend"}`

2. **Swagger UI:**
   - Abrir `http://localhost:8080/swagger-ui/index.html`

3. **Health:**
   - `http://localhost:8080/actuator/health`

---

## 10. Cómo usar Postman

### Importar configuración

1. Abrir Postman.
2. `Import` → arrastrar:
   - `postman/Taller-Zapata-Backend.postman_collection.json`
   - `postman/Taller-Zapata-Local.postman_environment.json`
3. Seleccionar environment: **Taller Zapata Local**.

### Flujo de prueba

1. **Login** (`Auth > POST Login`)
   - Request: `{"email": "admin@tallerzapata.local", "password": "password"}`
   - El script guarda automáticamente `accessToken` y `refreshToken` en variables de entorno.

2. **Probar endpoints autenticados**:
   - `Auth > GET Me`
   - `Identity Admin > GET Permissions`
   - `Cases > GET Cases`

### Exportar cambios

Si agregás/modificás requests en Postman:
- Collection: `...` → `Export` → `Collection v2.1`
- Environment: `...` → `Export`
- Guardar en `postman/` para versionar.

---

## 11. Migraciones ejecutadas

| Versión | Descripción |
|---------|-------------|
| V1 | Organizaciones y sucursales |
| V2 | Usuarios, roles, permisos |
| V3 | Personas y datos base |
| V4 | Vehículos |
| V5 | Casos core (incluye relaciones, incidentes) |
| V6 | Workflow (estados, transiciones, historial) |
| V7 | Refresh tokens de autenticación |
| V8 | Permisos de identity admin |

---

## 12. qué falta (siguientes etapas recomendadas)

### Alta prioridad

1. **Auditoría de seguridad**: Registrar en `auditoria_eventos` login, refresh, logout y cambios de roles/permisos.
2. **Semántica de errores de autorización**: Mover denegaciones de negocio de `409` a `403` donde corresponda.
3. **Contrato de paginación estándar**: Pasar de respuesta de lista simple a `{"items": [], "meta": {"page": 0, "size": 20, "total": 100}}` en todos los listados.

### Siguientes módulos de negocio

4. **Operación taller**: Turnos, ingresos, egresos, tareas.
5. **Documentos**: Upload, relaciones, categorías.
6. **Finanzas**: Movimientos, comprobantes, retenciones.
7. **Seguros/legal**: Compañías, tramitación, CLEAS, terceros.

---

## 13. Glosario rápido

| Término | Significado |
|---------|-------------|
| `public_id` | UUID único e inmutable de una entidad (expuesto en API) |
| `codigo_carpeta` | Código identificador del caso (ej: `P-00001-Z`) |
| `numero_orden` | Consecutivo por organización para el código de carpeta |
| `domain` (workflow) | Ámbito del estado: `tramite`, `reparacion`, etc. |
| `scope` | Alcance del usuario: organización + opcional sucursal |
| `refresh token rotation` | Cada refresh invalida el anterior y genera uno nuevo |
| `ddl-auto=validate` | Hibernate valida que el esquema DB coincida con entidades |

---

## 14. Referencias rápidas

| Recurso | Ubicación |
|---------|-----------|
| Configuración principal | `src/main/resources/application.yml` |
| Config local | `src/main/resources/application-local.yml` |
| Entidades JPA | `src/main/java/.../infrastructure/persistence/` |
| Controladores | `src/main/java/.../api/` |
| Servicios de aplicación | `src/main/java/.../application/` |
| Migraciones | `src/main/resources/db/migration/` |
| Seeds de test | `src/test/resources/data.sql` |
| Colección Postman | `postman/Taller-Zapata-Backend.postman_collection.json` |
| Environment Postman | `postman/Taller-Zapata-Local.postman_environment.json` |

---

*Documento generado el 17 de abril de 2026 para onboarding del proyecto Taller Zapata.*
