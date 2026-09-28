package com.tallerzapata.backend.infrastructure.persistence.insurance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.LocalDateTime;

@Entity
@Table(name = "caso_terceros_retenciones")
public class ThirdPartyWorkshopRetentionPlanEntity {
    @Id @Column(name = "caso_id") private Long caseId;
    @Version @Column(name = "version_lock", nullable = false) private Long version;
    @Column(name = "actualizado_en", nullable = false) private LocalDateTime updatedAt;
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public Long getVersion() { return version; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
