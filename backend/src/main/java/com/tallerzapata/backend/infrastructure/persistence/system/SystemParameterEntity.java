package com.tallerzapata.backend.infrastructure.persistence.system;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "parametros_sistema")
public class SystemParameterEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo", nullable = false, unique = true)
    private String code;

    @Column(name = "valor", nullable = false, columnDefinition = "TEXT")
    private String value;

    @Column(name = "tipo_dato_codigo", nullable = false)
    private String dataTypeCode;

    @Column(name = "descripcion")
    private String description;

    @Column(name = "editable", nullable = false)
    private Boolean editable;

    @Column(name = "visible", nullable = false)
    private Boolean visible;

    @Column(name = "modulo_codigo", nullable = false)
    private String moduleCode;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (editable == null) editable = true;
        if (visible == null) visible = true;
        if (moduleCode == null) moduleCode = "GENERAL";
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public String getDataTypeCode() { return dataTypeCode; }
    public void setDataTypeCode(String dataTypeCode) { this.dataTypeCode = dataTypeCode; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getEditable() { return editable; }
    public void setEditable(Boolean editable) { this.editable = editable; }
    public Boolean getVisible() { return visible; }
    public void setVisible(Boolean visible) { this.visible = visible; }
    public String getModuleCode() { return moduleCode; }
    public void setModuleCode(String moduleCode) { this.moduleCode = moduleCode; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
