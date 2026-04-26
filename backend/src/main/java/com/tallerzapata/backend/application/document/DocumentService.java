package com.tallerzapata.backend.application.document;

import com.tallerzapata.backend.api.document.CaseDocumentResponse;
import com.tallerzapata.backend.api.document.DocumentCatalogsResponse;
import com.tallerzapata.backend.api.document.DocumentCategoryResponse;
import com.tallerzapata.backend.api.document.DocumentReplaceRequest;
import com.tallerzapata.backend.api.document.DocumentRelationCreateRequest;
import com.tallerzapata.backend.api.document.DocumentRelationResponse;
import com.tallerzapata.backend.api.document.DocumentRelationUpdateRequest;
import com.tallerzapata.backend.api.document.DocumentResponse;
import com.tallerzapata.backend.api.document.DocumentUpdateRequest;
import com.tallerzapata.backend.api.document.DocumentUploadRequest;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CasePersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseVehicleRepository;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentCategoryEntity;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentCategoryRepository;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentEntity;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentRelationEntity;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentRelationRepository;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleOutcomeRepository;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    private static final Set<String> SUPPORTED_ENTITY_TYPES = Set.of("CASO", "PERSONA", "VEHICULO", "INGRESO", "EGRESO");

    private final DocumentCategoryRepository documentCategoryRepository;
    private final DocumentRepository documentRepository;
    private final DocumentRelationRepository documentRelationRepository;
    private final CaseRepository caseRepository;
    private final CasePersonRepository casePersonRepository;
    private final CaseVehicleRepository caseVehicleRepository;
    private final PersonRepository personRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleIntakeRepository vehicleIntakeRepository;
    private final VehicleOutcomeRepository vehicleOutcomeRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService caseAccessControlService;
    private final DocumentStorageService documentStorageService;
    private final CaseAuditService caseAuditService;

    public DocumentService(
            DocumentCategoryRepository documentCategoryRepository,
            DocumentRepository documentRepository,
            DocumentRelationRepository documentRelationRepository,
            CaseRepository caseRepository,
            CasePersonRepository casePersonRepository,
            CaseVehicleRepository caseVehicleRepository,
            PersonRepository personRepository,
            VehicleRepository vehicleRepository,
            VehicleIntakeRepository vehicleIntakeRepository,
            VehicleOutcomeRepository vehicleOutcomeRepository,
            UserRepository userRepository,
            CurrentUserService currentUserService,
            CaseAccessControlService caseAccessControlService,
            DocumentStorageService documentStorageService,
            CaseAuditService caseAuditService
    ) {
        this.documentCategoryRepository = documentCategoryRepository;
        this.documentRepository = documentRepository;
        this.documentRelationRepository = documentRelationRepository;
        this.caseRepository = caseRepository;
        this.casePersonRepository = casePersonRepository;
        this.caseVehicleRepository = caseVehicleRepository;
        this.personRepository = personRepository;
        this.vehicleRepository = vehicleRepository;
        this.vehicleIntakeRepository = vehicleIntakeRepository;
        this.vehicleOutcomeRepository = vehicleOutcomeRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.caseAccessControlService = caseAccessControlService;
        this.documentStorageService = documentStorageService;
        this.caseAuditService = caseAuditService;
    }

    @Transactional(readOnly = true)
    public DocumentCatalogsResponse listCatalogs(Long caseTypeId, String moduleCode) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        caseAccessControlService.requirePermission(currentUser, "documento.ver");

        String normalizedModuleCode = normalizeCode(moduleCode);
        List<DocumentCategoryEntity> categories = documentCategoryRepository.findByActiveTrueOrderByModuleCodeAscNameAsc();
        List<DocumentCategoryResponse> items = categories.stream()
                .filter(item -> caseTypeId == null || item.getCaseTypeId() == null || caseTypeId.equals(item.getCaseTypeId()))
                .filter(item -> normalizedModuleCode == null || normalizedModuleCode.equals(item.getModuleCode()))
                .map(this::toCategoryResponse)
                .toList();
        return new DocumentCatalogsResponse(items);
    }

    @Transactional
    public DocumentResponse upload(DocumentUploadRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        caseAccessControlService.requirePermission(currentUser, "documento.crear");

        if (request.getFile() == null || request.getFile().isEmpty()) {
            throw new ConflictException("file es obligatorio");
        }
        if (request.getCategoryId() == null) {
            throw new ConflictException("categoryId es obligatorio");
        }

        DocumentCategoryEntity category = documentCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe la categoria documental " + request.getCategoryId()));
        if (!Boolean.TRUE.equals(category.getActive())) {
            throw new ConflictException("La categoria documental esta inactiva");
        }
        if (Boolean.TRUE.equals(category.getRequiresDate()) && request.getDocumentDate() == null) {
            throw new ConflictException("documentDate es obligatorio para la categoria indicada");
        }
        userRepository.findById(currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el usuario autenticado " + currentUser.id()));

        String checksum = calculateSha256(request.getFile());
        Long sizeBytes = request.getFile().getSize();
        DocumentEntity existing = documentRepository.findByChecksumSha256AndSizeBytesAndActiveTrue(checksum, sizeBytes)
                .filter(item -> item.getCategoryId().equals(category.getId()))
                .filter(item -> item.getFileName().equals(safeFileName(request.getFile().getOriginalFilename())))
                .orElse(null);
        if (existing != null) {
            return toResponse(existing);
        }

        String extension = filenameExtension(request.getFile().getOriginalFilename());
        DocumentStorageService.StoredDocument stored = documentStorageService.store(request.getFile(), extension);

        DocumentEntity entity = buildDocumentEntity(
                stored,
                request.getFile().getOriginalFilename(),
                blankToDefault(request.getFile().getContentType(), MediaType.APPLICATION_OCTET_STREAM_VALUE),
                checksum,
                category.getId(),
                request.getSubcategoryCode(),
                request.getDocumentDate(),
                currentUser.id(),
                request.getOriginCode(),
                request.getObservations(),
                null
        );
        entity = documentRepository.save(entity);

        caseAuditService.register(
                currentUser.id(),
                null,
                "documentos",
                entity.getId(),
                "subir_documento",
                null,
                caseAuditService.toJson(Map.of("documentId", entity.getId(), "categoryId", entity.getCategoryId(), "originCode", entity.getOriginCode())),
                caseAuditService.toJson(Map.of("domain", "documentos")),
                httpRequest
        );

        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public DocumentResponse getById(Long documentId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        caseAccessControlService.requirePermission(currentUser, "documento.ver");
        return toResponse(requireActiveDocument(documentId));
    }

    @Transactional
    public DocumentResponse update(Long documentId, DocumentUpdateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        caseAccessControlService.requirePermission(currentUser, "documento.crear");

        DocumentEntity entity = requireActiveDocument(documentId);
        DocumentCategoryEntity category = requireActiveCategory(request.categoryId());
        validateDocumentDate(category, request.documentDate());

        Map<String, Object> before = documentSnapshot(entity);
        entity.setCategoryId(category.getId());
        entity.setSubcategoryCode(blankToNull(request.subcategoryCode()));
        entity.setDocumentDate(request.documentDate());
        entity.setOriginCode(blankToDefault(normalizeCode(request.originCode()), entity.getOriginCode()));
        entity.setObservations(blankToNull(request.observations()));
        if (request.active() != null) {
            entity.setActive(request.active());
        }
        entity = documentRepository.save(entity);

        caseAuditService.register(
                currentUser.id(),
                resolveAnyCaseId(documentId),
                "documentos",
                entity.getId(),
                "actualizar_documento",
                caseAuditService.toJson(before),
                caseAuditService.toJson(documentSnapshot(entity)),
                caseAuditService.toJson(Map.of("domain", "documentos")),
                httpRequest
        );

        return toResponse(entity);
    }

    @Transactional
    public DocumentRelationResponse createRelation(Long documentId, DocumentRelationCreateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        caseAccessControlService.requirePermission(currentUser, "documento.crear");

        DocumentEntity document = documentRepository.findByIdAndActiveTrue(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el documento " + documentId));
        CaseEntity caseEntity = requireCase(request.caseId());
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "documento.ver");

        String entityType = normalizeCode(request.entityType());
        if (!SUPPORTED_ENTITY_TYPES.contains(entityType)) {
            throw new ConflictException("entityType no soportado: " + request.entityType());
        }
        validateEntityBelongsToCase(caseEntity.getId(), entityType, request.entityId());
        if (documentRelationRepository.existsByDocumentIdAndEntityTypeAndEntityId(documentId, entityType, request.entityId())) {
            throw new ConflictException("El documento ya esta relacionado con esa entidad");
        }

        DocumentRelationEntity entity = new DocumentRelationEntity();
        entity.setDocumentId(documentId);
        entity.setCaseId(caseEntity.getId());
        entity.setEntityType(entityType);
        entity.setEntityId(request.entityId());
        entity.setModuleCode(normalizeCode(request.moduleCode()));
        entity.setPrincipal(Boolean.TRUE.equals(request.principal()));
        entity.setVisibleToCustomer(Boolean.TRUE.equals(request.visibleToCustomer()));
        entity.setVisualOrder(request.visualOrder() == null ? 0 : request.visualOrder());
        entity = documentRelationRepository.save(entity);

        caseAuditService.register(
                currentUser.id(),
                caseEntity.getId(),
                "documento_relaciones",
                entity.getId(),
                "relacionar_documento",
                null,
                caseAuditService.toJson(Map.of("documentId", documentId, "entityType", entityType, "entityId", request.entityId())),
                caseAuditService.toJson(Map.of("domain", "documentos")),
                httpRequest
        );

        return toRelationResponse(entity);
    }

    @Transactional
    public DocumentRelationResponse updateRelation(Long relationId, DocumentRelationUpdateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        caseAccessControlService.requirePermission(currentUser, "documento.crear");

        DocumentRelationEntity entity = documentRelationRepository.findById(relationId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la relacion documental " + relationId));
        CaseEntity caseEntity = requireCase(entity.getCaseId());
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "documento.ver");

        Map<String, Object> before = relationSnapshot(entity);
        if (request.principal() != null) {
            entity.setPrincipal(request.principal());
        }
        if (request.visibleToCustomer() != null) {
            entity.setVisibleToCustomer(request.visibleToCustomer());
        }
        if (request.visualOrder() != null) {
            entity.setVisualOrder(request.visualOrder());
        }
        entity = documentRelationRepository.save(entity);

        caseAuditService.register(
                currentUser.id(),
                caseEntity.getId(),
                "documento_relaciones",
                entity.getId(),
                "actualizar_relacion_documento",
                caseAuditService.toJson(before),
                caseAuditService.toJson(relationSnapshot(entity)),
                caseAuditService.toJson(Map.of("domain", "documentos")),
                httpRequest
        );

        return toRelationResponse(entity);
    }

    @Transactional
    public DocumentResponse replace(Long documentId, DocumentReplaceRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        caseAccessControlService.requirePermission(currentUser, "documento.crear");
        caseAccessControlService.requirePermission(currentUser, "documento.crear");

        DocumentEntity current = requireActiveDocument(documentId);
        if (request.getFile() == null || request.getFile().isEmpty()) {
            throw new ConflictException("file es obligatorio");
        }

        Long categoryId = request.getCategoryId() == null ? current.getCategoryId() : request.getCategoryId();
        DocumentCategoryEntity category = requireActiveCategory(categoryId);
        LocalDate documentDate = request.getDocumentDate() == null ? current.getDocumentDate() : request.getDocumentDate();
        validateDocumentDate(category, documentDate);

        String checksum = calculateSha256(request.getFile());
        String extension = filenameExtension(request.getFile().getOriginalFilename());
        DocumentStorageService.StoredDocument stored = documentStorageService.store(request.getFile(), extension);

        DocumentEntity replacement = buildDocumentEntity(
                stored,
                request.getFile().getOriginalFilename(),
                blankToDefault(request.getFile().getContentType(), MediaType.APPLICATION_OCTET_STREAM_VALUE),
                checksum,
                category.getId(),
                request.getSubcategoryCode() == null ? current.getSubcategoryCode() : request.getSubcategoryCode(),
                documentDate,
                currentUser.id(),
                request.getOriginCode() == null ? current.getOriginCode() : request.getOriginCode(),
                request.getObservations() == null ? current.getObservations() : request.getObservations(),
                current.getId()
        );
        replacement = documentRepository.save(replacement);

        List<DocumentRelationEntity> currentRelations = documentRelationRepository.findByDocumentIdOrderByVisualOrderAscIdAsc(documentId);
        for (DocumentRelationEntity currentRelation : currentRelations) {
            DocumentRelationEntity cloned = new DocumentRelationEntity();
            cloned.setDocumentId(replacement.getId());
            cloned.setCaseId(currentRelation.getCaseId());
            cloned.setEntityType(currentRelation.getEntityType());
            cloned.setEntityId(currentRelation.getEntityId());
            cloned.setModuleCode(currentRelation.getModuleCode());
            cloned.setPrincipal(currentRelation.getPrincipal());
            cloned.setVisibleToCustomer(currentRelation.getVisibleToCustomer());
            cloned.setVisualOrder(currentRelation.getVisualOrder());
            documentRelationRepository.save(cloned);
        }

        current.setActive(false);
        documentRepository.save(current);

        caseAuditService.register(
                currentUser.id(),
                resolveAnyCaseId(documentId),
                "documentos",
                replacement.getId(),
                "reemplazar_documento",
                caseAuditService.toJson(documentSnapshot(current)),
                caseAuditService.toJson(documentSnapshot(replacement)),
                caseAuditService.toJson(Map.of("domain", "documentos", "replacedDocumentId", current.getId())),
                httpRequest
        );

        return toResponse(replacement);
    }

    @Transactional(readOnly = true)
    public List<CaseDocumentResponse> listCaseDocuments(Long caseId, String moduleCode, String entityType, Long entityId, Boolean visibleToCustomer) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "documento.ver");

        String normalizedModuleCode = normalizeCode(moduleCode);
        String normalizedEntityType = normalizeCode(entityType);

        List<DocumentRelationEntity> relations = documentRelationRepository.findByCaseIdOrderByVisualOrderAscIdAsc(caseId).stream()
                .filter(item -> normalizedModuleCode == null || normalizedModuleCode.equals(item.getModuleCode()))
                .filter(item -> normalizedEntityType == null || normalizedEntityType.equals(item.getEntityType()))
                .filter(item -> entityId == null || entityId.equals(item.getEntityId()))
                .filter(item -> visibleToCustomer == null || visibleToCustomer.equals(item.getVisibleToCustomer()))
                .toList();

        Map<Long, DocumentEntity> documentsById = documentRepository.findAllById(
                relations.stream().map(DocumentRelationEntity::getDocumentId).toList()
        ).stream().filter(DocumentEntity::getActive).collect(Collectors.toMap(DocumentEntity::getId, Function.identity()));

        return relations.stream()
                .map(relation -> toCaseDocumentResponse(relation, documentsById.get(relation.getDocumentId())))
                .filter(item -> item != null)
                .sorted(Comparator.comparing(CaseDocumentResponse::relationId))
                .toList();
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Resource> downloadCaseDocument(Long caseId, Long documentId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "documento.ver");

        boolean relatedToCase = documentRelationRepository.findByCaseIdOrderByVisualOrderAscIdAsc(caseId)
                .stream()
                .anyMatch(item -> item.getDocumentId().equals(documentId));
        if (!relatedToCase) {
            throw new ResourceNotFoundException("El documento no esta relacionado con el caso indicado");
        }

        DocumentEntity document = documentRepository.findByIdAndActiveTrue(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el documento " + documentId));
        Resource resource = documentStorageService.open(document.getStorageKey());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(document.getMimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(document.getFileName()).build().toString())
                .contentLength(document.getSizeBytes())
                .body(resource);
    }

    private DocumentCategoryEntity requireActiveCategory(Long categoryId) {
        DocumentCategoryEntity category = documentCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la categoria documental " + categoryId));
        if (!Boolean.TRUE.equals(category.getActive())) {
            throw new ConflictException("La categoria documental esta inactiva");
        }
        return category;
    }

    private void validateDocumentDate(DocumentCategoryEntity category, LocalDate documentDate) {
        if (Boolean.TRUE.equals(category.getRequiresDate()) && documentDate == null) {
            throw new ConflictException("documentDate es obligatorio para la categoria indicada");
        }
    }

    private DocumentEntity requireActiveDocument(Long documentId) {
        return documentRepository.findByIdAndActiveTrue(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el documento " + documentId));
    }

    private Long resolveAnyCaseId(Long documentId) {
        return documentRelationRepository.findByDocumentIdOrderByVisualOrderAscIdAsc(documentId).stream()
                .map(DocumentRelationEntity::getCaseId)
                .findFirst()
                .orElse(null);
    }

    private DocumentEntity buildDocumentEntity(
            DocumentStorageService.StoredDocument stored,
            String originalFileName,
            String mimeType,
            String checksum,
            Long categoryId,
            String subcategoryCode,
            LocalDate documentDate,
            Long uploadedBy,
            String originCode,
            String observations,
            Long replacesDocumentId
    ) {
        DocumentEntity entity = new DocumentEntity();
        entity.setStorageKey(stored.storageKey());
        entity.setFileName(safeFileName(originalFileName));
        entity.setExtension(filenameExtension(originalFileName));
        entity.setMimeType(mimeType);
        entity.setSizeBytes(stored.sizeBytes());
        entity.setChecksumSha256(checksum);
        entity.setCategoryId(categoryId);
        entity.setSubcategoryCode(blankToNull(subcategoryCode));
        entity.setDocumentDate(documentDate);
        entity.setUploadedBy(uploadedBy);
        entity.setOriginCode(blankToDefault(normalizeCode(originCode), "MANUAL"));
        entity.setObservations(blankToNull(observations));
        entity.setReplacesDocumentId(replacesDocumentId);
        return entity;
    }

    private Map<String, Object> documentSnapshot(DocumentEntity entity) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("categoryId", entity.getCategoryId());
        snapshot.put("subcategoryCode", entity.getSubcategoryCode());
        snapshot.put("documentDate", entity.getDocumentDate());
        snapshot.put("originCode", entity.getOriginCode());
        snapshot.put("observations", entity.getObservations());
        snapshot.put("active", entity.getActive());
        snapshot.put("replacesDocumentId", entity.getReplacesDocumentId());
        return snapshot;
    }

    private Map<String, Object> relationSnapshot(DocumentRelationEntity entity) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("principal", entity.getPrincipal());
        snapshot.put("visibleToCustomer", entity.getVisibleToCustomer());
        snapshot.put("visualOrder", entity.getVisualOrder());
        return snapshot;
    }

    private CaseEntity requireCase(Long caseId) {
        return caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
    }

    private void validateEntityBelongsToCase(Long caseId, String entityType, Long entityId) {
        switch (entityType) {
            case "CASO" -> {
                if (!caseId.equals(entityId)) {
                    throw new ConflictException("La entidad CASO debe coincidir con caseId");
                }
            }
            case "PERSONA" -> {
                if (!personRepository.existsById(entityId) || !casePersonRepository.existsByCaseIdAndPersonId(caseId, entityId)) {
                    throw new ConflictException("La persona no pertenece al caso indicado");
                }
            }
            case "VEHICULO" -> {
                if (!vehicleRepository.existsById(entityId) || !caseVehicleRepository.existsByCaseIdAndVehicleId(caseId, entityId)) {
                    throw new ConflictException("El vehiculo no pertenece al caso indicado");
                }
            }
            case "INGRESO" -> {
                if (!vehicleIntakeRepository.existsByIdAndCaseId(entityId, caseId)) {
                    throw new ConflictException("El ingreso no pertenece al caso indicado");
                }
            }
            case "EGRESO" -> {
                if (!vehicleOutcomeRepository.existsByIdAndCaseId(entityId, caseId)) {
                    throw new ConflictException("El egreso no pertenece al caso indicado");
                }
            }
            default -> throw new ConflictException("entityType no soportado: " + entityType);
        }
    }

    private String calculateSha256(org.springframework.web.multipart.MultipartFile file) {
        try (InputStream inputStream = file.getInputStream()) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (IOException | NoSuchAlgorithmException exception) {
            throw new IllegalStateException("No se pudo calcular el checksum del archivo", exception);
        }
    }

    private DocumentCategoryResponse toCategoryResponse(DocumentCategoryEntity entity) {
        return new DocumentCategoryResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getModuleCode(),
                entity.getCaseTypeId(),
                entity.getRequiresDate(),
                entity.getVisibleToCustomer()
        );
    }

    private DocumentResponse toResponse(DocumentEntity entity) {
        return new DocumentResponse(
                entity.getId(),
                entity.getPublicId(),
                entity.getFileName(),
                entity.getExtension(),
                entity.getMimeType(),
                entity.getSizeBytes(),
                entity.getChecksumSha256(),
                entity.getCategoryId(),
                entity.getSubcategoryCode(),
                entity.getDocumentDate(),
                entity.getUploadedBy(),
                entity.getOriginCode(),
                entity.getObservations(),
                entity.getReplacesDocumentId(),
                entity.getActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private DocumentRelationResponse toRelationResponse(DocumentRelationEntity entity) {
        return new DocumentRelationResponse(
                entity.getId(),
                entity.getDocumentId(),
                entity.getCaseId(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getModuleCode(),
                entity.getPrincipal(),
                entity.getVisibleToCustomer(),
                entity.getVisualOrder()
        );
    }

    private CaseDocumentResponse toCaseDocumentResponse(DocumentRelationEntity relation, DocumentEntity document) {
        if (document == null) {
            return null;
        }
        return new CaseDocumentResponse(
                relation.getId(),
                document.getId(),
                document.getPublicId(),
                document.getFileName(),
                document.getMimeType(),
                document.getSizeBytes(),
                document.getCategoryId(),
                relation.getEntityType(),
                relation.getEntityId(),
                relation.getModuleCode(),
                relation.getPrincipal(),
                relation.getVisibleToCustomer(),
                document.getDocumentDate(),
                document.getOriginCode(),
                document.getCreatedAt()
        );
    }

    private String filenameExtension(String fileName) {
        if (!StringUtils.hasText(fileName) || !fileName.contains(".")) {
            return null;
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }

    private String safeFileName(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return "archivo.bin";
        }
        return fileName.replace("..", "_").trim();
    }

    private String normalizeCode(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim().toUpperCase();
    }

    private String blankToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private String blankToDefault(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }
}
