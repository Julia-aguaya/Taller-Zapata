package com.tallerzapata.backend.api.budget;

import com.tallerzapata.backend.application.budget.BudgetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Presupuesto y Repuestos", description = "Gestion de presupuestos, items, repuestos y partes de un caso")
public class BudgetController {
    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @Operation(summary = "Obtener presupuesto", description = "Devuelve el presupuesto de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('presupuesto.ver')")
    @GetMapping("/cases/{caseId}/budget")
    public BudgetResponse getBudget(@PathVariable Long caseId) {
        return budgetService.getBudget(caseId);
    }

    @Operation(summary = "Crear o actualizar presupuesto", description = "Crea o actualiza el presupuesto de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @PutMapping("/cases/{caseId}/budget")
    public BudgetResponse upsertBudget(@PathVariable Long caseId, @Valid @RequestBody BudgetUpsertRequest request, HttpServletRequest httpRequest) {
        return budgetService.upsertBudget(caseId, request, httpRequest);
    }

    @Operation(summary = "Cerrar presupuesto", description = "Cierra el presupuesto de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @PostMapping("/cases/{caseId}/budget/close")
    public BudgetResponse closeBudget(@PathVariable Long caseId, @RequestBody BudgetCloseRequest request, HttpServletRequest httpRequest) {
        return budgetService.closeBudget(caseId, request, httpRequest);
    }

    @Operation(summary = "Listar items de presupuesto", description = "Devuelve los items de un presupuesto")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('presupuesto.ver')")
    @GetMapping("/cases/{caseId}/budget/items")
    public List<BudgetItemResponse> listBudgetItems(@PathVariable Long caseId) {
        return budgetService.listBudgetItems(caseId);
    }

    @Operation(summary = "Crear item de presupuesto", description = "Agrega un item al presupuesto de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @PostMapping("/cases/{caseId}/budget/items")
    public BudgetItemResponse createBudgetItem(@PathVariable Long caseId, @Valid @RequestBody BudgetItemCreateRequest request, HttpServletRequest httpRequest) {
        return budgetService.createBudgetItem(caseId, request, httpRequest);
    }

    @Operation(summary = "Actualizar item de presupuesto", description = "Actualiza un item del presupuesto de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @PutMapping("/cases/{caseId}/budget/items/{itemId}")
    public BudgetItemResponse updateBudgetItem(@PathVariable Long caseId, @PathVariable Long itemId, @Valid @RequestBody BudgetItemUpdateRequest request, HttpServletRequest httpRequest) {
        return budgetService.updateBudgetItem(caseId, itemId, request, httpRequest);
    }

    @Operation(summary = "Listar repuestos de caso", description = "Devuelve los repuestos/piezas asociadas a un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('presupuesto.ver')")
    @GetMapping("/cases/{caseId}/parts")
    public List<CasePartResponse> listCaseParts(@PathVariable Long caseId) {
        return budgetService.listCaseParts(caseId);
    }

    @Operation(summary = "Crear repuesto de caso", description = "Agrega un repuesto/pieza a un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @PostMapping("/cases/{caseId}/parts")
    public CasePartResponse createCasePart(@PathVariable Long caseId, @Valid @RequestBody CasePartCreateRequest request, HttpServletRequest httpRequest) {
        return budgetService.createCasePart(caseId, request, httpRequest);
    }

    @Operation(summary = "Actualizar repuesto de caso", description = "Actualiza un repuesto/pieza de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @PutMapping("/cases/{caseId}/parts/{partId}")
    public CasePartResponse updateCasePart(@PathVariable Long caseId, @PathVariable Long partId, @Valid @RequestBody CasePartUpdateRequest request, HttpServletRequest httpRequest) {
        return budgetService.updateCasePart(caseId, partId, request, httpRequest);
    }
}
