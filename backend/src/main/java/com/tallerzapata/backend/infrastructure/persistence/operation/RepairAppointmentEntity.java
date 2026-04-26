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
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "turnos_reparacion")
public class RepairAppointmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false, columnDefinition = "char(36)")
    private String publicId;

    @Column(name = "caso_id", nullable = false)
    private Long caseId;

    @Column(name = "fecha_turno", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "hora_turno", nullable = false)
    private LocalTime appointmentTime;

    @Column(name = "dias_estimados")
    private Integer estimatedDays;

    @Column(name = "fecha_salida_estimada")
    private LocalDate estimatedExitDate;

    @Column(name = "estado_codigo", nullable = false)
    private String statusCode;

    @Column(name = "es_reingreso", nullable = false)
    private Boolean reentry;

    @Column(name = "notas")
    private String notes;

    @Column(name = "usuario_id", nullable = false)
    private Long userId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        if (publicId == null) {
            publicId = UUID.randomUUID().toString();
        }
        if (reentry == null) {
            reentry = false;
        }
    }

    public Long getId() { return id; }
    public String getPublicId() { return publicId; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public LocalDate getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }
    public LocalTime getAppointmentTime() { return appointmentTime; }
    public void setAppointmentTime(LocalTime appointmentTime) { this.appointmentTime = appointmentTime; }
    public Integer getEstimatedDays() { return estimatedDays; }
    public void setEstimatedDays(Integer estimatedDays) { this.estimatedDays = estimatedDays; }
    public LocalDate getEstimatedExitDate() { return estimatedExitDate; }
    public void setEstimatedExitDate(LocalDate estimatedExitDate) { this.estimatedExitDate = estimatedExitDate; }
    public String getStatusCode() { return statusCode; }
    public void setStatusCode(String statusCode) { this.statusCode = statusCode; }
    public Boolean getReentry() { return reentry; }
    public void setReentry(Boolean reentry) { this.reentry = reentry; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
