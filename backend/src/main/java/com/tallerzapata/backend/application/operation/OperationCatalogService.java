package com.tallerzapata.backend.application.operation;

import com.tallerzapata.backend.api.casefile.CodeCatalogResponse;
import com.tallerzapata.backend.api.operation.OperationCatalogsResponse;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.operation.ReentryStatusRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentStatusRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.TaskPriorityRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.TaskStatusRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleFuelCodeRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeItemStatusRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeItemTypeRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OperationCatalogService {

    private final RepairAppointmentStatusRepository repairAppointmentStatusRepository;
    private final TaskPriorityRepository taskPriorityRepository;
    private final TaskStatusRepository taskStatusRepository;
    private final VehicleFuelCodeRepository vehicleFuelCodeRepository;
    private final VehicleIntakeItemTypeRepository vehicleIntakeItemTypeRepository;
    private final VehicleIntakeItemStatusRepository vehicleIntakeItemStatusRepository;
    private final ReentryStatusRepository reentryStatusRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService caseAccessControlService;

    public OperationCatalogService(
            RepairAppointmentStatusRepository repairAppointmentStatusRepository,
            TaskPriorityRepository taskPriorityRepository,
            TaskStatusRepository taskStatusRepository,
            VehicleFuelCodeRepository vehicleFuelCodeRepository,
            VehicleIntakeItemTypeRepository vehicleIntakeItemTypeRepository,
            VehicleIntakeItemStatusRepository vehicleIntakeItemStatusRepository,
            ReentryStatusRepository reentryStatusRepository,
            CurrentUserService currentUserService,
            CaseAccessControlService caseAccessControlService
    ) {
        this.repairAppointmentStatusRepository = repairAppointmentStatusRepository;
        this.taskPriorityRepository = taskPriorityRepository;
        this.taskStatusRepository = taskStatusRepository;
        this.vehicleFuelCodeRepository = vehicleFuelCodeRepository;
        this.vehicleIntakeItemTypeRepository = vehicleIntakeItemTypeRepository;
        this.vehicleIntakeItemStatusRepository = vehicleIntakeItemStatusRepository;
        this.reentryStatusRepository = reentryStatusRepository;
        this.currentUserService = currentUserService;
        this.caseAccessControlService = caseAccessControlService;
    }

    @Transactional(readOnly = true)
    public OperationCatalogsResponse listCatalogs() {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        caseAccessControlService.requirePermission(currentUser, "turno.ver");

        return new OperationCatalogsResponse(
                repairAppointmentStatusRepository.findByActiveTrueOrderByNameAsc().stream().map(item -> new CodeCatalogResponse(item.getCode(), item.getName())).toList(),
                taskPriorityRepository.findByActiveTrueOrderByVisualOrderAscNameAsc().stream().map(item -> new CodeCatalogResponse(item.getCode(), item.getName())).toList(),
                taskStatusRepository.findByActiveTrueOrderByNameAsc().stream().map(item -> new CodeCatalogResponse(item.getCode(), item.getName())).toList(),
                vehicleFuelCodeRepository.findByActiveTrueOrderByNameAsc().stream().map(item -> new CodeCatalogResponse(item.getCode(), item.getName())).toList(),
                vehicleIntakeItemTypeRepository.findByActiveTrueOrderByNameAsc().stream().map(item -> new CodeCatalogResponse(item.getCode(), item.getName())).toList(),
                vehicleIntakeItemStatusRepository.findByActiveTrueOrderByNameAsc().stream().map(item -> new CodeCatalogResponse(item.getCode(), item.getName())).toList(),
                reentryStatusRepository.findByActiveTrueOrderByNameAsc().stream().map(item -> new CodeCatalogResponse(item.getCode(), item.getName())).toList()
        );
    }
}
