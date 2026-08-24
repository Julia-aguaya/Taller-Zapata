package com.tallerzapata.backend.infrastructure.persistence.budget;

import jakarta.persistence.*;

@Entity
@Table(name = "comparacion_proveedor")
public class BudgetComparisonProviderEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "snapshot_id", nullable = false, updatable = false) private Long snapshotId;
    @Column(name = "proveedor_id", nullable = false, updatable = false) private Long providerId;
    @Column(name = "proveedor_snapshot", nullable = false, updatable = false) private String providerSnapshot;
    @Column(name = "facturacion_codigo", nullable = false) private String billingCode;
    @Column(name = "medio_pago_codigo", nullable = false) private String paymentMethodCode;
    public Long getId() { return id; } public Long getSnapshotId() { return snapshotId; } public void setSnapshotId(Long value) { snapshotId = value; }
    public Long getProviderId() { return providerId; } public void setProviderId(Long value) { providerId = value; }
    public String getProviderSnapshot() { return providerSnapshot; } public void setProviderSnapshot(String value) { providerSnapshot = value; }
    public String getBillingCode() { return billingCode; } public void setBillingCode(String value) { billingCode = value; }
    public String getPaymentMethodCode() { return paymentMethodCode; } public void setPaymentMethodCode(String value) { paymentMethodCode = value; }
}
