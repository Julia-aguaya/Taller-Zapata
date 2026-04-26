package com.tallerzapata.backend.infrastructure.persistence.insurance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "companias_seguro")
public class InsuranceCompanyEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "public_id", nullable = false, updatable = false, columnDefinition = "char(36)") private String publicId;
    @Column(name = "codigo", nullable = false) private String code;
    @Column(name = "nombre", nullable = false) private String name;
    @Column(name = "cuit") private String taxId;
    @Column(name = "requiere_fotos_reparado", nullable = false) private Boolean requiresRepairPhotos;
    @Column(name = "dias_pago_esperados") private Integer expectedPaymentDays;
    @Column(name = "activo", nullable = false) private Boolean active;
    @PrePersist void prePersist() { if (publicId == null) publicId = UUID.randomUUID().toString(); if (active == null) active = true; if (requiresRepairPhotos == null) requiresRepairPhotos = false; }
    public Long getId() { return id; }
    public String getPublicId() { return publicId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTaxId() { return taxId; }
    public void setTaxId(String taxId) { this.taxId = taxId; }
    public Boolean getRequiresRepairPhotos() { return requiresRepairPhotos; }
    public void setRequiresRepairPhotos(Boolean requiresRepairPhotos) { this.requiresRepairPhotos = requiresRepairPhotos; }
    public Integer getExpectedPaymentDays() { return expectedPaymentDays; }
    public void setExpectedPaymentDays(Integer expectedPaymentDays) { this.expectedPaymentDays = expectedPaymentDays; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
