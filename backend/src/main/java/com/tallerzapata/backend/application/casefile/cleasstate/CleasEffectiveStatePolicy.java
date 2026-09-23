package com.tallerzapata.backend.application.casefile.cleasstate;
import java.math.BigDecimal;
import java.util.List;
public final class CleasEffectiveStatePolicy {
    public CleasEffectiveState evaluate(CleasEffectiveStateFacts facts) { return new CleasEffectiveState(procedureCode(facts), repairCode(facts)); }
    private String procedureCode(CleasEffectiveStateFacts facts) {
        // El dano total EN_CONTRA se cierra administrativamente: no representa un
        // cobro del taller ni debe avanzar por pagos por movimientos ajenos.
        if (adverseTotal(facts)) return hasAgreement(facts) ? "ACORDADO" : preAgreementProcedureCode(facts);
        if (hasAgreement(facts) && !facts.adverseTotalClosed() && hasSettlementTarget(facts)) {
            if (settlementComplete(facts)) return "PAGADO";
            return "PASADO_A_PAGOS";
        }
        if (hasAgreement(facts)) return "ACORDADO";
        return preAgreementProcedureCode(facts);
    }

    private String preAgreementProcedureCode(CleasEffectiveStateFacts facts) {
        if (facts.presentedAt() == null) return "SIN_PRESENTAR";
        return facts.documentationComplete() ? "EN_TRAMITE" : "PRESENTADO_PD";
    }
    private String repairCode(CleasEffectiveStateFacts facts) {
        if (facts.noRepairActive()) return "NO_DEBE_REPARARSE";
        if (facts.urgentRepairActive() || (facts.latestOutcome() != null && facts.latestOutcome().repaired())) return "REPARADO";
        if (facts.latestOutcome() != null && facts.latestOutcome().mustReenter()) return facts.latestOutcome().hasSatisfiedReentry() || facts.hasValidNormalAppointment() ? "CON_TURNO" : "DEBE_REINGRESAR";
        if (facts.hasValidNormalAppointment()) return "CON_TURNO";
        if (!hasAgreement(facts)) return "EN_TRAMITE";
        boolean pendingAuthorization = false; boolean authorizedUnreceived = false;
        for (CleasEffectiveStateFacts.PartFact part : facts.parts()) { String authorization = normalize(part.authorizationCode()); if ("RECHAZADO".equals(authorization)) continue; if (authorization.isEmpty() || "PENDIENTE".equals(authorization)) pendingAuthorization = true; if ("AUTORIZADO".equals(authorization) && !"RECIBIDO".equals(normalize(part.statusCode()))) authorizedUnreceived = true; }
        if (pendingAuthorization) return "EN_TRAMITE";
        return authorizedUnreceived ? "FALTAN_REPUESTOS" : "DAR_TURNO";
    }
    private boolean hasAgreement(CleasEffectiveStateFacts facts) { return facts.quotationAccepted() && facts.agreementDate() != null; }
    private boolean adverseTotal(CleasEffectiveStateFacts facts) { return "DANIO_TOTAL".equals(normalize(facts.scopeCode())) && "EN_CONTRA".equals(normalize(facts.opinionCode())); }
    private boolean hasSettlementTarget(CleasEffectiveStateFacts facts) { return positive(facts.companyTarget()) || positive(facts.customerTarget()) || positive(facts.companyFranchiseTarget()); }
    private boolean settlementComplete(CleasEffectiveStateFacts facts) {
        return paid(facts.companyPaid(), facts.companyTarget()) && paid(facts.customerPaid(), facts.customerTarget()) && (!positive(facts.companyFranchiseTarget()) || "COBRADO".equals(normalize(facts.companyFranchiseStatus())));
    }
    private boolean paid(BigDecimal paid, BigDecimal target) { return !positive(target) || value(paid).compareTo(value(target)) >= 0; }
    private boolean positive(BigDecimal value) { return value(value).signum() > 0; }
    private BigDecimal value(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }
    private String normalize(String value) { return value == null ? "" : value.trim().toUpperCase(); }
    public record CleasEffectiveState(String procedureCode, String repairCode) { }
}
