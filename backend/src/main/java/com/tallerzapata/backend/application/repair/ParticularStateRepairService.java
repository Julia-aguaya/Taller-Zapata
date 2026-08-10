package com.tallerzapata.backend.application.repair;

import com.tallerzapata.backend.application.casefile.particular.ParticularEffectiveStateRecalculator;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.particularstate.ParticularEffectiveStateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionOperations;

import java.util.Locale;

@Service
public class ParticularStateRepairService {
    private final CaseRepository caseRepository;
    private final ParticularEffectiveStateRepository stateRepository;
    private final ParticularEffectiveStateRecalculator recalculator;
    private final TransactionOperations transactionTemplate;

    public ParticularStateRepairService(CaseRepository caseRepository, ParticularEffectiveStateRepository stateRepository,
                                        ParticularEffectiveStateRecalculator recalculator, TransactionOperations transactionTemplate) {
        this.caseRepository = caseRepository;
        this.stateRepository = stateRepository;
        this.recalculator = recalculator;
        this.transactionTemplate = transactionTemplate;
    }

    public RepairSummary repair(boolean apply) {
        RepairSummary summary = new RepairSummary();
        for (CaseEntity caseEntity : caseRepository.findParticularCasesOrderByIdAsc()) {
            summary.scanned++;
            if (hasAmbiguousLegacyOverride(caseEntity)) {
                summary.ambiguousSkipped++;
                continue;
            }
            try {
                ParticularEffectiveStateRecalculator.RecalculationResult result = transactionTemplate.execute(status ->
                        apply ? recalculator.recalculate(caseEntity.getId()) : recalculator.preview(caseEntity.getId()));
                if (result == null) {
                    summary.errors++;
                    continue;
                }
                if (result.projectionMissing()) summary.missingProjection++;
                if (!result.procedureChanged() && !result.repairChanged()) summary.noChange++;
                if (result.procedureChanged()) summary.procedureTransitions++;
                if (result.repairChanged()) summary.repairTransitions++;
                if (result.terminalOverridePreserved()) summary.overridesPreserved++;
            } catch (RuntimeException exception) {
                summary.errors++;
            }
        }
        return summary;
    }

    private boolean hasAmbiguousLegacyOverride(CaseEntity caseEntity) {
        return stateRepository.findById(caseEntity.getId()).isEmpty()
                && (isNonTerminal(caseEntity.getVisibleCaseStateOverrideCode()) || isNonTerminal(caseEntity.getVisibleRepairStateOverrideCode()));
    }

    private boolean isNonTerminal(String code) {
        if (code == null || code.isBlank()) return false;
        String normalized = code.trim().toUpperCase(Locale.ROOT);
        return !"RECHAZADO".equals(normalized) && !"DESISTIDO".equals(normalized);
    }

    public static final class RepairSummary {
        private int scanned;
        private int missingProjection;
        private int noChange;
        private int procedureTransitions;
        private int repairTransitions;
        private int overridesPreserved;
        private int ambiguousSkipped;
        private int errors;

        public int scanned() { return scanned; }
        public int missingProjection() { return missingProjection; }
        public int noChange() { return noChange; }
        public int procedureTransitions() { return procedureTransitions; }
        public int repairTransitions() { return repairTransitions; }
        public int overridesPreserved() { return overridesPreserved; }
        public int ambiguousSkipped() { return ambiguousSkipped; }
        public int errors() { return errors; }

        @Override public String toString() {
            return "scanned=" + scanned + ", missingProjection=" + missingProjection + ", noChange=" + noChange
                    + ", procedureTransitions=" + procedureTransitions + ", repairTransitions=" + repairTransitions
                    + ", overridesPreserved=" + overridesPreserved + ", ambiguousSkipped=" + ambiguousSkipped + ", errors=" + errors;
        }
    }
}
