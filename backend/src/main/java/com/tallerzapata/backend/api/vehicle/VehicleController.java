package com.tallerzapata.backend.api.vehicle;

import com.tallerzapata.backend.application.vehicle.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vehicles")
@Tag(name = "Vehiculos", description = "Gestion de vehiculos, marcas, modelos y relaciones con personas")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @Operation(summary = "Buscar vehiculos", description = "Busca vehiculos por patente o texto libre")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('vehiculo.ver')")
    @GetMapping
    public List<VehicleResponse> search(
            @RequestParam(required = false) String plate,
            @RequestParam(required = false) String q
    ) {
        return vehicleService.search(plate, q);
    }

    @Operation(summary = "Obtener vehiculo por ID", description = "Devuelve los detalles de un vehiculo especifico")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('vehiculo.ver')")
    @GetMapping("/{vehicleId}")
    public VehicleResponse getById(@PathVariable Long vehicleId) {
        return vehicleService.getById(vehicleId);
    }

    @Operation(summary = "Crear vehiculo", description = "Crea un nuevo vehiculo en el sistema")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('vehiculo.crear')")
    @PostMapping
    public VehicleResponse create(@RequestBody VehicleUpsertRequest request) {
        return vehicleService.create(request);
    }

    @Operation(summary = "Actualizar vehiculo", description = "Actualiza los datos de un vehiculo existente")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('vehiculo.crear')")
    @PutMapping("/{vehicleId}")
    public VehicleResponse update(@PathVariable Long vehicleId, @RequestBody VehicleUpsertRequest request) {
        return vehicleService.update(vehicleId, request);
    }

    @Operation(summary = "Listar marcas", description = "Devuelve el catalogo de marcas de vehiculos")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('vehiculo.ver')")
    @GetMapping("/brands")
    public List<VehicleBrandResponse> listBrands() {
        return vehicleService.listBrands();
    }

    @Operation(summary = "Listar modelos", description = "Devuelve el catalogo de modelos, opcionalmente filtrados por marca")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('vehiculo.ver')")
    @GetMapping("/models")
    public List<VehicleModelResponse> listModels(@RequestParam(required = false) Long brandId) {
        return vehicleService.listModels(brandId);
    }

    @Operation(summary = "Listar personas de vehiculo", description = "Devuelve las personas relacionadas con un vehiculo")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('vehiculo.ver')")
    @GetMapping("/{vehicleId}/persons")
    public List<VehiclePersonResponse> listVehiclePersons(@PathVariable Long vehicleId) {
        return vehicleService.listVehiclePersons(vehicleId);
    }

    @Operation(summary = "Crear relacion vehiculo-persona", description = "Relaciona una persona con un vehiculo")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('vehiculo.crear')")
    @PostMapping("/{vehicleId}/persons")
    public VehiclePersonResponse createVehiclePerson(
            @PathVariable Long vehicleId,
            @Valid @RequestBody VehiclePersonUpsertRequest request
    ) {
        return vehicleService.createVehiclePerson(vehicleId, request);
    }

    @Operation(summary = "Actualizar relacion vehiculo-persona", description = "Actualiza la relacion entre una persona y un vehiculo")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('vehiculo.crear')")
    @PutMapping("/{vehicleId}/persons/{relationId}")
    public VehiclePersonResponse updateVehiclePerson(
            @PathVariable Long vehicleId,
            @PathVariable Long relationId,
            @Valid @RequestBody VehiclePersonUpsertRequest request
    ) {
        return vehicleService.updateVehiclePerson(vehicleId, relationId, request);
    }
}
