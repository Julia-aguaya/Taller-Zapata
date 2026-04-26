package com.tallerzapata.backend.api.operation;

import com.tallerzapata.backend.application.operation.OperationCatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/operation")
@Tag(name = "Catalogos de Operacion", description = "Catalogos relacionados con operaciones del taller")
public class OperationCatalogController {

    private final OperationCatalogService operationCatalogService;

    public OperationCatalogController(OperationCatalogService operationCatalogService) {
        this.operationCatalogService = operationCatalogService;
    }

    @Operation(summary = "Listar catalogos de operacion", description = "Devuelve los catalogos disponibles para operaciones")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/catalogs")
    public OperationCatalogsResponse listCatalogs() {
        return operationCatalogService.listCatalogs();
    }
}
