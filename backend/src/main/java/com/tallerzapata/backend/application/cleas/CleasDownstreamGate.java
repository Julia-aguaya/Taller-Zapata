package com.tallerzapata.backend.application.cleas;

import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseCleasRepository;
import org.springframework.stereotype.Component;

@Component
public class CleasDownstreamGate {
    private final CaseTypeRepository caseTypeRepository;
    private final CaseCleasRepository caseCleasRepository;
    private final CleasClosurePolicy cleasClosurePolicy;

    public CleasDownstreamGate(CaseTypeRepository caseTypeRepository, CaseCleasRepository caseCleasRepository, CleasClosurePolicy cleasClosurePolicy) {
        this.caseTypeRepository = caseTypeRepository;
        this.caseCleasRepository = caseCleasRepository;
        this.cleasClosurePolicy = cleasClosurePolicy;
    }

    public void requireAllowed(CaseEntity caseEntity) {
        boolean isCleas = caseTypeRepository.findById(caseEntity.getCaseTypeId())
                .map(type -> "CLEAS".equals(type.getCode()))
                .orElse(false);
        if (!isCleas) return;

        var definition = caseCleasRepository.findByCaseId(caseEntity.getId()).orElse(null);
        if (cleasClosurePolicy.blocksDownstream(definition)) {
            throw new ConflictException(cleasClosurePolicy.downstreamBlockingReason(definition));
        }
    }
}
