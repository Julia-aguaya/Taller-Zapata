package com.tallerzapata.backend.application.casefile.particular;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ParticularEffectiveStateFacts(
        String repairTerminalOverrideCode,
        String procedureTerminalOverrideCode,
        OutcomeFact latestOutcome,
        boolean hasValidNormalAppointment,
        boolean hasUnreceivedPart,
        boolean hasQualifyingReceipt,
        BigDecimal balance
) {
    public record OutcomeFact(Long id, LocalDateTime occurredAt, Boolean definitive, Boolean shouldReenter,
                               boolean hasLaterValidReentryAppointment, boolean hasLaterAdvancedFact) {
        public OutcomeFact(Long id, LocalDateTime occurredAt, Boolean definitive, Boolean shouldReenter,
                           boolean hasLaterValidReentryAppointment) {
            this(id, occurredAt, definitive, shouldReenter, hasLaterValidReentryAppointment, false);
        }
        public boolean isRepaired() {
            return Boolean.TRUE.equals(definitive) || Boolean.FALSE.equals(shouldReenter);
        }

        public boolean hasUnsatisfiedReentry() {
            return Boolean.TRUE.equals(shouldReenter) && !hasLaterValidReentryAppointment && !hasLaterAdvancedFact;
        }
    }
}
