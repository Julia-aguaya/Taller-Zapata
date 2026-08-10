package com.tallerzapata.backend.application.casefile.particular;

import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.IssuedReceiptRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleOutcomeEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleOutcomeRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeRepository;
import com.tallerzapata.backend.infrastructure.persistence.particularstate.ParticularEffectiveStateEntity;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Component
public class ParticularEffectiveStateFactsLoader {
    private final VehicleOutcomeRepository outcomeRepository;
    private final VehicleIntakeRepository intakeRepository;
    private final RepairAppointmentRepository appointmentRepository;
    private final CasePartRepository partRepository;
    private final IssuedReceiptRepository receiptRepository;
    private final ParticularFinancialBalanceService balanceService;

    public ParticularEffectiveStateFactsLoader(VehicleOutcomeRepository outcomeRepository, VehicleIntakeRepository intakeRepository, RepairAppointmentRepository appointmentRepository,
                                                CasePartRepository partRepository, IssuedReceiptRepository receiptRepository,
                                                ParticularFinancialBalanceService balanceService) {
        this.outcomeRepository = outcomeRepository;
        this.intakeRepository = intakeRepository;
        this.appointmentRepository = appointmentRepository;
        this.partRepository = partRepository;
        this.receiptRepository = receiptRepository;
        this.balanceService = balanceService;
    }

    public ParticularEffectiveStateFacts load(Long caseId, ParticularEffectiveStateEntity projection) {
        List<RepairAppointmentEntity> appointments = appointmentRepository.findByCaseId(caseId, Sort.by("createdAt").ascending().and(Sort.by("id").ascending()));
        List<VehicleOutcomeEntity> outcomes = outcomeRepository.findByCaseId(caseId, Sort.unsorted());
        VehicleOutcomeEntity latestOutcome = outcomes.stream()
                .max(Comparator.comparing(VehicleOutcomeEntity::getOutcomeAt).thenComparing(VehicleOutcomeEntity::getId))
                .orElse(null);
        boolean hasReentry = latestOutcome != null && hasValidReentryAppointment(caseId, latestOutcome, outcomes, appointments);
        return new ParticularEffectiveStateFacts(
                projection == null ? null : projection.getRepairTerminalOverrideCode(),
                projection == null ? null : projection.getProcedureTerminalOverrideCode(),
                latestOutcome == null ? null : new ParticularEffectiveStateFacts.OutcomeFact(latestOutcome.getId(), latestOutcome.getOutcomeAt(), latestOutcome.getDefinitive(), latestOutcome.getShouldReenter(), hasReentry, hasLaterIntake(caseId, latestOutcome)),
                appointments.stream().anyMatch(this::isValidNormalAppointment),
                partRepository.findByCaseIdOrderByIdAsc(caseId).stream().anyMatch(part -> !"RECIBIDO".equals(normalize(part.getStatusCode()))),
                receiptRepository.findByCaseId(caseId, Sort.unsorted()).stream().anyMatch(receipt -> "FACTURA".equals(normalize(receipt.getReceiptTypeCode())) || "RECIBO".equals(normalize(receipt.getReceiptTypeCode()))),
                balanceService.balanceFor(caseId)
        );
    }

    private boolean isValidNormalAppointment(RepairAppointmentEntity appointment) { return !Boolean.TRUE.equals(appointment.getReentry()) && isCurrent(appointment); }
    private boolean hasValidReentryAppointment(Long caseId, VehicleOutcomeEntity outcome, List<VehicleOutcomeEntity> outcomes,
                                                List<RepairAppointmentEntity> appointments) {
        if (outcome.getReentryAppointmentId() != null) {
            return appointments.stream().filter(appointment -> outcome.getReentryAppointmentId().equals(appointment.getId()))
                    .filter(appointment -> caseId.equals(appointment.getCaseId()))
                    .anyMatch(this::isCurrentReentry);
        }
        return appointments.stream()
                .filter(appointment -> caseId.equals(appointment.getCaseId()))
                .filter(this::isCurrentReentry)
                .filter(appointment -> isCreatedAfter(appointment, outcome))
                .filter(appointment -> hasNoLaterOutcome(appointment, outcome, outcomes))
                .max(Comparator.comparing(RepairAppointmentEntity::getCreatedAt).thenComparing(RepairAppointmentEntity::getId))
                .isPresent();
    }
    private boolean isCreatedAfter(RepairAppointmentEntity appointment, VehicleOutcomeEntity outcome) {
        if (appointment.getCreatedAt() == null || outcome.getCreatedAt() == null) return false;
        int timestampComparison = appointment.getCreatedAt().compareTo(outcome.getCreatedAt());
        return timestampComparison > 0 || (timestampComparison == 0 && appointment.getId() != null && outcome.getId() != null && appointment.getId() > outcome.getId());
    }
    private boolean hasNoLaterOutcome(RepairAppointmentEntity appointment, VehicleOutcomeEntity outcome, List<VehicleOutcomeEntity> outcomes) {
        return outcomes.stream().filter(candidate -> !candidate.getId().equals(outcome.getId()))
                .noneMatch(candidate -> isCreatedAfter(candidate, appointment));
    }
    private boolean isCreatedAfter(VehicleOutcomeEntity outcome, RepairAppointmentEntity appointment) {
        if (outcome.getCreatedAt() == null || appointment.getCreatedAt() == null) return false;
        int timestampComparison = outcome.getCreatedAt().compareTo(appointment.getCreatedAt());
        return timestampComparison > 0 || (timestampComparison == 0 && outcome.getId() != null && appointment.getId() != null && outcome.getId() > appointment.getId());
    }
    private boolean isCurrentReentry(RepairAppointmentEntity appointment) {
        return Boolean.TRUE.equals(appointment.getReentry()) && isCurrent(appointment);
    }
    private boolean hasLaterIntake(Long caseId, VehicleOutcomeEntity outcome) {
        return outcome.getOutcomeAt() != null && intakeRepository.findByCaseId(caseId, Sort.unsorted()).stream()
                .anyMatch(intake -> intake.getIntakeAt() != null && intake.getIntakeAt().isAfter(outcome.getOutcomeAt()));
    }
    private boolean isCurrent(RepairAppointmentEntity appointment) {
        String status = normalize(appointment.getStatusCode());
        return "PENDIENTE".equals(status) || "REPROGRAMADO".equals(status);
    }
    private String normalize(String value) { return value == null ? "" : value.trim().toUpperCase(); }
}
