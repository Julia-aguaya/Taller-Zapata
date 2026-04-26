package com.tallerzapata.backend.infrastructure.persistence.operation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "ingreso_items")
public class VehicleIntakeItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ingreso_id", nullable = false)
    private Long intakeId;

    @Column(name = "tipo_item_codigo", nullable = false)
    private String itemTypeCode;

    @Column(name = "detalle", nullable = false)
    private String detail;

    @Column(name = "estado_codigo", nullable = false)
    private String statusCode;

    @Column(name = "referencia_media")
    private String mediaReference;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public Long getIntakeId() { return intakeId; }
    public void setIntakeId(Long intakeId) { this.intakeId = intakeId; }
    public String getItemTypeCode() { return itemTypeCode; }
    public void setItemTypeCode(String itemTypeCode) { this.itemTypeCode = itemTypeCode; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
    public String getStatusCode() { return statusCode; }
    public void setStatusCode(String statusCode) { this.statusCode = statusCode; }
    public String getMediaReference() { return mediaReference; }
    public void setMediaReference(String mediaReference) { this.mediaReference = mediaReference; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
