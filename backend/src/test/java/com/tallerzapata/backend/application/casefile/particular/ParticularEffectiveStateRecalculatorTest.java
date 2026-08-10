package com.tallerzapata.backend.application.casefile.particular;

import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.particularstate.ParticularEffectiveStateEntity;
import com.tallerzapata.backend.infrastructure.persistence.particularstate.ParticularEffectiveStateHistoryEntity;
import com.tallerzapata.backend.infrastructure.persistence.particularstate.ParticularEffectiveStateHistoryRepository;
import com.tallerzapata.backend.infrastructure.persistence.particularstate.ParticularEffectiveStateRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ParticularEffectiveStateRecalculatorTest {
    @Test
    void createsProjectionAndOneDualHistoryRow() {
        Fixture fixture = particularFixture(null, facts(null, null, "10"));

        fixture.recalculator.recalculate(7L);

        ArgumentCaptor<ParticularEffectiveStateEntity> state = ArgumentCaptor.forClass(ParticularEffectiveStateEntity.class);
        ArgumentCaptor<ParticularEffectiveStateHistoryEntity> history = ArgumentCaptor.forClass(ParticularEffectiveStateHistoryEntity.class);
        verify(fixture.states).save(state.capture());
        verify(fixture.history).save(history.capture());
        assertEquals(7L, state.getValue().getCaseId());
        assertEquals("INGRESADO", state.getValue().getProcedureCode());
        assertEquals("EN_TRAMITE", state.getValue().getRepairCode());
        assertEquals(null, field(history.getValue(), "priorProcedureCode"));
        assertEquals("INGRESADO", field(history.getValue(), "newProcedureCode"));
        assertEquals(null, field(history.getValue(), "priorRepairCode"));
        assertEquals("EN_TRAMITE", field(history.getValue(), "newRepairCode"));
        assertEquals("DUAL", field(history.getValue(), "changeScope"));
    }

    @Test
    void updatesOnlyRepairAndRecordsRepairScopeWithBothCodePairs() {
        ParticularEffectiveStateEntity state = state("INGRESADO", "EN_TRAMITE", null, null);
        Fixture fixture = particularFixture(state, facts(null, null, "10", true));

        fixture.recalculator.recalculate(7L);

        ArgumentCaptor<ParticularEffectiveStateHistoryEntity> history = ArgumentCaptor.forClass(ParticularEffectiveStateHistoryEntity.class);
        verify(fixture.history).save(history.capture());
        assertEquals("INGRESADO", field(history.getValue(), "priorProcedureCode"));
        assertEquals("INGRESADO", field(history.getValue(), "newProcedureCode"));
        assertEquals("EN_TRAMITE", field(history.getValue(), "priorRepairCode"));
        assertEquals("CON_TURNO", field(history.getValue(), "newRepairCode"));
        assertEquals("REPARACION", field(history.getValue(), "changeScope"));
    }

    @Test
    void updatesOnlyProcedureAndRecordsProcedureScope() {
        ParticularEffectiveStateEntity state = state("INGRESADO", "REPARADO", null, null);
        Fixture fixture = particularFixture(state, repairedFacts("0"));

        fixture.recalculator.recalculate(7L);

        ArgumentCaptor<ParticularEffectiveStateHistoryEntity> history = ArgumentCaptor.forClass(ParticularEffectiveStateHistoryEntity.class);
        verify(fixture.history).save(history.capture());
        assertEquals("TRAMITE", field(history.getValue(), "changeScope"));
        assertEquals("PAGADO", field(history.getValue(), "newProcedureCode"));
        assertEquals("REPARADO", field(history.getValue(), "newRepairCode"));
    }

    @Test
    void isIdempotentAndDoesNotAppendHistoryWhenCodesAreUnchanged() {
        Fixture fixture = particularFixture(state("INGRESADO", "EN_TRAMITE", null, null), facts(null, null, "10"));

        fixture.recalculator.recalculate(7L);

        verify(fixture.states, never()).save(any());
        verify(fixture.history, never()).save(any());
    }

    @Test
    void previewReportsMissingProjectionWithoutWritingStateOrHistory() {
        Fixture fixture = particularFixture(null, facts(null, null, "10"));

        ParticularEffectiveStateRecalculator.RecalculationResult result = fixture.recalculator.preview(7L);

        assertEquals(true, result.projectionMissing());
        assertEquals(true, result.procedureChanged());
        verify(fixture.states, never()).save(any());
        verify(fixture.history, never()).save(any());
    }

    @Test
    void createsMissingProjectionWithLegacyTerminalOverridePreserved() {
        Fixture fixture = particularFixture(null, facts("RECHAZADO", null, "10"));
        when(fixture.caseEntity.getVisibleRepairStateOverrideCode()).thenReturn("RECHAZADO");

        fixture.recalculator.recalculate(7L);

        ArgumentCaptor<ParticularEffectiveStateEntity> state = ArgumentCaptor.forClass(ParticularEffectiveStateEntity.class);
        verify(fixture.states).save(state.capture());
        assertEquals("RECHAZADO", state.getValue().getRepairTerminalOverrideCode());
        assertEquals("RECHAZADO", state.getValue().getRepairCode());
    }

    @Test
    void appendsOneImmutableHistoryRowForEachSubsequentChange() {
        ParticularEffectiveStateEntity state = state("INGRESADO", "EN_TRAMITE", null, null);
        Fixture fixture = particularFixture(state, facts(null, null, "10", true));
        when(fixture.loader.load(eq(7L), any())).thenReturn(
                facts(null, null, "10", true), facts(null, null, "10"));

        fixture.recalculator.recalculate(7L);
        fixture.recalculator.recalculate(7L);

        ArgumentCaptor<ParticularEffectiveStateHistoryEntity> history = ArgumentCaptor.forClass(ParticularEffectiveStateHistoryEntity.class);
        verify(fixture.history, org.mockito.Mockito.times(2)).save(history.capture());
        assertEquals("EN_TRAMITE", field(history.getAllValues().get(0), "priorRepairCode"));
        assertEquals("CON_TURNO", field(history.getAllValues().get(0), "newRepairCode"));
        assertEquals("CON_TURNO", field(history.getAllValues().get(1), "priorRepairCode"));
        assertEquals("EN_TRAMITE", field(history.getAllValues().get(1), "newRepairCode"));
    }

    @Test
    void preservesTerminalOverridesAndCalculatesAfterTheirExplicitRevert() {
        ParticularEffectiveStateEntity overridden = state("INGRESADO", "RECHAZADO", null, "RECHAZADO");
        Fixture fixture = particularFixture(overridden, facts("RECHAZADO", null, "10"));

        fixture.recalculator.recalculate(7L);
        verify(fixture.states, never()).save(any());
        verify(fixture.history, never()).save(any());

        overridden.setRepairTerminalOverrideCode(null);
        when(fixture.loader.load(eq(7L), eq(overridden))).thenReturn(facts(null, null, "10"));
        fixture.recalculator.recalculate(7L);

        verify(fixture.states).save(overridden);
        ArgumentCaptor<ParticularEffectiveStateHistoryEntity> history = ArgumentCaptor.forClass(ParticularEffectiveStateHistoryEntity.class);
        verify(fixture.history).save(history.capture());
        assertEquals("EN_TRAMITE", overridden.getRepairCode());
        assertEquals("REPARACION", field(history.getValue(), "changeScope"));
    }

    @Test
    void locksCaseThenProjectionByCaseIdBeforeLoadingFacts() {
        Fixture fixture = particularFixture(state("INGRESADO", "EN_TRAMITE", null, null), facts(null, null, "10"));

        fixture.recalculator.recalculate(7L);

        InOrder order = inOrder(fixture.cases, fixture.states, fixture.loader);
        order.verify(fixture.cases).findByIdForUpdate(7L);
        order.verify(fixture.states).findByCaseIdForUpdate(7L);
        order.verify(fixture.loader).load(7L, fixture.state);
    }

    private Fixture particularFixture(ParticularEffectiveStateEntity state, ParticularEffectiveStateFacts facts) {
        CaseRepository cases = mock(CaseRepository.class);
        CaseTypeRepository types = mock(CaseTypeRepository.class);
        ParticularEffectiveStateRepository states = mock(ParticularEffectiveStateRepository.class);
        ParticularEffectiveStateHistoryRepository history = mock(ParticularEffectiveStateHistoryRepository.class);
        ParticularEffectiveStateFactsLoader loader = mock(ParticularEffectiveStateFactsLoader.class);
        CaseEntity caseEntity = mock(CaseEntity.class);
        CaseTypeEntity type = mock(CaseTypeEntity.class);
        when(caseEntity.getCaseTypeId()).thenReturn(3L);
        when(type.getCode()).thenReturn("PARTICULAR");
        when(cases.findByIdForUpdate(7L)).thenReturn(Optional.of(caseEntity));
        when(types.findById(3L)).thenReturn(Optional.of(type));
        when(states.findByCaseIdForUpdate(7L)).thenReturn(Optional.ofNullable(state));
        when(loader.load(eq(7L), any())).thenReturn(facts);
        return new Fixture(new ParticularEffectiveStateRecalculator(cases, types, states, history, loader), cases, states, history, loader, state, caseEntity);
    }

    private ParticularEffectiveStateFacts facts(String repairOverride, String procedureOverride, String balance) {
        return facts(repairOverride, procedureOverride, balance, false);
    }

    private ParticularEffectiveStateFacts facts(String repairOverride, String procedureOverride, String balance, boolean appointment) {
        return new ParticularEffectiveStateFacts(repairOverride, procedureOverride, null, appointment, false, false, new BigDecimal(balance));
    }

    private ParticularEffectiveStateFacts repairedFacts(String balance) {
        return new ParticularEffectiveStateFacts(null, null,
                new ParticularEffectiveStateFacts.OutcomeFact(1L, null, true, null, false),
                false, false, false, new BigDecimal(balance));
    }

    private ParticularEffectiveStateEntity state(String procedure, String repair, String procedureOverride, String repairOverride) {
        ParticularEffectiveStateEntity state = new ParticularEffectiveStateEntity();
        state.setCaseId(7L);
        state.setProcedureCode(procedure);
        state.setRepairCode(repair);
        state.setProcedureTerminalOverrideCode(procedureOverride);
        state.setRepairTerminalOverrideCode(repairOverride);
        return state;
    }

    private Object field(Object target, String name) {
        try {
            Field field = target.getClass().getDeclaredField(name);
            field.setAccessible(true);
            return field.get(target);
        } catch (ReflectiveOperationException exception) {
            throw new AssertionError(exception);
        }
    }

    private record Fixture(ParticularEffectiveStateRecalculator recalculator, CaseRepository cases,
                           ParticularEffectiveStateRepository states, ParticularEffectiveStateHistoryRepository history,
                           ParticularEffectiveStateFactsLoader loader, ParticularEffectiveStateEntity state, CaseEntity caseEntity) { }
}
