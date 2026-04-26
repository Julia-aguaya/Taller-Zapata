# Taller Zapata - API Reference v1.0.0

## Autenticacion
Todos los endpoints requieren autenticacion JWT excepto los marcados como [PUBLIC].
Header: `Authorization: Bearer <token>`

## Modulos

### Auth
| Metodo | Endpoint | Descripcion | Permiso |
|--------|----------|-------------|---------|
| POST | /api/v1/auth/login | Iniciar sesion | [PUBLIC] |
| POST | /api/v1/auth/refresh | Refrescar token | [PUBLIC] |
| POST | /api/v1/auth/logout | Cerrar sesion | Autenticado |
| GET | /api/v1/auth/me | Obtener usuario actual | Autenticado |

### Organizacion y Permisos
| Metodo | Endpoint | Descripcion | Permiso |
|--------|----------|-------------|---------|
| GET | /api/v1/permissions | Listar permisos | Autenticado |
| GET | /api/v1/organizations | Listar organizaciones | Autenticado |
| GET | /api/v1/branches | Listar sucursales | Autenticado |
| GET | /api/v1/users/{userId}/roles | Listar roles de usuario | Autenticado |
| PUT | /api/v1/users/{userId}/roles | Actualizar roles de usuario | Autenticado |

### Personas
| Metodo | Endpoint | Descripcion | Permiso |
|--------|----------|-------------|---------|
| GET | /api/v1/persons | Buscar personas | persona.ver |
| GET | /api/v1/persons/{personId} | Obtener persona por ID | persona.ver |
| POST | /api/v1/persons | Crear persona | persona.crear |
| PUT | /api/v1/persons/{personId} | Actualizar persona | persona.crear |
| GET | /api/v1/persons/{personId}/contacts | Listar contactos | persona.ver |
| POST | /api/v1/persons/{personId}/contacts | Crear contacto | persona.crear |
| PUT | /api/v1/persons/{personId}/contacts/{contactId} | Actualizar contacto | persona.crear |
| GET | /api/v1/persons/{personId}/addresses | Listar direcciones | persona.ver |
| POST | /api/v1/persons/{personId}/addresses | Crear direccion | persona.crear |
| PUT | /api/v1/persons/{personId}/addresses/{addressId} | Actualizar direccion | persona.crear |

### Vehiculos
| Metodo | Endpoint | Descripcion | Permiso |
|--------|----------|-------------|---------|
| GET | /api/v1/vehicles | Buscar vehiculos | vehiculo.ver |
| GET | /api/v1/vehicles/{vehicleId} | Obtener vehiculo por ID | vehiculo.ver |
| POST | /api/v1/vehicles | Crear vehiculo | vehiculo.crear |
| PUT | /api/v1/vehicles/{vehicleId} | Actualizar vehiculo | vehiculo.crear |
| GET | /api/v1/vehicles/brands | Listar marcas | vehiculo.ver |
| GET | /api/v1/vehicles/models | Listar modelos | vehiculo.ver |
| GET | /api/v1/vehicles/{vehicleId}/persons | Listar personas de vehiculo | vehiculo.ver |
| POST | /api/v1/vehicles/{vehicleId}/persons | Crear relacion vehiculo-persona | vehiculo.crear |
| PUT | /api/v1/vehicles/{vehicleId}/persons/{relationId} | Actualizar relacion vehiculo-persona | vehiculo.crear |

### Casos
| Metodo | Endpoint | Descripcion | Permiso |
|--------|----------|-------------|---------|
| GET | /api/v1/cases | Listar casos | Autenticado |
| GET | /api/v1/cases/catalogs | Listar catalogos de casos | Autenticado |
| GET | /api/v1/cases/{caseId} | Obtener caso por ID | Autenticado |
| POST | /api/v1/cases | Crear caso | Autenticado |
| PUT | /api/v1/cases/{caseId} | Actualizar caso | Autenticado |
| GET | /api/v1/cases/{caseId}/relations | Listar relaciones | Autenticado |
| POST | /api/v1/cases/{caseId}/relations | Crear relacion | Autenticado |
| POST | /api/v1/cases/{caseId}/workflow/transitions | Transicionar workflow | Autenticado |
| GET | /api/v1/cases/{caseId}/workflow/history | Historial de workflow | Autenticado |
| GET | /api/v1/cases/{caseId}/workflow/actions | Listar acciones de workflow | Autenticado |
| GET | /api/v1/cases/{caseId}/audit/events | Listar eventos de auditoria | Autenticado |

### Gestion de Casos
| Metodo | Endpoint | Descripcion | Permiso |
|--------|----------|-------------|---------|
| POST | /api/v1/cases/{caseId}/persons | Agregar persona a caso | Autenticado |
| POST | /api/v1/cases/{caseId}/vehicles | Agregar vehiculo a caso | Autenticado |
| PUT | /api/v1/cases/{caseId}/incident | Actualizar incidente | Autenticado |

### Turnos
| Metodo | Endpoint | Descripcion | Permiso |
|--------|----------|-------------|---------|
| GET | /api/v1/cases/{caseId}/appointments | Listar turnos | turno.ver |
| POST | /api/v1/cases/{caseId}/appointments | Crear turno | turno.crear |
| PUT | /api/v1/appointments/{appointmentId} | Actualizar turno | turno.crear |

### Ingreso de Vehiculos
| Metodo | Endpoint | Descripcion | Permiso |
|--------|----------|-------------|---------|
| GET | /api/v1/cases/{caseId}/vehicle-intakes | Listar ingresos | ingreso.ver |
| POST | /api/v1/cases/{caseId}/vehicle-intakes | Crear ingreso | ingreso.crear |
| PUT | /api/v1/vehicle-intakes/{intakeId} | Actualizar ingreso | ingreso.crear |
| GET | /api/v1/vehicle-intakes/{intakeId}/items | Listar items | ingreso.ver |
| POST | /api/v1/vehicle-intakes/{intakeId}/items | Crear item | ingreso.crear |

### Egreso de Vehiculos
| Metodo | Endpoint | Descripcion | Permiso |
|--------|----------|-------------|---------|
| GET | /api/v1/cases/{caseId}/vehicle-outcomes | Listar egresos | egreso.ver |
| POST | /api/v1/cases/{caseId}/vehicle-outcomes | Crear egreso | egreso.crear |
| PUT | /api/v1/vehicle-outcomes/{outcomeId} | Actualizar egreso | egreso.crear |

### Tareas Operativas
| Metodo | Endpoint | Descripcion | Permiso |
|--------|----------|-------------|---------|
| GET | /api/v1/tasks | Listar tareas | tarea.ver |
| POST | /api/v1/tasks | Crear tarea | tarea.crear |
| PUT | /api/v1/tasks/{taskId} | Actualizar tarea | tarea.crear |

### Catalogos de Operacion
| Metodo | Endpoint | Descripcion | Permiso |
|--------|----------|-------------|---------|
| GET | /api/v1/operation/catalogs | Listar catalogos | Autenticado |

### Presupuesto y Repuestos
| Metodo | Endpoint | Descripcion | Permiso |
|--------|----------|-------------|---------|
| GET | /api/v1/cases/{caseId}/budget | Obtener presupuesto | presupuesto.ver |
| PUT | /api/v1/cases/{caseId}/budget | Crear o actualizar presupuesto | presupuesto.crear |
| POST | /api/v1/cases/{caseId}/budget/close | Cerrar presupuesto | presupuesto.crear |
| GET | /api/v1/cases/{caseId}/budget/items | Listar items | presupuesto.ver |
| POST | /api/v1/cases/{caseId}/budget/items | Crear item | presupuesto.crear |
| PUT | /api/v1/cases/{caseId}/budget/items/{itemId} | Actualizar item | presupuesto.crear |
| GET | /api/v1/cases/{caseId}/parts | Listar repuestos | presupuesto.ver |
| POST | /api/v1/cases/{caseId}/parts | Crear repuesto | presupuesto.crear |
| PUT | /api/v1/cases/{caseId}/parts/{partId} | Actualizar repuesto | presupuesto.crear |

### Finanzas
| Metodo | Endpoint | Descripcion | Permiso |
|--------|----------|-------------|---------|
| GET | /api/v1/finance/catalogs | Listar catalogos | finanza.ver |
| GET | /api/v1/cases/{caseId}/financial-movements | Listar movimientos | finanza.ver |
| POST | /api/v1/cases/{caseId}/financial-movements | Crear movimiento | finanza.crear |
| GET | /api/v1/cases/{caseId}/receipts | Listar recibos | finanza.ver |
| POST | /api/v1/cases/{caseId}/receipts | Crear recibo | finanza.crear |
| GET | /api/v1/cases/{caseId}/finance-summary | Resumen financiero | finanza.ver |
| POST | /api/v1/financial-movements/{movementId}/retentions | Agregar retenciones | finanza.crear |
| POST | /api/v1/financial-movements/{movementId}/applications | Agregar aplicaciones | finanza.crear |

### Documentos
| Metodo | Endpoint | Descripcion | Permiso |
|--------|----------|-------------|---------|
| GET | /api/v1/documents/catalogs | Listar catalogos | documento.ver |
| POST | /api/v1/documents | Subir documento | documento.crear |
| GET | /api/v1/documents/{documentId} | Obtener documento | documento.ver |
| PUT | /api/v1/documents/{documentId} | Actualizar documento | documento.crear |
| POST | /api/v1/documents/{documentId}/relations | Crear relacion | documento.crear |
| PUT | /api/v1/document-relations/{relationId} | Actualizar relacion | documento.crear |
| POST | /api/v1/documents/{documentId}/replace | Reemplazar documento | documento.crear |
| GET | /api/v1/cases/{caseId}/documents | Listar documentos de caso | documento.ver |
| GET | /api/v1/cases/{caseId}/documents/{documentId}/download | Descargar documento | documento.ver |

### Seguros y Legal
| Metodo | Endpoint | Descripcion | Permiso |
|--------|----------|-------------|---------|
| GET | /api/v1/insurance/catalogs | Listar catalogos | seguro.ver |
| GET | /api/v1/insurance/companies | Listar companias | seguro.ver |
| POST | /api/v1/insurance/companies | Crear compania | seguro.crear |
| GET | /api/v1/insurance/companies/{companyId}/contacts | Listar contactos | seguro.ver |
| POST | /api/v1/insurance/companies/{companyId}/contacts | Crear contacto | seguro.crear |
| GET | /api/v1/cases/{caseId}/insurance | Obtener seguro | seguro.ver |
| PUT | /api/v1/cases/{caseId}/insurance | Actualizar seguro | seguro.crear |
| GET | /api/v1/cases/{caseId}/insurance-processing | Obtener procesamiento | seguro.ver |
| PUT | /api/v1/cases/{caseId}/insurance-processing | Actualizar procesamiento | seguro.crear |
| GET | /api/v1/cases/{caseId}/franchise | Obtener franquicia | seguro.ver |
| PUT | /api/v1/cases/{caseId}/franchise | Actualizar franquicia | seguro.crear |
| GET | /api/v1/cases/{caseId}/cleas | Obtener CLEAS | seguro.ver |
| PUT | /api/v1/cases/{caseId}/cleas | Actualizar CLEAS | seguro.crear |
| GET | /api/v1/cases/{caseId}/third-party | Obtener tercero | seguro.ver |
| PUT | /api/v1/cases/{caseId}/third-party | Actualizar tercero | seguro.crear |
| GET | /api/v1/cases/{caseId}/legal | Obtener legal | seguro.ver |
| PUT | /api/v1/cases/{caseId}/legal | Actualizar legal | seguro.crear |
| GET | /api/v1/cases/{caseId}/legal-news | Listar novedades | seguro.ver |
| POST | /api/v1/cases/{caseId}/legal-news | Crear novedad | seguro.crear |
| GET | /api/v1/cases/{caseId}/legal-expenses | Listar gastos | seguro.ver |
| POST | /api/v1/cases/{caseId}/legal-expenses | Crear gasto | seguro.crear |

### Recuperos
| Metodo | Endpoint | Descripcion | Permiso |
|--------|----------|-------------|---------|
| GET | /api/v1/cases/{caseId}/franchise-recovery | Obtener recupero | recupero.ver |
| PUT | /api/v1/cases/{caseId}/franchise-recovery | Actualizar recupero | recupero.crear |

### Notificaciones
| Metodo | Endpoint | Descripcion | Permiso |
|--------|----------|-------------|---------|
| GET | /api/v1/notifications/unread | No leidas | Autenticado |
| GET | /api/v1/notifications | Todas | Autenticado |
| GET | /api/v1/notifications/count-unread | Contar no leidas | Autenticado |
| PUT | /api/v1/notifications/{notificationId}/read | Marcar leida | Autenticado |
| POST | /api/v1/notifications | Crear notificacion | Autenticado |

### Parametros del Sistema
| Metodo | Endpoint | Descripcion | Permiso |
|--------|----------|-------------|---------|
| GET | /api/v1/system/parameters | Listar parametros | parametro.ver |
| GET | /api/v1/system/parameters/{code} | Obtener parametro | parametro.ver |
| PUT | /api/v1/system/parameters/{code} | Actualizar parametro | parametro.editar |

### Estado Publico
| Metodo | Endpoint | Descripcion | Permiso |
|--------|----------|-------------|---------|
| GET | /ping | Health check | [PUBLIC] |

---

## DTOs de Request/Response

### Auth
- `LoginRequest`: `{ email: string, password: string }`
- `AuthTokenResponse`: `{ accessToken: string, refreshToken: string, expiresInSeconds: long, user: AuthenticatedUserResponse }`
- `AuthenticatedUserResponse`: `{ id: string, displayName: string, role: string }`
- `RefreshTokenRequest`: `{ refreshToken: string }`
- `LogoutRequest`: `{ refreshToken: string, revokeAllSessions: boolean }`

### Organizacion
- `PermissionResponse`: permisos del sistema
- `OrganizationResponse`: organizaciones
- `BranchResponse`: sucursales
- `UserRoleAssignmentResponse`: asignaciones de roles
- `UserRolesUpdateRequest`: actualizacion de roles

### Personas
- `PersonResponse`: `{ id, publicId, tipoPersona, nombre, apellido, razonSocial, nombreMostrar, tipoDocumentoCodigo, numeroDocumento, numeroDocumentoNormalizado, cuitCuil, fechaNacimiento, telefonoPrincipal, emailPrincipal, ocupacion, observaciones, activo }`
- `PersonUpsertRequest`: creacion/actualizacion de persona
- `PersonContactResponse` / `PersonContactUpsertRequest`: contactos
- `PersonAddressResponse` / `PersonAddressUpsertRequest`: direcciones

### Vehiculos
- `VehicleResponse`: `{ id, publicId, brandId, modelId, brandText, modelText, plate, normalizedPlate, year, vehicleTypeCode, usageCode, color, paintCode, chasis, motor, transmissionCode, mileage, observaciones, activo }`
- `VehicleUpsertRequest`: creacion/actualizacion
- `VehicleBrandResponse`: marcas
- `VehicleModelResponse`: modelos
- `VehiclePersonResponse` / `VehiclePersonUpsertRequest`: relaciones persona-vehiculo

### Casos
- `CaseResponse`: `{ id, publicId, folderCode, orderNumber, caseTypeId, caseTypeCode, organizationId, branchId, branchCode, principalVehicleId, principalCustomerPersonId, referenced, currentCaseStateId, currentCaseStateCode, currentRepairStateId, currentRepairStateCode, currentPaymentStateId, currentPaymentStateCode, currentDocumentationStateId, currentDocumentationStateCode, currentLegalStateId, currentLegalStateCode, priorityCode, generalObservations, closedAt, archivedAt }`
- `CasePageResponse`: pagina de casos
- `CaseCreateRequest` / `CaseUpdateRequest`: creacion/actualizacion
- `CaseCatalogsResponse`: catalogos
- `CaseRelationResponse` / `CaseRelationCreateRequest`: relaciones
- `CaseWorkflowTransitionRequest`: transicion de workflow
- `CaseWorkflowHistoryResponse`: historial
- `CaseWorkflowActionsResponse`: acciones disponibles
- `CaseAuditEventResponse`: eventos de auditoria

### Gestion de Casos
- `CasePersonAddRequest`: agregar persona
- `CaseVehicleAddRequest`: agregar vehiculo
- `CaseIncidentUpdateRequest`: actualizar incidente

### Turnos
- `RepairAppointmentResponse` / `RepairAppointmentCreateRequest` / `RepairAppointmentUpdateRequest`

### Ingreso de Vehiculos
- `VehicleIntakeResponse` / `VehicleIntakeCreateRequest` / `VehicleIntakeUpdateRequest`
- `VehicleIntakeItemResponse` / `VehicleIntakeItemCreateRequest`

### Egreso de Vehiculos
- `VehicleOutcomeResponse` / `VehicleOutcomeCreateRequest` / `VehicleOutcomeUpdateRequest`

### Tareas Operativas
- `OperationalTaskResponse` / `OperationalTaskCreateRequest` / `OperationalTaskUpdateRequest`
- `OperationalTaskPageResponse`: pagina de tareas

### Presupuesto y Repuestos
- `BudgetResponse`: `{ id, caseId, organizationId, branchId, budgetDate, reportStatusCode, laborWithoutVat, vatRate, laborVat, laborWithVat, partsTotal, totalQuoted, estimatedDays, minimumCloseAmount, observations, currentVersion, items }`
- `BudgetUpsertRequest` / `BudgetCloseRequest`
- `BudgetItemResponse` / `BudgetItemCreateRequest` / `BudgetItemUpdateRequest`
- `CasePartResponse` / `CasePartCreateRequest` / `CasePartUpdateRequest`

### Finanzas
- `FinancialMovementResponse`: `{ id, publicId, caseId, receiptId, movementTypeCode, flowOriginCode, counterpartyTypeCode, counterpartyPersonId, counterpartyCompanyId, movementAt, grossAmount, netAmount, paymentMethodCode, paymentMethodDetail, cancellationTypeCode, advancePayment, bonification, reason, externalReference, registeredBy, createdAt, updatedAt, retentions, applications }`
- `FinancialMovementCreateRequest`
- `IssuedReceiptResponse` / `IssuedReceiptCreateRequest`
- `FinanceCaseSummaryResponse`
- `FinancialMovementRetentionResponse` / `FinancialMovementRetentionRequest`
- `FinancialMovementApplicationResponse` / `FinancialMovementApplicationRequest`
- `FinanceCatalogsResponse`

### Documentos
- `DocumentResponse`: `{ id, publicId, fileName, extension, mimeType, sizeBytes, checksumSha256, categoryId, subcategoryCode, documentDate, uploadedBy, originCode, observations, replacesDocumentId, active, createdAt, updatedAt }`
- `DocumentUploadRequest` / `DocumentUpdateRequest` / `DocumentReplaceRequest`
- `DocumentRelationResponse` / `DocumentRelationCreateRequest` / `DocumentRelationUpdateRequest`
- `CaseDocumentResponse`
- `DocumentCatalogsResponse` / `DocumentCategoryResponse`

### Seguros y Legal
- `InsuranceCatalogsResponse`
- `InsuranceCompanyResponse` / `InsuranceCompanyCreateRequest`
- `InsuranceCompanyContactResponse` / `InsuranceCompanyContactCreateRequest`
- `CaseInsuranceResponse` / `CaseInsuranceUpsertRequest`
- `InsuranceProcessingResponse` / `InsuranceProcessingUpsertRequest`
- `CaseFranchiseResponse` / `CaseFranchiseUpsertRequest`
- `CaseCleasResponse` / `CaseCleasUpsertRequest`
- `CaseThirdPartyResponse` / `CaseThirdPartyUpsertRequest`
- `CaseLegalResponse` / `CaseLegalUpsertRequest`
- `LegalNewsResponse` / `LegalNewsCreateRequest`
- `LegalExpenseResponse` / `LegalExpenseCreateRequest`

### Recuperos
- `FranchiseRecoveryResponse`: `{ id, caseId, managerCode, baseCaseId, baseFolderCode, opinionCode, agreedAmount, recoveryAmount, enablesRepair, recoversClient, clientAmount, clientPaymentStatusCode, clientPaymentDate, approvedLowerAgreement, approvalNote, reusesBaseData }`
- `FranchiseRecoveryUpsertRequest`

### Notificaciones
- `NotificationResponse`: `{ id, userId, caseId, typeCode, title, message, read, readAt, actionUrl, entityType, entityId, createdAt }`
- `NotificationCreateRequest`

### Parametros del Sistema
- `SystemParameterResponse`: `{ id, code, value, dataTypeCode, description, editable, visible, moduleCode }`
- `SystemParameterUpsertRequest`

### Estado Publico
- `PingResponse`: `{ status: string, service: string }`

---

## Catalogos Comunes

Lista de endpoints de catalogos del sistema:

| Endpoint | Modulo |
|----------|--------|
| GET /api/v1/cases/catalogs | Casos |
| GET /api/v1/operation/catalogs | Operacion |
| GET /api/v1/finance/catalogs | Finanzas |
| GET /api/v1/insurance/catalogs | Seguros |
| GET /api/v1/documents/catalogs | Documentos |
| GET /api/v1/vehicles/brands | Vehiculos |
| GET /api/v1/vehicles/models | Vehiculos |
| GET /api/v1/permissions | Organizacion |
| GET /api/v1/organizations | Organizacion |
| GET /api/v1/branches | Organizacion |

---

## Codigos de Estado HTTP

| Codigo | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |

---

## Seguridad

- Todos los endpoints protegidos requieren un header `Authorization: Bearer <token>`
- El token JWT se obtiene mediante `/api/v1/auth/login`
- El token expira y puede refrescarse mediante `/api/v1/auth/refresh`
- Algunos endpoints requieren permisos especificos (ver columnas `Permiso` en las tablas)

## Swagger UI

La documentacion interactiva de la API esta disponible en:
- Swagger UI: `/swagger-ui.html`
- OpenAPI JSON: `/v3/api-docs`
