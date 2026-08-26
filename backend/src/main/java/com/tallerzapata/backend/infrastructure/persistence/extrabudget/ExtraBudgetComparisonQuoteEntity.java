package com.tallerzapata.backend.infrastructure.persistence.extrabudget;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "comparacion_presupuesto_extra_cotizaciones")
public class ExtraBudgetComparisonQuoteEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "pieza_id", nullable = false) private Long pieceId;
    @Column(name = "proveedor_id", nullable = false) private Long providerId;
    @Column(name = "proveedor_nombre", nullable = false) private String providerName;
    @Column(name = "importe", nullable = false) private BigDecimal amount;
    @Column(name = "seleccionada", nullable = false) private Boolean selected;
    public Long getId() { return id; }
    public Long getPieceId() { return pieceId; }
    public void setPieceId(Long pieceId) { this.pieceId = pieceId; }
    public Long getProviderId() { return providerId; }
    public void setProviderId(Long providerId) { this.providerId = providerId; }
    public String getProviderName() { return providerName; }
    public void setProviderName(String providerName) { this.providerName = providerName; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public Boolean getSelected() { return selected; }
    public void setSelected(Boolean selected) { this.selected = selected; }
}
