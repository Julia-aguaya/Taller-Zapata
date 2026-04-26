package com.tallerzapata.backend.api.system;

import com.tallerzapata.backend.application.system.SystemParameterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/system")
@Tag(name = "Parametros del Sistema", description = "Gestion de parametros de configuracion del sistema")
public class SystemParameterController {

    private final SystemParameterService systemParameterService;

    public SystemParameterController(SystemParameterService systemParameterService) {
        this.systemParameterService = systemParameterService;
    }

    @Operation(summary = "Listar parametros", description = "Devuelve los parametros del sistema, opcionalmente filtrados por modulo")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('parametro.ver')")
    @GetMapping("/parameters")
    public List<SystemParameterResponse> listParameters(@RequestParam(name = "module", required = false) String moduleCode) {
        if (moduleCode != null && !moduleCode.isBlank()) {
            return systemParameterService.listParametersByModule(moduleCode.trim().toUpperCase());
        }
        return systemParameterService.listParameters();
    }

    @Operation(summary = "Obtener parametro", description = "Devuelve un parametro del sistema por su codigo")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('parametro.ver')")
    @GetMapping("/parameters/{code}")
    public SystemParameterResponse getParameter(@PathVariable String code) {
        return systemParameterService.getParameter(code);
    }

    @Operation(summary = "Actualizar parametro", description = "Crea o actualiza un parametro del sistema")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('parametro.editar')")
    @PutMapping("/parameters/{code}")
    public SystemParameterResponse upsertParameter(@PathVariable String code,
                                                   @Valid @RequestBody SystemParameterUpsertRequest request,
                                                   HttpServletRequest httpRequest) {
        return systemParameterService.upsertParameter(request, httpRequest);
    }
}
