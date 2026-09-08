package com.tallerzapata.backend.api.insurance;

public record LegalLesionadoCreateRequest(
        String lesionadoEsCode,
        Long personId,
        String fullName,
        String documentNumber,
        Boolean provesIncome
) {
}
