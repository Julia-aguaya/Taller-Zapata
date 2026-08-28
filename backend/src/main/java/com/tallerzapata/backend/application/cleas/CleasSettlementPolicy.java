package com.tallerzapata.backend.application.cleas;

import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseCleasEntity;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Política de liquidación CLEAS: decide el reparto económico del trámite
 * (franquicia, cargo del cliente y monto a facturar a la compañía).
 *
 * <p>Concentra aquí la fórmula de negocio para que el resto del backend (pagos,
 * resúmenes y PDF) consuma un único cálculo en lugar de duplicarlo.</p>
 */
@Component
public class CleasSettlementPolicy {

    /**
     * Calcula la liquidación canónica a partir de la definición CLEAS persistida
     * y del monto de cotización acordado con la compañía.
     */
    public CleasSettlement settle(CaseCleasEntity cleas, BigDecimal agreedAmount) {
        BigDecimal amount = money(agreedAmount);
        String scopeCode = cleas == null ? null : cleas.getScopeCode();

        if ("DANIO_TOTAL".equals(scopeCode)) {
            // Daño total: no hay franquicia; se factura a la compañía el total acordado.
            return new CleasSettlement(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, amount);
        }

        // FRANQUICIA (y cualquier alcance nuevo) se incorpora en una fase posterior.
        throw new ConflictException("La liquidación CLEAS sobre " + (scopeCode == null ? "un alcance sin definir" : scopeCode) + " aún no está habilitada");
    }

    private BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }
}
