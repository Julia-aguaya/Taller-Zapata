package com.tallerzapata.backend.application.operation;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tallerzapata.backend.api.operation.OperationalTaskCreateRequest;
import com.tallerzapata.backend.api.operation.OperationalTaskPageResponse;
import com.tallerzapata.backend.api.operation.OperationalTaskResponse;
import com.tallerzapata.backend.api.operation.OperationalTaskUpdateRequest;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.OperationalTaskEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.OperationalTaskRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.TaskPriorityRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.TaskStatusEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.TaskStatusRepository;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchRepository;
import com.tallerzapata.backend.infrastructure.persistence.organization.OrganizationRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.UserEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class OperationalTaskService {

    private final OperationalTaskRepository operationalTaskRepository;
    private final TaskStatusRepository taskStatusRepository;
    private final TaskPriorityRepository taskPriorityRepository;
    private final CaseRepository caseRepository;
    private final OrganizationRepository organizationRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService caseAccessControlService;
    private final CaseAuditService caseAuditService;
    private final ObjectMapper objectMapper;

    public OperationalTaskService(
            OperationalTaskRepository operationalTaskRepository,
            TaskStatusRepository taskStatusRepository,
            TaskPriorityRepository taskPriorityRepository,
            CaseRepository caseRepository,
            OrganizationRepository organizationRepository,
            BranchRepository branchRepository,
            UserRepository userRepository,
            CurrentUserService currentUserService,
            CaseAccessControlService caseAccessControlService,
            CaseAuditService caseAuditService,
            ObjectMapper objectMapper
    ) {
        this.operationalTaskRepository = operationalTaskRepository;
        this.taskStatusRepository = taskStatusRepository;
        this.taskPriorityRepository = taskPriorityRepository;
        this.caseRepository = caseRepository;
        this.organizationRepository = organizationRepository;
        this.branchRepository = branchRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.caseAccessControlService = caseAccessControlService;
        this.caseAuditService = caseAuditService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public OperationalTaskPageResponse list(
            int page,
            int size,
            Long caseId,
            Long assignedUserId,
            String statusCode,
            Long organizationId,
            Long branchId
    ) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        caseAccessControlService.requirePermission(currentUser, "tarea.ver");

        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);
        String normalizedStatusCode = normalizeCode(statusCode);

        if (organizationId != null) {
            caseAccessControlService.requireOrganizationScope(currentUser, organizationId, branchId);
        }

        List<OperationalTaskResponse> scopedItems = operationalTaskRepository.findAll(
                        Sort.by(
                                Sort.Order.asc("resolved"),
                                Sort.Order.asc("dueDate"),
                                Sort.Order.desc("id")
                        )
                ).stream()
                .filter(item -> caseAccessControlService.hasOrganizationScope(currentUser, item.getOrganizationId(), item.getBranchId()))
                .filter(item -> caseId == null || caseId.equals(item.getCaseId()))
                .filter(item -> assignedUserId == null || assignedUserId.equals(item.getAssignedUserId()))
                .filter(item -> normalizedStatusCode == null || normalizedStatusCode.equals(item.getStatusCode()))
                .filter(item -> organizationId == null || organizationId.equals(item.getOrganizationId()))
                .filter(item -> branchId == null || branchId.equals(item.getBranchId()))
                .map(this::toResponse)
                .toList();

        long totalElements = scopedItems.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / normalizedSize);
        int fromIndex = normalizedPage * normalizedSize;
        List<OperationalTaskResponse> pageItems = fromIndex >= scopedItems.size()
                ? List.of()
                : scopedItems.subList(fromIndex, Math.min(fromIndex + normalizedSize, scopedItems.size()));

        return new OperationalTaskPageResponse(pageItems, normalizedPage, normalizedSize, totalElements, totalPages);
    }

    @Transactional
    public OperationalTaskResponse create(OperationalTaskCreateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        caseAccessControlService.requirePermission(currentUser, "tarea.crear");

        TaskScope scope = resolveScopeForCreate(currentUser, request.caseId(), request.organizationId(), request.branchId());
        validatePriorityCode(request.priorityCode());
        TaskStatusEntity status = requireTaskStatus(normalizeCode(request.statusCode()) == null ? "PENDIENTE" : request.statusCode());
        Long assignedUserId = requireActiveUserIfPresent(request.assignedUserId());

        OperationalTaskEntity entity = new OperationalTaskEntity();
        entity.setCaseId(request.caseId());
        entity.setOrganizationId(scope.organizationId());
        entity.setBranchId(scope.branchId());
        entity.setOriginModuleCode(blankToNull(request.originModuleCode()));
        entity.setOriginSubtabCode(blankToNull(request.originSubtabCode()));
        entity.setTitle(request.title().trim());
        entity.setDescription(blankToNull(request.description()));
        entity.setDueDate(request.dueDate());
        entity.setPriorityCode(normalizeCode(request.priorityCode()));
        entity.setStatusCode(status.getCode());
        entity.setAssignedUserId(assignedUserId);
        entity.setCreatedBy(currentUser.id());
        applyResolutionState(entity, status);
        entity.setPayloadJson(toJson(request.payload()));
        entity = operationalTaskRepository.save(entity);

        if (entity.getCaseId() != null) {
            caseAuditService.register(
                    currentUser.id(),
                    entity.getCaseId(),
                    "tarea",
                    entity.getId(),
                    "crear_tarea",
                    null,
                    caseAuditService.toJson(toAuditPayload(entity)),
                    caseAuditService.toJson(Map.of("domain", "operacion")),
                    httpRequest
            );
        }

        return toResponse(entity);
    }

    @Transactional
    public OperationalTaskResponse update(Long taskId, OperationalTaskUpdateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        OperationalTaskEntity entity = operationalTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la tarea " + taskId));

        requireTaskAccess(currentUser, entity, "tarea.editar");
        validatePriorityCode(request.priorityCode());
        TaskStatusEntity status = requireTaskStatus(request.statusCode());
        Long assignedUserId = requireActiveUserIfPresent(request.assignedUserId());

        Map<String, Object> before = toAuditPayload(entity);

        entity.setOriginModuleCode(blankToNull(request.originModuleCode()));
        entity.setOriginSubtabCode(blankToNull(request.originSubtabCode()));
        entity.setTitle(request.title().trim());
        entity.setDescription(blankToNull(request.description()));
        entity.setDueDate(request.dueDate());
        entity.setPriorityCode(normalizeCode(request.priorityCode()));
        entity.setStatusCode(status.getCode());
        entity.setAssignedUserId(assignedUserId);
        applyResolutionState(entity, status);
        entity.setPayloadJson(toJson(request.payload()));
        entity = operationalTaskRepository.save(entity);

        if (entity.getCaseId() != null) {
            caseAuditService.register(
                    currentUser.id(),
                    entity.getCaseId(),
                    "tarea",
                    entity.getId(),
                    "actualizar_tarea",
                    caseAuditService.toJson(before),
                    caseAuditService.toJson(toAuditPayload(entity)),
                    caseAuditService.toJson(Map.of("domain", "operacion")),
                    httpRequest
            );
        }

        return toResponse(entity);
    }

    private TaskScope resolveScopeForCreate(AuthenticatedUser currentUser, Long caseId, Long organizationId, Long branchId) {
        if (caseId != null) {
            CaseEntity caseEntity = caseRepository.findById(caseId)
                    .orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
            caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "tarea.crear");
            return new TaskScope(caseEntity.getOrganizationId(), caseEntity.getBranchId());
        }

        if (organizationId == null) {
            throw new ConflictException("organizationId es obligatorio cuando la tarea no pertenece a un caso");
        }
        if (!organizationRepository.existsById(organizationId)) {
            throw new ResourceNotFoundException("No existe la organizacion " + organizationId);
        }
        if (branchId != null) {
            BranchEntity branch = branchRepository.findById(branchId)
                    .orElseThrow(() -> new ResourceNotFoundException("No existe la sucursal " + branchId));
            if (!branch.getOrganizationId().equals(organizationId)) {
                throw new ConflictException("La sucursal no pertenece a la organizacion indicada");
            }
        }
        caseAccessControlService.requireOrganizationScope(currentUser, organizationId, branchId);
        return new TaskScope(organizationId, branchId);
    }

    private void requireTaskAccess(AuthenticatedUser currentUser, OperationalTaskEntity entity, String permissionCode) {
        caseAccessControlService.requirePermission(currentUser, permissionCode);
        if (entity.getCaseId() != null) {
            CaseEntity caseEntity = caseRepository.findById(entity.getCaseId())
                    .orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + entity.getCaseId()));
            caseAccessControlService.requireOrganizationScope(currentUser, caseEntity.getOrganizationId(), caseEntity.getBranchId());
            return;
        }
        caseAccessControlService.requireOrganizationScope(currentUser, entity.getOrganizationId(), entity.getBranchId());
    }

    private void validatePriorityCode(String priorityCode) {
        String normalizedCode = normalizeCode(priorityCode);
        if (normalizedCode == null || !taskPriorityRepository.existsByCodeAndActiveTrue(normalizedCode)) {
            throw new ConflictException("priorityCode no permitido: " + priorityCode);
        }
    }

    private TaskStatusEntity requireTaskStatus(String statusCode) {
        String normalizedCode = normalizeCode(statusCode);
        return taskStatusRepository.findByCodeAndActiveTrue(normalizedCode)
                .orElseThrow(() -> new ConflictException("statusCode no permitido: " + statusCode));
    }

    private Long requireActiveUserIfPresent(Long userId) {
        if (userId == null) {
            return null;
        }
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el usuario " + userId));
        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new ConflictException("El usuario asignado esta inactivo: " + userId);
        }
        return userId;
    }

    private void applyResolutionState(OperationalTaskEntity entity, TaskStatusEntity status) {
        boolean terminal = Boolean.TRUE.equals(status.getTerminal());
        entity.setResolved(terminal);
        entity.setResolvedAt(terminal ? LocalDateTime.now() : null);
    }

    private OperationalTaskResponse toResponse(OperationalTaskEntity entity) {
        return new OperationalTaskResponse(
                entity.getId(),
                entity.getPublicId(),
                entity.getCaseId(),
                entity.getOrganizationId(),
                entity.getBranchId(),
                entity.getOriginModuleCode(),
                entity.getOriginSubtabCode(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getDueDate(),
                entity.getPriorityCode(),
                entity.getStatusCode(),
                entity.getAssignedUserId(),
                entity.getCreatedBy(),
                entity.getResolved(),
                entity.getResolvedAt(),
                parseJson(entity.getPayloadJson()),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private Map<String, Object> toAuditPayload(OperationalTaskEntity entity) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("domain", "operacion");
        payload.put("caseId", entity.getCaseId());
        payload.put("organizationId", entity.getOrganizationId());
        payload.put("branchId", entity.getBranchId());
        payload.put("title", entity.getTitle());
        payload.put("priorityCode", entity.getPriorityCode());
        payload.put("statusCode", entity.getStatusCode());
        payload.put("assignedUserId", entity.getAssignedUserId());
        payload.put("resolved", entity.getResolved());
        return payload;
    }

    private String toJson(JsonNode payload) {
        if (payload == null || payload.isNull()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("No se pudo serializar payload_json", exception);
        }
    }

    private JsonNode parseJson(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readTree(payloadJson);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("No se pudo leer payload_json", exception);
        }
    }

    private String normalizeCode(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase();
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private record TaskScope(Long organizationId, Long branchId) {
    }
}
