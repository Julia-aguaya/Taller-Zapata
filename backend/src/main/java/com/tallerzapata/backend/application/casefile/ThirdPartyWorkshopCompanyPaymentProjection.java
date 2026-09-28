package com.tallerzapata.backend.application.casefile;

import com.tallerzapata.backend.api.finance.ThirdPartyWorkshopCompanyPaymentSummaryResponse;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementEntity;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseThirdPartyEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseThirdPartyRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceProcessingRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.ThirdPartyWorkshopRetentionRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class ThirdPartyWorkshopCompanyPaymentProjection {
    private final CaseRepository caseRepository;
    private final CaseTypeRepository caseTypeRepository;
    private final CaseThirdPartyRepository caseThirdPartyRepository;
    private final InsuranceProcessingRepository insuranceProcessingRepository;
    private final FinancialMovementRepository movementRepository;
    private final ThirdPartyWorkshopRetentionRepository retentionRepository;
    private final InsuranceRepairCasePolicy insuranceRepairCasePolicy = new InsuranceRepairCasePolicy();

    public ThirdPartyWorkshopCompanyPaymentProjection(
            CaseRepository caseRepository,
            CaseTypeRepository caseTypeRepository,
            CaseThirdPartyRepository caseThirdPartyRepository,
            InsuranceProcessingRepository insuranceProcessingRepository,
            FinancialMovementRepository movementRepository,
            ThirdPartyWorkshopRetentionRepository retentionRepository
    ) {
        this.caseRepository = caseRepository;
        this.caseTypeRepository = caseTypeRepository;
        this.caseThirdPartyRepository = caseThirdPartyRepository;
        this.insuranceProcessingRepository = insuranceProcessingRepository;
        this.movementRepository = movementRepository;
        this.retentionRepository = retentionRepository;
    }

    public ThirdPartyWorkshopCompanyPaymentSummaryResponse summarize(Long caseId) {
        CaseEntity caseEntity = caseRepository.findById(caseId).orElseThrow(() -> new ConflictException("No existe el caso " + caseId));
        String caseTypeCode = caseTypeRepository.findById(caseEntity.getCaseTypeId()).map(type -> type.getCode()).orElse("");
        if (!insuranceRepairCasePolicy.isThirdPartyWorkshopClaim(caseTypeCode)) {
            throw new ConflictException("El resumen de cobro de contraparte solo aplica a RECLAMO_TERCEROS gestionado por Taller");
        }

        CaseThirdPartyEntity thirdParty = caseThirdPartyRepository.findByCaseId(caseId).orElse(null);
        Long companyId = thirdParty == null ? null : thirdParty.getThirdPartyCompanyId();
        BigDecimal agreedAmount = insuranceProcessingRepository.findByCaseId(caseId)
                .map(value -> money(value.getAgreedAmount())).orElse(BigDecimal.ZERO);
        if (companyId == null) {
            return new ThirdPartyWorkshopCompanyPaymentSummaryResponse(caseId, null, agreedAmount, BigDecimal.ZERO, BigDecimal.ZERO, agreedAmount);
        }

        BigDecimal netPayments = BigDecimal.ZERO;
        BigDecimal retentions = retentionRepository.findByCaseIdOrderByRetentionTypeCodeAsc(caseId).stream()
                .map(item -> money(item.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        for (FinancialMovementEntity movement : movementRepository.findByCaseId(caseId, Sort.unsorted())) {
            if (!isEligibleCompanyMovement(movement, companyId)) continue;
            int sign = movementSign(movement);
            netPayments = netPayments.add(money(movement.getNetAmount()).multiply(BigDecimal.valueOf(sign)));
        }
        return new ThirdPartyWorkshopCompanyPaymentSummaryResponse(
                caseId, companyId, agreedAmount, netPayments, retentions,
                agreedAmount.subtract(netPayments).subtract(retentions).max(BigDecimal.ZERO)
        );
    }

    private boolean isEligibleCompanyMovement(FinancialMovementEntity movement, Long companyId) {
        return "ASEGURADORA".equals(normalizeCode(movement.getFlowOriginCode()))
                && "COMPANIA".equals(normalizeCode(movement.getCounterpartyTypeCode()))
                && companyId.equals(movement.getCounterpartyCompanyId())
                && "COMPANIA".equals(normalizeCode(movement.getCancellationTypeCode()));
    }

    private int movementSign(FinancialMovementEntity movement) {
        String movementType = normalizeCode(movement.getMovementTypeCode());
        return "INGRESO".equals(movementType) || "AJUSTE".equals(movementType) && money(movement.getNetAmount()).signum() >= 0 ? 1 : -1;
    }

    private BigDecimal money(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }
    private String normalizeCode(String value) { return value == null || value.isBlank() ? null : value.trim().toUpperCase(); }
}
