package com.tallerzapata.backend.application.casefile.todoriskstate;

import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceProcessingRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleOutcomeEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleOutcomeRepository;
import com.tallerzapata.backend.infrastructure.persistence.todoriskstate.TodoRiesgoStateFactsEntity;
import com.tallerzapata.backend.infrastructure.persistence.todoriskstate.TodoRiesgoStateFactsRepository;
import com.tallerzapata.backend.infrastructure.persistence.workflow.WorkflowStateRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import java.util.Comparator;
import java.util.List;

@Component
public class TodoRiesgoEffectiveStateFactsLoader {
    private final TodoRiesgoStateFactsRepository factsRepository;
    private final InsuranceProcessingRepository insuranceProcessingRepository;
    private final WorkflowStateRepository workflowStateRepository;
    private final CasePartRepository partRepository;
    private final RepairAppointmentRepository appointmentRepository;
    private final VehicleOutcomeRepository outcomeRepository;

    public TodoRiesgoEffectiveStateFactsLoader(TodoRiesgoStateFactsRepository factsRepository, InsuranceProcessingRepository insuranceProcessingRepository,
                                               WorkflowStateRepository workflowStateRepository, CasePartRepository partRepository,
                                               RepairAppointmentRepository appointmentRepository, VehicleOutcomeRepository outcomeRepository) {
        this.factsRepository = factsRepository; this.insuranceProcessingRepository = insuranceProcessingRepository;
        this.workflowStateRepository = workflowStateRepository; this.partRepository = partRepository;
        this.appointmentRepository = appointmentRepository; this.outcomeRepository = outcomeRepository;
    }

    public TodoRiesgoEffectiveStateFacts load(CaseEntity caseEntity) {
        Long caseId = caseEntity.getId();
        TodoRiesgoStateFactsEntity facts = factsRepository.findById(caseId).orElse(null);
        List<RepairAppointmentEntity> appointments = appointmentRepository.findByCaseId(caseId, Sort.unsorted());
        List<VehicleOutcomeEntity> outcomes = outcomeRepository.findByCaseId(caseId, Sort.unsorted());
        VehicleOutcomeEntity latestOutcome = outcomes.stream().max(Comparator.comparing(VehicleOutcomeEntity::getOutcomeAt).thenComparing(VehicleOutcomeEntity::getId)).orElse(null);
        return new TodoRiesgoEffectiveStateFacts(
                insuranceProcessingRepository.findByCaseId(caseId).map(processing -> processing.getPresentedAt()).orElse(null),
                documentationComplete(caseEntity),
                facts == null ? null : facts.getAgreementDate(), facts == null ? null : facts.getPassedToPaymentsDate(), facts == null ? null : facts.getPaymentDate(),
                facts != null && Boolean.TRUE.equals(facts.getNoRepairActive()),
                latestOutcome == null ? null : new TodoRiesgoEffectiveStateFacts.OutcomeFact(latestOutcome.getId(), isRepaired(latestOutcome), Boolean.TRUE.equals(latestOutcome.getShouldReenter()), hasSatisfiedReentry(latestOutcome, appointments)),
                appointments.stream().anyMatch(this::isValidNormalAppointment),
                partRepository.findByCaseIdOrderByIdAsc(caseId).stream().map(part -> new TodoRiesgoEffectiveStateFacts.PartFact(part.getAuthorizedCode(), part.getStatusCode())).toList()
        );
    }

    private boolean documentationComplete(CaseEntity caseEntity) {
        return caseEntity.getCurrentDocumentationStateId() != null && workflowStateRepository.findById(caseEntity.getCurrentDocumentationStateId())
                .map(state -> "DOCUMENTACION".equals(normalize(state.getDomain())) && "COMPLETA".equals(normalize(state.getCode()))).orElse(false);
    }
    private boolean isRepaired(VehicleOutcomeEntity outcome) { return Boolean.TRUE.equals(outcome.getDefinitive()) || Boolean.FALSE.equals(outcome.getShouldReenter()); }
    private boolean hasSatisfiedReentry(VehicleOutcomeEntity outcome, List<RepairAppointmentEntity> appointments) {
        return outcome.getReentryAppointmentId() != null && appointments.stream().anyMatch(appointment -> outcome.getReentryAppointmentId().equals(appointment.getId()) && isCurrent(appointment));
    }
    private boolean isValidNormalAppointment(RepairAppointmentEntity appointment) { return !Boolean.TRUE.equals(appointment.getReentry()) && isCurrent(appointment); }
    private boolean isCurrent(RepairAppointmentEntity appointment) { String status = normalize(appointment.getStatusCode()); return "PENDIENTE".equals(status) || "REPROGRAMADO".equals(status); }
    private String normalize(String value) { return value == null ? "" : value.trim().toUpperCase(); }
}
