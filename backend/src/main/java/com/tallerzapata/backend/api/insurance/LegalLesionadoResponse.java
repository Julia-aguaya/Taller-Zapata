package com.tallerzapata.backend.api.insurance;

public record LegalLesionadoResponse(
        Long id,
        Long caseLegalId,
        String lesionadoEsCode,
        Long personId,
        String fullName,
        String documentNumber,
        Boolean provesIncome
) {
}
