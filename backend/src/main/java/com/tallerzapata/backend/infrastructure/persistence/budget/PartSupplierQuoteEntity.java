package com.tallerzapata.backend.infrastructure.persistence.budget;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "cotizaciones_repuesto")
public class PartSupplierQuoteEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "repuesto_id", nullable = false) private Long partId;
    @Column(name = "proveedor", nullable = false) private String supplier;
    @Column(name = "proveedor_id") private Long providerId;
    @Column(name = "importe", nullable = false) private BigDecimal amount;
    @Column(name = "facturacion_codigo", nullable = false) private String billingCode;
    @Column(name = "medio_pago_codigo", nullable = false) private String paymentMethodCode;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPartId() { return partId; }
    public void setPartId(Long partId) { this.partId = partId; }
    public String getSupplier() { return supplier; }
    public void setSupplier(String supplier) { this.supplier = supplier; }
    public Long getProviderId() { return providerId; }
    public void setProviderId(Long providerId) { this.providerId = providerId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getBillingCode() { return billingCode; }
    public void setBillingCode(String billingCode) { this.billingCode = billingCode; }
    public String getPaymentMethodCode() { return paymentMethodCode; }
    public void setPaymentMethodCode(String paymentMethodCode) { this.paymentMethodCode = paymentMethodCode; }
}
