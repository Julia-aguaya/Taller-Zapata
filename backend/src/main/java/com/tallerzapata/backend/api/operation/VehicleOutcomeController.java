package com.tallerzapata.backend.api.operation;

import com.tallerzapata.backend.application.operation.VehicleOutcomeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Tag(name = "Egreso de Vehiculos", description = "Gestion de egresos/entregas de vehiculos")
public class VehicleOutcomeController {

    private final VehicleOutcomeService vehicleOutcomeService;

    public VehicleOutcomeController(VehicleOutcomeService vehicleOutcomeService) {
        this.vehicleOutcomeService = vehicleOutcomeService;
    }

    @Operation(summary = "Listar egresos de caso", description = "Devuelve los egresos de vehiculos asociados a un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('egreso.ver')")
    @GetMapping("/api/v1/cases/{caseId}/vehicle-outcomes")
    public List<VehicleOutcomeResponse> listByCase(@PathVariable Long caseId) {
        return vehicleOutcomeService.listByCase(caseId);
    }

    @Operation(summary = "Crear egreso", description = "Crea un nuevo egreso de vehiculo para un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('egreso.crear')")
    @PostMapping("/api/v1/cases/{caseId}/vehicle-outcomes")
    public VehicleOutcomeResponse create(
            @PathVariable Long caseId,
            @Valid @RequestBody VehicleOutcomeCreateRequest request,
            HttpServletRequest httpRequest
    ) {
        return vehicleOutcomeService.create(caseId, request, httpRequest);
    }

    @Operation(summary = "Actualizar egreso", description = "Actualiza un egreso de vehiculo existente")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('egreso.crear')")
    @PutMapping("/api/v1/vehicle-outcomes/{outcomeId}")
    public VehicleOutcomeResponse update(
            @PathVariable Long outcomeId,
            @Valid @RequestBody VehicleOutcomeUpdateRequest request,
            HttpServletRequest httpRequest
    ) {
        return vehicleOutcomeService.update(outcomeId, request, httpRequest);
    }
}
