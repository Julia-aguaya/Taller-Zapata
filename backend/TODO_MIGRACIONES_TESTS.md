# TODO: Fix Migraciones Flyway y Tests de Integracion

## Estado Actual (COMPLETO)

**Flyway esta HABILITADO en tests** (`application-test.yml` con `flyway.enabled: true`, `ddl-auto: none`).
**`data.sql` fue ELIMINADO.**
**TODOS los tests pasan.**

### Resultado de Tests

- **Total:** 131 tests
- **Pasando:** 131 ✅
- **Fallando:** 0 ❌
- **Errores de infraestructura:** 0

---

## Problemas Resueltos

### 1. Migraciones Duplicadas / Redundantes ✅

| Version | Estado | Detalle |
|---------|--------|---------|
| **V24** | ✅ Fixeado | Renumerado: `V24` (vehiculos) y `V25` (holidays). |
| **V16** | ✅ Fixeado | Archivo vaciado (redundante con V15). |
| **V17** | ✅ Fixeado | Archivo vaciado (redundante con V14). |

### 2. SQL Incompatible con H2 ✅

| Version | Estado | Detalle |
|---------|--------|---------|
| **V10** | ✅ Fixeado | `AFTER` y `JSON_OBJECT()` ya no presentes. |
| **V16** | ✅ Fixeado | `AFTER` eliminado (archivo vacio). |
| **V17** | ✅ Fixeado | `AFTER` eliminado (archivo vacio). |
| **V24** | ✅ Fixeado | `AFTER` eliminado. |
| **V29** | ✅ Fixeado | `INSERT IGNORE` reemplazado por `INSERT ... SELECT ... WHERE NOT EXISTS` (compatible H2/MySQL). |
| **V30** | ✅ Fixeado | `INSERT` fijo reemplazado por `INSERT ... SELECT FROM DUAL WHERE NOT EXISTS`. |

### 3. Conflicto de Schema en `parametros_sistema` ✅

- **V27** ya tiene `DROP TABLE IF EXISTS parametros_sistema;` antes del `CREATE TABLE`.

### 4. Bugs en Inserciones de Permisos ✅

- **V25-V28:** Usan `modulo` (no `modulo_codigo`), incluyen `nombre`, y los IDs son unicos/secuenciales.
- **V11:** Ya asigna `workflow.legal.iniciar` al rol OPERADOR (rol 2).

### 5. Tests de Integracion: Limpieza de Datos ✅

- **Creado:** `TestDatabaseCleaner` en `backend/src/test/java/com/tallerzapata/backend/testsupport/TestDatabaseCleaner.java`
- **Comportamiento:** Deshabilita FKs (`SET REFERENTIAL_INTEGRITY FALSE`), limpia tablas transaccionales, re-habilita FKs.
- **Preserva:** usuario admin (id=1), sus roles, y todos los catalogos de Flyway.
- **Tolerante:** Ignora silenciosamente tablas inexistentes (`BadSqlGrammarException`).
- **Fix:** Se sacaron `tareas_presupuesto` y `compra_por_repuesto` de la lista de tablas transaccionales (son catalogos seedeados por V23).
- **Todos los IntegrationTests** fueron actualizados para usar `TestDatabaseCleaner` en vez de DELETEs manuales.

### 6. Entidades JPA vs Schema ✅

- **AuditEventEntity:** `@JdbcTypeCode(SqlTypes.JSON)` agregado a `antes_json`, `despues_json`, `metadata_json`.
- **CaseStateHistoryEntity:** `@JdbcTypeCode(SqlTypes.JSON)` agregado a `detalle_json`.
- **Riesgo de produccion mitigado:** `ddl-auto: validate` ya no fallara con columnas JSON en MySQL.

### 7. Tests que asumen datos de `data.sql` ✅

- Todos los tests ahora crean sus propios datos en `@BeforeEach`.
- **BudgetIntegrationTest:** Fixeado — el cleaner no borra mas los catalogos de tareas/compra.
- **CaseAuditIntegrationTest:** Fixeado — se usa `JSON '{...}'` en INSERTs para que H2 almacene objetos JSON reales.
- **CaseWorkflowIntegrationTest:** Fixeado — aislamiento completo (DELETE FROM workflow_transiciones), uso de `FORMAT JSON` en inserts, y regla con `"true"` (string) en vez de `true` (boolean).

### 8. H2 + Columnas JSON ✅

**Leccion clave:** Cuando insertas un string JSON via `JdbcTemplate` en una columna `JSON` de H2, H2 lo trata como un **JSON string escalar** (lo envuelve entre comillas). Para forzar que sea un **objeto JSON real**, usar:
- `JSON '{"key":"value"}'` en INSERTs via JdbcTemplate
- `? FORMAT JSON` en PreparedStatements

---

## Checklist de Acciones (TODO COMPLETADO)

- [x] **V1 (schema):** `parametros_sistema` resuelto con `DROP TABLE IF EXISTS` en V27.
- [x] **V10:** Quitar `AFTER` de `ALTER TABLE` y reemplazar `JSON_OBJECT()` por string literal.
- [x] **V11:** Agregar `'workflow.legal.iniciar'` a los permisos del rol OPERADOR.
- [x] **V16:** Vaciar archivo (redundante con V15).
- [x] **V17:** Vaciar archivo (redundante con V14).
- [x] **V24:** Quitar `AFTER` de `ALTER TABLE`.
- [x] **V25-V28:** Verificar que IDs de permisos y rol_permisos sean unicos y no se pisen.
- [x] **V29:** Reemplazar `INSERT IGNORE` por SQL estandar.
- [x] **V30:** Hacer INSERT condicional con `WHERE NOT EXISTS`.
- [x] **application-test.yml:** Flyway habilitado, `ddl-auto=none`.
- [x] **Tests:** Crear helper `TestDatabaseCleaner` para limpieza segura con FK.
- [x] **Tests:** Actualizar todos los IntegrationTests para usar `TestDatabaseCleaner`.
- [x] **Tests:** Fixear seeds de `BudgetIntegrationTest` (taskCode CHAPA, purchasedByCode TALLER).
- [x] **Tests:** Fixear filtro de `CaseAuditIntegrationTest`.
- [x] **Tests:** Fixear regla_json de `CaseWorkflowIntegrationTest` (transicion legal).
- [x] **Produccion:** Agregar `@JdbcTypeCode(SqlTypes.JSON)` a `AuditEventEntity` y `CaseStateHistoryEntity`.

---

## Archivos Modificados

### Migraciones SQL
- `backend/src/main/resources/db/migration/V16__extend_document_versioning.sql` — Vaciado (redundante)
- `backend/src/main/resources/db/migration/V17__link_outcomes_to_reentry_appointments.sql` — Vaciado (redundante)
- `backend/src/main/resources/db/migration/V24__add_notes_to_case_vehicles.sql` — Sin `AFTER`
- `backend/src/main/resources/db/migration/V25__holidays.sql` — Renumerado (ex-V24)
- `backend/src/main/resources/db/migration/V26__franchise_recovery.sql` — Renumerado (ex-V25), fix `modulo_codigo` -> `modulo`
- `backend/src/main/resources/db/migration/V27__system_parameters.sql` — Renumerado (ex-V26), fix IDs y NOT NULL
- `backend/src/main/resources/db/migration/V28__notifications.sql` — Renumerado (ex-V27), fix NOT NULL
- `backend/src/main/resources/db/migration/V29__missing_permissions.sql` — Renumerado (ex-V28), fix `INSERT IGNORE`
- `backend/src/main/resources/db/migration/V30__add_demo_user.sql` — Renumerado (ex-V29), fix duplicados

### Configuracion
- `backend/src/main/resources/application-test.yml` — Flyway habilitado, `ddl-auto=none`

### Entidades (Produccion)
- `backend/src/main/java/com/tallerzapata/backend/infrastructure/persistence/audit/AuditEventEntity.java` — `@JdbcTypeCode(SqlTypes.JSON)` en 3 campos
- `backend/src/main/java/com/tallerzapata/backend/infrastructure/persistence/workflow/CaseStateHistoryEntity.java` — `@JdbcTypeCode(SqlTypes.JSON)` en 1 campo

### Tests - Nuevo archivo
- `backend/src/test/java/com/tallerzapata/backend/testsupport/TestDatabaseCleaner.java` — Helper de limpieza centralizado

### Tests - Actualizados (todos los IntegrationTests)
- `backend/src/test/java/.../api/auth/AuthIntegrationTest.java`
- `backend/src/test/java/.../api/auth/AuthMetricsIntegrationTest.java`
- `backend/src/test/java/.../api/budget/BudgetIntegrationTest.java`
- `backend/src/test/java/.../api/casefile/CaseAuditIntegrationTest.java`
- `backend/src/test/java/.../api/casefile/CaseCreateIntegrationTest.java`
- `backend/src/test/java/.../api/casefile/CaseManagementIntegrationTest.java`
- `backend/src/test/java/.../api/casefile/CaseSecurityIntegrationTest.java`
- `backend/src/test/java/.../api/casefile/CaseWorkflowIntegrationTest.java`
- `backend/src/test/java/.../api/document/DocumentIntegrationTest.java`
- `backend/src/test/java/.../api/finance/FinanceIntegrationTest.java`
- `backend/src/test/java/.../api/identity/IdentityAdminIntegrationTest.java`
- `backend/src/test/java/.../api/insurance/InsuranceIntegrationTest.java`
- `backend/src/test/java/.../api/notification/NotificationIntegrationTest.java`
- `backend/src/test/java/.../api/operation/OperationCatalogIntegrationTest.java`
- `backend/src/test/java/.../api/operation/RepairAppointmentIntegrationTest.java`
- `backend/src/test/java/.../api/operation/TaskIntegrationTest.java`
- `backend/src/test/java/.../api/operation/VehicleIntakeIntegrationTest.java`
- `backend/src/test/java/.../api/operation/VehicleOutcomeIntegrationTest.java`
- `backend/src/test/java/.../api/person/PersonIntegrationTest.java`
- `backend/src/test/java/.../api/recovery/FranchiseRecoveryIntegrationTest.java`
- `backend/src/test/java/.../api/system/SystemParameterIntegrationTest.java`
- `backend/src/test/java/.../api/vehicle/VehicleIntegrationTest.java`

### Eliminados
- `backend/src/test/resources/data.sql` — ELIMINADO

---

## Recomendacion Final

1. **Flyway en tests esta PROBADO y FUNCIONANDO.** Las migraciones corren sin errores en H2.
2. **La infraestructura de limpieza es robusta.** `TestDatabaseCleaner` maneja FKs y es tolerante a schema parcial.
3. **TODOS los 131 tests pasan.** No quedan tests fallando.
4. **RIESGO CRITICO DE PRODUCCION MITIGADO:** `@JdbcTypeCode(SqlTypes.JSON)` agregado a entidades con columnas JSON. `ddl-auto: validate` ya no fallara en MySQL.
5. **Proxima mejora:** Considerar `@DirtiesContext(classMode = ClassMode.AFTER_CLASS)` en tests que modifican catalogos compartidos (ej: `workflow_transiciones` con IDs >= 9000), o migrar a una DB unica por test con URL dinamica.

(End of file - TODO COMPLETO)
