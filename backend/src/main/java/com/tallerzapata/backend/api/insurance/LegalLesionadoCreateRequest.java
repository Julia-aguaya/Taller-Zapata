package com.tallerzapata.backend.api.insurance;

import java.time.LocalDate;

public record LegalLesionadoCreateRequest(
        String lesionadoEsCode,
        Long personId,
        String fullName,
        String documentNumber,
        Boolean provesIncome,
        String lastName,
        String firstName,
        LocalDate birthDate,
        String address,
        String civilStatusCode,
        String phone,
        String email,
        String profession,
        String notes
) {
}
