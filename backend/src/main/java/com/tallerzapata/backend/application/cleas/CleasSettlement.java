package com.tallerzapata.backend.application.cleas;

import java.math.BigDecimal;

/**
 * Resultado inmutable de la liquidación canónica de un trámite CLEAS.
 *
 * <p>Es la única fuente de verdad del reparto económico del trámite. El frontend
 * no debe recalcular estos importes: los consume desde el backend.</p>
 *
 * @param franchiseAmount       monto de franquicia a cargo del cliente (0 para daño total)
 * @param companyRequiredAmount parte de la franquicia que la compañía le exige al cliente
 * @param customerChargeAmount  monto final a cargo del cliente
 * @param amountToBillCompany   monto a facturar a la compañía
 */
public record CleasSettlement(
        BigDecimal franchiseAmount,
        BigDecimal companyRequiredAmount,
        BigDecimal customerChargeAmount,
        BigDecimal amountToBillCompany
) {
}
