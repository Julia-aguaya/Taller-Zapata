package com.tallerzapata.backend.infrastructure.persistence.budget;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "comparacion_oferta")
public class BudgetComparisonOfferEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "pieza_id", nullable = false, updatable = false) private Long pieceId;
    @Column(name = "proveedor_id", updatable = false) private Long providerId;
    @Column(name = "proveedor_snapshot", nullable = false, updatable = false) private String providerSnapshot;
    @Column(name = "importe", nullable = false, updatable = false) private BigDecimal amount;
    @Column(name = "medio_pago_codigo", nullable = false, updatable = false) private String paymentMethodCode;
    @Column(name = "facturacion_codigo", nullable = false, updatable = false) private String billingCode;
    public Long getId() { return id; } public Long getPieceId() { return pieceId; } public void setPieceId(Long value) { pieceId = value; }
    public Long getProviderId() { return providerId; } public void setProviderId(Long value) { providerId = value; }
    public String getProviderSnapshot() { return providerSnapshot; } public void setProviderSnapshot(String value) { providerSnapshot = value; }
    public BigDecimal getAmount() { return amount; } public void setAmount(BigDecimal value) { amount = value; }
    public String getPaymentMethodCode() { return paymentMethodCode; } public void setPaymentMethodCode(String value) { paymentMethodCode = value; }
    public String getBillingCode() { return billingCode; } public void setBillingCode(String value) { billingCode = value; }
}
