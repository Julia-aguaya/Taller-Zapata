package com.tallerzapata.backend.application.casefile.particular;

import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartEntity;
import com.tallerzapata.backend.infrastructure.persistence.finance.IssuedReceiptEntity;
import com.tallerzapata.backend.infrastructure.persistence.finance.IssuedReceiptRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleOutcomeEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleOutcomeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ParticularEffectiveStateFactsLoaderTest {
    private static final long CASE_ID = 7L;
    private static final LocalDateTime T1 = LocalDateTime.of(2026, 8, 9, 10, 0);
    private static final LocalDateTime T2 = T1.plusMinutes(1);

    @Test
    void acceptsCurrentExplicitReentryForTheSameCase() {
        VehicleOutcomeEntity outcome = outcome(1L, T1, T1, 10L, false, true);
        assertTrue(load(List.of(outcome), List.of(appointment(10L, CASE_ID, T1.minusMinutes(1), "PENDIENTE", true)), List.of()).latestOutcome().hasLaterValidReentryAppointment());
    }

    @Test
    void rejectsExplicitReentryFromAnotherCase() {
        VehicleOutcomeEntity outcome = outcome(1L, T1, T1, 10L, false, true);
        assertFalse(load(List.of(outcome), List.of(appointment(10L, 8L, T2, "PENDIENTE", true)), List.of()).latestOutcome().hasLaterValidReentryAppointment());
    }

    @Test
    void rejectsExplicitAppointmentThatIsNotReentry() {
        VehicleOutcomeEntity outcome = outcome(1L, T1, T1, 10L, false, true);
        assertFalse(load(List.of(outcome), List.of(appointment(10L, CASE_ID, T2, "PENDIENTE", false)), List.of()).latestOutcome().hasLaterValidReentryAppointment());
    }

    @Test
    void rejectsExplicitAppointmentOutsideCurrentStatuses() {
        VehicleOutcomeEntity outcome = outcome(1L, T1, T1, 10L, false, true);
        assertFalse(load(List.of(outcome), List.of(appointment(10L, CASE_ID, T2, "CUMPLIDO", true)), List.of()).latestOutcome().hasLaterValidReentryAppointment());
    }

    @Test
    void acceptsFallbackCreatedAfterRequiringOutcome() {
        VehicleOutcomeEntity outcome = outcome(1L, T1, T1, null, false, true);
        assertTrue(load(List.of(outcome), List.of(appointment(2L, CASE_ID, T2, "PENDIENTE", true)), List.of()).latestOutcome().hasLaterValidReentryAppointment());
    }

    @Test
    void acceptsFallbackAtSameTimestampOnlyWhenIdIsLater() {
        VehicleOutcomeEntity outcome = outcome(10L, T1, T1, null, false, true);
        assertTrue(load(List.of(outcome), List.of(appointment(11L, CASE_ID, T1, "REPROGRAMADO", true)), List.of()).latestOutcome().hasLaterValidReentryAppointment());
    }

    @Test
    void rejectsFallbackAtSameTimestampWhenIdIsNotLater() {
        VehicleOutcomeEntity outcome = outcome(10L, T1, T1, null, false, true);
        assertFalse(load(List.of(outcome), List.of(appointment(9L, CASE_ID, T1, "PENDIENTE", true)), List.of()).latestOutcome().hasLaterValidReentryAppointment());
    }

    @Test
    void rejectsFallbackCreatedBeforeRequiringOutcomeEvenWhenAppointmentDateWouldBeLater() {
        VehicleOutcomeEntity outcome = outcome(1L, T1, T1, null, false, true);
        assertFalse(load(List.of(outcome), List.of(appointment(2L, CASE_ID, T1.minusMinutes(1), "PENDIENTE", true)), List.of()).latestOutcome().hasLaterValidReentryAppointment());
    }

    @Test
    void excludesFallbackFromAnEarlierReentryStage() {
        VehicleOutcomeEntity earlier = outcome(1L, T1, T1, null, false, true);
        VehicleOutcomeEntity later = outcome(3L, T2, T2, null, false, true);
        assertFalse(load(List.of(earlier, later), List.of(appointment(2L, CASE_ID, T1.plusSeconds(1), "PENDIENTE", true)), List.of()).latestOutcome().hasLaterValidReentryAppointment());
    }

    @Test
    void acceptsFallbackOnlyInCurrentReentryStage() {
        VehicleOutcomeEntity earlier = outcome(1L, T1, T1, null, false, true);
        VehicleOutcomeEntity later = outcome(3L, T2, T2, null, false, true);
        assertTrue(load(List.of(earlier, later), List.of(appointment(4L, CASE_ID, T2.plusSeconds(1), "PENDIENTE", true)), List.of()).latestOutcome().hasLaterValidReentryAppointment());
    }

    @Test
    void fulfilledReentryWithLaterIntakeDoesNotLeaveUnsatisfiedReentry() {
        VehicleOutcomeEntity outcome = outcome(1L, T1, T1, 2L, false, true);
        ParticularEffectiveStateFacts.OutcomeFact fact = load(List.of(outcome), List.of(appointment(2L, CASE_ID, T2, "CUMPLIDO", true)), List.of(intake(T2))).latestOutcome();
        assertFalse(fact.hasLaterValidReentryAppointment());
        assertTrue(fact.hasLaterAdvancedFact());
        assertFalse(fact.hasUnsatisfiedReentry());
    }

    @Test
    void laterExplicitNonReentryOutcomeIsRepaired() {
        VehicleOutcomeEntity requiring = outcome(1L, T1, T1, null, false, true);
        VehicleOutcomeEntity later = outcome(2L, T2, T2, null, false, false);
        assertTrue(load(List.of(requiring, later), List.of(), List.of()).latestOutcome().isRepaired());
    }

    @Test
    void fulfilledReentryWithoutLaterFactsRemainsUnsatisfied() {
        VehicleOutcomeEntity outcome = outcome(1L, T1, T1, 2L, false, true);
        assertTrue(load(List.of(outcome), List.of(appointment(2L, CASE_ID, T2, "CUMPLIDO", true)), List.of()).latestOutcome().hasUnsatisfiedReentry());
    }

    @Test
    void treatsOnlyReceivedPartsAsResolvedAndOnlyFacturaOrReciboAsQualifying() {
        assertTrue(load(List.of(), List.of(), List.of(), List.of(part("AUTORIZADO")), List.of()).hasUnreceivedPart());
        assertFalse(load(List.of(), List.of(), List.of(), List.of(part("RECIBIDO")), List.of()).hasUnreceivedPart());
        assertFalse(load(List.of(), List.of(), List.of(), List.of(), List.of()).hasUnreceivedPart());
        assertFalse(load(List.of(), List.of(), List.of(), List.of(), List.of(receipt("NOTA_CREDITO"))).hasQualifyingReceipt());
        assertTrue(load(List.of(), List.of(), List.of(), List.of(), List.of(receipt("FACTURA"))).hasQualifyingReceipt());
        assertTrue(load(List.of(), List.of(), List.of(), List.of(), List.of(receipt("RECIBO"))).hasQualifyingReceipt());
    }

    private ParticularEffectiveStateFacts load(List<VehicleOutcomeEntity> outcomes, List<RepairAppointmentEntity> appointments, List<VehicleIntakeEntity> intakes) {
        return load(outcomes, appointments, intakes, List.of(), List.of());
    }

    private ParticularEffectiveStateFacts load(List<VehicleOutcomeEntity> outcomes, List<RepairAppointmentEntity> appointments, List<VehicleIntakeEntity> intakes,
                                               List<CasePartEntity> parts, List<IssuedReceiptEntity> receipts) {
        VehicleOutcomeRepository outcomesRepository = mock(VehicleOutcomeRepository.class);
        VehicleIntakeRepository intakesRepository = mock(VehicleIntakeRepository.class);
        RepairAppointmentRepository appointmentsRepository = mock(RepairAppointmentRepository.class);
        CasePartRepository partsRepository = mock(CasePartRepository.class);
        IssuedReceiptRepository receiptsRepository = mock(IssuedReceiptRepository.class);
        ParticularFinancialBalanceService balanceService = mock(ParticularFinancialBalanceService.class);
        when(outcomesRepository.findByCaseId(CASE_ID, Sort.unsorted())).thenReturn(outcomes);
        when(intakesRepository.findByCaseId(CASE_ID, Sort.unsorted())).thenReturn(intakes);
        when(appointmentsRepository.findByCaseId(CASE_ID, Sort.by("createdAt").ascending().and(Sort.by("id").ascending()))).thenReturn(appointments);
        when(partsRepository.findByCaseIdOrderByIdAsc(CASE_ID)).thenReturn(parts);
        when(receiptsRepository.findByCaseId(CASE_ID, Sort.unsorted())).thenReturn(receipts);
        when(balanceService.balanceFor(CASE_ID)).thenReturn(BigDecimal.ZERO);
        return new ParticularEffectiveStateFactsLoader(outcomesRepository, intakesRepository, appointmentsRepository, partsRepository, receiptsRepository, balanceService).load(CASE_ID, null);
    }

    private VehicleOutcomeEntity outcome(Long id, LocalDateTime outcomeAt, LocalDateTime createdAt, Long reentryId, boolean definitive, boolean shouldReenter) {
        VehicleOutcomeEntity outcome = mock(VehicleOutcomeEntity.class);
        when(outcome.getId()).thenReturn(id);
        when(outcome.getOutcomeAt()).thenReturn(outcomeAt);
        when(outcome.getCreatedAt()).thenReturn(createdAt);
        when(outcome.getReentryAppointmentId()).thenReturn(reentryId);
        when(outcome.getDefinitive()).thenReturn(definitive);
        when(outcome.getShouldReenter()).thenReturn(shouldReenter);
        return outcome;
    }

    private RepairAppointmentEntity appointment(Long id, Long caseId, LocalDateTime createdAt, String status, boolean reentry) {
        RepairAppointmentEntity appointment = mock(RepairAppointmentEntity.class);
        when(appointment.getId()).thenReturn(id);
        when(appointment.getCaseId()).thenReturn(caseId);
        when(appointment.getCreatedAt()).thenReturn(createdAt);
        when(appointment.getStatusCode()).thenReturn(status);
        when(appointment.getReentry()).thenReturn(reentry);
        return appointment;
    }

    private VehicleIntakeEntity intake(LocalDateTime intakeAt) {
        VehicleIntakeEntity intake = mock(VehicleIntakeEntity.class);
        when(intake.getIntakeAt()).thenReturn(intakeAt);
        return intake;
    }

    private CasePartEntity part(String status) {
        CasePartEntity part = mock(CasePartEntity.class);
        when(part.getStatusCode()).thenReturn(status);
        return part;
    }

    private IssuedReceiptEntity receipt(String type) {
        IssuedReceiptEntity receipt = mock(IssuedReceiptEntity.class);
        when(receipt.getReceiptTypeCode()).thenReturn(type);
        return receipt;
    }
}
