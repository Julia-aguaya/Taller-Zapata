package com.tallerzapata.backend.infrastructure.persistence.insurance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "caso_seguro")
public class CaseInsuranceEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_id", nullable = false) private Long caseId;
    @Column(name = "compania_seguro_id", nullable = false) private Long insuranceCompanyId;
    @Column(name = "numero_poliza") private String policyNumber;
    @Column(name = "numero_certificado") private String certificateNumber;
    @Column(name = "detalle_cobertura") private String coverageDetail;
    @Column(name = "compania_tercero_id") private Long thirdPartyCompanyId;
    @Column(name = "numero_cleas") private String cleasNumber;
    @Column(name = "tramitador_caso_persona_id") private Long processorCasePersonId;
    @Column(name = "inspector_caso_persona_id") private Long inspectorCasePersonId;
    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public Long getInsuranceCompanyId() { return insuranceCompanyId; }
    public void setInsuranceCompanyId(Long insuranceCompanyId) { this.insuranceCompanyId = insuranceCompanyId; }
    public String getPolicyNumber() { return policyNumber; }
    public void setPolicyNumber(String policyNumber) { this.policyNumber = policyNumber; }
    public String getCertificateNumber() { return certificateNumber; }
    public void setCertificateNumber(String certificateNumber) { this.certificateNumber = certificateNumber; }
    public String getCoverageDetail() { return coverageDetail; }
    public void setCoverageDetail(String coverageDetail) { this.coverageDetail = coverageDetail; }
    public Long getThirdPartyCompanyId() { return thirdPartyCompanyId; }
    public void setThirdPartyCompanyId(Long thirdPartyCompanyId) { this.thirdPartyCompanyId = thirdPartyCompanyId; }
    public String getCleasNumber() { return cleasNumber; }
    public void setCleasNumber(String cleasNumber) { this.cleasNumber = cleasNumber; }
    public Long getProcessorCasePersonId() { return processorCasePersonId; }
    public void setProcessorCasePersonId(Long processorCasePersonId) { this.processorCasePersonId = processorCasePersonId; }
    public Long getInspectorCasePersonId() { return inspectorCasePersonId; }
    public void setInspectorCasePersonId(Long inspectorCasePersonId) { this.inspectorCasePersonId = inspectorCasePersonId; }
}
