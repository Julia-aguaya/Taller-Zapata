package com.tallerzapata.backend.application.casefile.todoriskstate;

import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;

class TodoRiesgoEffectiveStatePolicyTest {
    private final TodoRiesgoEffectiveStatePolicy policy = new TodoRiesgoEffectiveStatePolicy();

    @Test
    void appliesProcedureFactsInTheirSpecifiedPriority() {
        assertState("SIN_PRESENTAR", "DAR_TURNO", facts(null, false, null, null, null, false, null, false, List.of()));
        assertState("PRESENTADO_PD", "DAR_TURNO", facts(LocalDate.now(), false, null, null, null, false, null, false, List.of()));
        assertState("EN_TRAMITE", "DAR_TURNO", facts(LocalDate.now(), true, null, null, null, false, null, false, List.of()));
        assertState("ACORDADO", "DAR_TURNO", facts(LocalDate.now(), true, LocalDate.now(), null, null, false, null, false, List.of()));
        assertState("PASADO_A_PAGOS", "DAR_TURNO", facts(null, false, LocalDate.now(), LocalDate.now(), null, false, null, false, List.of()));
        assertState("PAGADO", "DAR_TURNO", facts(null, false, LocalDate.now(), LocalDate.now(), LocalDate.now(), false, null, false, List.of()));
    }

    @Test
    void appliesRepairFactsInTheirSpecifiedPriority() {
        TodoRiesgoEffectiveStateFacts.OutcomeFact repaired = new TodoRiesgoEffectiveStateFacts.OutcomeFact(1L, true, true, false);
        TodoRiesgoEffectiveStateFacts.OutcomeFact reentry = new TodoRiesgoEffectiveStateFacts.OutcomeFact(1L, false, true, false);
        assertState("SIN_PRESENTAR", "NO_DEBE_REPARARSE", facts(null, false, null, null, null, true, repaired, true, pendingParts()));
        assertState("SIN_PRESENTAR", "REPARADO", facts(null, false, null, null, null, false, repaired, true, pendingParts()));
        assertState("SIN_PRESENTAR", "DEBE_REINGRESAR", facts(null, false, null, null, null, false, reentry, true, pendingParts()));
        assertState("SIN_PRESENTAR", "CON_TURNO", facts(null, false, null, null, null, false, null, true, pendingParts()));
    }

    @Test
    void derivesPartsAvailabilityFromRowsWithoutPersistedPartialAuthorization() {
        assertState("SIN_PRESENTAR", "EN_TRAMITE", facts(null, false, null, null, null, false, null, false, pendingParts()));
        assertState("SIN_PRESENTAR", "FALTAN_REPUESTOS", facts(null, false, null, null, null, false, null, false,
                List.of(new TodoRiesgoEffectiveStateFacts.PartFact("AUTORIZADO", "PEDIDO"), new TodoRiesgoEffectiveStateFacts.PartFact("RECHAZADO", "RECIBIDO"))));
        assertState("SIN_PRESENTAR", "DAR_TURNO", facts(null, false, null, null, null, false, null, false,
                List.of(new TodoRiesgoEffectiveStateFacts.PartFact("AUTORIZADO", "RECIBIDO"), new TodoRiesgoEffectiveStateFacts.PartFact("RECHAZADO", "PEDIDO"))));
    }

    private List<TodoRiesgoEffectiveStateFacts.PartFact> pendingParts() { return List.of(new TodoRiesgoEffectiveStateFacts.PartFact(null, "PEDIDO")); }
    private TodoRiesgoEffectiveStateFacts facts(LocalDate presented, boolean docsComplete, LocalDate agreement, LocalDate passedToPayments, LocalDate payment,
                                                boolean noRepair, TodoRiesgoEffectiveStateFacts.OutcomeFact outcome, boolean appointment,
                                                List<TodoRiesgoEffectiveStateFacts.PartFact> parts) {
        return new TodoRiesgoEffectiveStateFacts(presented, docsComplete, agreement, passedToPayments, payment, noRepair, outcome, appointment, parts);
    }
    private void assertState(String procedure, String repair, TodoRiesgoEffectiveStateFacts facts) {
        TodoRiesgoEffectiveStatePolicy.TodoRiesgoEffectiveState actual = policy.evaluate(facts);
        assertEquals(procedure, actual.procedureCode()); assertEquals(repair, actual.repairCode());
    }
}
