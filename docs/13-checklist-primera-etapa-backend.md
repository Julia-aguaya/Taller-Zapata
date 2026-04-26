# Checklist primera etapa backend

## Alcance de este checklist

Este checklist cubre la primera parte real del backend:

- Fase 0: cierre funcional y tecnico minimo
- Fase 1: bootstrap tecnico del proyecto

La idea es que lo puedas ir marcando mientras dejás la base lista para empezar a implementar modulos de negocio sin improvisar.

---

## 1. Fuente de verdad y alineacion

- [x] Confirmar que `docs/09-estructura-base-de-datos.md` es la fuente de verdad del modelo
- [x] Confirmar que `docs/12-plan-backend-alineado-modelo-vigente.md` es el plan backend actual
- [x] Definir una regla de trabajo: si otro documento contradice al modelo vigente, prevalece `docs/09-estructura-base-de-datos.md`
- [ ] Acordar convencion de nombres para tablas, entidades, endpoints y codigos funcionales

## 2. Definiciones funcionales minimas

### Tipos de tramite

- [ ] Confirmar lista canonica de tramites
- [ ] Definir `codigo`, `nombre`, `prefijo_carpeta` y `orden_visual` de cada tramite
- [ ] Marcar que tramites requieren tramitacion
- [ ] Marcar que tramites requieren abogado

### Workflow

- [ ] Definir dominios iniciales de workflow: `tramite`, `reparacion`, `pago`, `documentacion`, `legal`
- [ ] Definir estados iniciales para `tramite`
- [ ] Definir estados iniciales para `reparacion`
- [ ] Definir estados iniciales para `pago`
- [ ] Elegir estados terminales
- [ ] Definir primeras transiciones validas por dominio
- [ ] Definir que transiciones requieren permiso especial

### Catalogos controlados

- [ ] Definir prioridades de caso
- [ ] Definir estados de tarea
- [ ] Definir prioridades de tarea
- [ ] Definir tipos de contacto de persona
- [ ] Definir tipos de domicilio
- [ ] Definir medios de pago
- [ ] Definir estados de repuesto
- [ ] Definir categorias documentales base

## 3. Reglas de negocio base

- [ ] Definir algoritmo de `codigo_carpeta`
- [ ] Definir como se genera `numero_orden`
- [ ] Definir alta minima de caso en una sola transaccion
- [ ] Confirmar roles de `caso_personas` iniciales
- [ ] Confirmar roles de `vehiculo_personas` iniciales
- [ ] Definir cuando un turno puede crearse
- [ ] Definir cuando un ingreso puede existir sin turno
- [ ] Definir cuando un egreso cierra reparacion
- [ ] Definir reglas minimas de auditoria obligatoria
- [ ] Definir que acciones quedan prohibidas sin permiso especial

## 4. Decisiones tecnicas iniciales

- [x] Confirmar stack final: `Java 21 + Spring Boot 3 + MySQL 8`
- [x] Elegir `Maven` o `Gradle`
- [x] Definir package root del proyecto
- [x] Definir version inicial de la API (`/api/v1`)
- [ ] Confirmar estrategia de autenticacion: JWT + refresh token
- [x] Confirmar estrategia de almacenamiento documental para desarrollo local
- [x] Definir convencion de errores de API
- [x] Definir convencion de logs y correlacion (`traceId`)

## 5. Estructura del proyecto

- [x] Crear carpeta `backend/`
- [x] Crear proyecto Spring Boot base
- [x] Configurar Java 21
- [x] Agregar dependencias principales
- [ ] Crear estructura modular por dominio
- [x] Crear paquetes `api`, `application`, `domain`, `infrastructure`
- [x] Agregar archivo de configuracion principal `application.yml`
- [x] Agregar perfiles `local`, `test`, `staging`, `prod`

## 6. Dependencias del proyecto

- [x] Agregar `spring-boot-starter-web`
- [x] Agregar `spring-boot-starter-validation`
- [x] Agregar `spring-boot-starter-data-jpa`
- [x] Agregar `spring-boot-starter-security`
- [x] Agregar driver MySQL
- [x] Agregar Flyway
- [x] Agregar OpenAPI / Swagger
- [x] Agregar Actuator
- [x] Agregar dependencias de testing
- [x] Agregar Testcontainers para MySQL

## 7. Configuracion tecnica base

- [x] Configurar conexion MySQL local
- [ ] Configurar pool de conexiones
- [x] Configurar `ddl-auto=validate`
- [x] Configurar Flyway para migraciones versionadas
- [x] Configurar serializacion JSON base
- [x] Configurar CORS inicial segun frontend actual
- [x] Configurar zona horaria y formato de fechas
- [x] Configurar propiedades por perfil

## 8. Observabilidad y salud

- [x] Habilitar `/actuator/health`
- [x] Habilitar `/actuator/info`
- [x] Definir metadata basica de la aplicacion
- [x] Definir formato de logs
- [x] Incluir `traceId` o correlacion equivalente
- [ ] Preparar base para metricas futuras

## 9. Seguridad base

- [x] Implementar endpoint `POST /api/v1/auth/login`
- [x] Implementar endpoint `GET /api/v1/auth/me`
- [x] Implementar endpoint `POST /api/v1/auth/refresh`
- [x] Implementar endpoint `POST /api/v1/auth/logout`
- [x] Configurar hash de password con BCrypt
- [ ] Configurar filtro de autenticacion JWT
- [x] Configurar manejo de `401` y `403`
- [ ] Definir contexto autenticado con roles y scope

## 10. Base de datos inicial

### Migraciones iniciales

- [x] Crear `V1__init_organizaciones_y_sucursales.sql`
- [x] Crear `V2__init_usuarios_roles_permisos.sql`
- [x] Crear `V3__init_personas_y_datos_base.sql`
- [x] Crear `V4__init_vehiculos.sql`
- [x] Crear `V5__init_casos_core.sql`
- [x] Crear `V6__init_workflow.sql`

### Seeds minimos

- [x] Seed de organizacion inicial
- [x] Seed de sucursal inicial
- [x] Seed de roles base
- [x] Seed de permisos base
- [x] Seed de tipos de tramite
- [x] Seed de estados workflow iniciales

## 11. Contratos de API base

- [x] Definir contrato de login
- [x] Definir contrato de `me`
- [x] Definir contrato de errores comunes
- [ ] Definir contrato de listado simple de catalogos
- [ ] Definir convencion de paginacion
- [ ] Definir convencion de filtros
- [ ] Definir convencion para IDs publicos vs IDs internos

## 12. Calidad minima obligatoria

- [x] Crear test de contexto de Spring
- [x] Crear test de migraciones con Testcontainers
- [ ] Crear test de autenticacion basica
- [ ] Crear test de acceso denegado por rol
- [ ] Crear test de carga de perfil `test`
- [ ] Verificar que la app arranque en `local`

## 13. Criterios de listo de esta etapa

La primera etapa se considera completa cuando:

- [ ] El proyecto `backend/` arranca localmente
- [ ] Flyway ejecuta migraciones sin errores
- [ ] Existe autenticacion basica funcional
- [ ] Existe RBAC base con seeds iniciales
- [ ] Hay endpoints de salud y OpenAPI disponibles
- [ ] Los perfiles de entorno estan definidos
- [ ] El modelo inicial ya arranco desde el documento vigente, no desde suposiciones
- [ ] Hay tests minimos corriendo para bootstrap y seguridad

## 14. Bloqueantes a resolver antes de pasar a la siguiente etapa

- [ ] Falta cerrar catalogos funcionales criticos
- [ ] Falta definir algoritmo final de `codigo_carpeta`
- [ ] Falta cerrar codigos de workflow inicial
- [ ] Falta definir politica minima de auditoria
- [ ] Falta decidir alcance de storage documental en desarrollo

## Notas

- Usá este checklist como hoja viva.
- Si algo cambia en `docs/09-estructura-base-de-datos.md`, este checklist debe actualizarse.
- Cuando cierres esta etapa, el siguiente checklist deberia cubrir: personas, vehiculos, casos y workflow core.
- Ya se inició el bootstrap en `backend/`, pero NO se verificó compilación ni arranque porque en esta sesión no corrí build.
