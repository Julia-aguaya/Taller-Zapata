package com.tallerzapata.backend.api.recovery;

import com.tallerzapata.backend.application.recovery.FranchiseRecoveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Recuperos", description = "Gestion de recuperos de franquicia")
public class FranchiseRecoveryController {
    private final FranchiseRecoveryService franchiseRecoveryService;

    public FranchiseRecoveryController(FranchiseRecoveryService franchiseRecoveryService) {
        this.franchiseRecoveryService = franchiseRecoveryService;
    }

    @Operation(summary = "Listar catalogos de recupero", description = "Devuelve los catalogos disponibles para recuperos de franquicia")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('recupero.ver')")
    @GetMapping("/recovery/catalogs")
    public FranchiseRecoveryCatalogsResponse listCatalogs() { return franchiseRecoveryService.listCatalogs(); }

    @Operation(summary = "Obtener recupero de franquicia", description = "Devuelve el recupero de franquicia de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('recupero.ver')")
    @GetMapping("/cases/{caseId}/franchise-recovery")
    public FranchiseRecoveryResponse getFranchiseRecovery(@PathVariable Long caseId) { return franchiseRecoveryService.getFranchiseRecovery(caseId); }

    @PreAuthorize("hasAuthority('recupero.ver')")
    @GetMapping("/cases/{caseId}/franchise-recovery/client-obligations")
    public java.util.List<FranchiseRecoveryClientObligationResponse> listClientObligations(@PathVariable Long caseId) {
        return franchiseRecoveryService.listClientObligations(caseId);
    }

    @PreAuthorize("hasAuthority('recupero.crear')")
    @PostMapping("/cases/{caseId}/franchise-recovery/client-obligations/{obligationId}/applications")
    public FranchiseRecoveryClientObligationResponse applyClientObligationPayment(
            @PathVariable Long caseId,
            @PathVariable Long obligationId,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @RequestBody FranchiseRecoveryClientObligationPaymentRequest request,
            HttpServletRequest httpRequest
    ) {
        return franchiseRecoveryService.applyClientObligationPayment(caseId, obligationId, idempotencyKey, request, httpRequest);
    }

    @PreAuthorize("hasAuthority('recupero.crear')")
    @PostMapping("/cases/{caseId}/franchise-recovery/client-obligations/{obligationId}/applications/{applicationId}/annul")
    public FranchiseRecoveryClientObligationResponse annulClientObligationPayment(
            @PathVariable Long caseId,
            @PathVariable Long obligationId,
            @PathVariable Long applicationId,
            @RequestBody(required = false) FranchiseRecoveryClientObligationPaymentAnnulmentRequest request,
            HttpServletRequest httpRequest
    ) {
        return franchiseRecoveryService.annulClientObligationPayment(caseId, obligationId, applicationId, request, httpRequest);
    }

    @Operation(summary = "Actualizar recupero de franquicia", description = "Crea o actualiza el recupero de franquicia de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('recupero.crear')")
    @PutMapping("/cases/{caseId}/franchise-recovery")
    public FranchiseRecoveryResponse upsertFranchiseRecovery(@PathVariable Long caseId, @RequestBody FranchiseRecoveryUpsertRequest request, HttpServletRequest httpRequest) { return franchiseRecoveryService.upsertFranchiseRecovery(caseId, request, httpRequest); }

    @PreAuthorize("hasAuthority('recupero.crear')")
    @PostMapping("/cases/{caseId}/franchise-recovery/lower-agreement-approval")
    public FranchiseRecoveryResponse approveLowerAgreement(@PathVariable Long caseId, @RequestBody @jakarta.validation.Valid FranchiseRecoveryApprovalRequest request, HttpServletRequest httpRequest) { return franchiseRecoveryService.approveLowerAgreement(caseId, request.reason(), httpRequest); }
}
