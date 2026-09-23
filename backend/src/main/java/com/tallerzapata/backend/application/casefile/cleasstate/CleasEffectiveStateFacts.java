package com.tallerzapata.backend.application.casefile.cleasstate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
public record CleasEffectiveStateFacts(LocalDate presentedAt, boolean documentationComplete, boolean quotationAccepted, LocalDate agreementDate,
                                       String scopeCode, String opinionCode, boolean adverseTotalClosed,
                                       BigDecimal companyTarget, BigDecimal companyPaid, BigDecimal customerTarget, BigDecimal customerPaid,
                                       BigDecimal companyFranchiseTarget, String companyFranchiseStatus,
                                       boolean noRepairActive, boolean urgentRepairActive, OutcomeFact latestOutcome, boolean hasValidNormalAppointment, List<PartFact> parts) {
    public record PartFact(String authorizationCode, String statusCode) { }
    public record OutcomeFact(boolean repaired, boolean mustReenter, boolean hasSatisfiedReentry) { }
}
