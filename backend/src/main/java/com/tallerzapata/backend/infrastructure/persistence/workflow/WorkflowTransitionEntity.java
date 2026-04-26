package com.tallerzapata.backend.infrastructure.persistence.workflow;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "workflow_transiciones")
public class WorkflowTransitionEntity {

    @Id
    private Long id;

    @Column(name = "dominio", nullable = false)
    private String domain;

    @Column(name = "tipo_tramite_id")
    private Long caseTypeId;

    @Column(name = "estado_origen_id", nullable = false)
    private Long sourceStateId;

    @Column(name = "estado_destino_id", nullable = false)
    private Long targetStateId;

    @Column(name = "accion_codigo", nullable = false)
    private String actionCode;

    @Column(name = "requiere_permiso_codigo")
    private String requiredPermissionCode;

    @Column(name = "automatica", nullable = false)
    private Boolean automatic;

    @Column(name = "regla_json")
    private String ruleJson;

    @Column(name = "activo", nullable = false)
    private Boolean active;

    public Long getId() { return id; }
    public String getDomain() { return domain; }
    public Long getCaseTypeId() { return caseTypeId; }
    public Long getSourceStateId() { return sourceStateId; }
    public Long getTargetStateId() { return targetStateId; }
    public String getActionCode() { return actionCode; }
    public String getRequiredPermissionCode() { return requiredPermissionCode; }
    public Boolean getAutomatic() { return automatic; }
    public String getRuleJson() { return ruleJson; }
    public Boolean getActive() { return active; }
}
