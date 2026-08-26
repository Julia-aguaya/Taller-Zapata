package com.tallerzapata.backend.api.extrabudget;

import com.tallerzapata.backend.application.extrabudget.ExtraBudgetService;
import com.tallerzapata.backend.application.extrabudget.ExtraBudgetComparisonService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cases/{caseId}/extra-budget")
public class ExtraBudgetController {
    private final ExtraBudgetService service;
    private final ExtraBudgetComparisonService comparison;

    public ExtraBudgetController(ExtraBudgetService service, ExtraBudgetComparisonService comparison) {
        this.service = service;
        this.comparison = comparison;
    }

    @Operation(summary = "Obtener presupuesto extra")
    @PreAuthorize("hasAuthority('presupuesto.ver')")
    @GetMapping
    public ExtraBudgetResponse get(@PathVariable Long caseId) {
        return service.get(caseId);
    }

    @Operation(summary = "Crear o actualizar borrador de presupuesto extra")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @PutMapping("/draft")
    public ExtraBudgetResponse saveDraft(@PathVariable Long caseId, @Valid @RequestBody ExtraBudgetDraftRequest request, HttpServletRequest httpRequest) {
        return service.saveDraft(caseId, request, httpRequest);
    }

    @Operation(summary = "Activar o desactivar la edición de trabajos extras")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @PostMapping("/activation")
    public ExtraBudgetResponse activation(@PathVariable Long caseId, @RequestBody ExtraBudgetActivationRequest request, HttpServletRequest httpRequest) {
        return service.setActivation(caseId, request, httpRequest);
    }

    @Operation(summary = "Guardar cotización aislada de un item extra")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @PostMapping("/comparison/quotes")
    public ExtraBudgetComparisonResponse quote(@PathVariable Long caseId, @RequestBody ExtraBudgetComparisonRequest request) {
        return comparison.quote(caseId, request);
    }

    @Operation(summary = "Seleccionar cotización aislada de un item extra")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @PostMapping("/comparison/select")
    public ExtraBudgetComparisonResponse selectQuote(@PathVariable Long caseId, @RequestBody ExtraBudgetComparisonRequest request) {
        return comparison.select(caseId, request);
    }

    @Operation(summary = "Consultar comparación aislada de un item extra")
    @PreAuthorize("hasAuthority('presupuesto.ver')")
    @GetMapping("/comparison/items/{itemId}")
    public ExtraBudgetComparisonResponse comparison(@PathVariable Long caseId, @PathVariable Long itemId) {
        return comparison.detail(caseId, itemId);
    }

    @Operation(summary = "Presentar presupuesto extra")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @PostMapping("/present")
    public ExtraBudgetResponse present(@PathVariable Long caseId, @RequestBody ExtraBudgetTransitionRequest request, HttpServletRequest httpRequest) {
        return service.present(caseId, request, httpRequest);
    }

    @Operation(summary = "Aceptar presupuesto extra")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @PostMapping("/accept")
    public ExtraBudgetResponse accept(@PathVariable Long caseId, @RequestBody ExtraBudgetTransitionRequest request, HttpServletRequest httpRequest) {
        return service.accept(caseId, request, httpRequest);
    }

    @Operation(summary = "Rechazar presupuesto extra")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @PostMapping("/reject")
    public ExtraBudgetResponse reject(@PathVariable Long caseId, @RequestBody ExtraBudgetTransitionRequest request, HttpServletRequest httpRequest) {
        return service.reject(caseId, request, httpRequest);
    }

    @Operation(summary = "Confirmar presupuesto extra presentado")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @PostMapping("/confirm")
    public ExtraBudgetResponse confirm(@PathVariable Long caseId, @RequestBody ExtraBudgetTransitionRequest request, HttpServletRequest httpRequest) {
        return service.confirm(caseId, request, httpRequest);
    }

    @Operation(summary = "Desactivar y revertir presupuesto extra confirmado")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @PostMapping("/deactivate")
    public ExtraBudgetResponse deactivate(@PathVariable Long caseId, @RequestBody ExtraBudgetTransitionRequest request, HttpServletRequest httpRequest) {
        return service.deactivate(caseId, request, httpRequest);
    }

    @Operation(summary = "Crear revisión de presupuesto extra")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @PostMapping("/revise")
    public ExtraBudgetResponse revise(@PathVariable Long caseId, @RequestBody ExtraBudgetTransitionRequest request, HttpServletRequest httpRequest) {
        return service.revise(caseId, request, httpRequest);
    }

    @Operation(summary = "Registrar pago de cliente para presupuesto extra")
    @PreAuthorize("hasAuthority('finanza.crear')")
    @PostMapping("/payments")
    public ExtraBudgetResponse registerPayment(@PathVariable Long caseId, @Valid @RequestBody ExtraBudgetPaymentRequest request, HttpServletRequest httpRequest) {
        return service.registerPayment(caseId, request, httpRequest);
    }

    @Operation(summary = "Anular pago de cliente para presupuesto extra")
    @PreAuthorize("hasAuthority('finanza.crear')")
    @PostMapping("/payments/annul")
    public ExtraBudgetResponse annulPayment(@PathVariable Long caseId, @Valid @RequestBody ExtraBudgetPaymentAnnulmentRequest request, HttpServletRequest httpRequest) {
        return service.annulPayment(caseId, request, httpRequest);
    }

    @Operation(summary = "Descargar PDF congelado de una versión extra")
    @PreAuthorize("hasAuthority('presupuesto.ver')")
    @GetMapping("/versions/{version}/pdf")
    public ResponseEntity<byte[]> pdf(@PathVariable Long caseId, @PathVariable Integer version) {
        byte[] content = service.pdf(caseId, version);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename("presupuesto-extra-" + caseId + "-v" + version + ".pdf").build().toString())
                .contentLength(content.length).body(content);
    }
}
