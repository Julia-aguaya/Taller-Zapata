package com.tallerzapata.backend.api.document;

import com.tallerzapata.backend.application.document.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Tag(name = "Documentos", description = "Gestion de documentos, adjuntos, relaciones y descargas")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @Operation(summary = "Listar catalogos de documentos", description = "Devuelve los catalogos de documentos disponibles")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('documento.ver')")
    @GetMapping("/api/v1/documents/catalogs")
    public DocumentCatalogsResponse listCatalogs(
            @RequestParam(name = "caseTypeId", required = false) Long caseTypeId,
            @RequestParam(name = "moduleCode", required = false) String moduleCode
    ) {
        return documentService.listCatalogs(caseTypeId, moduleCode);
    }

    @Operation(summary = "Subir documento", description = "Sube un nuevo documento al sistema")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('documento.crear')")
    @PostMapping("/api/v1/documents")
    public DocumentResponse upload(@ModelAttribute DocumentUploadRequest request, HttpServletRequest httpRequest) {
        return documentService.upload(request, httpRequest);
    }

    @Operation(summary = "Obtener documento", description = "Devuelve los metadatos de un documento")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('documento.ver')")
    @GetMapping("/api/v1/documents/{documentId}")
    public DocumentResponse getById(@PathVariable Long documentId) {
        return documentService.getById(documentId);
    }

    @Operation(summary = "Actualizar documento", description = "Actualiza los metadatos de un documento")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('documento.crear')")
    @PutMapping("/api/v1/documents/{documentId}")
    public DocumentResponse update(
            @PathVariable Long documentId,
            @Valid @RequestBody DocumentUpdateRequest request,
            HttpServletRequest httpRequest
    ) {
        return documentService.update(documentId, request, httpRequest);
    }

    @Operation(summary = "Crear relacion de documento", description = "Relaciona un documento con una entidad del sistema")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('documento.crear')")
    @PostMapping("/api/v1/documents/{documentId}/relations")
    public DocumentRelationResponse createRelation(
            @PathVariable Long documentId,
            @Valid @RequestBody DocumentRelationCreateRequest request,
            HttpServletRequest httpRequest
    ) {
        return documentService.createRelation(documentId, request, httpRequest);
    }

    @Operation(summary = "Actualizar relacion de documento", description = "Actualiza una relacion de documento existente")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('documento.crear')")
    @PutMapping("/api/v1/document-relations/{relationId}")
    public DocumentRelationResponse updateRelation(
            @PathVariable Long relationId,
            @RequestBody DocumentRelationUpdateRequest request,
            HttpServletRequest httpRequest
    ) {
        return documentService.updateRelation(relationId, request, httpRequest);
    }

    @Operation(summary = "Reemplazar documento", description = "Reemplaza el archivo de un documento existente")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('documento.crear')")
    @PostMapping("/api/v1/documents/{documentId}/replace")
    public DocumentResponse replace(
            @PathVariable Long documentId,
            @ModelAttribute DocumentReplaceRequest request,
            HttpServletRequest httpRequest
    ) {
        return documentService.replace(documentId, request, httpRequest);
    }

    @Operation(summary = "Listar documentos de caso", description = "Devuelve los documentos asociados a un caso con filtros opcionales")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('documento.ver')")
    @GetMapping("/api/v1/cases/{caseId}/documents")
    public List<CaseDocumentResponse> listCaseDocuments(
            @PathVariable Long caseId,
            @RequestParam(name = "moduleCode", required = false) String moduleCode,
            @RequestParam(name = "entityType", required = false) String entityType,
            @RequestParam(name = "entityId", required = false) Long entityId,
            @RequestParam(name = "visibleToCustomer", required = false) Boolean visibleToCustomer
    ) {
        return documentService.listCaseDocuments(caseId, moduleCode, entityType, entityId, visibleToCustomer);
    }

    @Operation(summary = "Descargar documento", description = "Descarga el archivo de un documento especifico de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('documento.ver')")
    @GetMapping("/api/v1/cases/{caseId}/documents/{documentId}/download")
    public ResponseEntity<Resource> downloadCaseDocument(@PathVariable Long caseId, @PathVariable Long documentId) {
        return documentService.downloadCaseDocument(caseId, documentId);
    }
}
