package com.tallerzapata.backend.infrastructure.persistence.operation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "egresos_vehiculo")
public class VehicleOutcomeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false, columnDefinition = "char(36)")
    private String publicId;

    @Column(name = "caso_id", nullable = false)
    private Long caseId;

    @Column(name = "ingreso_id", nullable = false)
    private Long intakeId;

    @Column(name = "turno_reingreso_id")
    private Long reentryAppointmentId;

    @Column(name = "fecha_egreso", nullable = false)
    private LocalDateTime outcomeAt;

    @Column(name = "entregado_por_usuario_id", nullable = false)
    private Long deliveredByUserId;

    @Column(name = "persona_recibe_id")
    private Long receivedByPersonId;

    @Column(name = "egreso_definitivo", nullable = false)
    private Boolean definitive;

    @Column(name = "debe_reingresar", nullable = false)
    private Boolean shouldReenter;

    @Column(name = "fecha_reingreso_prevista")
    private LocalDate expectedReentryDate;

    @Column(name = "dias_estimados_reingreso")
    private Integer estimatedReentryDays;

    @Column(name = "estado_reingreso_codigo")
    private String reentryStatusCode;

    @Column(name = "fotos_reparado_cargadas", nullable = false)
    private Boolean repairedPhotosUploaded;

    @Column(name = "notas")
    private String notes;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        if (publicId == null) {
            publicId = UUID.randomUUID().toString();
        }
        if (definitive == null) {
            definitive = false;
        }
        if (shouldReenter == null) {
            shouldReenter = false;
        }
        if (repairedPhotosUploaded == null) {
            repairedPhotosUploaded = false;
        }
    }

    public Long getId() { return id; }
    public String getPublicId() { return publicId; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public Long getIntakeId() { return intakeId; }
    public void setIntakeId(Long intakeId) { this.intakeId = intakeId; }
    public Long getReentryAppointmentId() { return reentryAppointmentId; }
    public void setReentryAppointmentId(Long reentryAppointmentId) { this.reentryAppointmentId = reentryAppointmentId; }
    public LocalDateTime getOutcomeAt() { return outcomeAt; }
    public void setOutcomeAt(LocalDateTime outcomeAt) { this.outcomeAt = outcomeAt; }
    public Long getDeliveredByUserId() { return deliveredByUserId; }
    public void setDeliveredByUserId(Long deliveredByUserId) { this.deliveredByUserId = deliveredByUserId; }
    public Long getReceivedByPersonId() { return receivedByPersonId; }
    public void setReceivedByPersonId(Long receivedByPersonId) { this.receivedByPersonId = receivedByPersonId; }
    public Boolean getDefinitive() { return definitive; }
    public void setDefinitive(Boolean definitive) { this.definitive = definitive; }
    public Boolean getShouldReenter() { return shouldReenter; }
    public void setShouldReenter(Boolean shouldReenter) { this.shouldReenter = shouldReenter; }
    public LocalDate getExpectedReentryDate() { return expectedReentryDate; }
    public void setExpectedReentryDate(LocalDate expectedReentryDate) { this.expectedReentryDate = expectedReentryDate; }
    public Integer getEstimatedReentryDays() { return estimatedReentryDays; }
    public void setEstimatedReentryDays(Integer estimatedReentryDays) { this.estimatedReentryDays = estimatedReentryDays; }
    public String getReentryStatusCode() { return reentryStatusCode; }
    public void setReentryStatusCode(String reentryStatusCode) { this.reentryStatusCode = reentryStatusCode; }
    public Boolean getRepairedPhotosUploaded() { return repairedPhotosUploaded; }
    public void setRepairedPhotosUploaded(Boolean repairedPhotosUploaded) { this.repairedPhotosUploaded = repairedPhotosUploaded; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
