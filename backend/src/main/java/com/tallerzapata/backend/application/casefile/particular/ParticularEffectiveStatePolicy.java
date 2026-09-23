package com.tallerzapata.backend.application.casefile.particular;

import java.math.BigDecimal;
import java.util.Set;

public final class ParticularEffectiveStatePolicy {
    private static final Set<String> TERMINAL_CODES = Set.of("RECHAZADO", "DESISTIDO");

    public ParticularEffectiveState evaluate(ParticularEffectiveStateFacts facts) {
        String repair = repairCode(facts);
        return new ParticularEffectiveState(procedureCode(facts, repair), repair);
    }

    private String repairCode(ParticularEffectiveStateFacts facts) {
        if (isTerminal(facts.repairTerminalOverrideCode())) return facts.repairTerminalOverrideCode();
        ParticularEffectiveStateFacts.OutcomeFact outcome = facts.latestOutcome();
        if (outcome != null && outcome.isRepaired()) return "REPARADO";
        if (outcome != null && outcome.requiresReentry()) {
            if (outcome.hasLaterValidReentryAppointment() || outcome.hasLaterAdvancedFact()) return "CON_TURNO";
            return "DEBE_REINGRESAR";
        }
        if (facts.hasValidNormalAppointment()) return "CON_TURNO";
        if (facts.hasUnreceivedPart()) return "FALTAN_REPUESTOS";
        if (facts.hasQualifyingReceipt()) return "DAR_TURNO";
        return "EN_TRAMITE";
    }

    private String procedureCode(ParticularEffectiveStateFacts facts, String repairCode) {
        if (isTerminal(facts.procedureTerminalOverrideCode())) return facts.procedureTerminalOverrideCode();
        if (facts.hasPersistedTotalCancellation() && hasNoOutstandingBalance(facts)) return "PAGADO";
        if ("REPARADO".equals(repairCode) && hasPositiveOutstandingBalance(facts)) return "PASADO_A_PAGOS";
        return "INGRESADO";
    }

    /**
     * The automatic transition to payments is meaningful only while a real balance
     * remains. PAGADO itself is governed by the persisted TOTAL cancellation choice.
     */
    private boolean hasPositiveOutstandingBalance(ParticularEffectiveStateFacts facts) {
        BigDecimal balance = facts.balance();
        return balance != null && balance.signum() > 0;
    }

    private boolean hasNoOutstandingBalance(ParticularEffectiveStateFacts facts) {
        return facts.expectedTotal() != null && facts.expectedTotal().signum() > 0
                && facts.balance() != null && facts.balance().signum() <= 0;
    }

    private boolean isTerminal(String code) { return code != null && TERMINAL_CODES.contains(code); }

    public record ParticularEffectiveState(String procedureCode, String repairCode) { }
}
