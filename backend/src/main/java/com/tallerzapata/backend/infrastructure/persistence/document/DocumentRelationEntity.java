package com.tallerzapata.backend.infrastructure.persistence.document;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "documento_relaciones")
public class DocumentRelationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "documento_id", nullable = false)
    private Long documentId;

    @Column(name = "caso_id", nullable = false)
    private Long caseId;

    @Column(name = "entidad_tipo", nullable = false)
    private String entityType;

    @Column(name = "entidad_id", nullable = false)
    private Long entityId;

    @Column(name = "modulo_codigo", nullable = false)
    private String moduleCode;

    @Column(name = "principal", nullable = false)
    private Boolean principal;

    @Column(name = "visible_cliente", nullable = false)
    private Boolean visibleToCustomer;

    @Column(name = "orden_visual", nullable = false)
    private Integer visualOrder;

    public Long getId() { return id; }
    public Long getDocumentId() { return documentId; }
    public void setDocumentId(Long documentId) { this.documentId = documentId; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public String getModuleCode() { return moduleCode; }
    public void setModuleCode(String moduleCode) { this.moduleCode = moduleCode; }
    public Boolean getPrincipal() { return principal; }
    public void setPrincipal(Boolean principal) { this.principal = principal; }
    public Boolean getVisibleToCustomer() { return visibleToCustomer; }
    public void setVisibleToCustomer(Boolean visibleToCustomer) { this.visibleToCustomer = visibleToCustomer; }
    public Integer getVisualOrder() { return visualOrder; }
    public void setVisualOrder(Integer visualOrder) { this.visualOrder = visualOrder; }
}
