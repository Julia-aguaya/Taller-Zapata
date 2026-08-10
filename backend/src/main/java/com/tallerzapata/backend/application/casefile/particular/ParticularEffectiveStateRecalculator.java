package com.tallerzapata.backend.application.casefile.particular;

import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.particularstate.ParticularEffectiveStateEntity;
import com.tallerzapata.backend.infrastructure.persistence.particularstate.ParticularEffectiveStateHistoryEntity;
import com.tallerzapata.backend.infrastructure.persistence.particularstate.ParticularEffectiveStateHistoryRepository;
import com.tallerzapata.backend.infrastructure.persistence.particularstate.ParticularEffectiveStateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class ParticularEffectiveStateRecalculator {
    private final CaseRepository caseRepository;
    private final CaseTypeRepository caseTypeRepository;
    private final ParticularEffectiveStateRepository stateRepository;
    private final ParticularEffectiveStateHistoryRepository historyRepository;
    private final ParticularEffectiveStateFactsLoader factsLoader;
    private final ParticularEffectiveStatePolicy policy = new ParticularEffectiveStatePolicy();

    public ParticularEffectiveStateRecalculator(CaseRepository caseRepository, CaseTypeRepository caseTypeRepository,
                                                 ParticularEffectiveStateRepository stateRepository, ParticularEffectiveStateHistoryRepository historyRepository,
                                                 ParticularEffectiveStateFactsLoader factsLoader) {
        this.caseRepository = caseRepository;
        this.caseTypeRepository = caseTypeRepository;
        this.stateRepository = stateRepository;
        this.historyRepository = historyRepository;
        this.factsLoader = factsLoader;
    }

    @Transactional
    public RecalculationResult recalculate(Long caseId) {
        return calculate(caseId, true);
    }

    @Transactional(readOnly = true)
    public RecalculationResult preview(Long caseId) {
        return calculate(caseId, false);
    }

    private RecalculationResult calculate(Long caseId, boolean persist) {
        CaseEntity caseEntity = caseRepository.findByIdForUpdate(caseId).orElseThrow();
        if (!caseTypeRepository.findById(caseEntity.getCaseTypeId()).map(type -> "PARTICULAR".equals(normalize(type.getCode()))).orElse(false)) {
            return RecalculationResult.notParticular();
        }

        Optional<ParticularEffectiveStateEntity> existingState = stateRepository.findByCaseIdForUpdate(caseId);
        boolean projectionMissing = existingState.isEmpty();
        ParticularEffectiveStateEntity state = existingState.orElseGet(() -> newState(caseEntity, caseId));
        ParticularEffectiveStatePolicy.ParticularEffectiveState calculated = policy.evaluate(factsLoader.load(caseId, state.getCaseId() == null ? null : state));
        boolean procedureChanged = !calculated.procedureCode().equals(state.getProcedureCode());
        boolean repairChanged = !calculated.repairCode().equals(state.getRepairCode());
        if (!procedureChanged && !repairChanged) return new RecalculationResult(projectionMissing, false, false, hasTerminalOverride(state));

        String priorProcedure = state.getProcedureCode();
        String priorRepair = state.getRepairCode();
        if (persist) {
            state.setProcedureCode(calculated.procedureCode());
            state.setRepairCode(calculated.repairCode());
            state.setRecalculatedAt(LocalDateTime.now());
            stateRepository.save(state);
            appendHistory(caseId, priorProcedure, priorRepair, calculated);
        }
        return new RecalculationResult(projectionMissing, procedureChanged, repairChanged, hasTerminalOverride(state));
    }

    @Transactional
    public void override(Long caseId, String domain, String stateCode, Long actorUserId, String reason) {
        CaseEntity caseEntity = caseRepository.findByIdForUpdate(caseId).orElseThrow();
        if (!caseTypeRepository.findById(caseEntity.getCaseTypeId()).map(type -> "PARTICULAR".equals(normalize(type.getCode()))).orElse(false)) return;
        ParticularEffectiveStateEntity state = stateRepository.findByCaseIdForUpdate(caseId).orElseGet(() -> newState(caseEntity, caseId));
        String priorProcedure = state.getProcedureCode();
        String priorRepair = state.getRepairCode();
        String priorOverride = "tramite".equals(domain) ? state.getProcedureTerminalOverrideCode() : state.getRepairTerminalOverrideCode();
        if ("tramite".equals(domain)) state.setProcedureTerminalOverrideCode(stateCode); else state.setRepairTerminalOverrideCode(stateCode);
        ParticularEffectiveStatePolicy.ParticularEffectiveState calculated = policy.evaluate(factsLoader.load(caseId, state.getCaseId() == null ? null : state));
        state.setProcedureCode(calculated.procedureCode());
        state.setRepairCode(calculated.repairCode());
        state.setRecalculatedAt(LocalDateTime.now());
        stateRepository.save(state);
        ParticularEffectiveStateHistoryEntity history = new ParticularEffectiveStateHistoryEntity();
        history.setCaseId(caseId); history.setPriorProcedureCode(priorProcedure); history.setNewProcedureCode(calculated.procedureCode());
        history.setPriorRepairCode(priorRepair); history.setNewRepairCode(calculated.repairCode()); history.setChangeScope(scope(priorProcedure, priorRepair, calculated));
        history.setCause(stateCode == null ? "OVERRIDE_REVERT" : "OVERRIDE"); history.setActorUserId(actorUserId); history.setReason(reason);
        history.setOverrideDimension("tramite".equals(domain) ? "TRAMITE" : "REPARACION"); history.setOverridePriorCode(priorOverride); history.setOverrideNewCode(stateCode); history.setCreatedAt(LocalDateTime.now());
        historyRepository.save(history);
    }

    private ParticularEffectiveStateEntity newState(CaseEntity caseEntity, Long caseId) {
        ParticularEffectiveStateEntity state = new ParticularEffectiveStateEntity();
        state.setCaseId(caseId);
        state.setProcedureTerminalOverrideCode(terminalOverride(caseEntity.getVisibleCaseStateOverrideCode()));
        state.setRepairTerminalOverrideCode(terminalOverride(caseEntity.getVisibleRepairStateOverrideCode()));
        return state;
    }

    private boolean sameCodes(ParticularEffectiveStateEntity state, ParticularEffectiveStatePolicy.ParticularEffectiveState calculated) {
        return calculated.procedureCode().equals(state.getProcedureCode()) && calculated.repairCode().equals(state.getRepairCode());
    }

    private void appendHistory(Long caseId, String priorProcedure, String priorRepair, ParticularEffectiveStatePolicy.ParticularEffectiveState calculated) {
        ParticularEffectiveStateHistoryEntity history = new ParticularEffectiveStateHistoryEntity();
        history.setCaseId(caseId);
        history.setPriorProcedureCode(priorProcedure);
        history.setNewProcedureCode(calculated.procedureCode());
        history.setPriorRepairCode(priorRepair);
        history.setNewRepairCode(calculated.repairCode());
        history.setChangeScope(scope(priorProcedure, priorRepair, calculated));
        history.setCause("RECALCULATION");
        history.setCreatedAt(LocalDateTime.now());
        historyRepository.save(history);
    }

    private String scope(String priorProcedure, String priorRepair, ParticularEffectiveStatePolicy.ParticularEffectiveState calculated) {
        boolean procedureChanged = !calculated.procedureCode().equals(priorProcedure);
        boolean repairChanged = !calculated.repairCode().equals(priorRepair);
        if (procedureChanged && repairChanged) return "DUAL";
        return procedureChanged ? "TRAMITE" : "REPARACION";
    }

    private String normalize(String value) { return value == null ? "" : value.trim().toUpperCase(); }

    private String terminalOverride(String value) {
        String normalized = normalize(value);
        return "RECHAZADO".equals(normalized) || "DESISTIDO".equals(normalized) ? normalized : null;
    }

    private boolean hasTerminalOverride(ParticularEffectiveStateEntity state) {
        return state.getProcedureTerminalOverrideCode() != null || state.getRepairTerminalOverrideCode() != null;
    }

    public record RecalculationResult(boolean projectionMissing, boolean procedureChanged, boolean repairChanged,
                                      boolean terminalOverridePreserved) {
        static RecalculationResult notParticular() { return new RecalculationResult(false, false, false, false); }
    }
}
