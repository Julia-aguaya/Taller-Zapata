package com.tallerzapata.backend.api.finance;

import com.tallerzapata.backend.application.finance.FinanceCatalogService;
import com.tallerzapata.backend.application.finance.FinanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Finanzas", description = "Gestion de movimientos financieros, recibos y resumen de caso")
public class FinanceController {
    private final FinanceCatalogService financeCatalogService;
    private final FinanceService financeService;

    public FinanceController(FinanceCatalogService financeCatalogService, FinanceService financeService) {
        this.financeCatalogService = financeCatalogService;
        this.financeService = financeService;
    }

    @Operation(summary = "Listar catalogos de finanzas", description = "Devuelve los catalogos disponibles para finanzas")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('finanza.ver')")
    @GetMapping("/finance/catalogs")
    public FinanceCatalogsResponse listCatalogs() { return financeCatalogService.listCatalogs(); }

    @Operation(summary = "Listar movimientos financieros", description = "Devuelve los movimientos financieros de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('finanza.ver')")
    @GetMapping("/cases/{caseId}/financial-movements")
    public List<FinancialMovementResponse> listMovements(@PathVariable Long caseId) { return financeService.listMovementsByCase(caseId); }

    @Operation(summary = "Crear movimiento financiero", description = "Crea un nuevo movimiento financiero para un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('finanza.crear')")
    @PostMapping("/cases/{caseId}/financial-movements")
    public FinancialMovementResponse createMovement(@PathVariable Long caseId, @Valid @RequestBody FinancialMovementCreateRequest request, HttpServletRequest httpRequest) { return financeService.createMovement(caseId, request, httpRequest); }

    @Operation(summary = "Listar recibos", description = "Devuelve los recibos emitidos de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('finanza.ver')")
    @GetMapping("/cases/{caseId}/receipts")
    public List<IssuedReceiptResponse> listReceipts(@PathVariable Long caseId) { return financeService.listReceiptsByCase(caseId); }

    @Operation(summary = "Generar comprobante de pago para el cliente", description = "PDF con todos los pagos, saldo deudor, factura y firma")
    @ApiResponse(responseCode = "200", description = "PDF generado")
    @PreAuthorize("hasAuthority('finanza.ver')")
    @GetMapping("/cases/{caseId}/finance/client-payment-pdf")
    public ResponseEntity<byte[]> getClientPaymentPdf(@PathVariable Long caseId,
            @RequestParam String clientName, @RequestParam String vehiclePlate, 
            @RequestParam String comprobanteTipo,
            @RequestParam(required = false) String observaciones,
            @RequestParam(required = false) String facturaRazonSocial,
            @RequestParam(required = false) String facturaNumero) {
        byte[] pdf = financeService.getClientPaymentPdf(caseId, clientName, vehiclePlate, comprobanteTipo, observaciones, facturaRazonSocial, facturaNumero);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=comprobante-pago-" + caseId + ".pdf").contentType(MediaType.APPLICATION_PDF).body(pdf);
    }

    @Operation(summary = "Crear recibo", description = "Emite un nuevo recibo para un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('finanza.crear')")
    @PostMapping("/cases/{caseId}/receipts")
    public IssuedReceiptResponse createReceipt(@PathVariable Long caseId, @Valid @RequestBody IssuedReceiptCreateRequest request, HttpServletRequest httpRequest) { return financeService.createReceipt(caseId, request, httpRequest); }

    @Operation(summary = "Descargar PDF del recibo", description = "Genera y devuelve el PDF de un recibo emitido")
    @ApiResponse(responseCode = "200", description = "PDF generado")
    @PreAuthorize("hasAuthority('finanza.ver')")
    @GetMapping("/receipts/{receiptId}/pdf")
    public ResponseEntity<byte[]> getReceiptPdf(@PathVariable Long receiptId) {
        byte[] pdf = financeService.getReceiptPdf(receiptId);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=recibo-" + receiptId + ".pdf").contentType(MediaType.APPLICATION_PDF).body(pdf);
    }

    @Operation(summary = "Resumen financiero de caso", description = "Devuelve un resumen financiero de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('finanza.ver')")
    @GetMapping("/cases/{caseId}/finance-summary")
    public FinanceCaseSummaryResponse summarize(@PathVariable Long caseId) { return financeService.summarizeCase(caseId); }

    @Operation(summary = "Resumen financiero particular", description = "Devuelve el resumen especifico para tramites particulares")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('finanza.ver')")
    @GetMapping("/cases/{caseId}/finance/particular-summary")
    public FinanceParticularSummaryResponse summarizeParticular(@PathVariable Long caseId) { return financeService.summarizeParticularCase(caseId); }

    @Operation(summary = "Agregar retenciones", description = "Agrega retenciones a un movimiento financiero")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('finanza.crear')")
    @PostMapping("/financial-movements/{movementId}/retentions")
    public List<FinancialMovementRetentionResponse> addRetentions(@PathVariable Long movementId, @Valid @RequestBody List<FinancialMovementRetentionRequest> requests, HttpServletRequest httpRequest) { return financeService.addRetentions(movementId, requests, httpRequest); }

    @Operation(summary = "Agregar aplicaciones", description = "Agrega aplicaciones/imputaciones a un movimiento financiero")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('finanza.crear')")
    @PostMapping("/financial-movements/{movementId}/applications")
    public List<FinancialMovementApplicationResponse> addApplications(@PathVariable Long movementId, @Valid @RequestBody List<FinancialMovementApplicationRequest> requests, HttpServletRequest httpRequest) { return financeService.addApplications(movementId, requests, httpRequest); }
}
