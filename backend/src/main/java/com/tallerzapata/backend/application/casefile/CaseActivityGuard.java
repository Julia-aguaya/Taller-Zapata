package com.tallerzapata.backend.application.casefile;

import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentRelationRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseFranchiseRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseLegalRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseThirdPartyRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceProcessingRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentRepository;
import com.tallerzapata.backend.infrastructure.persistence.recovery.FranchiseRecoveryRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

/**
 * Determina si una carpeta esta "virgen", es decir, recien creada y sin datos cargados.
 * Es la unica situacion donde tiene sentido eliminar fisicamente una carpeta o cambiar su tipo de tramite.
 */
@Component
public class CaseActivityGuard {

    private final BudgetRepository budgetRepository;
    private final CasePartRepository casePartRepository;
    private final DocumentRelationRepository documentRelationRepository;
    private final FinancialMovementRepository financialMovementRepository;
    private final RepairAppointmentRepository repairAppointmentRepository;
    private final InsuranceProcessingRepository insuranceProcessingRepository;
    private final CaseLegalRepository caseLegalRepository;
    private final CaseThirdPartyRepository caseThirdPartyRepository;
    private final CaseFranchiseRepository caseFranchiseRepository;
    private final FranchiseRecoveryRepository franchiseRecoveryRepository;

    public CaseActivityGuard(
            BudgetRepository budgetRepository,
            CasePartRepository casePartRepository,
            DocumentRelationRepository documentRelationRepository,
            FinancialMovementRepository financialMovementRepository,
            RepairAppointmentRepository repairAppointmentRepository,
            InsuranceProcessingRepository insuranceProcessingRepository,
            CaseLegalRepository caseLegalRepository,
            CaseThirdPartyRepository caseThirdPartyRepository,
            CaseFranchiseRepository caseFranchiseRepository,
            FranchiseRecoveryRepository franchiseRecoveryRepository
    ) {
        this.budgetRepository = budgetRepository;
        this.casePartRepository = casePartRepository;
        this.documentRelationRepository = documentRelationRepository;
        this.financialMovementRepository = financialMovementRepository;
        this.repairAppointmentRepository = repairAppointmentRepository;
        this.insuranceProcessingRepository = insuranceProcessingRepository;
        this.caseLegalRepository = caseLegalRepository;
        this.caseThirdPartyRepository = caseThirdPartyRepository;
        this.caseFranchiseRepository = caseFranchiseRepository;
        this.franchiseRecoveryRepository = franchiseRecoveryRepository;
    }

    /**
     * Lanza ConflictException si la carpeta ya tiene actividad real (datos cargados).
     *
     * @param caseEntity         la carpeta a evaluar
     * @param actionDescription  verbo para el mensaje de error, ej. "eliminar" o "cambiar el tipo de"
     */
    public void requireVirgin(CaseEntity caseEntity, String actionDescription) {
        Long caseId = caseEntity.getId();
        if (budgetRepository.findByCaseId(caseId).isPresent()) block(actionDescription, "presupuesto");
        if (!casePartRepository.findByCaseIdOrderByIdAsc(caseId).isEmpty()) block(actionDescription, "repuestos");
        if (!documentRelationRepository.findByCaseIdOrderByVisualOrderAscIdAsc(caseId).isEmpty()) block(actionDescription, "documentos");
        if (!financialMovementRepository.findByCaseId(caseId, Sort.unsorted()).isEmpty()) block(actionDescription, "movimientos financieros");
        if (!repairAppointmentRepository.findByCaseId(caseId, Sort.unsorted()).isEmpty()) block(actionDescription, "turnos");
        if (insuranceProcessingRepository.findByCaseId(caseId).isPresent()) block(actionDescription, "tramitacion de seguro");
        if (caseLegalRepository.findByCaseId(caseId).isPresent()) block(actionDescription, "gestion legal");
        if (caseThirdPartyRepository.findByCaseId(caseId).isPresent()) block(actionDescription, "datos de terceros");
        if (caseFranchiseRepository.findByCaseId(caseId).isPresent()) block(actionDescription, "franquicia");
        if (franchiseRecoveryRepository.findByCaseId(caseId).isPresent()) block(actionDescription, "recupero de franquicia");
    }

    private void block(String actionDescription, String what) {
        throw new ConflictException("No se puede " + actionDescription + " la carpeta porque ya tiene " + what);
    }
}
