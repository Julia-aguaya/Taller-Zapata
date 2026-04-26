package com.tallerzapata.backend.infrastructure.persistence.insurance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "caso_legal")
public class CaseLegalEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_id", nullable = false) private Long caseId;
    @Column(name = "tramita_codigo") private String processorCode;
    @Column(name = "reclama_codigo") private String claimantCode;
    @Column(name = "instancia_codigo") private String instanceCode;
    @Column(name = "fecha_ingreso") private LocalDate entryDate;
    @Column(name = "cuij") private String cuij;
    @Column(name = "juzgado") private String court;
    @Column(name = "autos") private String caseNumber;
    @Column(name = "abogado_contraparte") private String counterpartLawyer;
    @Column(name = "telefono_contraparte") private String counterpartPhone;
    @Column(name = "email_contraparte") private String counterpartEmail;
    @Column(name = "repara_vehiculo", nullable = false) private Boolean repairsVehicle;
    @Column(name = "cierre_por_codigo") private String closedByCode;
    @Column(name = "fecha_cierre_legal") private LocalDate legalCloseDate;
    @Column(name = "importe_total_expediente") private BigDecimal totalProceedsAmount;
    @Column(name = "observaciones") private String observations;
    @Column(name = "notas_cierre") private String closingNotes;
    public Long getId(){return id;} public Long getCaseId(){return caseId;} public void setCaseId(Long caseId){this.caseId=caseId;} public String getProcessorCode(){return processorCode;} public void setProcessorCode(String processorCode){this.processorCode=processorCode;} public String getClaimantCode(){return claimantCode;} public void setClaimantCode(String claimantCode){this.claimantCode=claimantCode;} public String getInstanceCode(){return instanceCode;} public void setInstanceCode(String instanceCode){this.instanceCode=instanceCode;} public LocalDate getEntryDate(){return entryDate;} public void setEntryDate(LocalDate entryDate){this.entryDate=entryDate;} public String getCuij(){return cuij;} public void setCuij(String cuij){this.cuij=cuij;} public String getCourt(){return court;} public void setCourt(String court){this.court=court;} public String getCaseNumber(){return caseNumber;} public void setCaseNumber(String caseNumber){this.caseNumber=caseNumber;} public String getCounterpartLawyer(){return counterpartLawyer;} public void setCounterpartLawyer(String counterpartLawyer){this.counterpartLawyer=counterpartLawyer;} public String getCounterpartPhone(){return counterpartPhone;} public void setCounterpartPhone(String counterpartPhone){this.counterpartPhone=counterpartPhone;} public String getCounterpartEmail(){return counterpartEmail;} public void setCounterpartEmail(String counterpartEmail){this.counterpartEmail=counterpartEmail;} public Boolean getRepairsVehicle(){return repairsVehicle;} public void setRepairsVehicle(Boolean repairsVehicle){this.repairsVehicle=repairsVehicle;} public String getClosedByCode(){return closedByCode;} public void setClosedByCode(String closedByCode){this.closedByCode=closedByCode;} public LocalDate getLegalCloseDate(){return legalCloseDate;} public void setLegalCloseDate(LocalDate legalCloseDate){this.legalCloseDate=legalCloseDate;} public BigDecimal getTotalProceedsAmount(){return totalProceedsAmount;} public void setTotalProceedsAmount(BigDecimal totalProceedsAmount){this.totalProceedsAmount=totalProceedsAmount;} public String getObservations(){return observations;} public void setObservations(String observations){this.observations=observations;} public String getClosingNotes(){return closingNotes;} public void setClosingNotes(String closingNotes){this.closingNotes=closingNotes;}
}
