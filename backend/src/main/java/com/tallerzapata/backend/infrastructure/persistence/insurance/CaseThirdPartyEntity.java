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
    @Column(name = "tramitador_caso_persona_id") private Long processorCasePersonId;
    @Column(name = "tramitador_nombre_snapshot") private String processorNameSnapshot;
    @Column(name = "tramitador_email_snapshot") private String processorEmailSnapshot;
    @Column(name = "tramitador_telefono_snapshot") private String processorPhoneSnapshot;
    @Column(name = "inspector_caso_persona_id") private Long inspectorCasePersonId;
    @Column(name = "inspector_nombre_snapshot") private String inspectorNameSnapshot;
    @Column(name = "inspector_email_snapshot") private String inspectorEmailSnapshot;
    @Column(name = "inspector_telefono_snapshot") private String inspectorPhoneSnapshot;
    @Column(name = "vehiculo_tercero_id") private Long thirdPartyVehicleId;
    @Column(name = "conductor_caso_persona_id") private Long driverCasePersonId;

    public Long getProcessorCasePersonId() { return processorCasePersonId; }
    public void setProcessorCasePersonId(Long processorCasePersonId) { this.processorCasePersonId = processorCasePersonId; }
    public String getProcessorNameSnapshot() { return processorNameSnapshot; }
    public void setProcessorNameSnapshot(String processorNameSnapshot) { this.processorNameSnapshot = processorNameSnapshot; }
    public String getProcessorEmailSnapshot() { return processorEmailSnapshot; }
    public void setProcessorEmailSnapshot(String processorEmailSnapshot) { this.processorEmailSnapshot = processorEmailSnapshot; }
    public String getProcessorPhoneSnapshot() { return processorPhoneSnapshot; }
    public void setProcessorPhoneSnapshot(String processorPhoneSnapshot) { this.processorPhoneSnapshot = processorPhoneSnapshot; }
    public Long getInspectorCasePersonId() { return inspectorCasePersonId; }
    public void setInspectorCasePersonId(Long inspectorCasePersonId) { this.inspectorCasePersonId = inspectorCasePersonId; }
    public String getInspectorNameSnapshot() { return inspectorNameSnapshot; }
    public void setInspectorNameSnapshot(String inspectorNameSnapshot) { this.inspectorNameSnapshot = inspectorNameSnapshot; }
    public String getInspectorEmailSnapshot() { return inspectorEmailSnapshot; }
    public void setInspectorEmailSnapshot(String inspectorEmailSnapshot) { this.inspectorEmailSnapshot = inspectorEmailSnapshot; }
    public String getInspectorPhoneSnapshot() { return inspectorPhoneSnapshot; }
    public void setInspectorPhoneSnapshot(String inspectorPhoneSnapshot) { this.inspectorPhoneSnapshot = inspectorPhoneSnapshot; }
    public Long getThirdPartyVehicleId() { return thirdPartyVehicleId; }
    public void setThirdPartyVehicleId(Long thirdPartyVehicleId) { this.thirdPartyVehicleId = thirdPartyVehicleId; }
    public Long getDriverCasePersonId() { return driverCasePersonId; }
    public void setDriverCasePersonId(Long driverCasePersonId) { this.driverCasePersonId = driverCasePersonId; }

    public Long getId(){return id;} public Long getCaseId(){return caseId;} public void setCaseId(Long caseId){this.caseId=caseId;} public Long getThirdPartyCompanyId(){return thirdPartyCompanyId;} public void setThirdPartyCompanyId(Long thirdPartyCompanyId){this.thirdPartyCompanyId=thirdPartyCompanyId;} public String getClaimReference(){return claimReference;} public void setClaimReference(String claimReference){this.claimReference=claimReference;} public String getDocumentationStatusCode(){return documentationStatusCode;} public void setDocumentationStatusCode(String documentationStatusCode){this.documentationStatusCode=documentationStatusCode;} public Boolean getDocumentationAccepted(){return documentationAccepted;} public void setDocumentationAccepted(Boolean documentationAccepted){this.documentationAccepted=documentationAccepted;} public String getPartsProvisionModeCode(){return partsProvisionModeCode;} public void setPartsProvisionModeCode(String partsProvisionModeCode){this.partsProvisionModeCode=partsProvisionModeCode;} public BigDecimal getMinimumLaborAmount(){return minimumLaborAmount;} public void setMinimumLaborAmount(BigDecimal minimumLaborAmount){this.minimumLaborAmount=minimumLaborAmount;} public BigDecimal getMinimumPartsAmount(){return minimumPartsAmount;} public void setMinimumPartsAmount(BigDecimal minimumPartsAmount){this.minimumPartsAmount=minimumPartsAmount;} public BigDecimal getBestQuotationSubtotal(){return bestQuotationSubtotal;} public void setBestQuotationSubtotal(BigDecimal bestQuotationSubtotal){this.bestQuotationSubtotal=bestQuotationSubtotal;} public BigDecimal getFinalPartsTotal(){return finalPartsTotal;} public void setFinalPartsTotal(BigDecimal finalPartsTotal){this.finalPartsTotal=finalPartsTotal;} public BigDecimal getAmountToBillCompany(){return amountToBillCompany;} public void setAmountToBillCompany(BigDecimal amountToBillCompany){this.amountToBillCompany=amountToBillCompany;} public BigDecimal getFinalAmountForWorkshop(){return finalAmountForWorkshop;} public void setFinalAmountForWorkshop(BigDecimal finalAmountForWorkshop){this.finalAmountForWorkshop=finalAmountForWorkshop;}
}
