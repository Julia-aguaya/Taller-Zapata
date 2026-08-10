package com.tallerzapata.backend.application.casefile.todoriskstate;

import java.time.LocalDate;
import java.util.List;

public record TodoRiesgoEffectiveStateFacts(
        LocalDate presentedAt,
        boolean documentationComplete,
        LocalDate agreementDate,
        LocalDate passedToPaymentsDate,
        LocalDate paymentDate,
        boolean noRepairActive,
        OutcomeFact latestOutcome,
        boolean hasValidNormalAppointment,
        List<PartFact> parts
) {
    public record PartFact(String authorizationCode, String statusCode) { }
    public record OutcomeFact(Long id, boolean repaired, boolean mustReenter, boolean hasSatisfiedReentry) {
        public boolean hasUnsatisfiedReentry() { return mustReenter && !hasSatisfiedReentry; }
    }
}
