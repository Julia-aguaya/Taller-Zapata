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
@Table(name = "ingresos_vehiculo")
public class VehicleIntakeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false, columnDefinition = "char(36)")
    private String publicId;

    @Column(name = "caso_id", nullable = false)
    private Long caseId;

    @Column(name = "turno_id")
    private Long appointmentId;

    @Column(name = "vehiculo_id", nullable = false)
    private Long vehicleId;

    @Column(name = "fecha_ingreso", nullable = false)
    private LocalDateTime intakeAt;

    @Column(name = "recibido_por_usuario_id", nullable = false)
    private Long receivedByUserId;

    @Column(name = "persona_entrega_id")
    private Long deliveredByPersonId;

    @Column(name = "kilometraje_ingreso")
    private Integer mileage;

    @Column(name = "combustible_codigo")
    private String fuelCode;

    @Column(name = "fecha_salida_estimada")
    private LocalDate estimatedExitDate;

    @Column(name = "con_observaciones", nullable = false)
    private Boolean hasObservations;

    @Column(name = "detalle_observaciones")
    private String observationDetail;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        if (publicId == null) {
            publicId = UUID.randomUUID().toString();
        }
        if (hasObservations == null) {
            hasObservations = false;
        }
    }

    public Long getId() { return id; }
    public String getPublicId() { return publicId; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public Long getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }
    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }
    public LocalDateTime getIntakeAt() { return intakeAt; }
    public void setIntakeAt(LocalDateTime intakeAt) { this.intakeAt = intakeAt; }
    public Long getReceivedByUserId() { return receivedByUserId; }
    public void setReceivedByUserId(Long receivedByUserId) { this.receivedByUserId = receivedByUserId; }
    public Long getDeliveredByPersonId() { return deliveredByPersonId; }
    public void setDeliveredByPersonId(Long deliveredByPersonId) { this.deliveredByPersonId = deliveredByPersonId; }
    public Integer getMileage() { return mileage; }
    public void setMileage(Integer mileage) { this.mileage = mileage; }
    public String getFuelCode() { return fuelCode; }
    public void setFuelCode(String fuelCode) { this.fuelCode = fuelCode; }
    public LocalDate getEstimatedExitDate() { return estimatedExitDate; }
    public void setEstimatedExitDate(LocalDate estimatedExitDate) { this.estimatedExitDate = estimatedExitDate; }
    public Boolean getHasObservations() { return hasObservations; }
    public void setHasObservations(Boolean hasObservations) { this.hasObservations = hasObservations; }
    public String getObservationDetail() { return observationDetail; }
    public void setObservationDetail(String observationDetail) { this.observationDetail = observationDetail; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
