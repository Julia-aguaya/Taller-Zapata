package com.tallerzapata.backend.infrastructure.persistence.casefile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "caso_relaciones")
public class CaseRelationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "caso_origen_id", nullable = false)
    private Long sourceCaseId;

    @Column(name = "caso_destino_id", nullable = false)
    private Long targetCaseId;

    @Column(name = "tipo_relacion_codigo", nullable = false)
    private String relationTypeCode;

    @Column(name = "descripcion")
    private String description;

    public Long getId() { return id; }
    public Long getSourceCaseId() { return sourceCaseId; }
    public void setSourceCaseId(Long sourceCaseId) { this.sourceCaseId = sourceCaseId; }
    public Long getTargetCaseId() { return targetCaseId; }
    public void setTargetCaseId(Long targetCaseId) { this.targetCaseId = targetCaseId; }
    public String getRelationTypeCode() { return relationTypeCode; }
    public void setRelationTypeCode(String relationTypeCode) { this.relationTypeCode = relationTypeCode; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
