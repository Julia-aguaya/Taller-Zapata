# Refactor: Optimización de CaseService.list()

## Diagnóstico

`CaseService.list()` carga **TODA la tabla `casos`** en memoria con `findAll()` y filtra en Java. Por cada caso hace entre 8 y 20 queries individuales a la DB. Es un **N × 15 en promedio**.

```
1 request GET /api/v1/cases con 50 resultados:
  → 1 query findAll() (todas las filas de casos)
  → 50 × caseTypeRepository.findById()
  → 50 × branchRepository.findById()
  → 50 × workflowStateRepository.findById() × 5 dominios
  → 50 × caseVisibleStateResolver.resolveForCase() (~10 queries cada uno)
  → 50 × caseStateHistoryRepository (si hay filtro de fecha)
  → 50 × insuranceProcessingRepository (si hay filtro de opinion)
  → 50 × franchiseRecoveryRepository (si hay filtro de manager)
  ────────────────────────────────────────
  ≈ 1 + 250 + 500 + 50 + 50 + 50 = ~900 queries por request
```

---

## Plan de refactor

| # | Paso | Cambio | Impacto | Riesgo | Horas |
|---|------|--------|---------|--------|-------|
| 1 | **Paginacion real en DB** | Reemplazar `findAll()` por `findAll(Pageable)`. Scope/org/branch pasan a `WHERE` JPQL en vez de stream. | De 10K+ filas a 50. Mayor win. | Medio | 3-4h |
| 2 | **Batch-fetch toResponse** | `findAllById()` para caseTypes, branches, workflowStates. Pasar maps. Eliminar overloads duplicados. | De 350 queries a 7. | Bajo | 1-2h |
| 3 | **Pre-fetch filtros** | Batch queries: `findAllByCaseIdIn(caseIds)` para history, insurance, recovery, legal. | De 50×N queries a 4. | Bajo | 2-3h |
| 4 | **Batch visibleStateResolver** | `resolveForCases(List<CaseEntity>)` con bulk queries en vez de per-case. | De 500 queries a ~15. | Alto | 3-5h |
| 5 | **HTTP 400 para folderStatus** | Cambiar `ConflictException` (409) por error 400. | UX correcta. | Nulo | 15min |
| **Total** | | | | | **~10-15h** |

---

## Orden recomendado

1. **Pasos 1 + 2** (5-6h) — resuelven el 80% del problema. De ~900 queries a ~200.
2. **Paso 3** (2-3h) — baja a ~30 queries.
3. **Paso 4** (3-5h) — el mas invasivo, conviene dejarlo para despues de validar que 1-3 funcionan.
4. **Paso 5** (15min) — en cualquier momento.

---

## Archivos afectados

- `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseService.java` — principal
- `backend/src/main/java/com/tallerzapata/backend/application/casefile/CaseVisibleStateResolver.java` — batch
- `backend/src/main/java/com/tallerzapata/backend/infrastructure/persistence/casefile/CaseRepository.java` — nuevas queries JPQL
- `backend/src/main/java/com/tallerzapata/backend/api/casefile/CaseController.java` — sin cambios esperados
- Repos de history, insurance, recovery, legal — metodos `findAllByCaseIdIn()`

---

## Notas

- Este refactor es **ortogonal a la Fase 1** (busqueda textual). Los issues de N+1 son pre-existentes, no introducidos por nuestro cambio.
- El `findAll()` sin limite que usa `list()` ya existia desde el inicio del proyecto.
- Prioridad: media. Solo es critico si la base de datos crece a mas de 500-1000 casos.
