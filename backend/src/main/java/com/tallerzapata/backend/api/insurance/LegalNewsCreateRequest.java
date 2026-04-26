package com.tallerzapata.backend.api.insurance;

import java.time.LocalDate;

public record LegalNewsCreateRequest(
        LocalDate newsDate,
        String detail,
        Boolean notifyCustomer
) {
}
