package com.tallerzapata.backend.api.cleas;

import java.time.LocalDate;

public record CleasCompanyFranchisePaymentRequest(
        LocalDate paymentDate,
        String statusCode
) {
}
