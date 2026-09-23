package com.tallerzapata.backend.application.casefile.cleasstate;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

class CleasEffectiveStatePolicyTest {
    private final CleasEffectiveStatePolicy policy = new CleasEffectiveStatePolicy();

    @Test void appliesCreationPresentationAndExplicitAgreementMatrix() {
        assertState("SIN_PRESENTAR", "EN_TRAMITE", facts(null, false, false, null));
        assertState("PRESENTADO_PD", "EN_TRAMITE", facts(LocalDate.now(), false, false, null));
        assertState("EN_TRAMITE", "EN_TRAMITE", facts(LocalDate.now(), true, false, LocalDate.now()));
        assertState("ACORDADO", "DAR_TURNO", facts(LocalDate.now(), true, true, LocalDate.now()));
    }

    @Test void settlesFavorableOnlyFromTheDedicatedInsurerPaymentTarget() {
        var pending = facts(LocalDate.now(), true, true, LocalDate.now());
        pending = new CleasEffectiveStateFacts(pending.presentedAt(), pending.documentationComplete(), pending.quotationAccepted(), pending.agreementDate(), "DANIO_TOTAL", "A_FAVOR", false, money(100), money(0), money(0), money(0), money(0), null, false, false, null, false, List.of());
        assertState("PASADO_A_PAGOS", "DAR_TURNO", pending);
        assertState("PAGADO", "DAR_TURNO", withPaid(pending, 100, 0, null));
    }

    @Test void requiresEveryAdverseFranchiseSettlementComponent() {
        var pending = new CleasEffectiveStateFacts(LocalDate.now(), true, true, LocalDate.now(), "FRANQUICIA", "EN_CONTRA", false, money(150), money(150), money(50), money(0), money(25), "PENDIENTE", false, false, null, false, List.of());
        assertState("PASADO_A_PAGOS", "DAR_TURNO", pending);
        assertState("PASADO_A_PAGOS", "DAR_TURNO", withPaid(pending, 150, 50, "PENDIENTE"));
        assertState("PAGADO", "DAR_TURNO", withPaid(pending, 150, 50, "COBRADO"));
    }

    @Test void neverMarksAnAdverseTotalClosureAsPaid() {
        var closed = new CleasEffectiveStateFacts(LocalDate.now(), true, true, LocalDate.now(), "DANIO_TOTAL", "EN_CONTRA", true, money(0), money(999), money(0), money(999), money(0), null, false, false, null, false, List.of());
        assertState("ACORDADO", "DAR_TURNO", closed);
    }

    @Test void adverseTotalNeverUsesGenericMovementsAsASettlement() {
        var adverse = new CleasEffectiveStateFacts(LocalDate.now(), true, true, LocalDate.now(), "DANIO_TOTAL", "EN_CONTRA", false, money(999), money(999), money(999), money(999), money(999), "COBRADO", false, false, null, false, List.of());
        assertState("ACORDADO", "DAR_TURNO", adverse);
    }

    @Test void appliesReentryAndExceptionalRepairPrecedence() {
        var reentry = new CleasEffectiveStateFacts(null, false, true, LocalDate.now(), "DANIO_TOTAL", "A_FAVOR", false, money(0), money(0), money(0), money(0), money(0), null, false, false, new CleasEffectiveStateFacts.OutcomeFact(false, true, false), false, List.of());
        assertState("ACORDADO", "DEBE_REINGRESAR", reentry);
        assertState("ACORDADO", "CON_TURNO", new CleasEffectiveStateFacts(reentry.presentedAt(), reentry.documentationComplete(), reentry.quotationAccepted(), reentry.agreementDate(), reentry.scopeCode(), reentry.opinionCode(), false, money(0), money(0), money(0), money(0), money(0), null, false, false, new CleasEffectiveStateFacts.OutcomeFact(false, true, true), false, List.of()));
        assertState("ACORDADO", "NO_DEBE_REPARARSE", new CleasEffectiveStateFacts(reentry.presentedAt(), reentry.documentationComplete(), reentry.quotationAccepted(), reentry.agreementDate(), reentry.scopeCode(), reentry.opinionCode(), false, money(0), money(0), money(0), money(0), money(0), null, true, true, null, false, List.of()));
    }

    private CleasEffectiveStateFacts facts(LocalDate presented, boolean docs, boolean accepted, LocalDate agreement) { return new CleasEffectiveStateFacts(presented, docs, accepted, agreement, "DANIO_TOTAL", "A_FAVOR", false, money(0), money(0), money(0), money(0), money(0), null, false, false, null, false, List.of()); }
    private CleasEffectiveStateFacts withPaid(CleasEffectiveStateFacts f, int company, int customer, String franchise) { return new CleasEffectiveStateFacts(f.presentedAt(), f.documentationComplete(), f.quotationAccepted(), f.agreementDate(), f.scopeCode(), f.opinionCode(), f.adverseTotalClosed(), f.companyTarget(), money(company), f.customerTarget(), money(customer), f.companyFranchiseTarget(), franchise, f.noRepairActive(), f.urgentRepairActive(), f.latestOutcome(), f.hasValidNormalAppointment(), f.parts()); }
    private BigDecimal money(int value) { return BigDecimal.valueOf(value); }
    private void assertState(String procedure, String repair, CleasEffectiveStateFacts facts) { var result = policy.evaluate(facts); assertThat(result.procedureCode()).isEqualTo(procedure); assertThat(result.repairCode()).isEqualTo(repair); }
}
