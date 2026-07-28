# Gestion pendientes backend para `front2`

Fecha: 2026-07-26

## Alcance auditado

Auditoria hecha solo sobre codigo real de `front2`.

### Contratos y capacidades confirmadas hoy

- Sesion y navegacion: `GET /api/v1/auth/session` en `front2/src/modules/auth/api/auth-api.js`
- Casos: `POST /api/v1/cases`, `GET /api/v1/cases`, `GET /api/v1/cases/:id` en `front2/src/modules/cases/api/new-case-api.js`, `front2/src/modules/cases/api/cases-api.js` y `front2/src/modules/cases/pages/case-workspace-page.jsx`
- Clientes: `POST /api/v1/persons`, `GET /api/v1/persons`, `GET /api/v1/persons/:id`, `PUT /api/v1/persons/:id`, `GET /api/v1/persons/:id/vehicles` en `front2/src/modules/cases/api/new-case-api.js` y `front2/src/modules/cases/pages/case-workspace-page.jsx`
- Vehiculos: `POST /api/v1/vehicles`, `GET /api/v1/vehicles`, `GET /api/v1/vehicles/:id`, `PUT /api/v1/vehicles/:id`, `GET /api/v1/vehicles/catalogs`, `GET /api/v1/vehicles/brands`, `GET /api/v1/vehicles/models` en `front2/src/modules/cases/api/new-case-api.js` y `front2/src/modules/cases/pages/case-workspace-page.jsx`
- Organizacion y sucursales: `GET /api/v1/organizations`, `GET /api/v1/branches`, `PUT /api/v1/organizations/:id`, `PUT /api/v1/branches/:id` en `front2/src/modules/cases/api/new-case-api.js` y `front2/src/modules/management/pages/management-page.jsx`
- Seguros: solo `GET /api/v1/insurance/catalogs` en `front2/src/modules/cases/api/new-case-api.js`

### Insuficiencias ya comprobadas en frontend

- Nuevo caso envia `referredByPersonId: null` siempre y solo usa `referenced` + `referredByText` en `front2/src/modules/cases/pages/new-case-page.jsx`
- Gestion de clientes no recibe historial de carpetas por cliente en `front2/src/modules/management/pages/management-clients-page.jsx`
- Gestion de vehiculos no recibe relacion global vehiculo-cliente ni historial de carpetas por vehiculo en `front2/src/modules/management/pages/management-vehicles-page.jsx`
- Gestion de companias no tiene listado/detalle/CRUD de aseguradoras; solo codigos de opinion y pago en `front2/src/modules/management/pages/management-insurance-page.jsx`
- Shell muestra `role` y `navigation`, pero no existe contrato confirmado para ABM de usuarios/permisos en `front2/src/modules/auth/providers/session-provider.jsx` y `front2/src/app/shell/app-shell.jsx`

---

## 1. CRUD de referenciadores

1. Necesidad funcional: alta, listado, detalle, edicion y desactivacion segura de referenciadores reutilizables desde Gestion.
2. Evidencia de insuficiencia actual del contrato: `front2/src/modules/cases/pages/new-case-page.jsx` solo maneja `referenced`, `referredByText` y `referredByPersonId: null`; `front2/src/modules/management/pages/management-referrers-page.jsx` no tiene endpoint real para consumir.
3. Entidad o relacion necesaria: entidad `referrer` independiente y opcionalmente relacion con `person` cuando el referenciador tambien es una persona registrada.
4. Campos propuestos:
   - requeridos: `id`, `displayName`, `kind`, `active`
   - opcionales: `personId`, `phone`, `email`, `notes`, `branchId`, `organizationId`, `createdAt`, `updatedAt`
5. Relacion con cliente/vehiculo/caso/taller/sucursal: el referenciador se relaciona con `case`; puede quedar acotado por `organizationId` y/o `branchId`.
6. Endpoints necesarios:
   - `GET /api/v1/referrers`
   - `POST /api/v1/referrers`
   - `GET /api/v1/referrers/{referrerId}`
   - `PUT /api/v1/referrers/{referrerId}`
   - `PATCH /api/v1/referrers/{referrerId}/active`
7. Metodos HTTP: `GET`, `POST`, `PUT`, `PATCH`.
8. Busqueda/paginacion: `GET /api/v1/referrers?q=&active=&page=&size=&sort=` con respuesta paginada.
9. Ejemplos request/response coherentes:

```json
POST /api/v1/referrers
{
  "displayName": "Productor externo",
  "kind": "PERSONA_EXTERNA",
  "phone": "+543415551111",
  "email": "productor@example.com",
  "organizationId": 1,
  "branchId": 10,
  "active": true
}
```

```json
201 Created
{
  "id": 45,
  "displayName": "Productor externo",
  "kind": "PERSONA_EXTERNA",
  "personId": null,
  "phone": "+543415551111",
  "email": "productor@example.com",
  "organizationId": 1,
  "branchId": 10,
  "active": true,
  "createdAt": "2026-07-26T12:00:00Z",
  "updatedAt": "2026-07-26T12:00:00Z"
}
```

10. Validaciones: `displayName` obligatorio; unicidad por organizacion/sucursal + nombre normalizado; email valido; no permitir baja logica si rompe referencias sin estrategia.
11. Reglas de activo/inactivo: permitir inactivar si ya fue usado; impedir borrado fisico si tiene casos asociados; filtrar activos por defecto.
12. Permisos necesarios: `referrer.read`, `referrer.write`, `referrer.deactivate`.
13. Migracion requerida: nueva tabla `referrers` y, si aplica, FK opcional a `persons`.
14. Pruebas backend recomendadas: CRUD feliz, unicidad, paginacion, filtro por activo, filtro por scope, intento de desactivar usado en casos.
15. Parte del frontend bloqueada: `front2/src/modules/management/pages/management-referrers-page.jsx` no puede tener listado/detalle/edicion reales.

---

## 2. Relacion del referenciador con el caso

1. Necesidad funcional: vincular un caso a un referenciador real, no solo a texto libre.
2. Evidencia de insuficiencia actual del contrato: `front2/src/modules/cases/pages/new-case-page.jsx` envia `referredByPersonId: null` siempre; no existe `referrerId` ni contrato de lectura en detalle de carpeta.
3. Entidad o relacion necesaria: relacion `case -> referrer` con snapshot opcional del nombre mostrado.
4. Campos propuestos:
   - requeridos: `caseId`, `referenced`, `referrerId`
   - opcionales: `referredByText`, `referrerSnapshotName`, `notes`
5. Relacion con cliente/vehiculo/caso/taller/sucursal: relacion directa con `case`; el alcance operativo depende del scope del caso.
6. Endpoints necesarios:
   - ampliar `POST /api/v1/cases`
   - ampliar `GET /api/v1/cases/{caseId}`
   - `PUT /api/v1/cases/{caseId}/referrer`
7. Metodos HTTP: `POST`, `GET`, `PUT`.
8. Busqueda/paginacion: no aplica para escritura puntual; si el detalle de caso lista historial, ordenar por `updatedAt`.
9. Ejemplos request/response coherentes:

```json
PUT /api/v1/cases/123/referrer
{
  "referenced": true,
  "referrerId": 45,
  "referredByText": null
}
```

```json
200 OK
{
  "caseId": 123,
  "referenced": true,
  "referrer": {
    "id": 45,
    "displayName": "Productor externo",
    "active": true
  },
  "referredByText": null,
  "updatedAt": "2026-07-26T12:10:00Z"
}
```

10. Validaciones: si `referenced=true`, exigir `referrerId` o `referredByText`; no permitir `referrerId` de otra organizacion si el caso es scopeado.
11. Reglas de activo/inactivo: permitir leer referenciadores inactivos ya vinculados historicamente; impedir nuevas vinculaciones a inactivos.
12. Permisos necesarios: `case.create`, `case.update`, `referrer.read`.
13. Migracion requerida: agregar `referrer_id` a `cases` o tabla relacional segun modelo vigente.
14. Pruebas backend recomendadas: alta con referenciador, alta con texto libre, rechazo de inactivo, lectura en detalle, actualizacion posterior.
15. Parte del frontend bloqueada: `front2/src/modules/cases/pages/new-case-page.jsx` y `front2/src/modules/cases/pages/case-workspace-page.jsx` no pueden usar referenciadores reales.

---

## 3. Catalogo/CRUD de companias de seguros

1. Necesidad funcional: listado, detalle y administracion de aseguradoras desde Gestion.
2. Evidencia de insuficiencia actual del contrato: `front2/src/modules/management/pages/management-insurance-page.jsx` solo confirma `GET /insurance/catalogs` para opiniones y estados de pago; no representa companias.
3. Entidad o relacion necesaria: entidad `insuranceCompany`.
4. Campos propuestos:
   - requeridos: `id`, `name`, `active`
   - opcionales: `code`, `taxId`, `phone`, `email`, `claimsPortalUrl`, `notes`
5. Relacion con cliente/vehiculo/caso/taller/sucursal: una compania puede asociarse a muchos casos; no depende de cliente/vehiculo en forma directa.
6. Endpoints necesarios:
   - `GET /api/v1/insurance-companies`
   - `POST /api/v1/insurance-companies`
   - `GET /api/v1/insurance-companies/{companyId}`
   - `PUT /api/v1/insurance-companies/{companyId}`
   - `PATCH /api/v1/insurance-companies/{companyId}/active`
7. Metodos HTTP: `GET`, `POST`, `PUT`, `PATCH`.
8. Busqueda/paginacion: `q`, `active`, `page`, `size`, `sort`.
9. Ejemplos request/response coherentes:

```json
GET /api/v1/insurance-companies?q=seguros&page=0&size=20
{
  "items": [
    {
      "id": 7,
      "name": "Seguros del Centro",
      "code": "SEGCEN",
      "active": true
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

10. Validaciones: `name` obligatorio; `code` unico si existe; no duplicar activos por nombre normalizado.
11. Reglas de activo/inactivo: baja logica; no borrar si esta asociada a casos historicos.
12. Permisos necesarios: `insurance-company.read`, `insurance-company.write`, `insurance-company.deactivate`.
13. Migracion requerida: nueva tabla `insurance_companies`; relacionarla con `cases` si hoy el caso no tiene FK estable.
14. Pruebas backend recomendadas: CRUD, busqueda, paginacion, vinculo con casos, inactivacion usada historicamente.
15. Parte del frontend bloqueada: `front2/src/modules/management/pages/management-insurance-page.jsx` solo puede mostrar lectura parcial de catalogos no administrables.

---

## 4. Edicion global de clientes con contrato estable

1. Necesidad funcional: editar clientes globalmente desde Gestion sin depender de supuestos del workspace.
2. Evidencia de insuficiencia actual del contrato: `front2/src/modules/management/pages/management-clients-page.jsx` reutiliza `PUT /persons/:id` porque existe en carpeta, pero no hay contrato documentado para conflictos, validaciones, concurrencia ni campos realmente administrables.
3. Entidad o relacion necesaria: entidad `person` con contrato estable de administracion.
4. Campos propuestos:
   - requeridos: `id`, `tipoPersona`, `nombreMostrar`, `active`
   - opcionales administrables: `nombre`, `apellido`, `razonSocial`, `tipoDocumentoCodigo`, `numeroDocumento`, `cuitCuil`, `fechaNacimiento`, `telefonoPrincipal`, `emailPrincipal`, `ocupacion`, `estadoCivilCodigo`, `observaciones`
5. Relacion con cliente/vehiculo/caso/taller/sucursal: cliente se relaciona con multiples casos y potencialmente con multiples vehiculos.
6. Endpoints necesarios:
   - estabilizar `GET /api/v1/persons`
   - estabilizar `GET /api/v1/persons/{personId}`
   - estabilizar `PUT /api/v1/persons/{personId}`
7. Metodos HTTP: `GET`, `PUT`.
8. Busqueda/paginacion: `GET /api/v1/persons?q=&document=&active=&page=&size=`.
9. Ejemplos request/response coherentes:

```json
PUT /api/v1/persons/77
{
  "tipoPersona": "fisica",
  "nombre": "Juan",
  "apellido": "Perez",
  "tipoDocumentoCodigo": "DNI",
  "numeroDocumento": "30111222",
  "telefonoPrincipal": "3415551111",
  "emailPrincipal": "juan@example.com",
  "activo": true
}
```

```json
200 OK
{
  "id": 77,
  "nombreMostrar": "Perez, Juan",
  "tipoPersona": "fisica",
  "tipoDocumentoCodigo": "DNI",
  "numeroDocumento": "30111222",
  "telefonoPrincipal": "3415551111",
  "emailPrincipal": "juan@example.com",
  "activo": true,
  "updatedAt": "2026-07-26T12:20:00Z"
}
```

10. Validaciones: documento unico por tipo+numero cuando aplique; email valido; telefono normalizado; rechazar payloads parciales inconsistentes.
11. Reglas de activo/inactivo: baja logica; impedir borrado fisico si tiene casos asociados.
12. Permisos necesarios: `person.read`, `person.write`, `person.deactivate`.
13. Migracion requerida: no necesariamente estructural si `persons` ya existe; si falta, agregar metadatos `active`, `updatedAt`, versionado optimistic locking.
14. Pruebas backend recomendadas: busqueda por nombre/documento, detalle, actualizacion, conflicto por duplicado, lectura de inactivos segun permiso.
15. Parte del frontend bloqueada: la pantalla `front2/src/modules/management/pages/management-clients-page.jsx` hoy funciona, pero sin contrato estable puede romperse ante cambios de backend no versionados.

---

## 5. Edicion global de vehiculos con contrato estable

1. Necesidad funcional: editar vehiculos globalmente desde Gestion con reglas claras.
2. Evidencia de insuficiencia actual del contrato: `front2/src/modules/management/pages/management-vehicles-page.jsx` reutiliza `PUT /vehicles/:id`, pero no hay contrato formal para duplicados de patente, campos opcionales, cliente asociado ni historico.
3. Entidad o relacion necesaria: entidad `vehicle` con contrato estable de administracion.
4. Campos propuestos:
   - requeridos: `id`, `plate`, `active`
   - opcionales administrables: `brandId`, `modelId`, `brandText`, `modelText`, `year`, `vehicleTypeCode`, `usageCode`, `transmissionCode`, `color`, `paintCode`, `chasis`, `motor`, `mileage`, `observaciones`
5. Relacion con cliente/vehiculo/caso/taller/sucursal: un vehiculo puede tener multiples casos y potencialmente multiples titulares historicos.
6. Endpoints necesarios:
   - estabilizar `GET /api/v1/vehicles`
   - estabilizar `GET /api/v1/vehicles/{vehicleId}`
   - estabilizar `PUT /api/v1/vehicles/{vehicleId}`
7. Metodos HTTP: `GET`, `PUT`.
8. Busqueda/paginacion: `GET /api/v1/vehicles?q=&plate=&active=&page=&size=`.
9. Ejemplos request/response coherentes:

```json
PUT /api/v1/vehicles/22
{
  "brandId": null,
  "modelId": null,
  "brandText": "Toyota",
  "modelText": "Corolla",
  "plate": "AB123CD",
  "year": 2022,
  "vehicleTypeCode": "SEDAN",
  "usageCode": "PARTICULAR",
  "transmissionCode": "MANUAL",
  "activo": true
}
```

```json
200 OK
{
  "id": 22,
  "plate": "AB123CD",
  "brandText": "Toyota",
  "modelText": "Corolla",
  "vehicleTypeCode": "SEDAN",
  "usageCode": "PARTICULAR",
  "activo": true,
  "updatedAt": "2026-07-26T12:30:00Z"
}
```

10. Validaciones: patente unica segun dominio normalizado; ano numerico valido; no permitir `brandId` y `brandText` inconsistentes si ambos existen.
11. Reglas de activo/inactivo: baja logica; no borrar si tiene casos asociados.
12. Permisos necesarios: `vehicle.read`, `vehicle.write`, `vehicle.deactivate`.
13. Migracion requerida: no necesariamente estructural si `vehicles` ya existe; puede requerir `active`, `updatedAt`, versionado y restricciones de unicidad limpias.
14. Pruebas backend recomendadas: busqueda por patente/marca/modelo, detalle, actualizacion, conflicto por duplicado, lectura de inactivos.
15. Parte del frontend bloqueada: `front2/src/modules/management/pages/management-vehicles-page.jsx` hoy no puede mostrar informacion confiable sobre relaciones externas ni manejar conflictos finos sin contrato estable.

---

## 6. Consulta de vehiculos por cliente con contrato consistente

1. Necesidad funcional: listar vehiculos vinculados a un cliente en Gestion y en Nuevo caso.
2. Evidencia de insuficiencia actual del contrato: existe `GET /persons/:id/vehicles`, pero `front2/src/modules/management/pages/management-clients-page.jsx` solo puede renderizar lo que llegue y no tiene contrato documentado para paginacion, orden ni relacion vigente/historica.
3. Entidad o relacion necesaria: relacion `person <-> vehicle` con semantica clara de titularidad actual e historica.
4. Campos propuestos:
   - requeridos por item: `id`, `plate`, `brandText`, `modelText`
   - opcionales: `year`, `active`, `relationshipCode`, `isPrimaryOwner`, `validFrom`, `validTo`
5. Relacion con cliente/vehiculo/caso/taller/sucursal: relacion directa cliente-vehiculo, consumida por casos.
6. Endpoints necesarios:
   - estabilizar `GET /api/v1/persons/{personId}/vehicles`
   - opcional `GET /api/v1/persons/{personId}/vehicles/history`
7. Metodos HTTP: `GET`.
8. Busqueda/paginacion: `page`, `size`, `active`, `currentOnly`.
9. Ejemplos request/response coherentes:

```json
GET /api/v1/persons/77/vehicles?currentOnly=true&page=0&size=20
{
  "items": [
    {
      "id": 22,
      "plate": "AB123CD",
      "brandText": "Toyota",
      "modelText": "Corolla",
      "year": 2022,
      "relationshipCode": "TITULAR",
      "isPrimaryOwner": true,
      "active": true
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

10. Validaciones: solo devolver vehiculos permitidos por scope; definir si incluye historicos por defecto.
11. Reglas de activo/inactivo: permitir consultar inactivos solo si se pide explicitamente o si la pantalla lo necesita por historial.
12. Permisos necesarios: `person.read`, `vehicle.read`.
13. Migracion requerida: tabla relacional o enriquecimiento de la existente para historizar titularidad.
14. Pruebas backend recomendadas: cliente sin vehiculos, cliente con multiples vehiculos, paginacion, filtro actuales/historicos.
15. Parte del frontend bloqueada: `front2/src/modules/management/pages/management-clients-page.jsx` y `front2/src/modules/cases/pages/new-case-page.jsx` no pueden diferenciar relacion vigente vs historica.

---

## 7. Historial de carpetas por cliente o vehiculo

1. Necesidad funcional: ver carpetas relacionadas desde Gestion de clientes y vehiculos.
2. Evidencia de insuficiencia actual del contrato: `front2/src/modules/management/pages/management-clients-page.jsx` y `front2/src/modules/management/pages/management-vehicles-page.jsx` muestran mensajes explicitos indicando que el contrato actual no expone historial.
3. Entidad o relacion necesaria: proyeccion de `case` por `personId` y por `vehicleId`.
4. Campos propuestos:
   - requeridos: `caseId`, `folderCode`, `createdAt`, `visibleTramiteState`, `visibleRepairState`
   - opcionales: `closedAt`, `branchCode`, `caseTypeCode`, `principalCustomerName`, `principalVehiclePlate`
5. Relacion con cliente/vehiculo/caso/taller/sucursal: relacion directa hacia `case`; usar `branchCode` y `organizationId` para contexto operativo.
6. Endpoints necesarios:
   - `GET /api/v1/persons/{personId}/cases`
   - `GET /api/v1/vehicles/{vehicleId}/cases`
7. Metodos HTTP: `GET`.
8. Busqueda/paginacion: `page`, `size`, `status`, `includeClosed`, `sort=createdAt,desc`.
9. Ejemplos request/response coherentes:

```json
GET /api/v1/persons/77/cases?includeClosed=true&page=0&size=20
{
  "items": [
    {
      "caseId": 123,
      "folderCode": "CAR-001",
      "caseTypeCode": "PARTICULAR",
      "principalCustomerName": "Perez, Juan",
      "principalVehiclePlate": "AB123CD",
      "visibleTramiteState": { "code": "EN_TRAMITE", "label": "En tramite" },
      "visibleRepairState": { "code": "DAR_TURNO", "label": "Dar turno" },
      "branchCode": "Z",
      "createdAt": "2026-07-01T10:00:00Z",
      "closedAt": null
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

10. Validaciones: respetar permisos por sucursal/organizacion; ordenar consistentemente; no devolver casos ajenos al scope.
11. Reglas de activo/inactivo: historico debe incluir casos cerrados aunque la persona o el vehiculo esten inactivos.
12. Permisos necesarios: `case.read`, `person.read`, `vehicle.read`.
13. Migracion requerida: probablemente ninguna estructural si la relacion caso-persona y caso-vehiculo ya existe; si no hay indices, agregarlos.
14. Pruebas backend recomendadas: listado por cliente, listado por vehiculo, casos cerrados, paginacion y filtros.
15. Parte del frontend bloqueada: `front2/src/modules/management/pages/management-clients-page.jsx` y `front2/src/modules/management/pages/management-vehicles-page.jsx` no pueden mostrar carpetas relacionadas.

---

## 8. Usuarios y permisos

1. Necesidad funcional: consultar y administrar usuarios, roles, permisos efectivos y alcances operativos desde Gestion.
2. Evidencia de insuficiencia actual del contrato: `front2/src/modules/auth/api/auth-api.js` y `front2/src/modules/auth/providers/session-provider.jsx` solo consumen bootstrap de sesion; `front2/src/app/shell/app-shell.jsx` usa `session.user.role` y `session.navigation`, pero no existe API confirmada de listado o administracion de usuarios/permisos.
3. Entidad o relacion necesaria: entidades `user`, `role`, `permission`, `scope`.
4. Campos propuestos:
   - usuario requeridos: `id`, `displayName`, `email`, `active`
   - usuario opcionales: `roles`, `permissions`, `scopes`, `lastLoginAt`
   - rol/permisos: `code`, `label`, `description`
5. Relacion con cliente/vehiculo/caso/taller/sucursal: los permisos y scopes gobiernan acceso a todas las entidades operativas.
6. Endpoints necesarios:
   - `GET /api/v1/users`
   - `GET /api/v1/users/{userId}`
   - `POST /api/v1/users`
   - `PUT /api/v1/users/{userId}`
   - `PATCH /api/v1/users/{userId}/active`
   - `GET /api/v1/roles`
   - `GET /api/v1/permissions`
7. Metodos HTTP: `GET`, `POST`, `PUT`, `PATCH`.
8. Busqueda/paginacion: `q`, `active`, `role`, `page`, `size`.
9. Ejemplos request/response coherentes:

```json
GET /api/v1/users?page=0&size=20
{
  "items": [
    {
      "id": 3,
      "displayName": "Admin Taller",
      "email": "admin@taller.local",
      "active": true,
      "roles": [{ "code": "ADMIN", "label": "Administrador" }],
      "permissions": ["case.read", "case.write", "person.write"],
      "scopes": [{ "organizationId": 1, "branchId": 10, "branchCode": "Z" }]
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

10. Validaciones: email unico; no permitir quitar el ultimo admin activo; scopes consistentes con organizacion/sucursal existentes.
11. Reglas de activo/inactivo: baja logica; impedir desactivar el unico usuario con permisos criticos; mantener trazabilidad.
12. Permisos necesarios: `user.read`, `user.write`, `user.deactivate`, `role.read`, `permission.read`.
13. Migracion requerida: depende del estado real del modulo auth; posiblemente tablas puente `user_roles`, `role_permissions`, `user_scopes`.
14. Pruebas backend recomendadas: bootstrap de sesion vs permisos efectivos, ABM de usuarios, scopes multiples, restricciones de seguridad.
15. Parte del frontend bloqueada: no se puede habilitar `Usuarios y permisos` dentro de Gestion sin soporte real.

---

## 9. Desactivacion segura de registros utilizados

1. Necesidad funcional: inactivar clientes, vehiculos, referenciadores o aseguradoras sin romper historico ni referencias.
2. Evidencia de insuficiencia actual del contrato: las pantallas de Gestion en `front2` no exponen eliminacion/desactivacion porque no hay soporte real confirmado ni reglas de negocio consumibles.
3. Entidad o relacion necesaria: politica transversal de `active` / `inactive` y validaciones de uso historico.
4. Campos propuestos:
   - requeridos: `active`, `deactivatedAt`, `deactivatedBy`
   - opcionales: `deactivationReason`, `reactivatedAt`, `reactivatedBy`
5. Relacion con cliente/vehiculo/caso/taller/sucursal: aplica a todas las entidades usadas por casos y por configuracion operativa.
6. Endpoints necesarios:
   - `PATCH /api/v1/persons/{id}/active`
   - `PATCH /api/v1/vehicles/{id}/active`
   - `PATCH /api/v1/referrers/{id}/active`
   - `PATCH /api/v1/insurance-companies/{id}/active`
7. Metodos HTTP: `PATCH`.
8. Busqueda/paginacion: los listados de cada entidad deben poder filtrar `active=true|false|all`.
9. Ejemplos request/response coherentes:

```json
PATCH /api/v1/vehicles/22/active
{
  "active": false,
  "reason": "Duplicado consolidado"
}
```

```json
200 OK
{
  "id": 22,
  "active": false,
  "deactivatedAt": "2026-07-26T12:40:00Z",
  "deactivatedBy": {
    "id": 3,
    "displayName": "Admin Taller"
  },
  "reason": "Duplicado consolidado"
}
```

10. Validaciones: no permitir inactivar entidades obligatorias para casos abiertos si no existe regla de reemplazo; registrar motivo y usuario.
11. Reglas de activo/inactivo: la referencia historica se conserva; nuevos formularios no deben ofrecer inactivos salvo modo explicitamente historico.
12. Permisos necesarios: `*.deactivate` por entidad y `*.read` para consultar inactivos.
13. Migracion requerida: agregar columnas y auditoria transversal donde falten.
14. Pruebas backend recomendadas: inactivacion con y sin referencias, lectura historica, rechazo de uso nuevo, reactivacion segura.
15. Parte del frontend bloqueada: las secciones `Clientes`, `Vehiculos`, `Referenciadores` y `Compañías de seguros` no pueden ofrecer desactivacion segura.

---

## Prioridad sugerida

1. Catalogo/CRUD de proveedores.
2. Relacion referenciador-caso y CRUD de referenciadores.
3. Catalogo/CRUD de companias de seguros.
4. Historial de carpetas por cliente y vehiculo.
5. Contrato estable de clientes y vehiculos globales.
6. Usuarios/permisos y desactivacion segura transversal.

---

## 10. Catalogo/CRUD de proveedores

1. Necesidad funcional: administrar proveedores reutilizables desde Gestión y seleccionarlos en presupuestos, repuestos, compras, reparaciones y documentos.
2. Evidencia de insuficiencia actual: no existe entidad, DTO ni endpoint global de proveedores. Solo hay textos libres: `quotedPartsSupplier` (presupuesto), `finalSupplier` (repuesto), `partsSupplierText` (seguro) y `supplier` por cotización de un repuesto. Las cotizaciones están anidadas en `/api/v1/cases/{caseId}/parts/{partId}/quotes`, por lo que no forman un catálogo.
3. Entidad necesaria: `supplier`, acotada por organización y opcionalmente sucursal.
4. Campos: obligatorios `id`, `displayName`, `active`, `organizationId`; opcionales `legalName`, `taxId`, `phone`, `email`, `address`, `contactName`, `notes`, `branchId`, `createdAt`, `updatedAt`.
5. Endpoints necesarios: `GET /api/v1/suppliers?q=&active=&page=&size=&sort=`, `POST /api/v1/suppliers`, `GET /api/v1/suppliers/{supplierId}`, `PUT /api/v1/suppliers/{supplierId}`, `PATCH /api/v1/suppliers/{supplierId}/active`.
6. Integración: ampliar presupuesto, repuesto, compra/reparación y documentos con `supplierId` y nombre snapshot. Los textos actuales deben conservarse solo como histórico o migrarse explícitamente.
7. Reglas: nombre normalizado único por organización; no elegir inactivos en altas; preservar referencias históricas al inactivar. Permisos: `supplier.read`, `supplier.write`, `supplier.deactivate`.
8. Persistencia y pruebas: tabla `suppliers`, índices por organización/nombre y referencias necesarias; probar CRUD, búsqueda, paginación, scope, unicidad e inactivación con usos existentes.
9. Frontend bloqueado: `front2/src/app/shell/app-shell.jsx` deja `Proveedores` deshabilitado, sin ruta ni pantalla inventadas, hasta que exista este contrato.
