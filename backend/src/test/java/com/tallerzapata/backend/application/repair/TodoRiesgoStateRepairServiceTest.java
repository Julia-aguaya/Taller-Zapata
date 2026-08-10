package com.tallerzapata.backend.application.repair;

import com.tallerzapata.backend.application.casefile.todoriskstate.TodoRiesgoEffectiveStateRecalculator;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceProcessingRepository;
import com.tallerzapata.backend.infrastructure.persistence.todoriskstate.TodoRiesgoStateFactsRepository;
import org.junit.jupiter.api.Test;
import org.mockito.stubbing.Answer;
import org.springframework.transaction.support.TransactionOperations;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TodoRiesgoStateRepairServiceTest {
    @Test
    void dryRunPreviewsAndApplyRemainsIdempotentWhenThereIsNoChange() {
        CaseRepository cases = mock(CaseRepository.class);
        InsuranceProcessingRepository insurance = mock(InsuranceProcessingRepository.class);
        TodoRiesgoStateFactsRepository facts = mock(TodoRiesgoStateFactsRepository.class);
        TodoRiesgoEffectiveStateRecalculator recalculator = mock(TodoRiesgoEffectiveStateRecalculator.class);
        TransactionOperations transactions = mock(TransactionOperations.class);
        CaseEntity caseEntity = mock(CaseEntity.class);
        when(caseEntity.getId()).thenReturn(7L);
        when(cases.findTodoRiesgoCasesOrderByIdAsc()).thenReturn(List.of(caseEntity));
        when(insurance.findByCaseId(7L)).thenReturn(java.util.Optional.empty());
        when(transactions.execute(any())).thenAnswer((Answer<Object>) invocation -> invocation.<org.springframework.transaction.support.TransactionCallback<?>>getArgument(0).doInTransaction(null));
        when(recalculator.preview(7L)).thenReturn(new TodoRiesgoEffectiveStateRecalculator.RecalculationResult(true, true, false));
        when(recalculator.recalculate(7L)).thenReturn(new TodoRiesgoEffectiveStateRecalculator.RecalculationResult(false, false, false));
        TodoRiesgoStateRepairService service = new TodoRiesgoStateRepairService(cases, insurance, facts, recalculator, transactions);

        TodoRiesgoStateRepairService.RepairSummary dryRun = service.repair(false);
        TodoRiesgoStateRepairService.RepairSummary apply = service.repair(true);

        verify(recalculator).preview(7L);
        verify(recalculator).recalculate(7L);
        verify(recalculator, never()).recalculate(8L);
        assertEquals(1, dryRun.missingProjection());
        assertEquals(1, dryRun.procedureTransitions());
        assertEquals(1, apply.noChange());
    }

    @Test
    void skipsAmbiguousLegacyRecordsWithoutPreviewingOrRecalculating() {
        CaseRepository cases = mock(CaseRepository.class);
        InsuranceProcessingRepository insurance = mock(InsuranceProcessingRepository.class);
        TodoRiesgoStateFactsRepository facts = mock(TodoRiesgoStateFactsRepository.class);
        TodoRiesgoEffectiveStateRecalculator recalculator = mock(TodoRiesgoEffectiveStateRecalculator.class);
        TransactionOperations transactions = mock(TransactionOperations.class);
        CaseEntity caseEntity = mock(CaseEntity.class);
        when(caseEntity.getId()).thenReturn(8L);
        when(caseEntity.getVisibleRepairStateOverrideCode()).thenReturn("NO_DEBE_REPARARSE");
        when(cases.findTodoRiesgoCasesOrderByIdAsc()).thenReturn(List.of(caseEntity));
        TodoRiesgoStateRepairService service = new TodoRiesgoStateRepairService(cases, insurance, facts, recalculator, transactions);

        TodoRiesgoStateRepairService.RepairSummary summary = service.repair(true);

        assertEquals(1, summary.scanned());
        assertEquals(1, summary.ambiguousSkipped());
        verify(recalculator, never()).preview(8L);
        verify(recalculator, never()).recalculate(8L);
        verify(transactions, never()).execute(any());
    }
}
