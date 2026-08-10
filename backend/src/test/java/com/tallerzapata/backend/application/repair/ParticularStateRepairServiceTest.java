package com.tallerzapata.backend.application.repair;

import com.tallerzapata.backend.application.casefile.particular.ParticularEffectiveStateRecalculator;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.particularstate.ParticularEffectiveStateEntity;
import com.tallerzapata.backend.infrastructure.persistence.particularstate.ParticularEffectiveStateRepository;
import org.junit.jupiter.api.Test;
import org.mockito.stubbing.Answer;
import org.springframework.transaction.support.TransactionOperations;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ParticularStateRepairServiceTest {
    @Test
    void dryRunUsesPreviewAndDoesNotApplyWrites() {
        Fixture fixture = fixture(caseEntity(2L, null, null));
        when(fixture.recalculator.preview(2L)).thenReturn(result(true, true, false, false));

        ParticularStateRepairService.RepairSummary summary = fixture.service.repair(false);

        verify(fixture.recalculator).preview(2L);
        verify(fixture.recalculator, never()).recalculate(any());
        assertEquals(1, summary.scanned());
        assertEquals(1, summary.missingProjection());
        assertEquals(1, summary.procedureTransitions());
    }

    @Test
    void applyIsIdempotentWhenRecalculatorReportsNoChange() {
        Fixture fixture = fixture(caseEntity(2L, null, null));
        when(fixture.recalculator.recalculate(2L)).thenReturn(result(false, false, false, false));

        ParticularStateRepairService.RepairSummary summary = fixture.service.repair(true);

        verify(fixture.recalculator).recalculate(2L);
        assertEquals(1, summary.noChange());
        assertEquals(0, summary.procedureTransitions());
        assertEquals(0, summary.repairTransitions());
    }

    @Test
    void categorizesMissingProjectionTransitionsAndPreservedOverrides() {
        Fixture fixture = fixture(caseEntity(2L, null, null), caseEntity(8L, null, null));
        when(fixture.recalculator.recalculate(2L)).thenReturn(result(true, true, true, true));
        when(fixture.recalculator.recalculate(8L)).thenReturn(result(false, false, true, false));

        ParticularStateRepairService.RepairSummary summary = fixture.service.repair(true);

        assertEquals(2, summary.scanned());
        assertEquals(1, summary.missingProjection());
        assertEquals(1, summary.procedureTransitions());
        assertEquals(2, summary.repairTransitions());
        assertEquals(1, summary.overridesPreserved());
    }

    @Test
    void skipsAmbiguousLegacyOverrideInsteadOfGuessing() {
        CaseEntity ambiguous = caseEntity(2L, "CON_TURNO", null);
        Fixture fixture = fixture(ambiguous);
        when(fixture.states.findById(2L)).thenReturn(Optional.empty());

        ParticularStateRepairService.RepairSummary summary = fixture.service.repair(true);

        verify(fixture.recalculator, never()).recalculate(any());
        assertEquals(1, summary.ambiguousSkipped());
        assertEquals(0, summary.errors());
    }

    @Test
    void doesNotTreatExistingProjectionOverrideAsAmbiguous() {
        CaseEntity caseEntity = caseEntity(2L, "CON_TURNO", null);
        Fixture fixture = fixture(caseEntity);
        ParticularEffectiveStateEntity state = new ParticularEffectiveStateEntity();
        state.setCaseId(2L);
        when(fixture.states.findById(2L)).thenReturn(Optional.of(state));
        when(fixture.recalculator.recalculate(2L)).thenReturn(result(false, false, false, true));

        ParticularStateRepairService.RepairSummary summary = fixture.service.repair(true);

        verify(fixture.recalculator).recalculate(2L);
        assertEquals(1, summary.overridesPreserved());
    }

    @Test
    void appliesInRepositoryCaseIdOrderAndContinuesAfterAnIsolatedFailure() {
        Fixture fixture = fixture(caseEntity(2L, null, null), caseEntity(8L, null, null));
        when(fixture.recalculator.recalculate(2L)).thenThrow(new IllegalStateException("bad legacy case"));
        when(fixture.recalculator.recalculate(8L)).thenReturn(result(false, false, false, false));

        ParticularStateRepairService.RepairSummary summary = fixture.service.repair(true);

        inOrder(fixture.recalculator).verify(fixture.recalculator).recalculate(2L);
        inOrder(fixture.recalculator).verify(fixture.recalculator).recalculate(8L);
        assertEquals(1, summary.errors());
        assertEquals(1, summary.noChange());
    }

    private Fixture fixture(CaseEntity... cases) {
        CaseRepository caseRepository = mock(CaseRepository.class);
        ParticularEffectiveStateRepository states = mock(ParticularEffectiveStateRepository.class);
        ParticularEffectiveStateRecalculator recalculator = mock(ParticularEffectiveStateRecalculator.class);
        TransactionOperations transactions = mock(TransactionOperations.class);
        when(caseRepository.findParticularCasesOrderByIdAsc()).thenReturn(List.of(cases));
        when(transactions.execute(any())).thenAnswer((Answer<Object>) invocation -> invocation.<org.springframework.transaction.support.TransactionCallback<?>>getArgument(0).doInTransaction(null));
        return new Fixture(new ParticularStateRepairService(caseRepository, states, recalculator, transactions), states, recalculator);
    }

    private CaseEntity caseEntity(long id, String procedureOverride, String repairOverride) {
        CaseEntity caseEntity = mock(CaseEntity.class);
        when(caseEntity.getId()).thenReturn(id);
        when(caseEntity.getVisibleCaseStateOverrideCode()).thenReturn(procedureOverride);
        when(caseEntity.getVisibleRepairStateOverrideCode()).thenReturn(repairOverride);
        return caseEntity;
    }

    private ParticularEffectiveStateRecalculator.RecalculationResult result(boolean missing, boolean procedureChanged,
                                                                              boolean repairChanged, boolean overridePreserved) {
        return new ParticularEffectiveStateRecalculator.RecalculationResult(missing, procedureChanged, repairChanged, overridePreserved);
    }

    private record Fixture(ParticularStateRepairService service, ParticularEffectiveStateRepository states,
                           ParticularEffectiveStateRecalculator recalculator) { }
}
