package com.tallerzapata.backend.api.insurance;

public record CaseThirdPartyWorkshopContactResponse(
        Long casePersonId,
        Long personId,
        String name,
        String email,
        String phone
) {
}
