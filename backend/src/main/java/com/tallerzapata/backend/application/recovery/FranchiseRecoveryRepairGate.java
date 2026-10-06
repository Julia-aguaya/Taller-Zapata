package com.tallerzapata.backend.application.recovery;

import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.recovery.FranchiseRecoveryEntity;
import com.tallerzapata.backend.infrastructure.persistence.recovery.FranchiseRecoveryRepository;
import org.springframework.stereotype.Component;

/** Keeps repair operations unavailable for a recovery until its operator enables repair. */
@Component
public class FranchiseRecoveryRepairGate {
    private final CaseTypeRepository caseTypeRepository;
    private final FranchiseRecoveryRepository franchiseRecoveryRepository;

    public FranchiseRecoveryRepairGate(CaseTypeRepository caseTypeRepository, FranchiseRecoveryRepository franchiseRecoveryRepository) {
        this.caseTypeRepository = caseTypeRepository;
        this.franchiseRecoveryRepository = franchiseRecoveryRepository;
    }

    public void requireEnabled(CaseEntity caseEntity) {
        boolean recovery = caseTypeRepository.findById(caseEntity.getCaseTypeId())
                .map(type -> "RECUPERO_FRANQUICIA".equals(type.getCode()))
                .orElse(false);
        if (!recovery) return;
        boolean enabled = franchiseRecoveryRepository.findByCaseId(caseEntity.getId())
                .map(FranchiseRecoveryEntity::getEnablesRepair)
                .orElse(false);
        if (!enabled) {
            throw new ConflictException("La reparación, el presupuesto y los pedidos están deshabilitados para este Recupero de Franquicia.");
        }
    }
}
