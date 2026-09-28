package com.tallerzapata.backend.infrastructure.persistence.insurance;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "caso_terceros_retencion_detalle")
public class ThirdPartyWorkshopRetentionEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_id", nullable = false) private Long caseId;
    @Column(name = "tipo_retencion_codigo", nullable = false) private String retentionTypeCode;
    @Column(name = "monto", nullable = false) private BigDecimal amount;
    @Column(name = "detalle") private String detail;
    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public String getRetentionTypeCode() { return retentionTypeCode; }
    public void setRetentionTypeCode(String retentionTypeCode) { this.retentionTypeCode = retentionTypeCode; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
}
