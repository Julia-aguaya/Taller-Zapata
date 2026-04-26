package com.tallerzapata.backend.api.operation;

import com.tallerzapata.backend.application.operation.VehicleIntakeService;
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
@Tag(name = "Ingreso de Vehiculos", description = "Gestion de ingresos de vehiculos y sus items de revision")
public class VehicleIntakeController {

    private final VehicleIntakeService vehicleIntakeService;

    public VehicleIntakeController(VehicleIntakeService vehicleIntakeService) {
        this.vehicleIntakeService = vehicleIntakeService;
    }

    @Operation(summary = "Listar ingresos de caso", description = "Devuelve los ingresos de vehiculos asociados a un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('ingreso.ver')")
    @GetMapping("/api/v1/cases/{caseId}/vehicle-intakes")
    public List<VehicleIntakeResponse> listByCase(@PathVariable Long caseId) {
        return vehicleIntakeService.listByCase(caseId);
    }

    @Operation(summary = "Crear ingreso", description = "Crea un nuevo ingreso de vehiculo para un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('ingreso.crear')")
    @PostMapping("/api/v1/cases/{caseId}/vehicle-intakes")
    public VehicleIntakeResponse create(
            @PathVariable Long caseId,
            @Valid @RequestBody VehicleIntakeCreateRequest request,
            HttpServletRequest httpRequest
    ) {
        return vehicleIntakeService.create(caseId, request, httpRequest);
    }

    @Operation(summary = "Actualizar ingreso", description = "Actualiza un ingreso de vehiculo existente")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('ingreso.crear')")
    @PutMapping("/api/v1/vehicle-intakes/{intakeId}")
    public VehicleIntakeResponse update(
            @PathVariable Long intakeId,
            @Valid @RequestBody VehicleIntakeUpdateRequest request,
            HttpServletRequest httpRequest
    ) {
        return vehicleIntakeService.update(intakeId, request, httpRequest);
    }

    @Operation(summary = "Listar items de ingreso", description = "Devuelve los items de revision de un ingreso de vehiculo")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('ingreso.ver')")
    @GetMapping("/api/v1/vehicle-intakes/{intakeId}/items")
    public List<VehicleIntakeItemResponse> listItems(@PathVariable Long intakeId) {
        return vehicleIntakeService.listItems(intakeId);
    }

    @Operation(summary = "Crear item de ingreso", description = "Agrega un item de revision a un ingreso de vehiculo")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('ingreso.crear')")
    @PostMapping("/api/v1/vehicle-intakes/{intakeId}/items")
    public VehicleIntakeItemResponse createItem(
            @PathVariable Long intakeId,
            @Valid @RequestBody VehicleIntakeItemCreateRequest request,
            HttpServletRequest httpRequest
    ) {
        return vehicleIntakeService.createItem(intakeId, request, httpRequest);
    }
}
