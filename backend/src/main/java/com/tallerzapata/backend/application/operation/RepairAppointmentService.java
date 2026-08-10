package com.tallerzapata.backend.application.operation;

import com.tallerzapata.backend.api.operation.RepairAppointmentCreateRequest;
import com.tallerzapata.backend.api.operation.RepairAppointmentResponse;
import com.tallerzapata.backend.api.operation.RepairAppointmentUpdateRequest;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.casefile.CaseWorkflowService;
import com.tallerzapata.backend.application.casefile.particular.ParticularEffectiveStateRecalculator;
import com.tallerzapata.backend.application.casefile.todoriskstate.TodoRiesgoEffectiveStateRecalculator;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.application.common.BusinessDayCalculator;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceProcessingEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceProcessingRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.HolidayEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.HolidayRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentStatusRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.UserEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.time.LocalDate;
import java.time.LocalTime;

@Service
public class RepairAppointmentService {

    private final RepairAppointmentRepository repairAppointmentRepository;
    private final RepairAppointmentStatusRepository repairAppointmentStatusRepository;
    private final CaseRepository caseRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService caseAccessControlService;
    private final CaseAuditService caseAuditService;
    private final CaseWorkflowService caseWorkflowService;
    private final HolidayRepository holidayRepository;
    private final BusinessDayCalculator businessDayCalculator;
    private final ParticularEffectiveStateRecalculator particularEffectiveStateRecalculator;
    private final TodoRiesgoEffectiveStateRecalculator todoRiesgoEffectiveStateRecalculator;
    private final InsuranceProcessingRepository insuranceProcessingRepository;
    private final CaseTypeRepository caseTypeRepository;
    private final CasePartRepository casePartRepository;

    public RepairAppointmentService(
            RepairAppointmentRepository repairAppointmentRepository,
            RepairAppointmentStatusRepository repairAppointmentStatusRepository,
            CaseRepository caseRepository,
            UserRepository userRepository,
            CurrentUserService currentUserService,
            CaseAccessControlService caseAccessControlService,
            CaseAuditService caseAuditService,
            CaseWorkflowService caseWorkflowService,
            HolidayRepository holidayRepository,
            BusinessDayCalculator businessDayCalculator,
            ParticularEffectiveStateRecalculator particularEffectiveStateRecalculator,
            TodoRiesgoEffectiveStateRecalculator todoRiesgoEffectiveStateRecalculator,
            InsuranceProcessingRepository insuranceProcessingRepository,
            CaseTypeRepository caseTypeRepository,
            CasePartRepository casePartRepository
    ) {
        this.repairAppointmentRepository = repairAppointmentRepository;
        this.repairAppointmentStatusRepository = repairAppointmentStatusRepository;
        this.caseRepository = caseRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.caseAccessControlService = caseAccessControlService;
        this.caseAuditService = caseAuditService;
        this.caseWorkflowService = caseWorkflowService;
        this.holidayRepository = holidayRepository;
        this.businessDayCalculator = businessDayCalculator;
        this.particularEffectiveStateRecalculator = particularEffectiveStateRecalculator;
        this.todoRiesgoEffectiveStateRecalculator = todoRiesgoEffectiveStateRecalculator;
        this.insuranceProcessingRepository = insuranceProcessingRepository;
        this.caseTypeRepository = caseTypeRepository;
        this.casePartRepository = casePartRepository;
    }

    @Transactional(readOnly = true)
    public List<RepairAppointmentResponse> listByCase(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "turno.ver");

        return repairAppointmentRepository.findByCaseId(
                        caseId,
                        Sort.by(Sort.Order.desc("appointmentDate"), Sort.Order.desc("appointmentTime"), Sort.Order.desc("id"))
                ).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public RepairAppointmentResponse create(Long caseId, RepairAppointmentCreateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "turno.crear");

        // Para tramites con seguro: validar que la cotizacion este acordada
        CaseTypeEntity caseType = caseTypeRepository.findById(caseEntity.getCaseTypeId()).orElse(null);
        if (caseType != null && Boolean.TRUE.equals(caseType.getRequiresProcessing())) {
            InsuranceProcessingEntity processing = insuranceProcessingRepository.findByCaseId(caseId).orElse(null);
            boolean hasAgreement = processing != null
                    && processing.getAgreedAmount() != null
                    && processing.getQuotationDate() != null
                    && "ACORDADA".equals(normalizeCode(processing.getQuotationStatusCode()));
            if (!hasAgreement) {
                boolean hasOverride = SecurityContextHolder.getContext().getAuthentication()
                        .getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("turno.crear.sin_acuerdo"));
                if (!hasOverride) {
                    throw new ConflictException("Monto pendiente de acordarse con la Cia. Solicite autorizacion al administrador.");
                }
            }
        }

        // Validar repuestos pendientes: si hay repuestos no recibidos, advertir
        List<CasePartEntity> parts = casePartRepository.findByCaseIdOrderByIdAsc(caseId);
        if (!parts.isEmpty()) {
            boolean allReceived = parts.stream().allMatch(p ->
                    "RECIBIDO".equals(normalizeCode(p.getStatusCode())) || "INSTALADO".equals(normalizeCode(p.getStatusCode()))
            );
            if (!allReceived && !Boolean.TRUE.equals(request.overridePendingParts())) {
                throw new ConflictException("Hay repuestos pendientes de recepcion. Confirme para continuar.");
            }
        }

        String statusCode = normalizeStatusCode(request.statusCode());
        requireActiveUser(request.userId());

        RepairAppointmentEntity entity = new RepairAppointmentEntity();
        entity.setCaseId(caseId);
        entity.setAppointmentDate(request.appointmentDate());
        entity.setAppointmentTime(request.appointmentTime());
        entity.setEstimatedDays(request.estimatedDays());
        entity.setEstimatedExitDate(resolveEstimatedExitDate(request.appointmentDate(), request.estimatedDays(), request.estimatedExitDate()));
        entity.setStatusCode(statusCode);
        entity.setReentry(Boolean.TRUE.equals(request.reentry()));
        entity.setNotes(blankToNull(request.notes()));
        entity.setUserId(request.userId());
        entity = repairAppointmentRepository.save(entity);

        caseAuditService.register(
                currentUser.id(),
                caseId,
                "turno_reparacion",
                entity.getId(),
                "crear_turno",
                null,
                caseAuditService.toJson(toAuditPayload(entity)),
                caseAuditService.toJson(Map.of("domain", "operacion")),
                httpRequest
        );

        caseWorkflowService.syncRepairStateFromOperation(
                caseId,
                "CON_TURNO",
                currentUser.id(),
                "reparacion.asignar_turno.automatico",
                "Turno de reparacion creado",
                httpRequest
        );
        particularEffectiveStateRecalculator.recalculate(caseId);
        todoRiesgoEffectiveStateRecalculator.recalculate(caseId);

        return toResponse(entity);
    }

    @Transactional
    public RepairAppointmentResponse update(Long appointmentId, RepairAppointmentUpdateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        RepairAppointmentEntity entity = repairAppointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el turno " + appointmentId));
        CaseEntity caseEntity = requireCase(entity.getCaseId());
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "turno.editar");

        String statusCode = normalizeStatusCode(request.statusCode());
        requireActiveUser(request.userId());
        Map<String, Object> before = toAuditPayload(entity);

        entity.setAppointmentDate(request.appointmentDate());
        entity.setAppointmentTime(request.appointmentTime());
        entity.setEstimatedDays(request.estimatedDays());
        entity.setEstimatedExitDate(resolveEstimatedExitDate(request.appointmentDate(), request.estimatedDays(), request.estimatedExitDate()));
        entity.setStatusCode(statusCode);
        entity.setReentry(Boolean.TRUE.equals(request.reentry()));
        entity.setNotes(blankToNull(request.notes()));
        entity.setUserId(request.userId());
        entity = repairAppointmentRepository.save(entity);

        caseAuditService.register(
                currentUser.id(),
                entity.getCaseId(),
                "turno_reparacion",
                entity.getId(),
                "actualizar_turno",
                caseAuditService.toJson(before),
                caseAuditService.toJson(toAuditPayload(entity)),
                caseAuditService.toJson(Map.of("domain", "operacion")),
                httpRequest
        );
        particularEffectiveStateRecalculator.recalculate(entity.getCaseId());
        todoRiesgoEffectiveStateRecalculator.recalculate(entity.getCaseId());

        return toResponse(entity);
    }

    @Transactional
    public RepairAppointmentEntity createAutomaticReentryAppointment(
            Long caseId,
            Long userId,
            LocalDate appointmentDate,
            Integer estimatedDays,
            String notes,
            HttpServletRequest httpRequest
    ) {
        CaseEntity caseEntity = requireCase(caseId);
        requireActiveUser(userId);

        RepairAppointmentEntity entity = new RepairAppointmentEntity();
        entity.setCaseId(caseId);
        entity.setAppointmentDate(appointmentDate);
        entity.setAppointmentTime(LocalTime.of(9, 0));
        entity.setEstimatedDays(estimatedDays);
        entity.setEstimatedExitDate(resolveEstimatedExitDate(appointmentDate, estimatedDays, null));
        entity.setStatusCode("PENDIENTE");
        entity.setReentry(true);
        entity.setNotes(blankToNull(notes));
        entity.setUserId(userId);
        entity = repairAppointmentRepository.save(entity);

        caseAuditService.register(
                userId,
                caseId,
                "turno_reparacion",
                entity.getId(),
                "crear_turno_reingreso_automatico",
                null,
                caseAuditService.toJson(toAuditPayload(entity)),
                caseAuditService.toJson(Map.of("domain", "operacion", "automatic", true)),
                httpRequest
        );

        caseWorkflowService.syncRepairStateFromOperation(
                caseEntity.getId(),
                "CON_TURNO",
                userId,
                "reparacion.asignar_turno_reingreso.automatico",
                "Turno de reingreso generado automaticamente",
                httpRequest
        );
        particularEffectiveStateRecalculator.recalculate(caseId);
        todoRiesgoEffectiveStateRecalculator.recalculate(caseId);

        return entity;
    }

    @Transactional
    public RepairAppointmentEntity updateAutomaticReentryAppointment(
            Long appointmentId,
            Long userId,
            LocalDate appointmentDate,
            Integer estimatedDays,
            String notes,
            HttpServletRequest httpRequest
    ) {
        RepairAppointmentEntity entity = repairAppointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el turno " + appointmentId));
        requireActiveUser(userId);
        Map<String, Object> before = toAuditPayload(entity);

        entity.setAppointmentDate(appointmentDate);
        entity.setAppointmentTime(LocalTime.of(9, 0));
        entity.setEstimatedDays(estimatedDays);
        entity.setEstimatedExitDate(resolveEstimatedExitDate(appointmentDate, estimatedDays, null));
        entity.setStatusCode("PENDIENTE");
        entity.setReentry(true);
        entity.setNotes(blankToNull(notes));
        entity.setUserId(userId);
        entity = repairAppointmentRepository.save(entity);

        caseAuditService.register(
                userId,
                entity.getCaseId(),
                "turno_reparacion",
                entity.getId(),
                "actualizar_turno_reingreso_automatico",
                caseAuditService.toJson(before),
                caseAuditService.toJson(toAuditPayload(entity)),
                caseAuditService.toJson(Map.of("domain", "operacion", "automatic", true)),
                httpRequest
        );

        caseWorkflowService.syncRepairStateFromOperation(
                entity.getCaseId(),
                "CON_TURNO",
                userId,
                "reparacion.actualizar_turno_reingreso.automatico",
                "Turno de reingreso actualizado automaticamente",
                httpRequest
        );
        particularEffectiveStateRecalculator.recalculate(entity.getCaseId());
        todoRiesgoEffectiveStateRecalculator.recalculate(entity.getCaseId());

        return entity;
    }

    @Transactional
    public void cancelAutomaticReentryAppointment(Long appointmentId, Long userId, HttpServletRequest httpRequest) {
        if (appointmentId == null) {
            return;
        }
        RepairAppointmentEntity entity = repairAppointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el turno " + appointmentId));
        Map<String, Object> before = toAuditPayload(entity);
        entity.setStatusCode("CANCELADO");
        entity = repairAppointmentRepository.save(entity);

        caseAuditService.register(
                userId,
                entity.getCaseId(),
                "turno_reparacion",
                entity.getId(),
                "cancelar_turno_reingreso_automatico",
                caseAuditService.toJson(before),
                caseAuditService.toJson(toAuditPayload(entity)),
                caseAuditService.toJson(Map.of("domain", "operacion", "automatic", true)),
                httpRequest
        );
        particularEffectiveStateRecalculator.recalculate(entity.getCaseId());
        todoRiesgoEffectiveStateRecalculator.recalculate(entity.getCaseId());
    }

    private CaseEntity requireCase(Long caseId) {
        return caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
    }

    private String normalizeStatusCode(String statusCode) {
        String normalizedCode = statusCode == null || statusCode.isBlank() ? "PENDIENTE" : statusCode.trim().toUpperCase();
        if (!repairAppointmentStatusRepository.existsByCodeAndActiveTrue(normalizedCode)) {
            throw new ConflictException("statusCode no permitido: " + statusCode);
        }
        return normalizedCode;
    }

    private String normalizeCode(String value) { return value == null || value.isBlank() ? null : value.trim().toUpperCase(Locale.ROOT); }

    private void requireActiveUser(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el usuario " + userId));
        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new ConflictException("El usuario del turno esta inactivo: " + userId);
        }
    }

    private RepairAppointmentResponse toResponse(RepairAppointmentEntity entity) {
        return new RepairAppointmentResponse(
                entity.getId(),
                entity.getPublicId(),
                entity.getCaseId(),
                entity.getAppointmentDate(),
                entity.getAppointmentTime(),
                entity.getEstimatedDays(),
                entity.getEstimatedExitDate(),
                entity.getStatusCode(),
                entity.getReentry(),
                entity.getNotes(),
                entity.getUserId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private Map<String, Object> toAuditPayload(RepairAppointmentEntity entity) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("domain", "operacion");
        payload.put("caseId", entity.getCaseId());
        payload.put("appointmentDate", entity.getAppointmentDate());
        payload.put("appointmentTime", entity.getAppointmentTime());
        payload.put("estimatedDays", entity.getEstimatedDays());
        payload.put("estimatedExitDate", entity.getEstimatedExitDate());
        payload.put("statusCode", entity.getStatusCode());
        payload.put("reentry", entity.getReentry());
        payload.put("userId", entity.getUserId());
        return payload;
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private LocalDate resolveEstimatedExitDate(LocalDate appointmentDate, Integer estimatedDays, LocalDate explicitExitDate) {
        if (explicitExitDate != null) {
            return explicitExitDate;
        }
        if (estimatedDays == null || estimatedDays <= 0) {
            return appointmentDate;
        }
        LocalDate endRange = appointmentDate.plusDays(estimatedDays * 3L + 14);
        List<LocalDate> holidays = holidayRepository.findByDateBetween(appointmentDate, endRange)
                .stream()
                .map(HolidayEntity::getDate)
                .toList();
        return businessDayCalculator.addBusinessDays(appointmentDate, estimatedDays, holidays);
    }
}
