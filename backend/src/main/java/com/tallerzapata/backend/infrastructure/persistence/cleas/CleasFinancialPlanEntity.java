package com.tallerzapata.backend.infrastructure.persistence.cleas;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "cleas_financial_plans")
public class CleasFinancialPlanEntity {
    @Id
    @Column(name = "caso_id")
    private Long caseId;

    @Column(name = "compania_facturable_id")
    private Long billableCompanyId;

    @Column(name = "firma_conforme", nullable = false)
    private Boolean signedConformity = false;

    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public Long getBillableCompanyId() { return billableCompanyId; }
    public void setBillableCompanyId(Long billableCompanyId) { this.billableCompanyId = billableCompanyId; }
    public Boolean getSignedConformity() { return signedConformity; }
    public void setSignedConformity(Boolean signedConformity) { this.signedConformity = signedConformity; }
}
