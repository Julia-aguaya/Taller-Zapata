package com.tallerzapata.backend.infrastructure.persistence.vehicle;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "vehiculos")
public class VehicleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false, columnDefinition = "char(36)")
    private String publicId;

    @Column(name = "marca_id")
    private Long brandId;

    @Column(name = "modelo_id")
    private Long modelId;

    @Column(name = "marca_texto")
    private String brandText;

    @Column(name = "modelo_texto")
    private String modelText;

    @Column(name = "dominio")
    private String plate;

    @Column(name = "dominio_normalizado")
    private String normalizedPlate;

    @Column(name = "anio")
    private Short year;

    @Column(name = "tipo_vehiculo_codigo")
    private String vehicleTypeCode;

    @Column(name = "uso_codigo")
    private String usageCode;

    private String color;

    @Column(name = "pintura_codigo")
    private String paintCode;

    private String chasis;
    private String motor;

    @Column(name = "transmision_codigo")
    private String transmissionCode;

    @Column(name = "kilometraje")
    private Integer mileage;

    private String observaciones;
    private Boolean activo;

    @PrePersist
    void prePersist() {
        if (publicId == null) {
            publicId = UUID.randomUUID().toString();
        }
        if (activo == null) {
            activo = true;
        }
    }

    public Long getId() { return id; }
    public String getPublicId() { return publicId; }
    public void setPublicId(String publicId) { this.publicId = publicId; }
    public Long getBrandId() { return brandId; }
    public void setBrandId(Long brandId) { this.brandId = brandId; }
    public Long getModelId() { return modelId; }
    public void setModelId(Long modelId) { this.modelId = modelId; }
    public String getBrandText() { return brandText; }
    public void setBrandText(String brandText) { this.brandText = brandText; }
    public String getModelText() { return modelText; }
    public void setModelText(String modelText) { this.modelText = modelText; }
    public String getPlate() { return plate; }
    public void setPlate(String plate) { this.plate = plate; }
    public String getNormalizedPlate() { return normalizedPlate; }
    public void setNormalizedPlate(String normalizedPlate) { this.normalizedPlate = normalizedPlate; }
    public Short getYear() { return year; }
    public void setYear(Short year) { this.year = year; }
    public String getVehicleTypeCode() { return vehicleTypeCode; }
    public void setVehicleTypeCode(String vehicleTypeCode) { this.vehicleTypeCode = vehicleTypeCode; }
    public String getUsageCode() { return usageCode; }
    public void setUsageCode(String usageCode) { this.usageCode = usageCode; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getPaintCode() { return paintCode; }
    public void setPaintCode(String paintCode) { this.paintCode = paintCode; }
    public String getChasis() { return chasis; }
    public void setChasis(String chasis) { this.chasis = chasis; }
    public String getMotor() { return motor; }
    public void setMotor(String motor) { this.motor = motor; }
    public String getTransmissionCode() { return transmissionCode; }
    public void setTransmissionCode(String transmissionCode) { this.transmissionCode = transmissionCode; }
    public Integer getMileage() { return mileage; }
    public void setMileage(Integer mileage) { this.mileage = mileage; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
