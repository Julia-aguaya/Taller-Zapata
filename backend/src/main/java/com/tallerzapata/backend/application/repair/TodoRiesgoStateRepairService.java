package com.tallerzapata.backend.application.repair;

import com.tallerzapata.backend.application.casefile.todoriskstate.TodoRiesgoEffectiveStateRecalculator;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceProcessingRepository;
import com.tallerzapata.backend.infrastructure.persistence.todoriskstate.TodoRiesgoStateFactsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionOperations;

@Service
public class TodoRiesgoStateRepairService {
    private final CaseRepository caseRepository;
    private final InsuranceProcessingRepository insuranceProcessingRepository;
    private final TodoRiesgoStateFactsRepository factsRepository;
    private final TodoRiesgoEffectiveStateRecalculator recalculator;
    private final TransactionOperations transactionTemplate;

    public TodoRiesgoStateRepairService(CaseRepository caseRepository, InsuranceProcessingRepository insuranceProcessingRepository,
                                        TodoRiesgoStateFactsRepository factsRepository, TodoRiesgoEffectiveStateRecalculator recalculator,
                                        TransactionOperations transactionTemplate) {
        this.caseRepository = caseRepository;
        this.insuranceProcessingRepository = insuranceProcessingRepository;
        this.factsRepository = factsRepository;
        this.recalculator = recalculator;
        this.transactionTemplate = transactionTemplate;
    }

    public RepairSummary repair(boolean apply) {
        RepairSummary summary = new RepairSummary();
        for (CaseEntity caseEntity : caseRepository.findInsuranceRepairCasesOrderByIdAsc()) {
            summary.scanned++;
            if (hasAmbiguousLegacyState(caseEntity)) {
                summary.ambiguousSkipped++;
                continue;
            }
            try {
                TodoRiesgoEffectiveStateRecalculator.RecalculationResult result = transactionTemplate.execute(status ->
                        apply ? recalculator.recalculate(caseEntity.getId()) : recalculator.preview(caseEntity.getId()));
                if (result == null) {
                    summary.errors++;
                    continue;
                }
                if (result.projectionMissing()) summary.missingProjection++;
                if (!result.procedureChanged() && !result.repairChanged()) summary.noChange++;
                if (result.procedureChanged()) summary.procedureTransitions++;
                if (result.repairChanged()) summary.repairTransitions++;
            } catch (RuntimeException exception) {
                summary.errors++;
            }
        }
        return summary;
    }

    private boolean hasAmbiguousLegacyState(CaseEntity caseEntity) {
        if (hasText(caseEntity.getVisibleCaseStateOverrideCode()) || hasText(caseEntity.getVisibleRepairStateOverrideCode())) return true;
        return insuranceProcessingRepository.findByCaseId(caseEntity.getId())
                .map(processing -> Boolean.TRUE.equals(processing.getNoRepair())
                        && factsRepository.findById(caseEntity.getId())
                        .map(facts -> facts.getNoRepairReason() == null || facts.getNoRepairAt() == null || facts.getNoRepairActorUserId() == null)
                        .orElse(true))
                .orElse(false);
    }

    private boolean hasText(String value) { return value != null && !value.isBlank(); }

    public static final class RepairSummary {
        private int scanned;
        private int missingProjection;
        private int noChange;
        private int procedureTransitions;
        private int repairTransitions;
        private int ambiguousSkipped;
        private int errors;

        public int scanned() { return scanned; }
        public int missingProjection() { return missingProjection; }
        public int noChange() { return noChange; }
        public int procedureTransitions() { return procedureTransitions; }
        public int repairTransitions() { return repairTransitions; }
        public int ambiguousSkipped() { return ambiguousSkipped; }
        public int errors() { return errors; }

        @Override public String toString() {
            return "scanned=" + scanned + ", missingProjection=" + missingProjection + ", noChange=" + noChange
                    + ", procedureTransitions=" + procedureTransitions + ", repairTransitions=" + repairTransitions
                    + ", ambiguousSkipped=" + ambiguousSkipped + ", errors=" + errors;
        }
    }
}
