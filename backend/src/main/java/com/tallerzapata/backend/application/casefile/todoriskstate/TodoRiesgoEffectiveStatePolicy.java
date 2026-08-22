package com.tallerzapata.backend.application.casefile.todoriskstate;

import java.util.List;

public final class TodoRiesgoEffectiveStatePolicy {
    public TodoRiesgoEffectiveState evaluate(TodoRiesgoEffectiveStateFacts facts) {
        return new TodoRiesgoEffectiveState(procedureCode(facts), repairCode(facts));
    }

    private String procedureCode(TodoRiesgoEffectiveStateFacts facts) {
        if (facts.paymentDate() != null) return "PAGADO";
        if (facts.passedToPaymentsDate() != null) return "PASADO_A_PAGOS";
        if (facts.agreementDate() != null) return "ACORDADO";
        if (facts.presentedAt() == null) return "SIN_PRESENTAR";
        return facts.documentationComplete() ? "EN_TRAMITE" : "PRESENTADO_PD";
    }

    private String repairCode(TodoRiesgoEffectiveStateFacts facts) {
        if (facts.noRepairActive()) return "NO_DEBE_REPARARSE";
        TodoRiesgoEffectiveStateFacts.OutcomeFact outcome = facts.latestOutcome();
        if (outcome != null && outcome.repaired()) return "REPARADO";
        if (outcome != null && outcome.hasUnsatisfiedReentry()) return "DEBE_REINGRESAR";
        if (facts.hasValidNormalAppointment()) return "CON_TURNO";
        PartsAvailability parts = partsAvailability(facts.parts());
        if (parts.pendingAuthorization()) return "EN_TRAMITE";
        if (parts.authorizedUnreceived()) return "FALTAN_REPUESTOS";
        return "DAR_TURNO";
    }

    private PartsAvailability partsAvailability(List<TodoRiesgoEffectiveStateFacts.PartFact> parts) {
        boolean pendingAuthorization = false;
        boolean authorizedUnreceived = false;
        for (TodoRiesgoEffectiveStateFacts.PartFact part : parts) {
            String authorization = normalize(part.authorizationCode());
            if ("RECHAZADO".equals(authorization)) continue;
            if (authorization.isEmpty() || "PENDIENTE".equals(authorization)) pendingAuthorization = true;
            if ("AUTORIZADO".equals(authorization) && !"RECIBIDO".equals(normalize(part.statusCode()))) authorizedUnreceived = true;
        }
        return new PartsAvailability(pendingAuthorization, authorizedUnreceived);
    }

    private String normalize(String value) { return value == null ? "" : value.trim().toUpperCase(); }

    private record PartsAvailability(boolean pendingAuthorization, boolean authorizedUnreceived) { }

    public record TodoRiesgoEffectiveState(String procedureCode, String repairCode) { }
}
