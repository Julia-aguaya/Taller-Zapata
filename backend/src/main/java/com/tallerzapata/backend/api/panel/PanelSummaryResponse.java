package com.tallerzapata.backend.api.panel;

public record PanelSummaryResponse(
        long openCases,
        long pendingPayments,
        long casesWithoutAppointment,
        long casesNearPrescription,
        long pendingTasks
) {
}
