package com.tallerzapata.backend.application.operation;

import com.tallerzapata.backend.api.operation.VehicleIntakeCreateRequest;
import com.tallerzapata.backend.api.operation.VehicleIntakeItemCreateRequest;
import com.tallerzapata.backend.api.operation.VehicleIntakeItemResponse;
import com.tallerzapata.backend.api.operation.VehicleIntakeResponse;
import com.tallerzapata.backend.api.operation.VehicleIntakeUpdateRequest;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.casefile.CaseWorkflowService;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseVehicleRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleFuelCodeRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeItemEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeItemRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeItemStatusRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeItemTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeRepository;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.UserEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class VehicleIntakeService {

    private final VehicleIntakeRepository vehicleIntakeRepository;
    private final VehicleIntakeItemRepository vehicleIntakeItemRepository;
    private final VehicleIntakeItemTypeRepository vehicleIntakeItemTypeRepository;
    private final VehicleIntakeItemStatusRepository vehicleIntakeItemStatusRepository;
    private final VehicleFuelCodeRepository vehicleFuelCodeRepository;
    private final RepairAppointmentRepository repairAppointmentRepository;
    private final CaseRepository caseRepository;
    private final CaseVehicleRepository caseVehicleRepository;
    private final VehicleRepository vehicleRepository;
    private final PersonRepository personRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService caseAccessControlService;
    private final CaseAuditService caseAuditService;
    private final CaseWorkflowService caseWorkflowService;

    public VehicleIntakeService(
            VehicleIntakeRepository vehicleIntakeRepository,
            VehicleIntakeItemRepository vehicleIntakeItemRepository,
            VehicleIntakeItemTypeRepository vehicleIntakeItemTypeRepository,
            VehicleIntakeItemStatusRepository vehicleIntakeItemStatusRepository,
            VehicleFuelCodeRepository vehicleFuelCodeRepository,
            RepairAppointmentRepository repairAppointmentRepository,
            CaseRepository caseRepository,
            CaseVehicleRepository caseVehicleRepository,
            VehicleRepository vehicleRepository,
            PersonRepository personRepository,
            UserRepository userRepository,
            CurrentUserService currentUserService,
            CaseAccessControlService caseAccessControlService,
            CaseAuditService caseAuditService,
            CaseWorkflowService caseWorkflowService
    ) {
        this.vehicleIntakeRepository = vehicleIntakeRepository;
        this.vehicleIntakeItemRepository = vehicleIntakeItemRepository;
        this.vehicleIntakeItemTypeRepository = vehicleIntakeItemTypeRepository;
        this.vehicleIntakeItemStatusRepository = vehicleIntakeItemStatusRepository;
        this.vehicleFuelCodeRepository = vehicleFuelCodeRepository;
        this.repairAppointmentRepository = repairAppointmentRepository;
        this.caseRepository = caseRepository;
        this.caseVehicleRepository = caseVehicleRepository;
        this.vehicleRepository = vehicleRepository;
        this.personRepository = personRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.caseAccessControlService = caseAccessControlService;
        this.caseAuditService = caseAuditService;
        this.caseWorkflowService = caseWorkflowService;
    }

    @Transactional(readOnly = true)
    public List<VehicleIntakeResponse> listByCase(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "ingreso.ver");
        return vehicleIntakeRepository.findByCaseId(caseId, Sort.by(Sort.Order.desc("intakeAt"), Sort.Order.desc("id")))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public VehicleIntakeResponse create(Long caseId, VehicleIntakeCreateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "ingreso.crear");

        validateVehicleBelongsToCase(caseEntity, request.vehicleId());
        Long appointmentId = validateAppointment(caseId, request.appointmentId());
        requireActiveUser(request.receivedByUserId(), "No existe el usuario receptor ");
        requirePersonIfPresent(request.deliveredByPersonId(), "No existe la persona que entrega ");
        validateFuelCode(request.fuelCode());
        validateObservationConsistency(request.hasObservations(), request.observationDetail());

        VehicleIntakeEntity entity = new VehicleIntakeEntity();
        entity.setCaseId(caseId);
        entity.setAppointmentId(appointmentId);
        entity.setVehicleId(request.vehicleId());
        entity.setIntakeAt(request.intakeAt());
        entity.setReceivedByUserId(request.receivedByUserId());
        entity.setDeliveredByPersonId(request.deliveredByPersonId());
        entity.setMileage(request.mileage());
        entity.setFuelCode(normalizeCode(request.fuelCode()));
        entity.setEstimatedExitDate(request.estimatedExitDate());
        entity.setHasObservations(Boolean.TRUE.equals(request.hasObservations()));
        entity.setObservationDetail(blankToNull(request.observationDetail()));
        entity = vehicleIntakeRepository.save(entity);

        Map<String, Object> auditPayload = new LinkedHashMap<>();
        auditPayload.put("domain", "operacion");
        auditPayload.put("appointmentId", entity.getAppointmentId());
        auditPayload.put("vehicleId", entity.getVehicleId());
        auditPayload.put("intakeAt", entity.getIntakeAt());

        caseAuditService.register(
                currentUser.id(),
                caseId,
                "ingreso_vehiculo",
                entity.getId(),
                "crear_ingreso",
                null,
                caseAuditService.toJson(auditPayload),
                caseAuditService.toJson(Map.of("domain", "operacion")),
                httpRequest
        );

        caseWorkflowService.syncRepairStateFromOperation(
                caseId,
                "CON_TURNO",
                currentUser.id(),
                "reparacion.ingresar_vehiculo.automatico",
                "Ingreso de vehiculo registrado",
                httpRequest
        );

        return toResponse(entity);
    }

    @Transactional
    public VehicleIntakeResponse update(Long intakeId, VehicleIntakeUpdateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        VehicleIntakeEntity entity = requireIntake(intakeId);
        CaseEntity caseEntity = requireCase(entity.getCaseId());
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "ingreso.crear");

        validateVehicleBelongsToCase(caseEntity, request.vehicleId());
        Long appointmentId = validateAppointment(caseEntity.getId(), request.appointmentId());
        requireActiveUser(request.receivedByUserId(), "No existe el usuario receptor ");
        requirePersonIfPresent(request.deliveredByPersonId(), "No existe la persona que entrega ");
        validateFuelCode(request.fuelCode());
        validateObservationConsistency(request.hasObservations(), request.observationDetail());

        Map<String, Object> before = intakeSnapshot(entity);

        entity.setAppointmentId(appointmentId);
        entity.setVehicleId(request.vehicleId());
        entity.setIntakeAt(request.intakeAt());
        entity.setReceivedByUserId(request.receivedByUserId());
        entity.setDeliveredByPersonId(request.deliveredByPersonId());
        entity.setMileage(request.mileage());
        entity.setFuelCode(normalizeCode(request.fuelCode()));
        entity.setEstimatedExitDate(request.estimatedExitDate());
        entity.setHasObservations(Boolean.TRUE.equals(request.hasObservations()));
        entity.setObservationDetail(blankToNull(request.observationDetail()));
        entity = vehicleIntakeRepository.save(entity);

        caseAuditService.register(
                currentUser.id(),
                caseEntity.getId(),
                "ingreso_vehiculo",
                entity.getId(),
                "actualizar_ingreso",
                caseAuditService.toJson(before),
                caseAuditService.toJson(intakeSnapshot(entity)),
                caseAuditService.toJson(Map.of("domain", "operacion")),
                httpRequest
        );

        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<VehicleIntakeItemResponse> listItems(Long intakeId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        VehicleIntakeEntity intake = requireIntake(intakeId);
        CaseEntity caseEntity = requireCase(intake.getCaseId());
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "ingreso.ver");
        return vehicleIntakeItemRepository.findByIntakeId(intakeId, Sort.by(Sort.Order.asc("id")))
                .stream()
                .map(this::toItemResponse)
                .toList();
    }

    @Transactional
    public VehicleIntakeItemResponse createItem(Long intakeId, VehicleIntakeItemCreateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        VehicleIntakeEntity intake = requireIntake(intakeId);
        CaseEntity caseEntity = requireCase(intake.getCaseId());
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "ingreso.crear");
        validateItemCodes(request.itemTypeCode(), request.statusCode());

        VehicleIntakeItemEntity entity = new VehicleIntakeItemEntity();
        entity.setIntakeId(intakeId);
        entity.setItemTypeCode(normalizeCode(request.itemTypeCode()));
        entity.setDetail(request.detail().trim());
        entity.setStatusCode(normalizeCode(request.statusCode()));
        entity.setMediaReference(blankToNull(request.mediaReference()));
        entity = vehicleIntakeItemRepository.save(entity);

        caseAuditService.register(
                currentUser.id(),
                intake.getCaseId(),
                "ingreso_item",
                entity.getId(),
                "crear_ingreso_item",
                null,
                caseAuditService.toJson(Map.of(
                        "domain", "operacion",
                        "intakeId", intakeId,
                        "itemTypeCode", entity.getItemTypeCode(),
                        "statusCode", entity.getStatusCode()
                )),
                caseAuditService.toJson(Map.of("domain", "operacion")),
                httpRequest
        );

        return toItemResponse(entity);
    }

    private CaseEntity requireCase(Long caseId) {
        return caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
    }

    private VehicleIntakeEntity requireIntake(Long intakeId) {
        return vehicleIntakeRepository.findById(intakeId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el ingreso " + intakeId));
    }

    private void validateVehicleBelongsToCase(CaseEntity caseEntity, Long vehicleId) {
        vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el vehiculo " + vehicleId));
        boolean belongsToCase = vehicleId.equals(caseEntity.getPrincipalVehicleId())
                || caseVehicleRepository.existsByCaseIdAndVehicleId(caseEntity.getId(), vehicleId);
        if (!belongsToCase) {
            throw new ConflictException("El vehiculo no pertenece al caso indicado");
        }
    }

    private Long validateAppointment(Long caseId, Long appointmentId) {
        if (appointmentId == null) {
            return null;
        }
        RepairAppointmentEntity appointment = repairAppointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el turno " + appointmentId));
        if (!appointment.getCaseId().equals(caseId)) {
            throw new ConflictException("El turno no pertenece al caso indicado");
        }
        return appointmentId;
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

    private void validateFuelCode(String fuelCode) {
        String normalizedCode = normalizeCode(fuelCode);
        if (normalizedCode != null && !vehicleFuelCodeRepository.existsByCodeAndActiveTrue(normalizedCode)) {
            throw new ConflictException("fuelCode no permitido: " + fuelCode);
        }
    }

    private void validateObservationConsistency(Boolean hasObservations, String observationDetail) {
        if (Boolean.TRUE.equals(hasObservations) && blankToNull(observationDetail) == null) {
            throw new ConflictException("observationDetail es obligatorio cuando hay observaciones");
        }
    }

    private void validateItemCodes(String itemTypeCode, String statusCode) {
        String normalizedType = normalizeCode(itemTypeCode);
        if (!vehicleIntakeItemTypeRepository.existsByCodeAndActiveTrue(normalizedType)) {
            throw new ConflictException("itemTypeCode no permitido: " + itemTypeCode);
        }
        String normalizedStatus = normalizeCode(statusCode);
        if (!vehicleIntakeItemStatusRepository.existsByCodeAndActiveTrue(normalizedStatus)) {
            throw new ConflictException("statusCode no permitido: " + statusCode);
        }
    }

    private VehicleIntakeResponse toResponse(VehicleIntakeEntity entity) {
        return new VehicleIntakeResponse(
                entity.getId(),
                entity.getPublicId(),
                entity.getCaseId(),
                entity.getAppointmentId(),
                entity.getVehicleId(),
                entity.getIntakeAt(),
                entity.getReceivedByUserId(),
                entity.getDeliveredByPersonId(),
                entity.getMileage(),
                entity.getFuelCode(),
                entity.getEstimatedExitDate(),
                entity.getHasObservations(),
                entity.getObservationDetail(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private Map<String, Object> intakeSnapshot(VehicleIntakeEntity entity) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("appointmentId", entity.getAppointmentId());
        snapshot.put("vehicleId", entity.getVehicleId());
        snapshot.put("intakeAt", entity.getIntakeAt());
        snapshot.put("receivedByUserId", entity.getReceivedByUserId());
        snapshot.put("deliveredByPersonId", entity.getDeliveredByPersonId());
        snapshot.put("mileage", entity.getMileage());
        snapshot.put("fuelCode", entity.getFuelCode());
        snapshot.put("estimatedExitDate", entity.getEstimatedExitDate());
        snapshot.put("hasObservations", entity.getHasObservations());
        snapshot.put("observationDetail", entity.getObservationDetail());
        return snapshot;
    }

    private VehicleIntakeItemResponse toItemResponse(VehicleIntakeItemEntity entity) {
        return new VehicleIntakeItemResponse(
                entity.getId(),
                entity.getIntakeId(),
                entity.getItemTypeCode(),
                entity.getDetail(),
                entity.getStatusCode(),
                entity.getMediaReference(),
                entity.getCreatedAt()
        );
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
