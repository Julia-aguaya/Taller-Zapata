package com.tallerzapata.backend.application.casefile;

import com.tallerzapata.backend.api.casefile.CaseIncidentUpdateRequest;
import com.tallerzapata.backend.api.casefile.CasePersonAddRequest;
import com.tallerzapata.backend.api.casefile.CaseVehicleAddRequest;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseIncidentEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseIncidentRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CasePersonEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CasePersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseVehicleEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseVehicleRepository;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.Map;

@Service
public class CaseManagementService {

    private final CaseRepository caseRepository;
    private final CasePersonRepository casePersonRepository;
    private final CaseVehicleRepository caseVehicleRepository;
    private final CaseIncidentRepository caseIncidentRepository;
    private final PersonRepository personRepository;
    private final VehicleRepository vehicleRepository;
    private final CaseAccessControlService accessControlService;
    private final CurrentUserService currentUserService;
    private final CaseAuditService caseAuditService;

    public CaseManagementService(
            CaseRepository caseRepository,
            CasePersonRepository casePersonRepository,
            CaseVehicleRepository caseVehicleRepository,
            CaseIncidentRepository caseIncidentRepository,
            PersonRepository personRepository,
            VehicleRepository vehicleRepository,
            CaseAccessControlService accessControlService,
            CurrentUserService currentUserService,
            CaseAuditService caseAuditService
    ) {
        this.caseRepository = caseRepository;
        this.casePersonRepository = casePersonRepository;
        this.caseVehicleRepository = caseVehicleRepository;
        this.caseIncidentRepository = caseIncidentRepository;
        this.personRepository = personRepository;
        this.vehicleRepository = vehicleRepository;
        this.accessControlService = accessControlService;
        this.currentUserService = currentUserService;
        this.caseAuditService = caseAuditService;
    }

    @Transactional
    public void addPersonToCase(Long caseId, CasePersonAddRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "caso.crear");

        if (!personRepository.existsById(request.personId())) {
            throw new ResourceNotFoundException("No existe la persona " + request.personId());
        }
        if (request.vehicleId() != null && !vehicleRepository.existsById(request.vehicleId())) {
            throw new ResourceNotFoundException("No existe el vehiculo " + request.vehicleId());
        }

        boolean isMain = Boolean.TRUE.equals(request.isMain());
        if (isMain && casePersonRepository.existsByCaseIdAndPrincipalTrue(caseId)) {
            throw new ConflictException("El caso ya tiene una persona principal");
        }

        CasePersonEntity entity = new CasePersonEntity();
        entity.setCaseId(caseId);
        entity.setPersonId(request.personId());
        entity.setCaseRoleCode(normalizeCode(request.caseRoleCode()));
        entity.setVehicleId(request.vehicleId());
        entity.setPrincipal(isMain);
        entity.setNotas(blankToNull(request.notes()));
        entity = casePersonRepository.save(entity);

        caseAuditService.register(
                currentUser.id(),
                caseId,
                "caso_personas",
                entity.getId(),
                "agregar_persona_caso",
                null,
                caseAuditService.toJson(Map.of("personId", entity.getPersonId(), "caseRoleCode", entity.getCaseRoleCode(), "isMain", isMain)),
                caseAuditService.toJson(Map.of("domain", "casefile")),
                httpRequest
        );
    }

    @Transactional
    public void addVehicleToCase(Long caseId, CaseVehicleAddRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "caso.crear");

        if (!vehicleRepository.existsById(request.vehicleId())) {
            throw new ResourceNotFoundException("No existe el vehiculo " + request.vehicleId());
        }

        boolean isMain = Boolean.TRUE.equals(request.isMain());
        if (isMain && caseVehicleRepository.existsByCaseIdAndPrincipalTrue(caseId)) {
            throw new ConflictException("El caso ya tiene un vehiculo principal");
        }

        CaseVehicleEntity entity = new CaseVehicleEntity();
        entity.setCaseId(caseId);
        entity.setVehicleId(request.vehicleId());
        entity.setVehicleRoleCode(normalizeCode(request.vehicleRoleCode()));
        entity.setPrincipal(isMain);
        entity.setVisualOrder(0);
        entity.setNotes(blankToNull(request.notes()));
        entity = caseVehicleRepository.save(entity);

        caseAuditService.register(
                currentUser.id(),
                caseId,
                "caso_vehiculos",
                entity.getId(),
                "agregar_vehiculo_caso",
                null,
                caseAuditService.toJson(Map.of("vehicleId", entity.getVehicleId(), "vehicleRoleCode", entity.getVehicleRoleCode(), "isMain", isMain)),
                caseAuditService.toJson(Map.of("domain", "casefile")),
                httpRequest
        );
    }

    @Transactional
    public void updateCaseIncident(Long caseId, CaseIncidentUpdateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "caso.crear");

        CaseIncidentEntity entity = caseIncidentRepository.findByCaseId(caseId)
                .orElseGet(CaseIncidentEntity::new);
        boolean isNew = entity.getCaseId() == null;
        entity.setCaseId(caseId);
        entity.setIncidentDate(request.incidentDate());
        entity.setIncidentTime(parseTime(request.incidentTime()));
        entity.setLugar(blankToNull(request.location()));
        entity.setDinamica(blankToNull(request.dynamics()));
        entity.setObservaciones(blankToNull(request.observations()));
        entity.setPrescriptionDate(request.prescriptionDate());
        entity = caseIncidentRepository.save(entity);

        caseAuditService.register(
                currentUser.id(),
                caseId,
                "caso_siniestro",
                entity.getId(),
                "actualizar_siniestro_caso",
                null,
                caseAuditService.toJson(Map.of("incidentDate", entity.getIncidentDate(), "location", entity.getLugar())),
                caseAuditService.toJson(Map.of("domain", "casefile", "isNew", isNew)),
                httpRequest
        );
    }

    private CaseEntity requireCase(Long caseId) {
        return caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
    }

    private String normalizeCode(String code) {
        return code == null || code.isBlank() ? null : code.trim().toUpperCase();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private LocalTime parseTime(String time) {
        if (time == null || time.isBlank()) {
            return null;
        }
        return LocalTime.parse(time.trim());
    }
}
