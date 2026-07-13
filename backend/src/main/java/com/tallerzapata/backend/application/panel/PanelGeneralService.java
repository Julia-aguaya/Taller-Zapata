package com.tallerzapata.backend.application.panel;

import com.tallerzapata.backend.api.casefile.CaseVisibleStateResponse;
import com.tallerzapata.backend.api.panel.PanelGeneralResponse;
import com.tallerzapata.backend.api.panel.PanelPriorityBucketResponse;
import com.tallerzapata.backend.api.panel.PanelPriorityCaseResponse;
import com.tallerzapata.backend.api.panel.PanelSummaryResponse;
import com.tallerzapata.backend.application.casefile.CaseVisibleStateResolver;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseIncidentEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseIncidentRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.OperationalTaskEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.OperationalTaskRepository;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonEntity;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleEntity;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PanelGeneralService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PanelGeneralService.class);

    private final CurrentUserService currentUserService;
    private final CaseAccessControlService caseAccessControlService;
    private final CaseRepository caseRepository;
    private final CaseTypeRepository caseTypeRepository;
    private final PersonRepository personRepository;
    private final VehicleRepository vehicleRepository;
    private final CaseIncidentRepository caseIncidentRepository;
    private final OperationalTaskRepository operationalTaskRepository;
    private final CaseVisibleStateResolver caseVisibleStateResolver;

    public PanelGeneralService(
            CurrentUserService currentUserService,
            CaseAccessControlService caseAccessControlService,
            CaseRepository caseRepository,
            CaseTypeRepository caseTypeRepository,
            PersonRepository personRepository,
            VehicleRepository vehicleRepository,
            CaseIncidentRepository caseIncidentRepository,
            OperationalTaskRepository operationalTaskRepository,
            CaseVisibleStateResolver caseVisibleStateResolver
    ) {
        this.currentUserService = currentUserService;
        this.caseAccessControlService = caseAccessControlService;
        this.caseRepository = caseRepository;
        this.caseTypeRepository = caseTypeRepository;
        this.personRepository = personRepository;
        this.vehicleRepository = vehicleRepository;
        this.caseIncidentRepository = caseIncidentRepository;
        this.operationalTaskRepository = operationalTaskRepository;
        this.caseVisibleStateResolver = caseVisibleStateResolver;
    }

    @Transactional(readOnly = true)
    public PanelGeneralResponse getGeneralPanel() {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        caseAccessControlService.requirePermission(currentUser, "caso.ver");

        List<CaseEntity> scopedCases = caseRepository.findAll().stream()
                .filter(item -> caseAccessControlService.hasOrganizationScope(currentUser, item.getOrganizationId(), item.getBranchId()))
                .toList();

        Map<Long, PersonEntity> peopleById = personRepository.findAllById(
                scopedCases.stream().map(CaseEntity::getPrincipalCustomerPersonId).filter(id -> id != null).distinct().toList()
        ).stream().collect(LinkedHashMap::new, (map, item) -> map.put(item.getId(), item), Map::putAll);
        Map<Long, VehicleEntity> vehiclesById = vehicleRepository.findAllById(
                scopedCases.stream().map(CaseEntity::getPrincipalVehicleId).filter(id -> id != null).distinct().toList()
        ).stream().collect(LinkedHashMap::new, (map, item) -> map.put(item.getId(), item), Map::putAll);
        Map<Long, CaseIncidentEntity> incidentsByCaseId = new LinkedHashMap<>();
        for (CaseEntity caseEntity : scopedCases) {
            caseIncidentRepository.findByCaseId(caseEntity.getId()).ifPresent(incident -> incidentsByCaseId.put(caseEntity.getId(), incident));
        }

        List<OperationalTaskEntity> scopedTasks = operationalTaskRepository.findAll().stream()
                .filter(task -> scopedCases.stream().anyMatch(caseEntity -> caseEntity.getId().equals(task.getCaseId())))
                .toList();

        LocalDate today = LocalDate.now();
        long openCases = scopedCases.stream().filter(item -> item.getClosedAt() == null && item.getArchivedAt() == null).count();
        long pendingTasks = scopedTasks.stream().filter(task -> isPendingTask(task.getStatusCode())).count();

        List<PanelPriorityCaseResponse> urgent = new ArrayList<>();
        List<PanelPriorityCaseResponse> attention = new ArrayList<>();

        long pendingPayments = 0;
        long casesWithoutAppointment = 0;
        long casesNearPrescription = 0;

        for (CaseEntity caseEntity : scopedCases) {
            try {
                Map<String, CaseVisibleStateResponse> visibleStates = caseVisibleStateResolver.resolveForCase(caseEntity);
                CaseVisibleStateResponse tramiteState = visibleStates.getOrDefault("tramite", fallbackVisibleState("tramite"));
                CaseVisibleStateResponse repairState = visibleStates.getOrDefault("reparacion", fallbackVisibleState("reparacion"));
                String tramiteCode = tramiteState != null ? tramiteState.code() : "INGRESADO";
                String repairCode = repairState != null ? repairState.code() : "EN_TRAMITE";
                List<String> reasons = new ArrayList<>();

                if ("PASADO_A_PAGOS".equals(tramiteCode)) {
                    pendingPayments++;
                    reasons.add("Pago pendiente");
                }
                if ("DAR_TURNO".equals(repairCode)) {
                    casesWithoutAppointment++;
                    reasons.add("Pendiente de dar turno");
                }

                CaseIncidentEntity incident = incidentsByCaseId.get(caseEntity.getId());
                if (incident != null && incident.getPrescriptionDate() != null && !incident.getPrescriptionDate().isBefore(today) && !incident.getPrescriptionDate().isAfter(today.plusDays(30))) {
                    casesNearPrescription++;
                    reasons.add("Caso proximo a prescribir");
                }

                long pendingCaseTasks = scopedTasks.stream()
                        .filter(task -> task.getCaseId() != null && caseEntity.getId() != null && caseEntity.getId().equals(task.getCaseId()))
                        .filter(task -> isPendingTask(task.getStatusCode()))
                        .count();
                if (pendingCaseTasks > 0) {
                    reasons.add("Tareas pendientes: " + pendingCaseTasks);
                }

                if (reasons.isEmpty()) {
                    continue;
                }

                CaseTypeEntity caseType = caseTypeRepository.findById(caseEntity.getCaseTypeId()).orElse(null);
                String customerName = caseEntity.getPrincipalCustomerPersonId() == null ? null : valueOrNull(peopleById.get(caseEntity.getPrincipalCustomerPersonId()), PersonEntity::getNombreMostrar);
                VehicleEntity vehicle = caseEntity.getPrincipalVehicleId() == null ? null : vehiclesById.get(caseEntity.getPrincipalVehicleId());
                String title = buildCaseTitle(customerName, vehicle);

                PanelPriorityCaseResponse item = new PanelPriorityCaseResponse(
                        caseEntity.getId(),
                        caseEntity.getFolderCode() != null ? caseEntity.getFolderCode() : "SIN_CODIGO",
                        title,
                        caseType == null ? null : caseType.getCode(),
                        tramiteState,
                        repairState,
                        reasons,
                        caseEntity.getClosedAt(),
                        caseEntity.getCreatedAt()
                );

                if (reasons.stream().anyMatch(reason -> reason.equals("Pago pendiente") || reason.equals("Caso proximo a prescribir"))) {
                    urgent.add(item);
                } else {
                    attention.add(item);
                }
            } catch (RuntimeException error) {
                LOGGER.warn("No pude incluir el caso {} en panel/general: {}", caseEntity.getId(), error.getMessage());
            }
        }

        Comparator<PanelPriorityCaseResponse> itemComparator = Comparator
                .comparing((PanelPriorityCaseResponse item) -> item.priorityReasons().size()).reversed()
                .thenComparing(PanelPriorityCaseResponse::createdAt, Comparator.nullsLast(Comparator.reverseOrder()));
        urgent.sort(itemComparator);
        attention.sort(itemComparator);

        List<PanelPriorityBucketResponse> buckets = new ArrayList<>();
        if (!urgent.isEmpty()) {
            buckets.add(new PanelPriorityBucketResponse("URGENT", "Urgentes", urgent));
        }
        if (!attention.isEmpty()) {
            buckets.add(new PanelPriorityBucketResponse("ATTENTION", "Para atender", attention));
        }

        return new PanelGeneralResponse(
                LocalDateTime.now(),
                new PanelSummaryResponse(openCases, pendingPayments, casesWithoutAppointment, casesNearPrescription, pendingTasks),
                buckets
        );
    }

    private boolean isPendingTask(String statusCode) {
        String normalized = statusCode == null ? null : statusCode.trim().toUpperCase();
        return normalized == null || "PENDIENTE".equals(normalized) || "EN_PROCESO".equals(normalized);
    }

    private String buildCaseTitle(String customerName, VehicleEntity vehicle) {
        String vehicleLabel = vehicle == null
                ? "Sin vehiculo"
                : Arrays.asList(vehicle.getBrandText(), vehicle.getModelText(), vehicle.getPlate()).stream()
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.joining(" - "));
        if (customerName == null || customerName.isBlank()) {
            return vehicleLabel;
        }
        return customerName + " - " + vehicleLabel;
    }

    private <T, R> R valueOrNull(T source, java.util.function.Function<T, R> getter) {
        return source == null ? null : getter.apply(source);
    }

    private CaseVisibleStateResponse fallbackVisibleState(String domain) {
        return new CaseVisibleStateResponse(domain, "EN_TRAMITE", "En tramite", "automatic", false);
    }
}
