package com.tallerzapata.backend.infrastructure.persistence.budget;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "comparacion_precio")
public class BudgetComparisonPriceEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "pieza_id", nullable = false, updatable = false) private Long pieceId;
    @Column(name = "comparacion_proveedor_id", nullable = false, updatable = false) private Long providerColumnId;
    @Column(name = "importe", nullable = false) private BigDecimal amount;
    public Long getId() { return id; } public Long getPieceId() { return pieceId; } public void setPieceId(Long value) { pieceId = value; }
    public Long getProviderColumnId() { return providerColumnId; } public void setProviderColumnId(Long value) { providerColumnId = value; }
    public BigDecimal getAmount() { return amount; } public void setAmount(BigDecimal value) { amount = value; }
}
