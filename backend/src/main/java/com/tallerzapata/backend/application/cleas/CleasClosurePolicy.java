package com.tallerzapata.backend.application.cleas;

import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseCleasEntity;
import org.springframework.stereotype.Component;

@Component
public class CleasClosurePolicy {
    public static final String PENDING_OPINION_BLOCK = "No se puede avanzar hasta recibir el dictamen.";
    public static final String ADVERSE_TOTAL_BLOCK = "Esta etapa no está disponible porque el caso CLEAS fue cerrado por dictamen en contra.";

    public boolean blocksDownstream(CaseCleasEntity definition) {
        return definition != null
                && "DANIO_TOTAL".equals(definition.getScopeCode())
                && ("PENDIENTE".equals(definition.getOpinionCode()) || "EN_CONTRA".equals(definition.getOpinionCode()));
    }

    public String downstreamBlockingReason(CaseCleasEntity definition) {
        return "EN_CONTRA".equals(definition == null ? null : definition.getOpinionCode())
                ? ADVERSE_TOTAL_BLOCK
                : PENDING_OPINION_BLOCK;
    }

    public void requireAdverseTotal(CaseCleasEntity definition) {
        if (definition == null || !"DANIO_TOTAL".equals(definition.getScopeCode()) || !"EN_CONTRA".equals(definition.getOpinionCode())) {
            throw new ConflictException("Solo se puede cerrar un CLEAS sobre dano total con dictamen EN_CONTRA");
        }
    }
}
