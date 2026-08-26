package com.tallerzapata.backend.api.insurance;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import jakarta.validation.constraints.NotNull;

/**
 * Contact selections are person IDs. The response exposes the persisted case-person link IDs.
 * processorCasePersonId and inspectorCasePersonId are no longer accepted because their former
 * mixed meaning could associate a contact from another case when IDs collide.
 */
public record CaseInsuranceUpsertRequest(
        @NotNull Long insuranceCompanyId,
        String policyNumber,
        String certificateNumber,
        String coverageDetail,
        Long thirdPartyCompanyId,
        String cleasNumber,
        String claimNumber,
        Long processorPersonId,
        Long inspectorPersonId
) {
    @JsonAnySetter
    public void rejectAmbiguousLegacyContactIds(String fieldName, Object value) {
        if ("processorCasePersonId".equals(fieldName) || "inspectorCasePersonId".equals(fieldName)) {
            throw new IllegalArgumentException(fieldName + " fue reemplazado por el ID de persona correspondiente");
        }
    }
}
