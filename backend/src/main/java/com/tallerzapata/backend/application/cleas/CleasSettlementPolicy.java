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
        String opinionCode = cleas == null ? null : cleas.getOpinionCode();

        if ("DANIO_TOTAL".equals(scopeCode)) {
            // Daño total: no hay franquicia; se factura a la compañía el total acordado.
            return new CleasSettlement(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, amount);
        }

        if ("FRANQUICIA".equals(scopeCode)) {
            BigDecimal franchise = money(cleas.getFranchiseAmount());
            BigDecimal companyRequired = money(cleas.getCompanyFranchisePaymentAmount());

            if ("A_FAVOR".equals(opinionCode)) {
                // El cliente NO paga la franquicia: la cía del tercero la compensa.
                // A facturar a la cía = monto de cotización acordado.
                return new CleasSettlement(franchise, BigDecimal.ZERO, BigDecimal.ZERO, amount);
            }
            if ("EN_CONTRA".equals(opinionCode)) {
                // El cliente paga la franquicia.
                // A cargo del cliente (al taller) = franquicia - parte exigida por la cía.
                // A facturar a la cía = cotización - cargo del cliente.
                BigDecimal franchiseBalance = franchise.subtract(companyRequired).max(BigDecimal.ZERO);
                BigDecimal amountToBill = amount.subtract(franchiseBalance).max(BigDecimal.ZERO);
                // Si la cotización es menor que la franquicia pendiente, el cliente nunca
                // puede deber más que la reparación cotizada.
                BigDecimal customerCharge = amount.subtract(amountToBill);
                return new CleasSettlement(franchise, companyRequired, customerCharge, amountToBill);
            }
            throw new ConflictException("La liquidación CLEAS sobre franquicia con dictamen " + opinionCode + " aún no está definida");
        }

        // Alcances nuevos se incorporan en una fase posterior.
        throw new ConflictException("La liquidación CLEAS sobre " + (scopeCode == null ? "un alcance sin definir" : scopeCode) + " aún no está habilitada");
    }

    private BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }
}
