package com.tallerzapata.backend.application.system;

import com.tallerzapata.backend.api.system.SystemParameterResponse;
import com.tallerzapata.backend.api.system.SystemParameterUpsertRequest;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.system.ParameterDataTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.system.SystemParameterEntity;
import com.tallerzapata.backend.infrastructure.persistence.system.SystemParameterRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class SystemParameterService {

    private final SystemParameterRepository systemParameterRepository;
    private final ParameterDataTypeRepository parameterDataTypeRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService accessControlService;
    private final CaseAuditService caseAuditService;

    public SystemParameterService(SystemParameterRepository systemParameterRepository,
                                  ParameterDataTypeRepository parameterDataTypeRepository,
                                  CurrentUserService currentUserService,
                                  CaseAccessControlService accessControlService,
                                  CaseAuditService caseAuditService) {
        this.systemParameterRepository = systemParameterRepository;
        this.parameterDataTypeRepository = parameterDataTypeRepository;
        this.currentUserService = currentUserService;
        this.accessControlService = accessControlService;
        this.caseAuditService = caseAuditService;
    }

    @Transactional(readOnly = true)
    public List<SystemParameterResponse> listParameters() {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "parametro.ver");
        return systemParameterRepository.findAll().stream()
                .filter(e -> Boolean.TRUE.equals(e.getVisible()))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SystemParameterResponse> listParametersByModule(String moduleCode) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "parametro.ver");
        return systemParameterRepository.findByModuleCodeAndVisibleTrue(moduleCode).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SystemParameterResponse getParameter(String code) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "parametro.ver");
        SystemParameterEntity entity = systemParameterRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el parametro con codigo " + code));
        return toResponse(entity);
    }

    @Transactional
    public SystemParameterResponse upsertParameter(SystemParameterUpsertRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "parametro.editar");

        String normalizedCode = request.code().trim().toUpperCase();
        String normalizedDataTypeCode = request.dataTypeCode().trim().toUpperCase();

        if (!parameterDataTypeRepository.existsByCodeAndActiveTrue(normalizedDataTypeCode)) {
            throw new ConflictException("tipoDatoCodigo no permitido: " + request.dataTypeCode());
        }

        SystemParameterEntity entity = systemParameterRepository.findByCode(normalizedCode).orElseGet(SystemParameterEntity::new);

        if (entity.getId() != null && Boolean.FALSE.equals(entity.getEditable())) {
            throw new ConflictException("El parametro " + normalizedCode + " no es editable");
        }

        boolean isCreate = entity.getId() == null;
        entity.setCode(normalizedCode);
        entity.setValue(request.value().trim());
        entity.setDataTypeCode(normalizedDataTypeCode);
        entity.setDescription(request.description() == null || request.description().isBlank() ? null : request.description().trim());
        entity.setEditable(request.editable() == null || request.editable());
        entity.setVisible(request.visible() == null || request.visible());
        entity.setModuleCode(request.moduleCode() == null || request.moduleCode().isBlank() ? "GENERAL" : request.moduleCode().trim().toUpperCase());

        entity = systemParameterRepository.save(entity);

        caseAuditService.register(
                currentUser.id(),
                null,
                "parametros_sistema",
                entity.getId(),
                "upsert_parametro_sistema",
                null,
                caseAuditService.toJson(Map.of("code", entity.getCode(), "value", entity.getValue(), "dataTypeCode", entity.getDataTypeCode())),
                caseAuditService.toJson(Map.of("domain", "sistema")),
                httpRequest
        );

        return toResponse(entity);
    }

    private SystemParameterResponse toResponse(SystemParameterEntity e) {
        return new SystemParameterResponse(
                e.getId(),
                e.getCode(),
                e.getValue(),
                e.getDataTypeCode(),
                e.getDescription(),
                e.getEditable(),
                e.getVisible(),
                e.getModuleCode()
        );
    }
}
