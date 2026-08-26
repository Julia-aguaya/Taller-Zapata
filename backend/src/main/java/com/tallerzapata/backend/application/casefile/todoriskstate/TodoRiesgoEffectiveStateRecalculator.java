package com.tallerzapata.backend.application.casefile.todoriskstate;

import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.todoriskstate.TodoRiesgoEffectiveStateEntity;
import com.tallerzapata.backend.infrastructure.persistence.todoriskstate.TodoRiesgoEffectiveStateHistoryEntity;
import com.tallerzapata.backend.infrastructure.persistence.todoriskstate.TodoRiesgoEffectiveStateHistoryRepository;
import com.tallerzapata.backend.infrastructure.persistence.todoriskstate.TodoRiesgoEffectiveStateRepository;
import com.tallerzapata.backend.infrastructure.persistence.todoriskstate.TodoRiesgoStateFactsEntity;
import com.tallerzapata.backend.infrastructure.persistence.todoriskstate.TodoRiesgoStateFactsRepository;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.casefile.InsuranceRepairCasePolicy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.Optional;

@Service
public class TodoRiesgoEffectiveStateRecalculator {
    private final CaseRepository caseRepository; private final CaseTypeRepository caseTypeRepository;
    private final TodoRiesgoEffectiveStateRepository stateRepository; private final TodoRiesgoEffectiveStateHistoryRepository historyRepository;
    private final TodoRiesgoStateFactsRepository factsRepository;
    private final TodoRiesgoEffectiveStateFactsLoader factsLoader; private final TodoRiesgoEffectiveStatePolicy policy = new TodoRiesgoEffectiveStatePolicy();
    private final InsuranceRepairCasePolicy insuranceRepairCasePolicy = new InsuranceRepairCasePolicy();

    public TodoRiesgoEffectiveStateRecalculator(CaseRepository caseRepository, CaseTypeRepository caseTypeRepository, TodoRiesgoEffectiveStateRepository stateRepository,
                                                  TodoRiesgoEffectiveStateHistoryRepository historyRepository, TodoRiesgoStateFactsRepository factsRepository, TodoRiesgoEffectiveStateFactsLoader factsLoader) {
        this.caseRepository = caseRepository; this.caseTypeRepository = caseTypeRepository; this.stateRepository = stateRepository;
        this.historyRepository = historyRepository; this.factsRepository = factsRepository; this.factsLoader = factsLoader;
    }

    @Transactional public RecalculationResult recalculate(Long caseId) { return calculate(caseId, true); }
    @Transactional(readOnly = true) public RecalculationResult preview(Long caseId) { return calculate(caseId, false); }

    @Transactional
    public void recordProcedureFacts(Long caseId, LocalDate agreementDate, LocalDate passedToPaymentsDate, LocalDate paymentDate, Long actorUserId) {
        requireInsuranceRepair(caseId);
        TodoRiesgoStateFactsEntity facts = factsRepository.findById(caseId).orElseGet(() -> newFacts(caseId));
        facts.setAgreementDate(agreementDate); facts.setPassedToPaymentsDate(passedToPaymentsDate); facts.setPaymentDate(paymentDate);
        factsRepository.save(facts); recalculate(caseId);
    }

    @Transactional
    public void recordInsuranceProcedureFacts(Long caseId, LocalDate agreementDate, LocalDate passedToPaymentsDate, Long actorUserId) {
        if (!isInsuranceRepair(caseId)) return;
        TodoRiesgoStateFactsEntity facts = factsRepository.findById(caseId).orElseGet(() -> newFacts(caseId));
        facts.setAgreementDate(agreementDate); facts.setPassedToPaymentsDate(passedToPaymentsDate);
        factsRepository.save(facts); recalculate(caseId);
    }

    @Transactional
    public void recordPaymentFact(Long caseId, LocalDate paymentDate, Long actorUserId) {
        if (!isInsuranceRepair(caseId)) return;
        TodoRiesgoStateFactsEntity facts = factsRepository.findById(caseId).orElseGet(() -> newFacts(caseId));
        facts.setPaymentDate(paymentDate);
        factsRepository.save(facts); recalculate(caseId);
    }

    @Transactional
    public void markNoRepair(Long caseId, String reason, Long actorUserId) {
        requireActorAndReason(actorUserId, reason); requireInsuranceRepair(caseId);
        TodoRiesgoStateFactsEntity facts = factsRepository.findById(caseId).orElseGet(() -> newFacts(caseId));
        if (Boolean.TRUE.equals(facts.getNoRepairActive())) return;
        facts.setNoRepairActive(true); facts.setNoRepairReason(reason.trim()); facts.setNoRepairAt(LocalDateTime.now()); facts.setNoRepairActorUserId(actorUserId);
        factsRepository.save(facts); recalculate(caseId); appendActionHistory(caseId, "OVERRIDE", "NO_REPAIR", actorUserId, reason);
    }

    @Transactional
    public void revertNoRepair(Long caseId, String reason, Long actorUserId) {
        requireActorAndReason(actorUserId, reason); requireInsuranceRepair(caseId);
        TodoRiesgoStateFactsEntity facts = factsRepository.findById(caseId).orElseThrow(() -> new ConflictException("El caso no tiene una accion no debe repararse"));
        if (!Boolean.TRUE.equals(facts.getNoRepairActive())) return;
        facts.setNoRepairActive(false); facts.setNoRepairRevertedAt(LocalDateTime.now()); facts.setNoRepairRevertedActorUserId(actorUserId); facts.setNoRepairRevertedReason(reason.trim());
        factsRepository.save(facts); recalculate(caseId); appendActionHistory(caseId, "REVERT", "NO_REPAIR_REVERT", actorUserId, reason);
    }

    private RecalculationResult calculate(Long caseId, boolean persist) {
        CaseEntity caseEntity = caseRepository.findByIdForUpdate(caseId).orElseThrow();
        if (!caseTypeRepository.findById(caseEntity.getCaseTypeId()).map(type -> insuranceRepairCasePolicy.isInsuranceRepair(type.getCode())).orElse(false)) return RecalculationResult.notInsuranceRepair();
        Optional<TodoRiesgoEffectiveStateEntity> existing = stateRepository.findByCaseIdForUpdate(caseId);
        TodoRiesgoEffectiveStateEntity state = existing.orElseGet(() -> newState(caseId));
        TodoRiesgoEffectiveStatePolicy.TodoRiesgoEffectiveState calculated = policy.evaluate(factsLoader.load(caseEntity));
        boolean procedureChanged = !calculated.procedureCode().equals(state.getProcedureCode());
        boolean repairChanged = !calculated.repairCode().equals(state.getRepairCode());
        if (!procedureChanged && !repairChanged) return new RecalculationResult(existing.isEmpty(), false, false);
        if (persist) {
            String priorProcedure = state.getProcedureCode(); String priorRepair = state.getRepairCode();
            state.setProcedureCode(calculated.procedureCode()); state.setRepairCode(calculated.repairCode()); state.setRecalculatedAt(LocalDateTime.now());
            stateRepository.save(state); appendHistory(caseId, priorProcedure, priorRepair, calculated);
        }
        return new RecalculationResult(existing.isEmpty(), procedureChanged, repairChanged);
    }

    private TodoRiesgoEffectiveStateEntity newState(Long caseId) { TodoRiesgoEffectiveStateEntity state = new TodoRiesgoEffectiveStateEntity(); state.setCaseId(caseId); return state; }
    private TodoRiesgoStateFactsEntity newFacts(Long caseId) { TodoRiesgoStateFactsEntity facts = new TodoRiesgoStateFactsEntity(); facts.setCaseId(caseId); facts.setNoRepairActive(false); return facts; }
    private void requireInsuranceRepair(Long caseId) { if (!isInsuranceRepair(caseId)) throw new ConflictException("La accion solo aplica a casos de reparacion con seguro"); }
    private boolean isInsuranceRepair(Long caseId) { return caseTypeRepository.findById(caseRepository.findByIdForUpdate(caseId).orElseThrow().getCaseTypeId()).map(type -> insuranceRepairCasePolicy.isInsuranceRepair(type.getCode())).orElse(false); }
    private void requireActorAndReason(Long actorUserId, String reason) { if (actorUserId == null || reason == null || reason.isBlank()) throw new ConflictException("Motivo y actor son obligatorios"); }
    private void appendActionHistory(Long caseId, String scope, String cause, Long actorUserId, String reason) {
        TodoRiesgoEffectiveStatePolicy.TodoRiesgoEffectiveState calculated = policy.evaluate(factsLoader.load(caseRepository.findByIdForUpdate(caseId).orElseThrow()));
        TodoRiesgoEffectiveStateHistoryEntity history = new TodoRiesgoEffectiveStateHistoryEntity();
        history.setCaseId(caseId); history.setNewProcedureCode(calculated.procedureCode()); history.setNewRepairCode(calculated.repairCode()); history.setChangeScope(scope); history.setCause(cause); history.setActorUserId(actorUserId); history.setReason(reason.trim()); history.setOverrideDimension("REPARACION"); history.setCreatedAt(LocalDateTime.now()); historyRepository.save(history);
    }
    private void appendHistory(Long caseId, String priorProcedure, String priorRepair, TodoRiesgoEffectiveStatePolicy.TodoRiesgoEffectiveState calculated) {
        TodoRiesgoEffectiveStateHistoryEntity history = new TodoRiesgoEffectiveStateHistoryEntity();
        history.setCaseId(caseId); history.setPriorProcedureCode(priorProcedure); history.setNewProcedureCode(calculated.procedureCode()); history.setPriorRepairCode(priorRepair); history.setNewRepairCode(calculated.repairCode());
        history.setChangeScope(priorProcedure == null || priorRepair == null || (!calculated.procedureCode().equals(priorProcedure) && !calculated.repairCode().equals(priorRepair)) ? "DUAL" : calculated.procedureCode().equals(priorProcedure) ? "REPARACION" : "TRAMITE");
        history.setCause("RECALCULATION"); history.setCreatedAt(LocalDateTime.now()); historyRepository.save(history);
    }
    public record RecalculationResult(boolean projectionMissing, boolean procedureChanged, boolean repairChanged) { static RecalculationResult notInsuranceRepair() { return new RecalculationResult(false, false, false); } }
}
