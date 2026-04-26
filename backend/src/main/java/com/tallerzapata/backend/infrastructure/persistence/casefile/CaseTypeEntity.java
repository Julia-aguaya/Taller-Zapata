package com.tallerzapata.backend.infrastructure.persistence.casefile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "tipos_tramite")
public class CaseTypeEntity {

    @Id
    private Long id;

    @Column(name = "codigo", nullable = false)
    private String code;

    @Column(name = "nombre", nullable = false)
    private String name;

    @Column(name = "prefijo_carpeta")
    private String folderPrefix;

    @Column(name = "orden_visual", nullable = false)
    private Integer visualOrder;

    @Column(name = "requiere_tramitacion", nullable = false)
    private Boolean requiresProcessing;

    @Column(name = "requiere_abogado", nullable = false)
    private Boolean requiresLawyer;

    @Column(name = "activo", nullable = false)
    private Boolean active;

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getFolderPrefix() { return folderPrefix; }
    public Integer getVisualOrder() { return visualOrder; }
    public Boolean getRequiresProcessing() { return requiresProcessing; }
    public Boolean getRequiresLawyer() { return requiresLawyer; }
    public Boolean getActive() { return active; }
}
