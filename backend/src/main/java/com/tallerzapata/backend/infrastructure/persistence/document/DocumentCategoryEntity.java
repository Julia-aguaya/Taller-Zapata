package com.tallerzapata.backend.infrastructure.persistence.document;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "categorias_documentales")
public class DocumentCategoryEntity {

    @Id
    private Long id;

    @Column(name = "codigo", nullable = false)
    private String code;

    @Column(name = "nombre", nullable = false)
    private String name;

    @Column(name = "modulo_codigo", nullable = false)
    private String moduleCode;

    @Column(name = "tipo_tramite_id")
    private Long caseTypeId;

    @Column(name = "requiere_fecha", nullable = false)
    private Boolean requiresDate;

    @Column(name = "visible_cliente", nullable = false)
    private Boolean visibleToCustomer;

    @Column(name = "activo", nullable = false)
    private Boolean active;

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getModuleCode() { return moduleCode; }
    public Long getCaseTypeId() { return caseTypeId; }
    public Boolean getRequiresDate() { return requiresDate; }
    public Boolean getVisibleToCustomer() { return visibleToCustomer; }
    public Boolean getActive() { return active; }
}
