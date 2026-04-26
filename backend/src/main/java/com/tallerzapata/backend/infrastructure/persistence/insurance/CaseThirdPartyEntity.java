package com.tallerzapata.backend.infrastructure.persistence.insurance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "caso_terceros")
public class CaseThirdPartyEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_id", nullable = false) private Long caseId;
    @Column(name = "compania_tercero_id") private Long thirdPartyCompanyId;
    @Column(name = "referencia_reclamo") private String claimReference;
    @Column(name = "documentacion_estado_codigo") private String documentationStatusCode;
    @Column(name = "documentacion_aceptada", nullable = false) private Boolean documentationAccepted;
    @Column(name = "modo_provision_repuestos_codigo") private String partsProvisionModeCode;
    @Column(name = "monto_minimo_labor") private BigDecimal minimumLaborAmount;
    @Column(name = "monto_minimo_repuestos") private BigDecimal minimumPartsAmount;
    @Column(name = "subtotal_mejor_cotizacion") private BigDecimal bestQuotationSubtotal;
    @Column(name = "total_final_repuestos") private BigDecimal finalPartsTotal;
    @Column(name = "monto_facturar_compania") private BigDecimal amountToBillCompany;
    @Column(name = "monto_final_favor_taller") private BigDecimal finalAmountForWorkshop;

    public Long getId(){return id;} public Long getCaseId(){return caseId;} public void setCaseId(Long caseId){this.caseId=caseId;} public Long getThirdPartyCompanyId(){return thirdPartyCompanyId;} public void setThirdPartyCompanyId(Long thirdPartyCompanyId){this.thirdPartyCompanyId=thirdPartyCompanyId;} public String getClaimReference(){return claimReference;} public void setClaimReference(String claimReference){this.claimReference=claimReference;} public String getDocumentationStatusCode(){return documentationStatusCode;} public void setDocumentationStatusCode(String documentationStatusCode){this.documentationStatusCode=documentationStatusCode;} public Boolean getDocumentationAccepted(){return documentationAccepted;} public void setDocumentationAccepted(Boolean documentationAccepted){this.documentationAccepted=documentationAccepted;} public String getPartsProvisionModeCode(){return partsProvisionModeCode;} public void setPartsProvisionModeCode(String partsProvisionModeCode){this.partsProvisionModeCode=partsProvisionModeCode;} public BigDecimal getMinimumLaborAmount(){return minimumLaborAmount;} public void setMinimumLaborAmount(BigDecimal minimumLaborAmount){this.minimumLaborAmount=minimumLaborAmount;} public BigDecimal getMinimumPartsAmount(){return minimumPartsAmount;} public void setMinimumPartsAmount(BigDecimal minimumPartsAmount){this.minimumPartsAmount=minimumPartsAmount;} public BigDecimal getBestQuotationSubtotal(){return bestQuotationSubtotal;} public void setBestQuotationSubtotal(BigDecimal bestQuotationSubtotal){this.bestQuotationSubtotal=bestQuotationSubtotal;} public BigDecimal getFinalPartsTotal(){return finalPartsTotal;} public void setFinalPartsTotal(BigDecimal finalPartsTotal){this.finalPartsTotal=finalPartsTotal;} public BigDecimal getAmountToBillCompany(){return amountToBillCompany;} public void setAmountToBillCompany(BigDecimal amountToBillCompany){this.amountToBillCompany=amountToBillCompany;} public BigDecimal getFinalAmountForWorkshop(){return finalAmountForWorkshop;} public void setFinalAmountForWorkshop(BigDecimal finalAmountForWorkshop){this.finalAmountForWorkshop=finalAmountForWorkshop;}
}
