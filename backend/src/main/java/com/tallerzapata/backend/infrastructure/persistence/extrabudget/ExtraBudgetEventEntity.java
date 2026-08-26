package com.tallerzapata.backend.infrastructure.persistence.extrabudget;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "presupuesto_extra_eventos")
public class ExtraBudgetEventEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "presupuesto_extra_id", nullable = false) private Long extraBudgetId;
    @Column(name = "presupuesto_extra_version_id") private Long extraBudgetVersionId;
    @Column(name = "transicion", nullable = false) private String transition;
    @Column(name = "actor_id") private Long actorId;
    @Column(name = "metadata_json") private String metadataJson;
    @Column(name = "created_at", insertable = false, updatable = false) private LocalDateTime createdAt;

    public Long getId() { return id; }
    public Long getExtraBudgetId() { return extraBudgetId; }
    public void setExtraBudgetId(Long extraBudgetId) { this.extraBudgetId = extraBudgetId; }
    public Long getExtraBudgetVersionId() { return extraBudgetVersionId; }
    public void setExtraBudgetVersionId(Long extraBudgetVersionId) { this.extraBudgetVersionId = extraBudgetVersionId; }
    public String getTransition() { return transition; }
    public void setTransition(String transition) { this.transition = transition; }
    public Long getActorId() { return actorId; }
    public void setActorId(Long actorId) { this.actorId = actorId; }
    public String getMetadataJson() { return metadataJson; }
    public void setMetadataJson(String metadataJson) { this.metadataJson = metadataJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
