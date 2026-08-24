package com.tallerzapata.backend.infrastructure.persistence.budget;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "repuestos_caso_reconciliation_warnings")
public class CasePartReconciliationWarningEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_id", nullable = false) private Long caseId;
    @Column(name = "repuesto_id", nullable = false) private Long partId;
    @Enumerated(EnumType.STRING) @Column(name = "source_type", nullable = false) private CasePartSourceType sourceType;
    @Column(name = "source_id", nullable = false) private Long sourceId;
    @Column(name = "reason", nullable = false) private String reason;
    @Column(name = "state", nullable = false) private String state;
    @Column(name = "resolution") private String resolution;
    @Column(name = "created_at", insertable = false, updatable = false) private LocalDateTime createdAt;
    @Column(name = "resolved_at") private LocalDateTime resolvedAt;
    @Column(name = "resolved_by") private Long resolvedBy;
    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public Long getPartId() { return partId; }
    public CasePartSourceType getSourceType() { return sourceType; }
    public Long getSourceId() { return sourceId; }
    public String getReason() { return reason; }
    public String getState() { return state; }
    public String getResolution() { return resolution; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public void setPartId(Long partId) { this.partId = partId; }
    public void setSourceType(CasePartSourceType sourceType) { this.sourceType = sourceType; }
    public void setSourceId(Long sourceId) { this.sourceId = sourceId; }
    public void setReason(String reason) { this.reason = reason; }
    public void setState(String state) { this.state = state; }
    public void setResolution(String resolution) { this.resolution = resolution; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
    public void setResolvedBy(Long resolvedBy) { this.resolvedBy = resolvedBy; }
}
