package com.tallerzapata.backend.api.operation;

import com.tallerzapata.backend.application.operation.RepairAppointmentService;
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
@Tag(name = "Turnos", description = "Gestion de turnos de reparacion asociados a casos")
public class RepairAppointmentController {

    private final RepairAppointmentService repairAppointmentService;

    public RepairAppointmentController(RepairAppointmentService repairAppointmentService) {
        this.repairAppointmentService = repairAppointmentService;
    }

    @Operation(summary = "Listar turnos de caso", description = "Devuelve los turnos de reparacion asociados a un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('turno.ver')")
    @GetMapping("/api/v1/cases/{caseId}/appointments")
    public List<RepairAppointmentResponse> listByCase(@PathVariable Long caseId) {
        return repairAppointmentService.listByCase(caseId);
    }

    @Operation(summary = "Crear turno", description = "Crea un nuevo turno de reparacion para un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('turno.crear')")
    @PostMapping("/api/v1/cases/{caseId}/appointments")
    public RepairAppointmentResponse create(
            @PathVariable Long caseId,
            @Valid @RequestBody RepairAppointmentCreateRequest request,
            HttpServletRequest httpRequest
    ) {
        return repairAppointmentService.create(caseId, request, httpRequest);
    }

    @Operation(summary = "Actualizar turno", description = "Actualiza un turno de reparacion existente")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('turno.crear')")
    @PutMapping("/api/v1/appointments/{appointmentId}")
    public RepairAppointmentResponse update(
            @PathVariable Long appointmentId,
            @Valid @RequestBody RepairAppointmentUpdateRequest request,
            HttpServletRequest httpRequest
    ) {
        return repairAppointmentService.update(appointmentId, request, httpRequest);
    }
}

