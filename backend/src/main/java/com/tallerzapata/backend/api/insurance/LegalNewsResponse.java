package com.tallerzapata.backend.api.insurance;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record LegalNewsResponse(
        Long id,
        Long caseLegalId,
        LocalDate newsDate,
        String detail,
        Boolean notifyCustomer,
        LocalDateTime notifiedAt
) {
}
