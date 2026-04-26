package com.tallerzapata.backend.infrastructure.persistence.recovery;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "recuperos_franquicia")
public class FranchiseRecoveryEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_id", nullable = false) private Long caseId;
    @Column(name = "gestiona_codigo") private String managerCode;
    @Column(name = "caso_base_id") private Long baseCaseId;
    @Column(name = "carpeta_base_codigo") private String baseFolderCode;
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
    @Column(name = "reutiliza_datos_base", nullable = false) private Boolean reusesBaseData;
    public Long getId(){return id;} public Long getCaseId(){return caseId;} public void setCaseId(Long caseId){this.caseId=caseId;} public String getManagerCode(){return managerCode;} public void setManagerCode(String managerCode){this.managerCode=managerCode;} public Long getBaseCaseId(){return baseCaseId;} public void setBaseCaseId(Long baseCaseId){this.baseCaseId=baseCaseId;} public String getBaseFolderCode(){return baseFolderCode;} public void setBaseFolderCode(String baseFolderCode){this.baseFolderCode=baseFolderCode;} public String getOpinionCode(){return opinionCode;} public void setOpinionCode(String opinionCode){this.opinionCode=opinionCode;} public BigDecimal getAgreedAmount(){return agreedAmount;} public void setAgreedAmount(BigDecimal agreedAmount){this.agreedAmount=agreedAmount;} public BigDecimal getRecoveryAmount(){return recoveryAmount;} public void setRecoveryAmount(BigDecimal recoveryAmount){this.recoveryAmount=recoveryAmount;} public Boolean getEnablesRepair(){return enablesRepair;} public void setEnablesRepair(Boolean enablesRepair){this.enablesRepair=enablesRepair;} public Boolean getRecoversClient(){return recoversClient;} public void setRecoversClient(Boolean recoversClient){this.recoversClient=recoversClient;} public BigDecimal getClientAmount(){return clientAmount;} public void setClientAmount(BigDecimal clientAmount){this.clientAmount=clientAmount;} public String getClientPaymentStatusCode(){return clientPaymentStatusCode;} public void setClientPaymentStatusCode(String clientPaymentStatusCode){this.clientPaymentStatusCode=clientPaymentStatusCode;} public LocalDate getClientPaymentDate(){return clientPaymentDate;} public void setClientPaymentDate(LocalDate clientPaymentDate){this.clientPaymentDate=clientPaymentDate;} public Boolean getApprovedLowerAgreement(){return approvedLowerAgreement;} public void setApprovedLowerAgreement(Boolean approvedLowerAgreement){this.approvedLowerAgreement=approvedLowerAgreement;} public String getApprovalNote(){return approvalNote;} public void setApprovalNote(String approvalNote){this.approvalNote=approvalNote;} public Boolean getReusesBaseData(){return reusesBaseData;} public void setReusesBaseData(Boolean reusesBaseData){this.reusesBaseData=reusesBaseData;}
}
