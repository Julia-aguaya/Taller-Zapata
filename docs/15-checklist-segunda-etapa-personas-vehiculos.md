# Checklist segunda etapa backend - personas y vehiculos

## Objetivo

Cubrir el primer modulo de negocio reutilizable del backend:

- personas
- vehiculos

Esta etapa prepara la base para que `casos` no nazca contaminado con datos embebidos o inconsistentes.

## 1. Personas

- [x] Crear entidad persistente `PersonEntity`
- [x] Crear repositorio `PersonRepository`
- [x] Definir request de alta y actualizacion
- [x] Definir response API de persona
- [x] Implementar `PersonService`
- [x] Implementar busqueda por documento normalizado
- [x] Implementar alta de persona
- [x] Implementar actualizacion de persona
- [x] Implementar validacion de unicidad por documento
- [x] Implementar construccion coherente de `nombre_mostrar`
- [x] Implementar gestion de `persona_contactos`
- [x] Implementar gestion de `persona_domicilios`
- [x] Agregar tests del modulo personas

## 2. Vehiculos

- [x] Crear entidad persistente `VehicleEntity`
- [x] Crear repositorio `VehicleRepository`
- [x] Definir request de alta y actualizacion
- [x] Definir response API de vehiculo
- [x] Implementar `VehicleService`
- [x] Implementar busqueda por dominio normalizado
- [x] Implementar alta de vehiculo
- [x] Implementar actualizacion de vehiculo
- [x] Implementar validacion de unicidad por dominio
- [x] Implementar gestion de `vehiculo_personas`
- [x] Agregar catalogos API para `marcas_vehiculo` y `modelos_vehiculo`
- [x] Agregar tests del modulo vehiculos

## 3. API expuesta

- [x] `GET /api/v1/persons?document=`
- [x] `GET /api/v1/persons/{personId}`
- [x] `POST /api/v1/persons`
- [x] `PUT /api/v1/persons/{personId}`
- [x] `GET /api/v1/vehicles?plate=`
- [x] `GET /api/v1/vehicles/{vehicleId}`
- [x] `POST /api/v1/vehicles`
- [x] `PUT /api/v1/vehicles/{vehicleId}`
- [x] `GET /api/v1/persons/{personId}/contacts`
- [x] `POST /api/v1/persons/{personId}/contacts`
- [x] `PUT /api/v1/persons/{personId}/contacts/{contactId}`
- [x] `GET /api/v1/persons/{personId}/addresses`
- [x] `POST /api/v1/persons/{personId}/addresses`
- [x] `PUT /api/v1/persons/{personId}/addresses/{addressId}`
- [x] `GET /api/v1/vehicles/brands`
- [x] `GET /api/v1/vehicles/models`
- [x] `GET /api/v1/vehicles/{vehicleId}/persons`
- [x] `POST /api/v1/vehicles/{vehicleId}/persons`
- [x] `PUT /api/v1/vehicles/{vehicleId}/persons/{relationId}`

## 4. Reglas implementadas

- [x] Normalizar documento antes de buscar o validar unicidad
- [x] Normalizar dominio antes de buscar o validar unicidad
- [x] Rechazar documento duplicado
- [x] Rechazar dominio duplicado
- [x] Separar identidad de negocio de autenticacion
- [x] Permitir solo codigos activos desde catalogos (`tipos_contacto`, `tipos_domicilio`, `roles_vehiculo`)
- [x] Exigir coherencia temporal en `vehiculo_personas` (`hasta` >= `desde`)
- [x] Garantizar un unico principal por persona en contactos y domicilios

## 5. Pendientes para cerrar esta etapa al 100%

- [ ] Agregar tests unitarios y de integración
- [ ] Verificar compilación y arranque local
- [x] Resolver gestión completa de contactos y domicilios
- [x] Resolver vínculo `vehiculo_personas`
- [x] Exponer catálogos mínimos de marcas/modelos
- [ ] Revisar si se necesitan permisos finos por endpoint antes de pasar a `casos`

## Archivos principales

- `backend/src/main/java/com/tallerzapata/backend/api/person/PersonController.java`
- `backend/src/main/java/com/tallerzapata/backend/application/person/PersonService.java`
- `backend/src/main/java/com/tallerzapata/backend/infrastructure/persistence/person/PersonEntity.java`
- `backend/src/main/java/com/tallerzapata/backend/api/vehicle/VehicleController.java`
- `backend/src/main/java/com/tallerzapata/backend/application/vehicle/VehicleService.java`
- `backend/src/main/java/com/tallerzapata/backend/infrastructure/persistence/vehicle/VehicleEntity.java`

## Nota

- Esta etapa ya deja el backend mejor parado para pasar a `casos` y `workflow core`.
- No está verificada por build todavía en esta sesión.
