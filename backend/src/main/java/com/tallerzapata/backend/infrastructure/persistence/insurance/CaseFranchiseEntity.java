package com.tallerzapata.backend.infrastructure.persistence.insurance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "caso_franquicia")
public class CaseFranchiseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_id", nullable = false) private Long caseId;
    @Column(name = "estado_franquicia_codigo") private String franchiseStatusCode;
    @Column(name = "monto_franquicia") private BigDecimal franchiseAmount;
    @Column(name = "tipo_recupero_codigo") private String recoveryTypeCode;
    @Column(name = "caso_asociado_id") private Long relatedCaseId;
    @Column(name = "dictamen_franquicia_codigo") private String franchiseOpinionCode;
    @Column(name = "supera_franquicia", nullable = false) private Boolean exceedsFranchise;
    @Column(name = "monto_recuperar") private BigDecimal recoveryAmount;
    @Column(name = "notas") private String notes;
    public Long getId(){return id;} public Long getCaseId(){return caseId;} public void setCaseId(Long caseId){this.caseId=caseId;} public String getFranchiseStatusCode(){return franchiseStatusCode;} public void setFranchiseStatusCode(String franchiseStatusCode){this.franchiseStatusCode=franchiseStatusCode;} public BigDecimal getFranchiseAmount(){return franchiseAmount;} public void setFranchiseAmount(BigDecimal franchiseAmount){this.franchiseAmount=franchiseAmount;} public String getRecoveryTypeCode(){return recoveryTypeCode;} public void setRecoveryTypeCode(String recoveryTypeCode){this.recoveryTypeCode=recoveryTypeCode;} public Long getRelatedCaseId(){return relatedCaseId;} public void setRelatedCaseId(Long relatedCaseId){this.relatedCaseId=relatedCaseId;} public String getFranchiseOpinionCode(){return franchiseOpinionCode;} public void setFranchiseOpinionCode(String franchiseOpinionCode){this.franchiseOpinionCode=franchiseOpinionCode;} public Boolean getExceedsFranchise(){return exceedsFranchise;} public void setExceedsFranchise(Boolean exceedsFranchise){this.exceedsFranchise=exceedsFranchise;} public BigDecimal getRecoveryAmount(){return recoveryAmount;} public void setRecoveryAmount(BigDecimal recoveryAmount){this.recoveryAmount=recoveryAmount;} public String getNotes(){return notes;} public void setNotes(String notes){this.notes=notes;} }
