package com.tallerzapata.backend.api.casefile;

import com.tallerzapata.backend.application.casefile.CaseManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Gestion de Casos", description = "Operaciones de gestion de personas, vehiculos e incidentes dentro de un caso")
public class CaseManagementController {

    private final CaseManagementService caseManagementService;

    public CaseManagementController(CaseManagementService caseManagementService) {
        this.caseManagementService = caseManagementService;
    }

    @Operation(summary = "Agregar persona a caso", description = "Asocia una persona existente a un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/cases/{caseId}/persons")
    public void addPersonToCase(
            @PathVariable Long caseId,
            @Valid @RequestBody CasePersonAddRequest request,
            HttpServletRequest httpRequest
    ) {
        caseManagementService.addPersonToCase(caseId, request, httpRequest);
    }

    @Operation(summary = "Agregar vehiculo a caso", description = "Asocia un vehiculo existente a un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/cases/{caseId}/vehicles")
    public void addVehicleToCase(
            @PathVariable Long caseId,
            @Valid @RequestBody CaseVehicleAddRequest request,
            HttpServletRequest httpRequest
    ) {
        caseManagementService.addVehicleToCase(caseId, request, httpRequest);
    }

    @Operation(summary = "Actualizar incidente de caso", description = "Actualiza los datos del incidente asociado a un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PutMapping("/cases/{caseId}/incident")
    public void updateCaseIncident(
            @PathVariable Long caseId,
            @RequestBody CaseIncidentUpdateRequest request,
            HttpServletRequest httpRequest
    ) {
        caseManagementService.updateCaseIncident(caseId, request, httpRequest);
    }
}
