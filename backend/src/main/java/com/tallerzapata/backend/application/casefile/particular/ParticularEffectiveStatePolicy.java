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
        if (outcome != null && outcome.hasUnsatisfiedReentry()) return "DEBE_REINGRESAR";
        if (facts.hasValidNormalAppointment()) return "CON_TURNO";
        if (facts.hasUnreceivedPart()) return "FALTAN_REPUESTOS";
        if (facts.hasQualifyingReceipt()) return "DAR_TURNO";
        return "EN_TRAMITE";
    }

    private String procedureCode(ParticularEffectiveStateFacts facts, String repairCode) {
        if (isTerminal(facts.procedureTerminalOverrideCode())) return facts.procedureTerminalOverrideCode();
        if (isFullyPaid(facts)) return "PAGADO";
        if ("REPARADO".equals(repairCode)) return "PASADO_A_PAGOS";
        return "INGRESADO";
    }

    /**
     * "Pagado" exige que haya existido algo que pagar: un monto citado positivo
     * cubierto por los pagos del cliente. Una carpeta sin presupuesto (o con saldo
     * desconocido) nunca nace pagada.
     */
    private boolean isFullyPaid(ParticularEffectiveStateFacts facts) {
        BigDecimal expected = facts.expectedTotal();
        BigDecimal balance = facts.balance();
        return expected != null && expected.signum() > 0
                && balance != null && balance.signum() <= 0;
    }

    private boolean isTerminal(String code) { return code != null && TERMINAL_CODES.contains(code); }

    public record ParticularEffectiveState(String procedureCode, String repairCode) { }
}
