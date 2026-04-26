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

    @Operation(summary = "Obtener recupero de franquicia", description = "Devuelve el recupero de franquicia de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('recupero.ver')")
    @GetMapping("/cases/{caseId}/franchise-recovery")
    public FranchiseRecoveryResponse getFranchiseRecovery(@PathVariable Long caseId) { return franchiseRecoveryService.getFranchiseRecovery(caseId); }

    @Operation(summary = "Actualizar recupero de franquicia", description = "Crea o actualiza el recupero de franquicia de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('recupero.crear')")
    @PutMapping("/cases/{caseId}/franchise-recovery")
    public FranchiseRecoveryResponse upsertFranchiseRecovery(@PathVariable Long caseId, @RequestBody FranchiseRecoveryUpsertRequest request, HttpServletRequest httpRequest) { return franchiseRecoveryService.upsertFranchiseRecovery(caseId, request, httpRequest); }
}
