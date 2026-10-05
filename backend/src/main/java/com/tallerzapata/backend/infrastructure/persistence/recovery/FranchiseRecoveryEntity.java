package com.tallerzapata.backend.infrastructure.persistence.recovery;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "recuperos_franquicia")
public class FranchiseRecoveryEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_id", nullable = false) private Long caseId;
    @Column(name = "gestiona_codigo") private String managerCode;
    @Column(name = "caso_base_id") private Long baseCaseId;
    @Column(name = "carpeta_base_codigo") private String baseFolderCode;
    @Column(name = "nombre_carpeta_base") private String baseFolderName;
    @Column(name = "fotografia_carpeta_base") private String baseFolderSnapshot;
    @Column(name = "fecha_presentacion") private LocalDate presentedAt;
    @Column(name = "fecha_derivado_inspeccion") private LocalDate inspectionForwardedAt;
    @Column(name = "fecha_inspeccion") private LocalDate inspectionDate;
    @Column(name = "modalidad_codigo") private String modalityCode;
    @Column(name = "cotizacion_estado_codigo") private String quotationStatusCode;
    @Column(name = "fecha_cotizacion") private LocalDate quotationDate;
    @Column(name = "lleva_repuestos", nullable = false) private Boolean includesParts;
    @Column(name = "repara_vehiculo", nullable = false) private Boolean repairsVehicle;
    @Column(name = "provision_repuestos_codigo") private String partsProvisionModeCode;
    @Column(name = "dictamen_codigo") private String opinionCode;
    @Column(name = "monto_acordado") private BigDecimal agreedAmount;
    @Column(name = "monto_recuperar") private BigDecimal recoveryAmount;
    @Column(name = "habilita_reparacion", nullable = false) private Boolean enablesRepair;
    @Column(name = "recupera_cliente", nullable = false) private Boolean recoversClient;
    @Column(name = "monto_cliente") private BigDecimal clientAmount;
    @Column(name = "estado_cobro_cliente_codigo") private String clientPaymentStatusCode;
    @Column(name = "fecha_cobro_cliente") private LocalDate clientPaymentDate;
    @Column(name = "aprobado_menor_acuerdo", nullable = false) private Boolean approvedLowerAgreement;
    @Column(name = "nota_aprobacion") private String approvalNote;
    @Column(name = "aprobado_por_usuario_id") private Long approvedByUserId;
    @Column(name = "aprobado_at") private LocalDateTime approvedAt;
    @Column(name = "reutiliza_datos_base", nullable = false) private Boolean reusesBaseData;
    public Long getId(){return id;} public Long getCaseId(){return caseId;} public void setCaseId(Long value){caseId=value;}
    public String getManagerCode(){return managerCode;} public void setManagerCode(String value){managerCode=value;}
    public Long getBaseCaseId(){return baseCaseId;} public void setBaseCaseId(Long value){baseCaseId=value;}
    public String getBaseFolderCode(){return baseFolderCode;} public void setBaseFolderCode(String value){baseFolderCode=value;}
    public String getBaseFolderName(){return baseFolderName;} public void setBaseFolderName(String value){baseFolderName=value;}
    public String getBaseFolderSnapshot(){return baseFolderSnapshot;} public void setBaseFolderSnapshot(String value){baseFolderSnapshot=value;}
    public LocalDate getPresentedAt(){return presentedAt;} public void setPresentedAt(LocalDate value){presentedAt=value;}
    public LocalDate getInspectionForwardedAt(){return inspectionForwardedAt;} public void setInspectionForwardedAt(LocalDate value){inspectionForwardedAt=value;}
    public LocalDate getInspectionDate(){return inspectionDate;} public void setInspectionDate(LocalDate value){inspectionDate=value;}
    public String getModalityCode(){return modalityCode;} public void setModalityCode(String value){modalityCode=value;}
    public String getQuotationStatusCode(){return quotationStatusCode;} public void setQuotationStatusCode(String value){quotationStatusCode=value;}
    public LocalDate getQuotationDate(){return quotationDate;} public void setQuotationDate(LocalDate value){quotationDate=value;}
    public Boolean getIncludesParts(){return includesParts;} public void setIncludesParts(Boolean value){includesParts=value;}
    public Boolean getRepairsVehicle(){return repairsVehicle;} public void setRepairsVehicle(Boolean value){repairsVehicle=value;}
    public String getPartsProvisionModeCode(){return partsProvisionModeCode;} public void setPartsProvisionModeCode(String value){partsProvisionModeCode=value;}
    public String getOpinionCode(){return opinionCode;} public void setOpinionCode(String value){opinionCode=value;}
    public BigDecimal getAgreedAmount(){return agreedAmount;} public void setAgreedAmount(BigDecimal value){agreedAmount=value;}
    public BigDecimal getRecoveryAmount(){return recoveryAmount;} public void setRecoveryAmount(BigDecimal value){recoveryAmount=value;}
    public Boolean getEnablesRepair(){return enablesRepair;} public void setEnablesRepair(Boolean value){enablesRepair=value;}
    public Boolean getRecoversClient(){return recoversClient;} public void setRecoversClient(Boolean value){recoversClient=value;}
    public BigDecimal getClientAmount(){return clientAmount;} public void setClientAmount(BigDecimal value){clientAmount=value;}
    public String getClientPaymentStatusCode(){return clientPaymentStatusCode;} public void setClientPaymentStatusCode(String value){clientPaymentStatusCode=value;}
    public LocalDate getClientPaymentDate(){return clientPaymentDate;} public void setClientPaymentDate(LocalDate value){clientPaymentDate=value;}
    public Boolean getApprovedLowerAgreement(){return approvedLowerAgreement;} public void setApprovedLowerAgreement(Boolean value){approvedLowerAgreement=value;}
    public String getApprovalNote(){return approvalNote;} public void setApprovalNote(String value){approvalNote=value;}
    public Long getApprovedByUserId(){return approvedByUserId;} public void setApprovedByUserId(Long value){approvedByUserId=value;}
    public LocalDateTime getApprovedAt(){return approvedAt;} public void setApprovedAt(LocalDateTime value){approvedAt=value;}
    public Boolean getReusesBaseData(){return reusesBaseData;} public void setReusesBaseData(Boolean value){reusesBaseData=value;}
}
