package com.tallerzapata.backend.infrastructure.persistence.recovery;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity @Table(name="recupero_obligaciones_cliente")
public class FranchiseRecoveryClientObligationEntity {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="caso_id") private Long caseId; @Column(name="tipo_codigo") private String typeCode; @Column(name="direccion_codigo") private String directionCode;
 @Column(name="importe_original") private BigDecimal originalAmount; @Column(name="saldo_vigente") private BigDecimal outstandingAmount; @Column(name="estado_codigo") private String statusCode;
 @Column(name="creado_at") private LocalDateTime createdAt; @Column(name="actualizado_at") private LocalDateTime updatedAt; @Column(name="inactivado_at") private LocalDateTime inactivatedAt; @Column(name="motivo_inactivacion") private String inactivationReason;
 public Long getId(){return id;} public Long getCaseId(){return caseId;} public void setCaseId(Long v){caseId=v;} public String getTypeCode(){return typeCode;} public void setTypeCode(String v){typeCode=v;} public String getDirectionCode(){return directionCode;} public void setDirectionCode(String v){directionCode=v;} public BigDecimal getOriginalAmount(){return originalAmount;} public void setOriginalAmount(BigDecimal v){originalAmount=v;} public BigDecimal getOutstandingAmount(){return outstandingAmount;} public void setOutstandingAmount(BigDecimal v){outstandingAmount=v;} public String getStatusCode(){return statusCode;} public void setStatusCode(String v){statusCode=v;} public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;} public LocalDateTime getUpdatedAt(){return updatedAt;} public void setUpdatedAt(LocalDateTime v){updatedAt=v;} public LocalDateTime getInactivatedAt(){return inactivatedAt;} public void setInactivatedAt(LocalDateTime v){inactivatedAt=v;} public String getInactivationReason(){return inactivationReason;} public void setInactivationReason(String v){inactivationReason=v;}
}
