package com.tallerzapata.backend.api.casefile;

import com.tallerzapata.backend.application.casefile.CaseService;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.casefile.CaseWorkflowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cases")
@Tag(name = "Casos", description = "Gestion de expedientes/casos del taller, workflow, auditoria y relaciones")
public class CaseController {

    private final CaseService caseService;
    private final CaseWorkflowService caseWorkflowService;
    private final CaseAuditService caseAuditService;

    public CaseController(
            CaseService caseService,
            CaseWorkflowService caseWorkflowService,
            CaseAuditService caseAuditService
    ) {
        this.caseService = caseService;
        this.caseWorkflowService = caseWorkflowService;
        this.caseAuditService = caseAuditService;
    }

    @Operation(summary = "Listar casos", description = "Devuelve una pagina de casos con filtros opcionales por organizacion y sucursal")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping
    public CasePageResponse list(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size,
            @RequestParam(name = "organizationId", required = false) Long organizationId,
            @RequestParam(name = "branchId", required = false) Long branchId
    ) {
        return caseService.list(page, size, organizationId, branchId);
    }

    @Operation(summary = "Listar catalogos de casos", description = "Devuelve los catalogos necesarios para crear/editar casos")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/catalogs")
    public CaseCatalogsResponse listCatalogs() {
        return caseService.listCatalogs();
    }

    @Operation(summary = "Obtener caso por ID", description = "Devuelve los detalles de un caso especifico")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/{caseId}")
    public CaseResponse getById(@PathVariable Long caseId) {
        return caseService.getById(caseId);
    }

    @Operation(summary = "Crear caso", description = "Crea un nuevo caso/expediente en el sistema")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping
    public CaseResponse create(@Valid @RequestBody CaseCreateRequest request, HttpServletRequest httpRequest) {
        return caseService.create(request, httpRequest);
    }

    @Operation(summary = "Actualizar caso", description = "Actualiza los datos de un caso existente")
    @ApiResponse(responseCode = "200", description = "OK")
    @PutMapping("/{caseId}")
    public CaseResponse update(
            @PathVariable Long caseId,
            @RequestBody CaseUpdateRequest request,
            HttpServletRequest httpRequest
    ) {
        return caseService.update(caseId, request, httpRequest);
    }

    @Operation(summary = "Listar relaciones de caso", description = "Devuelve las relaciones de un caso con otros casos")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/{caseId}/relations")
    public List<CaseRelationResponse> listRelations(@PathVariable Long caseId) {
        return caseService.listRelations(caseId);
    }

    @Operation(summary = "Crear relacion de caso", description = "Relaciona un caso con otro caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/{caseId}/relations")
    public CaseRelationResponse createRelation(
            @PathVariable Long caseId,
            @Valid @RequestBody CaseRelationCreateRequest request,
            HttpServletRequest httpRequest
    ) {
        return caseService.createRelation(caseId, request, httpRequest);
    }

    @Operation(summary = "Transicionar workflow", description = "Ejecuta una transicion de estado en el workflow del caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/{caseId}/workflow/transitions")
    public void transition(
            @PathVariable Long caseId,
            @Valid @RequestBody CaseWorkflowTransitionRequest request,
            HttpServletRequest httpRequest
    ) {
        caseWorkflowService.transition(caseId, request, httpRequest);
    }

    @Operation(summary = "Historial de workflow", description = "Devuelve el historial de transiciones de workflow de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/{caseId}/workflow/history")
    public List<CaseWorkflowHistoryResponse> history(@PathVariable Long caseId) {
        return caseWorkflowService.getHistory(caseId);
    }

    @Operation(summary = "Listar acciones de workflow", description = "Devuelve las acciones disponibles para el estado actual del caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/{caseId}/workflow/actions")
    public CaseWorkflowActionsResponse listWorkflowActions(
            @PathVariable Long caseId,
            @RequestParam(name = "domain", required = false) String domain
    ) {
        return caseWorkflowService.getAvailableActions(caseId, domain);
    }

    @Operation(summary = "Listar eventos de auditoria", description = "Devuelve el log de auditoria de un caso con filtros opcionales")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/{caseId}/audit/events")
    public List<CaseAuditEventResponse> listAuditEvents(
            @PathVariable Long caseId,
            @RequestParam(name = "actionCode", required = false) String actionCode,
            @RequestParam(name = "domain", required = false) String domain,
            @RequestParam(name = "userId", required = false) Long userId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size
    ) {
        return caseAuditService.listCaseAuditEvents(caseId, actionCode, domain, userId, page, size);
    }
}
