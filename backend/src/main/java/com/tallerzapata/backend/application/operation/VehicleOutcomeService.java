package com.tallerzapata.backend.application.operation;

import com.tallerzapata.backend.api.operation.VehicleOutcomeCreateRequest;
import com.tallerzapata.backend.api.operation.VehicleOutcomeResponse;
import com.tallerzapata.backend.api.operation.VehicleOutcomeUpdateRequest;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.casefile.CaseWorkflowService;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.ReentryStatusRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleOutcomeEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleOutcomeRepository;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.UserEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class VehicleOutcomeService {

    private final VehicleOutcomeRepository vehicleOutcomeRepository;
    private final VehicleIntakeRepository vehicleIntakeRepository;
    private final ReentryStatusRepository reentryStatusRepository;
    private final CaseRepository caseRepository;
    private final UserRepository userRepository;
    private final PersonRepository personRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService caseAccessControlService;
    private final CaseAuditService caseAuditService;
    private final CaseWorkflowService caseWorkflowService;
    private final RepairAppointmentService repairAppointmentService;

    public VehicleOutcomeService(
            VehicleOutcomeRepository vehicleOutcomeRepository,
            VehicleIntakeRepository vehicleIntakeRepository,
            ReentryStatusRepository reentryStatusRepository,
            CaseRepository caseRepository,
            UserRepository userRepository,
            PersonRepository personRepository,
            CurrentUserService currentUserService,
            CaseAccessControlService caseAccessControlService,
            CaseAuditService caseAuditService,
            CaseWorkflowService caseWorkflowService,
            RepairAppointmentService repairAppointmentService
    ) {
        this.vehicleOutcomeRepository = vehicleOutcomeRepository;
        this.vehicleIntakeRepository = vehicleIntakeRepository;
        this.reentryStatusRepository = reentryStatusRepository;
        this.caseRepository = caseRepository;
        this.userRepository = userRepository;
        this.personRepository = personRepository;
        this.currentUserService = currentUserService;
        this.caseAccessControlService = caseAccessControlService;
        this.caseAuditService = caseAuditService;
        this.caseWorkflowService = caseWorkflowService;
        this.repairAppointmentService = repairAppointmentService;
    }

    @Transactional(readOnly = true)
    public List<VehicleOutcomeResponse> listByCase(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "egreso.ver");
        return vehicleOutcomeRepository.findByCaseId(caseId, Sort.by(Sort.Order.desc("outcomeAt"), Sort.Order.desc("id")))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public VehicleOutcomeResponse create(Long caseId, VehicleOutcomeCreateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "egreso.crear");

        VehicleIntakeEntity intake = vehicleIntakeRepository.findById(request.intakeId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el ingreso " + request.intakeId()));
        if (!intake.getCaseId().equals(caseId)) {
            throw new ConflictException("El ingreso no pertenece al caso indicado");
        }
        if (vehicleOutcomeRepository.existsByIntakeId(request.intakeId())) {
            throw new ConflictException("El ingreso ya tiene un egreso registrado");
        }

        requireActiveUser(request.deliveredByUserId(), "No existe el usuario que entrega ");
        requirePersonIfPresent(request.receivedByPersonId(), "No existe la persona que recibe ");
        validateReentryConsistency(request);

        VehicleOutcomeEntity entity = new VehicleOutcomeEntity();
        entity.setCaseId(caseId);
        entity.setIntakeId(request.intakeId());
        entity.setOutcomeAt(request.outcomeAt());
        entity.setDeliveredByUserId(request.deliveredByUserId());
        entity.setReceivedByPersonId(request.receivedByPersonId());
        entity.setDefinitive(Boolean.TRUE.equals(request.definitive()));
        entity.setShouldReenter(Boolean.TRUE.equals(request.shouldReenter()));
        entity.setExpectedReentryDate(request.expectedReentryDate());
        entity.setEstimatedReentryDays(request.estimatedReentryDays());
        entity.setReentryStatusCode(normalizedReentryStatusCode(request.reentryStatusCode(), Boolean.TRUE.equals(request.shouldReenter())));
        entity.setRepairedPhotosUploaded(Boolean.TRUE.equals(request.repairedPhotosUploaded()));
        entity.setNotes(blankToNull(request.notes()));
        entity = vehicleOutcomeRepository.save(entity);

        Map<String, Object> auditPayload = new LinkedHashMap<>();
        auditPayload.put("domain", "operacion");
        auditPayload.put("intakeId", entity.getIntakeId());
        auditPayload.put("definitive", entity.getDefinitive());
        auditPayload.put("shouldReenter", entity.getShouldReenter());
        auditPayload.put("reentryStatusCode", entity.getReentryStatusCode());

        caseAuditService.register(
                currentUser.id(),
                caseId,
                "egreso_vehiculo",
                entity.getId(),
                "crear_egreso",
                null,
                caseAuditService.toJson(auditPayload),
                caseAuditService.toJson(Map.of("domain", "operacion")),
                httpRequest
        );

        caseWorkflowService.syncRepairStateFromOperation(
                caseId,
                entity.getDefinitive() ? "REPARADO" : "SIN_TURNO",
                currentUser.id(),
                entity.getDefinitive() ? "reparacion.cerrar.automatico" : "reparacion.reingreso_pendiente.automatico",
                entity.getDefinitive() ? "Egreso definitivo registrado" : "Egreso con reingreso pendiente",
                httpRequest
        );

        syncReentryAppointment(entity, currentUser.id(), httpRequest);

        return toResponse(entity);
    }

    @Transactional
    public VehicleOutcomeResponse update(Long outcomeId, VehicleOutcomeUpdateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        VehicleOutcomeEntity entity = vehicleOutcomeRepository.findById(outcomeId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el egreso " + outcomeId));
        CaseEntity caseEntity = requireCase(entity.getCaseId());
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "egreso.crear");

        requireActiveUser(request.deliveredByUserId(), "No existe el usuario que entrega ");
        requirePersonIfPresent(request.receivedByPersonId(), "No existe la persona que recibe ");
        validateReentryConsistency(
                Boolean.TRUE.equals(request.definitive()),
                Boolean.TRUE.equals(request.shouldReenter()),
                request.expectedReentryDate(),
                request.estimatedReentryDays(),
                request.reentryStatusCode()
        );

        Map<String, Object> before = outcomeSnapshot(entity);

        entity.setOutcomeAt(request.outcomeAt());
        entity.setDeliveredByUserId(request.deliveredByUserId());
        entity.setReceivedByPersonId(request.receivedByPersonId());
        entity.setDefinitive(Boolean.TRUE.equals(request.definitive()));
        entity.setShouldReenter(Boolean.TRUE.equals(request.shouldReenter()));
        entity.setExpectedReentryDate(request.expectedReentryDate());
        entity.setEstimatedReentryDays(request.estimatedReentryDays());
        entity.setReentryStatusCode(normalizedReentryStatusCode(request.reentryStatusCode(), Boolean.TRUE.equals(request.shouldReenter())));
        entity.setRepairedPhotosUploaded(Boolean.TRUE.equals(request.repairedPhotosUploaded()));
        entity.setNotes(blankToNull(request.notes()));
        entity = vehicleOutcomeRepository.save(entity);

        caseAuditService.register(
                currentUser.id(),
                caseEntity.getId(),
                "egreso_vehiculo",
                entity.getId(),
                "actualizar_egreso",
                caseAuditService.toJson(before),
                caseAuditService.toJson(outcomeSnapshot(entity)),
                caseAuditService.toJson(Map.of("domain", "operacion")),
                httpRequest
        );

        caseWorkflowService.syncRepairStateFromOperation(
                caseEntity.getId(),
                entity.getDefinitive() ? "REPARADO" : "SIN_TURNO",
                currentUser.id(),
                entity.getDefinitive() ? "reparacion.cerrar.automatico" : "reparacion.reingreso_pendiente.automatico",
                entity.getDefinitive() ? "Egreso definitivo actualizado" : "Egreso actualizado con reingreso pendiente",
                httpRequest
        );

        syncReentryAppointment(entity, currentUser.id(), httpRequest);

        return toResponse(entity);
    }

    private void syncReentryAppointment(VehicleOutcomeEntity entity, Long currentUserId, HttpServletRequest httpRequest) {
        if (Boolean.TRUE.equals(entity.getShouldReenter())) {
            LocalDate appointmentDate = resolveReentryAppointmentDate(entity);
            String notes = buildReentryAppointmentNotes(entity);
            if (entity.getReentryAppointmentId() == null) {
                com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentEntity appointment = repairAppointmentService.createAutomaticReentryAppointment(
                        entity.getCaseId(),
                        currentUserId,
                        appointmentDate,
                        entity.getEstimatedReentryDays(),
                        notes,
                        httpRequest
                );
                entity.setReentryAppointmentId(appointment.getId());
                vehicleOutcomeRepository.save(entity);
                return;
            }

            repairAppointmentService.updateAutomaticReentryAppointment(
                    entity.getReentryAppointmentId(),
                    currentUserId,
                    appointmentDate,
                    entity.getEstimatedReentryDays(),
                    notes,
                    httpRequest
            );
            return;
        }

        if (entity.getReentryAppointmentId() != null) {
            repairAppointmentService.cancelAutomaticReentryAppointment(entity.getReentryAppointmentId(), currentUserId, httpRequest);
            entity.setReentryAppointmentId(null);
            vehicleOutcomeRepository.save(entity);
        }
    }

    private LocalDate resolveReentryAppointmentDate(VehicleOutcomeEntity entity) {
        if (entity.getExpectedReentryDate() != null) {
            return entity.getExpectedReentryDate();
        }
        return entity.getOutcomeAt().toLocalDate().plusDays(entity.getEstimatedReentryDays());
    }

    private String buildReentryAppointmentNotes(VehicleOutcomeEntity entity) {
        String base = "Turno de reingreso generado automaticamente desde egreso " + entity.getId();
        if (entity.getNotes() == null || entity.getNotes().isBlank()) {
            return base;
        }
        return base + ". " + entity.getNotes().trim();
    }

    private void validateReentryConsistency(VehicleOutcomeCreateRequest request) {
        validateReentryConsistency(
                Boolean.TRUE.equals(request.definitive()),
                Boolean.TRUE.equals(request.shouldReenter()),
                request.expectedReentryDate(),
                request.estimatedReentryDays(),
                request.reentryStatusCode()
        );
    }

    private void validateReentryConsistency(
            boolean definitive,
            boolean shouldReenter,
            java.time.LocalDate expectedReentryDate,
            Integer estimatedReentryDays,
            String reentryStatusCodeRaw
    ) {
        String reentryStatusCode = normalizeCode(reentryStatusCodeRaw);

        if (!definitive && !shouldReenter) {
            throw new ConflictException("Un egreso no definitivo debe marcarse con shouldReenter=true");
        }
        if (definitive && shouldReenter) {
            throw new ConflictException("Un egreso definitivo no puede requerir reingreso");
        }
        if (shouldReenter && expectedReentryDate == null && estimatedReentryDays == null) {
            throw new ConflictException("Debe informarse expectedReentryDate o estimatedReentryDays cuando hay reingreso");
        }
        if (!shouldReenter && reentryStatusCode != null) {
            throw new ConflictException("reentryStatusCode solo aplica cuando shouldReenter=true");
        }
        if (shouldReenter) {
            String effectiveCode = reentryStatusCode == null ? "PENDIENTE" : reentryStatusCode;
            if (!reentryStatusRepository.existsByCodeAndActiveTrue(effectiveCode)) {
                throw new ConflictException("reentryStatusCode no permitido: " + reentryStatusCodeRaw);
            }
        }
    }

    private String normalizedReentryStatusCode(String reentryStatusCodeRaw, boolean shouldReenter) {
        if (!shouldReenter) {
            return null;
        }
        String normalized = normalizeCode(reentryStatusCodeRaw);
        return normalized == null ? "PENDIENTE" : normalized;
    }

    private CaseEntity requireCase(Long caseId) {
        return caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
    }

    private void requireActiveUser(Long userId, String prefix) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(prefix + userId));
        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new ConflictException("El usuario esta inactivo: " + userId);
        }
    }

    private void requirePersonIfPresent(Long personId, String prefix) {
        if (personId == null) {
            return;
        }
        personRepository.findById(personId)
                .orElseThrow(() -> new ResourceNotFoundException(prefix + personId));
    }

    private VehicleOutcomeResponse toResponse(VehicleOutcomeEntity entity) {
        return new VehicleOutcomeResponse(
                entity.getId(),
                entity.getPublicId(),
                entity.getCaseId(),
                entity.getIntakeId(),
                entity.getOutcomeAt(),
                entity.getDeliveredByUserId(),
                entity.getReceivedByPersonId(),
                entity.getDefinitive(),
                entity.getShouldReenter(),
                entity.getExpectedReentryDate(),
                entity.getEstimatedReentryDays(),
                entity.getReentryStatusCode(),
                entity.getRepairedPhotosUploaded(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private Map<String, Object> outcomeSnapshot(VehicleOutcomeEntity entity) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("outcomeAt", entity.getOutcomeAt());
        snapshot.put("deliveredByUserId", entity.getDeliveredByUserId());
        snapshot.put("receivedByPersonId", entity.getReceivedByPersonId());
        snapshot.put("definitive", entity.getDefinitive());
        snapshot.put("shouldReenter", entity.getShouldReenter());
        snapshot.put("expectedReentryDate", entity.getExpectedReentryDate());
        snapshot.put("estimatedReentryDays", entity.getEstimatedReentryDays());
        snapshot.put("reentryStatusCode", entity.getReentryStatusCode());
        snapshot.put("repairedPhotosUploaded", entity.getRepairedPhotosUploaded());
        snapshot.put("notes", entity.getNotes());
        return snapshot;
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
}
