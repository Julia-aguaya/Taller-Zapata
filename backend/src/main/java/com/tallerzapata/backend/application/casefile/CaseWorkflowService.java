package com.tallerzapata.backend.application.casefile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tallerzapata.backend.api.casefile.CaseWorkflowActionResponse;
import com.tallerzapata.backend.api.casefile.CaseWorkflowActionsResponse;
import com.tallerzapata.backend.api.casefile.CaseWorkflowHistoryResponse;
import com.tallerzapata.backend.api.casefile.CaseWorkflowTransitionRequest;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.workflow.CaseStateHistoryEntity;
import com.tallerzapata.backend.infrastructure.persistence.workflow.CaseStateHistoryRepository;
import com.tallerzapata.backend.infrastructure.persistence.workflow.WorkflowStateEntity;
import com.tallerzapata.backend.infrastructure.persistence.workflow.WorkflowStateRepository;
import com.tallerzapata.backend.infrastructure.persistence.workflow.WorkflowTransitionEntity;
import com.tallerzapata.backend.infrastructure.persistence.workflow.WorkflowTransitionRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
public class CaseWorkflowService {

    private final CaseRepository caseRepository;
    private final WorkflowTransitionRepository workflowTransitionRepository;
    private final WorkflowStateRepository workflowStateRepository;
    private final CaseStateHistoryRepository caseStateHistoryRepository;
    private final CaseAuditService caseAuditService;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService caseAccessControlService;
    private final ObjectMapper objectMapper;

    public CaseWorkflowService(
            CaseRepository caseRepository,
            WorkflowTransitionRepository workflowTransitionRepository,
            WorkflowStateRepository workflowStateRepository,
            CaseStateHistoryRepository caseStateHistoryRepository,
            CaseAuditService caseAuditService,
            CurrentUserService currentUserService,
            CaseAccessControlService caseAccessControlService,
            ObjectMapper objectMapper
    ) {
        this.caseRepository = caseRepository;
        this.workflowTransitionRepository = workflowTransitionRepository;
        this.workflowStateRepository = workflowStateRepository;
        this.caseStateHistoryRepository = caseStateHistoryRepository;
        this.caseAuditService = caseAuditService;
        this.currentUserService = currentUserService;
        this.caseAccessControlService = caseAccessControlService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void transition(Long caseId, CaseWorkflowTransitionRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "caso.ver");

        Long currentStateId = resolveCurrentStateId(caseEntity, request.domain());
        if (currentStateId == null) {
            throw new ConflictException("El caso no tiene un estado actual para el dominio " + request.domain());
        }

        WorkflowStateEntity sourceState = workflowStateRepository.findById(currentStateId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el estado origen " + currentStateId));

        WorkflowTransitionEntity transition = workflowTransitionRepository
                .findByDomainAndSourceStateIdAndActiveTrue(request.domain(), currentStateId)
                .stream()
                .filter(item -> item.getActionCode().equals(request.actionCode()))
                .findFirst()
                .orElseThrow(() -> new ConflictException("No existe una transicion valida para esa accion"));

        String requiredPermissionCode = transition.getRequiredPermissionCode() == null || transition.getRequiredPermissionCode().isBlank()
                ? "workflow.transicionar"
                : transition.getRequiredPermissionCode();
        caseAccessControlService.requirePermission(currentUser, requiredPermissionCode);

        if (!evaluateRule(transition.getRuleJson(), caseEntity, request)) {
            throw new ConflictException("La transicion no cumple la regla configurada");
        }

        WorkflowStateEntity targetState = workflowStateRepository.findById(transition.getTargetStateId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el estado destino " + transition.getTargetStateId()));

        updateCurrentState(caseEntity, request.domain(), targetState.getId());
        caseRepository.save(caseEntity);

        CaseStateHistoryEntity historyEntity = new CaseStateHistoryEntity();
        historyEntity.setCaseId(caseEntity.getId());
        historyEntity.setStateDomain(request.domain());
        historyEntity.setStateId(targetState.getId());
        historyEntity.setStateDate(LocalDateTime.now());
        historyEntity.setUserId(currentUser.id());
        historyEntity.setAutomatic(Boolean.TRUE.equals(request.automatic()));
        historyEntity.setMotivo(request.reason());
        historyEntity.setDetailJson(caseAuditService.toJson(Map.of(
                "actionCode", request.actionCode(),
                "sourceStateCode", sourceState.getCode(),
                "targetStateCode", targetState.getCode(),
                "ruleApplied", transition.getRuleJson() != null
        )));
        caseStateHistoryRepository.save(historyEntity);

        Map<String, Object> before = new LinkedHashMap<>();
        before.put("domain", request.domain());
        before.put("stateId", sourceState.getId());
        before.put("stateCode", sourceState.getCode());

        Map<String, Object> after = new LinkedHashMap<>();
        after.put("domain", request.domain());
        after.put("stateId", targetState.getId());
        after.put("stateCode", targetState.getCode());

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("actionCode", request.actionCode());
        metadata.put("automatic", Boolean.TRUE.equals(request.automatic()));
        metadata.put("reason", request.reason());
        metadata.put("ruleJson", transition.getRuleJson());
        metadata.put("requiredPermissionCode", requiredPermissionCode);

        caseAuditService.register(
                currentUser.id(),
                caseEntity.getId(),
                "casos",
                caseEntity.getId(),
                "transicionar_estado",
                caseAuditService.toJson(before),
                caseAuditService.toJson(after),
                caseAuditService.toJson(metadata),
                httpRequest
        );
    }

    @Transactional(readOnly = true)
    public List<CaseWorkflowHistoryResponse> getHistory(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "caso.ver");
        return caseStateHistoryRepository.findByCaseIdOrderByStateDateDescIdDesc(caseId)
                .stream()
                .map(history -> {
                    WorkflowStateEntity state = workflowStateRepository.findById(history.getStateId())
                            .orElseThrow(() -> new ResourceNotFoundException("No existe el estado " + history.getStateId()));
                    return new CaseWorkflowHistoryResponse(
                            history.getId(),
                            history.getStateDomain(),
                            history.getStateId(),
                            state.getCode(),
                            state.getName(),
                            history.getStateDate(),
                            history.getUserId(),
                            history.getAutomatic(),
                            history.getMotivo()
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public CaseWorkflowActionsResponse getAvailableActions(Long caseId, String domain) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "caso.ver");

        List<String> domains = resolveDomains(domain);
        List<CaseWorkflowActionResponse> actions = new ArrayList<>();

        for (String selectedDomain : domains) {
            Long currentStateId = resolveCurrentStateId(caseEntity, selectedDomain);
            if (currentStateId == null) {
                continue;
            }

            WorkflowStateEntity sourceState = workflowStateRepository.findById(currentStateId)
                    .orElseThrow(() -> new ResourceNotFoundException("No existe el estado origen " + currentStateId));

            List<WorkflowTransitionEntity> transitions = workflowTransitionRepository
                    .findByDomainAndSourceStateIdAndActiveTrue(selectedDomain, currentStateId);

            for (WorkflowTransitionEntity transition : transitions) {
                String requiredPermissionCode = transition.getRequiredPermissionCode() == null || transition.getRequiredPermissionCode().isBlank()
                        ? "workflow.transicionar"
                        : transition.getRequiredPermissionCode();

                if (!caseAccessControlService.hasPermission(currentUser, requiredPermissionCode)) {
                    continue;
                }

                CaseWorkflowTransitionRequest simulatedRequest = new CaseWorkflowTransitionRequest(
                        selectedDomain,
                        transition.getActionCode(),
                        null,
                        transition.getAutomatic()
                );
                if (!evaluateRule(transition.getRuleJson(), caseEntity, simulatedRequest)) {
                    continue;
                }

                WorkflowStateEntity targetState = workflowStateRepository.findById(transition.getTargetStateId())
                        .orElseThrow(() -> new ResourceNotFoundException("No existe el estado destino " + transition.getTargetStateId()));

                actions.add(new CaseWorkflowActionResponse(
                        selectedDomain,
                        transition.getActionCode(),
                        sourceState.getId(),
                        sourceState.getCode(),
                        targetState.getId(),
                        targetState.getCode(),
                        targetState.getName(),
                        requiredPermissionCode,
                        transition.getAutomatic()
                ));
            }
        }

        return new CaseWorkflowActionsResponse(caseId, actions);
    }

    @Transactional
    public void syncRepairStateFromOperation(
            Long caseId,
            String targetStateCode,
            Long userId,
            String operationActionCode,
            String reason,
            HttpServletRequest httpRequest
    ) {
        CaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));

        Long currentStateId = caseEntity.getCurrentRepairStateId();
        if (currentStateId == null) {
            throw new ConflictException("El caso no tiene un estado actual para el dominio reparacion");
        }

        WorkflowStateEntity sourceState = workflowStateRepository.findById(currentStateId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el estado origen " + currentStateId));
        WorkflowStateEntity targetState = workflowStateRepository.findByDomainAndCode("reparacion", targetStateCode)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el estado destino reparacion " + targetStateCode));

        if (Objects.equals(sourceState.getId(), targetState.getId())) {
            return;
        }

        updateCurrentState(caseEntity, "reparacion", targetState.getId());
        caseRepository.save(caseEntity);

        CaseStateHistoryEntity historyEntity = new CaseStateHistoryEntity();
        historyEntity.setCaseId(caseEntity.getId());
        historyEntity.setStateDomain("reparacion");
        historyEntity.setStateId(targetState.getId());
        historyEntity.setStateDate(LocalDateTime.now());
        historyEntity.setUserId(userId);
        historyEntity.setAutomatic(true);
        historyEntity.setMotivo(reason);
        historyEntity.setDetailJson(caseAuditService.toJson(Map.of(
                "actionCode", operationActionCode,
                "sourceStateCode", sourceState.getCode(),
                "targetStateCode", targetState.getCode(),
                "trigger", "operacion"
        )));
        caseStateHistoryRepository.save(historyEntity);

        Map<String, Object> before = new LinkedHashMap<>();
        before.put("domain", "reparacion");
        before.put("stateId", sourceState.getId());
        before.put("stateCode", sourceState.getCode());

        Map<String, Object> after = new LinkedHashMap<>();
        after.put("domain", "reparacion");
        after.put("stateId", targetState.getId());
        after.put("stateCode", targetState.getCode());

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("actionCode", operationActionCode);
        metadata.put("automatic", true);
        metadata.put("reason", reason);
        metadata.put("trigger", "operacion");

        caseAuditService.register(
                userId,
                caseEntity.getId(),
                "casos",
                caseEntity.getId(),
                "transicionar_estado",
                caseAuditService.toJson(before),
                caseAuditService.toJson(after),
                caseAuditService.toJson(metadata),
                httpRequest
        );
    }

    private Long resolveCurrentStateId(CaseEntity caseEntity, String domain) {
        return switch (domain) {
            case "tramite" -> caseEntity.getCurrentCaseStateId();
            case "reparacion" -> caseEntity.getCurrentRepairStateId();
            case "pago" -> caseEntity.getCurrentPaymentStateId();
            case "documentacion" -> caseEntity.getCurrentDocumentationStateId();
            case "legal" -> caseEntity.getCurrentLegalStateId();
            default -> throw new ConflictException("Dominio de workflow no soportado: " + domain);
        };
    }

    private void updateCurrentState(CaseEntity caseEntity, String domain, Long stateId) {
        switch (domain) {
            case "tramite" -> caseEntity.setCurrentCaseStateId(stateId);
            case "reparacion" -> caseEntity.setCurrentRepairStateId(stateId);
            case "pago" -> caseEntity.setCurrentPaymentStateId(stateId);
            case "documentacion" -> caseEntity.setCurrentDocumentationStateId(stateId);
            case "legal" -> caseEntity.setCurrentLegalStateId(stateId);
            default -> throw new ConflictException("Dominio de workflow no soportado: " + domain);
        }
    }

    private List<String> resolveDomains(String domain) {
        List<String> allDomains = List.of("tramite", "reparacion", "pago", "documentacion", "legal");
        if (domain == null || domain.isBlank()) {
            return allDomains;
        }

        String normalized = domain.trim().toLowerCase(Locale.ROOT);
        if (!allDomains.contains(normalized)) {
            throw new ConflictException("Dominio de workflow no soportado: " + domain);
        }
        return List.of(normalized);
    }

    private boolean evaluateRule(String ruleJson, CaseEntity caseEntity, CaseWorkflowTransitionRequest request) {
        if (ruleJson == null || ruleJson.isBlank()) {
            return true;
        }

        try {
            JsonNode root = objectMapper.readTree(ruleJson);
            return evaluateNode(root, caseEntity, request);
        } catch (ConflictException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ConflictException("La regla_json configurada es invalida");
        }
    }

    private boolean evaluateNode(JsonNode node, CaseEntity caseEntity, CaseWorkflowTransitionRequest request) {
        if (node.has("always")) {
            return node.get("always").asBoolean(false);
        }

        if (node.has("all")) {
            for (JsonNode child : node.get("all")) {
                if (!evaluateNode(child, caseEntity, request)) {
                    return false;
                }
            }
            return true;
        }

        if (node.has("any")) {
            for (JsonNode child : node.get("any")) {
                if (evaluateNode(child, caseEntity, request)) {
                    return true;
                }
            }
            return false;
        }

        if (node.has("not")) {
            return !evaluateNode(node.get("not"), caseEntity, request);
        }

        String field = node.path("field").asText("");
        String op = node.path("op").asText("EQ").toUpperCase(Locale.ROOT);
        JsonNode valueNode = node.get("value");
        Object left = resolveFieldValue(field, caseEntity, request);
        Object right = valueNode == null || valueNode.isNull() ? null : objectMapper.convertValue(valueNode, Object.class);

        return switch (op) {
            case "EQ" -> Objects.equals(left, right);
            case "NEQ" -> !Objects.equals(left, right);
            case "NOT_NULL" -> left != null;
            case "NULL" -> left == null;
            case "IN" -> inList(left, right);
            case "NOT_IN" -> !inList(left, right);
            case "GT" -> compare(left, right) > 0;
            case "GTE" -> compare(left, right) >= 0;
            case "LT" -> compare(left, right) < 0;
            case "LTE" -> compare(left, right) <= 0;
            case "CONTAINS" -> contains(left, right);
            case "STARTS_WITH" -> startsWith(left, right);
            default -> throw new ConflictException("Operador de regla_json no soportado: " + op);
        };
    }

    private Object resolveFieldValue(String field, CaseEntity caseEntity, CaseWorkflowTransitionRequest request) {
        return switch (field) {
            case "referenced" -> caseEntity.getReferenced();
            case "priorityCode" -> caseEntity.getPriorityCode();
            case "organizationId" -> caseEntity.getOrganizationId();
            case "branchId" -> caseEntity.getBranchId();
            case "caseTypeId" -> caseEntity.getCaseTypeId();
            case "actionCode" -> request.actionCode();
            case "domain" -> request.domain();
            case "reason" -> request.reason();
            case "automatic" -> Boolean.TRUE.equals(request.automatic());
            default -> throw new ConflictException("Campo de regla_json no soportado: " + field);
        };
    }

    private boolean inList(Object left, Object right) {
        if (right == null) {
            return left == null;
        }
        if (!(right instanceof List<?> list)) {
            throw new ConflictException("El operador IN requiere una lista en value");
        }
        List<Object> normalized = new ArrayList<>(list.size());
        for (Object item : list) {
            normalized.add(item);
        }
        return normalized.stream().anyMatch(item -> Objects.equals(left, item));
    }

    private int compare(Object left, Object right) {
        if (left == null || right == null) {
            throw new ConflictException("No se puede comparar con valores nulos en regla_json");
        }

        if (left instanceof Number leftNumber && right instanceof Number rightNumber) {
            return Double.compare(leftNumber.doubleValue(), rightNumber.doubleValue());
        }

        if (left instanceof String leftString && right instanceof String rightString) {
            return leftString.compareTo(rightString);
        }

        throw new ConflictException("Tipos incompatibles para comparacion en regla_json");
    }

    private boolean contains(Object left, Object right) {
        if (left == null || right == null) {
            return false;
        }
        if (left instanceof String leftString && right instanceof String rightString) {
            return leftString.contains(rightString);
        }
        throw new ConflictException("El operador CONTAINS requiere valores string");
    }

    private boolean startsWith(Object left, Object right) {
        if (left == null || right == null) {
            return false;
        }
        if (left instanceof String leftString && right instanceof String rightString) {
            return leftString.startsWith(rightString);
        }
        throw new ConflictException("El operador STARTS_WITH requiere valores string");
    }
}
