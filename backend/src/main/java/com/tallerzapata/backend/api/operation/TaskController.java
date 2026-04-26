package com.tallerzapata.backend.api.operation;

import com.tallerzapata.backend.application.operation.OperationalTaskService;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tasks")
@Tag(name = "Tareas Operativas", description = "Gestion de tareas operativas del taller")
public class TaskController {

    private final OperationalTaskService operationalTaskService;

    public TaskController(OperationalTaskService operationalTaskService) {
        this.operationalTaskService = operationalTaskService;
    }

    @Operation(summary = "Listar tareas", description = "Devuelve una pagina de tareas con filtros opcionales")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('tarea.ver')")
    @GetMapping
    public OperationalTaskPageResponse list(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size,
            @RequestParam(name = "caseId", required = false) Long caseId,
            @RequestParam(name = "assignedUserId", required = false) Long assignedUserId,
            @RequestParam(name = "statusCode", required = false) String statusCode,
            @RequestParam(name = "organizationId", required = false) Long organizationId,
            @RequestParam(name = "branchId", required = false) Long branchId
    ) {
        return operationalTaskService.list(page, size, caseId, assignedUserId, statusCode, organizationId, branchId);
    }

    @Operation(summary = "Crear tarea", description = "Crea una nueva tarea operativa")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('tarea.crear')")
    @PostMapping
    public OperationalTaskResponse create(@Valid @RequestBody OperationalTaskCreateRequest request, HttpServletRequest httpRequest) {
        return operationalTaskService.create(request, httpRequest);
    }

    @Operation(summary = "Actualizar tarea", description = "Actualiza una tarea operativa existente")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('tarea.crear')")
    @PutMapping("/{taskId}")
    public OperationalTaskResponse update(
            @PathVariable Long taskId,
            @Valid @RequestBody OperationalTaskUpdateRequest request,
            HttpServletRequest httpRequest
    ) {
        return operationalTaskService.update(taskId, request, httpRequest);
    }
}
