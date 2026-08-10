package com.tallerzapata.backend.api.budget;

import com.tallerzapata.backend.application.budget.BudgetService;
import com.tallerzapata.backend.application.budget.PartLabelPdfService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Presupuesto y Repuestos", description = "Gestion de presupuestos, items, repuestos y partes de un caso")
public class BudgetController {
    private final BudgetService budgetService;
    private final PartLabelPdfService partLabelPdfService;

    public BudgetController(BudgetService budgetService, PartLabelPdfService partLabelPdfService) {
        this.budgetService = budgetService;
        this.partLabelPdfService = partLabelPdfService;
    }

    @Operation(summary = "Listar catalogos de presupuesto", description = "Devuelve los catalogos disponibles para presupuesto")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('presupuesto.ver')")
    @GetMapping("/budget/catalogs")
    public BudgetCatalogsResponse listCatalogs() {
        return budgetService.listCatalogs();
    }

    @Operation(summary = "Listar catalogos de repuestos", description = "Devuelve los catalogos disponibles para repuestos (estados, provisto por, estado de pago, autorizaciones)")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('presupuesto.ver')")
    @GetMapping("/budget/parts/catalogs")
    public PartsCatalogsResponse listPartsCatalogs() {
        return budgetService.listPartsCatalogs();
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

    @Operation(summary = "Eliminar repuesto de caso", description = "Elimina un repuesto/pieza de un caso sin modificar el presupuesto")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @DeleteMapping("/cases/{caseId}/parts/{partId}")
    public void deleteCasePart(@PathVariable Long caseId, @PathVariable Long partId, HttpServletRequest httpRequest) {
        budgetService.deleteCasePart(caseId, partId, httpRequest);
    }

    @Operation(summary = "Sincronizar repuestos desde presupuesto", description = "Crea repuestos de caso a partir de los items del presupuesto que indican REEMPLAZAR")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @PostMapping("/cases/{caseId}/parts/sync-from-budget")
    public List<CasePartResponse> syncPartsFromBudget(@PathVariable Long caseId, HttpServletRequest httpRequest) {
        return budgetService.syncPartsFromBudget(caseId, httpRequest);
    }

    @Operation(summary = "Descargar PDF del presupuesto", description = "Genera y devuelve el PDF del presupuesto. Requiere que el presupuesto este CERRADO.")
    @ApiResponse(responseCode = "200", description = "PDF generado")
    @ApiResponse(responseCode = "404", description = "Caso o presupuesto no encontrado")
    @ApiResponse(responseCode = "409", description = "El presupuesto no esta CERRADO")
    @PreAuthorize("hasAuthority('presupuesto.ver')")
    @GetMapping("/cases/{caseId}/budget/pdf")
    public ResponseEntity<byte[]> downloadBudgetPdf(@PathVariable Long caseId) {
        byte[] pdfBytes = budgetService.generatePdf(caseId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.inline().filename("presupuesto-" + caseId + ".pdf").build());
        headers.setContentLength(pdfBytes.length);
        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }

    @Operation(summary = "Descargar etiqueta de repuesto", description = "Genera y devuelve el PDF de la etiqueta del repuesto")
    @ApiResponse(responseCode = "200", description = "PDF generado")
    @PreAuthorize("hasAuthority('presupuesto.ver')")
    @GetMapping("/cases/{caseId}/parts/{partId}/label")
    public ResponseEntity<byte[]> downloadPartLabel(@PathVariable Long caseId, @PathVariable Long partId) {
        byte[] pdfBytes = partLabelPdfService.generate(caseId, partId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=etiqueta-" + partId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
