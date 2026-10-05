package com.tallerzapata.backend.api.recovery;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FranchiseRecoveryUpsertRequest(
        String managerCode,
        Long baseCaseId,
        String baseFolderCode,
        String opinionCode,
        BigDecimal agreedAmount,
        BigDecimal recoveryAmount,
        Boolean enablesRepair,
        Boolean recoversClient,
        BigDecimal clientAmount,
        String clientPaymentStatusCode,
        LocalDate clientPaymentDate,
        Boolean approvedLowerAgreement,
        String approvalNote,
        Boolean reusesBaseData,
        LocalDate incidentDate,
        LocalDate presentedAt,
        LocalDate inspectionForwardedAt,
        LocalDate inspectionDate,
        String modalityCode,
        String quotationStatusCode,
        LocalDate quotationDate,
        Boolean includesParts,
        Boolean repairsVehicle,
        String partsProvisionModeCode
) {
    public FranchiseRecoveryUpsertRequest(String managerCode, Long baseCaseId, String baseFolderCode, String opinionCode,
                                          BigDecimal agreedAmount, BigDecimal recoveryAmount, Boolean enablesRepair,
                                          Boolean recoversClient, BigDecimal clientAmount, String clientPaymentStatusCode,
                                          LocalDate clientPaymentDate, Boolean approvedLowerAgreement, String approvalNote,
                                          Boolean reusesBaseData) {
        this(managerCode, baseCaseId, baseFolderCode, opinionCode, agreedAmount, recoveryAmount, enablesRepair,
                recoversClient, clientAmount, clientPaymentStatusCode, clientPaymentDate, approvedLowerAgreement,
                approvalNote, reusesBaseData, null, null, null, null, null, null, null, null, null, null);
    }
    public FranchiseRecoveryUpsertRequest(String managerCode, Long baseCaseId, String baseFolderCode, String opinionCode,
                                          BigDecimal agreedAmount, BigDecimal recoveryAmount, Boolean enablesRepair,
                                          Boolean recoversClient, BigDecimal clientAmount, String clientPaymentStatusCode,
                                          LocalDate clientPaymentDate, Boolean approvedLowerAgreement, String approvalNote,
                                          Boolean reusesBaseData, LocalDate incidentDate, LocalDate presentedAt) {
        this(managerCode, baseCaseId, baseFolderCode, opinionCode, agreedAmount, recoveryAmount, enablesRepair,
                recoversClient, clientAmount, clientPaymentStatusCode, clientPaymentDate, approvedLowerAgreement,
                approvalNote, reusesBaseData, incidentDate, presentedAt, null, null, null, null, null, null, null, null);
    }
}
