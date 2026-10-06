package com.tallerzapata.backend.api.insurance;

import java.time.LocalDate;

public record LegalNewsUpdateRequest(
        LocalDate newsDate,
        String detail,
        Boolean notifyCustomer
) {
}
