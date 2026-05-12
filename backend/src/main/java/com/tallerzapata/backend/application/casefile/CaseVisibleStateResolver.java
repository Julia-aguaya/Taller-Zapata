package com.tallerzapata.backend.application.casefile;

import com.tallerzapata.backend.api.casefile.CaseVisibleStateResponse;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.IssuedReceiptRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseFranchiseEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseFranchiseRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseLegalEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseLegalRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseThirdPartyEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseThirdPartyRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceProcessingEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceProcessingRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleOutcomeEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleOutcomeRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class CaseVisibleStateResolver {

    private static final Sort REPAIR_APPOINTMENT_SORT = Sort.by(Sort.Order.desc("appointmentDate"), Sort.Order.desc("appointmentTime"), Sort.Order.desc("id"));
    private static final Sort VEHICLE_INTAKE_SORT = Sort.by(Sort.Order.desc("intakeAt"), Sort.Order.desc("id"));
    private static final Sort VEHICLE_OUTCOME_SORT = Sort.by(Sort.Order.desc("outcomeAt"), Sort.Order.desc("id"));
    private static final Sort FINANCE_SORT = Sort.by(Sort.Order.desc("id"));

    private static final String DOMAIN_TRAMITE = "tramite";
    private static final String DOMAIN_REPARACION = "reparacion";

    private static final Set<String> TRAMITE_VISIBLE_CODES = Set.of(
            "SIN_PRESENTAR",
            "PRESENTADO",
            "EN_TRAMITE",
            "ACORDADO",
            "PASADO_A_PAGOS",
            "PAGADO",
            "RECHAZADO",
            "DESISTIDO"
    );

    private static final Set<String> REPARACION_VISIBLE_CODES = Set.of(
            "EN_TRAMITE",
            "FALTAN_REPUESTOS",
            "DAR_TURNO",
            "CON_TURNO",
            "DEBE_REINGRESAR",
            "REPARADO",
            "NO_DEBE_REPARARSE",
            "RECHAZADO",
            "DESISTIDO"
    );

    private static final Map<String, String> LABELS = Map.ofEntries(
            Map.entry("SIN_PRESENTAR", "Sin presentar"),
            Map.entry("PRESENTADO", "Presentado"),
            Map.entry("EN_TRAMITE", "En tramite"),
            Map.entry("ACORDADO", "Acordado"),
            Map.entry("PASADO_A_PAGOS", "Pasado a pagos"),
            Map.entry("PAGADO", "Pagado"),
            Map.entry("RECHAZADO", "Rechazado"),
            Map.entry("DESISTIDO", "Desistido"),
            Map.entry("FALTAN_REPUESTOS", "Faltan repuestos"),
            Map.entry("DAR_TURNO", "Dar turno"),
            Map.entry("CON_TURNO", "Con turno"),
            Map.entry("DEBE_REINGRESAR", "Debe reingresar"),
            Map.entry("REPARADO", "Reparado"),
            Map.entry("NO_DEBE_REPARARSE", "No debe repararse")
    );

    private final CaseTypeRepository caseTypeRepository;
    private final InsuranceProcessingRepository insuranceProcessingRepository;
    private final CaseFranchiseRepository caseFranchiseRepository;
    private final CaseThirdPartyRepository caseThirdPartyRepository;
    private final CaseLegalRepository caseLegalRepository;
    private final RepairAppointmentRepository repairAppointmentRepository;
    private final VehicleIntakeRepository vehicleIntakeRepository;
    private final VehicleOutcomeRepository vehicleOutcomeRepository;
    private final CasePartRepository casePartRepository;
    private final FinancialMovementRepository financialMovementRepository;
    private final IssuedReceiptRepository issuedReceiptRepository;

    public CaseVisibleStateResolver(
            CaseTypeRepository caseTypeRepository,
            InsuranceProcessingRepository insuranceProcessingRepository,
            CaseFranchiseRepository caseFranchiseRepository,
            CaseThirdPartyRepository caseThirdPartyRepository,
            CaseLegalRepository caseLegalRepository,
            RepairAppointmentRepository repairAppointmentRepository,
            VehicleIntakeRepository vehicleIntakeRepository,
            VehicleOutcomeRepository vehicleOutcomeRepository,
            CasePartRepository casePartRepository,
            FinancialMovementRepository financialMovementRepository,
            IssuedReceiptRepository issuedReceiptRepository
    ) {
        this.caseTypeRepository = caseTypeRepository;
        this.insuranceProcessingRepository = insuranceProcessingRepository;
        this.caseFranchiseRepository = caseFranchiseRepository;
        this.caseThirdPartyRepository = caseThirdPartyRepository;
        this.caseLegalRepository = caseLegalRepository;
        this.repairAppointmentRepository = repairAppointmentRepository;
        this.vehicleIntakeRepository = vehicleIntakeRepository;
        this.vehicleOutcomeRepository = vehicleOutcomeRepository;
        this.casePartRepository = casePartRepository;
        this.financialMovementRepository = financialMovementRepository;
        this.issuedReceiptRepository = issuedReceiptRepository;
    }

    public Map<String, CaseVisibleStateResponse> resolveForCase(CaseEntity caseEntity) {
        CaseTypeEntity caseType = caseTypeRepository.findById(caseEntity.getCaseTypeId())
                .orElseThrow(() -> new ConflictException("No existe el tipo de tramite " + caseEntity.getCaseTypeId()));

        Optional<InsuranceProcessingEntity> insuranceProcessing = insuranceProcessingRepository.findByCaseId(caseEntity.getId());
        Optional<CaseFranchiseEntity> franchise = caseFranchiseRepository.findByCaseId(caseEntity.getId());
        Optional<CaseThirdPartyEntity> thirdParty = caseThirdPartyRepository.findByCaseId(caseEntity.getId());
        Optional<CaseLegalEntity> legal = caseLegalRepository.findByCaseId(caseEntity.getId());
        List<RepairAppointmentEntity> appointments = repairAppointmentRepository.findByCaseId(caseEntity.getId(), REPAIR_APPOINTMENT_SORT);
        List<VehicleIntakeEntity> intakes = vehicleIntakeRepository.findByCaseId(caseEntity.getId(), VEHICLE_INTAKE_SORT);
        List<VehicleOutcomeEntity> outcomes = vehicleOutcomeRepository.findByCaseId(caseEntity.getId(), VEHICLE_OUTCOME_SORT);
        List<CasePartEntity> parts = casePartRepository.findByCaseIdOrderByIdAsc(caseEntity.getId());
        boolean hasFinancialMovements = !financialMovementRepository.findByCaseId(caseEntity.getId(), FINANCE_SORT).isEmpty();
        boolean hasReceipts = !issuedReceiptRepository.findByCaseId(caseEntity.getId(), FINANCE_SORT).isEmpty();

        String automaticTramiteCode = resolveAutomaticTramiteCode(caseType, insuranceProcessing.orElse(null), thirdParty.orElse(null), legal.orElse(null), hasFinancialMovements, hasReceipts);
        String automaticRepairCode = resolveAutomaticRepairCode(insuranceProcessing.orElse(null), outcomes, intakes, appointments, parts);

        Map<String, CaseVisibleStateResponse> result = new LinkedHashMap<>();
        result.put(DOMAIN_TRAMITE, buildVisibleState(DOMAIN_TRAMITE, automaticTramiteCode, normalizeCode(caseEntity.getVisibleCaseStateOverrideCode())));
        result.put(DOMAIN_REPARACION, buildVisibleState(DOMAIN_REPARACION, automaticRepairCode, normalizeCode(caseEntity.getVisibleRepairStateOverrideCode())));
        return result;
    }

    public void validateOverrideCode(String domain, String stateCode) {
        String normalizedDomain = normalizeDomain(domain);
        String normalizedCode = normalizeCode(stateCode);
        if (normalizedCode == null) {
            return;
        }
        boolean valid = DOMAIN_TRAMITE.equals(normalizedDomain)
                ? TRAMITE_VISIBLE_CODES.contains(normalizedCode)
                : REPARACION_VISIBLE_CODES.contains(normalizedCode);
        if (!valid) {
            throw new ConflictException("El estado visible no es valido para " + normalizedDomain + ": " + stateCode);
        }
    }

    public String getLabel(String code) {
        String normalized = normalizeCode(code);
        if (normalized == null) {
            return "Sin dato";
        }
        return LABELS.getOrDefault(normalized, normalized.replace('_', ' ').toLowerCase(Locale.ROOT));
    }

    public String normalizeDomain(String domain) {
        String normalized = normalizeCode(domain);
        if (!DOMAIN_TRAMITE.equalsIgnoreCase(normalized) && !DOMAIN_REPARACION.equalsIgnoreCase(normalized)) {
            throw new ConflictException("Dominio visible no soportado: " + domain);
        }
        return normalized.toLowerCase(Locale.ROOT);
    }

    public String normalizeCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        return code.trim().toUpperCase(Locale.ROOT);
    }

    private CaseVisibleStateResponse buildVisibleState(String domain, String automaticCode, String overrideCode) {
        String effectiveCode = overrideCode != null ? overrideCode : automaticCode;
        return new CaseVisibleStateResponse(
                domain,
                effectiveCode,
                getLabel(effectiveCode),
                overrideCode != null ? "manual" : "automatic",
                overrideCode != null
        );
    }

    private String resolveAutomaticTramiteCode(
            CaseTypeEntity caseType,
            InsuranceProcessingEntity insuranceProcessing,
            CaseThirdPartyEntity thirdParty,
            CaseLegalEntity legal,
            boolean hasFinancialMovements,
            boolean hasReceipts
    ) {
        if (legal != null && "DESISTIMIENTO".equals(normalizeCode(legal.getClosedByCode()))) {
            return "DESISTIDO";
        }

        if (insuranceProcessing != null) {
            String opinionCode = normalizeCode(insuranceProcessing.getOpinionCode());
            String quotationStatusCode = normalizeCode(insuranceProcessing.getQuotationStatusCode());
            if ("RECHAZADO".equals(opinionCode) || "RECHAZADA".equals(quotationStatusCode)) {
                return "RECHAZADO";
            }
        }

        if (thirdParty != null && "RECHAZADA".equals(normalizeCode(thirdParty.getDocumentationStatusCode()))) {
            return "RECHAZADO";
        }

        if (hasReceipts) {
            return "PAGADO";
        }

        if (hasFinancialMovements) {
            return "PASADO_A_PAGOS";
        }

        if (insuranceProcessing != null) {
            if (hasPositiveAmount(insuranceProcessing.getAgreedAmount()) || "ACEPTADA".equals(normalizeCode(insuranceProcessing.getQuotationStatusCode()))) {
                return "ACORDADO";
            }
            if (insuranceProcessing.getPresentedAt() != null) {
                if (insuranceProcessing.getInspectionForwardedAt() != null || "ENVIADA".equals(normalizeCode(insuranceProcessing.getQuotationStatusCode()))) {
                    return "EN_TRAMITE";
                }
                return "PRESENTADO";
            }
        }

        if (thirdParty != null) {
            String documentationStatusCode = normalizeCode(thirdParty.getDocumentationStatusCode());
            if (thirdParty.getDocumentationAccepted() == Boolean.TRUE || "ACEPTADA".equals(documentationStatusCode) || "EN_REVISION".equals(documentationStatusCode)) {
                return "EN_TRAMITE";
            }
            if (thirdParty.getClaimReference() != null && !thirdParty.getClaimReference().isBlank()) {
                return "PRESENTADO";
            }
        }

        if (legal != null && (legal.getEntryDate() != null || hasText(legal.getCaseNumber()) || hasText(legal.getCuij()))) {
            return caseType.getRequiresLawyer() ? "EN_TRAMITE" : "PRESENTADO";
        }

        return "SIN_PRESENTAR";
    }

    private String resolveAutomaticRepairCode(
            InsuranceProcessingEntity insuranceProcessing,
            List<VehicleOutcomeEntity> outcomes,
            List<VehicleIntakeEntity> intakes,
            List<RepairAppointmentEntity> appointments,
            List<CasePartEntity> parts
    ) {
        if (insuranceProcessing != null && Boolean.TRUE.equals(insuranceProcessing.getNoRepair())) {
            return "NO_DEBE_REPARARSE";
        }

        VehicleOutcomeEntity latestOutcome = outcomes.isEmpty() ? null : outcomes.get(0);
        if (latestOutcome != null) {
            if (Boolean.TRUE.equals(latestOutcome.getDefinitive())) {
                return "REPARADO";
            }
            if (Boolean.TRUE.equals(latestOutcome.getShouldReenter()) || latestOutcome.getReentryAppointmentId() != null || hasText(latestOutcome.getReentryStatusCode())) {
                return "DEBE_REINGRESAR";
            }
        }

        if (!intakes.isEmpty()) {
            return "EN_TRAMITE";
        }

        RepairAppointmentEntity latestAppointment = appointments.isEmpty() ? null : appointments.get(0);
        if (latestAppointment != null && !"CANCELADO".equals(normalizeCode(latestAppointment.getStatusCode()))) {
            return "CON_TURNO";
        }

        boolean hasPendingAuthorizedParts = parts.stream().anyMatch(part ->
                "AUTORIZADO".equals(normalizeCode(part.getAuthorizedCode()))
                        && !"RECIBIDO".equals(normalizeCode(part.getStatusCode()))
        );
        if (hasPendingAuthorizedParts) {
            return "FALTAN_REPUESTOS";
        }

        if (insuranceProcessing != null && (hasPositiveAmount(insuranceProcessing.getAgreedAmount()) || "ACEPTADA".equals(normalizeCode(insuranceProcessing.getQuotationStatusCode())))) {
            return "DAR_TURNO";
        }

        return "EN_TRAMITE";
    }

    private boolean hasPositiveAmount(BigDecimal value) {
        return value != null && value.compareTo(BigDecimal.ZERO) > 0;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
