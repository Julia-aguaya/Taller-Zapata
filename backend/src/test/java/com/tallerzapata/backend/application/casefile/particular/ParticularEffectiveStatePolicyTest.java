package com.tallerzapata.backend.application.casefile.particular;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ParticularEffectiveStatePolicyTest {
    private final ParticularEffectiveStatePolicy policy = new ParticularEffectiveStatePolicy();

    @Test
    void appliesRepairPrecedenceBeforeProcedurePrecedence() {
        assertState("INGRESADO", "RECHAZADO", facts("RECHAZADO", null, outcome(true, true, false), true, true, true, "10"));
        assertState("PASADO_A_PAGOS", "REPARADO", facts(null, null, outcome(true, true, false), true, true, true, "10"));
        assertState("INGRESADO", "DEBE_REINGRESAR", facts(null, null, outcome(false, true, false), true, true, true, "10"));
        assertState("INGRESADO", "CON_TURNO", facts(null, null, outcome(false, true, true), true, true, true, "10"));
        assertState("INGRESADO", "FALTAN_REPUESTOS", facts(null, null, null, false, true, true, "10"));
        assertState("INGRESADO", "DAR_TURNO", facts(null, null, null, false, false, true, "10"));
        assertState("INGRESADO", "EN_TRAMITE", facts(null, null, null, false, false, false, "10"));
    }

    @Test
    void treatsExplicitFalseAsRepairedButNullAsNoOutcomeEvidence() {
        assertState("PASADO_A_PAGOS", "REPARADO", facts(null, null, outcome(null, false, false), false, false, false, "2"));
        assertState("INGRESADO", "EN_TRAMITE", facts(null, null, outcome(null, null, false), false, false, false, "2"));
    }

    @Test
    void procedureOverrideAndPaymentPrecedenceAreIndependent() {
        assertState("DESISTIDO", "REPARADO", facts(null, "DESISTIDO", outcome(true, false, false), false, false, false, "0"));
        assertState("PAGADO", "REPARADO", facts(null, null, outcome(true, false, false), false, false, false, "0"));
    }

    @Test
    void treatsNullOverridesAsAbsentWithoutChangingRepairOrProcedurePrecedence() {
        assertState("INGRESADO", "EN_TRAMITE", facts(null, null, null, false, false, false, "10"));
        assertState("RECHAZADO", "EN_TRAMITE", facts(null, "RECHAZADO", null, false, false, false, "10"));
        assertState("INGRESADO", "DESISTIDO", facts("DESISTIDO", null, null, false, false, false, "10"));
    }

    @Test
    void coversEveryOrderedPolicyOutcomeAndProcedureBoundary() {
        List<PolicyCase> cases = List.of(
                new PolicyCase("repair override", "INGRESADO", "DESISTIDO", facts("DESISTIDO", null, outcome(true, true, false), true, true, true, "10")),
                new PolicyCase("definitive outcome", "PASADO_A_PAGOS", "REPARADO", facts(null, null, outcome(true, true, false), true, true, true, "10")),
                new PolicyCase("explicit non reentry", "PASADO_A_PAGOS", "REPARADO", facts(null, null, outcome(false, false, false), true, true, true, "10")),
                new PolicyCase("unsatisfied reentry", "INGRESADO", "DEBE_REINGRESAR", facts(null, null, outcome(false, true, false), true, true, true, "10")),
                new PolicyCase("current appointment beats unresolved part", "INGRESADO", "CON_TURNO", facts(null, null, null, true, true, true, "10")),
                new PolicyCase("unresolved AUTORIZADO part", "INGRESADO", "FALTAN_REPUESTOS", facts(null, null, null, false, true, true, "10")),
                new PolicyCase("received or deleted parts", "INGRESADO", "DAR_TURNO", facts(null, null, null, false, false, true, "10")),
                new PolicyCase("no qualifying receipt", "INGRESADO", "EN_TRAMITE", facts(null, null, null, false, false, false, "10")),
                new PolicyCase("zero balance wins after repaired", "PAGADO", "REPARADO", facts(null, null, outcome(true, false, false), false, false, false, "0")),
                new PolicyCase("null balance has no proof of payment", "INGRESADO", "EN_TRAMITE", facts(null, null, null, false, false, false, null)),
                new PolicyCase("nothing quoted is never paid", "INGRESADO", "EN_TRAMITE", facts(null, null, null, false, false, false, "0", null)),
                new PolicyCase("zero quoted total repaired goes to payments only", "PASADO_A_PAGOS", "REPARADO", facts(null, null, outcome(true, false, false), false, false, false, "0", "0")),
                new PolicyCase("procedure override remains independent", "RECHAZADO", "REPARADO", facts(null, "RECHAZADO", outcome(true, false, false), false, false, false, "0"))
        );

        for (PolicyCase policyCase : cases) {
            ParticularEffectiveStatePolicy.ParticularEffectiveState actual = policy.evaluate(policyCase.facts());
            assertEquals(policyCase.procedure(), actual.procedureCode(), policyCase.name());
            assertEquals(policyCase.repair(), actual.repairCode(), policyCase.name());
        }
    }

    @Test
    void freshlyCreatedCaseWithoutBudgetOrPaymentsIsNeverPaid() {
        // Regresión: una carpeta recién creada (sin presupuesto ni movimientos)
        // no debe figurar como PAGADO aunque su saldo sea cero.
        assertState("INGRESADO", "EN_TRAMITE", facts(null, null, null, false, false, false, "0", null));
        // Reparada sin monto citado avanza a PASADO_A_PAGOS, jamás a PAGADO.
        assertState("PASADO_A_PAGOS", "REPARADO", facts(null, null, outcome(true, false, false), false, false, false, "0", null));
    }

    private void assertState(String procedure, String repair, ParticularEffectiveStateFacts facts) {
        ParticularEffectiveStatePolicy.ParticularEffectiveState actual = policy.evaluate(facts);
        assertEquals(procedure, actual.procedureCode());
        assertEquals(repair, actual.repairCode());
    }

    private ParticularEffectiveStateFacts facts(String repairOverride, String procedureOverride, ParticularEffectiveStateFacts.OutcomeFact outcome,
                                                  boolean appointment, boolean unreceivedPart, boolean qualifyingReceipt, String balance) {
        return facts(repairOverride, procedureOverride, outcome, appointment, unreceivedPart, qualifyingReceipt, balance, "100");
    }

    private ParticularEffectiveStateFacts facts(String repairOverride, String procedureOverride, ParticularEffectiveStateFacts.OutcomeFact outcome,
                                                  boolean appointment, boolean unreceivedPart, boolean qualifyingReceipt, String balance,
                                                  String expectedTotal) {
        return new ParticularEffectiveStateFacts(repairOverride, procedureOverride, outcome, appointment, unreceivedPart, qualifyingReceipt,
                balance == null ? null : new BigDecimal(balance),
                expectedTotal == null ? null : new BigDecimal(expectedTotal));
    }

    private ParticularEffectiveStateFacts.OutcomeFact outcome(Boolean definitive, Boolean shouldReenter, boolean hasReentry) {
        return new ParticularEffectiveStateFacts.OutcomeFact(1L, LocalDateTime.now(), definitive, shouldReenter, hasReentry);
    }

    private record PolicyCase(String name, String procedure, String repair, ParticularEffectiveStateFacts facts) { }
}
